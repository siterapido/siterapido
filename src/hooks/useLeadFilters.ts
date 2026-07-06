import type { Lead, PipelineStage, PlanSlug } from '@/types/crm';

export type LeadFilters = {
  query: string;
  stage: PipelineStage | 'all';
  plan: PlanSlug | 'all';
  period: 'all' | 'today' | '7d' | '30d';
};

export type LeadSort = 'recent' | 'oldest' | 'name';

export const DEFAULT_FILTERS: LeadFilters = {
  query: '',
  stage: 'all',
  plan: 'all',
  period: 'all',
};

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function matchesQuery(lead: Lead, query: string): boolean {
  if (!query.trim()) return true;
  const q = normalize(query.trim());
  const fields = [lead.nome, lead.email, lead.whatsapp, lead.telefone, lead.mensagem]
    .filter(Boolean)
    .map((f) => normalize(f!));
  return fields.some((f) => f.includes(q));
}

function matchesStage(lead: Lead, stage: LeadFilters['stage']): boolean {
  if (stage === 'all') return true;
  return lead.stage === stage;
}

function matchesPlan(lead: Lead, plan: LeadFilters['plan']): boolean {
  if (plan === 'all') return true;
  return lead.plan_slug === plan;
}

function matchesPeriod(lead: Lead, period: LeadFilters['period']): boolean {
  if (period === 'all') return true;
  const created = new Date(lead.created_at);
  const now = new Date();

  if (period === 'today') {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return created >= startOfToday;
  }
  if (period === '7d') {
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 7);
    return created >= cutoff;
  }
  if (period === '30d') {
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 30);
    return created >= cutoff;
  }
  return true;
}

export function filterLeads(leads: Lead[], filters: LeadFilters): Lead[] {
  return leads.filter(
    (lead) =>
      matchesQuery(lead, filters.query) &&
      matchesStage(lead, filters.stage) &&
      matchesPlan(lead, filters.plan) &&
      matchesPeriod(lead, filters.period)
  );
}

export function sortLeads(leads: Lead[], sort: LeadSort): Lead[] {
  const sorted = [...leads];
  if (sort === 'recent') {
    sorted.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  } else if (sort === 'oldest') {
    sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  } else if (sort === 'name') {
    sorted.sort((a, b) => {
      const nameA = (a.nome?.trim() || a.email || '').toLowerCase();
      const nameB = (b.nome?.trim() || b.email || '').toLowerCase();
      return nameA.localeCompare(nameB, 'pt-BR');
    });
  }
  return sorted;
}

export function hasActiveFilters(filters: LeadFilters): boolean {
  return (
    filters.query.trim() !== '' ||
    filters.stage !== 'all' ||
    filters.plan !== 'all' ||
    filters.period !== 'all'
  );
}
