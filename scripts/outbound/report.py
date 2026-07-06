"""
report.py — Daily outbound summary report.

Reads CRM stats from Supabase and prints a human-readable daily report:
leads imported, sent, failed, replies, classifications, meetings booked, blockers.

Usage:
    python3 scripts/report.py              # today's report
    python3 scripts/report.py --json        # machine-readable JSON
    python3 scripts/report.py --days 7      # last 7 days summary
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from crm import get_config, get_crm, get_stats, log_event


# ============================================================================
# Report generation
# ============================================================================

def generate_report(crm, config: dict, days: int = 1) -> dict:
    """Generate a daily outbound report. Returns dict with all sections."""

    # Time window
    end_time = datetime.now(timezone.utc)
    start_time = end_time - timedelta(days=days)

    report = {
        "period": f"{start_time.strftime('%d/%m/%Y')} - {end_time.strftime('%d/%m/%Y')}",
        "agency": config.get("agency_name", "Site Rápido"),
        "offer": config.get("offer", ""),
        "generated_at": end_time.isoformat(),
    }

    # --- Lead stats ---
    try:
        total_leads = crm.count("leads")
        novo = crm.count("leads", {"status": "novo"})
        enviando = crm.count("leads", {"status": "enviando"})
        contato_iniciado = crm.count("leads", {"status": "contato_iniciado"})
        respondeu = crm.count("leads", {"status": "respondeu"})
        interessado = crm.count("leads", {"status": "interessado"})
        reuniao_marcada = crm.count("leads", {"status": "reuniao_marcada"})
        opt_out = crm.count("leads", {"status": "opt_out"})
        erro = crm.count("leads", {"status": "erro"})
    except Exception:
        total_leads = novo = enviando = contato_iniciado = respondeu = interessado = reuniao_marcada = opt_out = erro = 0

    report["leads"] = {
        "total": total_leads,
        "novo": novo,
        "enviando": enviando,
        "contato_iniciado": contato_iniciado,
        "respondeu": respondeu,
        "interessado": interessado,
        "reuniao_marcada": reuniao_marcada,
        "opt_out": opt_out,
        "erro": erro,
    }

    # --- Sends today ---
    try:
        all_envios = crm.select("envios", columns="status,data_hora", limit=5000)
        envios_today = [
            e for e in all_envios
            if e.get("data_hora") and e["data_hora"] >= start_time.isoformat()
        ]
        sent_success = sum(1 for e in envios_today if e.get("status") == "success")
        sent_error = sum(1 for e in envios_today if e.get("status") in ("error", "error_463"))
        sent_auth_error = sum(1 for e in envios_today if e.get("status") == "auth_error")
    except Exception:
        envios_today = []
        sent_success = sent_error = sent_auth_error = 0

    report["envios"] = {
        "total": len(envios_today),
        "success": sent_success,
        "errors": sent_error,
        "auth_errors": sent_auth_error,
    }

    # --- Replies ---
    try:
        all_replies = crm.select("respostas", columns="classificacao,data_hora", limit=5000)
        replies_today = [
            r for r in all_replies
            if r.get("data_hora") and r["data_hora"] >= start_time.isoformat()
        ]

        reply_counts = {}
        for r in replies_today:
            c = r.get("classificacao", "unknown")
            reply_counts[c] = reply_counts.get(c, 0) + 1
    except Exception:
        replies_today = []
        reply_counts = {}

    report["respostas"] = {
        "total": len(replies_today),
        "by_classification": reply_counts,
    }

    # --- Conversion funnel ---
    contacted = contato_iniciado + respondeu + interessado + reuniao_marcada + opt_out
    replied = respondeu + interessado + reuniao_marcada + opt_out
    positive = interessado + reuniao_marcada

    report["funnel"] = {
        "leads_contacted": contacted,
        "leads_replied": replied,
        "reply_rate": f"{(replied / max(contacted, 1) * 100):.1f}%" if contacted > 0 else "0%",
        "positive_replies": positive,
        "meetings_booked": reuniao_marcada,
        "opt_outs": opt_out,
        "conversion_rate": f"{(positive / max(contacted, 1) * 100):.1f}%" if contacted > 0 else "0%",
    }

    # --- Blockers ---
    blockers = []
    if enviando > 0:
        blockers.append(f"{enviando} leads stuck in 'enviando' — possível processo órfão")
    if sent_auth_error > 0:
        blockers.append("Auth error mid-batch — WhatsApp session expired")
    if novo == 0 and contacted > 0:
        blockers.append("Zero leads 'novo' — precisa sourcing")
    if total_leads == 0:
        blockers.append("CRM vazio — nenhum lead importado ainda")

    report["blockers"] = blockers

    return report


# ============================================================================
# Display
# ============================================================================

def print_report(report: dict):
    """Print a human-readable report."""
    print(f"""
