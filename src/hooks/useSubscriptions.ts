import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Subscription } from '@/types/crm';

export type SubscriptionWithCustomer = Subscription & {
  customers: { nome: string; email: string } | null;
};

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('subscriptions')
      .select('*, customers(nome, email)')
      .order('created_at', { ascending: false });
    if (err) setError(err.message);
    else setSubscriptions((data as SubscriptionWithCustomer[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  return { subscriptions, loading, error, fetchSubscriptions };
}
