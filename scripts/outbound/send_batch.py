"""
send_batch.py — WhatsApp first-contact batch sender for Site Rápido.

Sends humanized cold messages to eligible leads via wacli, with anti-ban
delays and full CRM logging. Uses the Supabase CRM backend.

Usage:
    # Dry-run (safe, shows what would happen):
    python3 scripts/send_batch.py

    # Dry-run with custom batch size:
    OUTBOUND_BATCH_SIZE=5 python3 scripts/send_batch.py

    # Real send (DANGER — actually sends WhatsApp messages):
    OUTBOUND_ENABLED=1 OUTBOUND_BATCH_SIZE=10 python3 scripts/send_batch.py

    # Full custom:
    OUTBOUND_ENABLED=1 OUTBOUND_BATCH_SIZE=10 OUTBOUND_DAILY_LIMIT=20 \
    OUTBOUND_MIN_DELAY_SECONDS=300 OUTBOUND_MAX_DELAY_SECONDS=900 \
    python3 scripts/send_batch.py

Environment variables override config.json values:
    OUTBOUND_ENABLED            "1" to enable real sends
    OUTBOUND_BATCH_SIZE         max leads per run
    OUTBOUND_DAILY_LIMIT        max total sends today
    OUTBOUND_MIN_DELAY_SECONDS  min delay between sends
    OUTBOUND_MAX_DELAY_SECONDS  max delay between sends
"""

import argparse
import json
import os
import random
import re
import subprocess
import sys
import time
import uuid
from datetime import datetime, timezone

# Ensure we can import crm.py
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from crm import (
    get_config,
    get_crm,
    get_eligible_leads,
    get_lead_by_id,
    update_lead_status,
    log_envio,
    log_event,
    count_envios_today,
    get_stats,
)


# ============================================================================
# Template System (f-string based, exactly as per message-templates-br.md)
# ============================================================================

# Brazilian company indicators for is_person_name()
COMPANY_INDICATORS = [
    "ltda", "mei", "eireli", "s/a", "assessoria", "consultoria", "comercio",
    "servicos", "industria", "imobiliaria", "construcao", "engenharia",
    "alimentos", "transporte", "distribuidora", "logistica", "contabilidade",
    "farmacia", "drogaria", "hotel", "restaurante", "supermercado", "loja",
    "oficina", "clinica", "hospital", "escola", "faculdade", "igreja",
    "auto", "mecanica", "barbearia", "salao", "estetica", "padaria",
    "academia", "laboratorio", "seguranca", "vigilancia", "limpeza",
    "grafica", "marmoraria", "serralheria", "marcenaria", "vidracaria",
    "eletrica", "hidraulica", "confeccao", "confecoes", "calcados",
    "boutique", "bazar", "mercado", "mercearia", "hortifruti",
    "incorporadora", "empreendimentos", "construtora", "administradora",
    "corretora", "agenciamento", "publicidade", "marketing", "digital",
    "informatica", "tecnologia", "softwares", "desenvolvimento",
    "representacao", "representante", "comercial", "atacado", "varejo",
    "agencia", "studio", "estudio", "escritorio", "espaco",
]


def _normalize_text(text: str) -> str:
    """Remove accents and lowercase for comparison."""
    import unicodedata
    text = unicodedata.normalize('NFKD', text.lower().strip())
    return ''.join(c for c in text if not unicodedata.combining(c))


def is_person_name(name: str) -> bool:
    """
    Detect if a name is a person (not a company).
    Uses word-boundary matching with accent normalization, NOT substring.
    """
    if not name:
        return True  # default to person
    name_normalized = _normalize_text(name)
    words_set = set(name_normalized.split())

    # Exact word match against company indicators (normalized)
    if any(ind in words_set for ind in COMPANY_INDICATORS):
        return False

    # More than 6 words is too long for a Brazilian full name
    if len(name_normalized.split()) > 6:
        return False

    return True


