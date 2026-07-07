import { useMemo, useState, type ComponentType } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  Target,
  Terminal,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TablePagination from '@/components/admin/TablePagination';
import { useOutbound } from '@/hooks/useOutbound';
import { usePaginatedSlice } from '@/hooks/usePaginatedSlice';
import { cn } from '@/lib/utils';
import {
  LEAD_STATUS_LABELS,
  OUTBOUND_STATUSES,
  REPLY_CLASSIFICATION_LABELS,
  type Envio,
  type Lead,
  type LeadStatus,
  type ReplyClassification,
  type Resposta,
} from '@/types/crm';

const FUNNEL_STATUSES: LeadStatus[] = [
  'novo',
  'enviando',
  'contato_iniciado',
  'respondeu',
  'interessado',
  'reuniao_marcada',
];

const STATUS_BADGE: Record<LeadStatus, string> = {
  novo: 'border-neutral-200 bg-neutral-100 text-neutral-700',
  enviando: 'border-blue-200 bg-blue-50 text-blue-700',
  contato_iniciado: 'border-purple-200 bg-purple-50 text-purple-700',
  respondeu: 'border-green-200 bg-green-50 text-green-700',
  interessado: 'border-green-200 bg-green-50 text-[#5a8f1f]',
  reuniao_marcada: 'border-[#9CD653]/40 bg-[#9CD653]/15 text-[#5a8f1f]',
  opt_out: 'border-neutral-200 bg-neutral-50 text-neutral-400',
  erro: 'border-red-200 bg-red-50 text-red-700',
  duplicado: 'border-neutral-200 bg-neutral-50 text-neutral-500',
};

