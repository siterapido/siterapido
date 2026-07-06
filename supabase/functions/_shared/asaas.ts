const ASAAS_ENV = Deno.env.get("ASAAS_ENV") ?? "sandbox";
const BASE_URL =
  ASAAS_ENV === "production"
    ? "https://api.asaas.com/api/v3"
    : "https://sandbox.asaas.com/api/v3";

export async function asaasFetch(
  path: string,
  init: RequestInit = {},
): Promise<Record<string, unknown>> {
  const key = Deno.env.get("ASAAS_API_KEY");
  if (!key) throw new Error("ASAAS_API_KEY not configured");

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      access_token: key,
      ...(init.headers ?? {}),
    },
  });

  const body = await res.json().catch(() => ({})) as {
    errors?: Array<{ description?: string }>;
  };

  if (!res.ok) {
    const msg = body?.errors?.[0]?.description ?? res.statusText;
    throw new Error(`Asaas ${res.status}: ${msg}`);
  }

  return body as Record<string, unknown>;
}
