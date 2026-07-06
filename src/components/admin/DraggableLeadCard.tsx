import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import LeadCard from '@/components/admin/LeadCard';
import { cn } from '@/lib/utils';
import type { Lead, PipelineStage } from '@/types/crm';

type DraggableLeadCardProps = {
  lead: Lead;
  onMoveStage: (leadId: string, stage: PipelineStage, lostReason?: string) => Promise<void>;
  highlighted?: boolean;
};

export default function DraggableLeadCard({
  lead,
  onMoveStage,
  highlighted,
}: DraggableLeadCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { lead, stage: lead.stage },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: isDragging ? 50 : undefined }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && 'opacity-40')}
    >
      <LeadCard
        lead={lead}
        onMoveStage={onMoveStage}
        highlighted={highlighted}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
      />
    </div>
  );
}