def get_message_variants(config: dict):
    """
    Returns (templates_person, templates_company) — two lists of 3 variants each.
    Templates are Python f-strings. Double-brace {{VAR}} survives as {VAR} literal
    for later replace by render_message().
    """
    nome = config.get("operator_name", "Marcos")
    oferta = config.get("offer", "Sites profissionais por assinatura")
    agencia = config.get("agency_name", "Site Rápido")

    # === PERSON TEMPLATES (3 variants) ===
    templates_person = [
        # V1 — Casual
        f"""Oi {{NOME}}, tudo bem? Sou {nome}, do {agencia}.

Vi seu contato em {{CIDADE}} e resolvi mandar uma mensagem — percebo que
muito profissional ainda depende de Instagram ou indicação pra conseguir
cliente, né? E um site bem feito ajuda demais nisso.

A gente cria sites por assinatura — R$120/mês, sem taxa escondida.
Quer ver como funciona?

Se não for o momento, só falar que não insisto.""",

        # V2 — Direto e simples
        f"""Olá {{NOME}}, tudo certo? Aqui é {nome}, do {agencia}.

Te achei em {{CIDADE}} e pensei se você já tem site profissional. Muita
gente que conheço ainda não tem e acaba perdendo cliente que procura online.

A gente faz site completo por R$120/mês, sem fidelidade. Se quiser,
te mostro como fica.

Se não fizer sentido agora, é tranquilo — me avisa.""",

        # V3 — Pessoal
        f"""Oi {{NOME}}, sou {nome}. Te mandei mensagem porque vi seu contato em {{CIDADE}}.

Tenho uma pergunta rápida: você já tem site? Se não, posso te mostrar
uma solução bem prática — site profissional por assinatura, sem taxa de entrada.

É uma parada que já ajudou bastante profissional por aí. Bora ver?

Se não rolar, só falar que não te perturbo mais.""",
    ]

    # === COMPANY TEMPLATES (3 variants) ===
    templates_company = [
        # V1 — Casual (company)
        f"""Olá, tudo bem? Sou {nome}, do {agencia}.

Vi a {{EMPRESA}} em {{CIDADE}} e resolvi mandar uma mensagem — percebo que
muito negócio ainda depende de Instagram ou indicação pra conseguir
cliente, né? E um site bem feito ajuda demais nisso.

A gente cria sites por assinatura — R$120/mês, sem taxa escondida.
Quer ver como funciona?

Se não for o momento, só falar que não insisto.""",

        # V2 — Direto (company)
        f"""Olá, tudo certo? Aqui é {nome}, do {agencia}.

Dei uma olhada na {{EMPRESA}} em {{CIDADE}} e fiquei pensando se vocês
já têm site profissional. Muito negócio ainda não tem e acaba perdendo
cliente que procura online.

A gente faz site completo por R$120/mês, sem fidelidade. Se quiser,
te mostro como fica.

Se não fizer sentido agora, é tranquilo — me avisa.""",

        # V3 — Pessoal (company)
        f"""Oi, sou {nome}. Te mandei mensagem porque vi a {{EMPRESA}} em {{CIDADE}}.

Tenho uma pergunta rápida: vocês já têm site? Se não, posso mostrar
uma solução bem prática — site profissional por assinatura, sem taxa de entrada.

É uma parada que já ajudou bastante negócio por aí. Bora ver?

Se não rolar, só falar que não perturbo mais.""",
    ]

    return templates_person, templates_company


