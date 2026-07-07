-- ============================================================================
-- Site Rápido — DB hardening (security, performance, schema reconciliation)
-- Fixes: RLS, missing columns, FK indexes, function search_path, schema drift
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. LANDING FORM COLUMNS (app inserts nome/email/whatsapp/instagram/plano)
-- ---------------------------------------------------------------------------
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS nome      text,
  ADD COLUMN IF NOT EXISTS email     text,
  ADD COLUMN IF NOT EXISTS whatsapp  text,
  ADD COLUMN IF NOT EXISTS instagram text,
  ADD COLUMN IF NOT EXISTS plano     text;

-- Backfill from existing outbound columns where possible
UPDATE public.leads
SET
  nome     = COALESCE(nome, contato, empresa),
  whatsapp = COALESCE(whatsapp, telefone)
WHERE nome IS NULL OR whatsapp IS NULL;

-- Fix mis-tagged outbound imports (origem=google_maps but source=landing)
UPDATE public.leads
SET source = 'outbound'
WHERE origem = 'google_maps' AND source = 'landing';

-- ---------------------------------------------------------------------------
-- 2. ENVIOS / RESPOSTAS — reconcile with unified schema (lead_id FK)
-- ---------------------------------------------------------------------------
ALTER TABLE public.envios
  ADD COLUMN IF NOT EXISTS lead_id       bigint REFERENCES public.leads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lead_nome     text,
  ADD COLUMN IF NOT EXISTS batch_run_id  text;

ALTER TABLE public.respostas
  ADD COLUMN IF NOT EXISTS lead_id   bigint REFERENCES public.leads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lead_nome text;

-- Backfill lead_id from id_lead text → leads.id_lead
UPDATE public.envios e
SET lead_id = l.id,
    lead_nome = COALESCE(e.lead_nome, e.empresa, l.empresa, l.contato)
FROM public.leads l
WHERE e.lead_id IS NULL
  AND e.id_lead IS NOT NULL
  AND l.id_lead = e.id_lead;

UPDATE public.respostas r
SET lead_id = l.id,
    lead_nome = COALESCE(r.lead_nome, r.empresa, l.empresa, l.contato)
FROM public.leads l
WHERE r.lead_id IS NULL
  AND r.id_lead IS NOT NULL
  AND l.id_lead = r.id_lead;

CREATE INDEX IF NOT EXISTS idx_envios_lead_id   ON public.envios(lead_id);
CREATE INDEX IF NOT EXISTS idx_envios_batch_run ON public.envios(batch_run_id);
CREATE INDEX IF NOT EXISTS idx_respostas_lead_id ON public.respostas(lead_id);

