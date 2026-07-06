import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { isValidCpfCnpj, onlyDigits } from '@/lib/cpf';
import { formatCentsBRL, PLAN_CONFIG } from '@/lib/plans';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';
import {
  PIPELINE_STAGES,
  PLAN_SLUGS,
  STAGE_LABELS,
  type BillingType,
  type Lead,
  type PipelineEvent,
  type PipelineStage,
  type PlanSlug,
} from '@/types/crm';

const BILLING_LABELS: Record<BillingType, string> = {
  PIX: 'PIX',
  BOLETO: 'Boleto',
  CREDIT_CARD: 'Cartão de crédito',
};

const SUBSCRIPTION_ELIGIBLE_STAGES = new Set<PipelineStage>([
  'proposta',
  'aguardando_pagamento',
  'ativo',
]);

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCpfCnpjDisplay(value: string): string {
  const digits = onlyDigits(value);
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

function ContactRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-neutral-900">{value}</dd>
    </div>
  );
}

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<Lead | null>(null);
  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [notes, setNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [billingType, setBillingType] = useState<BillingType>('PIX');
  const [planSaving, setPlanSaving] = useState(false);

  const [lostDialogOpen, setLostDialogOpen] = useState(false);
  const [lostReason, setLostReason] = useState('');
  const [stageSaving, setStageSaving] = useState(false);

  const fetchEvents = useCallback(async (leadId: string) => {
    const { data, error: err } = await supabase
      .from('pipeline_events')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true });
    if (err) throw new Error(err.message);
    setEvents((data as PipelineEvent[]) ?? []);
  }, []);

  const fetchLead = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase.from('leads').select('*').eq('id', id).single();
    if (err) {
      setError(err.message);
      setLead(null);
      setLoading(false);
      return;
    }

    const leadData = data as Lead;
    setLead(leadData);
    setNotes(leadData.notes ?? '');

    if (leadData.customer_id) {
      const { data: customer } = await supabase
        .from('customers')
        .select('cpf_cnpj')
        .eq('id', leadData.customer_id)
        .maybeSingle();
      if (customer?.cpf_cnpj) setCpfCnpj(formatCpfCnpjDisplay(customer.cpf_cnpj));

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('billing_type')
        .eq('lead_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (subscription?.billing_type) setBillingType(subscription.billing_type as BillingType);
    }

    try {
      await fetchEvents(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar timeline');
    }

    setLoading(false);
  }, [id, fetchEvents]);

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  const cpfValid = useMemo(() => isValidCpfCnpj(cpfCnpj), [cpfCnpj]);
  const cpfTouched = onlyDigits(cpfCnpj).length > 0;

  const canGenerateSubscription = useMemo(() => {
    if (!lead) return false;
    return (
      SUBSCRIPTION_ELIGIBLE_STAGES.has(lead.stage) &&
      !!lead.plan_slug &&
      cpfValid
    );
  }, [lead, cpfValid]);

  const updateLead = async (payload: Partial<Lead>) => {
    if (!id) return;
    const { error: err } = await supabase.from('leads').update(payload).eq('id', id);
    if (err) throw new Error(err.message);
    setLead((prev) => (prev ? { ...prev, ...payload } : prev));
  };

  const handleStageChange = async (stage: PipelineStage) => {
    if (!lead || stage === lead.stage) return;

    if (stage === 'perdido') {
      setLostReason(lead.lost_reason ?? '');
      setLostDialogOpen(true);
      return;
    }

    setStageSaving(true);
    try {
      await updateLead({ stage });
      await fetchEvents(id!);
      toast.success(`Etapa atualizada para ${STAGE_LABELS[stage]}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao atualizar etapa');
    } finally {
      setStageSaving(false);
    }
  };

  const confirmLostStage = async () => {
    if (!lostReason.trim()) {
      toast.error('Informe o motivo da perda');
      return;
    }
    setStageSaving(true);
    try {
      await updateLead({ stage: 'perdido', lost_reason: lostReason.trim() });
      await fetchEvents(id!);
      setLostDialogOpen(false);
      toast.success('Lead marcado como perdido');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao atualizar etapa');
    } finally {
      setStageSaving(false);
    }
  };

  const handleNotesBlur = async () => {
    if (!lead || notes === (lead.notes ?? '')) return;
    setNotesSaving(true);
    try {
      await updateLead({ notes: notes || null });
      toast.success('Notas salvas');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar notas');
      setNotes(lead.notes ?? '');
    } finally {
      setNotesSaving(false);
    }
  };

  const handlePlanChange = async (slug: PlanSlug) => {
    if (!lead || lead.plan_slug === slug) return;
    setPlanSaving(true);
    try {
      await updateLead({ plan_slug: slug });
      toast.success(`Plano: ${PLAN_CONFIG[slug].label}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar plano');
    } finally {
      setPlanSaving(false);
    }
  };

  const handleCpfChange = (value: string) => {
    setCpfCnpj(formatCpfCnpjDisplay(value));
  };

  const handleGenerateSubscription = () => {
    if (!canGenerateSubscription) return;
    toast.info('Em breve');
  };

  const phone = lead?.whatsapp || lead?.telefone;

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="mb-6 h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="p-6">
        <Link
          to="/admin/pipeline"
          className="mb-6 inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao pipeline
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? 'Lead não encontrado'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Link
        to="/admin/pipeline"
        className="mb-6 inline-flex items-center gap-2 text-sm text-neutral-600 transition-colors hover:text-neutral-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao pipeline
      </Link>

      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{lead.nome}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Criado em {formatDateTime(lead.created_at)}
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {STAGE_LABELS[lead.stage]}
        </Badge>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-neutral-900">Contato</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <ContactRow label="Nome" value={lead.nome} />
              <ContactRow label="E-mail" value={lead.email} />
              <ContactRow label="WhatsApp / Telefone" value={phone} />
              <ContactRow label="Instagram" value={lead.instagram} />
              <ContactRow label="Plano (landing)" value={lead.plano} />
            </dl>
          </section>

          <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-neutral-900">Etapa</h2>
            <Select
              value={lead.stage}
              onValueChange={(v) => handleStageChange(v as PipelineStage)}
              disabled={stageSaving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PIPELINE_STAGES.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {STAGE_LABELS[stage]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {lead.stage === 'perdido' && lead.lost_reason && (
              <p className="mt-3 text-sm text-neutral-600">
                <span className="font-medium text-neutral-700">Motivo: </span>
                {lead.lost_reason}
              </p>
            )}
          </section>

          <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-900">Notas</h2>
              {notesSaving && (
                <span className="flex items-center gap-1 text-xs text-neutral-500">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Salvando…
                </span>
              )}
            </div>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Anotações sobre o lead…"
              rows={4}
              className="resize-y"
            />
          </section>

          <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-neutral-900">Assinatura</h2>

            <div className="space-y-5">
              <div>
                <Label className="mb-3 block text-neutral-700">Plano</Label>
                <div className="space-y-2">
                  {PLAN_SLUGS.map((slug) => (
                    <label
                      key={slug}
                      className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                        lead.plan_slug === slug
                          ? 'border-neutral-900 bg-neutral-50'
                          : 'border-neutral-200 hover:border-neutral-300',
                        planSaving && 'pointer-events-none opacity-60'
                      )}
                    >
                      <input
                        type="radio"
                        name="plan_slug"
                        value={slug}
                        checked={lead.plan_slug === slug}
                        onChange={() => handlePlanChange(slug)}
                        className="mt-1"
                      />
                      <div>
                        <div className="text-sm font-medium text-neutral-900">
                          {PLAN_CONFIG[slug].label}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {formatCentsBRL(PLAN_CONFIG[slug].valueCents)}
                          {PLAN_CONFIG[slug].cycle === 'YEARLY' ? ' / ano' : ' / mês'}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="cpf_cnpj" className="text-neutral-700">
                  CPF / CNPJ
                </Label>
                <Input
                  id="cpf_cnpj"
                  value={cpfCnpj}
                  onChange={(e) => handleCpfChange(e.target.value)}
                  placeholder="000.000.000-00"
                  className="mt-1.5"
                  maxLength={18}
                />
                {cpfTouched && !cpfValid && (
                  <p className="mt-1.5 text-xs text-red-600">CPF ou CNPJ inválido</p>
                )}
                {cpfValid && (
                  <p className="mt-1.5 text-xs text-green-600">Documento válido</p>
                )}
              </div>

              <div>
                <Label className="text-neutral-700">Forma de pagamento</Label>
                <Select
                  value={billingType}
                  onValueChange={(v) => setBillingType(v as BillingType)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(BILLING_LABELS) as BillingType[]).map((type) => (
                      <SelectItem key={type} value={type}>
                        {BILLING_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="button"
                className="w-full"
                disabled={!canGenerateSubscription}
                onClick={handleGenerateSubscription}
              >
                Gerar assinatura Asaas
              </Button>
              {!canGenerateSubscription && (
                <p className="text-center text-xs text-neutral-500">
                  Disponível na etapa Proposta ou posterior, com plano e CPF/CNPJ válidos.
                </p>
              )}
            </div>
          </section>
        </div>

        <aside>
          <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-neutral-900">Timeline</h2>
            {events.length === 0 ? (
              <p className="text-sm text-neutral-400">Nenhuma movimentação registrada.</p>
            ) : (
              <ol className="relative space-y-4 border-l border-neutral-200 pl-4">
                {events.map((event) => (
                  <li key={event.id} className="relative">
                    <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-neutral-400 ring-1 ring-neutral-200" />
                    <p className="text-sm text-neutral-900">
                      {event.from_stage ? (
                        <>
                          <span className="text-neutral-500">
                            {STAGE_LABELS[event.from_stage as PipelineStage]}
                          </span>
                          {' → '}
                          <span className="font-medium">
                            {STAGE_LABELS[event.to_stage as PipelineStage]}
                          </span>
                        </>
                      ) : (
                        <span className="font-medium">
                          {STAGE_LABELS[event.to_stage as PipelineStage]}
                        </span>
                      )}
                    </p>
                    <time className="mt-0.5 block text-xs text-neutral-500">
                      {formatDateTime(event.created_at)}
                    </time>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </aside>
      </div>

      <Dialog
        open={lostDialogOpen}
        onOpenChange={(open) => {
          setLostDialogOpen(open);
          if (!open) setLostReason('');
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
              disabled={stageSaving}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmLostStage}
              disabled={stageSaving || !lostReason.trim()}
            >
              {stageSaving ? (
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
