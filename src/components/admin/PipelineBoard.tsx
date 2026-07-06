import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import LeadCard from '@/components/admin/LeadCard';
import PaginatedLeadList from '@/components/admin/PaginatedLeadList';
import PipelineToolbar from '@/components/admin/PipelineToolbar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DEFAULT_FILTERS,
  filterLeads,
  hasActiveFilters,
  type LeadFilters,
  type LeadSort,
} from '@/hooks/useLeadFilters';
import { useLeads } from '@/hooks/useLeads';
import { usePipeline } from '@/hooks/usePipeline';
import { exportLeadsCsv } from '@/lib/exportLeads';
import { cn } from '@/lib/utils';
import { STAGE_LABELS, type PipelineStage } from '@/types/crm';

function PipelineColumn({
  stage,
  label,
  count,
  leads,
  onMoveStage,
  variant = 'default',
  collapsed = false,
  highlighted = false,
  dragEnabled = false,
}: {
  stage: PipelineStage;
  label: string;
  count: number;
  leads: ReturnType<typeof useLeads>['leads'];
  onMoveStage: (leadId: string, stage: PipelineStage, lostReason?: string) => Promise<void>;
  variant?: 'default' | 'lost';
  collapsed?: boolean;
  highlighted?: boolean;
  dragEnabled?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const isCollapsed = collapsed && !expanded;
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  const header = (
    <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
      <h2 className="text-sm font-semibold text-neutral-900">{label}</h2>
      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-neutral-600 shadow-sm">
        {count}
      </span>
    </div>
  );

  if (isCollapsed) {
    return (
      <button
        ref={setNodeRef}
        type="button"
        onClick={() => setExpanded(true)}
        className={cn(
          'flex h-auto min-w-[120px] max-w-[160px] shrink-0 flex-col rounded-lg border text-left transition-colors',
          variant === 'lost' ? 'border-red-200 bg-red-50/50' : 'border-neutral-200 bg-neutral-50',
          'hover:border-[#9CD653]/50',
          isOver && 'ring-2 ring-[#9CD653] ring-offset-1'
        )}
      >
        {header}
        <p className="px-4 py-2 text-xs text-neutral-400">Expandir</p>
      </button>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex h-full min-h-0 min-w-[280px] max-w-[320px] flex-col rounded-lg border transition-shadow',
        variant === 'lost' ? 'border-red-200 bg-red-50/50' : 'border-neutral-200 bg-neutral-50',
        isOver && 'ring-2 ring-[#9CD653] shadow-md'
      )}
    >
      {header}
      <PaginatedLeadList
        leads={leads}
        onMoveStage={onMoveStage}
        highlighted={highlighted}
        dragEnabled={dragEnabled}
        resetKey={leads.map((l) => l.id).join(',')}
        emptyMessage={collapsed ? 'Nenhum resultado' : 'Nenhum lead'}
      />
    </div>
  );
}

function PipelineSkeleton() {
  return (
    <div className="hidden gap-4 overflow-x-auto pb-4 md:flex">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="min-w-[280px] space-y-3 rounded-lg border border-neutral-200 p-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ))}
    </div>
  );
}

