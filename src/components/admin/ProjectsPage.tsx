import { Link } from 'react-router-dom';
import { Globe, ExternalLink, CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useProjects } from '@/hooks/useProjects';
import { PROJECT_STAGES, PROJECT_STAGE_LABELS, type ProjectStage } from '@/types/crm';
import { cn } from '@/lib/utils';

const STAGE_ICONS: Record<string, typeof Clock> = {
  briefing: Clock,
  briefing_recebido: CheckCircle2,
  gerando: Loader2,
  gerado: Globe,
  revisao: Clock,
  correcoes: AlertCircle,
  aprovado: CheckCircle2,
  publicado: Globe,
  cancelado: AlertCircle,
};

const STAGE_COLORS: Record<string, string> = {
  briefing: 'text-neutral-400',
  briefing_recebido: 'text-blue-600',
  gerando: 'text-amber-600',
  gerado: 'text-green-600',
  revisao: 'text-purple-600',
  correcoes: 'text-orange-600',
  aprovado: 'text-green-600',
  publicado: 'text-[#5a8f1f]',
  cancelado: 'text-red-600',
};

const STAGE_BG: Record<string, string> = {
  briefing: 'bg-neutral-100',
  briefing_recebido: 'bg-blue-50',
  gerando: 'bg-amber-50',
  gerado: 'bg-green-50',
  revisao: 'bg-purple-50',
  correcoes: 'bg-orange-50',
  aprovado: 'bg-green-50',
  publicado: 'bg-[#9CD653]/10',
  cancelado: 'bg-red-50',
};

const PROGRESS_STAGES = PROJECT_STAGES.filter((s) => s !== 'cancelado');

function ProgressPct(status: string): number {
  const s = status === 'cancelado' ? 'publicado' : status;
  const idx = PROGRESS_STAGES.indexOf(s as typeof PROGRESS_STAGES[number]);
  return idx >= 0 ? Math.round((idx / (PROGRESS_STAGES.length - 1)) * 100) : 0;
}

function ProjectCard({ project }: { project: ReturnType<typeof useProjects>['projects'][number] }) {
  const Icon = STAGE_ICONS[project.status] ?? Clock;
  const progress = ProgressPct(project.status);

  return (
    <Link to={`/admin/projetos/${project.id}`} className="block rounded-lg border border-neutral-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={cn('rounded-lg p-2', STAGE_BG[project.status] ?? 'bg-neutral-100')}>
            <Icon className={cn('h-5 w-5', STAGE_COLORS[project.status] ?? 'text-neutral-400', project.status === 'gerando' && 'animate-spin')} />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900">{project.cliente_nome}</h3>
            {project.cliente_empresa && (
              <p className="text-sm text-neutral-500">{project.cliente_empresa}</p>
            )}
          </div>
        </div>
        <Badge
          variant="outline"
          className={cn('border-0', STAGE_BG[project.status] ?? 'bg-neutral-100', STAGE_COLORS[project.status] ?? 'text-neutral-500')}
        >
          {PROJECT_STAGE_LABELS[project.status as ProjectStage] ?? project.status}
        </Badge>
      </div>

      <div className="mt-4">
        <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
          <div className="h-full rounded-full bg-[#9CD653] transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-neutral-400">
          <span>Briefing</span>
          <span>Publicado</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-neutral-500">
        {project.deploy_url && (
          <span className="flex items-center gap-1 text-[#5a8f1f]">
            <ExternalLink className="h-3 w-3" />
            Ver site
          </span>
        )}
        {project.repo_github && (
          <span className="truncate" title={project.repo_github}>
            {project.repo_github.split('/').slice(-2).join('/')}
          </span>
        )}
        {project.qtde_correcoes > 0 && (
          <span>{project.qtde_correcoes} correção(ões)</span>
        )}
        <span>Criado {new Date(project.created_at).toLocaleDateString('pt-BR')}</span>
      </div>
    </Link>
  );
}

export default function ProjectsPage() {
  const { projects, loading, error } = useProjects();

  const activeProjects = projects.filter((p) => p.status !== 'publicado' && p.status !== 'cancelado');
  const doneProjects = projects.filter((p) => p.status === 'publicado' || p.status === 'cancelado');

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Projetos</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Pipeline de geração de sites — do briefing à publicação
        </p>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-neutral-200 py-20">
          <Globe className="mb-4 h-12 w-12 text-neutral-300" />
          <p className="text-sm font-medium text-neutral-600">Nenhum projeto ainda</p>
          <p className="mt-1 text-sm text-neutral-400">
            Projetos são criados automaticamente quando um lead fecha e vira cliente.
          </p>
          <Button variant="outline" className="mt-4" disabled>
            Criar projeto manualmente
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {activeProjects.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-neutral-700">Em andamento</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeProjects.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            </section>
          )}

          {doneProjects.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-neutral-700">Finalizados</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {doneProjects.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