def get_followup_variants(config: dict):
    """
    Returns (followups_person, followups_company) — 3 variants each.
    Segunda mensagem: natural, sem cara de robô, referência sutil à primeira.
    Tom: "te mandei uma msg esses dias, não sei se viu..."
    Foco: solução prática, zero enrolação, CTA de baixa pressão.
    """
    nome = config.get("operator_name", "Marcos")
    agencia = config.get("agency_name", "Site Rápido")

    # === PERSON FOLLOW-UPS ===
    followups_person = [
        # V1 — Reforço sutil
        f"""Oi {{NOME}}, {nome} de novo. Te mandei uma msg esses dias, não
sei se você chegou a ver.

Era sobre site profissional — a gente faz por assinatura, R$120/mês,
sem pegadinha. Fica pronto em até 3 dias.

Se quiser dar uma olhada em como fica, te mostro rapidinho.
Sem compromisso.""",

        # V2 — Gatilho de perda
        f"""{{NOME}}, {nome} aqui do {agencia}. Te falei outro dia sobre
site profissional, lembra?

Perguntei pq vejo muito profissional perdendo cliente por não ter um
site próprio pra mostrar o trabalho. Depender só de Instagram é foda.

Ainda tá valendo: R$120/mês, 3 dias pra ficar pronto. Quer ver?""",

        # V3 — Exemplo concreto
        f"""Oi {{NOME}}, sou {nome}. Falei com você esses dias sobre site —
não sei se era o momento certo, mas fica aqui de novo.

A gente entregou o site de um cliente essa semana em 48h. O cara falou
que já fechou 2 clientes no primeiro dia com o site no ar.

Dá pra fazer o mesmo pra você. Site completo, R$120/mês.
Se animar, te mostro na hora.""",
    ]

    # === COMPANY FOLLOW-UPS ===
    followups_company = [
        # V1 — Reforço sutil (empresa)
        f"""Olá, {nome} aqui do {agencia}. Mandei uma msg esses dias sobre
site pra {{EMPRESA}}, não sei se chegou a ver.

A gente faz site profissional por assinatura — R$120/mês, sem
fidelidade. Fica pronto em até 3 dias.

Se quiser dar uma olhada em como fica pro negócio de vocês, te mostro
rapidinho. Sem compromisso.""",

        # V2 — Gatilho de perda (empresa)
        f"""Oi, {nome} do {agencia}. Te falei outro dia sobre site pra
{{EMPRESA}}, lembra?

Perguntei pq vejo muito negócio perdendo cliente por não ter um site
próprio. Depender só de rede social é arriscado — o algoritmo muda e
seu alcance some do nada.

R$120/mês, 3 dias pra ficar pronto. Quer ver como funciona?""",

        # V3 — Exemplo concreto (empresa)
        f"""Olá, sou {nome}. Falei com vocês esses dias sobre site —
não sei se era o momento, mas fica aqui de novo.

Entregamos o site de um cliente essa semana em 48h. O cara falou que
já fechou 2 clientes no primeiro dia com o site no ar.

Dá pra fazer o mesmo pra {{EMPRESA}}. Site completo, R$120/mês.
Se animar, te mostro na hora.""",
    ]

    return followups_person, followups_company


def render_message(templates, lead: dict, config: dict) -> str:
    """Render a message for a lead using the correct template variant."""
    empresa = lead.get("empresa", "")
    cidade = (
        lead.get("cidade", "") or config.get("default_city", "")
    ).replace("/RN", "").replace("/RN", "").strip()

    is_person = is_person_name(empresa)
    templates_set = templates[0] if is_person else templates[1]

    variant_idx = lead.get("_variant_idx", 0) % 3
    template = templates_set[variant_idx]

    if is_person:
        primeiro_nome = empresa.split()[0] if empresa else "parceiro"
        msg = template.replace("{NOME}", primeiro_nome).replace("{CIDADE}", cidade)
    else:
        msg = template.replace("{EMPRESA}", empresa).replace("{CIDADE}", cidade)

    return msg


# ============================================================================
# Pre-flight checks
# ============================================================================

def check_wacli_auth(config: dict) -> tuple[bool, str]:
    """Check if wacli is authenticated and connected. Returns (ok, detail)."""
    cmd = config.get("wacli_command", "wacli")
    account = config.get("wacli_account", "site_rapido")

    # Auth status
    try:
        result = subprocess.run(
            [cmd, "--account", account, "auth", "status", "--json"],
            capture_output=True, text=True, timeout=15
        )
        auth_data = json.loads(result.stdout)
    except Exception as e:
        return False, f"auth status check failed: {e}"

    if not auth_data.get("success") or not auth_data.get("data", {}).get("authenticated"):
        return False, "not authenticated — run 'wacli auth' to reconnect"

    # Try to send a test to operator's own number (optional, best-effort)
    return True, "authenticated"


