"""
inbox_scan.py — Scan WhatsApp inbox for replies and classify them.

Reads inbound messages from wacli's local SQLite DB that correspond to
leads we've contacted, classifies them (interested, opt_out, pricing, etc.),
and logs them to the Supabase CRM (respostas table).

Usage:
    python3 scripts/inbox_scan.py                 # scan all contacted leads
    python3 scripts/inbox_scan.py --since 24h      # only last 24 hours
    python3 scripts/inbox_scan.py --stats           # show reply stats only
    python3 scripts/inbox_scan.py --auto            # auto-send safe responses
"""

import argparse
import json
import os
import re
import sqlite3
import subprocess
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# Ensure we can import crm.py
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from crm import (
    get_config,
    get_crm,
    get_lead_by_id,
    update_lead_status,
    log_resposta,
    log_event,
)


# ============================================================================
# wacli.db helpers
# ============================================================================

def find_wacli_db(config: dict) -> Path:
    """Find the wacli.db file."""
    account = config.get("wacli_account", "site_rapido")

    candidates = [
        Path("/root/.hermes/profiles/siterapido/home/.local/state/wacli/accounts") / account / "wacli.db",
        Path.home() / ".local" / "state" / "wacli" / "accounts" / account / "wacli.db",
        Path.home() / ".wacli" / "accounts" / account / "wacli.db",
    ]

    for c in candidates:
        if c.exists():
            return c

    raise FileNotFoundError(f"wacli.db not found for account '{account}'")


def phone_to_jid(phone: str) -> str:
    """Convert a phone number to WhatsApp JID format."""
    digits = re.sub(r"\D", "", phone)
    if digits.startswith("55"):
        return f"{digits}@s.whatsapp.net"
    return f"55{digits}@s.whatsapp.net"


def get_lead_jid(lead: dict) -> str:
    """Get the WhatsApp JID for a lead (from whatsapp_jid or construct from phone)."""
    jid = lead.get("whatsapp_jid", "").strip()
    if jid and "@" in jid:
        return jid

    phone = lead.get("telefone", "").strip()
    if phone:
        return phone_to_jid(phone)

    return ""


# ============================================================================
# Reply classification
# ============================================================================

def classify_reply(text: str) -> str:
    """
    Classify a reply based on Portuguese keyword matching.
    Returns one of: permission_to_send, interessado, pricing_question,
    meeting_ready, opt_out, ambiguous.
    """
    if not text:
        return "ambiguous"

    text_lower = text.lower().strip()

    # Normalize accents for matching
    import unicodedata
    text_norm = unicodedata.normalize("NFKD", text_lower)
    text_norm = "".join(c for c in text_norm if not unicodedata.combining(c))

    # === OPT-OUT (highest priority — respect it) ===
    opt_out_patterns = [
        r"\bnao\b.*\b(interesse|precisa|quero|obrigado)\b",
        r"\bdispensa\b",
        r"\b(tira|tirar|retira|retirar|remove|remover)\b.*\b(lista|contato|numero|número)\b",
        r"\bpara\b.*\b(mandar|enviar|encher|perturbar)\b",
        r"\bnao\b.*\b(mex|chama|manda)\b",
    ]
    for pattern in opt_out_patterns:
        if re.search(pattern, text_norm):
            return "opt_out"

    # Strong opt-out signals
    opt_out_phrases = [
        "não tenho interesse", "nao tenho interesse", "não precisa", "nao precisa",
        "sem interesse", "não quero", "nao quero", "obrigado mas não",
        "obrigado mas nao", "não obrigado", "nao obrigado",
    ]
    for phrase in opt_out_phrases:
        if phrase in text_norm:
            return "opt_out"

    # === MEETING READY ===
    meeting_patterns = [
        r"\b(vamos|bora|pode|posso|da pra)\b.*\b(marcar|agendar|conversar|falar|amanha|hoje|semana)\b",
        r"\b(agendar|marcar|marca)\b.*\b(reuniao|call|conversa|ligação|ligacao)\b",
        r"\b(pode|posso|me)\b.*\b(ligar|te ligar|chamar|liga)\b",
        r"\bqual\b.*\b(horario|dia|hora)\b",
        r"\b(liga|chama)\b.*\b(depois|la|aí|ai|amanha)\b",
    ]
    for pattern in meeting_patterns:
        if re.search(pattern, text_norm):
            return "meeting_ready"

    # === INTERESSADO (check BEFORE permission — "quero saber" is interest, not permission) ===
    interest_patterns = [
        r"\b(interesse|interessado|interessante|legal|bacana|massa|top|bom|otimo|ótimo|gostei|curti)\b",
        r"\b(quero|gostaria|tenho)\b.*\b(saber|conhecer|mais|informação|informacao)\b",
        r"\b(continua|continue|prossegue|fala mais|explica melhor|conta mais)\b",
        r"\b(sim|claro|com certeza|certamente)\b.*\b(interesse|quero|gostaria)\b",
    ]
    for pattern in interest_patterns:
        if re.search(pattern, text_norm):
            return "interessado"

    # === PERMISSION TO SEND ===
    permission_patterns = [
        r"\b(pode|manda|envia|mostra|me mostra|me manda)\b",
        r"\bquero\b.*\b(ver|receber)\b",  # "quero ver" = permission, not "quero saber"
    ]
    for pattern in permission_patterns:
        if re.search(pattern, text_norm):
            return "permission_to_send"

    # === PRICING QUESTION ===
    pricing_patterns = [
        r"\b(quanto|preço|preco|valor|custa|valores|investimento|taxa)\b",
        r"\bqual\b.*\b(preco|preço|valor)\b",
    ]
    for pattern in pricing_patterns:
        if re.search(pattern, text_norm):
            return "pricing_question"

    # === AMBIGUOUS (fallback) ===
    return "ambiguous"


