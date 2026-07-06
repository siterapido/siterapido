# CRM Site Rápido v2 — Enhancements Design Spec

**Date:** 2026-07-06  
**Status:** Approved (2026-07-06)  
**Register:** Product UI (admin dashboard)  
**Builds on:** `docs/superpowers/specs/2026-07-06-crm-siterapido-design.md`

## Summary

Three phased enhancements to the existing CRM MVP. Phase 1 adds search, filters, and sort on the pipeline. Phase 2 adds a Resumo dashboard with KPIs. Phase 3 completes lead workflows (editable contact, lost-reason from kanban, lead source, CSV export, login polish). Single admin, no RBAC, client-side data processing for phases 1–2 (fits current ~128 leads, scales to ~500 before server-side refactor).

## Decisions Log

| # | Topic | Decision |
|---|-------|----------|
| 1 | Phasing | A → B → C in separate implementation passes |
| 2 | Search UX | Hybrid kanban: columns without matches collapse; matching cards highlighted |
| 3 | Filters | Text search + stage + plan + period (hoje / 7d / 30d / todos) |
| 4 | Sort | Toolbar selector: recente / antigo / nome A–Z |
| 5 | Data layer | Client-side filter/sort on `useLeads` array (no new API for phase 1–2) |
| 6 | Dashboard route | `/admin/resumo` as first sidebar item |
| 7 | Dashboard metrics | Total leads, novos 7d, ativos, em pipeline, MRR estimado, breakdown por etapa |
| 8 | Contact edit | Inline editable fields on LeadDetail, save on blur |
| 9 | Lost reason | Dialog on kanban move to `perdido` (same UX as LeadDetail) |
| 10 | Lead source | New `source` column, default `landing`; set in LeadFormModal |
| 11 | Export | CSV of currently filtered leads from pipeline toolbar |
| 12 | Pagination | Deferred; client-side acceptable until ~500 leads |
| 13 | Out of scope | Tags, assignment, reminders, bulk actions, drag-and-drop, RBAC |

## Approaches Considered

### A. Client-first phased (recommended)

Filter, sort, and dashboard metrics computed in the browser from existing `useLeads` / `useSubscriptions` fetches. One migration only in phase 3 (`source` column). Fast to ship, matches current data volume.

**Trade-off:** Full table load on every page visit. Acceptable at current scale.

### B. Server-side queries per filter

Supabase `.ilike()`, `.eq()`, date ranges on each toolbar change. Better for 1000+ leads.

**Trade-off:** More round-trips, duplicated filter logic, premature for 128 leads.

### C. Big-bang single release

All three phases in one PR.

**Trade-off:** Large diff, harder to review and test. Rejected.

**Recommendation:** Approach A, delivered as three sequential implementation plans.

---

## Phase 1 — Pipeline Search, Filters, Sort

### Purpose

Operator with 128+ leads can find and prioritize without scrolling every column.

### Toolbar (`PipelineToolbar.tsx`)

Placed below pipeline header, above kanban. White surface, `border-neutral-200`, compact row on desktop, stacked on mobile.

| Control | Behavior |
|---------|----------|
| Search input | Matches `nome`, `email`, `whatsapp`, `telefone`, `mensagem` (case-insensitive, accent-tolerant via normalized lowercase) |
| Stage select | `Todas` or single `PipelineStage` |
| Plan select | `Todos` or `plan_slug` / landing `plano` text |
| Period select | `Todos`, `Hoje`, `7 dias`, `30 dias` (filters on `created_at`) |
| Sort select | `Mais recente` (updated_at desc), `Mais antigo` (created_at asc), `Nome A–Z` |
| Clear button | Resets all filters; visible only when any filter active |
| Results count | `"12 de 128 leads"` next to clear |

Accent: primary actions and active filter chips use brand green `#9CD653` on neutral/black text.

### Hybrid kanban behavior

1. `useLeadFilters(leads, filters)` returns `filteredLeads`.
2. `usePipeline(filteredLeads, sort)` groups into columns.
3. Column with 0 matches: collapsed to header bar only (~48px), click to expand empty state `"Nenhum resultado"`.
4. Column with matches: normal height.
5. Matching card: `ring-2 ring-[#9CD653]/50` when any filter active (search or dropdown).
6. Mobile accordion: same filtered set, empty stages hidden unless expanded manually.

### Hook (`useLeadFilters.ts`)

Pure functions, unit-testable:

```ts
type LeadFilters = {
  query: string;
  stage: PipelineStage | 'all';
  plan: PlanSlug | 'all';
  period: 'all' | 'today' | '7d' | '30d';
};

type LeadSort = 'recent' | 'oldest' | 'name';
```

No Supabase changes.

### Files

| File | Action |
|------|--------|
| `src/hooks/useLeadFilters.ts` | New |
| `src/components/admin/PipelineToolbar.tsx` | New |
| `src/components/admin/PipelineBoard.tsx` | Wire toolbar, collapsed columns |
| `src/hooks/usePipeline.ts` | Accept sort param |
| `src/components/admin/LeadCard.tsx` | `highlighted` prop |

### Error / edge cases

- Empty results: full-width message `"Nenhum lead corresponde aos filtros"` with clear button.
- Filters persist during session (React state), reset on page reload.

---

## Phase 2 — Resumo Dashboard

### Purpose

At-a-glance health of pipeline and revenue without opening each table.

### Route

`/admin/resumo` — first item in sidebar (`BarChart3` icon). Redirect `/admin` → `/admin/resumo` (pipeline becomes second nav item).

