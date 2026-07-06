"""
CRM module for Site Rápido outbound — Supabase backend via REST API (PostgREST).

Uses httpx to talk to Supabase's PostgREST endpoint. No psycopg2 or supabase-py
needed. All CRUD operations go through the REST API with the anon key.

Usage:
    from crm import get_config, add_lead, get_eligible_leads, log_envio, ...
"""

import json
import os
import re
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx

# ---------------------------------------------------------------------------
# Config loading
# ---------------------------------------------------------------------------

_CONFIG_CACHE: Optional[dict] = None


def get_config(config_path: str = None) -> dict:
    """Load config.json. Cached after first call."""
    global _CONFIG_CACHE
    if _CONFIG_CACHE is not None:
        return _CONFIG_CACHE

    if config_path is None:
        # Try standard locations
        candidates = [
            Path(__file__).resolve().parent.parent / "config.json",  # ../config.json
            Path.home() / "agency_ops" / "config.json",
            Path.cwd() / "config.json",
        ]
        for c in candidates:
            if c.exists():
                config_path = str(c)
                break

    if config_path is None or not Path(config_path).exists():
        raise FileNotFoundError(f"config.json not found. Tried: {candidates}")

    with open(config_path, "r") as f:
        _CONFIG_CACHE = json.load(f)
    return _CONFIG_CACHE


# ---------------------------------------------------------------------------
# Supabase REST API client (PostgREST)
# ---------------------------------------------------------------------------

