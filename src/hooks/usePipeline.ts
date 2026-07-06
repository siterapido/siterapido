import { useMemo } from 'react';
import { PIPELINE_STAGES, STAGE_LABELS, type Lead, type PipelineStage } from '@/types/crm';

export function usePipeline(leads: Lead[]) {
  return useMemo(() => {
    const columns = PIPELINE_STAGES.filter((s) => s !== 'perdido').map((stage) => ({
      stage,
      label: STAGE_LABELS[stage],
      leads: leads.filter((l) => l.stage === stage),
    }));
    const lost = leads.filter((l) => l.stage === 'perdido');
    return { columns, lost };
  }, [leads]);
}

export function daysInStage(updatedAt: string): number {
  const diff = Date.now() - new Date(updatedAt).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}
