import { Link } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { daysInStage } from '@/hooks/usePipeline';
import { PLAN_CONFIG } from '@/lib/plans';
import { cn } from '@/lib/utils';
import { PIPELINE_STAGES, STAGE_LABELS, type Lead, type PipelineStage } from '@/types/crm';

type LeadCardProps = {
  lead: Lead;
  onMoveStage: (leadId: string, stage: PipelineStage) => Promise<void>;
  className?: string;
};

export default function LeadCard({ lead, onMoveStage, className }: LeadCardProps) {
  const days = daysInStage(lead.updated_at);
  const planLabel = lead.plan_slug ? PLAN_CONFIG[lead.plan_slug]?.label : null;

  const handleMove = async (stage: PipelineStage) => {
    if (stage === lead.stage) return;
    try {
      await onMoveStage(lead.id, stage);
      toast.success(`Lead movido para ${STAGE_LABELS[stage]}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao mover lead');
    }
  };

  return (
    <div
      className={cn(
        'group relative rounded-lg border border-neutral-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          to={`/admin/leads/${lead.id}`}
          className="min-w-0 flex-1 font-medium text-neutral-900 hover:underline"
        >
          {lead.nome}
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-neutral-500 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
              onClick={(e) => e.preventDefault()}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Mover lead</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Mover para…</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {PIPELINE_STAGES.filter((s) => s !== lead.stage).map((stage) => (
              <DropdownMenuItem key={stage} onClick={() => handleMove(stage)}>
                {STAGE_LABELS[stage]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {planLabel && (
          <Badge variant="secondary" className="text-xs font-normal">
            {planLabel}
          </Badge>
        )}
        <span className="text-xs text-neutral-500">
          {days === 0 ? 'Hoje nesta etapa' : `${days} ${days === 1 ? 'dia' : 'dias'} nesta etapa`}
        </span>
      </div>
    </div>
  );
}
