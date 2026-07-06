"""
source_apify.py — Source leads from Google Maps via Apify and import into CRM.

Uses the Apify Google Maps Scraper (compass/crawler-google-places) to fetch
business leads, normalizes phone numbers, dedupes against the CRM, and imports
new leads with status='novo'.

Usage:
    # Dry-run (show what would be imported, no CRM writes):
    python3 scripts/source_apify.py --search "agência de marketing Natal" --dry-run

    # Real import:
    python3 scripts/source_apify.py --search "agência de marketing Natal"

    # With custom max places:
    python3 scripts/source_apify.py --search "clínica estética Natal/RN" --max 60

    # Multiple searches:
    python3 scripts/source_apify.py --search "agência Natal" --search "marketing Natal"

Requirements:
    - apify CLI installed and authenticated (apify login)
    - CRM Supabase configured
"""

import argparse
import json
import os
import re
import sys
import time
import uuid
from datetime import datetime, timezone
from typing import List

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from crm import (
    get_config,
    get_crm,
    find_duplicate,
    add_leads_batch,
    log_event,
    normalize_phone,
    normalize_company,
)


# ============================================================================
# Apify execution
# ============================================================================

def run_apify_search(config: dict, search_string: str, max_places: int = 40) -> list:
    """
    Run an Apify Google Maps search via REST API and return parsed results.
    Uses httpx to call Apify API directly (no CLI dependency for the actual run).
    Returns list of dicts with place data.
    """
    import httpx

    actor = config.get("apify_actor", "compass/crawler-google-places")
    token = os.getenv("APIFY_TOKEN", "")

    if not token:
        print("  ⚠️ APIFY_TOKEN not set. Set via: export APIFY_TOKEN=...")
        return []

    input_data = {
        "searchStringsArray": [search_string],
        "maxCrawledPlacesPerSearch": max_places,
        "language": "pt-BR",
        "proxyConfig": {"useApifyProxy": True},
    }

    try:
        print(f"  🔍 Apify search: '{search_string}' (max {max_places})")

        client = httpx.Client(timeout=180.0)

        # Step 1: Start actor run
        actor_name = actor.replace("/", "~")
        run_url = f"https://api.apify.com/v2/acts/{actor_name}/runs?token={token}"
        resp = client.post(run_url, json=input_data)
        resp.raise_for_status()
        run_data = resp.json()
        run_id = run_data["data"]["id"]
        dataset_id = run_data["data"]["defaultDatasetId"]
        print(f"  📦 Run ID: {run_id}, Dataset: {dataset_id}")

        # Step 2: Wait for run to finish (poll status)
        print("  ⏳ Waiting for actor to finish...")
        status_url = f"https://api.apify.com/v2/actor-runs/{run_id}?token={token}"
        for attempt in range(30):  # max ~5 min wait
            time.sleep(10)
            sr = client.get(status_url)
            sr.raise_for_status()
            status_data = sr.json()
            status = status_data["data"]["status"]
            if status == "SUCCEEDED":
                print(f"  ✅ Actor finished successfully")
                break
            elif status in ("FAILED", "ABORTED", "TIMED-OUT"):
                print(f"  ⚠️ Actor finished with status: {status}")
                return []
            elif attempt % 6 == 0:
                print(f"  → Status: {status}...")

        # Step 3: Fetch dataset items
        print("  📥 Fetching results...")
        items_url = f"https://api.apify.com/v2/datasets/{dataset_id}/items?token={token}&format=json&clean=1"
        ir = client.get(items_url)
        ir.raise_for_status()
        items = ir.json()

        client.close()

        print(f"  ✅ {len(items)} places returned")
        return items if isinstance(items, list) else []

    except Exception as e:
        print(f"  ⚠️ Apify error: {e}")
        import traceback
        traceback.print_exc()
        return []


# ============================================================================
# Parse and normalize
# ============================================================================

