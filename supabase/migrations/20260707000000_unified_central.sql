-- ============================================================================
-- Site Rápido — Unified Central Schema (reconciliation)
-- Merges CRM inbound (repo) + CRM outbound (agency_ops) + WhatsApp
-- Applied March 2026
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. LEADS — merged schema
-- Base table created by outbound schema (BIGINT IDENTITY).
-- CRM inbound columns added by repo migration 20260706120000.
-- ---------------------------------------------------------------------------

-- Add any missing outbound columns (idempotent)
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS empresa          text,
  ADD COLUMN IF NOT EXISTS contato          text,
  ADD COLUMN IF NOT EXISTS whatsapp_jid     text,
  ADD COLUMN IF NOT EXISTS cidade           text,
  ADD COLUMN IF NOT EXISTS nicho            text,
  ADD COLUMN IF NOT EXISTS site             text,
  ADD COLUMN IF NOT EXISTS origem           text DEFAULT 'google_maps',
  ADD COLUMN IF NOT EXISTS tipo_lead        text DEFAULT 'pessoa',
  ADD COLUMN IF NOT EXISTS mensagem_variante text DEFAULT 'recomendada',
  ADD COLUMN IF NOT EXISTS dor_principal     text,
  ADD COLUMN IF NOT EXISTS oportunidade      text,
  ADD COLUMN IF NOT EXISTS ultimo_contato_em timestamptz,
  ADD COLUMN IF NOT EXISTS proximo_followup  timestamptz,
  ADD COLUMN IF NOT EXISTS qtde_followups    integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS respondeu         boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS classificacao_resposta text,
  ADD COLUMN IF NOT EXISTS telefone_normalizado   text,
  ADD COLUMN IF NOT EXISTS empresa_normalizado    text,
  ADD COLUMN IF NOT EXISTS place_id              text,
  ADD COLUMN IF NOT EXISTS id_lead               text;

-- Add any missing repo columns (idempotent)
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS stage        text NOT NULL DEFAULT 'novo',
  ADD COLUMN IF NOT EXISTS plan_slug    text,
  ADD COLUMN IF NOT EXISTS notes        text,
  ADD COLUMN IF NOT EXISTS customer_id  uuid,
  ADD COLUMN IF NOT EXISTS lost_reason  text,
  ADD COLUMN IF NOT EXISTS source       text NOT NULL DEFAULT 'landing',
  ADD COLUMN IF NOT EXISTS updated_at   timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS instagram    text;

-- Stage check constraint
ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_stage_check;
ALTER TABLE public.leads
  ADD CONSTRAINT leads_stage_check CHECK (
    stage IN ('novo', 'qualificado', 'demo', 'proposta', 'aguardando_pagamento', 'ativo', 'perdido')
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_stage           ON public.leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_telefone_normalizado ON public.leads(telefone_normalizado);
CREATE INDEX IF NOT EXISTS idx_leads_empresa_normalizado  ON public.leads(empresa_normalizado);
CREATE INDEX IF NOT EXISTS idx_leads_cidade          ON public.leads(cidade);
CREATE INDEX IF NOT EXISTS idx_leads_origem          ON public.leads(origem);
CREATE INDEX IF NOT EXISTS idx_leads_respondeu       ON public.leads(respondeu);
CREATE INDEX IF NOT EXISTS idx_leads_proximo_followup ON public.leads(proximo_followup);

-- Unique constraint on id_lead
ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_id_lead_key;
ALTER TABLE public.leads
  ADD CONSTRAINT leads_id_lead_key UNIQUE (id_lead);

-- Customer FK (may already exist)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'leads_customer_id_fkey' AND table_name = 'leads'
  ) THEN
    ALTER TABLE public.leads
      ADD CONSTRAINT leads_customer_id_fkey
      FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. ENVIOS — outbound send attempts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.envios (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  data_hora       TIMESTAMPTZ DEFAULT now(),
  lead_id         BIGINT REFERENCES public.leads(id) ON DELETE SET NULL,
  lead_nome       TEXT,
  telefone        TEXT,
  mensagem        TEXT,
  status          TEXT,
  provider_msg_id TEXT,
  destino_jid     TEXT,
  erro            TEXT,
  campanha        TEXT,
  mensagem_variante TEXT,
  batch_run_id    TEXT
);

CREATE INDEX IF NOT EXISTS idx_envios_data_hora ON public.envios(data_hora);
CREATE INDEX IF NOT EXISTS idx_envios_lead_id   ON public.envios(lead_id);
CREATE INDEX IF NOT EXISTS idx_envios_status    ON public.envios(status);
CREATE INDEX IF NOT EXISTS idx_envios_batch_run ON public.envios(batch_run_id);