╔══════════════════════════════════════════════════╗
║       📊 RELATÓRIO DIÁRIO — OUTBOUND           ║
║       {report['agency']:<36}  ║
║       {report['period']:<36}  ║
╚══════════════════════════════════════════════════╝
""")

    # Leads
    leads = report["leads"]
    print("📋 LEADS")
    print(f"  Total: {leads['total']}")
    print(f"  ⬜ Novo:             {leads['novo']}")
    print(f"  🟡 Enviando:          {leads['enviando']}")
    print(f"  📤 Contato iniciado:  {leads['contato_iniciado']}")
    print(f"  📨 Respondeu:         {leads['respondeu']}")
    print(f"  ✅ Interessado:       {leads['interessado']}")
    print(f"  🎯 Reunião marcada:   {leads['reuniao_marcada']}")
    print(f"  🚫 Opt-out:           {leads['opt_out']}")
    print(f"  ❌ Erro:              {leads['erro']}")

    # Envios
    envios = report["envios"]
    print(f"\n📤 ENVIOS ({report['period']})")
    print(f"  Total: {envios['total']}")
    print(f"  ✅ Sucesso:  {envios['success']}")
    print(f"  ❌ Erros:    {envios['errors']}")
    if envios["auth_errors"] > 0:
        print(f"  ⚠️  Auth:     {envios['auth_errors']} (sessão expirada)")

    # Respostas
    respostas = report["respostas"]
    print(f"\n📨 RESPOSTAS ({report['period']})")
    print(f"  Total: {respostas['total']}")
    if respostas["by_classification"]:
        for classification, count in sorted(respostas["by_classification"].items()):
            emoji = {
                "opt_out": "🚫",
                "permission_to_send": "👍",
                "interessado": "✅",
                "pricing_question": "💰",
                "meeting_ready": "🎯",
                "ambiguous": "❓",
            }.get(classification, "📌")
            print(f"  {emoji} {classification}: {count}")

    # Funnel
    funnel = report["funnel"]
    print(f"\n📊 FUNIL DE CONVERSÃO")
    print(f"  Leads contatados:    {funnel['leads_contacted']}")
    print(f"  Responderam:         {funnel['leads_replied']} ({funnel['reply_rate']})")
    print(f"  Interessados:        {funnel['positive_replies']} ({funnel['conversion_rate']})")
    print(f"  Reuniões agendadas:  {funnel['meetings_booked']}")
    print(f"  Opt-outs:            {funnel['opt_outs']}")

    # Blockers
    if report["blockers"]:
        print(f"\n⚠️  BLOCKERS")
        for b in report["blockers"]:
            print(f"  • {b}")
    else:
        print(f"\n✅ Nenhum blocker detectado.")

    print()


# ============================================================================
# Main
# ============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Site Rápido — Daily outbound report"
    )
    parser.add_argument("--json", action="store_true",
                        help="Output as JSON instead of formatted text")
    parser.add_argument("--days", type=int, default=1,
                        help="Number of days to cover (default: 1 = today)")
    args = parser.parse_args()

    config = get_config()
    crm = get_crm()
    run_id = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")

    report = generate_report(crm, config, days=args.days)

    if args.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        print_report(report)

    # Log report generation
    log_event("report", "generated", "ok",
              f"days={args.days}, leads={report['leads']['total']}",
              run_id)


if __name__ == "__main__":
    main()
