import { useCallback } from 'react';
import LeadCard from '@/components/admin/LeadCard';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { useLeads } from '@/hooks/useLeads';
import { usePipeline } from '@/hooks/usePipeline';
import { STAGE_LABELS, type PipelineStage } from '@/types/crm';

function PipelineColumn({
  label,
  count,
  leads,
  onMoveStage,
  variant = 'default',
}: {
  label: string;
  count: number;
  leads: ReturnType<typeof useLeads>['leads'];
  onMoveStage: (leadId: string, stage: PipelineStage) => Promise<void>;
  variant?: 'default' | 'lost';
}) {
  return (
    <div
      className={`flex h-full min-w-[280px] max-w-[320px] flex-col rounded-lg border ${
        variant === 'lost' ? 'border-red-200 bg-red-50/50' : 'border-neutral-200 bg-neutral-50'
      }`}
    >
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-neutral-900">{label}</h2>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-neutral-600 shadow-sm">
          {count}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
        {leads.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-400">Nenhum lead</p>
        ) : (
          leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onMoveStage={onMoveStage} />
          ))
        )}
      </div>
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
}: {
  columns: ReturnType<typeof usePipeline>['columns'];
  lost: ReturnType<typeof usePipeline>['lost'];
  onMoveStage: (leadId: string, stage: PipelineStage) => Promise<void>;
}) {
  const allSections = [
    ...columns.map((col) => ({ stage: col.stage, label: col.label, leads: col.leads })),
    { stage: 'perdido' as const, label: STAGE_LABELS.perdido, leads: lost },
  ];

  return (
    <Accordion type="multiple" className="md:hidden">
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
          <AccordionContent className="space-y-2 pb-4">
            {leads.length === 0 ? (
              <p className="text-center text-sm text-neutral-400">Nenhum lead</p>
            ) : (
              leads.map((lead) => (
                <LeadCard key={lead.id} lead={lead} onMoveStage={onMoveStage} />
              ))
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export default function PipelineBoard() {
  const { leads, loading, error, updateStage } = useLeads();
  const { columns, lost } = usePipeline(leads);

  const handleMoveStage = useCallback(
    (leadId: string, stage: PipelineStage) => updateStage(leadId, stage),
    [updateStage]
  );

  const totalCount = leads.length;

  return (
    <div className="flex h-full flex-col p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Pipeline</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {loading ? 'Carregando…' : `${totalCount} ${totalCount === 1 ? 'lead' : 'leads'}`}
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
      ) : (
        <>
          <div className="hidden flex-1 gap-4 overflow-x-auto pb-4 md:flex">
            {columns.map((col) => (
              <PipelineColumn
                key={col.stage}
                label={col.label}
                count={col.leads.length}
                leads={col.leads}
                onMoveStage={handleMoveStage}
              />
            ))}
            <PipelineColumn
              label={STAGE_LABELS.perdido}
              count={lost.length}
              leads={lost}
              onMoveStage={handleMoveStage}
              variant="lost"
            />
          </div>

          <MobilePipeline columns={columns} lost={lost} onMoveStage={handleMoveStage} />
        </>
      )}
    </div>
  );
}
