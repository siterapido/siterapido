import type { ComponentType } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, Users, UserPlus, CreditCard, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardMetrics, STAGE_LABELS } from '@/hooks/useDashboardMetrics';
import { useLeads } from '@/hooks/useLeads';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { formatCentsBRL } from '@/lib/plans';
import { cn } from '@/lib/utils';
import { PIPELINE_STAGES, type PipelineStage } from '@/types/crm';

function MetricCard({
  label,
  value,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-500">{label}</p>
          <p
            className={cn(
              'mt-1 text-3xl font-bold',
              accent ? 'text-[#5a8f1f]' : 'text-neutral-950'
            )}
          >
            {value}
          </p>
        </div>
        <div
          className={cn(
            'rounded-lg p-2',
            accent ? 'bg-[#9CD653]/15 text-[#5a8f1f]' : 'bg-neutral-100 text-neutral-600'
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function StageBar({ stage, count, total }: { stage: PipelineStage; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <Link
      to={`/admin/pipeline?stage=${stage}`}
      className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-neutral-50"
    >
      <span className="w-28 shrink-0 text-sm text-neutral-600 group-hover:text-neutral-950">
        {STAGE_LABELS[stage]}
      </span>
      <div className="min-w-0 flex-1">
        <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-full rounded-full bg-[#9CD653] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <span className="w-8 shrink-0 text-right text-sm font-medium text-neutral-900">{count}</span>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-neutral-300 opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}

export default function ResumoPage() {
  const { leads, loading: leadsLoading, error: leadsError } = useLeads();
  const { subscriptions, loading: subsLoading, error: subsError } = useSubscriptions();

  const loading = leadsLoading || subsLoading;
  const error = leadsError || subsError;
  const metrics = useDashboardMetrics(leads, subscriptions);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Resumo</h1>
        <p className="mt-1 text-sm text-neutral-500">Visão geral do pipeline e assinaturas</p>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Erro ao carregar dados: {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard label="Total de leads" value={metrics.totalLeads} icon={Users} />
            <MetricCard label="Novos (7 dias)" value={metrics.newLeads7d} icon={UserPlus} accent />
            <MetricCard label="Ativos" value={metrics.activeLeads} icon={TrendingUp} accent />
            <MetricCard label="Em pipeline" value={metrics.inPipeline} icon={Clock} />
            <MetricCard
              label="MRR estimado"
              value={formatCentsBRL(metrics.estimatedMrrCents)}
              icon={CreditCard}
              accent
            />
            <MetricCard
              label="Assinaturas pendentes"
              value={metrics.pendingSubscriptions}
              icon={CreditCard}
            />
          </div>

          <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-900">Leads por etapa</h2>
              <Link
                to="/admin/pipeline"
                className="text-xs font-medium text-[#5a8f1f] hover:underline"
              >
                Ver pipeline
              </Link>
            </div>
            <div className="space-y-1">
              {PIPELINE_STAGES.map((stage) => (
                <StageBar
                  key={stage}
                  stage={stage}
                  count={metrics.stageCounts[stage]}
                  total={metrics.totalLeads}
                />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