-- ---------------------------------------------------------------------------
-- 3. RESPOSTAS — captured inbound replies
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.respostas (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  data_hora         TIMESTAMPTZ DEFAULT now(),
  lead_id           BIGINT REFERENCES public.leads(id) ON DELETE SET NULL,
  lead_nome         TEXT,
  telefone_jid      TEXT,
  mensagem_recebida TEXT,
  classificacao     TEXT,
  acao_tomada       TEXT,
  proximo_passo     TEXT
);

CREATE INDEX IF NOT EXISTS idx_respostas_lead_id   ON public.respostas(lead_id);
CREATE INDEX IF NOT EXISTS idx_respostas_data_hora ON public.respostas(data_hora);

-- ---------------------------------------------------------------------------
-- 4. LOGS — operational events
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.logs (
  id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  data_hora TIMESTAMPTZ DEFAULT now(),
  sistema   TEXT,
  acao      TEXT,
  status    TEXT,
  detalhes  TEXT,
  run_id    TEXT
);

CREATE INDEX IF NOT EXISTS idx_logs_data_hora ON public.logs(data_hora);
CREATE INDEX IF NOT EXISTS idx_logs_run_id   ON public.logs(run_id);

-- ---------------------------------------------------------------------------
-- 5. CONFIG_LOCAL — non-secret campaign settings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.config_local (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  chave       TEXT UNIQUE,
  valor       TEXT,
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 6. CUSTOMERS — inbound (from Asaas subscriptions)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         BIGINT REFERENCES public.leads(id) ON DELETE SET NULL,
  nome            TEXT NOT NULL,
  email           TEXT NOT NULL,
  telefone        TEXT,
  cpf_cnpj        TEXT NOT NULL,
  asaas_customer_id TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 7. SUBSCRIPTIONS — Asaas subscriptions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id          UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  lead_id              BIGINT REFERENCES public.leads(id) ON DELETE SET NULL,
  asaas_subscription_id TEXT NOT NULL UNIQUE,
  plan_slug            TEXT NOT NULL,
  status               TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'overdue', 'cancelled')),
  billing_type         TEXT NOT NULL CHECK (billing_type IN ('PIX', 'BOLETO', 'CREDIT_CARD')),
  value_cents          INT NOT NULL,
  payment_url          TEXT,
  next_due_date        DATE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 8. PIPELINE_EVENTS — stage change history
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pipeline_events (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id   BIGINT NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  from_stage TEXT,
  to_stage  TEXT NOT NULL,
  metadata  JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_events_lead_id ON public.pipeline_events(lead_id);

-- ---------------------------------------------------------------------------
-- 9. WEBHOOK_EVENTS — Asaas webhook log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asaas_event_id TEXT NOT NULL UNIQUE,
  event_type     TEXT NOT NULL,
  payload        JSONB NOT NULL,
  processed_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 10. WHATSAPP_MESSAGES — synced from wacli
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  msg_id            TEXT UNIQUE,
  chat_jid          TEXT,
  chat_name         TEXT,
  sender_jid        TEXT,
  sender_name       TEXT,
  ts                BIGINT,
  ts_datetime       TIMESTAMPTZ GENERATED ALWAYS AS (to_timestamp(ts / 1000)) STORED,
  from_me           BOOLEAN DEFAULT FALSE,
  text              TEXT,
  display_text      TEXT,
  quoted_msg_id     TEXT,
  quoted_sender_jid TEXT,
  is_forwarded      BOOLEAN DEFAULT FALSE,
  forwarding_score  INTEGER DEFAULT 0,
  reaction_to_id    TEXT,
  reaction_emoji    TEXT,
  media_type        TEXT,
  media_caption     TEXT,
  filename          TEXT,
  mime_type         TEXT,
  local_path        TEXT,
  downloaded_at     TIMESTAMPTZ,
  revoked           BOOLEAN DEFAULT FALSE,
  deleted_for_me    BOOLEAN DEFAULT FALSE,
  edited            BOOLEAN DEFAULT FALSE,
  edited_ts         BIGINT,
  imported_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wa_msgs_chat_jid   ON public.whatsapp_messages(chat_jid);
CREATE INDEX IF NOT EXISTS idx_wa_msgs_sender_jid ON public.whatsapp_messages(sender_jid);
CREATE INDEX IF NOT EXISTS idx_wa_msgs_ts         ON public.whatsapp_messages(ts);
CREATE INDEX IF NOT EXISTS idx_wa_msgs_from_me    ON public.whatsapp_messages(from_me);

-- ---------------------------------------------------------------------------
-- 11. WHATSAPP_CHATS — conversation metadata
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.whatsapp_chats (
  jid             TEXT PRIMARY KEY,
  kind            TEXT,
  name            TEXT,
  last_message_ts BIGINT,
  last_message_dt TIMESTAMPTZ GENERATED ALWAYS AS (
                    CASE WHEN last_message_ts IS NOT NULL
                         THEN to_timestamp(last_message_ts / 1000)
                         ELSE NULL END
                  ) STORED,
  archived        BOOLEAN DEFAULT FALSE,
  pinned          BOOLEAN DEFAULT FALSE,
  muted_until     BIGINT,
  unread          BOOLEAN DEFAULT FALSE,
  unread_count    INTEGER DEFAULT 0,
  lead_id         BIGINT REFERENCES public.leads(id) ON DELETE SET NULL,
  imported_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wa_chats_kind    ON public.whatsapp_chats(kind);
CREATE INDEX IF NOT EXISTS idx_wa_chats_lead_id ON public.whatsapp_chats(lead_id);
CREATE INDEX IF NOT EXISTS idx_wa_chats_last_ts ON public.whatsapp_chats(last_message_ts);

-- ---------------------------------------------------------------------------
-- 12. WHATSAPP_CONTACTS — contact directory
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.whatsapp_contacts (
  jid           TEXT PRIMARY KEY,
  phone         TEXT,
  push_name     TEXT,
  full_name     TEXT,
  first_name    TEXT,
  business_name TEXT,
  updated_at    TIMESTAMPTZ,
  imported_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wa_contacts_phone         ON public.whatsapp_contacts(phone);
CREATE INDEX IF NOT EXISTS idx_wa_contacts_push_name     ON public.whatsapp_contacts(push_name);

-- ---------------------------------------------------------------------------
-- TRIGGERS
-- ---------------------------------------------------------------------------

-- updated_at for leads
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leads_updated_at ON public.leads;
CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- updated_at for subscriptions
DROP TRIGGER IF EXISTS subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Pipeline event log on stage change
CREATE OR REPLACE FUNCTION public.log_lead_stage_change()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO public.pipeline_events (lead_id, from_stage, to_stage)
    VALUES (NEW.id, OLD.stage, NEW.stage);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leads_stage_change ON public.leads;
CREATE TRIGGER leads_stage_change
  AFTER UPDATE OF stage ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.log_lead_stage_change();

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

-- Helper to ensure permissive policies exist
DO $$ BEGIN
  PERFORM public.rls_auto_enable('public');
END $$;

-- Leads: authenticated can do everything, anon can insert (landing form)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_all_leads" ON public.leads;
CREATE POLICY "authenticated_all_leads" ON public.leads
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_insert_leads" ON public.leads;
CREATE POLICY "anon_insert_leads" ON public.leads
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_leads" ON public.leads;
CREATE POLICY "anon_select_leads" ON public.leads
  FOR SELECT TO anon USING (true);

-- Customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_all_customers" ON public.customers;
CREATE POLICY "authenticated_all_customers" ON public.customers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_all_subscriptions" ON public.subscriptions;
CREATE POLICY "authenticated_all_subscriptions" ON public.subscriptions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Pipeline events
ALTER TABLE public.pipeline_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_all_pipeline_events" ON public.pipeline_events;
CREATE POLICY "authenticated_all_pipeline_events" ON public.pipeline_events
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Webhook events (no client access)
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deny_all_webhook_events" ON public.webhook_events;
CREATE POLICY "deny_all_webhook_events" ON public.webhook_events
  FOR ALL TO authenticated USING (false);

-- Envios
ALTER TABLE public.envios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_all_envios" ON public.envios;
CREATE POLICY "authenticated_all_envios" ON public.envios
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Respostas
ALTER TABLE public.respostas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_all_respostas" ON public.respostas;
CREATE POLICY "authenticated_all_respostas" ON public.respostas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Logs
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_all_logs" ON public.logs;
CREATE POLICY "authenticated_all_logs" ON public.logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Config
ALTER TABLE public.config_local ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_all_config" ON public.config_local;
CREATE POLICY "authenticated_all_config" ON public.config_local
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- WhatsApp tables
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_all_wa_messages" ON public.whatsapp_messages;
CREATE POLICY "authenticated_all_wa_messages" ON public.whatsapp_messages
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.whatsapp_chats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_all_wa_chats" ON public.whatsapp_chats;
CREATE POLICY "authenticated_all_wa_chats" ON public.whatsapp_chats
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_all_wa_contacts" ON public.whatsapp_contacts;
CREATE POLICY "authenticated_all_wa_contacts" ON public.whatsapp_contacts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