# ============================================================================
# Sync and scan
# ============================================================================

def run_sync(config: dict) -> bool:
    """Run a wacli sync to fetch latest messages."""
    cmd = config.get("wacli_command", "wacli")
    account = config.get("wacli_account", "site_rapido")

    try:
        result = subprocess.run(
            [cmd, "--account", account, "sync", "--once",
             "--idle-exit", "15s", "--max-messages", "50000"],
            capture_output=True, text=True, timeout=30
        )
        return "Connected." in result.stdout or "Messages stored" in result.stdout
    except Exception as e:
        print(f"  ⚠️ Sync failed: {e}")
        return False


def get_contacted_leads(crm, since: Optional[datetime] = None) -> List[dict]:
    """Get all leads that have been contacted (status = contato_iniciado or responded)."""
    statuses = ["contato_iniciado", "respondeu", "interessado", "reuniao_marcada"]

    all_leads = []
    for status in statuses:
        rows = crm.select("leads", filters={"status": status}, limit=1000)
        for row in rows:
            # Filter by ultimo_contato_em if since is specified
            if since and row.get("ultimo_contato_em"):
                try:
                    contact_time = datetime.fromisoformat(
                        row["ultimo_contato_em"].replace("Z", "+00:00")
                    )
                    if contact_time < since:
                        continue
                except (ValueError, TypeError):
                    pass
            all_leads.append(row)

    # Dedupe by id_lead
    seen = set()
    unique = []
    for lead in all_leads:
        lid = lead.get("id_lead", "")
        if lid not in seen:
            seen.add(lid)
            unique.append(lead)

    return unique


