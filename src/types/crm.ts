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

// Outbound lead statuses
export type LeadStatus =
  | 'novo'
  | 'enviando'
  | 'contato_iniciado'
  | 'respondeu'
  | 'interessado'
  | 'reuniao_marcada'
  | 'opt_out'
  | 'erro'
  | 'duplicado';

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  novo: 'Novo',
  enviando: 'Enviando',
  contato_iniciado: 'Contato iniciado',
  respondeu: 'Respondeu',
  interessado: 'Interessado',
  reuniao_marcada: 'Reunião marcada',
  opt_out: 'Opt-out',
  erro: 'Erro',
  duplicado: 'Duplicado',
};

// Reply classifications
export type ReplyClassification =
  | 'permission_to_send'
  | 'interessado'
  | 'pricing_question'
  | 'meeting_ready'
  | 'opt_out'
  | 'ambiguous';

export const REPLY_CLASSIFICATION_LABELS: Record<ReplyClassification, string> = {
  permission_to_send: 'Permissão para mostrar',
  interessado: 'Interessado',
  pricing_question: 'Perguntou preço',
  meeting_ready: 'Pronto pra reunião',
  opt_out: 'Opt-out',
  ambiguous: 'Ambíguo',
};

export interface Lead {
  id: number;
  id_lead?: string;
  nome: string;
  email: string;
  whatsapp?: string | null;
  whatsapp_jid?: string | null;
  telefone?: string | null;
  instagram?: string | null;
  empresa?: string | null;
  contato?: string | null;
  cidade?: string | null;
  nicho?: string | null;
  site?: string | null;
  plano?: string | null;
  mensagem?: string | null;
  stage: PipelineStage;
  status?: string;
  plan_slug: string | null;
  notes: string | null;
  customer_id: string | null;
  lost_reason: string | null;
  source?: string | null;
  origem?: string | null;
  tipo_lead?: string | null;
  mensagem_variante?: string | null;
  dor_principal?: string | null;
  oportunidade?: string | null;
  ultimo_contato_em?: string | null;
  proximo_followup?: string | null;
  qtde_followups?: number;
  respondeu?: boolean;
  classificacao_resposta?: string | null;
  telefone_normalizado?: string | null;
  empresa_normalizado?: string | null;
  place_id?: string | null;
  observacoes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  lead_id: number | null;
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
  lead_id: number | null;
  asaas_subscription_id: string;
  plan_slug: string;
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
  lead_id: number;
  from_stage: string | null;
  to_stage: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Envio {
  id: number;
  data_hora: string;
  lead_id: number | null;
  lead_nome: string | null;
  telefone: string;
  mensagem: string;
  status: string;
  provider_msg_id: string | null;
  destino_jid: string | null;
  erro: string | null;
  campanha: string | null;
  mensagem_variante: string | null;
  batch_run_id: string | null;
}

export interface Resposta {
  id: number;
  data_hora: string;
  lead_id: number | null;
  lead_nome: string | null;
  telefone_jid: string | null;
  mensagem_recebida: string;
  classificacao: string | null;
  acao_tomada: string | null;
  proximo_passo: string | null;
}

export interface WhatsAppMessage {
  id: number;
  msg_id: string | null;
  chat_jid: string;
  chat_name: string | null;
  sender_jid: string;
  sender_name: string | null;
  ts: number;
  ts_datetime: string;
  from_me: boolean;
  text: string | null;
  display_text: string | null;
  quoted_msg_id: string | null;
  is_forwarded: boolean;
  reaction_emoji: string | null;
  media_type: string | null;
  media_caption: string | null;
  imported_at: string;
}

export interface WhatsAppChat {
  jid: string;
  kind: string;
  name: string | null;
  last_message_ts: number | null;
  last_message_dt: string | null;
  archived: boolean;
  pinned: boolean;
  unread: boolean;
  unread_count: number;
  lead_id: number | null;
  imported_at: string;
}

export interface WhatsAppContact {
  jid: string;
  phone: string | null;
  push_name: string | null;
  full_name: string | null;
  first_name: string | null;
  business_name: string | null;
}

// ─── Briefing / LP Templates ─────────────────────────────────────────

export interface BriefingData {
  // Empresa
  empresa_nome: string;
  empresa_ramo: string;
  empresa_descricao: string;
  empresa_diferencial: string;

  // Público
  publico_alvo: string;
  publico_dor: string;