const ENVIO_STATUS_LABELS: Record<string, string> = {
  success: 'Enviado',
  error: 'Erro',
  error_463: 'Bloqueado',
  auth_error: 'Auth',
  dry_run: 'Preview',
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function leadDisplayName(lead: Lead): string {
  return lead.empresa || lead.contato || lead.nome || lead.id_lead || `#${lead.id}`;
}

function MetricCard({
  label,
  value,
  icon: Icon,
  accent = false,
  suffix,
}: {
  label: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
  accent?: boolean;
  suffix?: string;
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
            {suffix && <span className="ml-1 text-lg font-semibold text-neutral-500">{suffix}</span>}
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

function StatusBar({
  status,
  count,
  total,
  onClick,
  active,
}: {
  status: LeadStatus;
  count: number;
  total: number;
  onClick: () => void;
  active: boolean;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors',
        active ? 'bg-[#9CD653]/10' : 'hover:bg-neutral-50'
      )}
    >
      <span className="w-32 shrink-0 text-sm text-neutral-600">{LEAD_STATUS_LABELS[status]}</span>
      <div className="min-w-0 flex-1">
        <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
          <div className="h-full rounded-full bg-[#9CD653]" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <span className="w-8 shrink-0 text-right text-sm font-medium text-neutral-900">{count}</span>
    </button>
  );
}

function LeadStatusBadge({ status }: { status: string }) {
  const key = (OUTBOUND_STATUSES.includes(status as LeadStatus) ? status : 'novo') as LeadStatus;
  return (
    <Badge variant="outline" className={cn('border-0', STATUS_BADGE[key])}>
      {LEAD_STATUS_LABELS[key]}
    </Badge>
  );
}

function EnvioStatusBadge({ status }: { status: string }) {
  const isSuccess = status === 'success';
  const isError = status === 'error' || status === 'error_463';
  return (
    <Badge
      variant="outline"
      className={cn(
        'border-0',
        isSuccess && 'bg-green-50 text-green-700',
        isError && 'bg-red-50 text-red-700',
        status === 'auth_error' && 'bg-amber-50 text-amber-700',
        !isSuccess && !isError && status !== 'auth_error' && 'bg-neutral-100 text-neutral-600'
      )}
    >
      {ENVIO_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

function ReplyBadge({ classification }: { classification: string | null }) {
  if (!classification) return <span className="text-neutral-400">—</span>;
  const label =
    REPLY_CLASSIFICATION_LABELS[classification as ReplyClassification] ?? classification;
  const positive = ['interessado', 'meeting_ready', 'permission_to_send'].includes(classification);
  const negative = classification === 'opt_out';
  return (
    <Badge
      variant="outline"
      className={cn(
        'border-0',
        positive && 'bg-green-50 text-green-700',
        negative && 'bg-neutral-100 text-neutral-500',
        !positive && !negative && 'bg-neutral-100 text-neutral-600'
      )}
    >
      {label}
    </Badge>
  );
}

function CopyCommand({ label, command }: { label: string; command: string }) {
  const copy = async () => {
    await navigator.clipboard.writeText(command);
    toast.success('Comando copiado');
  };

  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-neutral-600">{label}</p>
        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={copy}>
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </div>
      <code className="block whitespace-pre-wrap break-all font-mono text-xs text-neutral-700">
        {command}
      </code>
    </div>
  );
}


function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-200 py-16 text-center">
      <Icon className="mb-3 h-10 w-10 text-neutral-300" />
      <p className="text-sm font-medium text-neutral-600">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-neutral-400">{description}</p>
    </div>
  );
}

export default function OutboundPage() {
  const { leads, envios, respostas, stats, loading, error, refresh } = useOutbound();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const statusCounts = useMemo(() => {
    const map = Object.fromEntries(OUTBOUND_STATUSES.map((s) => [s, 0])) as Record<LeadStatus, number>;
    for (const lead of leads) {
      const s = (lead.status ?? 'novo') as LeadStatus;
      if (s in map) map[s] += 1;
    }
    return map;
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((lead) => {
      if (statusFilter !== 'all' && (lead.status ?? 'novo') !== statusFilter) return false;
      if (!q) return true;
      const haystack = [
        lead.empresa,
        lead.contato,
        lead.nome,
        lead.cidade,
        lead.nicho,
        lead.telefone,
        lead.whatsapp,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [leads, search, statusFilter]);

  const leadsPagination = usePaginatedSlice(
    filteredLeads,
    `${search}|${statusFilter}`
  );
  const enviosPagination = usePaginatedSlice(envios, 'envios');
  const respostasPagination = usePaginatedSlice(respostas, 'respostas');

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-6">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Outbound</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Prospecção ativa via WhatsApp — Apify + wacli
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loading || refreshing}
          className="gap-2"
        >
          <RefreshCw className={cn('h-4 w-4', (loading || refreshing) && 'animate-spin')} />
          Atualizar
        </Button>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Erro ao carregar dados: {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-lg" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Leads na fila" value={stats.novo} icon={Users} />
            <MetricCard label="Contato iniciado" value={stats.contatoIniciado} icon={Send} />
            <MetricCard label="Responderam" value={stats.respondeu} icon={MessageSquare} accent />
            <MetricCard
              label="Taxa de resposta"
              value={(stats.taxaResposta * 100).toFixed(0)}
              suffix="%"
              icon={TrendingUp}
              accent={stats.taxaResposta > 0}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm lg:col-span-2">
              <h2 className="mb-4 text-sm font-semibold text-neutral-900">Funil de prospecção</h2>
              <div className="space-y-1">
                {FUNNEL_STATUSES.map((status) => (
                  <StatusBar
                    key={status}
                    status={status}
                    count={statusCounts[status]}
                    total={stats.total}
                    active={statusFilter === status}
                    onClick={() =>
                      setStatusFilter((prev) => (prev === status ? 'all' : status))
                    }
                  />
                ))}
              </div>
              {statusFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className="mt-3 text-xs font-medium text-[#5a8f1f] hover:underline"
                >
                  Limpar filtro
                </button>
              )}
            </section>

            <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-neutral-900">Hoje</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-neutral-500">Envios</dt>
                  <dd className="font-semibold text-neutral-900">{stats.enviosHoje}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-neutral-500">Interessados</dt>
                  <dd className="font-semibold text-[#5a8f1f]">{stats.interessado}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-neutral-500">Reuniões</dt>
                  <dd className="font-semibold text-neutral-900">{stats.reuniaoMarcada}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-neutral-500">Opt-out / erro</dt>
                  <dd className="font-semibold text-neutral-600">
                    {stats.optOut + stats.erro}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 border-t border-neutral-100 pt-4">
                <Link
                  to="/admin/whatsapp"
                  className="text-xs font-medium text-[#5a8f1f] hover:underline"
                >
                  Ver conversas no WhatsApp →
                </Link>
              </div>
            </section>
          </div>

          <Tabs defaultValue="leads" className="w-full">
            <TabsList className="bg-neutral-100">
              <TabsTrigger value="leads">Leads ({leads.length})</TabsTrigger>
              <TabsTrigger value="envios">Envios ({envios.length})</TabsTrigger>
              <TabsTrigger value="respostas">Respostas ({respostas.length})</TabsTrigger>
              <TabsTrigger value="comandos">Comandos</TabsTrigger>
            </TabsList>

            <TabsContent value="leads" className="mt-4">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="relative min-w-[200px] flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
                  <Input
                    placeholder="Buscar empresa, cidade, telefone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                {statusFilter !== 'all' && (
                  <Badge variant="outline" className="border-[#9CD653]/40 bg-[#9CD653]/10 text-[#5a8f1f]">
                    {LEAD_STATUS_LABELS[statusFilter]}
                  </Badge>
                )}
              </div>

              {filteredLeads.length === 0 ? (
                <EmptyState
                  icon={Target}
                  title="Nenhum lead outbound"
                  description="Importe leads pelo Apify ou ajuste os filtros de busca."
                />
              ) : (
                <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Cidade</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Último contato</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leadsPagination.visible.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-neutral-900">{leadDisplayName(lead)}</p>
                              {lead.nicho && (
                                <p className="text-xs text-neutral-500">{lead.nicho}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-neutral-600">{lead.cidade ?? '—'}</TableCell>
                          <TableCell className="font-mono text-xs text-neutral-600">
                            {lead.telefone ?? lead.whatsapp ?? '—'}
                          </TableCell>
                          <TableCell>
                            <LeadStatusBadge status={lead.status ?? 'novo'} />
                          </TableCell>
                          <TableCell className="text-sm text-neutral-500">
                            {lead.ultimo_contato_em
                              ? formatDateTime(lead.ultimo_contato_em)
                              : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <TablePagination
                    page={leadsPagination.page}
                    totalPages={leadsPagination.totalPages}
                    totalItems={leadsPagination.total}
                    onPageChange={leadsPagination.setPage}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="envios" className="mt-4">
              {envios.length === 0 ? (
                <EmptyState
                  icon={Send}
                  title="Nenhum envio registrado"
                  description="Execute um dry-run ou lote real para ver o histórico aqui."
                />
              ) : (
                <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Lead</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Mensagem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enviosPagination.visible.map((envio: Envio) => (
                        <TableRow key={envio.id}>
                          <TableCell className="whitespace-nowrap text-sm text-neutral-500">
                            {formatDateTime(envio.data_hora)}
                          </TableCell>
                          <TableCell className="font-medium text-neutral-900">
                            {envio.lead_nome ?? '—'}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-neutral-600">
                            {envio.telefone}
                          </TableCell>
                          <TableCell>
                            <EnvioStatusBadge status={envio.status} />
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-sm text-neutral-500">
                            {envio.erro ? (
                              <span className="text-red-600" title={envio.erro}>
                                {envio.erro}
                              </span>
                            ) : (
                              envio.mensagem
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <TablePagination
                    page={enviosPagination.page}
                    totalPages={enviosPagination.totalPages}
                    totalItems={enviosPagination.total}
                    onPageChange={enviosPagination.setPage}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="respostas" className="mt-4">
              {respostas.length === 0 ? (
                <EmptyState
                  icon={MessageSquare}
                  title="Nenhuma resposta capturada"
                  description="Respostas aparecem após inbox_scan classificar mensagens recebidas."
                />
              ) : (
                <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Lead</TableHead>
                        <TableHead>Classificação</TableHead>
                        <TableHead>Mensagem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {respostasPagination.visible.map((r: Resposta) => (
                        <TableRow key={r.id}>
                          <TableCell className="whitespace-nowrap text-sm text-neutral-500">
                            {formatDateTime(r.data_hora)}
                          </TableCell>
                          <TableCell className="font-medium text-neutral-900">
                            {r.lead_nome ?? '—'}
                          </TableCell>
                          <TableCell>
                            <ReplyBadge classification={r.classificacao} />
                          </TableCell>
                          <TableCell className="max-w-md truncate text-sm text-neutral-600">
                            {r.mensagem_recebida}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <TablePagination
                    page={respostasPagination.page}
                    totalPages={respostasPagination.totalPages}
                    totalItems={respostasPagination.total}
                    onPageChange={respostasPagination.setPage}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="comandos" className="mt-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-lg bg-neutral-100 p-2">
                      <Target className="h-5 w-5 text-neutral-600" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-neutral-900">Importar leads</h2>
                      <p className="text-xs text-neutral-500">Google Maps via Apify</p>
                    </div>
                  </div>
                  <CopyCommand
                    label="Buscar nicho"
                    command={'cd scripts/outbound\npython3 source_apify.py --search "seu nicho Natal"'}
                  />
                </div>

                <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-lg bg-neutral-100 p-2">
                      <Send className="h-5 w-5 text-neutral-600" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-neutral-900">Enviar lote</h2>
                      <p className="text-xs text-neutral-500">Primeiro contato via wacli</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <CopyCommand label="Dry-run (preview seguro)" command="cd scripts/outbound && python3 send_batch.py" />
                    <CopyCommand
                      label="Envio real"
                      command="cd scripts/outbound && OUTBOUND_ENABLED=1 OUTBOUND_BATCH_SIZE=10 python3 send_batch.py"
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm lg:col-span-2">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-lg bg-neutral-100 p-2">
                      <Terminal className="h-5 w-5 text-neutral-600" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-neutral-900">Outros comandos</h2>
                      <p className="text-xs text-neutral-500">Scan de inbox e relatório diário</p>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <CopyCommand
                      label="Classificar respostas"
                      command="cd scripts/outbound && python3 inbox_scan.py"
                    />
                    <CopyCommand label="Relatório do dia" command="cd scripts/outbound && python3 report.py" />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Envios reais exigem <code className="rounded bg-amber-100 px-1">OUTBOUND_ENABLED=1</code> e
                  wacli autenticado. Use dry-run antes de disparar.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {(stats.erro > 0 || stats.optOut > 0) && (
            <div className="flex flex-wrap gap-3 text-sm">
              {stats.erro > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">
                  <XCircle className="h-4 w-4" />
                  {stats.erro} com erro de envio
                </span>
              )}
              {stats.interessado > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  {stats.interessado} interessados — mover para pipeline manualmente
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