def check_wacli_doctor(config: dict) -> tuple[bool, str]:
    """Run wacli doctor for deeper diagnostics."""
    cmd = config.get("wacli_command", "wacli")
    account = config.get("wacli_account", "site_rapido")

    try:
        result = subprocess.run(
            [cmd, "--account", account, "doctor"],
            capture_output=True, text=True, timeout=15
        )
        output = result.stdout + result.stderr
    except Exception as e:
        return False, f"doctor failed: {e}"

    authenticated = "AUTHENTICATED     true" in output
    connected = "CONNECTED         true" in output

    if not authenticated:
        return False, "session not authenticated (doctor)"
    if not connected:
        return True, "authenticated but WebSocket disconnected (may reconnect on sync)"

    return True, "fully healthy"


def warmup_connection(config: dict) -> bool:
    """Run a short sync to warm up the WebSocket connection."""
    cmd = config.get("wacli_command", "wacli")
    account = config.get("wacli_account", "site_rapido")

    try:
        result = subprocess.run(
            [cmd, "--account", account, "sync", "--once", "--idle-exit", "20s", "--max-messages", "50000"],
            capture_output=True, text=True, timeout=60
        )
        return "Connected." in result.stdout
    except Exception:
        return False


# ============================================================================
# Sending
# ============================================================================

def send_whatsapp_message(config: dict, to_phone: str, message: str) -> tuple[bool, str, str]:
    """
    Send a WhatsApp message via wacli.
    Returns (success, msg_id, error_description).
    """
    cmd = config.get("wacli_command", "wacli")
    account = config.get("wacli_account", "site_rapido")

    # Ensure E.164-ish format: strip to digits, remove any prefix beyond 55
    clean_phone = re.sub(r"\D", "", to_phone)
    if not clean_phone.startswith("55"):
        clean_phone = "55" + clean_phone

    try:
        result = subprocess.run(
            [cmd, "--account", account, "send", "text",
             "--to", clean_phone,
             "--message", message,
             "--json"],
            capture_output=True, text=True, timeout=30
        )

        output = result.stdout.strip()
        stderr = result.stderr.strip()

        if not output and stderr:
            return False, "", f"wacli error: {stderr[:200]}"

        data = json.loads(output)
    except json.JSONDecodeError:
        return False, "", f"wacli output not valid JSON: {output[:200]}"
    except subprocess.TimeoutExpired:
        return False, "", "wacli send timed out (30s)"
    except Exception as e:
        return False, "", str(e)

    if data.get("success") and data.get("data", {}).get("sent"):
        msg_id = data["data"].get("id", "")
        return True, msg_id, ""

    error = data.get("error", "unknown error")
    return False, "", error


def short_sync(config: dict) -> None:
    """Run a short sync pass to capture any new replies."""
    cmd = config.get("wacli_command", "wacli")
    account = config.get("wacli_account", "site_rapido")

    subprocess.run(
        [cmd, "--account", account, "sync", "--once", "--idle-exit", "10s", "--max-messages", "50000"],
        capture_output=True, timeout=30
    )
    # Ignore failures — sync is best-effort


# ============================================================================
# Lock management
# ============================================================================

def acquire_lock(config: dict) -> bool:
    """Acquire a PID-based lock to prevent parallel sends."""
    lock_file = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        ".send_batch.lock"
    )

    if os.path.exists(lock_file):
        try:
            with open(lock_file, "r") as f:
                old_pid = int(f.read().strip())
            # Check if the old process is still alive
            os.kill(old_pid, 0)
            return False  # Process is alive, lock held
        except (OSError, ValueError):
            # Process is dead, stale lock — remove it
            os.remove(lock_file)

    with open(lock_file, "w") as f:
        f.write(str(os.getpid()))
    return True