function MobilePipeline({
  columns,
  lost,
  onMoveStage,
  hideEmpty,
  highlighted,
}: {
  columns: ReturnType<typeof usePipeline>['columns'];
  lost: ReturnType<typeof usePipeline>['lost'];
  onMoveStage: (leadId: string, stage: PipelineStage, lostReason?: string) => Promise<void>;
  hideEmpty: boolean;
  highlighted: boolean;
}) {
  const allSections = [
    ...columns.map((col) => ({ stage: col.stage, label: col.label, leads: col.leads })),
    { stage: 'perdido' as const, label: STAGE_LABELS.perdido, leads: lost },
  ].filter((section) => !hideEmpty || section.leads.length > 0);

  if (allSections.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-neutral-500 md:hidden">
        Nenhum lead corresponde aos filtros.
      </p>
    );
  }

  return (
    <Accordion type="multiple" className="md:hidden" defaultValue={allSections.map((s) => s.stage)}>
      {allSections.map(({ stage, label, leads }) => (
        <AccordionItem key={stage} value={stage}>
          <AccordionTrigger className="py-4 text-sm hover:no-underline">
            <span className="flex flex-1 items-center justify-between pr-2">
              <span className="font-semibold">{label}</span>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                {leads.length}
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <PaginatedLeadList
              leads={leads}
              onMoveStage={onMoveStage}
              highlighted={highlighted}
              resetKey={leads.map((l) => l.id).join(',')}
              scrollClassName="max-h-[60vh] p-0 pt-2"
              emptyMessage="Nenhum lead"
            />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export default function PipelineBoard() {
  const [searchParams] = useSearchParams();
  const { leads, loading, error, updateStage } = useLeads();
  const [filters, setFilters] = useState<LeadFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<LeadSort>('recent');
  const [activeLead, setActiveLead] = useState<(typeof leads)[number] | null>(null);
  const [dragLostLeadId, setDragLostLeadId] = useState<string | null>(null);
  const [dragLostReason, setDragLostReason] = useState('');
  const [dragLostSaving, setDragLostSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  useEffect(() => {
    const stageParam = searchParams.get('stage');
    if (stageParam && stageParam !== 'all') {
      setFilters((prev) => ({ ...prev, stage: stageParam as LeadFilters['stage'] }));
    }
  }, [searchParams]);

  const filteredLeads = useMemo(() => filterLeads(leads, filters), [leads, filters]);
  const { columns, lost } = usePipeline(filteredLeads, sort);
  const filtersActive = hasActiveFilters(filters);

  const handleMoveStage = useCallback(
    (leadId: string, stage: PipelineStage, lostReason?: string) =>
      updateStage(leadId, stage, lostReason),
    [updateStage]
  );

  const moveLeadWithToast = useCallback(
    async (leadId: string, stage: PipelineStage, lostReason?: string) => {
      try {
        await handleMoveStage(leadId, stage, lostReason);
        toast.success(
          stage === 'perdido'
            ? 'Lead marcado como perdido'
            : `Lead movido para ${STAGE_LABELS[stage]}`
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro ao mover lead');
        throw err;
      }
    },
    [handleMoveStage]
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = Number(event.active.id);
      const lead = leads.find((l) => l.id === id) ?? null;
      setActiveLead(lead);
    },
    [leads]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveLead(null);
      const { active, over } = event;
      if (!over) return;

      const leadId = Number(active.id);
      const targetStage = over.id as PipelineStage;
      const lead = leads.find((l) => l.id === leadId);
      if (!lead || lead.stage === targetStage) return;

      if (targetStage === 'perdido') {
        setDragLostLeadId(leadId);
        setDragLostReason('');
        return;
      }

      void moveLeadWithToast(leadId, targetStage);
    },
    [leads, moveLeadWithToast]
  );

  const confirmDragLost = async () => {
    if (!dragLostLeadId || !dragLostReason.trim()) {
      toast.error('Informe o motivo da perda');
      return;
    }
    setDragLostSaving(true);
    try {
      await moveLeadWithToast(dragLostLeadId, 'perdido', dragLostReason.trim());
      setDragLostLeadId(null);
      setDragLostReason('');
    } catch {
      // toast already shown
    } finally {
      setDragLostSaving(false);
    }
  };

  const handleExport = useCallback((exportLeads: typeof leads) => {
    exportLeadsCsv(exportLeads);
  }, []);

  const totalCount = leads.length;
  const filteredCount = filteredLeads.length;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-neutral-900">Pipeline</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {loading
            ? 'Carregando…'
            : `${totalCount} ${totalCount === 1 ? 'lead' : 'leads'} · arraste pelo ícone ⋮⋮ entre colunas`}
        </p>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Erro ao carregar leads: {error}
        </div>
      )}

      {loading ? (
        <>
          <PipelineSkeleton />
          <div className="space-y-3 md:hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </>
      ) : totalCount === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-neutral-200 py-16 text-center">
          <p className="text-sm font-medium text-neutral-600">Nenhum lead no pipeline</p>
          <p className="mt-1 text-sm text-neutral-400">
            Novos leads do formulário do site aparecem aqui automaticamente.
          </p>
        </div>
      ) : (
        <>
          <PipelineToolbar
            filters={filters}
            sort={sort}
            totalCount={totalCount}
            filteredCount={filteredCount}
            filteredLeads={filteredLeads}
            onFiltersChange={setFilters}
            onSortChange={setSort}
            onExport={handleExport}
          />

          {filteredCount === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-neutral-200 py-16 text-center">
              <p className="text-sm font-medium text-neutral-600">
                Nenhum lead corresponde aos filtros
              </p>
              <button
                type="button"
                onClick={() => setFilters(DEFAULT_FILTERS)}
                className="mt-3 text-sm font-medium text-[#5a8f1f] hover:underline"
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={() => setActiveLead(null)}
              >
                <div className="hidden min-h-0 flex-1 gap-4 overflow-x-auto pb-2 md:flex">
                  {columns.map((col) => (
                    <PipelineColumn
                      key={col.stage}
                      stage={col.stage}
                      label={col.label}
                      count={col.leads.length}
                      leads={col.leads}
                      onMoveStage={handleMoveStage}
                      collapsed={filtersActive && col.leads.length === 0}
                      highlighted={filtersActive}
                      dragEnabled
                    />
                  ))}
                  <PipelineColumn
                    stage="perdido"
                    label={STAGE_LABELS.perdido}
                    count={lost.length}
                    leads={lost}
                    onMoveStage={handleMoveStage}
                    variant="lost"
                    collapsed={filtersActive && lost.length === 0}
                    highlighted={filtersActive}
                    dragEnabled
                  />
                </div>

                <DragOverlay dropAnimation={{ duration: 200, easing: 'ease-out' }}>
                  {activeLead ? (
                    <LeadCard
                      lead={activeLead}
                      onMoveStage={async () => {}}
                      className="rotate-1 cursor-grabbing shadow-xl ring-2 ring-[#9CD653]"
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>

              <MobilePipeline
                columns={columns}
                lost={lost}
                onMoveStage={handleMoveStage}
                hideEmpty={filtersActive}
                highlighted={filtersActive}
              />
            </>
          )}
        </>
      )}

      <Dialog
        open={dragLostLeadId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDragLostLeadId(null);
            setDragLostReason('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar como perdido</DialogTitle>
            <DialogDescription>
              Informe o motivo da perda. Este registro fica salvo no lead.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={dragLostReason}
            onChange={(e) => setDragLostReason(e.target.value)}
            placeholder="Ex.: optou por concorrente, sem orçamento…"
            rows={3}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDragLostLeadId(null)}
              disabled={dragLostSaving}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDragLost}
              disabled={dragLostSaving || !dragLostReason.trim()}
            >
              {dragLostSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando…
                </>
              ) : (
                'Confirmar perda'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