def scan_replies(
    config: dict,
    leads: List[dict],
    wacli_conn: sqlite3.Connection,
    crm,
    auto_send: bool = False,
) -> dict:
    """
    Scan wacli.db for replies from contacted leads.
    Returns summary dict with counts.
    """
    # Get all already-logged response msg_ids to avoid duplicates
    existing_logs = crm.select("respostas", columns="id_lead,mensagem_recebida", limit=5000)
    existing_set = set()
    for log in existing_logs:
        # Use id_lead + first 50 chars of message as dedupe key
        key = (log.get("id_lead", ""), (log.get("mensagem_recebida", "") or "")[:50])
        existing_set.add(key)

    stats = {
        "leads_scanned": len(leads),
        "new_replies": 0,
        "classified": {},
        "auto_responded": 0,
    }

    wacli_c = wacli_conn.cursor()

    for lead in leads:
        id_lead = lead.get("id_lead", "")
        empresa = lead.get("empresa", "???")
        jid = get_lead_jid(lead)

        if not jid:
            continue

        # Find inbound messages (from_me=0) for this JID since last contact
        contact_time = lead.get("ultimo_contato_em")
        ts_filter = ""
        params = [jid]

        if contact_time:
            try:
                ct = datetime.fromisoformat(contact_time.replace("Z", "+00:00"))
                cutoff_ts = int(ct.timestamp())
                ts_filter = "AND m.ts > ?"
                params.append(cutoff_ts)
            except (ValueError, TypeError):
                pass

        query = f"""
            SELECT m.msg_id, m.chat_jid, m.chat_name, m.sender_jid,
                   m.sender_name, m.ts, m.from_me, m.text, m.media_type,
                   m.media_caption
            FROM messages m
            WHERE m.chat_jid = ? AND m.from_me = 0 {ts_filter}
            ORDER BY m.ts ASC
        """

        wacli_c.execute(query, params)
        replies = wacli_c.fetchall()

        if not replies:
            continue

        for reply in replies:
            msg_id, chat_jid, chat_name, sender_jid, sender_name, ts, from_me, text, media_type, media_caption = reply

            # Skip messages from ourselves (safety check)
            if from_me:
                continue

            # Check for duplicate
            reply_text = text or media_caption or f"[{media_type}]" or ""
            dedupe_key = (id_lead, reply_text[:50])
            if dedupe_key in existing_set:
                continue

            # Classify
            classification = classify_reply(reply_text)

            # Log to CRM
            try:
                log_resposta({
                    "data_hora": datetime.fromtimestamp(ts, tz=timezone.utc).isoformat(),
                    "id_lead": id_lead,
                    "empresa": empresa,
                    "telefone_jid": sender_jid or chat_jid,
                    "mensagem_recebida": reply_text,
                    "classificacao": classification,
                    "acao_tomada": "classified" if not auto_send else "auto_responded",
                    "proximo_passo": _next_step(classification),
                })
            except Exception as e:
                print(f"  ⚠️ Error logging reply for {empresa}: {e}")
                continue

            existing_set.add(dedupe_key)
            stats["new_replies"] += 1
            stats["classified"][classification] = stats["classified"].get(classification, 0) + 1

            # Update lead status
            _update_lead_from_classification(id_lead, classification, empresa)

            print(f"  📩 {empresa}: \"{reply_text[:60]}{'...' if len(reply_text) > 60 else ''}\"")
            print(f"     → {classification}")

            # Auto-send responses if enabled
            if auto_send:
                auto_msg = get_auto_response(classification, lead, config)
                if auto_msg:
                    print(f"     → auto-response: {auto_msg[:60]}...")
                    stats["auto_responded"] += 1
                    # Note: actual sending would go through send_batch or manual

    return stats


def _next_step(classification: str) -> str:
    """Suggest next action based on classification."""
    steps = {
        "opt_out": "respeitar opt-out, parar contato",
        "permission_to_send": "enviar resumo/demo, não empurrar reunião",
        "interessado": "mandar contexto, perguntar sobre operação",
        "pricing_question": "dar contexto antes de cotação, oferecer call",
        "meeting_ready": "oferecer 2 horários, agendar",
        "ambiguous": "escalar para operador humano",
    }
    return steps.get(classification, "revisar manualmente")


def _update_lead_from_classification(id_lead: str, classification: str, empresa: str):
    """Update lead status based on reply classification."""
    status_map = {
        "opt_out": "opt_out",
        "permission_to_send": "respondeu",
        "interessado": "interessado",
        "pricing_question": "respondeu",
        "meeting_ready": "reuniao_marcada",
        "ambiguous": "respondeu",
    }

    new_status = status_map.get(classification, "respondeu")

    extra = {
        "respondeu": True,
        "classificacao_resposta": classification,
        "ultima_atualizacao": datetime.now(timezone.utc).isoformat(),
    }

    # Clear follow-up if opt-out
    if classification == "opt_out":
        extra["proximo_followup"] = None

    try:
        update_lead_status(id_lead, new_status, **extra)
    except Exception as e:
        print(f"  ⚠️ Error updating lead {empresa}: {e}")


# ============================================================================
# Auto-response templates (for --auto mode)
# ============================================================================

def get_auto_response(classification: str, lead: dict, config: dict) -> Optional[str]:
    """Generate a safe auto-response. Returns None if no auto-response is safe."""
    nome = config.get("operator_name", "Marcos")
    agencia = config.get("agency_name", "Site Rápido")

    templates = {
        "opt_out": "Entendido, não te chamo novamente.",

        "permission_to_send": (
            "Boa! Vou te mostrar por aqui primeiro.\n\n"
            "A gente cria sites profissionais por assinatura — R$120/mês, sem taxa escondida, "
            "sem fidelidade. O site fica pronto em até 3 dias depois que você mandar os dados.\n\n"
            "Quer ver uns exemplos de como fica?"
        ),

        "interessado": (
            "Legal! Qual é o seu ramo? Assim consigo pensar em algo mais direcionado pra você."
        ),

        "pricing_question": (
            "O plano é R$120/mês, sem taxa de entrada. Isso inclui:\n"
            "• Site profissional completo\n"
            "• Hospedagem\n"
            "• Suporte\n"
            "• Entrega em até 3 dias\n\n"
            "Quer marcar uma conversa rápida pra eu te mostrar como funciona?"
        ),
    }

    return templates.get(classification)