def parse_apify_result(item: dict, search_city: str = "") -> dict:
    """
    Parse a single Apify result into CRM lead format.
    Returns dict with: empresa, telefone, site, cidade, nicho, endereco, origem, status.
    """
    empresa = (item.get("title") or item.get("name") or "").strip()

    # Phone: try multiple fields
    phone = ""
    phone_fields = ["phone", "phoneUnformatted", "phoneNumber", "internationalPhone"]
    for field in phone_fields:
        val = item.get(field, "")
        if val:
            phone = str(val).strip()
            break

    # Website
    site = (item.get("website") or item.get("websiteUrl") or "").strip()
    if site and not site.startswith("http"):
        site = "https://" + site

    # Address / city
    address = item.get("address") or item.get("fullAddress") or ""
    city = item.get("city") or search_city or ""
    if not city and address:
        # Try to extract city from address
        parts = address.split(",")
        if len(parts) >= 2:
            city = parts[-2].strip().split("/")[0].strip()

    # Category / niche
    niche = ""
    if item.get("categoryName"):
        niche = item["categoryName"]
    elif item.get("categories") and isinstance(item["categories"], list):
        niche = item["categories"][0] if item["categories"] else ""
    elif item.get("types") and isinstance(item["types"], list):
        niche = item["types"][0] if item["types"] else ""

    # Rating
    rating = item.get("totalScore") or item.get("rating")
    place_id = item.get("placeId") or item.get("id")

    lead = {
        "empresa": empresa,
        "telefone": phone,
        "site": site,
        "cidade": city,
        "nicho": niche,
        "origem": "google_maps",
        "status": "novo",
        "mensagem_variante": "recomendada",
    }

    if address:
        lead["observacoes"] = address[:200]
    if place_id:
        lead["place_id"] = str(place_id)

    return lead


# ============================================================================
# Import pipeline
# ============================================================================

def import_leads(
    leads: List[dict],
    crm,
    dry_run: bool = False,
) -> dict:
    """
    Import leads into CRM with deduplication and normalization.
    Returns stats dict.
    """
    stats = {
        "fetched": len(leads),
        "valid": 0,
        "duplicates": 0,
        "skipped_no_phone": 0,
        "imported": 0,
    }

    to_import = []

    for lead in leads:
        empresa = lead.get("empresa", "").strip()
        phone = lead.get("telefone", "").strip()

        # Skip empty names
        if not empresa:
            stats["skipped_no_phone"] += 1
            continue

        # Normalize phone
        norm_phone = normalize_phone(phone) if phone else ""
        lead["telefone"] = norm_phone if norm_phone else phone

        # Skip missing phone
        if not norm_phone:
            stats["skipped_no_phone"] += 1
            continue

        stats["valid"] += 1

        # Dedupe
        if not dry_run:
            dup = find_duplicate(phone, empresa)
            if dup:
                stats["duplicates"] += 1
                continue

        # Generate id_lead
        lead["id_lead"] = str(uuid.uuid4())[:8]
        to_import.append(lead)

    stats["imported"] = len(to_import)

    if not dry_run and to_import:
        try:
            add_leads_batch(to_import)
        except Exception as e:
            print(f"  ⚠️ Import batch failed: {e}")
            # Fall back to individual imports
            imported = 0
            for lead in to_import:
                try:
                    add_leads_batch([lead])
                    imported += 1
                except Exception as e2:
                    print(f"  ⚠️ Failed to import {lead.get('empresa', '???')}: {e2}")
            stats["imported"] = imported

    return stats


def add_leads_batch(leads: List[dict]) -> List[dict]:
    """Override to use the crm function."""
    from crm import add_leads_batch as crm_add_leads_batch
    return crm_add_leads_batch(leads)


