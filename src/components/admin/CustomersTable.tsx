import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCentsBRL, PLAN_CONFIG } from '@/lib/plans';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';
import type { Customer, PlanSlug, Subscription, SubscriptionStatus } from '@/types/crm';

type SubscriptionSummary = Pick<
  Subscription,
  'plan_slug' | 'status' | 'value_cents' | 'next_due_date'
>;

type CustomerWithSubscriptions = Customer & {
  subscriptions: SubscriptionSummary[];
};

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

function getActiveSubscription(
  subscriptions: SubscriptionSummary[] | null | undefined
): SubscriptionSummary | undefined {
  return subscriptions?.find((s) => s.status === 'active');
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

export default function CustomersTable() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerWithSubscriptions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('customers')
      .select('*, subscriptions(plan_slug, status, value_cents, next_due_date)')
      .order('created_at', { ascending: false });
    if (err) setError(err.message);
    else setCustomers((data as CustomerWithSubscriptions[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleRowClick = (customer: CustomerWithSubscriptions) => {
    if (customer.lead_id) {
      navigate(`/admin/leads/${customer.lead_id}`);
    }
  };

  return (
    <div className="flex h-full flex-col p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Clientes</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {loading
            ? 'Carregando…'
            : `${customers.length} ${customers.length === 1 ? 'cliente' : 'clientes'}`}
        </p>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Erro ao carregar clientes: {error}
          <Button variant="link" className="ml-2 h-auto p-0" onClick={fetchCustomers}>
            Tentar novamente
          </Button>
        </div>
      )}

      {loading ? (
        <TableSkeleton />
      ) : customers.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-neutral-200 py-16 text-center">
          <p className="text-sm font-medium text-neutral-600">Nenhum cliente encontrado</p>
          <p className="mt-1 text-sm text-neutral-400">
            Clientes são criados ao gerar uma assinatura no detalhe do lead.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-neutral-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Próx. vencimento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => {
                const activeSub = getActiveSubscription(customer.subscriptions);
                const planLabel = activeSub
                  ? (PLAN_CONFIG[activeSub.plan_slug as PlanSlug]?.label ?? activeSub.plan_slug)
                  : '—';
                const clickable = Boolean(customer.lead_id);

                return (
                  <TableRow
                    key={customer.id}
                    className={cn(clickable && 'cursor-pointer')}
                    onClick={() => handleRowClick(customer)}
                  >
                    <TableCell className="font-medium text-neutral-900">{customer.nome}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{planLabel}</TableCell>
                    <TableCell>
                      {activeSub ? (
                        <StatusBadge status={activeSub.status} />
                      ) : (
                        <span className="text-sm text-neutral-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {activeSub ? formatCentsBRL(activeSub.value_cents) : '—'}
                    </TableCell>
                    <TableCell>
                      {activeSub ? formatDueDate(activeSub.next_due_date) : '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
