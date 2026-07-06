import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

interface AsaasWebhookPayload {
  id: string;
  event: string;
  payment?: {
    id?: string;
    subscription?: string;
    customer?: string;
    dueDate?: string;
    [key: string]: unknown;
  };
  subscription?: {
    id?: string;
    [key: string]: unknown;
  };
}

interface LocalSubscription {
  id: string;
  lead_id: string | null;
  customer_id: string | null;
  status: string;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function isUniqueViolation(error: { code?: string }): boolean {
  return error.code === "23505";
}

function getAsaasSubscriptionId(payload: AsaasWebhookPayload): string | null {
  const fromPayment = payload.payment?.subscription;
  if (typeof fromPayment === "string" && fromPayment.length > 0) {
    return fromPayment;
  }

  const fromSubscription = payload.subscription?.id;
  if (typeof fromSubscription === "string" && fromSubscription.length > 0) {
    return fromSubscription;
  }

  return null;
}

async function findSubscriptionByAsaasId(
  supabase: SupabaseClient,
  asaasSubscriptionId: string,
): Promise<LocalSubscription | null> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("id, lead_id, customer_id, status")
    .eq("asaas_subscription_id", asaasSubscriptionId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

async function ensureCustomerLinked(
  supabase: SupabaseClient,
  subscription: LocalSubscription,
): Promise<void> {
  if (subscription.customer_id || !subscription.lead_id) return;

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("customer_id")
    .eq("id", subscription.lead_id)
    .single();

  if (leadError || !lead) return;

  let customerId = lead.customer_id as string | null;

  if (!customerId) {
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id")
      .eq("lead_id", subscription.lead_id)
      .maybeSingle();

    customerId = existingCustomer?.id ?? null;
  }

  if (!customerId) return;

  await supabase
    .from("subscriptions")
    .update({ customer_id: customerId })
    .eq("id", subscription.id);

  if (!lead.customer_id) {
    await supabase
      .from("leads")
      .update({ customer_id: customerId })
      .eq("id", subscription.lead_id);
  }
}

async function handlePaymentActive(
  supabase: SupabaseClient,
  payload: AsaasWebhookPayload,
): Promise<void> {
  const asaasSubscriptionId = getAsaasSubscriptionId(payload);
  if (!asaasSubscriptionId) return;

  const subscription = await findSubscriptionByAsaasId(supabase, asaasSubscriptionId);
  if (!subscription) return;

  const dueDate = payload.payment?.dueDate;
  const subscriptionUpdate: Record<string, unknown> = { status: "active" };
  if (typeof dueDate === "string") {
    subscriptionUpdate.next_due_date = dueDate;
  }

  const { error: subscriptionError } = await supabase
    .from("subscriptions")
    .update(subscriptionUpdate)
    .eq("id", subscription.id);

  if (subscriptionError) throw new Error(subscriptionError.message);

  await ensureCustomerLinked(supabase, subscription);

  if (subscription.lead_id) {
    const { error: leadError } = await supabase
      .from("leads")
      .update({ stage: "ativo" })
      .eq("id", subscription.lead_id);

    if (leadError) throw new Error(leadError.message);
  }
}

async function handlePaymentOverdue(
  supabase: SupabaseClient,
  payload: AsaasWebhookPayload,
): Promise<void> {
  const asaasSubscriptionId = getAsaasSubscriptionId(payload);
  if (!asaasSubscriptionId) return;

  const subscription = await findSubscriptionByAsaasId(supabase, asaasSubscriptionId);
  if (!subscription) return;

  const { error } = await supabase
    .from("subscriptions")
    .update({ status: "overdue" })
    .eq("id", subscription.id);

  if (error) throw new Error(error.message);
}

async function handleSubscriptionCancelled(
  supabase: SupabaseClient,
  payload: AsaasWebhookPayload,
): Promise<void> {
  const asaasSubscriptionId = getAsaasSubscriptionId(payload);
  if (!asaasSubscriptionId) return;

  const subscription = await findSubscriptionByAsaasId(supabase, asaasSubscriptionId);
  if (!subscription) return;

  const { error } = await supabase
    .from("subscriptions")
    .update({ status: "cancelled" })
    .eq("id", subscription.id);

  if (error) throw new Error(error.message);
}

async function handlePaymentRefunded(
  supabase: SupabaseClient,
  payload: AsaasWebhookPayload,
): Promise<void> {
  const asaasSubscriptionId = getAsaasSubscriptionId(payload);
  if (!asaasSubscriptionId) return;

  const subscription = await findSubscriptionByAsaasId(supabase, asaasSubscriptionId);
  if (!subscription) return;

  const { error: subscriptionError } = await supabase
    .from("subscriptions")
    .update({ status: "cancelled" })
    .eq("id", subscription.id);

  if (subscriptionError) throw new Error(subscriptionError.message);

  if (!subscription.lead_id) return;

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("stage")
    .eq("id", subscription.lead_id)
    .single();

  if (leadError || !lead) return;

  const { error: pipelineError } = await supabase.from("pipeline_events").insert({
    lead_id: subscription.lead_id,
    from_stage: lead.stage,
    to_stage: lead.stage,
    metadata: {
      type: "payment_refunded",
      asaas_event_id: payload.id,
      payment_id: payload.payment?.id ?? null,
      asaas_subscription_id: asaasSubscriptionId,
    },
  });

  if (pipelineError) throw new Error(pipelineError.message);
}

async function processEvent(
  supabase: SupabaseClient,
  eventType: string,
  payload: AsaasWebhookPayload,
): Promise<void> {
  switch (eventType) {
    case "PAYMENT_CONFIRMED":
    case "PAYMENT_RECEIVED":
      await handlePaymentActive(supabase, payload);
      break;
    case "PAYMENT_OVERDUE":
      await handlePaymentOverdue(supabase, payload);
      break;
    case "SUBSCRIPTION_DELETED":
      await handleSubscriptionCancelled(supabase, payload);
      break;
    case "PAYMENT_REFUNDED":
      await handlePaymentRefunded(supabase, payload);
      break;
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const webhookToken = Deno.env.get("ASAAS_WEBHOOK_TOKEN");
  const accessToken = req.headers.get("asaas-access-token");

  if (!webhookToken || accessToken !== webhookToken) {
    console.error("Invalid or missing asaas-access-token");
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Server configuration error" }, 500);
  }

  let payload: AsaasWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const asaasEventId = payload.id;
  const eventType = payload.event;

  if (!asaasEventId || !eventType) {
    return jsonResponse({ error: "Missing event id or type" }, 400);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { error: insertError } = await supabase.from("webhook_events").insert({
    asaas_event_id: asaasEventId,
    event_type: eventType,
    payload,
  });

  if (insertError) {
    if (isUniqueViolation(insertError)) {
      return jsonResponse({ received: true, duplicate: true });
    }
    return jsonResponse({ error: insertError.message }, 500);
  }

  try {
    await processEvent(supabase, eventType, payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook processing error:", message);
    return jsonResponse({ error: message }, 500);
  }

  return jsonResponse({ received: true });
});
