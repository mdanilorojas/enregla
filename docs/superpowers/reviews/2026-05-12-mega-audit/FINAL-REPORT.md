# EnRegla — Mega-Audit Final Report

**Date:** 2026-05-12
**Method:** Triple-pass audit. Pass 1 = 8 parallel domain agents (DB/RLS, auth, frontend, features, design system, build/tests, docs, deps/perf). Pass 2 = 5 independent verification agents reproducing P0 claims. Pass 3 = cross-cutting (a11y/i18n, errors/observability, golden-path smoke, git hygiene, reconciliation).
**Output:** 18 pass reports, reconciled into 99 deduped findings, this summary, and `FINAL-REPORT.html` for review.
**Principle:** "Verify behavior, not shape." Everything tagged **CONFIRMED** was reproduced live.

---

## TL;DR — 10 things that matter

1. **Every Google-OAuth signup since 2026-05-10 silently loses its profile row.** `handle_new_user` inserts `role='member'` but the CHECK only allows `admin|operator|viewer`. The error is swallowed by `EXCEPTION WHEN OTHERS`. Live reproduced. One-line migration fix.
2. **A full Supabase `service_role` JWT is committed to the public GitHub repo.** `docs/superpowers/plans/2026-04-14-incremental-onboarding-implementation.md:1266`, commit `6bf483c`. Token bypasses all RLS. Must be rotated *now*, then history-rewritten.
3. **Tailwind 4 theme tokens lack the `--color-*` prefix.** `bg-primary`, `bg-background`, `bg-popover`, `text-destructive`, `ring-ring`, `border-input`, `text-muted-foreground`, `bg-accent`, `bg-card` emit **zero** CSS (verified by grepping `dist/assets/*.css`). Calendar, dropdown, sheet, sidebar, tooltip, checkbox, textarea, form, and select render unstyled across the app.
4. **"Nuevo Permiso" button is dead** — both copies in `PermitListView` and the one in `LocationPermitsTab`. The user cannot create a permit through the UI at all.
5. **The deployed `send-expiry-alerts` edge function (v8) still hardcodes `https://app.enregla.se`** — every expiry email links to a dead domain. The source was fixed in commit `c493222` but never redeployed. Resend sender is also the unverified `onboarding@resend.dev` fallback.
6. **Settings tabs are fake.** `NotificationsTab` toggles don't persist (no `onChange`); the functional `NotificationPreferences` component is orphaned. `ProfileTab` "Guardar cambios" has no `onClick`. `SecurityTab` "Cerrar todas las sesiones" has no `onClick`. `CompanyTab` hardcodes 4 business-types vs DB's 12 — editing a `farmacia` silently downgrades it to `retail`.
7. **`leads` has `INSERT ... WITH CHECK (true)` for role `public`.** Anon, unlimited, no captcha, no rate-limit. Live verified. Any drive-by bot can bloat the table.
8. **Public-link RLS is malformed but not (yet) exploitable.** `documents_select_anon` and the storage policy predicate only on "some active link for company X" without binding to the presented token. Today saved by other layers; a latent P0 if anyone "fixes" the public page by granting anon SELECT on `public_links`.
9. **`permits.type` has 18 distinct values with 10 hard dup pairs** (`RUC/ruc`, `Bomberos/bomberos`, `Uso de Suelo/uso_suelo`, …) and no CHECK. Marco Legal joins, compliance rollups, and cost estimates are silently wrong on ~29/51 rows.
10. **1.25 MB single-chunk bundle** (353 KB gzipped) ships to the **unauthenticated** `/p/:token` route. xyflow, react-table, query, design-system, onboarding — all downloaded by a visitor validating one permit. No code-splitting anywhere.

---

## Severity snapshot

| Severity | Count | Meaning |
|----------|-------|---------|
| **P0** | **21** | Data integrity, auth, or UX broken for all users / all new signups / production. |
| **P1** | **38** | Latent bug or significant hardening gap. Ship-blocking only at scale. |
| **P2** | **29** | Hygiene, maintainability, docs drift. |
| **P3** | **11** | Nits. |