  // Design
  cores_primaria: string;
  cores_secundaria: string;
  estilo: 'moderno' | 'classico' | 'minimalista' | 'criativo' | 'corporativo';
  inspiracao_url: string;
  tom_voz: string;

  // Conteúdo
  secoes: string[];       // hero, sobre, servicos, portfolio, depoimentos, contato, faq, blog
  tem_logo: boolean;
  tem_fotos_proprias: boolean;

  // Funcionalidades
  funcionalidades: string[]; // blog, galeria, whatsapp, formulario, depoimentos, etc.
  integracoes: string[];     // instagram, google_maps, youtube, etc.

  // Chamada
  cta_principal: string;
  cta_secundario: string;

  // SEO
  palavras_chave: string;
  google_analytics: boolean;

  // Domínio
  dominio_pronto: boolean;
  dominio_url: string;

  // Prazo
  prazo_dias: number;
  observacoes: string;
}

export const SECOES_DISPONIVEIS = [
  { value: 'hero', label: 'Hero (capa)' },
  { value: 'sobre', label: 'Sobre nós' },
  { value: 'servicos', label: 'Serviços' },
  { value: 'portfolio', label: 'Portfólio' },
  { value: 'depoimentos', label: 'Depoimentos' },
  { value: 'contato', label: 'Contato' },
  { value: 'faq', label: 'FAQ' },
  { value: 'blog', label: 'Blog' },
] as const;

export const FUNCIONALIDADES_DISPONIVEIS = [
  { value: 'whatsapp', label: 'Botão WhatsApp flutuante' },
  { value: 'formulario', label: 'Formulário de contato' },
  { value: 'galeria', label: 'Galeria de imagens' },
  { value: 'blog', label: 'Blog' },
  { value: 'depoimentos', label: 'Carrossel de depoimentos' },
  { value: 'orcamento', label: 'Solicitar orçamento' },
] as const;

export const INTEGRACOES_DISPONIVEIS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'google_maps', label: 'Google Maps' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'linkedin', label: 'LinkedIn' },
] as const;

export const ESTILOS = [
  { value: 'moderno', label: 'Moderno', desc: 'Design contemporâneo com gradientes e animações' },
  { value: 'classico', label: 'Clássico', desc: 'Layout tradicional e elegante' },
  { value: 'minimalista', label: 'Minimalista', desc: 'Limpo, espaçado e focado no conteúdo' },
  { value: 'criativo', label: 'Criativo', desc: 'Ousado, com elementos visuais marcantes' },
  { value: 'corporativo', label: 'Corporativo', desc: 'Sóbrio e profissional, ideal para B2B' },
] as const;

export interface LpTemplate {
  id: string;
  nome: string;
  descricao: string;
  estilo: string;
  thumbnail: string;
  features: string[];
  secoes_padrao: string[];
}

// Project pipeline stages
export const PROJECT_STAGES = [
  'briefing',
  'briefing_recebido',
  'gerando',
  'gerado',
  'revisao',
  'correcoes',
  'aprovado',
  'publicado',
  'cancelado',
] as const;

export type ProjectStage = (typeof PROJECT_STAGES)[number];

export const PROJECT_STAGE_LABELS: Record<ProjectStage, string> = {
  briefing: 'Aguardando briefing',
  briefing_recebido: 'Briefing recebido',
  gerando: 'Gerando site',
  gerado: 'Site gerado',
  revisao: 'Em revisão',
  correcoes: 'Correções',
  aprovado: 'Aprovado',
  publicado: 'Publicado',
  cancelado: 'Cancelado',
};

export interface Project {
  id: string;
  lead_id: number | null;
  customer_id: string | null;
  cliente_nome: string;
  cliente_email: string | null;
  cliente_whatsapp: string | null;
  cliente_empresa: string | null;
  briefing_respondido: boolean;
  briefing_enviado_em: string | null;
  briefing_respondido_em: string | null;
  briefing_conteudo: Record<string, unknown> | null;
  briefing_template: string | null;
  status: ProjectStage;
  repo_url: string | null;
  deploy_url: string | null;
  repo_github: string | null;
  frames_gerados: number;
  gerado_em: string | null;
  publicado_em: string | null;
  revisao_pedido_em: string | null;
  revisao_aprovado_em: string | null;
  pedidos_correcao: Array<{ data: string; pedido: string; resolvido: boolean }>;
  qtde_correcoes: number;
  plan_slug: string | null;
  valor_cents: number;
  created_at: string;
  updated_at: string;
}
