import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Project } from '@/types/crm';

export function useProject(id: string | undefined) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    if (err) setError(err.message);
    else setProject(data as Project);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const updateStatus = async (status: string) => {
    if (!id) return;
    const { error: err } = await supabase
      .from('projects')
      .update({ status })
      .eq('id', id);
    if (err) throw new Error(err.message);
    await fetchProject();
  };

  const updateBriefing = async (briefing: Record<string, unknown>) => {
    if (!id) return;
    const { error: err } = await supabase
      .from('projects')
      .update({
        briefing_conteudo: briefing,
        briefing_respondido: true,
        briefing_respondido_em: new Date().toISOString(),
        status: 'briefing_recebido',
      })
      .eq('id', id);
    if (err) throw new Error(err.message);
    await fetchProject();
  };

  return { project, loading, error, fetchProject, updateStatus, updateBriefing };
}
