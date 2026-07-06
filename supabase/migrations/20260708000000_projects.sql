-- ============================================================================
-- Site Rápido — Project Pipeline (geração de sites)
-- Tracks: briefing → generating → review → approved → corrections → published
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         BIGINT REFERENCES public.leads(id) ON DELETE SET NULL,
  customer_id     UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  
  -- Cliente / Lead info (snapshot at creation)
  cliente_nome    TEXT NOT NULL,
  cliente_email   TEXT,
  cliente_whatsapp TEXT,
  cliente_empresa TEXT,

  -- Briefing (formulário preenchido pelo cliente)
  briefing_respondido BOOLEAN DEFAULT FALSE,
  briefing_enviado_em TIMESTAMPTZ,
  briefing_respondido_em TIMESTAMPTZ,
  briefing_conteudo JSONB,
  briefing_template TEXT,

  -- Pipeline de geração
  status          TEXT NOT NULL DEFAULT 'briefing'
    CHECK (status IN (
      'briefing',           -- aguardando briefing
      'briefing_recebido',  -- briefing recebido, pronto pra gerar
      'gerando',            -- HERMES está gerando o site
      'gerado',             -- site gerado, deploy feito
      'revisao',            -- aguardando revisão do cliente
      'correcoes',          -- cliente pediu correções (HERMES corrigindo)
      'aprovado',           -- cliente aprovou
      'publicado',          -- publicado em produção
      'cancelado'           -- projeto cancelado
    )),

  -- Geração
  repo_url        TEXT,
  deploy_url      TEXT,
  repo_github     TEXT,
  frames_gerados  INTEGER DEFAULT 0,
  gerado_em       TIMESTAMPTZ,
  publicado_em    TIMESTAMPTZ,

  -- Revisão / Correções
  revisao_pedido_em  TIMESTAMPTZ,
  revisao_aprovado_em TIMESTAMPTZ,
  pedidos_correcao   JSONB DEFAULT '[]'::jsonb,
  qtde_correcoes     INTEGER DEFAULT 0,

  -- Planos
  plan_slug       TEXT,
  valor_cents     INTEGER DEFAULT 0,

  -- Timestamps
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_lead_id ON public.projects(lead_id);
CREATE INDEX IF NOT EXISTS idx_projects_customer_id ON public.projects(customer_id);

-- updated_at trigger
DROP TRIGGER IF EXISTS projects_updated_at ON public.projects;
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_all_projects" ON public.projects;
CREATE POLICY "authenticated_all_projects" ON public.projects
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
