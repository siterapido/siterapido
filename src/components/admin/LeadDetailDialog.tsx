import type { ComponentType } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ExternalLink, Instagram, Mail, MessageSquare, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { daysInStage } from '@/hooks/usePipeline';
import { PLAN_CONFIG } from '@/lib/plans';
import { STAGE_LABELS, type Lead } from '@/types/crm';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function displayName(lead: Lead): string {
  if (lead.nome?.trim()) return lead.nome.trim();
  if (lead.email?.trim()) return lead.email.trim();
  return 'Lead sem identificação';
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string | null | undefined;
}) {
  if (!value?.trim()) return null;
  return (
    <div className="flex gap-3 rounded-lg bg-neutral-50 px-3 py-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#7ab83a]" aria-hidden />
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">{label}</p>
        <p className="mt-0.5 break-all text-sm font-medium text-neutral-950">{value}</p>
      </div>
    </div>
  );
}

type LeadDetailDialogProps = {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function LeadDetailDialog({ lead, open, onOpenChange }: LeadDetailDialogProps) {
  const name = displayName(lead);
  const phone = lead.whatsapp || lead.telefone;
  const planLabel = lead.plan_slug ? PLAN_CONFIG[lead.plan_slug]?.label : lead.plano;
  const days = daysInStage(lead.updated_at);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader className="space-y-3 text-left">
          <div className="flex flex-wrap items-start justify-between gap-2 pr-6">
            <DialogTitle className="text-xl font-bold text-neutral-950">{name}</DialogTitle>
            <Badge className="border-0 bg-[#9CD653] text-neutral-950 hover:bg-[#8bc442]">
              {STAGE_LABELS[lead.stage]}
            </Badge>
          </div>
          <p className="text-sm text-neutral-500">
            {days === 0 ? 'Chegou hoje nesta etapa' : `${days} ${days === 1 ? 'dia' : 'dias'} nesta etapa`}
            {' · '}
            Criado em {formatDateTime(lead.created_at)}
          </p>
        </DialogHeader>

        <div className="space-y-2">
          <InfoRow icon={Mail} label="E-mail" value={lead.email} />
          <InfoRow icon={Phone} label="WhatsApp / Telefone" value={phone} />
          <InfoRow icon={Instagram} label="Instagram" value={lead.instagram} />
          {lead.source && (
            <div className="flex gap-3 rounded-lg bg-neutral-50 px-3 py-2.5">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">Origem</p>
                <p className="mt-0.5 text-sm font-medium text-neutral-950">{lead.source}</p>
              </div>
            </div>
          )}
          {planLabel && (
            <div className="flex gap-3 rounded-lg border border-[#9CD653]/40 bg-[#9CD653]/10 px-3 py-2.5">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-[#5a8f1f]" aria-hidden />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-[#5a8f1f]">Plano</p>
                <p className="mt-0.5 text-sm font-semibold text-neutral-950">{planLabel}</p>
              </div>
            </div>
          )}
          {lead.mensagem?.trim() && (
            <div className="flex gap-3 rounded-lg bg-neutral-50 px-3 py-2.5">
              <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                  Mensagem
                </p>
                <p className="mt-0.5 whitespace-pre-wrap text-sm text-neutral-800">{lead.mensagem}</p>
              </div>
            </div>
          )}
          {lead.notes?.trim() && (
            <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2.5">
              <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">Notas</p>
              <p className="mt-0.5 whitespace-pre-wrap text-sm text-neutral-700">{lead.notes}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button type="button" asChild className="bg-neutral-950 text-white hover:bg-neutral-800">
            <Link to={`/admin/leads/${lead.id}`} onClick={() => onOpenChange(false)}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Abrir página completa
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { displayName };