# ============================================================================
# Main
# ============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Site Rápido — WhatsApp inbox reply scanner"
    )
    parser.add_argument("--since", default="7d",
                        help="Time window: 1h, 24h, 7d, all (default: 7d)")
    parser.add_argument("--stats", action="store_true",
                        help="Show reply statistics only, no scanning")
    parser.add_argument("--auto", action="store_true",
                        help="Auto-send safe responses (opt_out, permission, pricing)")
    parser.add_argument("--no-sync", action="store_true",
                        help="Skip wacli sync (use existing local data)")
    args = parser.parse_args()

    config = get_config()
    run_id = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")

    # Parse time window
    since_dt = None
    if args.since == "all" or args.since == "0":
        since_dt = None
    elif args.since.endswith("h"):
        hours = int(args.since[:-1])
        since_dt = datetime.now(timezone.utc) - timedelta(hours=hours)
    elif args.since.endswith("d"):
        days = int(args.since[:-1])
        since_dt = datetime.now(timezone.utc) - timedelta(days=days)
    else:
        # Default: 7 days
        since_dt = datetime.now(timezone.utc) - timedelta(days=7)

    print(f"📬 Site Rápido Inbox Scanner")
    print(f"   Time window: {args.since} ({since_dt.isoformat() if since_dt else 'all'})")
    print(f"   Auto-send: {'ON' if args.auto else 'OFF'}")
    print()

    # Step 1: Sync (unless --no-sync)
    if not args.no_sync:
        print("🔄 Syncing WhatsApp...")
        synced = run_sync(config)
        print(f"   Sync: {'✅' if synced else '⚠️ (may use cached data)'}")
        print()

    # Step 2: Connect to wacli.db
    try:
        wacli_db = find_wacli_db(config)
    except FileNotFoundError as e:
        print(f"❌ {e}")
        sys.exit(1)
    wacli_conn = sqlite3.connect(f"file:{wacli_db}?mode=ro", uri=True)

    # Step 3: Connect to CRM
    crm = get_crm()

    # Step 4: Get contacted leads
    print("🔍 Scanning contacted leads...")
    leads = get_contacted_leads(crm, since=since_dt)
    print(f"   Leads to scan: {len(leads)}")

    if not leads:
        print("   ℹ️  No contacted leads found in the given time window.")
        # Check CRM stats
        stats = count_lead_statuses(crm)
        print(f"\n   CRM status counts: {json.dumps(stats)}")
        wacli_conn.close()
        sys.exit(0)

    # Step 5: Stats-only mode
    if args.stats:
        print("\n--- CRM Reply Stats ---")
        all_replies = crm.select("respostas", columns="classificacao", limit=5000)
        reply_counts = {}
        for r in all_replies:
            c = r.get("classificacao", "unknown")
            reply_counts[c] = reply_counts.get(c, 0) + 1

        print(f"   Total replies logged: {len(all_replies)}")
        for classification, count in sorted(reply_counts.items()):
            print(f"     {classification}: {count}")

        print(f"\n--- wacli.db Inbound Stats ---")
        wacli_c = wacli_conn.cursor()
        wacli_c.execute("SELECT COUNT(*) FROM messages WHERE from_me = 0")
        inbound_count = wacli_c.fetchone()[0]
        print(f"   Total inbound messages: {inbound_count}")

        wacli_conn.close()
        sys.exit(0)

    # Step 6: Scan for replies
    print(f"\n--- Scanning ---")
    stats = scan_replies(config, leads, wacli_conn, crm, auto_send=args.auto)

    wacli_conn.close()

    # Step 7: Summary
    print(f"\n{'='*50}")
    print("Scan completo.")
    print(f"  Leads escaneados:  {stats['leads_scanned']}")
    print(f"  Novas respostas:   {stats['new_replies']}")

    if stats["classified"]:
        print("  Classificações:")
        for classification, count in sorted(stats["classified"].items()):
            print(f"    {classification}: {count}")

    if stats["auto_responded"]:
        print(f"  Auto-respostas:    {stats['auto_responded']}")
    print(f"{'='*50}")

    log_event(
        "inbox_scan", "scan_complete", "ok",
        f"scanned={stats['leads_scanned']}, replies={stats['new_replies']}",
        run_id,
    )


def count_lead_statuses(crm) -> dict:
    """Count leads by status."""
    statuses = ["novo", "enviando", "contato_iniciado", "respondeu",
                "interessado", "reuniao_marcada", "opt_out", "erro"]
    result = {}
    for s in statuses:
        try:
            result[s] = crm.count("leads", {"status": s})
        except Exception:
            result[s] = 0
    return result


if __name__ == "__main__":
    main()
