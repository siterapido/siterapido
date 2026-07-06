# CRM Site Rápido — Design Spec

**Date:** 2026-07-06  
**Status:** Approved (brainstorming)  
**Register:** Product UI (admin dashboard)

## Summary

CRM interno para gerenciar vendas e assinaturas do Site Rápido. Expande o admin Vite existente (`/admin/*`), persiste dados no Supabase, integra assinaturas via Asaas com Edge Functions server-side. UI clean branca, admin único, sem RBAC na v1.

## Decisions Log

| # | Topic | Decision |
|---|-------|----------|
| 1 | Architecture | Expand Vite admin in same repo |
| 2 | MVP scope | Leads + pipeline + customers + Asaas subscriptions |
| 3 | Pipeline | 6 stages: Novo → Qualificado → Demo/Call → Proposta → Aguardando pagamento → Ativo / Perdido |
| 4 | Asaas flow | Semi-auto: select plan → create customer + subscription → payment link → webhook → Active |
| 5 | Access | Single admin, no roles |

## Architecture

```
[Landing Vite] ──leads──▶ [Supabase Postgres]
                              ▲
[Admin /admin/*] ────────────┤
                              │
                    [Supabase Edge Functions]
                         │    ▲
                         ▼    │ webhooks
                      [Asaas API]
```

### Layers

- **Frontend:** React admin routes lazy-loaded alongside existing landing
- **Database:** Supabase Postgres with RLS (authenticated only)
- **Server:** Supabase Edge Functions for Asaas API + webhook handling
- **Secrets:** `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN`, plan IDs — Supabase secrets only

### Auth

Reuse existing Supabase Auth + `ProtectedRoute`. No RBAC in v1.

## Data Model

### `leads` (extend existing)

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK, exists |
| `nome`, `email`, `telefone`, `mensagem` | text | exists |
| `stage` | text enum | `novo`, `qualificado`, `demo`, `proposta`, `aguardando_pagamento`, `ativo`, `perdido` |
| `plan_slug` | text nullable | `essencial_mensal`, `essencial_anual`, `empresarial` |
| `notes` | text nullable | internal notes |
| `customer_id` | uuid nullable | FK to customers |
| `lost_reason` | text nullable | required when stage = `perdido` |
| `created_at`, `updated_at` | timestamptz | |

Default `stage` for new leads from landing form: `novo`.

### `customers` (new)

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `lead_id` | uuid | FK leads |
| `nome`, `email`, `telefone`, `cpf_cnpj` | text | cpf_cnpj required for Asaas |
| `asaas_customer_id` | text | Asaas customer ID |
| `created_at` | timestamptz | |

### `subscriptions` (new)

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `customer_id` | uuid | FK customers |
| `lead_id` | uuid | FK leads (for traceability) |
| `asaas_subscription_id` | text | Asaas subscription ID |
| `plan_slug` | text | |
| `status` | text enum | `pending`, `active`, `overdue`, `cancelled` |
| `billing_type` | text | `PIX`, `BOLETO`, `CREDIT_CARD` |
| `value_cents` | int | 12000, 99700, etc. |
| `payment_url` | text nullable | checkout link |
| `next_due_date` | date nullable | |
| `created_at`, `updated_at` | timestamptz | |

### `pipeline_events` (new)

| Column | Type |
|--------|------|
| `id` | uuid |
| `lead_id` | uuid |
| `from_stage` | text nullable |
| `to_stage` | text |
| `metadata` | jsonb nullable |
| `created_at` | timestamptz |

### `webhook_events` (new, idempotency)

| Column | Type |
|--------|------|
| `id` | uuid |
| `asaas_event_id` | text unique |
| `event_type` | text |
| `payload` | jsonb |
| `processed_at` | timestamptz |

### Plan mapping

| plan_slug | Value | Asaas cycle |
|-----------|-------|-------------|
| `essencial_mensal` | R$ 120 | MONTHLY |
| `essencial_anual` | R$ 997 | YEARLY |
| `empresarial` | configurable | MONTHLY |

Asaas subscription plans created once in Asaas dashboard; CRM references via env plan IDs.

### RLS

- All CRM tables: `authenticated` read/write only
- `anon`: no access to CRM tables
- Edge Functions: `service_role` for webhook writes

## UI/UX

**Scene:** Operator at desk in natural light, checking leads and subscriptions between calls. Fast read, 2-click actions.

**Color strategy:** Restrained — white/warm-neutral surfaces, single accent on primary CTAs (≤10%).

### Admin shell (replaces dark sidebar)

- Sidebar: `bg-neutral-50`, `border-neutral-200`, text `neutral-700`
- Main: `bg-white`
- Active nav: white card + subtle shadow
- System font stack / Inter
- No glassmorphism, gradient text, or dark mode in admin

### Routes

| Route | Purpose |
|-------|---------|
| `/admin/pipeline` | CRM home — kanban board (6 columns) |
| `/admin/leads/:id` | Lead detail, timeline, plan selection, generate subscription |
| `/admin/assinaturas` | Subscriptions table with status, actions |
| `/admin/clientes` | Customers table, link to detail |

Redirect `/admin` → `/admin/pipeline`. Keep `/admin/leads` as alias or remove after migration.

### shadcn components to add

`table`, `badge`, `sheet`, `dialog`, `select`, `textarea`, `dropdown-menu`, `tabs`, `skeleton`, `toast`

