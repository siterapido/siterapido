import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { asaasFetch } from "../_shared/asaas.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

const PLAN_MAP = {
  essencial_mensal: {
    label: "Essencial mensal",
    valueCents: 12000,
    cycle: "MONTHLY",
  },
  essencial_anual: {
    label: "Essencial anual",
    valueCents: 99700,
    cycle: "YEARLY",
  },
  empresarial: {
    label: "Empresarial",
    valueCents: 35000,
    cycle: "MONTHLY",
  },
} as const;

type PlanSlug = keyof typeof PLAN_MAP;
type BillingType = "PIX" | "BOLETO" | "CREDIT_CARD";

const BILLING_TYPES = new Set<BillingType>(["PIX", "BOLETO", "CREDIT_CARD"]);
const ALLOWED_STAGES = new Set(["proposta", "aguardando_pagamento"]);

interface CreateSubscriptionBody {
  lead_id: string;
  plan_slug: PlanSlug;
  cpf_cnpj: string;
  billing_type: BillingType;
}

interface AsaasCustomer {
  id: string;
}

interface AsaasPayment {
  invoiceUrl?: string;
  bankSlipUrl?: string;
  transactionReceiptUrl?: string;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function addDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function isPlanSlug(value: string): value is PlanSlug {
  return value in PLAN_MAP;
}

function extractPaymentUrl(
  subscription: Record<string, unknown>,
): string | null {
  if (typeof subscription.invoiceUrl === "string") {
    return subscription.invoiceUrl;
  }
  if (typeof subscription.paymentLink === "string") {
    return subscription.paymentLink;
  }

  const payments = subscription.payments as AsaasPayment[] | undefined;
  const first = payments?.[0];
  return (
    first?.invoiceUrl ??
      first?.bankSlipUrl ??
      first?.transactionReceiptUrl ??
      null
  );
}

async function resolvePaymentUrl(
  asaasSubscriptionId: string,
  subscriptionResponse: Record<string, unknown>,
): Promise<string | null> {
  const fromResponse = extractPaymentUrl(subscriptionResponse);
  if (fromResponse) return fromResponse;

  const payments = await asaasFetch(
    `/payments?subscription=${encodeURIComponent(asaasSubscriptionId)}&status=PENDING&limit=1`,
  );
  const list = payments.data as AsaasPayment[] | undefined;
  const payment = list?.[0];
  return (
    payment?.invoiceUrl ??
      payment?.bankSlipUrl ??
      payment?.transactionReceiptUrl ??
      null
  );
}

async function findOrCreateAsaasCustomer(
  nome: string,
  email: string,
  cpfCnpj: string,
  telefone: string | null,
): Promise<string> {
  const existing = await asaasFetch(
    `/customers?email=${encodeURIComponent(email)}`,
  );
  const customers = existing.data as AsaasCustomer[] | undefined;
  if (customers?.length) {
    return customers[0].id;
  }

  const created = await asaasFetch("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: nome,
      email,
      cpfCnpj,
      ...(telefone ? { mobilePhone: telefone } : {}),
    }),
  });

  if (typeof created.id !== "string") {
    throw new Error("Asaas customer creation returned no id");
  }

  return created.id;
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return jsonResponse({ error: "Server configuration error" }, 500);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  let body: CreateSubscriptionBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { lead_id, plan_slug, cpf_cnpj, billing_type } = body;

  if (!lead_id || !plan_slug || !cpf_cnpj || !billing_type) {
    return jsonResponse({ error: "Missing required fields" }, 400);
  }

  if (!isPlanSlug(plan_slug)) {
    return jsonResponse({ error: "Invalid plan_slug" }, 400);
  }

  if (!BILLING_TYPES.has(billing_type)) {
    return jsonResponse({ error: "Invalid billing_type" }, 400);
  }

  const plan = PLAN_MAP[plan_slug];
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id, nome, email, whatsapp, telefone, stage, customer_id")
    .eq("id", lead_id)
    .single();

  if (leadError || !lead) {
    return jsonResponse({ error: "Lead not found" }, 404);
  }

  if (!ALLOWED_STAGES.has(lead.stage)) {
    return jsonResponse(
      { error: "Lead stage must be proposta or aguardando_pagamento" },
      400,
    );
  }

  const telefone = lead.telefone ?? lead.whatsapp ?? null;

  try {
    const asaasCustomerId = await findOrCreateAsaasCustomer(
      lead.nome,
      lead.email,
      cpf_cnpj,
      telefone,
    );

    let customerId = lead.customer_id as string | null;

    if (customerId) {
      const { error: customerUpdateError } = await supabase
        .from("customers")
        .update({
          cpf_cnpj,
          asaas_customer_id: asaasCustomerId,
          nome: lead.nome,
          email: lead.email,
          telefone,
        })
        .eq("id", customerId);

      if (customerUpdateError) {
        throw new Error(customerUpdateError.message);
      }
    } else {
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id")
        .eq("lead_id", lead_id)
        .maybeSingle();

      if (existingCustomer?.id) {
        customerId = existingCustomer.id;
        const { error: customerUpdateError } = await supabase
          .from("customers")
          .update({
            cpf_cnpj,
            asaas_customer_id: asaasCustomerId,
            nome: lead.nome,
            email: lead.email,
            telefone,
          })
          .eq("id", customerId);

        if (customerUpdateError) {
          throw new Error(customerUpdateError.message);
        }
      } else {
        const { data: newCustomer, error: customerInsertError } = await supabase
          .from("customers")
          .insert({
            lead_id,
            nome: lead.nome,
            email: lead.email,
            telefone,
            cpf_cnpj,
            asaas_customer_id: asaasCustomerId,
          })
          .select("id")
          .single();

        if (customerInsertError || !newCustomer) {
          throw new Error(customerInsertError?.message ?? "Customer insert failed");
        }

        customerId = newCustomer.id;
      }
    }

    const asaasValue = plan.valueCents / 100;
    const nextDueDate = addDays(3);

    const asaasSubscription = await asaasFetch("/subscriptions", {
      method: "POST",
      body: JSON.stringify({
        customer: asaasCustomerId,
        billingType: billing_type,
        value: asaasValue,
        cycle: plan.cycle,
        nextDueDate,
        description: `Site Rápido — ${plan.label}`,
      }),
    });

    const asaasSubscriptionId = asaasSubscription.id;
    if (typeof asaasSubscriptionId !== "string") {
      throw new Error("Asaas subscription creation returned no id");
    }

    const paymentUrl = await resolvePaymentUrl(
      asaasSubscriptionId,
      asaasSubscription,
    );

    const { data: subscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .insert({
        customer_id: customerId,
        lead_id,
        asaas_subscription_id: asaasSubscriptionId,
        plan_slug,
        status: "pending",
        billing_type,
        value_cents: plan.valueCents,
        payment_url: paymentUrl,
        next_due_date: nextDueDate,
      })
      .select("id")
      .single();

    if (subscriptionError || !subscription) {
      throw new Error(subscriptionError?.message ?? "Subscription insert failed");
    }

    const { error: leadUpdateError } = await supabase
      .from("leads")
      .update({
        stage: "aguardando_pagamento",
        plan_slug,
        customer_id: customerId,
      })
      .eq("id", lead_id);

    if (leadUpdateError) {
      throw new Error(leadUpdateError.message);
    }

    return jsonResponse({
      payment_url: paymentUrl,
      subscription_id: subscription.id,
      asaas_subscription_id: asaasSubscriptionId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ error: message }, 502);
  }
});
