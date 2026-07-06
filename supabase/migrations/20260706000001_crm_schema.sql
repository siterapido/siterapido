-- ============================================================================
-- Site Rápido — CRM Outbound Schema (Supabase)
-- Tables: leads, envios, respostas, logs, config_local
-- ============================================================================

-- ---------------------------------------------------------------------------
-- LEADS — canonical lead database
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leads (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_lead         TEXT UNIQUE,
  empresa         TEXT,
  contato         TEXT,
  telefone        TEXT,
  whatsapp_jid    TEXT,
  cidade          TEXT,
  nicho           TEXT,
  site            TEXT,
  origem          TEXT DEFAULT 'google_maps',
  tipo_lead       TEXT DEFAULT 'pessoa',
  status          TEXT DEFAULT 'novo',
  mensagem_variante TEXT DEFAULT 'recomendada',
  dor_principal   TEXT,
  oportunidade    TEXT,
  ultimo_contato_em TIMESTAMPTZ,
  proximo_followup  TIMESTAMPTZ,
  qtde_followups  INTEGER DEFAULT 0,
  respondeu       BOOLEAN DEFAULT FALSE,
  classificacao_resposta TEXT,
  data_criacao    TIMESTAMPTZ DEFAULT now(),
  ultima_atualizacao TIMESTAMPTZ DEFAULT now(),
  observacoes     TEXT,
  -- dedupe helpers
  telefone_normalizado TEXT,
  empresa_normalizado  TEXT,
  place_id             TEXT
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_telefone_normalizado ON public.leads(telefone_normalizado);
CREATE INDEX IF NOT EXISTS idx_leads_empresa_normalizado ON public.leads(empresa_normalizado);
CREATE INDEX IF NOT EXISTS idx_leads_cidade ON public.leads(cidade);

-- ---------------------------------------------------------------------------
-- ENVIOS — one row per outbound send attempt
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.envios (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  data_hora       TIMESTAMPTZ DEFAULT now(),
  id_lead         TEXT,
  empresa         TEXT,
  telefone        TEXT,
  mensagem        TEXT,
  status          TEXT,
  provider_msg_id TEXT,
  destino_jid     TEXT,
  erro            TEXT,
  campanha        TEXT,
  mensagem_variante TEXT
);

CREATE INDEX IF NOT EXISTS idx_envios_data_hora ON public.envios(data_hora);
CREATE INDEX IF NOT EXISTS idx_envios_id_lead ON public.envios(id_lead);
CREATE INDEX IF NOT EXISTS idx_envios_status ON public.envios(status);

-- ---------------------------------------------------------------------------
-- RESPOSTAS — captured inbound replies and classifications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.respostas (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  data_hora       TIMESTAMPTZ DEFAULT now(),
  id_lead         TEXT,
  empresa         TEXT,
  telefone_jid    TEXT,
  mensagem_recebida TEXT,
  classificacao   TEXT,
  acao_tomada     TEXT,
  proximo_passo   TEXT
);

CREATE INDEX IF NOT EXISTS idx_respostas_id_lead ON public.respostas(id_lead);
CREATE INDEX IF NOT EXISTS idx_respostas_data_hora ON public.respostas(data_hora);

-- ---------------------------------------------------------------------------
-- LOGS — operational events, errors, imports, sync runs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.logs (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  data_hora       TIMESTAMPTZ DEFAULT now(),
  sistema         TEXT,
  acao            TEXT,
  status          TEXT,
  detalhes        TEXT,
  run_id          TEXT
);

CREATE INDEX IF NOT EXISTS idx_logs_data_hora ON public.logs(data_hora);
CREATE INDEX IF NOT EXISTS idx_logs_run_id ON public.logs(run_id);

-- ---------------------------------------------------------------------------
-- CONFIG_LOCAL — non-secret campaign settings visible to the user
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.config_local (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  chave           TEXT UNIQUE,
  valor           TEXT,
  atualizado_em   TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- Using anon key (authenticated via API), so we allow access via the
-- supabase_anon role. For production, restrict to service_role key.
-- ---------------------------------------------------------------------------
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.envios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_local ENABLE ROW LEVEL SECURITY;

-- Allow anon role full access (since we use the anon key client-side)
-- In production with a service_role key, these policies are bypassed anyway.
CREATE POLICY "anon_all_leads"     ON public.leads     FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_envios"    ON public.envios    FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_respostas" ON public.respostas FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_logs"      ON public.logs      FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_config"    ON public.config_local FOR ALL TO anon USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- UPDATED_AT trigger for leads
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_ultima_atualizacao()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ultima_atualizacao = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_leads_updated ON public.leads;
CREATE TRIGGER trg_leads_updated
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ultima_atualizacao();
