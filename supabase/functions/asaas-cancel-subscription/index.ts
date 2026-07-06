import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { asaasFetch } from "../_shared/asaas.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

interface CancelSubscriptionBody {
  subscription_id: string;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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

  let body: CancelSubscriptionBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { subscription_id } = body;
  if (!subscription_id) {
    return jsonResponse({ error: "Missing subscription_id" }, 400);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("id, asaas_subscription_id, status")
    .eq("id", subscription_id)
    .single();

  if (subscriptionError || !subscription) {
    return jsonResponse({ error: "Subscription not found" }, 404);
  }

  if (subscription.status === "cancelled") {
    return jsonResponse({ subscription_id: subscription.id, status: "cancelled" });
  }

  try {
    await asaasFetch(
      `/subscriptions/${encodeURIComponent(subscription.asaas_subscription_id)}`,
      { method: "DELETE" },
    );

    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({ status: "cancelled" })
      .eq("id", subscription.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return jsonResponse({
      subscription_id: subscription.id,
      status: "cancelled",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ error: message }, 502);
  }
});
