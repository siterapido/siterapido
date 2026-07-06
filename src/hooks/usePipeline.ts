import { useMemo } from 'react';
import { sortLeads, type LeadSort } from '@/hooks/useLeadFilters';
import { PIPELINE_STAGES, STAGE_LABELS, type Lead, type PipelineStage } from '@/types/crm';

export function usePipeline(leads: Lead[], sort: LeadSort = 'recent') {
  return useMemo(() => {
    const sorted = sortLeads(leads, sort);
    const columns = PIPELINE_STAGES.filter((s) => s !== 'perdido').map((stage) => ({
      stage,
      label: STAGE_LABELS[stage],
      leads: sorted.filter((l) => l.stage === stage),
    }));
    const lost = sorted.filter((l) => l.stage === 'perdido');
    return { columns, lost };
  }, [leads, sort]);
}

export function daysInStage(updatedAt: string): number {
  const diff = Date.now() - new Date(updatedAt).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}