**Pass-2 status**: 14 of the 21 P0s were CONFIRMED by independent live reproduction. 4 P0s were downgraded to P1 by Pass 2 (over-reported blast radius; architectural shape is still wrong). 1 P0 (`.ec` vs `.se`) had its direction **inverted** by Pass 1 and corrected by Pass 2.

---

## 1 · P0 — ship-blockers (21)

Grouped by root cause to make the fix plan obvious.

### 1A. Data integrity (DB)

| # | Finding | Status | Evidence | Fix |
|---|---------|--------|----------|-----|
| DB-1 | `handle_new_user` inserts `role='member'` → `profiles_role_check` rejects → exception swallowed → no profile row. Every new signup since 2026-05-10 broken. 4 existing admin rows predate the regression. | CONFIRMED (live repro, rolled back) | `supabase/migrations/20260510000000_pre_production_audit_fixes.sql:337` | One-line migration: change `'member'` to `'admin'`, or extend CHECK to allow `'member'`. |
| DB-2 | `permits.type` has 18 distinct values, 10 hard dup pairs, no CHECK constraint. Marco Legal joins silently drop ~29/51 rows. | CONFIRMED | `permits.type` distribution via `mcp__supabase__execute_sql` | Backfill `LOWER(type)` + normalize to slugs + add CHECK. |
| DB-3 | Auto-trigger `auto_create_location_permits` INSERT omits `issuer_id` → 41/46 live permits orphaned from issuer catalog. | CONFIRMED | trigger body in `pass2-dead-ui-verify.md §9`, DB SELECT proves NULL ratio | Extend INSERT to `SELECT issuer_id FROM permit_requirements WHERE …` join. |
| DB-4 | `src/types/database.ts` has zero references to v2 domain columns (`issuer_id`, `business_role`, `cost_*`, `fine_*`, `assigned_to_profile_id`). `src/types/database.types.ts` is a 28-line placeholder stub with wrong `Profile`/`Document` shapes. 38 `as any` casts in code mask the drift. | CONFIRMED (multi-source agreement) | both type files + grep hits | Regenerate with `supabase gen types typescript` and pin in CI. |

### 1B. Security

| # | Finding | Status | Evidence | Fix |
|---|---------|--------|----------|-----|
| SEC-1 | **Full `service_role` JWT committed to public repo** at `docs/superpowers/plans/2026-04-14-incremental-onboarding-implementation.md:1266` (commit `6bf483c`, 2026-04-14). Decodes to `{role:service_role, ref:zqaqhapxqwkvninnyqiu, exp:2091675815}`. | CONFIRMED (file + JWT decode) | git log `6bf483c` | (1) Rotate in Supabase dashboard immediately. (2) Purge from history (`git filter-repo --replace-text`). (3) Add a secret-scanner pre-commit hook. |
| SEC-2 | `leads` table INSERT policy `"Anyone can insert leads" FOR INSERT TO public WITH CHECK (true)`. No rate-limit, no captcha, no honeypot. | CONFIRMED (live insert as anon, rolled back) | `pg_policies.leads` | Add Turnstile/HCaptcha token column, verify in edge function, insert via service role. Or stricter: policy with `check_client_ip()` and per-minute limit. |
| SEC-3 | Edge function `send-expiry-alerts` v8 deployed with `ALLOWED_ORIGIN` + `APP_URL` defaulting to `https://app.enregla.se` — a domain that does not exist. Source was corrected to `.ec` in commit `c493222` but **never redeployed**. | CONFIRMED via `mcp__supabase__get_edge_function` | deployed v8 body | `supabase functions deploy send-expiry-alerts`. Then `supabase secrets set ALLOWED_ORIGIN=https://app.enregla.ec APP_URL=https://app.enregla.ec`. |
| SEC-4 | Public-link RLS policies (`documents_select_anon`, `permit_docs_select_public_link`) use `EXISTS (public_link WHERE company_id = …)` without binding to the presented token. **Not exploitable today** because `public_links` has no anon SELECT; treat as latent P1 that detonates when someone adds anon visibility to `public_links`. | PARTIAL (shape confirmed, no breach today) | `pg_policies` dump | Drop the broken policies; route all anon reads through the existing safe `get_public_permits(token)` RPC. |

