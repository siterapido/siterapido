# CRM Site Rápido — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the existing Vite admin into a white CRM with sales pipeline, customer records, and Asaas subscription management via Supabase Edge Functions.

**Architecture:** React admin routes lazy-loaded in `src/App.tsx`. Supabase Postgres holds leads/customers/subscriptions with RLS for authenticated users only. Three Deno Edge Functions proxy Asaas API (create/cancel subscription + webhook). No Asaas secrets in the frontend.

**Tech Stack:** React 19, Vite 7, TypeScript, Tailwind 3.4, shadcn/ui (Radix), Supabase JS + Edge Functions (Deno), Asaas API v3 sandbox.

**Spec:** `docs/superpowers/specs/2026-07-06-crm-siterapido-design.md`

---

## File map

| File | Responsibility |
|------|----------------|
| `supabase/migrations/20260706120000_crm_schema.sql` | Schema, RLS, triggers |
| `src/types/crm.ts` | Shared types and stage/plan constants |
| `src/lib/cpf.ts` | CPF/CNPJ validation (digits only) |
| `src/lib/plans.ts` | Plan slug → value/cycle labels |
| `src/lib/asaas.ts` | Frontend client calling Edge Functions |
| `src/hooks/useLeads.ts` | Fetch/update leads |
| `src/hooks/usePipeline.ts` | Group leads by stage |
| `src/hooks/useSubscriptions.ts` | Fetch subscriptions + cancel |
| `src/components/admin/AdminLayout.tsx` | White shell |
| `src/components/admin/Sidebar.tsx` | Light nav |
| `src/components/admin/PipelineBoard.tsx` | Kanban / mobile accordion |
| `src/components/admin/LeadCard.tsx` | Pipeline card |
| `src/components/admin/LeadDetail.tsx` | Detail + generate subscription |
| `src/components/admin/SubscriptionsTable.tsx` | Subscriptions list |
| `src/components/admin/CustomersTable.tsx` | Customers list |
| `supabase/functions/asaas-create-subscription/index.ts` | Create customer + subscription |
| `supabase/functions/asaas-cancel-subscription/index.ts` | Cancel subscription |
| `supabase/functions/asaas-webhook/index.ts` | Webhook handler |

---

## Prerequisites (manual, before Task 1)

1. Supabase CLI installed: `brew install supabase/tap/supabase`
2. Link project: `supabase login` then `supabase link --project-ref <PROJECT_REF>`
3. Asaas sandbox account + API key from https://sandbox.asaas.com
4. Create 3 subscription plans in Asaas sandbox (Essencial mensal R$120, Essencial anual R$997, Empresarial monthly — set value in dashboard, default R$350 in env until confirmed)

---

### Task 1: Supabase schema + CRM types

**Files:**
- Create: `supabase/migrations/20260706120000_crm_schema.sql`
- Create: `src/types/crm.ts`
- Create: `src/lib/cpf.ts`
- Create: `src/lib/plans.ts`
- Modify: `src/components/ui/LeadFormModal.tsx` (set `stage: 'novo'` on insert)

- [ ] **Step 1: Create migration**

Create `supabase/migrations/20260706120000_crm_schema.sql`:

```sql
-- CRM schema for Site Rápido
-- Run: supabase db push (or apply via dashboard SQL editor)

-- Extend leads (keep existing columns from landing form)
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS stage text NOT NULL DEFAULT 'novo',
  ADD COLUMN IF NOT EXISTS plan_slug text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS customer_id uuid,
  ADD COLUMN IF NOT EXISTS lost_reason text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_stage_check;

ALTER TABLE public.leads
  ADD CONSTRAINT leads_stage_check CHECK (
    stage IN ('novo', 'qualificado', 'demo', 'proposta', 'aguardando_pagamento', 'ativo', 'perdido')
  );

CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  nome text NOT NULL,
  email text NOT NULL,
  telefone text,
  cpf_cnpj text NOT NULL,
  asaas_customer_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  asaas_subscription_id text NOT NULL UNIQUE,
  plan_slug text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'overdue', 'cancelled')),
  billing_type text NOT NULL CHECK (billing_type IN ('PIX', 'BOLETO', 'CREDIT_CARD')),
  value_cents int NOT NULL,
  payment_url text,
  next_due_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pipeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  from_stage text,
  to_stage text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asaas_event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leads
  ADD CONSTRAINT leads_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leads_updated_at ON public.leads;
CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- pipeline_events on stage change
CREATE OR REPLACE FUNCTION public.log_lead_stage_change()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO public.pipeline_events (lead_id, from_stage, to_stage)
    VALUES (NEW.id, OLD.stage, NEW.stage);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leads_stage_change ON public.leads;
CREATE TRIGGER leads_stage_change
  AFTER UPDATE OF stage ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.log_lead_stage_change();

-- RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Drop old permissive policies if any, then create authenticated-only
DO $$ BEGIN
  DROP POLICY IF EXISTS "authenticated_all_leads" ON public.leads;
  DROP POLICY IF EXISTS "authenticated_all_customers" ON public.customers;
  DROP POLICY IF EXISTS "authenticated_all_subscriptions" ON public.subscriptions;
  DROP POLICY IF EXISTS "authenticated_all_pipeline_events" ON public.pipeline_events;
END $$;

CREATE POLICY "authenticated_all_leads" ON public.leads
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all_customers" ON public.customers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all_subscriptions" ON public.subscriptions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all_pipeline_events" ON public.pipeline_events
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- webhook_events: no client access (service role only via edge functions)
CREATE POLICY "deny_all_webhook_events" ON public.webhook_events
  FOR ALL TO authenticated USING (false);

-- Allow anon insert on leads only (landing form) — adjust if policy already exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'anon_insert_leads'
  ) THEN
    CREATE POLICY "anon_insert_leads" ON public.leads
      FOR INSERT TO anon WITH CHECK (true);
  END IF;
END $$;

-- Block anon read on leads
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'deny_anon_select_leads'
  ) THEN
    CREATE POLICY "deny_anon_select_leads" ON public.leads
      FOR SELECT TO anon USING (false);
  END IF;
END $$;
```

- [ ] **Step 2: Apply migration**

Run: `supabase db push`

Expected: migration applies without errors. If `leads` table missing, create it first in dashboard with columns matching `LeadFormModal` (`nome`, `email`, `whatsapp`, `instagram`, `plano`, `created_at`).

- [ ] **Step 3: Create `src/types/crm.ts`**

```typescript
export const PIPELINE_STAGES = [
  'novo',
  'qualificado',
  'demo',
  'proposta',
  'aguardando_pagamento',
  'ativo',
  'perdido',
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const STAGE_LABELS: Record<PipelineStage, string> = {
  novo: 'Novo',
  qualificado: 'Qualificado',
  demo: 'Demo / Call',
  proposta: 'Proposta',
  aguardando_pagamento: 'Aguardando pagamento',
  ativo: 'Ativo',
  perdido: 'Perdido',
};

export const PLAN_SLUGS = ['essencial_mensal', 'essencial_anual', 'empresarial'] as const;
export type PlanSlug = (typeof PLAN_SLUGS)[number];

export type SubscriptionStatus = 'pending' | 'active' | 'overdue' | 'cancelled';
export type BillingType = 'PIX' | 'BOLETO' | 'CREDIT_CARD';

export interface Lead {
  id: string;
  nome: string;
  email: string;
  whatsapp?: string | null;
  telefone?: string | null;
  instagram?: string | null;
  plano?: string | null;
  mensagem?: string | null;
  stage: PipelineStage;
  plan_slug: PlanSlug | null;
  notes: string | null;
  customer_id: string | null;
  lost_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  lead_id: string | null;
  nome: string;
  email: string;
  telefone: string | null;
  cpf_cnpj: string;
  asaas_customer_id: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  customer_id: string;
  lead_id: string | null;
  asaas_subscription_id: string;
  plan_slug: PlanSlug;
  status: SubscriptionStatus;
  billing_type: BillingType;
  value_cents: number;
  payment_url: string | null;
  next_due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface PipelineEvent {
  id: string;
  lead_id: string;
  from_stage: PipelineStage | null;
  to_stage: PipelineStage;
  metadata: Record<string, unknown> | null;
  created_at: string;
}
```

