-- CRM schema for Site Rápido
-- Run: supabase db push (or apply via dashboard SQL editor)

-- Extend leads (keep existing columns from landing form)
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS stage text NOT NULL DEFAULT 'novo',
  ADD COLUMN IF NOT EXISTS plan_slug text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS customer_id uuid,
  ADD COLUMN IF NOT EXISTS lost_reason text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_stage_check;

ALTER TABLE public.leads
  ADD CONSTRAINT leads_stage_check CHECK (
    stage IN ('novo', 'qualificado', 'demo', 'proposta', 'aguardando_pagamento', 'ativo', 'perdido')
  );

CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id bigint REFERENCES public.leads(id) ON DELETE SET NULL,
  nome text NOT NULL,
  email text NOT NULL,
  telefone text,
  cpf_cnpj text NOT NULL,
  asaas_customer_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  lead_id bigint REFERENCES public.leads(id) ON DELETE SET NULL,
  asaas_subscription_id text NOT NULL UNIQUE,
  plan_slug text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'overdue', 'cancelled')),
  billing_type text NOT NULL CHECK (billing_type IN ('PIX', 'BOLETO', 'CREDIT_CARD')),
  value_cents int NOT NULL,
  payment_url text,
  next_due_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pipeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id bigint NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  from_stage text,
  to_stage text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asaas_event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leads
  ADD CONSTRAINT leads_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;

-- updated_at trigger
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

DROP TRIGGER IF EXISTS subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- pipeline_events on stage change
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

-- RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Drop old permissive policies if any, then create authenticated-only
DO $$ BEGIN
  DROP POLICY IF EXISTS "authenticated_all_leads" ON public.leads;
  DROP POLICY IF EXISTS "authenticated_all_customers" ON public.customers;
  DROP POLICY IF EXISTS "authenticated_all_subscriptions" ON public.subscriptions;
  DROP POLICY IF EXISTS "authenticated_all_pipeline_events" ON public.pipeline_events;
END $$;

CREATE POLICY "authenticated_all_leads" ON public.leads
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all_customers" ON public.customers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all_subscriptions" ON public.subscriptions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all_pipeline_events" ON public.pipeline_events
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- webhook_events: no client access (service role only via edge functions)
CREATE POLICY "deny_all_webhook_events" ON public.webhook_events
  FOR ALL TO authenticated USING (false);

-- Allow anon insert on leads only (landing form) — adjust if policy already exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'anon_insert_leads'
  ) THEN
    CREATE POLICY "anon_insert_leads" ON public.leads
      FOR INSERT TO anon WITH CHECK (true);
  END IF;
END $$;

-- Block anon read on leads
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'deny_anon_select_leads'
  ) THEN
    CREATE POLICY "deny_anon_select_leads" ON public.leads
      FOR SELECT TO anon USING (false);
  END IF;
END $$;