-- ---------------------------------------------------------------------------
-- 3. WHATSAPP_CHATS — link to leads
-- ---------------------------------------------------------------------------
ALTER TABLE public.whatsapp_chats
  ADD COLUMN IF NOT EXISTS lead_id bigint REFERENCES public.leads(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_wa_chats_lead_id ON public.whatsapp_chats(lead_id);

-- Link chats to leads by normalized phone
UPDATE public.whatsapp_chats wc
SET lead_id = l.id
FROM public.leads l
WHERE wc.lead_id IS NULL
  AND wc.jid LIKE '%@s.whatsapp.net'
  AND l.telefone_normalizado IS NOT NULL
  AND regexp_replace(split_part(wc.jid, '@', 1), '\D', '', 'g')
      = regexp_replace(l.telefone_normalizado, '\D', '', 'g');

-- ---------------------------------------------------------------------------
-- 4. PERFORMANCE — FK indexes flagged by Supabase advisor
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_leads_stage        ON public.leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_source       ON public.leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_customer_id  ON public.leads(customer_id);
CREATE INDEX IF NOT EXISTS idx_leads_origem       ON public.leads(origem);
CREATE INDEX IF NOT EXISTS idx_leads_proximo_followup ON public.leads(proximo_followup);
CREATE INDEX IF NOT EXISTS idx_customers_lead_id  ON public.customers(lead_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON public.subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_lead_id     ON public.subscriptions(lead_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_events_lead_id   ON public.pipeline_events(lead_id);

-- ---------------------------------------------------------------------------
-- 5. TRIGGER FUNCTIONS — immutable search_path (security linter)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = pg_catalog.now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_ultima_atualizacao()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.ultima_atualizacao = pg_catalog.now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_lead_stage_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO public.pipeline_events (lead_id, from_stage, to_stage)
    VALUES (NEW.id, OLD.stage, NEW.stage);
  END IF;
  RETURN NEW;
END;
$$;

-- Normalize landing lead fields on insert
CREATE OR REPLACE FUNCTION public.normalize_landing_lead()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.source = 'landing' OR NEW.source IS NULL THEN
    NEW.source := COALESCE(NEW.source, 'landing');
    NEW.contato  := COALESCE(NEW.contato, NEW.nome);
    NEW.telefone := COALESCE(NEW.telefone, NEW.whatsapp);
    NEW.plan_slug := COALESCE(
      NEW.plan_slug,
      CASE NEW.plano
        WHEN 'Mensal'  THEN 'essencial_mensal'
        WHEN 'Anual'   THEN 'essencial_anual'
        WHEN 'Pro'     THEN 'empresarial'
        ELSE NULL
      END
    );
    IF NEW.telefone IS NOT NULL AND NEW.telefone_normalizado IS NULL THEN
      NEW.telefone_normalizado := pg_catalog.regexp_replace(NEW.telefone, '\D', '', 'g');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS leads_normalize_landing ON public.leads;
CREATE TRIGGER leads_normalize_landing
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.normalize_landing_lead();

-- ---------------------------------------------------------------------------
-- 6. REVOKE public execute on internal SECURITY DEFINER helper
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM anon;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM authenticated;

-- ---------------------------------------------------------------------------
-- 7. RLS — remove permissive anon policies, enforce least privilege
-- ---------------------------------------------------------------------------

-- Drop legacy overly-permissive anon policies
DROP POLICY IF EXISTS "anon_all_leads"     ON public.leads;
DROP POLICY IF EXISTS "anon_all_envios"    ON public.envios;
DROP POLICY IF EXISTS "anon_all_respostas" ON public.respostas;
DROP POLICY IF EXISTS "anon_all_logs"      ON public.logs;
DROP POLICY IF EXISTS "anon_all_config"    ON public.config_local;
DROP POLICY IF EXISTS "anon_all_wa_messages" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "anon_all_wa_chats"    ON public.whatsapp_chats;
DROP POLICY IF EXISTS "anon_all_wa_contacts" ON public.whatsapp_contacts;

-- Leads: anon can only INSERT landing form submissions
DROP POLICY IF EXISTS "anon_insert_leads" ON public.leads;
CREATE POLICY "anon_insert_leads" ON public.leads
  FOR INSERT TO anon
  WITH CHECK (
    source = 'landing'
    AND nome IS NOT NULL
    AND email IS NOT NULL
    AND (whatsapp IS NOT NULL OR telefone IS NOT NULL)
  );

-- Leads: block anon read (admin uses authenticated)
DROP POLICY IF EXISTS "deny_anon_select_leads" ON public.leads;
CREATE POLICY "deny_anon_select_leads" ON public.leads
  FOR SELECT TO anon USING (false);

-- Leads: authenticated admin full access
DROP POLICY IF EXISTS "authenticated_all_leads" ON public.leads;
CREATE POLICY "authenticated_all_leads" ON public.leads
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Admin-only tables (authenticated)
DROP POLICY IF EXISTS "authenticated_all_envios" ON public.envios;
CREATE POLICY "authenticated_all_envios" ON public.envios
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_all_respostas" ON public.respostas;
CREATE POLICY "authenticated_all_respostas" ON public.respostas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_all_logs" ON public.logs;
CREATE POLICY "authenticated_all_logs" ON public.logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_all_config" ON public.config_local;
CREATE POLICY "authenticated_all_config" ON public.config_local
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_all_wa_messages" ON public.whatsapp_messages;
CREATE POLICY "authenticated_all_wa_messages" ON public.whatsapp_messages
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_all_wa_chats" ON public.whatsapp_chats;
CREATE POLICY "authenticated_all_wa_chats" ON public.whatsapp_chats
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_all_wa_contacts" ON public.whatsapp_contacts;
CREATE POLICY "authenticated_all_wa_contacts" ON public.whatsapp_contacts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Customers / subscriptions / projects / pipeline (ensure authenticated policies exist)
DROP POLICY IF EXISTS "authenticated_all_customers" ON public.customers;
CREATE POLICY "authenticated_all_customers" ON public.customers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_all_subscriptions" ON public.subscriptions;
CREATE POLICY "authenticated_all_subscriptions" ON public.subscriptions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_all_pipeline_events" ON public.pipeline_events;
CREATE POLICY "authenticated_all_pipeline_events" ON public.pipeline_events
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_all_projects" ON public.projects;
CREATE POLICY "authenticated_all_projects" ON public.projects
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- webhook_events: deny client access (service_role only)
DROP POLICY IF EXISTS "deny_all_webhook_events" ON public.webhook_events;
CREATE POLICY "deny_all_webhook_events" ON public.webhook_events
  FOR ALL TO authenticated USING (false);