- [ ] **Step 4: Create `src/lib/cpf.ts`**

```typescript
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function isValidCpf(cpf: string): boolean {
  const digits = onlyDigits(cpf);
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(digits[i]) * (10 - i);
  let check = (sum * 10) % 11;
  if (check === 10) check = 0;
  if (check !== Number(digits[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(digits[i]) * (11 - i);
  check = (sum * 10) % 11;
  if (check === 10) check = 0;
  return check === Number(digits[10]);
}

export function isValidCnpj(cnpj: string): boolean {
  const digits = onlyDigits(cnpj);
  if (digits.length !== 14 || /^(\d)\1+$/.test(digits)) return false;
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(digits[i]) * weights1[i];
  let check = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (check !== Number(digits[12])) return false;
  sum = 0;
  for (let i = 0; i < 13; i++) sum += Number(digits[i]) * weights2[i];
  check = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return check === Number(digits[13]);
}

export function isValidCpfCnpj(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length === 11) return isValidCpf(value);
  if (digits.length === 14) return isValidCnpj(value);
  return false;
}
```

- [ ] **Step 5: Create `src/lib/plans.ts`**

```typescript
import type { PlanSlug } from '@/types/crm';

export const PLAN_CONFIG: Record<PlanSlug, { label: string; valueCents: number; cycle: 'MONTHLY' | 'YEARLY' }> = {
  essencial_mensal: { label: 'Essencial mensal', valueCents: 12000, cycle: 'MONTHLY' },
  essencial_anual: { label: 'Essencial anual', valueCents: 99700, cycle: 'YEARLY' },
  empresarial: { label: 'Empresarial', valueCents: 35000, cycle: 'MONTHLY' },
};

export function formatCentsBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
```

- [ ] **Step 6: Update LeadFormModal insert**

In `src/components/ui/LeadFormModal.tsx`, change insert payload:

```typescript
const { error } = await supabase.from('leads').insert([
  { nome, email, whatsapp, instagram, plano: planoLabel, stage: 'novo' }
]);
```

- [ ] **Step 7: Verify build**

Run: `npm run build`

Expected: exit 0

- [ ] **Step 8: Commit**

```bash
git add supabase/migrations/ src/types/crm.ts src/lib/cpf.ts src/lib/plans.ts src/components/ui/LeadFormModal.tsx
git commit -m "feat(crm): add supabase schema and shared types"
```

---

### Task 2: shadcn components + white admin shell

**Files:**
- Modify: via CLI — `table`, `sheet`, `dialog`, `select`, `dropdown-menu`, `tabs`, `skeleton`, `sonner`
- Modify: `src/components/admin/AdminLayout.tsx`
- Modify: `src/components/admin/Sidebar.tsx`
- Modify: `src/components/admin/Login.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/lazy.tsx`

- [ ] **Step 1: Add shadcn components**

Run:

```bash
npx shadcn@latest add table sheet dialog select dropdown-menu tabs skeleton sonner -y
```

Expected: new files under `src/components/ui/`

- [ ] **Step 2: Mount Toaster in App**

Add to `src/App.tsx` imports and JSX root:

```typescript
import { Toaster } from '@/components/ui/sonner';

// inside App return, wrap Routes:
<>
  <Routes>...</Routes>
  <Toaster richColors position="top-right" />
</>
```

- [ ] **Step 3: Rewrite `AdminLayout.tsx`**

```tsx
import Sidebar from './Sidebar';
import type { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white font-sans text-neutral-900">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-white">{children}</main>
    </div>
  );
}
```

- [ ] **Step 4: Rewrite `Sidebar.tsx`**

