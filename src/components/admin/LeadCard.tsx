import { useState } from 'react';
import { Loader2, Mail, MoreHorizontal, Phone, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import LeadDetailDialog, { displayName } from '@/components/admin/LeadDetailDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { daysInStage } from '@/hooks/usePipeline';
import { PLAN_CONFIG } from '@/lib/plans';
import { cn } from '@/lib/utils';
import { PIPELINE_STAGES, STAGE_LABELS, type Lead, type PipelineStage } from '@/types/crm';

type LeadCardProps = {
  lead: Lead;
  onMoveStage: (leadId: string, stage: PipelineStage, lostReason?: string) => Promise<void>;
  highlighted?: boolean;
  isDragging?: boolean;
  dragHandleProps?: Record<string, unknown>;
  className?: string;
};

export default function LeadCard({
  lead,
  onMoveStage,
  highlighted = false,
  isDragging = false,
  dragHandleProps,
  className,
}: LeadCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lostDialogOpen, setLostDialogOpen] = useState(false);
  const [lostReason, setLostReason] = useState('');
  const [moving, setMoving] = useState(false);

  const days = daysInStage(lead.updated_at);
  const name = displayName(lead);
  const phone = lead.whatsapp || lead.telefone;
  const planLabel = lead.plan_slug ? PLAN_CONFIG[lead.plan_slug]?.label : lead.plano;
  const isNewToday = days === 0;

  const handleMove = async (stage: PipelineStage) => {
    if (stage === lead.stage) return;
    if (stage === 'perdido') {
      setLostReason('');
      setLostDialogOpen(true);
      return;
    }
    try {
      await onMoveStage(lead.id, stage);
      toast.success(`Lead movido para ${STAGE_LABELS[stage]}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao mover lead');
    }
  };

  const confirmLost = async () => {
    if (!lostReason.trim()) {
      toast.error('Informe o motivo da perda');
      return;
    }
    setMoving(true);
    try {
      await onMoveStage(lead.id, 'perdido', lostReason.trim());
      setLostDialogOpen(false);
      toast.success('Lead marcado como perdido');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao mover lead');
    } finally {
      setMoving(false);
    }
  };

  const openDialog = () => setDialogOpen(true);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={openDialog}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openDialog();
          }
        }}
        className={cn(
          'group relative cursor-pointer rounded-lg border border-neutral-200 bg-white p-3 shadow-sm transition-all',
          'hover:border-[#9CD653]/70 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9CD653] focus-visible:ring-offset-2',
          isNewToday && 'ring-1 ring-[#9CD653]/30',
          highlighted && 'ring-2 ring-[#9CD653]/50',
          isDragging && 'shadow-lg',
          className
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-start gap-1">
            {dragHandleProps && (
              <button
                type="button"
                className="mt-0.5 shrink-0 cursor-grab touch-none rounded p-0.5 text-neutral-300 hover:text-neutral-500 active:cursor-grabbing"
                aria-label="Arrastar lead"
                onClick={(e) => e.stopPropagation()}
                {...dragHandleProps}
              >
                <GripVertical className="h-4 w-4" />
              </button>
            )}
            <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {isNewToday && (
                <span
                  className="h-2 w-2 shrink-0 rounded-full bg-[#9CD653]"
                  title="Novo hoje"
                  aria-hidden
                />
              )}
              <p className="truncate font-semibold text-neutral-950">{name}</p>
            </div>
            {lead.email && lead.nome?.trim() && (
              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-neutral-500">
                <Mail className="h-3 w-3 shrink-0" aria-hidden />
                {lead.email}
              </p>
            )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-neutral-500 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 data-[state=open]:opacity-100"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Mover lead</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52" onClick={(e) => e.stopPropagation()}>
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

        <div className="mt-2.5 space-y-1.5">
          {phone && (
            <p className="flex items-center gap-1 text-xs text-neutral-600">
              <Phone className="h-3 w-3 shrink-0 text-[#7ab83a]" aria-hidden />
              <span className="truncate">{phone}</span>
            </p>
          )}
          {lead.mensagem?.trim() && (
            <p className="line-clamp-2 text-xs leading-relaxed text-neutral-500">{lead.mensagem}</p>
          )}
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {planLabel && (
            <Badge className="border-0 bg-[#9CD653] px-2 py-0 text-[10px] font-semibold text-neutral-950 hover:bg-[#8bc442]">
              {planLabel}
            </Badge>
          )}
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-medium',
              isNewToday ? 'bg-[#9CD653]/15 text-[#4a7a18]' : 'bg-neutral-100 text-neutral-600'
            )}
          >
            {days === 0 ? 'Hoje' : `${days}d nesta etapa`}
          </span>
        </div>
      </div>

      <LeadDetailDialog lead={lead} open={dialogOpen} onOpenChange={setDialogOpen} />

      <Dialog
        open={lostDialogOpen}
        onOpenChange={(open) => {
          setLostDialogOpen(open);
          if (!open) setLostReason('');
        }}
      >
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Marcar como perdido</DialogTitle>
            <DialogDescription>
              Informe o motivo da perda para {name}.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={lostReason}
            onChange={(e) => setLostReason(e.target.value)}
            placeholder="Ex.: optou por concorrente, sem orçamento…"
            rows={3}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setLostDialogOpen(false)}
              disabled={moving}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmLost}
              disabled={moving || !lostReason.trim()}
            >
              {moving ? (
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
    </>
  );
}