# ============================================================================
# Main
# ============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Site Rápido — Source leads from Google Maps via Apify"
    )
    parser.add_argument("--search", action="append", dest="searches",
                        help="Search string (e.g. 'agência de marketing Natal'). Repeat for multiple.")
    parser.add_argument("--max", type=int, default=None,
                        help="Max places per search (default: from config, 40)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Preview only — no CRM writes")
    parser.add_argument("--json", action="store_true",
                        help="Output final stats as JSON")
    args = parser.parse_args()

    config = get_config()
    max_places = args.max or config.get("lead_source_default_max", 40)
    run_id = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")

    # Build search list
    if args.searches:
        searches = args.searches
    else:
        # Default search from config
        icp = config.get("icp", "agência de marketing")
        city = config.get("default_city", "Natal")
        searches = [f"{icp} {city}"]

    print(f"📍 Site Rápido — Apify Lead Sourcing")
    print(f"   Mode: {'DRY-RUN' if args.dry_run else 'LIVE IMPORT'}")
    print(f"   Searches: {len(searches)}")
    for s in searches:
        print(f"     • {s}")
    print(f"   Max places/search: {max_places}")
    print()

    # Initialize CRM for dedup
    crm = get_crm() if not args.dry_run else None

    all_leads = []
    total_stats = {
        "fetched": 0,
        "valid": 0,
        "duplicates": 0,
        "skipped_no_phone": 0,
        "imported": 0,
        "searches_ran": 0,
    }

    for search in searches:
        print(f"--- Search: {search} ---")

        # Run Apify
        items = run_apify_search(config, search, max_places)
        if not items:
            print("  ⚠️ No results — skipping.")
            print()
            continue

        total_stats["searches_ran"] += 1

        # Parse results
        parsed = []
        city = search.split("em")[-1].strip() if "em" in search else config.get("default_city", "")
        for item in items:
            lead = parse_apify_result(item, search_city=city)
            if lead.get("empresa"):
                parsed.append(lead)

        all_leads.extend(parsed)
        print(f"  📋 Parsed: {len(parsed)} leads")

        # Show sample
        if parsed:
            print("  Sample:")
            for lead in parsed[:3]:
                phone_display = lead.get("telefone", "")[:15] or "(sem tel)"
                print(f"    • {lead['empresa'][:40]} | {phone_display} | {lead.get('cidade', '')[:15]}")

        print()

    # Dedupe across searches
    print(f"--- Import ({len(all_leads)} total parsed) ---")
    seen = set()
    unique_leads = []
    for lead in all_leads:
        key = (normalize_phone(lead.get("telefone", "")), normalize_company(lead.get("empresa", "")))
        if key not in seen and key[0]:
            seen.add(key)
            unique_leads.append(lead)

    print(f"  After cross-search dedup: {len(unique_leads)} unique")

    # Import
    if args.dry_run:
        # Show preview
        print(f"\n  DRY-RUN — {len(unique_leads)} leads would be imported (not writing to CRM).")
        if unique_leads:
            print("  Preview (first 10):")
            for lead in unique_leads[:10]:
                print(f"    • {lead['empresa'][:40]} | {lead.get('telefone', '')[:15]} | {lead.get('nicho', '')[:20]}")
        stats = {
            "fetched": len(all_leads),
            "valid": len(unique_leads),
            "duplicates": len(all_leads) - len(unique_leads),
            "skipped_no_phone": sum(1 for l in all_leads if not l.get("telefone")),
            "imported": 0,
        }
    else:
        stats = import_leads(unique_leads, crm, dry_run=False)
        log_event("source_apify", "import", "ok",
                  f"imported={stats['imported']}, duplicates={stats['duplicates']}",
                  run_id)

    # Summary
    print(f"\n{'='*50}")
    print("Sourcing concluído.")
    print(f"  Searches ran:     {total_stats['searches_ran']}/{len(searches)}")
    print(f"  Total fetched:    {len(all_leads)}")
    print(f"  Valid (c/ tel):   {stats['valid']}")
    print(f"  Duplicates:       {stats['duplicates']}")
    print(f"  Skipped (sem tel): {stats['skipped_no_phone']}")
    print(f"  Imported (novo):  {stats['imported']}")

    # Show how many leads are now available
    if not args.dry_run and crm:
        novo_count = crm.count("leads", {"status": "novo"})
        print(f"\n  CRM leads 'novo' agora: {novo_count}")
        if novo_count >= config.get("batch_size", 10):
            print(f"  ✅ Suficiente para um batch de {config.get('batch_size', 10)}!")
        else:
            print(f"  ⚠️ Ainda não suficiente. Continue buscando ou reduza batch_size.")
    print(f"{'='*50}")

    if args.json:
        print("\n--- JSON ---")
        print(json.dumps(stats, indent=2))


if __name__ == "__main__":
    main()
