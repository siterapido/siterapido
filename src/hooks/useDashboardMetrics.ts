import { useMemo } from 'react';
import { PLAN_CONFIG } from '@/lib/plans';
import {
  PIPELINE_STAGES,
  STAGE_LABELS,
  type Lead,
  type PipelineStage,
  type Subscription,
} from '@/types/crm';

export type DashboardMetrics = {
  totalLeads: number;
  newLeads7d: number;
  activeLeads: number;
  inPipeline: number;
  lostLeads: number;
  pendingSubscriptions: number;
  activeSubscriptions: number;
  estimatedMrrCents: number;
  stageCounts: Record<PipelineStage, number>;
};

function monthlyValueCents(sub: Subscription): number {
  const plan = PLAN_CONFIG[sub.plan_slug];
  if (!plan) return sub.value_cents;
  if (plan.cycle === 'YEARLY') return Math.round(plan.valueCents / 12);
  return plan.valueCents;
}

export function useDashboardMetrics(
  leads: Lead[],
  subscriptions: Subscription[]
): DashboardMetrics {
  return useMemo(() => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const stageCounts = PIPELINE_STAGES.reduce(
      (acc, stage) => {
        acc[stage] = leads.filter((l) => l.stage === stage).length;
        return acc;
      },
      {} as Record<PipelineStage, number>
    );

    const activeSubs = subscriptions.filter((s) => s.status === 'active');
    const estimatedMrrCents = activeSubs.reduce((sum, sub) => sum + monthlyValueCents(sub), 0);

    return {
      totalLeads: leads.length,
      newLeads7d: leads.filter((l) => new Date(l.created_at).getTime() >= sevenDaysAgo).length,
      activeLeads: stageCounts.ativo,
      inPipeline: leads.filter((l) => l.stage !== 'ativo' && l.stage !== 'perdido').length,
      lostLeads: stageCounts.perdido,
      pendingSubscriptions: subscriptions.filter((s) => s.status === 'pending').length,
      activeSubscriptions: activeSubs.length,
      estimatedMrrCents,
      stageCounts,
    };
  }, [leads, subscriptions]);
}

export { STAGE_LABELS };