```tsx
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, CreditCard, Users, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';

const menu = [
  { label: 'Pipeline', path: '/admin/pipeline', icon: LayoutGrid },
  { label: 'Assinaturas', path: '/admin/assinaturas', icon: CreditCard },
  { label: 'Clientes', path: '/admin/clientes', icon: Users },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-neutral-200 bg-neutral-50 p-4">
      <div className="mb-8 px-2">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Site Rápido</p>
        <p className="text-lg font-semibold text-neutral-900">CRM</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {menu.map(({ label, path, icon: Icon }) => {
          const active = location.pathname === path || location.pathname.startsWith(path + '/');
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:bg-white/70 hover:text-neutral-900'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={handleLogout}
        className="mt-auto flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-white hover:text-neutral-900"
      >
        <LogOut className="h-4 w-4" />
        Sair
      </button>
    </aside>
  );
}
```

- [ ] **Step 5: Update Login redirect target**

In `src/App.tsx`, change login callback:

```typescript
<Route path="/admin/login" element={<LazyLogin onLogin={() => window.location.href = '/admin/pipeline'} />} />
```

Add routes (placeholders use lazy components from Task 3):

```typescript
<Route path="/admin" element={<Navigate to="/admin/pipeline" replace />} />
<Route path="/admin/pipeline" element={<ProtectedRoute><LazyAdminLayout><LazyPipelineBoard /></LazyAdminLayout></ProtectedRoute>} />
<Route path="/admin/leads/:id" element={<ProtectedRoute><LazyAdminLayout><LazyLeadDetail /></LazyAdminLayout></ProtectedRoute>} />
<Route path="/admin/assinaturas" element={<ProtectedRoute><LazyAdminLayout><LazySubscriptionsTable /></LazyAdminLayout></ProtectedRoute>} />
<Route path="/admin/clientes" element={<ProtectedRoute><LazyAdminLayout><LazyCustomersTable /></LazyAdminLayout></ProtectedRoute>} />
<Route path="/admin/leads" element={<Navigate to="/admin/pipeline" replace />} />
```

- [ ] **Step 6: Add lazy exports in `src/components/lazy.tsx`**

```typescript
export const LazyPipelineBoard = withLazyLoading(
  lazy(() => import('./admin/PipelineBoard').then(m => ({ default: m.default })))
);
export const LazyLeadDetail = withLazyLoading(
  lazy(() => import('./admin/LeadDetail').then(m => ({ default: m.default })))
);
export const LazySubscriptionsTable = withLazyLoading(
  lazy(() => import('./admin/SubscriptionsTable').then(m => ({ default: m.default })))
);
export const LazyCustomersTable = withLazyLoading(
  lazy(() => import('./admin/CustomersTable').then(m => ({ default: m.default })))
);
```

Create stub files that return `<div>Em breve</div>` until Task 3/8 fill them.

- [ ] **Step 7: Verify**

Run: `npm run build` — exit 0

- [ ] **Step 8: Commit**

```bash
git commit -am "feat(crm): white admin shell and routing"
```

---

### Task 3: Data hooks + Pipeline kanban

**Files:**
- Create: `src/hooks/useLeads.ts`
- Create: `src/hooks/usePipeline.ts`
- Create: `src/components/admin/LeadCard.tsx`
- Create: `src/components/admin/PipelineBoard.tsx`

- [ ] **Step 1: Create `useLeads.ts`**

```typescript
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Lead, PipelineStage } from '@/types/crm';

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('leads')
      .select('*')
      .order('updated_at', { ascending: false });
    if (err) setError(err.message);
    else setLeads((data as Lead[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const updateStage = async (leadId: string, stage: PipelineStage, lostReason?: string) => {
    const payload: Partial<Lead> = { stage };
    if (stage === 'perdido' && lostReason) payload.lost_reason = lostReason;
    const { error: err } = await supabase.from('leads').update(payload).eq('id', leadId);
    if (err) throw new Error(err.message);
    await fetchLeads();
  };

  return { leads, loading, error, fetchLeads, updateStage };
}
```