### Kanban

- Desktop: horizontal scroll kanban, drag or "Move to…" dropdown
- Mobile: accordion list grouped by stage, no drag
- Card: name + plan badge + days in stage

### Lead detail — primary action

Stage selector, plan radio (Essencial mensal/anual, Empresarial), CPF/CNPJ field, "Gerar assinatura Asaas" button (enabled from `proposta` stage onward). After generation: auto-move to `aguardando_pagamento`, show payment link with copy button.

### Required states

- Skeleton loading on kanban/tables
- Empty states with guidance
- Asaas errors via toast
- Button disabled + spinner during subscription creation

## Asaas Integration

### Edge Functions

| Function | Trigger | Action |
|----------|---------|--------|
| `asaas-create-subscription` | POST from admin (JWT) | Validate → create/update Asaas customer → create subscription → save local → return payment_url |
| `asaas-cancel-subscription` | POST from admin | Cancel in Asaas → update local status |
| `asaas-webhook` | POST from Asaas | Validate token → idempotent process → update subscriptions + lead stage |

### Webhook events (v1)

| Asaas event | CRM action |
|-------------|------------|
| `PAYMENT_CONFIRMED` / `PAYMENT_RECEIVED` | subscription `active`, lead → `ativo`, create customer if missing |
| `PAYMENT_OVERDUE` | subscription `overdue` |
| `SUBSCRIPTION_DELETED` | subscription `cancelled` |
| `PAYMENT_REFUNDED` | subscription `cancelled`, timeline note |

### create-subscription payload

```json
{
  "lead_id": "uuid",
  "plan_slug": "essencial_mensal",
  "cpf_cnpj": "12345678900",
  "billing_type": "PIX"
}
```

### Environment variables

```
ASAAS_API_KEY
ASAAS_WEBHOOK_TOKEN
ASAAS_ENV=sandbox|production
ASAAS_PLAN_ESSENCIAL_MENSAL_ID
ASAAS_PLAN_ESSENCIAL_ANUAL_ID
ASAAS_PLAN_EMPRESARIAL_ID
```

### Error handling

| Scenario | UX |
|----------|-----|
| Invalid CPF/CNPJ | Inline validation, no API call |
| Asaas 4xx duplicate customer | Toast + reuse existing customer by email |
| Asaas 5xx / timeout | Toast retry message, stage unchanged |
| Duplicate webhook | Skip via `webhook_events.asaas_event_id` |
| Invalid webhook token | 401, log, ignore |

### Security

- Admin → functions: `Authorization: Bearer <supabase_jwt>`
- Webhook: validate `asaas-access-token` header
- `payment_url` visible to authenticated only

Start with Asaas sandbox (`ASAAS_ENV=sandbox`).

## File Structure

```
src/
├── components/admin/
│   ├── AdminLayout.tsx          # modify: white shell
│   ├── Sidebar.tsx              # modify: light nav + new items
│   ├── PipelineBoard.tsx        # new: kanban
│   ├── LeadCard.tsx             # new
│   ├── LeadDetail.tsx           # new
│   ├── SubscriptionsTable.tsx   # new
│   ├── CustomersTable.tsx       # new
│   └── LeadsList.tsx            # deprecate or redirect
├── hooks/
│   ├── useLeads.ts              # new
│   ├── usePipeline.ts           # new
│   └── useSubscriptions.ts      # new
├── lib/
│   ├── supabaseClient.ts        # exists
│   └── asaas.ts                 # new: typed client for edge function calls
├── types/
│   └── crm.ts                   # new: Lead, Customer, Subscription, Stage enums
supabase/
├── migrations/
│   └── 20260706_crm_schema.sql  # new
└── functions/
    ├── asaas-create-subscription/
    ├── asaas-cancel-subscription/
    └── asaas-webhook/
```

## Implementation Order

1. Supabase migration (schema + RLS + triggers for `updated_at` + pipeline_events on stage change)
2. White admin shell + sidebar + routing
3. Pipeline kanban (read + move stage)
4. Lead detail page (notes, stage, plan selection)
5. Edge Function `asaas-create-subscription` (sandbox)
6. Wire "Gerar assinatura" button
7. Edge Function `asaas-webhook` + idempotency table
8. Subscriptions + Customers tables/pages
9. Cancel subscription action
10. Polish: skeletons, empty states, toasts, mobile accordion

## Out of Scope (v1)

- Dashboard metrics (MRR, churn, revenue charts)
- Multi-user roles (admin vs seller)
- Invoices/contracts beyond Asaas payment links
- Email/WhatsApp automation from CRM
- Separate Next.js app
- Customer self-service portal

## Testing Plan

- Manual: create lead from landing → appears in `novo` on pipeline
- Manual: move through stages, verify `pipeline_events`
- Sandbox: generate subscription for each plan_slug, verify payment_url
- Sandbox: simulate webhook → lead becomes `ativo`, subscription `active`
- Manual: cancel subscription, verify Asaas + local status
- Mobile: pipeline accordion usable
- Security: anon cannot read CRM tables; webhook rejects bad token

## Open Items

- Empresarial plan value: confirm fixed price or manual entry before implementation
- Asaas plan IDs: create in sandbox dashboard before Edge Function work
- Run `impeccable teach` to create PRODUCT.md / DESIGN.md for future design consistency