### 1C. Core UX broken

| # | Finding | Status | Evidence | Fix |
|---|---------|--------|----------|-----|
| UX-1 | Both "Nuevo Permiso" buttons in `/permisos` have no onClick/Link. "Nuevo Permiso" in `LocationPermitsTab` routes to `/permisos` → still dead. **Users cannot create permits from the UI.** | CONFIRMED | `src/features/permits/PermitListView.tsx:85-87, 112-115`; `src/features/locations/LocationPermitsTab.tsx:29-35` | Wire to a `PermitCreateModal` or `/permisos/nuevo` route. |
| UX-2 | `NotificationsTab` (`src/features/settings/NotificationsTab.tsx`) has toggles with `defaultChecked` only — no `onChange`, no persistence. The real `NotificationPreferences.tsx` component is orphaned. | CONFIRMED | `SettingsView.tsx:22` imports the fake stub | One-line swap to import `NotificationPreferences`. |
| UX-3 | `ProfileTab` "Guardar cambios" button has no `onClick`; inputs use `defaultValue` (uncontrolled). `SecurityTab` "Cerrar todas las sesiones" button has no `onClick`. | CONFIRMED | `ProfileTab.tsx:22,30`; `SecurityTab.tsx:23` | Add handlers (`supabase.auth.signOut({scope:'global'})` for sessions). |
| UX-4 | `CompanyTab.BUSINESS_TYPES` hardcodes 4 values; DB CHECK now allows 12. Saving a company whose `business_type` is outside those 4 silently downgrades to `retail`. | CONFIRMED | `CompanyTab.tsx:11-16` | `import { BUSINESS_TYPES } from '@/lib/domain/business-types'`. |
| UX-5 | `RenewPermitModal` is mounted in `LocationDetailView` but `setRenewModalOpen(true)` is never called — the renewal flow from a sede is unreachable. | CONFIRMED | `LocationDetailView.tsx:25-27,155-156` | Add the trigger on the renew button in `LocationPermitsTab`. |
| UX-6 | Onboarding shows **"PermitOps"** copy in 2 locations (`ProfileStep.tsx:24`, `IncrementalWizard.tsx:160`). Every new customer's first screen has the wrong brand. | CONFIRMED | grep | Find & replace to `EnRegla`. |
| UX-7 | Internal CRM (`LeadsTable`, `PartnerScorecard`) has zero routes. Landing-page leads are piling up in a DB table nobody can view. | CONFIRMED | `App.tsx:67-124`; no consumer | Add `/leads`+`/partners` routes inside ProtectedRoute (or remove landing-page form until there's a triage UI). |

### 1D. Design system

| # | Finding | Status | Evidence | Fix |
|---|---------|--------|----------|-----|
| DS-1 | `@theme` block in `src/index.css:16-44` declares tokens in the bare namespace (`--primary`, `--background`, `--destructive`). Tailwind 4 only generates utilities from `--color-*`. **9 utilities emit zero CSS**: `bg-primary`, `bg-background`, `bg-popover`, `bg-accent`, `bg-card`, `text-destructive`, `text-muted-foreground`, `border-input`, `ring-ring`. 41 source references across 13 files. | CONFIRMED (grep of `dist/assets/index-*.css` returns zero hits for those classes; `bg-sidebar` which IS namespaced correctly works) | `src/index.css:16-44`; `dist/assets/index-B1-dDQd7.css` | Rewrite tokens as `--color-primary`, `--color-background`, etc. inside `@theme`. 10-min mechanical edit. |
| DS-2 | `/design-system` (`DesignSystemView`) ships raw Tailwind palette (`#1e3a8a`, `#10b981`, `#ef4444`) **labeled as brand colors**. Real brand is `#0f265c`. Correct showcase is at `/design-system-showcase`. Both routes are shipped to authenticated users in prod. | CONFIRMED | `src/features/design-system/DesignSystemView.tsx:83,101-113` (comment literally says "#1e3a8a / blue-900 — Color principal de marca") | Delete `DesignSystemView.tsx` and `/design-system` route; keep only `/design-system-showcase`, and move it behind a dev-only guard. |

### 1E. Email pipeline

| # | Finding | Status | Evidence | Fix |
|---|---------|--------|----------|-----|
| EMAIL-1 | Resend sender is currently `onboarding@resend.dev` fallback (env `RESEND_FROM` unset). `enregla.ec` is not yet verified in Resend. Expiry alerts today only reach the owner's inbox; the moment domain is verified, SEC-3's dead `.se` links go to every customer. | UNVERIFIED via MCP (secrets not readable) but code path confirmed | `supabase/functions/send-expiry-alerts/email-service.ts:9` | (1) Verify domain in Resend, set SPF/DKIM/DMARC. (2) Set `RESEND_FROM=notifications@enregla.ec`. (3) Redeploy (see SEC-3). |

---

## 2 · P1 — latent / hardening (38 — abridged)

Full table in `pass3-reconciliation.md §1`. Highlights:

- **Auth state machine**: `useAuth.ts:84-88` has a 5-second safety timeout that flips `isAuthenticated=false` on slow networks, kicking real users to `/login`. Module-level `authInitialized` / `initializationPromise` globals create a brittle state machine; StrictMode double-registers.
- **AuthCallback** doesn't handle `?error=access_denied` (user-cancel path renders a confusing generic error).
- **Data layer schizophrenic**: TanStack Query is wired (`QueryClientProvider` in `main.tsx`) but **only 6/14 data hooks use it**. `usePermits`, `useLocations`, `useDocuments`, `useLeads`, `usePartners`, `useNotificationPreferences`, `usePermit` are hand-rolled `useState` + `useEffect`. No dedup, no cache, no auto-refetch.
- **`useLocations` calls `usePermits` internally** AND 7 consumer views call `usePermits` at the page level → 2× Supabase fetch per page.
- **`AssigneePicker` invalidates queryKey `['permits']`** which no RQ hook owns — so invalidation is a no-op; assignee changes show stale UI until reload.
- **`companies_insert` policy** allows any authenticated user with null `company_id` to create a company; there is no `companies_ruc_unique` constraint → RUC-squatting is possible.
- **`profiles_select` policy** allows cross-profile reads within the same company; the demo company exposes all profiles to anon.
- **`get_public_permits` RPC is correct (token-bound)** but **orphaned** — the public page uses direct PostgREST queries instead. The public page is therefore **functionally broken for every non-demo tenant** (confirmed in Pass 2).
- **Bundle**: 1.25 MB single chunk, ships to public `/p/:token`. No code-splitting. `INEFFECTIVE_DYNAMIC_IMPORT` warning on `supabase.ts`. No source maps in prod (both a privacy good and a Sentry-debugging problem).
- **Dead deps** (~47 MB): `recharts`, `jspdf`, `html2canvas`, `framer-motion`, `d3-force`, `sonner` (double-toast with `react-hot-toast`), `@tanstack/react-virtual`, `react-query-devtools`, `react-hook-form` + `zod` + `@hookform/resolvers` (all forms are hand-rolled; `ui/form.tsx` is orphan), `@radix-ui/react-tooltip`, `@radix-ui/react-separator`. `dompurify ≤3.3.3` CVE chain ships via `jspdf`.
- **Legal index/detail split**: `LegalIndexView` reads DB (`legal_references`), `LegalPermitDetailView` reads static `src/data/legal-references.ts`. Today both have the same 6 permit_types, so no 404. **Latent** — any DB-only addition 404s. The adapter `toLegalReference` also strips `consequences`, `requiredDocuments`, `typicalProcess` → Legal/Proceso/Riesgos tabs silently empty when the DB path is used.
- **`src/types/index.ts`** has 3 legacy enum systems that disagree with DB: `IndustryType` (9 values ≠ DB 12), `PermitType` (6 ≠ DB 8), `LocationStage` (wrong values). A rename-in-code-only will pass typecheck and break at runtime.
- **No `/reset-password` route** exists in `App.tsx`, but `resetPasswordForEmail()` is called — clicking the email link lands on a wildcard-redirect home.
- **LoginView** footer links `href="#"` on "¿Olvidaste tu contraseña?" and "Solicita acceso" — trust-wart.
- **CI runs lint+typecheck+test+build** but no coverage (effectively nil today: 4 test files, 19 tests, all pure fn), no `npm audit`, no bundle-size budget, no migration dry-run, no edge-function typecheck, no E2E.
- **TypeScript is not strict**: `strict`, `strictNullChecks`, `noImplicitAny` all off in `config/tsconfig.app.json`.
- **ARIA / keyboard**: `PermitTable.tsx:111-121` sort headers are `<th onClick>` with no button role/keyboard handler. `AppLayout.tsx:139-143` mobile sidebar backdrop is a `<div onClick>` with no keyboard dismiss. `ShareLocationModal` hand-rolls `<div role="dialog">` with no focus trap, no Esc handler, no scroll-lock.
- **WCAG AA failures**: `risk-medio` badge ≈ 2.3:1 contrast (`#FF991F` on `#fff8e1`); `status-por-vencer` ≈ 4.1:1.
- **`--ds-orange-700/800/900` tokens are actually red** (`#f44336`, `#e53935`, `#d32f2f`) — breaks the risk-hierarchy semantics contract.
- **No observability at all** — no Sentry/Datadog/PostHog despite `VITE_SENTRY_DSN` in `.env.example`. `ErrorBoundary` wraps `<App>` but `componentDidCatch` only logs in DEV. Prod crashes die silently. 103 `console.*` statements (38 in `useAuth.ts` alone) ship to prod with no `drop_console`.
- **Core views** (`DashboardView`, `PermitListView`, `PermitDetailView`) destructure only `{permits, loading}` from their hooks — dropping the `error` state — so fetch failures render empty lists with no banner/toast/retry.
- **`ComplianceWeatherCard`** (737 LOC, 30+ hardcoded hex, 3 `useEffect` animation loops, 12+ `@keyframes infinite`) has zero `prefers-reduced-motion` guards.
- **`LegalMatrixView`** 12-col grid with `min-w-[180px]` per column → ~2500px wide; unusable on tablet portrait with no sticky-first-col or scroll hint.
- **`IncrementalWizard` sidebar fixed 280px** — cramps tablet portrait.

---

## 3 · P2/P3 — hygiene (40 — highlights)

- `components.json` aliases `"ui": "@/components/ui-v2"` → folder doesn't exist. Future `shadcn add` will fail.
- `.claude/settings.local.json` is tracked in git.
- `.env.development` is tracked in git.
- `@custom-variant dark (&:is(.dark *));` declared in `src/index.css` despite "solo modo claro" directive.
- `CLAUDE.md` / `AGENTS.md` claim branch=main, focus=real-time-data, folder `src/components/ui-v2/`. All false (branch is `feat/dominio-v2`, folder is `src/components/ui/`). **AGENTS.md is a near-duplicate** of CLAUDE.md with one-word changes.
- `README.md` references `src/features-v2/`, `src/features/documents/`, `scripts/create-demo-data.sql`, `VITE_UI_VERSION` — none exist.
- `OAUTH-SETUP.md` frames a bug fixed in `c493222` as still open; references `localhost:3000` (Vite runs on 5173).
- Two parallel docs root: `docs/core/` vs `docs/product/` hosting near-identical `PRODUCT.md`/`ROADMAP.md`/`BACKLOG.md`.
- `dist/` is never served from `/public/` for the 3 root HTML files (`design-system-complete.html`, `atlassian-ds-showcase.html`, `policia-judicial.html`, `design-system-showcase.html` — 260+ KB each); dev server serves them and shadows the React route `/design-system-showcase`.
- `src/styles/.deprecated/design-tokens.css` committed.
- `src/data/mock/` (557 LOC) and `src/data/classification-rules.ts` (222 LOC) — zero importers.
- `src/lib/auth.ts` + `src/lib/api/auth.ts` duplicated.
- `completeOnboarding()` (60+ LOC) has 0 callers.
- `sidebar.tsx` (650 LOC of full shadcn code) is dead — `AppLayout` rolls its own.
- 13 unused indexes (per Supabase perf advisor), 12 timestamp columns without tz (rest is `timestamptz`).
- No DB tags / release tags; CHANGELOG frozen at `1.0.0-MVP` / 2026-04-20 while ~120 commits have landed since.
- `feat/dominio-v2` = 29 commits / 115 files / +9908 / -2765 — never pushed; no PR.
- No pre-commit hooks (husky/lint-staged absent). CI is the only guard, and it has no secret-scan (which is why SEC-1 landed).

---

## 4 · Gaps the audit did **not** cover (unknowns)

- **Billing / subscription / payments**: zero code scanned, zero evidence either way. If there's a paid tier or trial, nothing was checked.
- **Rate-limiting** beyond the leads + public-token cases.
- **Backups / PITR / restore runbook**.
- **PII / log retention / Ecuador data-protection compliance**.
- **Admin / support tooling**: no impersonation, no unlock procedure for broken signups.
- **Multi-tenant boundary on shared catalogs** (`permit_issuers`, `permit_requirements`, `legal_references`, storage path-tenancy).
- **Supabase Auth URL config** (dashboard-only, not queryable via MCP): Site URL, Redirect URLs, MFA, email templates, leaked-password toggle state.
- **Cron heartbeat / dead-man's-switch** for `send-expiry-alerts`.
- **Email deliverability** (SPF/DKIM/DMARC, bounce handling, unsubscribe compliance).
- **Browser-compat matrix, service-worker, SEO/open-graph on `/p/:token`**.

---

## 5 · Contradictions reconciled

- **`.ec` vs `.se`**: Pass 1 had the direction inverted (stale MEMORY line). **Production is `app.enregla.ec`.** The real bug is source-vs-deployed drift — source is correct, edge-fn v8 is not. Recommend batch-purge `.se` from all non-historical docs and add a "canonical domain is `.ec`" line in CLAUDE.md.
- **`handle_new_user` regression was introduced by the 2026-05-10 pre-production audit's own "hardening" migration** (`20260510000000_pre_production_audit_fixes.sql`). The verification-process-gap follow-up from the same day documented the risk pattern; the risk materialized and was never amended. Without a Definition-of-Done or stop-hook, the next audit lands the next regression.

---

## 6 · Ranked top-20 fixes (in recommended order)

| Rank | Title | Fix complexity |
|------|-------|----------------|
| 1 | **Rotate `service_role` JWT; purge from git history; add secret-scan pre-commit** | 2 |
| 2 | Fix `handle_new_user` role literal | 1 |
| 3 | Add `--color-*` prefix to `@theme` tokens | 2 |
| 4 | Redeploy `send-expiry-alerts` + set `ALLOWED_ORIGIN`/`APP_URL` secrets | 1 |
| 5 | Wire SettingsView to render `NotificationPreferences` not `NotificationsTab` | 1 |
| 6 | Import canonical `BUSINESS_TYPES` in `CompanyTab` | 1 |
| 7 | Add onClick to `ProfileTab` / `SecurityTab` buttons | 2 |
| 8 | Rename "PermitOps" → "EnRegla" in onboarding copy | 1 |
| 9 | Wire "Nuevo Permiso" + `RenewPermitModal` trigger | 2 |
| 10 | Backfill `permits.type` slugs + CHECK | 3 |
| 11 | Fix `auto_create_location_permits` trigger to populate `issuer_id` | 2 |
| 12 | Replace `leads` anon INSERT policy with captcha-verified edge function | 3 |
| 13 | Verify `enregla.ec` in Resend + set `RESEND_FROM` + SPF/DKIM/DMARC | 2 |
| 14 | Delete broken public-link RLS policies; route all anon reads through `get_public_permits(token)` | 2 |
| 15 | Regenerate `src/types/database.ts` from Supabase; remove the 28-line stub; pin generator in CI | 2 |
| 16 | Add `/leads` + `/partners` routes (or remove the public lead-capture form until triage UX exists) | 3 |
| 17 | `REVOKE EXECUTE ON FUNCTION public.user_company_id() FROM anon` | 1 |
| 18 | Uninstall 11 dead deps (`recharts`, `jspdf`, `html2canvas`, `framer-motion`, `d3-force`, `sonner`, `@tanstack/react-virtual`, `react-hook-form`, `zod`, `@hookform/resolvers`, `react-query-devtools`) + the 2 dead radix | 1 |
| 19 | Migrate hand-rolled data hooks to TanStack Query (`useQuery`) — `usePermits`, `useLocations`, `useDocuments`, `useLeads`, `usePartners`, `useNotificationPreferences` | 4 |
| 20 | Wire Sentry (DSN already in `.env.example`); add error boundary at each route; add `esbuild.drop: ["console"]` in prod build | 3 |

Plus: Definition-of-Done stop-hook (close the 2026-05-10 verification-process-gap follow-up) so the NEXT audit doesn't land the next regression.

---

## 7 · Quick wins (<30 min, high upside)

- `handle_new_user` one-line fix (#2 above) — unblocks every new signup.
- Redeploy edge function (#4) — fixes every expiry email.
- Swap `NotificationsTab` → `NotificationPreferences` (#5) — one import + one JSX.
- `CompanyTab` `BUSINESS_TYPES` import (#6) — 6-line edit.
- "PermitOps" → "EnRegla" rename (#8) — three strings.
- Add `noopener,noreferrer` to two `window.open` calls in `DocumentList.tsx:35`, `PermitDetailView.tsx:557`.
- `REVOKE EXECUTE ON FUNCTION public.user_company_id() FROM anon` (#17).
- Delete `@custom-variant dark (&:is(.dark *))` from `src/index.css:14`.
- Enable leaked-password protection in Supabase Auth dashboard.
- Delete `.deprecated/design-tokens.css`, `src/data/mock/`, `src/data/classification-rules.ts`.
- Fix `components.json` alias `ui-v2` → `ui`.
- Uninstall 11 dead deps (single `npm uninstall` line).

---

## 8 · Per-pass reports (raw, preserved)

Pass 1 (8 domain audits):
- `pass1-db.md` · `pass1-auth-security.md` · `pass1-frontend-arch.md` · `pass1-features.md` · `pass1-design-system.md` · `pass1-build-tests.md` · `pass1-docs-drift.md` · `pass1-deps-perf.md`

Pass 2 (5 P0 verifications):
- `pass2-db-verify.md` · `pass2-public-link-rls.md` · `pass2-ds-verify.md` · `pass2-dead-ui-verify.md` · `pass2-domain-verify.md`

Pass 3 (5 cross-cutting):
- `pass3-a11y-i18n-copy.md` · `pass3-errors-observability.md` · `pass3-smoke.md` · `pass3-git-release.md` · `pass3-reconciliation.md` (the master deduped table, 99 rows)

---

## 9 · Meta-finding: process

The 2026-05-10 pre-production audit landed a `handle_new_user` regression *in its own remediation migration*. The verification-process-gap follow-up from the same day documented three proposed mitigations (Definition-of-Done in CLAUDE.md, Stop hook, audit template) — **none shipped**. This audit is verifying-behavior-not-shape and caught the regression, but the systemic fix is: a SQL-level sanity check in CI (`SELECT INTO auth.users … ; ASSERT new profile row`), not another audit.

Recommendation: close `docs/superpowers/follow-ups/2026-05-10-verification-process-gap.md` with an enforcement mechanism before the next audit starts, not after.
