"""
Sync WhatsApp history from wacli's local SQLite DB into Supabase.

Reads messages, chats, and contacts from wacli.db and upserts them into
the corresponding Supabase tables. Idempotent — safe to run repeatedly.

Usage:
    python3 scripts/sync_wacli_to_supabase.py            # full sync
    python3 scripts/sync_wacli_to_supabase.py --stats     # show counts only
    python3 scripts/sync_wacli_to_supabase.py --messages  # sync only messages
"""

import argparse
import json
import os
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List

# Ensure we can import crm.py
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from crm import get_crm, get_config, log_event


# ---------------------------------------------------------------------------
# wacli.db path resolution
# ---------------------------------------------------------------------------

def find_wacli_db() -> Path:
    """Find the wacli.db file for the site_rapido account."""
    config = get_config()
    account = config.get("wacli_account", "site_rapido")

    candidates = [
        Path.home() / ".local" / "state" / "wacli" / "accounts" / account / "wacli.db",
        Path.home() / ".wacli" / "accounts" / account / "wacli.db",
        Path("/root/.hermes/profiles/siterapido/home/.local/state/wacli/accounts") / account / "wacli.db",
    ]

    for c in candidates:
        if c.exists():
            return c

    # Fall back to glob search
    for base in [Path.home() / ".local/state/wacli", Path.home() / ".wacli"]:
        if base.exists():
            for p in base.rglob("wacli.db"):
                return p

    raise FileNotFoundError(
        f"wacli.db not found for account '{account}'. Checked: {[str(c) for c in candidates]}"
    )


# ---------------------------------------------------------------------------
# Read from wacli.db
# ---------------------------------------------------------------------------

def read_messages(conn: sqlite3.Connection) -> List[dict]:
    """Read all messages from wacli.db."""
    c = conn.cursor()
    c.execute("""
        SELECT msg_id, chat_jid, chat_name, sender_jid, sender_name,
               ts, from_me, text, display_text, quoted_msg_id, quoted_sender_jid,
               is_forwarded, forwarding_score, reaction_to_id, reaction_emoji,
               media_type, media_caption, filename, mime_type, local_path,
               downloaded_at, revoked, deleted_for_me, edited, edited_ts
        FROM messages
        ORDER BY ts ASC
    """)

    rows = []
    for r in c.fetchall():
        # Skip messages without a msg_id (can't upsert without unique key)
        if not r[0]:
            continue

        downloaded_at = None
        if r[20]:
            try:
                downloaded_at = datetime.fromtimestamp(r[20], tz=timezone.utc).isoformat()
            except (ValueError, OSError):
                downloaded_at = None

        rows.append({
            "msg_id":            r[0],
            "chat_jid":          r[1],
            "chat_name":         r[2],
            "sender_jid":        r[3],
            "sender_name":       r[4],
            "ts":                r[5],
            "from_me":           bool(r[6]) if r[6] is not None else False,
            "text":              r[7],
            "display_text":      r[8],
            "quoted_msg_id":     r[9],
            "quoted_sender_jid": r[10],
            "is_forwarded":      bool(r[11]) if r[11] is not None else False,
            "forwarding_score":  r[12] or 0,
            "reaction_to_id":    r[13],
            "reaction_emoji":    r[14],
            "media_type":        r[15],
            "media_caption":     r[16],
            "filename":          r[17],
            "mime_type":         r[18],
            "local_path":        r[19],
            "downloaded_at":     downloaded_at,
            "revoked":           bool(r[21]) if r[21] is not None else False,
            "deleted_for_me":    bool(r[22]) if r[22] is not None else False,
            "edited":            bool(r[23]) if r[23] is not None else False,
            "edited_ts":         r[24],
        })

    return rows


def read_chats(conn: sqlite3.Connection) -> List[dict]:
    """Read all chats from wacli.db."""
    c = conn.cursor()
    c.execute("""
        SELECT jid, kind, name, last_message_ts, archived, pinned,
               muted_until, unread, unread_count
        FROM chats
    """)

    rows = []
    for r in c.fetchall():
        if not r[0]:
            continue
        rows.append({
            "jid":             r[0],
            "kind":            r[1],
            "name":            r[2],
            "last_message_ts": r[3],
            "archived":        bool(r[4]) if r[4] is not None else False,
            "pinned":          bool(r[5]) if r[5] is not None else False,
            "muted_until":     r[6],
            "unread":          bool(r[7]) if r[7] is not None else False,
            "unread_count":    r[8] or 0,
        })

    return rows


