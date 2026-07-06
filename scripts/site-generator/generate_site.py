"""
generate_site.py — Gera site a partir do briefing e faz deploy no GitHub Pages.

Fluxo:
1. Lê briefing do Supabase (project_id)
2. Escolhe template baseado no estilo
3. Personaliza placeholders (cores, textos, etc.)
4. Cria repo no GitHub via API
5. Faz push dos arquivos
6. Configura GitHub Pages
7. Atualiza o projeto no Supabase

Uso:
    python3 generate_site.py --project-id <uuid>
    python3 generate_site.py --project-id <uuid> --dry-run

Requer:
    - GITHUB_TOKEN no ambiente (GitHub Personal Access Token)
    - SUPABASE_URL e SUPABASE_ANON_KEY no ambiente ou config.json
    - httpx
"""
import argparse
import json
import os
import sys
import base64
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import httpx

# ─── Caminhos ────────────────────────────────────────────────
REPO_DIR = Path(__file__).resolve().parent
TEMPLATES_DIR = REPO_DIR / "templates"
REPO_ROOT = REPO_DIR.parent.parent  # ~/siterapido_repo/

# ─── Config ──────────────────────────────────────────────────
def get_config() -> dict:
    candidates = [
        REPO_DIR / "config.json",
        REPO_DIR.parent / "config.json",
        Path.home() / "agency_ops" / "config.json",
    ]
    for c in candidates:
        if c.exists():
            with open(c) as f:
                return json.load(f)
    return {}


def get_supabase_client(config: dict) -> tuple:
    url = os.getenv("SUPABASE_URL") or config.get("supabase_url", "")
    key = os.getenv("SUPABASE_ANON_KEY") or config.get("supabase_anon_key", "")
    if not url or not key:
        print("ERRO: SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórios")
        sys.exit(1)
    client = httpx.Client(
        base_url=f"{url.rstrip('/')}/rest/v1",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        },
        timeout=30.0,
    )
    return client, url


def get_github_token() -> str:
    token = os.getenv("GITHUB_TOKEN")
    if not token:
        print("ERRO: GITHUB_TOKEN não configurado")
        print("Exporte: export GITHUB_TOKEN=ghp_xxx")
        sys.exit(1)
    return token


# ─── Template Engine ─────────────────────────────────────────
TEMPLATE_MAP = {
    "moderno": "moderno.html",
    "classico": "classico.html",
    "minimalista": "moderno.html",
    "criativo": "moderno.html",
    "corporativo": "moderno.html",
}


def load_template(estilo: str) -> str:
    filename = TEMPLATE_MAP.get(estilo, "moderno.html")
    path = TEMPLATES_DIR / filename
    if not path.exists():
        print(f"Template não encontrado: {path}")
        sys.exit(1)
    with open(path) as f:
        return f.read()


def placeholders_from_briefing(briefing: dict) -> dict:
    """Mapeia campos do briefing para placeholders do template."""
    empresa = briefing.get("empresa_nome", "Minha Empresa")
    cor_primaria = briefing.get("cores_primaria", "#5a8f1f")
    return {
        "__EMPRESA__": empresa,
        "__COR_PRIMARIA__": cor_primaria,
        "__COR_SECUNDARIA__": briefing.get("cores_secundaria", "#9CD653"),
        "__HERO_TITULO__": f"{empresa} — Soluções que transformam",
        "__HERO_SUBTITULO__": briefing.get("empresa_descricao", "")[:120] or "Soluções profissionais para o seu negócio.",
        "__CTA_PRINCIPAL__": briefing.get("cta_principal", "Solicite orçamento"),
        "__CTA_SECUNDARIO__": briefing.get("cta_secundario", "Saiba mais"),
        "__SOBRE_TEXTO__": f"{briefing.get('empresa_descricao', '')}\n\n{briefing.get('empresa_diferencial', '')}"[:500] or "Profissional comprometido com a excelência.",
        "__NUMERO_1__": "100",
        "__NUMERO_1_LABEL__": "Clientes atendidos",
        "__NUMERO_2__": "50",
        "__NUMERO_2_LABEL__": "Projetos entregues",
        "__NUMERO_3__": "5",
        "__NUMERO_3_LABEL__": "Anos de mercado",
        "__SERVICOS_DESC__": "Soluções sob medida para o seu negócio.",
        "__SERVICO_1__": briefing.get("empresa_ramo", "Consultoria"),
        "__SERVICO_1_DESC__": "Profissionalismo e dedicação em cada projeto.",
        "__SERVICO_2__": "Atendimento Personalizado",
        "__SERVICO_2_DESC__": "Suporte direto e soluções feitas sob medida.",
        "__SERVICO_3__": "Resultados Garantidos",
        "__SERVICO_3_DESC__": "Foco em entregar valor real para seu negócio.",
        "__CTA_FINAL__": "Vamos trabalhar juntos?",
        "__CTA_FINAL_DESC__": f"Entre em contato e descubra como podemos ajudar {empresa} a crescer.",
        "__WHATSAPP__": "5584986536223",
    }


def render_template(template: str, placeholders: dict) -> str:
    result = template
    for key, value in placeholders.items():
        result = result.replace(key, str(value))
    return result


# ─── GitHub API ──────────────────────────────────────────────
GITHUB_API = "https://api.github.com"
GITHUB_ORG = "siterapido"  # ou usar user do token


