import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import DraggableLeadCard from '@/components/admin/DraggableLeadCard';
import LeadCard from '@/components/admin/LeadCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Lead, PipelineStage } from '@/types/crm';

export const COLUMN_PAGE_SIZE = 15;

type PaginatedLeadListProps = {
  leads: Lead[];
  onMoveStage: (leadId: string, stage: PipelineStage, lostReason?: string) => Promise<void>;
  highlighted?: boolean;
  pageSize?: number;
  resetKey?: string;
  className?: string;
  scrollClassName?: string;
  emptyMessage?: string;
  dragEnabled?: boolean;
};

export default function PaginatedLeadList({
  leads,
  onMoveStage,
  highlighted = false,
  pageSize = COLUMN_PAGE_SIZE,
  resetKey = '',
  className,
  scrollClassName,
  emptyMessage = 'Nenhum lead',
  dragEnabled = false,
}: PaginatedLeadListProps) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(leads.length / pageSize));

  useEffect(() => {
    setPage(0);
  }, [resetKey]);

  useEffect(() => {
    if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1));
  }, [page, totalPages]);

  const start = page * pageSize;
  const visible = leads.slice(start, start + pageSize);

  if (leads.length === 0) {
    return <p className="py-6 text-center text-sm text-neutral-400">{emptyMessage}</p>;
  }

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      <div
        className={cn(
          'min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-y-contain p-3',
          scrollClassName
        )}
      >
        {visible.map((lead) =>
          dragEnabled ? (
            <DraggableLeadCard
              key={lead.id}
              lead={lead}
              onMoveStage={onMoveStage}
              highlighted={highlighted}
            />
          ) : (
            <LeadCard
              key={lead.id}
              lead={lead}
              onMoveStage={onMoveStage}
              highlighted={highlighted}
            />
          )
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex shrink-0 items-center justify-between border-t border-neutral-200 bg-white/80 px-2 py-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <span className="text-xs font-medium text-neutral-600">
            {page + 1} / {totalPages}
            <span className="ml-1 text-neutral-400">({leads.length})</span>
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Próximo
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
