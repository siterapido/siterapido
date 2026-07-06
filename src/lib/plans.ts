import type { PlanSlug } from '@/types/crm';

export const PLAN_CONFIG: Record<PlanSlug, { label: string; valueCents: number; cycle: 'MONTHLY' | 'YEARLY' }> = {
  essencial_mensal: { label: 'Essencial mensal', valueCents: 12000, cycle: 'MONTHLY' },
  essencial_anual: { label: 'Essencial anual', valueCents: 99700, cycle: 'YEARLY' },
  empresarial: { label: 'Empresarial', valueCents: 35000, cycle: 'MONTHLY' },
};

export function formatCentsBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