def read_contacts(conn: sqlite3.Connection) -> List[dict]:
    """Read all contacts from wacli.db."""
    c = conn.cursor()
    c.execute("""
        SELECT jid, phone, push_name, full_name, first_name, business_name, updated_at
        FROM contacts
    """)

    rows = []
    for r in c.fetchall():
        if not r[0]:
            continue

        updated_at = None
        if r[6]:
            try:
                updated_at = datetime.fromtimestamp(r[6], tz=timezone.utc).isoformat()
            except (ValueError, OSError):
                updated_at = None

        rows.append({
            "jid":           r[0],
            "phone":         r[1],
            "push_name":     r[2],
            "full_name":     r[3],
            "first_name":    r[4],
            "business_name": r[5],
            "updated_at":    updated_at,
        })

    return rows


# ---------------------------------------------------------------------------
# Sync to Supabase
# ---------------------------------------------------------------------------

def sync_messages(rows: List[dict], batch_size: int = 100) -> int:
    """Upsert messages into Supabase in batches. Returns count synced."""
    crm = get_crm()
    total = 0
    for i in range(0, len(rows), batch_size):
        batch = rows[i : i + batch_size]
        try:
            crm.upsert_many("whatsapp_messages", batch, on_conflict="msg_id", merge=True)
            total += len(batch)
            print(f"  messages: {total}/{len(rows)}")
        except Exception as e:
            print(f"  ⚠️ batch {i}-{i+len(batch)} error: {e}")
            # Try smaller batches
            if len(batch) > 10:
                for j in range(0, len(batch), 10):
                    sub = batch[j : j + 10]
                    try:
                        crm.upsert_many("whatsapp_messages", sub, on_conflict="msg_id", merge=True)
                        total += len(sub)
                    except Exception as e2:
                        print(f"  ❌ sub-batch {j} error: {e2}")
    return total


def sync_chats(rows: List[dict]) -> int:
    """Upsert chats into Supabase."""
    crm = get_crm()
    try:
        crm.upsert_many("whatsapp_chats", rows, on_conflict="jid", merge=True)
        return len(rows)
    except Exception as e:
        print(f"  ⚠️ chats sync error: {e}")
        return 0


def sync_contacts(rows: List[dict]) -> int:
    """Upsert contacts into Supabase."""
    crm = get_crm()
    try:
        crm.upsert_many("whatsapp_contacts", rows, on_conflict="jid", merge=True)
        return len(rows)
    except Exception as e:
        print(f"  ⚠️ contacts sync error: {e}")
        return 0


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Sync wacli.db → Supabase")
    parser.add_argument("--stats", action="store_true", help="Show counts only, no sync")
    parser.add_argument("--messages", action="store_true", help="Sync only messages")
    parser.add_argument("--chats", action="store_true", help="Sync only chats")
    parser.add_argument("--contacts", action="store_true", help="Sync only contacts")
    args = parser.parse_args()

    # Find wacli.db
    try:
        db_path = find_wacli_db()
    except FileNotFoundError as e:
        print(f"❌ {e}")
        sys.exit(1)

    print(f"📱 wacli.db: {db_path}")
    print(f"   size: {db_path.stat().st_size / 1024:.1f} KB")

    conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)

    # Read counts
    msgs = read_messages(conn)
    chats = read_chats(conn)
    contacts = read_contacts(conn)

    print(f"   messages: {len(msgs)}")
    print(f"   chats: {len(chats)}")
    print(f"   contacts: {len(contacts)}")

    if args.stats:
        conn.close()
        return

    # Check Supabase connection
    crm = get_crm()
    config = get_config()
    print(f"\n🗄️  Supabase: {config['supabase_url']}")

    # Determine what to sync
    do_all = not (args.messages or args.chats or args.contacts)

    print("\n--- Syncing ---")

    if do_all or args.chats:
        print("\n📋 Chats...")
        n = sync_chats(chats)
        print(f"  ✅ {n} chats synced")

    if do_all or args.contacts:
        print("\n👥 Contacts...")
        n = sync_contacts(contacts)
        print(f"  ✅ {n} contacts synced")

    if do_all or args.messages:
        print("\n💬 Messages...")
        n = sync_messages(msgs)
        print(f"  ✅ {n} messages synced")

    conn.close()

    # Log the sync
    log_event(
        sistema="sync_wacli",
        acao="full_sync",
        status="ok",
        detalhes=f"messages={len(msgs)}, chats={len(chats)}, contacts={len(contacts)}",
    )

    print("\n✅ Sync completo.")


if __name__ == "__main__":
    main()
