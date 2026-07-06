export const PIPELINE_STAGES = [
  'novo',
  'qualificado',
  'demo',
  'proposta',
  'aguardando_pagamento',
  'ativo',
  'perdido',
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const STAGE_LABELS: Record<PipelineStage, string> = {
  novo: 'Novo',
  qualificado: 'Qualificado',
  demo: 'Demo / Call',
  proposta: 'Proposta',
  aguardando_pagamento: 'Aguardando pagamento',
  ativo: 'Ativo',
  perdido: 'Perdido',
};

export const PLAN_SLUGS = ['essencial_mensal', 'essencial_anual', 'empresarial'] as const;
export type PlanSlug = (typeof PLAN_SLUGS)[number];

export type SubscriptionStatus = 'pending' | 'active' | 'overdue' | 'cancelled';
export type BillingType = 'PIX' | 'BOLETO' | 'CREDIT_CARD';

export interface Lead {
  id: string;
  nome: string;
  email: string;
  whatsapp?: string | null;
  telefone?: string | null;
  instagram?: string | null;
  plano?: string | null;
  mensagem?: string | null;
  stage: PipelineStage;
  plan_slug: PlanSlug | null;
  notes: string | null;
  customer_id: string | null;
  lost_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  lead_id: string | null;
  nome: string;
  email: string;
  telefone: string | null;
  cpf_cnpj: string;
  asaas_customer_id: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  customer_id: string;
  lead_id: string | null;
  asaas_subscription_id: string;
  plan_slug: PlanSlug;
  status: SubscriptionStatus;
  billing_type: BillingType;
  value_cents: number;
  payment_url: string | null;
  next_due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface PipelineEvent {
  id: string;
  lead_id: string;
  from_stage: PipelineStage | null;
  to_stage: PipelineStage;
  metadata: Record<string, unknown> | null;
  created_at: string;
}