### Metrics (computed client-side)

| Card | Calculation |
|------|-------------|
| Total leads | `leads.length` |
| Novos (7d) | `created_at` within last 7 days |
| Ativos | `stage === 'ativo'` |
| Em pipeline | not `ativo` and not `perdido` |
| MRR estimado | sum `value_cents` of subscriptions where `status === 'active'`, display as BRL/month (annual plans ÷ 12) |
| Assinaturas pendentes | `status === 'pending'` count |

### Stage breakdown

Horizontal bar or simple list: count per stage with green fill proportional to total. Click stage → navigate to `/admin/pipeline` with stage filter pre-applied (query param `?stage=novo`).

### Layout

Grid of metric cards (`rounded-lg border border-neutral-200 bg-white p-5`). Numbers in `text-3xl font-bold text-neutral-950`. Labels `text-sm text-neutral-500`. Green accent on positive metrics (ativos, MRR).

### Hook (`useDashboardMetrics.ts`)

Input: `leads[]`, `subscriptions[]`. Output: typed metrics object. Reuses `useLeads` + `useSubscriptions`.

### Files

| File | Action |
|------|--------|
| `src/components/admin/ResumoPage.tsx` | New |
| `src/hooks/useDashboardMetrics.ts` | New |
| `src/components/admin/Sidebar.tsx` | Add Resumo nav |
| `src/App.tsx` | Route + redirect update |
| `src/components/admin/PipelineBoard.tsx` | Read `?stage=` query param on mount |

No Supabase changes.

---

## Phase 3 — Lead Workflow Completion

### Purpose

Close gaps that block daily operator work: fix data, record losses properly, track origin, export, consistent login.

### 3a. Editable contact (LeadDetail)

Fields editable: `nome`, `email`, `whatsapp`, `telefone`, `instagram`. Read-only display replaced with `Input` components. Save on blur (same pattern as notes). Email required validation before save. Toast on success/error.

### 3b. Lost reason from kanban

When moving to `perdido` via LeadCard dropdown: open `Dialog` for `lost_reason` (reuse copy from LeadDetail). Block move until reason provided. Pass `lostReason` to `updateStage(leadId, 'perdido', reason)`.

Lift dialog state to `PipelineBoard` or handle inside `LeadCard` with callback `onMoveToLost(leadId, reason)`.

### 3c. Lead source

Migration:

```sql
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'landing';
```

Values: `landing` (form), `manual` (future), `import` (future). Display as badge on LeadCard and LeadDetailDialog. `LeadFormModal` sets `source: 'landing'` on insert.

### 3d. CSV export

Button in `PipelineToolbar`: "Exportar CSV". Exports currently filtered leads. Columns: nome, email, telefone, whatsapp, stage, plan_slug, source, created_at. Client-side blob download, UTF-8 BOM for Excel PT-BR.

### 3e. Login polish

Restyle `Login.tsx` to match admin: `bg-neutral-50` page, white card, green submit button (`bg-[#9CD653] text-neutral-950`), neutral inputs. No functional change.

### Files

| File | Action |
|------|--------|
| `supabase/migrations/20260706180000_lead_source.sql` | New |
| `src/types/crm.ts` | Add `source` to Lead |
| `src/components/admin/LeadDetail.tsx` | Editable contact |
| `src/components/admin/LeadCard.tsx` | Lost dialog |
| `src/components/admin/PipelineToolbar.tsx` | Export button |
| `src/lib/exportLeads.ts` | New CSV helper |
| `src/components/ui/LeadFormModal.tsx` | Set source |
| `src/components/admin/Login.tsx` | Visual restyle |

---

## UI Consistency

All new surfaces follow existing admin patterns:

- Background: white / `neutral-50`
- Text: `neutral-950` headings, `neutral-500` labels
- Accent: `#9CD653` badges, rings, primary buttons
- Black: `bg-neutral-950` for secondary emphasis buttons
- shadcn: `Input`, `Select`, `Button`, `Dialog`, `Badge`
- No side-stripe borders, no gradient text, no glassmorphism

---

## Implementation Order

1. **Phase 1:** `useLeadFilters` → `PipelineToolbar` → wire `PipelineBoard` → collapsed columns → card highlight → test with 128 leads
2. **Phase 2:** `useDashboardMetrics` → `ResumoPage` → sidebar/route → stage deep-link to pipeline
3. **Phase 3:** migration `source` → editable contact → lost dialog kanban → CSV export → login polish

Each phase: build, manual test, ship before starting next.

---

## Testing Plan

### Phase 1
- Search by partial email returns correct cards
- Stage + plan + period combine (AND logic)
- Sort reorders within columns
- Empty columns collapse; expand shows empty message
- Clear resets all
- Mobile accordion respects filters

### Phase 2
- Metrics match manual count from Supabase
- MRR calculation correct for monthly vs annual plans
- Stage click navigates with filter applied

### Phase 3
- Contact edit persists after reload
- Kanban move to perdido requires reason
- New leads have `source = landing`
- CSV opens correctly in Excel PT-BR
- Login visually matches admin shell

---

## Out of Scope (v2)

- Server-side pagination and search
- Tags, assignment, follow-up reminders
- Bulk stage changes
- Drag-and-drop kanban
- Realtime Supabase subscriptions
- Custom date range picker (only preset periods in v2)
- Manual lead creation form

## Open Items

None blocking. Custom date range can be added in v2.1 if preset periods prove insufficient.
