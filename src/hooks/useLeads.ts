import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Lead, PipelineStage } from '@/types/crm';

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('leads')
      .select('*')
      .order('updated_at', { ascending: false });
    if (err) setError(err.message);
    else setLeads((data as Lead[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const updateStage = async (leadId: number, stage: PipelineStage, lostReason?: string) => {
    const payload: Partial<Lead> = { stage };
    if (stage === 'perdido' && lostReason) payload.lost_reason = lostReason;
    const { error: err } = await supabase.from('leads').update(payload).eq('id', leadId);
    if (err) throw new Error(err.message);
    await fetchLeads();
  };

  return { leads, loading, error, fetchLeads, updateStage };
}