def create_github_repo(token: str, repo_name: str, description: str) -> dict:
    """Cria um repo público no GitHub."""
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "site-rapido-generator",
    }
    # Tenta criar na org siterapido, fallback pro user
    for scope in [
        f"{GITHUB_API}/orgs/{GITHUB_ORG}/repos",
        f"{GITHUB_API}/user/repos",
    ]:
        resp = httpx.post(
            scope,
            headers=headers,
            json={
                "name": repo_name,
                "description": description,
                "private": False,
                "auto_init": True,
                "has_pages": True,
            },
        )
        if resp.status_code == 201:
            return resp.json()
        if resp.status_code == 404:
            continue  # org não encontrada, tenta user
        # Se já existe, retorna o existente
        if resp.status_code == 422:
            get_resp = httpx.get(f"{GITHUB_API}/repos/{scope.split('/')[-1]}/{repo_name}", headers=headers)
            if get_resp.status_code == 200:
                return get_resp.json()
    raise Exception(f"Falha ao criar repo: {resp.text}")


def push_files_to_repo(token: str, repo_full_name: str, html_content: str) -> str:
    """Faz push do HTML via API — cria/atualiza index.html."""
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "site-rapido-generator",
    }
    api_base = f"{GITHUB_API}/repos/{repo_full_name}"

    # Codifica o HTML
    content_b64 = base64.b64encode(html_content.encode()).decode()

    # Tenta pegar o SHA do arquivo existente (pra update)
    existing_sha = None
    get_resp = httpx.get(f"{api_base}/contents/index.html", headers=headers)
    if get_resp.status_code == 200:
        existing_sha = get_resp.json().get("sha")

    # Cria/atualiza o arquivo
    put_resp = httpx.put(
        f"{api_base}/contents/index.html",
        headers=headers,
        json={
            "message": "Site gerado pela Central Site Rápido",
            "content": content_b64,
            "sha": existing_sha,
            "branch": "main",
        },
    )
    if put_resp.status_code not in (200, 201):
        raise Exception(f"Falha ao fazer push: {put_resp.text}")

    # Ativa GitHub Pages
    pages_resp = httpx.post(
        f"{api_base}/pages",
        headers=headers,
        json={"source": {"branch": "main", "path": "/"}},
    )
    pages_url = None
    if pages_resp.status_code in (200, 201, 204):
        pages_data = pages_resp.json()
        pages_url = pages_data.get("html_url")

    return pages_url or f"https://{repo_full_name.lower()}.github.io"


# ─── Supabase ────────────────────────────────────────────────
def update_project(supabase: httpx.Client, project_id: str, data: dict):
    resp = supabase.patch(f"/projects?id=eq.{project_id}", json=data)
    if resp.status_code != 200:
        print(f"  ERRO ao atualizar projeto: {resp.text}")
    else:
        print("  ✅ Projeto atualizado no Supabase")


# ─── Main ────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Gera site a partir do briefing")
    parser.add_argument("--project-id", required=True, help="UUID do projeto no Supabase")
    parser.add_argument("--dry-run", action="store_true", help="Apenas mostra o que faria")
    args = parser.parse_args()

    config = get_config()
    supabase, supabase_url = get_supabase_client(config)

    # 1. Busca o projeto
    print(f"🔍 Buscando projeto {args.project_id}...")
    resp = supabase.get(f"/projects?id=eq.{args.project_id}")
    if resp.status_code != 200 or not resp.json():
        print(f"ERRO: Projeto não encontrado ({resp.status_code})")
        sys.exit(1)
    project = resp.json()[0]

    if not project.get("briefing_conteudo"):
        print("ERRO: Projeto não tem briefing. Preencha o briefing primeiro.")
        sys.exit(1)

    briefing = project["briefing_conteudo"]
    if isinstance(briefing, str):
        briefing = json.loads(briefing)

    print(f"  Cliente: {project['cliente_nome']}")
    print(f"  Estilo: {briefing.get('estilo', 'moderno')}")

    # 2. Gera o HTML
    print("\n🎨 Gerando HTML...")
    template = load_template(briefing.get("estilo", "moderno"))
    placeholders = placeholders_from_briefing(briefing)
    html = render_template(template, placeholders)

    output_dir = REPO_DIR / "output" / args.project_id
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "index.html").write_text(html)
    print(f"  HTML salvo em: {output_dir / 'index.html'}")

    # 3. Atualiza status
    if not args.dry_run:
        update_project(supabase, args.project_id, {
            "status": "gerando",
            "frames_gerados": 1,
        })

    if args.dry_run:
        print("\n📋 DRY-RUN — Nenhuma ação real foi executada.")
        print(f"  HTML seria publicado em: https://github.com/{GITHUB_ORG}/site-{args.project_id[:8]}")
        print("  Para publicar de verdade, rode sem --dry-run")
        return

    # 4. Cria repo e faz deploy
    print("\n📦 Criando repositório no GitHub...")
    token = get_github_token()
    repo_name = f"site-{args.project_id[:8]}"

    try:
        repo = create_github_repo(token, repo_name, f"Site {project['cliente_nome']} — Gerado pela Central Site Rápido")
        repo_full = repo["full_name"]
        print(f"  ✅ Repo criado: {repo_full}")

        print("\n🚀 Fazendo deploy...")
        pages_url = push_files_to_repo(token, repo_full, html)
        print(f"  ✅ Site publicado em: {pages_url}")

        # 5. Atualiza o projeto
        print("\n💾 Atualizando projeto no Supabase...")
        update_project(supabase, args.project_id, {
            "status": "gerado",
            "repo_github": repo_full,
            "deploy_url": pages_url,
            "gerado_em": datetime.now(timezone.utc).isoformat(),
        })

        print(f"\n✅ Site gerado e publicado com sucesso!")
        print(f"   Repo: https://github.com/{repo_full}")
        print(f"   URL:  {pages_url}")

    except Exception as e:
        print(f"\n❌ ERRO: {e}")
        update_project(supabase, args.project_id, {"status": "briefing_recebido"})
        sys.exit(1)


if __name__ == "__main__":
    main()
