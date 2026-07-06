import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Envio, Lead, LeadStatus, Resposta } from '@/types/crm';
import { OUTBOUND_STATUSES } from '@/types/crm';

export interface OutboundStats {
  total: number;
  novo: number;
  enviando: number;
  contatoIniciado: number;
  respondeu: number;
  interessado: number;
  reuniaoMarcada: number;
  optOut: number;
  erro: number;
  duplicado: number;
  enviosHoje: number;
  enviosTotal: number;
  respostasTotal: number;
  taxaResposta: number;
}

function isTodayBrazil(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function countByStatus(leads: Lead[]): Record<LeadStatus, number> {
  const counts = Object.fromEntries(OUTBOUND_STATUSES.map((s) => [s, 0])) as Record<
    LeadStatus,
    number
  >;
  for (const lead of leads) {
    const status = (lead.status ?? 'novo') as LeadStatus;
    if (status in counts) counts[status] += 1;
  }
  return counts;
}

export function useOutbound() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [leadsRes, enviosRes, respostasRes] = await Promise.all([
      supabase
        .from('leads')
        .select('*')
        .or('origem.eq.google_maps,and(source.neq.landing,empresa.not.is.null)')
        .order('updated_at', { ascending: false }),
      supabase.from('envios').select('*').order('data_hora', { ascending: false }).limit(50),
      supabase.from('respostas').select('*').order('data_hora', { ascending: false }).limit(30),
    ]);

    if (leadsRes.error) setError(leadsRes.error.message);
    else setLeads((leadsRes.data as Lead[]) ?? []);

    if (enviosRes.error && !leadsRes.error) setError(enviosRes.error.message);
    else setEnvios((enviosRes.data as Envio[]) ?? []);

    if (respostasRes.error && !leadsRes.error && !enviosRes.error) {
      setError(respostasRes.error.message);
    } else {
      setRespostas((respostasRes.data as Resposta[]) ?? []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const stats = useMemo((): OutboundStats => {
    const byStatus = countByStatus(leads);
    const contacted = byStatus.contato_iniciado + byStatus.respondeu + byStatus.interessado + byStatus.reuniao_marcada;
    const enviosHoje = envios.filter((e) => isTodayBrazil(e.data_hora)).length;

    return {
      total: leads.length,
      novo: byStatus.novo,
      enviando: byStatus.enviando,
      contatoIniciado: byStatus.contato_iniciado,
      respondeu: byStatus.respondeu,
      interessado: byStatus.interessado,
      reuniaoMarcada: byStatus.reuniao_marcada,
      optOut: byStatus.opt_out,
      erro: byStatus.erro,
      duplicado: byStatus.duplicado,
      enviosHoje,
      enviosTotal: envios.length,
      respostasTotal: respostas.length,
      taxaResposta: contacted > 0 ? byStatus.respondeu / contacted : 0,
    };
  }, [leads, envios, respostas]);

  return { leads, envios, respostas, stats, loading, error, refresh: fetchAll };
}
