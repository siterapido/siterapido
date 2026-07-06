import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Project, ProjectStage } from '@/types/crm';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false });
    if (err) setError(err.message);
    else setProjects((data as Project[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const updateStatus = async (projectId: string, status: ProjectStage) => {
    const { error: err } = await supabase
      .from('projects')
      .update({ status })
      .eq('id', projectId);
    if (err) throw new Error(err.message);
    await fetchProjects();
  };

  return { projects, loading, error, fetchProjects, updateStatus };
}