- [ ] **Step 2: Create `usePipeline.ts`**

```typescript
import { useMemo } from 'react';
import { PIPELINE_STAGES, STAGE_LABELS, type Lead, type PipelineStage } from '@/types/crm';

export function usePipeline(leads: Lead[]) {
  return useMemo(() => {
    const columns = PIPELINE_STAGES.filter(s => s !== 'perdido').map(stage => ({
      stage,
      label: STAGE_LABELS[stage],
      leads: leads.filter(l => l.stage === stage),
    }));
    const lost = leads.filter(l => l.stage === 'perdido');
    return { columns, lost };
  }, [leads]);
}

export function daysInStage(updatedAt: string): number {
  const diff = Date.now() - new Date(updatedAt).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}
```

- [ ] **Step 3: Create `LeadCard.tsx`**

Card with link to `/admin/leads/:id`, name, plan badge if `plan_slug`, days in stage. Use `Badge` from shadcn.

- [ ] **Step 4: Create `PipelineBoard.tsx`**

- Header: "Pipeline" + count
- Desktop (`md+`): horizontal scroll, 6 columns from `usePipeline`, each column has stage label + count + `LeadCard` list
- Mobile: `Accordion` grouped by stage (no drag)
- Stage change: `DropdownMenu` on each card "Mover para…" calling `updateStage`
- Loading: 6 `Skeleton` blocks
- Empty column: "Nenhum lead"

- [ ] **Step 5: Manual test**

Run: `npm run dev`
1. Login at `/admin/login`
2. Pipeline shows leads with `stage = novo`
3. Move lead to `qualificado` via dropdown
4. Check Supabase `pipeline_events` has one row

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useLeads.ts src/hooks/usePipeline.ts src/components/admin/LeadCard.tsx src/components/admin/PipelineBoard.tsx
git commit -m "feat(crm): pipeline kanban with stage moves"
```

---

### Task 4: Lead detail page

**Files:**
- Create: `src/components/admin/LeadDetail.tsx`
- Create: `src/hooks/useLeadDetail.ts` (optional inline in component)

- [ ] **Step 1: Build LeadDetail**

Sections:
1. Back link to `/admin/pipeline`
2. Contact info (nome, email, whatsapp/telefone, instagram, plano from landing)
3. `Select` for stage (all PIPELINE_STAGES)
4. `Textarea` for notes (debounced save on blur)
5. Plan radio: essencial_mensal / essencial_anual / empresarial
6. CPF/CNPJ `Input` with validation via `isValidCpfCnpj`
7. Billing type `Select`: PIX / BOLETO / CREDIT_CARD
8. Timeline: fetch `pipeline_events` for lead, render list
9. "Gerar assinatura Asaas" button — disabled until stage is `proposta` or later AND valid cpf AND plan selected (wired in Task 6)

- [ ] **Step 2: Fetch single lead**

```typescript
const { data, error } = await supabase.from('leads').select('*').eq('id', id).single();
```

- [ ] **Step 3: Lost reason dialog**

When moving to `perdido`, open `Dialog` requiring `lost_reason` text before save.

- [ ] **Step 4: Manual test**

Navigate to lead detail, edit notes, change stage, verify timeline updates.

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(crm): lead detail with timeline and plan selection"
```

---

### Task 5: Edge Function — asaas-create-subscription

**Files:**
- Create: `supabase/functions/asaas-create-subscription/index.ts`
- Create: `supabase/functions/_shared/asaas.ts`
- Create: `supabase/functions/_shared/cors.ts`

- [ ] **Step 1: Shared Asaas client**

`supabase/functions/_shared/asaas.ts`:

```typescript
const ASAAS_ENV = Deno.env.get('ASAAS_ENV') ?? 'sandbox';
const BASE_URL = ASAAS_ENV === 'production'
  ? 'https://api.asaas.com/api/v3'
  : 'https://sandbox.asaas.com/api/v3';

export async function asaasFetch(path: string, init: RequestInit = {}) {
  const key = Deno.env.get('ASAAS_API_KEY');
  if (!key) throw new Error('ASAAS_API_KEY not configured');
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      access_token: key,
      ...(init.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = body?.errors?.[0]?.description ?? res.statusText;
    throw new Error(`Asaas ${res.status}: ${msg}`);
  }
  return body;
}
```

- [ ] **Step 2: Create function**

`supabase/functions/asaas-create-subscription/index.ts` logic:

1. CORS preflight
2. Verify JWT from `Authorization` header via `supabase.auth.getUser()`
3. Parse body: `{ lead_id, plan_slug, cpf_cnpj, billing_type }`
4. Load lead from DB with service role client
5. Map plan_slug → value + cycle (mirror `plans.ts` constants inline)
6. Find or create Asaas customer by email (`GET /customers?email=` then `POST /customers`)
7. `POST /subscriptions` with `customer`, `billingType`, `value`, `cycle`, `nextDueDate` (today + 3 days), `description`
8. Insert/update `customers`, `subscriptions` rows
9. Update lead: `stage = aguardando_pagamento`, `plan_slug`, `customer_id`
10. Return `{ payment_url, subscription_id, asaas_subscription_id }`

Payment URL: use `invoiceUrl` from first payment of subscription response, or construct from Asaas payment link field returned.

- [ ] **Step 3: Set secrets**

```bash
supabase secrets set ASAAS_API_KEY=<sandbox_key> ASAAS_ENV=sandbox ASAAS_WEBHOOK_TOKEN=<random_token>
```

- [ ] **Step 4: Deploy**

```bash
supabase functions deploy asaas-create-subscription
```

- [ ] **Step 5: Test with curl**

```bash
curl -X POST "$SUPABASE_URL/functions/v1/asaas-create-subscription" \
  -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{"lead_id":"<uuid>","plan_slug":"essencial_mensal","cpf_cnpj":"24971563792","billing_type":"PIX"}'
```

Expected: JSON with `payment_url`, lead stage updated in DB.

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/
git commit -m "feat(crm): asaas-create-subscription edge function"
```

---

### Task 6: Frontend Asaas client + wire generate button

**Files:**
- Create: `src/lib/asaas.ts`
- Modify: `src/components/admin/LeadDetail.tsx`

- [ ] **Step 1: Create `src/lib/asaas.ts`**

```typescript
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
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;
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
```

- [ ] **Step 2: Wire button in LeadDetail**

On click:
1. Validate cpf/cnpj + plan
2. Set loading state
3. Call `createSubscription`
4. `toast.success('Assinatura criada')`
5. Show payment URL with copy button
6. Refetch lead (stage should be `aguardando_pagamento`)

On error: `toast.error(err.message)`

- [ ] **Step 3: Manual sandbox test**

Full flow: proposta → generate → open payment_url in browser.

- [ ] **Step 4: Commit**

```bash
git commit -am "feat(crm): wire generate subscription from lead detail"
```

---

### Task 7: Edge Function — asaas-webhook

**Files:**
- Create: `supabase/functions/asaas-webhook/index.ts`

- [ ] **Step 1: Implement webhook**

1. Verify `asaas-access-token` header matches `ASAAS_WEBHOOK_TOKEN`
2. Parse event body; extract `id` as `asaas_event_id`
3. Insert into `webhook_events` — on unique violation return 200 (idempotent)
4. Handle events:
   - `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`: find subscription by `asaas_subscription_id` from payment, set `status = active`, lead `stage = ativo`, ensure customer exists
   - `PAYMENT_OVERDUE`: `status = overdue`
   - `SUBSCRIPTION_DELETED`: `status = cancelled`
   - `PAYMENT_REFUNDED`: `status = cancelled`, insert pipeline_event metadata
5. Use service role Supabase client

- [ ] **Step 2: Deploy + configure Asaas webhook URL**

URL: `https://<PROJECT_REF>.supabase.co/functions/v1/asaas-webhook`