def release_lock(config: dict) -> None:
    """Release the PID lock."""
    lock_file = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        ".send_batch.lock"
    )
    try:
        os.remove(lock_file)
    except OSError:
        pass


# ============================================================================
# Batch execution
# ============================================================================

def run_batch(config: dict, templates, enabled: bool = False):
    """Main batch execution. If enabled=False, dry-run only."""

    crm = get_crm()
    run_id = str(uuid.uuid4())[:8]
    print(f"Run ID: {run_id}")
    print(f"Mode: {'REAL SEND' if enabled else 'DRY-RUN (safe — no messages sent)'}")
    print()

    # -----------------------------------------------
    # Pre-flight: auth check
    # -----------------------------------------------
    print("--- Pre-flight: WhatsApp auth ---")
    auth_ok, auth_detail = check_wacli_auth(config)
    print(f"  Auth: {'✅' if auth_ok else '❌'} {auth_detail}")
    if not auth_ok:
        print("\n❌ ABORTING: WhatsApp not authenticated.")
        # Log the failure
        log_event("send_batch", "preflight_auth", "fail", f"wacli not authenticated: {auth_detail}", run_id)
        return {"status": "aborted", "reason": "auth_failed"}

    doctor_ok, doctor_detail = check_wacli_doctor(config)
    print(f"  Doctor: {'✅' if doctor_ok else '⚠️'} {doctor_detail}")

    # -----------------------------------------------
    # Warm up connection if needed
    # -----------------------------------------------
    if "disconnected" in doctor_detail.lower():
        print("  Warming up WebSocket...")
        warmed = warmup_connection(config)
        print(f"  Sync warmup: {'✅ Connected' if warmed else '⚠️ may need retry'}")

    # Optional: test send to operator (too intrusive for now, skip on dry-run)
    # For real sends, we could add: wacli send text --to OPERATOR_PHONE

    # -----------------------------------------------
    # Count today's sends + select leads
    # -----------------------------------------------
    print("\n--- Lead selection ---")
    daily_limit = int(os.getenv("OUTBOUND_DAILY_LIMIT", config.get("daily_limit", 20)))
    batch_size = int(os.getenv("OUTBOUND_BATCH_SIZE", config.get("batch_size", 10)))
    min_delay = int(os.getenv("OUTBOUND_MIN_DELAY_SECONDS", config.get("min_delay_seconds", 300)))
    max_delay = int(os.getenv("OUTBOUND_MAX_DELAY_SECONDS", config.get("max_delay_seconds", 900)))

    sent_today = count_envios_today()
    remaining = max(0, daily_limit - sent_today)
    cap = min(batch_size, remaining)

    print(f"  Daily limit: {daily_limit}")
    print(f"  Sent today: {sent_today}")
    print(f"  Remaining today: {remaining}")
    print(f"  Batch cap: {cap}")

    if remaining <= 0:
        print("⚠️ Daily limit reached. No more sends today.")
        return {"status": "aborted", "reason": "daily_limit_reached"}

    if cap <= 0:
        print("⚠️ No eligible slots for this run.")
        return {"status": "aborted", "reason": "no_slots"}

    # Select leads
    leads = get_eligible_leads(cap)
    print(f"  Leads selected: {len(leads)}")

    if not leads:
        print("⚠️ No eligible leads (status='novo') in CRM.")
        print("  Run sourcing first: apify call compass/crawler-google-places")
        return {"status": "aborted", "reason": "no_leads"}

    # Assign variant indices
    for i, lead in enumerate(leads):
        lead["_variant_idx"] = i % 3

    # -----------------------------------------------
    # Dry-run preview
    # -----------------------------------------------
    print("\n--- Dry-run preview ---")
    for i, lead in enumerate(leads):
        empresa = lead.get("empresa", "???")
        cidade = lead.get("cidade", config.get("default_city", "???"))
        tipo = "pessoa" if is_person_name(empresa) else "empresa"
        msg = render_message(templates, lead, config)
        print(f"\n  [{i+1}] {empresa} ({cidade}) — {tipo}, variant {lead['_variant_idx']}")
        print(f"  ────────────────────────────────────")
        for line in msg.split("\n"):
            print(f"  │ {line}")
        print(f"  ────────────────────────────────────")

    if not enabled:
        print(f"\n✅ DRY-RUN COMPLETE. {len(leads)} leads previewed. No messages sent.")
        print("   Set OUTBOUND_ENABLED=1 to send for real.")
        log_event("send_batch", "dry_run", "ok", f"previewed {len(leads)} leads", run_id)
        return {"status": "dry_run", "leads_previewed": len(leads)}

    # -----------------------------------------------
    # REAL SEND — confirm before proceeding
    # -----------------------------------------------
    print(f"\n{'='*60}")
    print(f"⚠️  REAL SEND MODE — {len(leads)} messages will be sent to real people.")
    print(f"   Delays: {min_delay}-{max_delay}s between sends.")
    print(f"   Estimated duration: {len(leads) * ((min_delay + max_delay) // 2) // 60}-{len(leads) * max_delay // 60} minutes")
    print(f"   Press Ctrl+C within 5 seconds to abort.")
    print(f"{'='*60}")

    try:
        for i in range(5, 0, -1):
            print(f"   Starting in {i}...", end="\r")
            time.sleep(1)
        print("\n   Starting batch now.                     ")
    except KeyboardInterrupt:
        print("\n\n❌ ABORTED by user.")
        release_lock(config)
        return {"status": "aborted", "reason": "user_cancelled"}

    # -----------------------------------------------
    # Send loop
    # -----------------------------------------------
    sent_count = 0
    error_count = 0
    results = []

    for i, lead in enumerate(leads):
        empresa = lead.get("empresa", "???")
        phone = lead.get("telefone", "")
        id_lead = lead.get("id_lead", "")

        print(f"\n{'─'*40}")
        print(f"[{i+1}/{len(leads)}] {empresa} ({phone})")

        if not phone:
            print("  ⚠️ No phone — skipping")
            update_lead_status(id_lead, "erro")
            error_count += 1
            results.append({"lead": empresa, "status": "skipped_no_phone", "error": "no phone"})
            continue

        # Render message
        msg = render_message(templates, lead, config)

        # Claim lead as "enviando"
        update_lead_status(id_lead, "enviando")

        # Send
        success, msg_id, err = send_whatsapp_message(config, phone, msg)

        if success and msg_id:
            print(f"  ✅ Sent — msg_id: {msg_id}")
            sent_count += 1

            # Update lead to contato_iniciado
            now = datetime.now(timezone.utc).isoformat()
            update_lead_status(
                id_lead, "contato_iniciado",
                ultimo_contato_em=now,
                mensagem_variante=f"V{lead['_variant_idx'] + 1}",
            )

            # Log envio
            log_envio({
                "data_hora": now,
                "id_lead": id_lead,
                "empresa": empresa,
                "telefone": phone,
                "mensagem": msg,
                "status": "success",
                "provider_msg_id": msg_id,
                "campanha": config.get("campaign_id", "agency_outbound_v1"),
                "mensagem_variante": f"V{lead['_variant_idx'] + 1}",
            })

            results.append({"lead": empresa, "status": "sent", "msg_id": msg_id})

        else:
            print(f"  ❌ Failed — {err}")
            error_count += 1

            # Check if this is an auth failure — if so, abort batch
            if "not authenticated" in err.lower():
                print("  🛑 Auth failure detected. Aborting batch.")
                update_lead_status(id_lead, "erro")
                log_event("send_batch", "send_fail", "auth_error",
                          f"{empresa}: not authenticated mid-batch", run_id)
                results.append({"lead": empresa, "status": "auth_error", "error": err})
                break

            # Error 463 = number not on WhatsApp
            if "463" in err or "privacy token" in err.lower():
                print(f"  ℹ️  Error 463 — number likely not on WhatsApp. Marking as erro.")
                update_lead_status(id_lead, "erro")

                log_envio({
                    "data_hora": datetime.now(timezone.utc).isoformat(),
                    "id_lead": id_lead,
                    "empresa": empresa,
                    "telefone": phone,
                    "mensagem": msg,
                    "status": "error_463",
                    "erro": err[:500],
                    "campanha": config.get("campaign_id", "agency_outbound_v1"),
                })
                results.append({"lead": empresa, "status": "error_463", "error": err[:200]})
            else:
                update_lead_status(id_lead, "erro")
                log_envio({
                    "data_hora": datetime.now(timezone.utc).isoformat(),
                    "id_lead": id_lead,
                    "empresa": empresa,
                    "telefone": phone,
                    "mensagem": msg,
                    "status": "error",
                    "erro": err[:500],
                    "campanha": config.get("campaign_id", "agency_outbound_v1"),
                })
                results.append({"lead": empresa, "status": "error", "error": err[:200]})

        # Short sync after each send to capture any immediate replies
        if success:
            print("  🔄 Short sync (capture replies)...")
            short_sync(config)

        # Delay between sends (except after the last one)
        if i < len(leads) - 1 and success:
            delay = random.randint(min_delay, max_delay)
            mins = delay // 60
            secs = delay % 60
            print(f"  ⏳ Waiting {mins}m {secs}s before next send...")

            try:
                time.sleep(delay)
            except KeyboardInterrupt:
                print("\n\n⏸️  PAUSED by user.")
                print(f"   Sent so far: {sent_count}/{len(leads)}")
                print("   Remaining leads are still marked 'enviando' — reset with:")
                print("   python3 -c \"from crm import reset_enviando_to_novo; print(f'Reset {reset_enviando_to_novo()} leads')\"")
                release_lock(config)
                log_event("send_batch", "user_paused", "ok",
                          f"Sent {sent_count}/{len(leads)} before user interrupt", run_id)
                return {
                    "status": "paused",
                    "sent": sent_count,
                    "errors": error_count,
                    "remaining": len(leads) - sent_count - error_count,
                    "results": results,
                }

    # -----------------------------------------------
    # Summary
    # -----------------------------------------------
    print(f"\n{'='*60}")
    print("Batch concluído.")
    print(f"  Selecionados:  {len(leads)}")
    print(f"  Enviados:      {sent_count}")
    print(f"  Falhas:        {error_count}")
    print(f"  Run ID:        {run_id}")
    print(f"{'='*60}")

    log_event("send_batch", "batch_complete", "ok",
              f"sent={sent_count}, errors={error_count}, total={len(leads)}", run_id)

    return {
        "status": "complete",
        "run_id": run_id,
        "selected": len(leads),
        "sent": sent_count,
        "errors": error_count,
        "results": results,
    }


# ============================================================================
# Main
# ============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Site Rápido — WhatsApp outbound batch sender"
    )
    parser.add_argument("--dry-run", action="store_true", default=False,
                        help="Force dry-run (overrides OUTBOUND_ENABLED)")
    parser.add_argument("--json", action="store_true", default=False,
                        help="Output JSON summary at end")
    args = parser.parse_args()

    config = get_config()

    enabled = os.getenv("OUTBOUND_ENABLED", "") == "1" and not args.dry_run

    # Check lock
    if enabled:
        if not acquire_lock(config):
            print("❌ Another send_batch is already running (.send_batch.lock file present).")
            print("   If you're sure no batch is running, delete the lock file manually.")
            sys.exit(1)

    try:
        templates = get_message_variants(config)
        result = run_batch(config, templates, enabled=enabled)
    finally:
        if enabled:
            release_lock(config)

    if args.json:
        print("\n--- JSON RESULT ---")
        print(json.dumps(result, indent=2, ensure_ascii=False, default=str))

    # Exit with error code if something failed
    if result.get("status") in ("aborted",):
        status_reason = result.get("reason", "unknown")
        if status_reason != "user_cancelled":
            sys.exit(1)


if __name__ == "__main__":
    main()
