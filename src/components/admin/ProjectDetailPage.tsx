import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Globe, ExternalLink, Github, MessageSquare, CheckCircle2, Loader2, Copy, Terminal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useProject } from '@/hooks/useProject';
import BriefingForm from '@/components/admin/BriefingForm';
import { PROJECT_STAGES, PROJECT_STAGE_LABELS, type ProjectStage, type BriefingData } from '@/types/crm';
import { cn } from '@/lib/utils';

function PipelineBar({ status }: { status: ProjectStage }) {
  const activeStages = PROJECT_STAGES.filter((s) => s !== 'cancelado');
  const idx = activeStages.indexOf(status === 'cancelado' ? 'publicado' : status);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-neutral-500">
        {activeStages.map((s, i) => (
          <div key={s} className="flex flex-col items-center">
            <div className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full',
              i <= idx ? 'bg-[#9CD653] text-neutral-900' : 'bg-neutral-100 text-neutral-400'
            )}>
              {i < idx ? <CheckCircle2 className="h-4 w-4" /> : i === idx ? <div className="h-2.5 w-2.5 rounded-full bg-current" /> : i + 1}
            </div>
            <span className="mt-1.5 hidden whitespace-nowrap sm:inline">{PROJECT_STAGE_LABELS[s].split(' ')[0]}</span>
          </div>
        ))}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
        <div className="h-full rounded-full bg-[#9CD653] transition-all" style={{ width: `${idx >= 0 ? (idx / (activeStages.length - 1)) * 100 : 0}%` }} />
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { project, loading, error, fetchProject, updateStatus, updateBriefing } = useProject(id);
  const [savingBriefing, setSavingBriefing] = useState(false);
  const [tab, setTab] = useState('briefing');
  const [genDialogOpen, setGenDialogOpen] = useState(false);

  const genCommand = `cd ~/siterapido_repo && GITHUB_TOKEN=<seu_token> python3 scripts/site-generator/generate_site.py --project-id ${id}`;

  const copyCommand = () => {
    navigator.clipboard.writeText(genCommand);
    toast.success('Comando copiado');
  };

  const handleStartGeneration = async () => {
    await updateStatus('gerando');
    setGenDialogOpen(true);
  };

  const handleSaveBriefing = async (data: BriefingData) => {
    setSavingBriefing(true);
    try {
      await updateBriefing(data as unknown as Record<string, unknown>);
    } finally {
      setSavingBriefing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        <Skeleton className="mb-4 h-6 w-48" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        <Link to="/admin/projetos" className="mb-6 inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error ?? 'Projeto não encontrado'}</div>
      </div>
    );
  }

  const briefing = project.briefing_conteudo as BriefingData | null;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-6">
      <Link to="/admin/projetos" className="mb-4 inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900">
        <ArrowLeft className="h-4 w-4" /> Projetos
      </Link>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{project.cliente_nome}</h1>
          {project.cliente_empresa && <p className="text-sm text-neutral-500">{project.cliente_empresa}</p>}
        </div>
        <div className="flex items-center gap-2">
          {project.deploy_url && (
            <a href={project.deploy_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-1.5 h-4 w-4" /> Ver site
              </Button>
            </a>
          )}
          <Badge variant="outline" className={cn(
            'border-0',
            project.status === 'publicado' && 'bg-green-50 text-green-700',
            project.status === 'gerando' && 'bg-amber-50 text-amber-700',
            project.status === 'briefing' && 'bg-neutral-100 text-neutral-600',
          )}>
            {PROJECT_STAGE_LABELS[project.status]}
          </Badge>
        </div>
      </header>

      {/* Pipeline progress */}
      <div className="mb-8 rounded-lg border border-neutral-200 p-5">
        <PipelineBar status={project.status} />
      </div>

      {/* Ações rápidas */}
      <div className="mb-8 flex flex-wrap gap-2">
        {project.status === 'briefing_recebido' && (
          <Button onClick={handleStartGeneration}>
            <Loader2 className="mr-1.5 h-4 w-4" /> Iniciar geração
          </Button>
        )}
        {project.status === 'gerado' && (
          <Button onClick={() => updateStatus('revisao')}>
            Enviar para revisão
          </Button>
        )}
        {project.status === 'revisao' && (
          <Button onClick={() => updateStatus('aprovado')}>
            <CheckCircle2 className="mr-1.5 h-4 w-4" /> Aprovar
          </Button>
        )}
        {project.status === 'revisao' && (
          <Button variant="outline" onClick={() => updateStatus('correcoes')}>
            Pedir correções
          </Button>
        )}
        {project.status === 'aprovado' && (
          <Button onClick={() => updateStatus('publicado')}>
            <Globe className="mr-1.5 h-4 w-4" /> Publicar
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="briefing">Briefing</TabsTrigger>
          <TabsTrigger value="deploy">Deploy</TabsTrigger>
          {project.pedidos_correcao?.length > 0 && (
            <TabsTrigger value="correcoes">Correções ({project.qtde_correcoes})</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="briefing" className="mt-6">
          {briefing && project.briefing_respondido ? (
            <div className="rounded-lg border border-neutral-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-900">Briefing respondido</h2>
                <Badge className="bg-green-50 text-green-700 border-0">Respondido em {new Date(project.briefing_respondido_em!).toLocaleDateString('pt-BR')}</Badge>
              </div>
              <BriefingForm initial={briefing} onSave={handleSaveBriefing} readOnly />
            </div>
          ) : (
            <div className="rounded-lg border border-neutral-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-900">Briefing</h2>
                {project.status === 'briefing' && (
                  <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">Aguardando resposta</Badge>
                )}
              </div>
              <div className="space-y-4">
                <p className="text-sm text-neutral-600">
                  Preencha o briefing abaixo para começar a geração do site.
                  Todos os campos são importantes para o Hermes personalizar o template ideal.
                </p>
                <BriefingForm onSave={handleSaveBriefing} saving={savingBriefing} />
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="deploy" className="mt-6">
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-neutral-900">Deploy</h2>
            {project.repo_github ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-lg bg-neutral-50 p-4">
                  <Github className="h-5 w-5 text-neutral-600" />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">Repositório</p>
                    <a href={`https://github.com/${project.repo_github}`} target="_blank" rel="noopener noreferrer" className="text-sm text-[#5a8f1f] hover:underline">
                      {project.repo_github}
                    </a>
                  </div>
                </div>
                {project.deploy_url && (
                  <div className="flex items-center gap-3 rounded-lg bg-neutral-50 p-4">
                    <Globe className="h-5 w-5 text-neutral-600" />
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Site publicado</p>
                      <a href={project.deploy_url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#5a8f1f] hover:underline">
                        {project.deploy_url}
                      </a>
                    </div>
                  </div>
                )}
                {project.gerado_em && (
                  <p className="text-xs text-neutral-400">Gerado em {new Date(project.gerado_em).toLocaleString('pt-BR')}</p>
                )}
                {project.publicado_em && (
                  <p className="text-xs text-neutral-400">Publicado em {new Date(project.publicado_em).toLocaleString('pt-BR')}</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-200 py-12">
                <Globe className="mb-3 h-10 w-10 text-neutral-300" />
                <p className="text-sm text-neutral-500">Ainda não há deploy. Após o briefing e geração, o link aparecerá aqui.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {project.pedidos_correcao?.length > 0 && (
          <TabsContent value="correcoes" className="mt-6">
            <div className="rounded-lg border border-neutral-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-neutral-900">Correções solicitadas</h2>
              <div className="space-y-3">
                {(project.pedidos_correcao as Array<{ data: string; pedido: string; resolvido: boolean }>).map((c, i) => (
                  <div key={i} className={`flex gap-3 rounded-lg border p-4 ${c.resolvido ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
                    <div className={`mt-0.5 h-5 w-5 shrink-0 rounded-full ${c.resolvido ? 'bg-green-500' : 'bg-amber-500'} flex items-center justify-center`}>
                      {c.resolvido ? <CheckCircle2 className="h-3 w-3 text-white" /> : <MessageSquare className="h-3 w-3 text-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{c.pedido}</p>
                      <p className="text-xs text-neutral-500">{new Date(c.data).toLocaleString('pt-BR')} · {c.resolvido ? 'Resolvido' : 'Pendente'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Modal de comando de geração */}
      <Dialog open={genDialogOpen} onOpenChange={setGenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Gerar site
            </DialogTitle>
            <DialogDescription>
              O status foi atualizado para "Gerando". Execute o comando abaixo no terminal para gerar e publicar o site.
              Certifique-se de ter o GITHUB_TOKEN configurado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-neutral-950 p-4">
              <code className="break-all text-sm text-green-400">{genCommand}</code>
            </div>
            <div className="flex gap-2">
              <Button onClick={copyCommand} className="flex-1">
                <Copy className="mr-1.5 h-4 w-4" /> Copiar comando
              </Button>
              <Button variant="outline" onClick={() => setGenDialogOpen(false)}>
                Fechar
              </Button>
            </div>
            <p className="text-xs text-neutral-500">
              Dica: use a skill central-siterapido + gerar-site-siterapido no Hermes.
              Basta pedir "Gera o site do projeto {project.cliente_nome}" que o Hermes executa.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