In Asaas sandbox: Configurações → Webhooks → add URL + same token.

- [ ] **Step 3: Test**

Pay sandbox invoice or use Asaas "simular webhook" if available. Verify lead → `ativo`.

- [ ] **Step 4: Commit**

```bash
git commit -am "feat(crm): asaas webhook handler with idempotency"
```

---

### Task 8: Subscriptions + Customers pages

**Files:**
- Create: `src/hooks/useSubscriptions.ts`
- Create: `src/components/admin/SubscriptionsTable.tsx`
- Create: `src/components/admin/CustomersTable.tsx`

- [ ] **Step 1: `useSubscriptions.ts`**

Fetch:

```typescript
const { data } = await supabase
  .from('subscriptions')
  .select('*, customers(nome, email)')
  .order('created_at', { ascending: false });
```

- [ ] **Step 2: SubscriptionsTable**

shadcn `Table` columns: Cliente, Plano, Status (Badge color by status), Valor, Próx. vencimento, Ações (copiar link, cancelar).

Status badge colors:
- pending: neutral
- active: green
- overdue: amber
- cancelled: neutral muted

- [ ] **Step 3: CustomersTable**

Join customers + active subscription. Click row → `/admin/leads/:lead_id` if lead_id exists.

- [ ] **Step 4: Manual test**

After webhook, customer appears in table with active subscription.

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(crm): subscriptions and customers tables"
```

---

### Task 9: Cancel subscription

**Files:**
- Create: `supabase/functions/asaas-cancel-subscription/index.ts`
- Modify: `src/lib/asaas.ts`
- Modify: `src/components/admin/SubscriptionsTable.tsx`

- [ ] **Step 1: Edge function**

`DELETE` Asaas `/subscriptions/{id}`, update local `status = cancelled`. Require JWT.

- [ ] **Step 2: Frontend `cancelSubscription(subscriptionId)`**

Call edge function, toast, refetch.

- [ ] **Step 3: Confirm dialog before cancel**

shadcn `Dialog`: "Cancelar assinatura de {nome}?"

- [ ] **Step 4: Deploy + test**

```bash
supabase functions deploy asaas-cancel-subscription
```

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(crm): cancel subscription via asaas"
```

---

### Task 10: Polish + cleanup

**Files:**
- Delete or gut: `src/components/admin/LeadsList.tsx`
- Modify: `src/lib/supabaseClient.ts` (remove console.log of URL/KEY)
- Modify: `vite.config.ts` (add PipelineBoard, LeadDetail chunk names if desired)

- [ ] **Step 1: Remove debug logs from supabaseClient**

Delete lines logging URL and KEY.

- [ ] **Step 2: Mobile accordion QA**

Resize to 375px, pipeline uses accordion not horizontal kanban.

- [ ] **Step 3: Empty states on all tables/board**

- [ ] **Step 4: Run lint + build**

```bash
npm run lint && npm run build
```

Expected: exit 0

- [ ] **Step 5: Security check**

In browser console (logged out): `supabase.from('leads').select()` should error/empty for anon.

- [ ] **Step 6: Commit**

```bash
git commit -am "chore(crm): polish admin UX and remove debug logs"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Extend leads + new tables | Task 1 |
| RLS authenticated only | Task 1 |
| White admin shell | Task 2 |
| Routes pipeline/leads/assinaturas/clientes | Task 2 |
| Kanban + mobile accordion | Task 3 |
| Lead detail + timeline | Task 4 |
| Semi-auto Asaas create | Tasks 5–6 |
| Webhook sync | Task 7 |
| Subscriptions + customers pages | Task 8 |
| Cancel subscription | Task 9 |
| Skeleton/empty/toast | Tasks 2–3, 10 |
| Sandbox first | Task 5 prerequisites |

## Open items (non-blocking)

- Empresarial `valueCents`: default 35000 in `plans.ts`; override via Asaas dashboard plan value
- Run `impeccable teach` for PRODUCT.md / DESIGN.md (post-MVP)
