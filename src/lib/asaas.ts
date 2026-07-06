import { supabase } from '@/lib/supabaseClient';
import type { BillingType, PlanSlug } from '@/types/crm';

export interface CreateSubscriptionResult {
  payment_url: string;
  subscription_id: string;
  asaas_subscription_id: string;
}

export async function createSubscription(input: {
  lead_id: string;
  plan_slug: PlanSlug;
  cpf_cnpj: string;
  billing_type: BillingType;
}): Promise<CreateSubscriptionResult> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('Não autenticado');

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/asaas-create-subscription`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? 'Erro ao criar assinatura');
  return body;
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('Não autenticado');

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/asaas-cancel-subscription`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ subscription_id: subscriptionId }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? 'Erro ao cancelar assinatura');
}
