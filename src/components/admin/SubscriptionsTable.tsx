import { useState } from 'react';
import { Copy, Loader2, XCircle } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { cancelSubscription } from '@/lib/asaas';
import { formatCentsBRL, PLAN_CONFIG } from '@/lib/plans';
import { cn } from '@/lib/utils';
import type { PlanSlug, SubscriptionStatus } from '@/types/crm';
import type { SubscriptionWithCustomer } from '@/hooks/useSubscriptions';

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  pending: 'Pendente',
  active: 'Ativo',
  overdue: 'Inadimplente',
  cancelled: 'Cancelado',
};

function formatDueDate(date: string | null): string {
  if (!date) return '—';
  return new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR');
}

function StatusBadge({ status }: { status: SubscriptionStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        status === 'pending' && 'border-neutral-200 bg-neutral-100 text-neutral-700',
        status === 'active' && 'border-green-200 bg-green-50 text-green-700',
        status === 'overdue' && 'border-amber-200 bg-amber-50 text-amber-700',
        status === 'cancelled' && 'border-neutral-200 bg-neutral-50 text-neutral-400'
      )}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export default function SubscriptionsTable() {
  const { subscriptions, loading, error, fetchSubscriptions } = useSubscriptions();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [subscriptionToCancel, setSubscriptionToCancel] =
    useState<SubscriptionWithCustomer | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado');
    } catch {
      toast.error('Não foi possível copiar o link');
    }
  };

  const openCancelDialog = (sub: SubscriptionWithCustomer) => {
    setSubscriptionToCancel(sub);
    setCancelDialogOpen(true);
  };

  const handleCancelDialogChange = (open: boolean) => {
    setCancelDialogOpen(open);
    if (!open) setSubscriptionToCancel(null);
  };

  const confirmCancel = async () => {
    if (!subscriptionToCancel) return;

    setCancelling(true);
    try {
      await cancelSubscription(subscriptionToCancel.id);
      toast.success('Assinatura cancelada');
      setCancelDialogOpen(false);
      setSubscriptionToCancel(null);
      await fetchSubscriptions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao cancelar assinatura');
    } finally {
      setCancelling(false);
    }
  };

  const customerName = subscriptionToCancel?.customers?.nome ?? 'este cliente';

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Assinaturas</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {loading
            ? 'Carregando…'
            : `${subscriptions.length} ${subscriptions.length === 1 ? 'assinatura' : 'assinaturas'}`}
        </p>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Erro ao carregar assinaturas: {error}
          <Button variant="link" className="ml-2 h-auto p-0" onClick={fetchSubscriptions}>
            Tentar novamente
          </Button>
        </div>
      )}

      {loading ? (
        <TableSkeleton />
      ) : subscriptions.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-neutral-200 py-16 text-center">
          <p className="text-sm font-medium text-neutral-600">Nenhuma assinatura encontrada</p>
          <p className="mt-1 text-sm text-neutral-400">
            Assinaturas aparecem aqui após serem geradas no detalhe do lead.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-neutral-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Próx. vencimento</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((sub) => {
                const planLabel =
                  PLAN_CONFIG[sub.plan_slug as PlanSlug]?.label ?? sub.plan_slug;
                const canCancel = sub.status !== 'cancelled';
                return (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-neutral-900">
                          {sub.customers?.nome ?? '—'}
                        </p>
                        {sub.customers?.email && (
                          <p className="text-xs text-neutral-500">{sub.customers.email}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{planLabel}</TableCell>
                    <TableCell>
                      <StatusBadge status={sub.status} />
                    </TableCell>
                    <TableCell>{formatCentsBRL(sub.value_cents)}</TableCell>
                    <TableCell>{formatDueDate(sub.next_due_date)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {sub.payment_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyLink(sub.payment_url!)}
                          >
                            <Copy className="mr-1.5 h-4 w-4" />
                            Copiar link
                          </Button>
                        )}
                        {canCancel && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => openCancelDialog(sub)}
                          >
                            <XCircle className="mr-1.5 h-4 w-4" />
                            Cancelar
                          </Button>
                        )}
                        {!sub.payment_url && !canCancel && (
                          <span className="text-sm text-neutral-400">—</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={cancelDialogOpen} onOpenChange={handleCancelDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar assinatura de {customerName}?</DialogTitle>
            <DialogDescription>
              A assinatura será cancelada no Asaas e o status será atualizado aqui. Esta ação não
              pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleCancelDialogChange(false)}
              disabled={cancelling}
            >
              Voltar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmCancel}
              disabled={cancelling}
            >
              {cancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelando…
                </>
              ) : (
                'Confirmar cancelamento'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