class SupabaseCRM:
    """Thin REST client for Supabase PostgREST API."""

    def __init__(self, url: str, anon_key: str):
        self.base_url = url.rstrip("/")
        self.rest_url = f"{self.base_url}/rest/v1"
        self.headers = {
            "apikey": anon_key,
            "Authorization": f"Bearer {anon_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }
        self.client = httpx.Client(headers=self.headers, timeout=30.0)

    def _table(self, table: str) -> str:
        return f"{self.rest_url}/{table}"

    def insert(self, table: str, data: dict) -> dict:
        """Insert a single row. Returns the created row."""
        resp = self.client.post(self._table(table), json=data)
        resp.raise_for_status()
        rows = resp.json()
        return rows[0] if rows else {}

    def insert_many(self, table: str, rows: List[dict]) -> List[dict]:
        """Insert multiple rows."""
        if not rows:
            return []
        resp = self.client.post(self._table(table), json=rows)
        resp.raise_for_status()
        return resp.json()

    def upsert_many(
        self,
        table: str,
        rows: List[dict],
        on_conflict: str = "id",
        merge: bool = True,
    ) -> List[dict]:
        """
        Upsert multiple rows. Uses PostgREST's Prefer header for conflict resolution.
        on_conflict: comma-separated column names that form the unique constraint.
        merge: if True, update existing rows; if False, ignore duplicates.
        """
        if not rows:
            return []
        headers = {
            **self.headers,
            "Prefer": (
                f"return=representation,resolution={'merge-duplicates' if merge else 'ignore-duplicates'},"
                f"on-conflict={on_conflict}"
            ),
        }
        resp = httpx.post(self._table(table), json=rows, headers=headers, timeout=60.0)
        resp.raise_for_status()
        return resp.json() if resp.text.strip() else []

    def select(
        self,
        table: str,
        columns: str = "*",
        filters: Optional[dict] = None,
        limit: Optional[int] = None,
        order: Optional[str] = None,
    ) -> List[dict]:
        """SELECT rows with optional filters."""
        params: dict = {"select": columns}
        if filters:
            for key, value in filters.items():
                if isinstance(value, str):
                    params[key] = f"eq.{value}"
                elif isinstance(value, bool):
                    params[key] = f"eq.{value}"
                elif value is None:
                    params[key] = f"is.null"
                else:
                    params[key] = f"eq.{value}"
        if limit:
            params["limit"] = limit
        if order:
            params["order"] = order

        resp = self.client.get(self._table(table), params=params)
        resp.raise_for_status()
        return resp.json()

    def update(
        self,
        table: str,
        filters: dict,
        data: dict,
    ) -> List[dict]:
        """UPDATE rows matching filters."""
        params: dict = {"select": "*"}
        for key, value in filters.items():
            if isinstance(value, str):
                params[key] = f"eq.{value}"
            elif isinstance(value, bool):
                params[key] = f"eq.{value}"
            else:
                params[key] = f"eq.{value}"

        resp = self.client.patch(self._table(table), params=params, json=data)
        resp.raise_for_status()
        return resp.json()

    def delete(self, table: str, filters: dict) -> List[dict]:
        """DELETE rows matching filters."""
        params: dict = {"select": "*"}
        for key, value in filters.items():
            if isinstance(value, str):
                params[key] = f"eq.{value}"
            else:
                params[key] = f"eq.{value}"

        resp = self.client.delete(self._table(table), params=params)
        resp.raise_for_status()
        return resp.json()

    def count(self, table: str, filters: Optional[dict] = None) -> int:
        """Count rows matching filters (via PostgREST content-range header)."""
        params: dict = {"limit": "1"}
        if filters:
            for key, value in filters.items():
                if isinstance(value, str):
                    params[key] = f"eq.{value}"
                elif isinstance(value, bool):
                    params[key] = f"eq.{value}"
                elif value is None:
                    params[key] = f"is.null"
                else:
                    params[key] = f"eq.{value}"

        resp = self.client.get(
            self._table(table),
            params=params,
            headers={**self.headers, "Prefer": "count=exact"},
        )
        # content-range format: "0-0/99" → total is 99
        content_range = resp.headers.get("content-range", "")
        if "/" in content_range:
            try:
                return int(content_range.split("/")[-1])
            except ValueError:
                pass
        # Fallback: count rows in response body
        try:
            return len(resp.json())
        except Exception:
            return 0


# ---------------------------------------------------------------------------
# CRM operations
# ---------------------------------------------------------------------------

_crm: Optional[SupabaseCRM] = None


def get_crm() -> SupabaseCRM:
    """Get or create the Supabase CRM client."""
    global _crm
    if _crm is None:
        config = get_config()
        _crm = SupabaseCRM(
            url=config["supabase_url"],
            anon_key=config["supabase_anon_key"],
        )
    return _crm


# ---------------------------------------------------------------------------
# Leads
# ---------------------------------------------------------------------------

def normalize_phone(phone: str) -> str:
    """Normalize a Brazilian phone to digits-only with 55 prefix."""
    if not phone:
        return ""
    digits = re.sub(r"\D", "", phone)
    if digits.startswith("55") and len(digits) >= 12:
        return digits
    if len(digits) == 10 or len(digits) == 11:
        return f"55{digits}"
    return digits


def normalize_company(name: str) -> str:
    """Normalize a company/person name for dedup."""
    if not name:
        return ""
    return re.sub(r"[^a-z0-9]", "", name.lower().strip())


def add_lead(lead: dict) -> dict:
    """Insert a new lead. Generates id_lead if missing. Normalizes phone/company."""
    if not lead.get("id_lead"):
        lead["id_lead"] = str(uuid.uuid4())[:8]

    lead["telefone_normalizado"] = normalize_phone(lead.get("telefone", ""))
    lead["empresa_normalizado"] = normalize_company(lead.get("empresa", ""))
    lead["data_criacao"] = datetime.now(timezone.utc).isoformat()
    lead["ultima_atualizacao"] = datetime.now(timezone.utc).isoformat()

    return get_crm().insert("leads", lead)


def add_leads_batch(leads: List[dict]) -> List[dict]:
    """Insert multiple leads at once. Normalizes all."""
    now = datetime.now(timezone.utc).isoformat()
    for lead in leads:
        if not lead.get("id_lead"):
            lead["id_lead"] = str(uuid.uuid4())[:8]
        lead["telefone_normalizado"] = normalize_phone(lead.get("telefone", ""))
        lead["empresa_normalizado"] = normalize_company(lead.get("empresa", ""))
        lead.setdefault("data_criacao", now)
        lead.setdefault("ultima_atualizacao", now)
    return get_crm().insert_many("leads", leads)


def get_eligible_leads(limit: int = 12) -> List[dict]:
    """Get leads with status='novo' for first contact."""
    return get_crm().select(
        "leads",
        filters={"status": "novo"},
        limit=limit,
        order="data_criacao.asc",
    )


def get_lead_by_id(id_lead: str) -> Optional[dict]:
    """Fetch a single lead by id_lead."""
    rows = get_crm().select("leads", filters={"id_lead": id_lead}, limit=1)
    return rows[0] if rows else None


def find_duplicate(phone: str, company: str) -> Optional[dict]:
    """Check if a lead already exists by normalized phone or company."""
    crm = get_crm()
    norm_phone = normalize_phone(phone)
    norm_company = normalize_company(company)

    if norm_phone:
        rows = crm.select("leads", filters={"telefone_normalizado": norm_phone}, limit=1)
        if rows:
            return rows[0]

    if norm_company:
        rows = crm.select("leads", filters={"empresa_normalizado": norm_company}, limit=1)
        if rows:
            return rows[0]

    return None


def update_lead_status(id_lead: str, status: str, **extra) -> dict:
    """Update a lead's status and any extra fields."""
    data = {"status": status, "ultima_atualizacao": datetime.now(timezone.utc).isoformat()}
    data.update(extra)
    rows = get_crm().update("leads", filters={"id_lead": id_lead}, data=data)
    return rows[0] if rows else {}


def reset_enviando_to_novo() -> int:
    """Reset leads stuck in 'enviando' back to 'novo' (after orphan recovery)."""
    rows = get_crm().update("leads", filters={"status": "enviando"}, data={"status": "novo"})
    return len(rows)


# ---------------------------------------------------------------------------
# Envios
# ---------------------------------------------------------------------------

def log_envio(envio: dict) -> dict:
    """Log a send attempt."""
    if not envio.get("data_hora"):
        envio["data_hora"] = datetime.now(timezone.utc).isoformat()
    return get_crm().insert("envios", envio)


def count_envios_today() -> int:
    """Count sends logged today (UTC-3 for Brazil)."""
    crm = get_crm()
    # Use Supabase filter for today's date
    # PostgREST supports gte/lt on timestamps
    now_utc = datetime.now(timezone.utc)
    # Brazil is UTC-3, so "today" in Brazil = UTC time from 03:00 today to 03:00 tomorrow
    # Simplified: use gte for start of today UTC
    start_today = now_utc.replace(hour=0, minute=0, second=0, microsecond=0)

    params = {
        "select": "id",
        "data_hora": f"gte.{start_today.isoformat()}",
        "limit": "1000",
    }
    resp = crm.client.get(crm._table("envios"), params=params)
    resp.raise_for_status()
    return len(resp.json())


def get_recent_envios(limit: int = 5) -> List[dict]:
    """Get most recent send attempts."""
    return get_crm().select("envios", limit=limit, order="data_hora.desc")


# ---------------------------------------------------------------------------
# Respostas
# ---------------------------------------------------------------------------

def log_resposta(resposta: dict) -> dict:
    """Log a captured inbound reply."""
    if not resposta.get("data_hora"):
        resposta["data_hora"] = datetime.now(timezone.utc).isoformat()
    return get_crm().insert("respostas", resposta)


# ---------------------------------------------------------------------------
# Logs
# ---------------------------------------------------------------------------

def log_event(sistema: str, acao: str, status: str, detalhes: str = "", run_id: str = "") -> dict:
    """Log an operational event."""
    return get_crm().insert("logs", {
        "data_hora": datetime.now(timezone.utc).isoformat(),
        "sistema": sistema,
        "acao": acao,
        "status": status,
        "detalhes": detalhes,
        "run_id": run_id,
    })


# ---------------------------------------------------------------------------
# Stats / Reporting
# ---------------------------------------------------------------------------

def get_stats() -> dict:
    """Get CRM summary stats."""
    crm = get_crm()
    return {
        "leads_total": crm.count("leads"),
        "leads_novo": crm.count("leads", {"status": "novo"}),
        "leads_contato_iniciado": crm.count("leads", {"status": "contato_iniciado"}),
        "leads_respondeu": crm.count("leads", {"status": "respondeu"}),
        "leads_interessado": crm.count("leads", {"status": "interessado"}),
        "leads_opt_out": crm.count("leads", {"status": "opt_out"}),
        "leads_erro": crm.count("leads", {"status": "erro"}),
        "envios_today": count_envios_today(),
        "envios_total": crm.count("envios"),
        "respostas_total": crm.count("respostas"),
    }


def get_lead_status_counts() -> Dict[str, int]:
    """Get lead counts grouped by status."""
    crm = get_crm()
    statuses = ["novo", "enviando", "contato_iniciado", "respondeu",
                "interessado", "reuniao_marcada", "opt_out", "erro", "duplicado"]
    result = {}
    for s in statuses:
        result[s] = crm.count("leads", {"status": s})
    return result


# ---------------------------------------------------------------------------
# Test
# ---------------------------------------------------------------------------

def _test():
    """Quick connectivity test — run: python3 crm.py"""
    print("Testing Supabase CRM connection...")
    crm = get_crm()
    config = get_config()

    print(f"  URL: {config['supabase_url']}")
    print(f"  Backend: supabase")

    # Test: count leads
    try:
        count = crm.count("leads")
        print(f"  ✅ leads table accessible — {count} rows")
    except Exception as e:
        print(f"  ❌ leads table error: {e}")
        return False

    # Test: count envios
    try:
        count = crm.count("envios")
        print(f"  ✅ envios table accessible — {count} rows")
    except Exception as e:
        print(f"  ❌ envios table error: {e}")
        return False

    # Test: count logs
    try:
        count = crm.count("logs")
        print(f"  ✅ logs table accessible — {count} rows")
    except Exception as e:
        print(f"  ❌ logs table error: {e}")
        return False

    # Test: insert + delete a test log
    try:
        row = log_event("test", "connection_test", "ok", "crm.py self-test")
        print(f"  ✅ insert works — log id {row.get('id')}")
        # Clean up
        if row.get("id"):
            crm.delete("logs", {"id": row["id"]})
            print(f"  ✅ delete works — test row removed")
    except Exception as e:
        print(f"  ❌ insert/delete error: {e}")
        return False

    print("\n  All tests passed. CRM is ready.")
    return True


if __name__ == "__main__":
    _test()
