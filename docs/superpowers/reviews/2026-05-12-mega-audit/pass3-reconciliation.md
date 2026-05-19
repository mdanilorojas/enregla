# Pass 3 — Reconciliation & Synthesis

**Date:** 2026-05-12
**Inputs:** 8 Pass-1 reports + 5 Pass-2 verification reports (13 docs total).
**Purpose:** Dedupe, reconcile, surface gaps, rank. No fixes.

Severity legend: P0 = production-broken / data-leak / ship-blocker. P1 = latent bug or hardening gap. P2 = hygiene. P3 = nit.
Status legend: **CONFIRMED** (Pass 2 reproduced), **REFUTED** (Pass 2 disproved), **PARTIAL** (shape correct, blast radius different), **UNVERIFIED** (no Pass-2 coverage).
Blast radius legend: `app-wide`, `all-new-signups`, `all-users`, `demo-only`, `public-route`, `internal-tool`, `build-only`, `dev-only`, `specific-feature`.

---

## 1. Master table — deduped findings across all 13 docs

| # | Title | Sev | Area | Status after Pass 2 | Primary evidence | Fix cx (1-5) | Blast radius |
|---|-------|-----|------|---------------------|------------------|--------------|--------------|
| 1 | `handle_new_user` trigger inserts `role='member'` but CHECK rejects it → every new signup's profile row is silently dropped; onboarding UPDATE then no-ops | P0 | DB / Auth | **CONFIRMED** (pass2-db §1, live repro) | `supabase/migrations/20260510000000_pre_production_audit_fixes.sql:337`; `pg_proc.handle_new_user`; `profiles_role_check` | 1 | all-new-signups |
| 2 | `permits.type` has 18 distinct values (13 legacy display-case + 5 slugs), no CHECK, ~10 hard duplicate pairs (ruc/RUC, bomberos/Bomberos, …) | P0 | DB | **CONFIRMED** (pass2-db §3; worse than claimed) | `permits.type` distribution in pass1-db DB-02 | 3 | all-users (rollups, filters, compliance) |
| 3 | Generated TS types stale: `database.ts` missing every v2 domain column (issuer_id, business_role, cost_*, fine_*, etc.); `database.types.ts` is a 28-line placeholder with wrong fields | P0 | Types / Build | UNVERIFIED in Pass 2 (but aligned across pass1-db DB-03, pass1-build §10, pass1-frontend P1-4, pass1-docs Task-15) | `src/types/database.ts`, `src/types/database.types.ts` | 2 | app-wide (silently loses TS coverage; 38 `as any`) |
| 4 | Public-link RLS policies (`documents_select_anon`, `permit_docs_select_public_link`) predicate on "any active link for this company" without binding to presented token | P0→P1 | DB / Security | **PARTIAL** (pass2-public-link §4: shape confirmed, NOT exploitable today because `public_links` has no anon SELECT and `permits_select` blocks non-demo anon — latent time-bomb) | `pg_policies.documents_select_anon` | 3 | latent — becomes P0 if someone "fixes" public-page by adding anon SELECT |
| 5 | `leads` INSERT policy is `WITH CHECK (true)` for `public` → unauthenticated, unrate-limited spam/DoS/stored-string vector | P0 | DB / Security | **CONFIRMED** (pass2-db §NEW P0; pass2-public-link §6 — real row inserted then deleted) | `pg_policies."Anyone can insert leads"` | 2 | public-route |
| 6 | Domain confusion: `.se` vs `.ec`. Production IS `.ec`. Deployed edge function `send-expiry-alerts` v8 still has `.se` defaults in BOTH `ALLOWED_ORIGIN` and `APP_URL` → expiry emails have dead links | P0 | Deploy / Edge fn | **PARTIAL** — Pass-1 auth-security P0-3 had the direction inverted; Pass-2 domain-verify §4 flipped it: real bug is **source ≠ deployed** | Deployed fn via `mcp__supabase__get_edge_function` | 1 (redeploy) | email-recipients (all expiry alerts) |
| 7 | `DesignSystemView.tsx` (`/design-system`) uses raw Tailwind `blue-900/#1e3a8a` palette labeled as brand; real brand is `#0f265c` | P0 | Design system | **CONFIRMED** (pass2-ds §B) | `src/features/design-system/DesignSystemView.tsx:83,101-113` | 2 (delete) | internal-tool but misleads devs |
| 8 | Tailwind `@theme` tokens lack `--color-*` namespace → utilities `bg-primary`, `bg-background`, `bg-popover`, `text-destructive`, `ring-ring`, `border-input`, `text-muted-foreground` all emit ZERO CSS | P0 | Design system | **CONFIRMED** (pass2-ds §A; 0 hits in built CSS for 9 utilities; 41 source usages across 13 files) | `src/index.css:16-44`; `dist/assets/index-*.css` grep | 2 | app-wide (calendar, dropdown, sheet, sidebar, tooltip, checkbox, textarea, form, select render unstyled) |
| 9 | Auto-trigger `auto_create_location_permits` INSERT omits `issuer_id` → every auto-created permit has NULL issuer (41/46 live rows NULL) | P0 | DB | **CONFIRMED** (pass2-dead-ui §9; 41/46 NULL confirmed) | `auto_create_location_permits` body in pass2-dead-ui §9 | 2 | all-new-permits |
| 10 | "Nuevo Permiso" buttons dead (header + empty-state) — no onClick, no Link | P0 | Features | **CONFIRMED** (pass2-dead-ui §1) | `src/features/permits/PermitListView.tsx:85-87,112-115` | 2 | all-users (permit creation UX) |
| 11 | `/permisos` → click "Nuevo Permiso" → broken. Location detail → "Nuevo Permiso" → routes to `/permisos` → broken. Circular dead-end. | P0 | Features | **CONFIRMED** (pass1-features #1, consequence of #10) | `LocationPermitsTab.tsx:29-35` | 2 | all-users |
| 12 | `NotificationsTab` is a stub (no onChange / no API call); functional `NotificationPreferences` is orphaned | P0 | Features | **CONFIRMED** (pass2-dead-ui §3) | `SettingsView.tsx:22`; `NotificationsTab.tsx`; orphan `NotificationPreferences.tsx` | 1 | all-users (silent data loss) |
| 13 | `ProfileTab.tsx` "Guardar cambios" has no onClick; `<Input defaultValue>` uncontrolled | P0 | Features | **CONFIRMED** (pass2-dead-ui §4) | `ProfileTab.tsx:22,30` | 1 | all-users |
| 14 | `SecurityTab.tsx` "Cerrar todas las sesiones" has no onClick | P0 | Features | **CONFIRMED** (pass2-dead-ui §4) | `SecurityTab.tsx:23` | 1 | all-users (false security feature) |
| 15 | `CompanyTab.tsx` hardcodes 4 business types; DB allows 12. User editing farmacia/panaderia/bar/etc. silently downgrades. | P0 | Features / Data | **CONFIRMED** (pass2-dead-ui §8; pass1-frontend P1-9; pass1-features §Settings) | `CompanyTab.tsx:11-16` vs `companies_business_type_check` | 1 | users whose business_type is not in top-4 |
| 16 | `RenewPermitModal` mounted in `LocationDetailView` but `setRenewModalOpen(true)` never called → renew flow unreachable from sede | P0 | Features | **CONFIRMED** (pass2-dead-ui §5) | `LocationDetailView.tsx:25-27,155-156` | 2 | all-users (no sede-scoped renewal) |
| 17 | `LegalIndexView` reads DB, `LegalPermitDetailView` reads static TS — split source of truth | P0→P1 | Features | **PARTIAL** (pass2-dead-ui §6: today 6/6 overlap so no 404s; `luae`/`msp` not in either source; split is real, bug is latent) | `LegalPermitDetailView.tsx:28`; `selectors.ts:30-33` | 3 | latent — triggers when admin adds any DB row |
| 18 | `toLegalReference` adapter strips `consequences`, `requiredDocuments`, `typicalProcess` → even 6 legacy permits, if routed via DB path, lose Legal/Proceso/Riesgos content | P0→P1 | Features | UNVERIFIED in Pass 2 (but consistent with pass1-features #5) | `LegalIndexView.tsx:27-50`; `20260511000006_legal_tables_seed.sql` incomplete | 3 | all-users on legal detail when DB path used |
| 19 | `IncrementalWizard` brand copy says "PermitOps" / "PM" (2 locations) instead of EnRegla | P0 | Features / Brand | **CONFIRMED** (pass2-dead-ui §7) | `IncrementalWizard.tsx:157,161`; `ProfileStep.tsx:24` | 1 | all-new-signups |
| 20 | Internal CRM (`LeadsTable`, `PartnerScorecard`, `useLeads`, `usePartners`) has zero routes → tables populated but no way to view them in product | P0 | Features / Dead code | **CONFIRMED** (pass2-dead-ui §10) | `src/App.tsx:67-124`; no consumer | 3 (ship or delete) | internal-tool (staff) |
| 21 | Both `/design-system` and `/design-system-showcase` shipped as authenticated production routes | P1 | Design system / Build | **CONFIRMED** (pass2-dead-ui §2) | `App.tsx:116-117` | 1 | all-users (leaks internal pages) |
| 22 | TanStack Query wired but only 6/14 data hooks use it; `usePermits`, `useLocations`, `useDocuments`, etc. are hand-rolled useState+useEffect | P1 | Frontend arch | UNVERIFIED in Pass 2 | `src/hooks/*.ts` inventory | 4 | app-wide (no cache, no dedup, race conditions) |
| 23 | `AssigneePicker` invalidates `['permits']` queryKey that no RQ hook owns → invalidation is a no-op, stale assignee | P1 | Frontend arch | UNVERIFIED in Pass 2 | `AssigneePicker.tsx:61` | 1 | assignee UX |
| 24 | `useLocations` calls `usePermits` internally AND every consumer view calls `usePermits` again → 2× Supabase fetch per page on 7 pages | P1 | Frontend arch / Perf | UNVERIFIED | `useLocations.ts:13` | 3 | all list pages |
| 25 | 3 SECURITY DEFINER functions exposed to anon: `get_public_permits`, `increment_public_link_view`, `user_company_id` | P1 | DB / Security | **CONFIRMED** (pass2-db §2; 2 intentional, 1 tightening) | `pg_proc` grants | 1 | defense-in-depth |
| 26 | `companies_insert` policy allows any authenticated user with null `company_id` to create a company; no RUC uniqueness; RUC-squatting possible | P1 | DB / Security | UNVERIFIED | policy body in pass1-auth P1-6 | 3 | all-new-signups + abuse |
| 27 | Public-link token is UUIDv4 but no rate-limit, no UUID-format validation in route `/p/:token` → denial-of-wallet + log spam | P1 | Security / Public | UNVERIFIED (shape confirmed in pass1) | `PublicVerificationPage.tsx:11`; `publicLinks.ts:123-156` | 3 | public-route (cost) |
| 28 | Signed URLs opened via `window.open(url, '_blank')` without `noopener,noreferrer` in `DocumentList` + `PermitDetailView` | P1 | Security | UNVERIFIED | `DocumentList.tsx:35`; `PermitDetailView.tsx:557` | 1 | info-disclosure |
| 29 | `AuthCallback` doesn't check `?error=...` param (user cancel) → generic unhelpful error, confusing UX | P1 | Auth | UNVERIFIED | `AuthCallback.tsx:27-44` | 2 | users who cancel OAuth |
| 30 | `ProtectedRoute`/`useAuth` 5s safety timeout silently sets auth=null on slow network; module-level globals make state machine brittle | P1 | Auth | UNVERIFIED | `useAuth.ts:84-88,10-14` | 4 | slow-network users |
| 31 | `profiles_select` policy allows co-company reads; may expose `full_name`, `role`, `business_role` to any team member; demo company exposes all profiles to anon | P1 | DB / Security | UNVERIFIED | policy body in pass1-auth P1-7 | 2 | multi-tenant (teams + demo) |
| 32 | Storage + `documents` INSERT policies require auth; CLAUDE.md says demo uploads must be anon — spec/reality drift | P1 | DB / Docs | **CONFIRMED** (pass2-db §4) | storage/documents policies; CLAUDE.md | 2 | docs-drift / demo-mode |
| 33 | Generated types never regenerated after v2 migrations → 38 `as any` casts, zero TS coverage on new domain fields | P1 | Build / Types | **CONFIRMED** (pass2 not required; consistent across 4 passes) | 38 grep hits; `src/types/database.ts` | 3 | app-wide |
| 34 | 1.25 MB single JS chunk (no code-splitting), `@xyflow/react` + react-query + react-table + design-system ship to **public** `/p/:token` route | P0-perf | Perf / Bundle | UNVERIFIED (measured in build) | `dist/assets/index-*.js` | 4 | all-users + public visitors |
| 35 | 7 dead dependencies in `dependencies` (recharts, jspdf, html2canvas, framer-motion, d3-force, sonner, @tanstack/react-virtual) — ~47 MB, CVE chain via dompurify | P1 | Deps / Security | UNVERIFIED (grep evidence) | `package.json`; `npm audit` | 1 | build / supply-chain |
| 36 | `react-hook-form` + `zod` + `@hookform/resolvers` installed, zero runtime imports (only `ui/form.tsx` uses RHF, itself orphan) | P1 | Deps / Forms | **CONFIRMED** (pass2-ds §C) | grep; `package.json` | 1 | build |
| 37 | `INEFFECTIVE_DYNAMIC_IMPORT` on `supabase.ts` (dynamic import in `PermitUploadForm` defeated by 5 static imports elsewhere) | P1 | Build | UNVERIFIED | vite build warning | 1 | bundling |
| 38 | CI runs lint/typecheck/test/build but NO coverage, NO audit, NO bundle-size budget, NO migrations dry-run, NO E2E, NO edge-fn typecheck | P1 | CI | UNVERIFIED | `.github/workflows/ci.yml` | 3 | regression risk |
| 39 | Test coverage is a smoke set: 4 files, 19 tests, all pure functions; 0 tests for auth/RLS/hooks/forms/Supabase I/O/Edge fns; 0 E2E | P1 | Tests | UNVERIFIED | test file inventory | 5 | regression risk |
| 40 | TypeScript `strict` never explicitly enabled; `noImplicitAny`, `strictNullChecks`, `noImplicitThis` silently off | P1 | Build / Types | UNVERIFIED | `config/tsconfig.app.json` | 3 | app-wide type safety |
| 41 | `PermitListView` "Responsable" column hardcoded `-` for every row despite `assigned_to_profile_id` existing | P1 | Features | UNVERIFIED | `PermitListView.tsx:43-45` | 1 | all-users |
| 42 | `MonthCard.status` type only covers 3 of 5 statuses; `en_tramite`, `no_registrado` get wrong variant | P1 | Features / Types | UNVERIFIED | `MonthCard.tsx:14`; `RenewalGridView.tsx:46` | 1 | renewals view |
| 43 | `LocationDetailView` tabs `LocationHistoryTab` + `LocationDocumentsTab` are empty-state stubs | P1 | Features | UNVERIFIED | both files | 3 | all-users (2 dead tabs) |
| 44 | `risk-medio` badge contrast 2.4:1; `status-por-vencer` ~4.1:1 — fail WCAG AA | P1 | Design system / A11y | UNVERIFIED | `atlassian-tokens.css:128` | 1 | a11y |
| 45 | `ComplianceWeatherCard` uses inline `<style>` block with 30+ hardcoded hexes; runs continuous JS animations un-gated by `prefers-reduced-motion` | P1 | Design system | UNVERIFIED | `ComplianceWeatherCard.tsx:383-642` | 4 | all-users on dashboard |
| 46 | `LegalMatrixView` 12-col matrix has `min-w-[180px]` per col → ~2500px wide, unusable on tablet portrait (no sticky first col, no horizontal-scroll hint) | P1 | Design system / Responsive | UNVERIFIED | `LegalMatrixView.tsx:65` | 3 | tablet users |
| 47 | CSP lacks `report-uri`/`report-to` → violations fail silently | P2 | Security | UNVERIFIED | `vercel.json:14` | 1 | observability |
| 48 | CSP allows `'unsafe-inline'` for styles | P2 | Security | UNVERIFIED | `vercel.json:14` | 4 | XSS defense |
| 49 | `.env.development` tracked in git; no secrets today but footgun | P2 | Security | UNVERIFIED | `git ls-files` | 1 | supply-chain |
| 50 | `supabase.ts` uses `noopLock` → kills cross-tab session sync (documented trade-off) | P2 | Auth | UNVERIFIED | `src/lib/supabase.ts:27-38` | 2 | multi-tab |
| 51 | 13 unused indexes per perf advisor (mostly on 0-row or <100-row tables) | P2 | DB / Perf | UNVERIFIED | perf advisor output | 1 | write-overhead |
| 52 | `notification_logs` SELECT policy is `TO public` (should be `TO authenticated`) | P2 | DB / Security | UNVERIFIED | policy body | 1 | defense-in-depth |
| 53 | 12 timestamp columns are `timestamp without time zone`; rest is `timestamptz` — inconsistent, TZ drift near midnight | P2 | DB | **CONFIRMED** (pass2-db NEW P1 `profiles.created_at`) | schema dump | 3 | edge-cases near midnight |
| 54 | `auto_create_location_permits` has no `ON CONFLICT` + no partial unique on `(location_id, type)` → network retries create dupes | P2 | DB | UNVERIFIED | pass1-db DB-08 | 2 | latent |
| 55 | FKs on `leads.assigned_to`, `partners.assigned_to`, `notification_preferences.user_id` have no `ON DELETE` → blocks user delete | P2 | DB | UNVERIFIED | pg_constraint | 1 | offboarding |
| 56 | `permits.issuer` text column kept "DEPRECATED" alongside `issuer_id`; backfill incomplete (SCPM, CONSEP) | P2 | DB | UNVERIFIED | column comment + migration notes | 2 | legacy rows |
| 57 | `permits.company_id`, `permits.location_id`, `locations.company_id` nullable (live data 100% populated) | P2 | DB | UNVERIFIED | schema | 1 | latent orphan-rows |
| 58 | `leads.email` has regex CHECK but no unique constraint → duplicate leads inflate CRM | P2 | DB | UNVERIFIED | pass1-db DB-17 | 1 | CRM noise |
| 59 | `locations.risk_level` NOT NULL with no default | P2 | DB | UNVERIFIED | schema | 1 | future-script |
| 60 | `leaked_password_protection` disabled in Supabase Auth | P2 | Auth | **CONFIRMED** (pass2-db NEW P1; advisor) | advisor lint | 1 | credential-stuffing |
| 61 | 35 files in `supabase/migrations/` but 47 rows in `schema_migrations` — ola*/fix_* not in repo; fresh `supabase db reset` won't reproduce prod | P2 | DB / DevOps | UNVERIFIED | `list_migrations` vs repo | 2 | dev-env reproducibility |
| 62 | `drop_legacy_business_type_check` migration has brittle name-pattern sanity check | P2 | DB | UNVERIFIED | migration body | 1 | future re-runs |
| 63 | `ComplianceWeatherCard`/other orphaned widgets (`DashboardWidget`, `DashboardSedeCard`, `PublicLinkBanner`, `NetworkMapCanvas`) — ~20 orphan TSX files, ~3,300 LOC dead weight | P2 | Dead code | Partially CONFIRMED (pass2-dead-ui corroborates CRM + NotificationsPreferences; rest from pass1 inventory) | Appendix B of pass1-frontend-arch | 2 | maintenance |
| 64 | `src/data/mock/` (557 LOC) + `src/data/classification-rules.ts` (222 LOC) — zero importers | P2 | Dead code | UNVERIFIED | grep | 1 | maintenance |
| 65 | `src/styles/.deprecated/design-tokens.css` committed — `.deprecated/` folder is an anti-pattern | P2 | Dead code | UNVERIFIED | directory listing | 1 | maintenance |
| 66 | `components.json` aliases `"ui": "@/components/ui-v2"` — folder does not exist | P2 | Build config | UNVERIFIED | `components.json:14` | 1 | future shadcn add |
| 67 | Half ui primitives migrated to tokens, half still raw shadcn (select, textarea, checkbox, sheet, calendar, form, table, dropdown-menu, tooltip) — combined with #8 they render unstyled | P1 | Design system | Partial CONFIRMED via #8 | inventory in pass1-design §Migration status | 4 | app-wide |
| 68 | Hardcoded raw Tailwind palette in AppLayout sidebar (`from-blue-900`), notification dot (`bg-red-500`), `RoleBadge`, `LegalMatrixView`, `ProtectedRoute` loader | P1 | Design system | UNVERIFIED | grep list | 2 | brand-drift |
| 69 | `PermitUploadForm.tsx` bypasses tokens in critical flow (raw `bg-gray-*`, `text-gray-*`, duplicates `<Banner>`) + two file-size ceilings (5MB drag-drop vs 10MB modal) | P1 | Design / Features | UNVERIFIED | `PermitUploadForm.tsx:213-344`; `PermitDetailView.tsx:77` | 2 | upload UX |
| 70 | Two onboarding code paths: `completeOnboarding` (monolithic, 0 callers) + step-by-step (used) | P2 | Dead code | UNVERIFIED | `lib/api/onboarding.ts` | 1 | maintenance |
| 71 | `src/lib/auth.ts` + `src/lib/api/auth.ts` duplicated; 8 orphan functions between them | P2 | Dead code | UNVERIFIED | grep | 1 | maintenance |
| 72 | `src/types/index.ts` legacy type system disagrees with DB (`IndustryType` 9 values ≠ DB 12; `PermitType` 6 ≠ DB 8; `LocationStage` wrong enum) | P1 | Types | UNVERIFIED | file diff | 3 | silent drift |
| 73 | `PublicVerificationPage` — token un-validated as UUID before DB round-trip; `deactivatePublicLink` API exists but never called from UI (owners can't revoke) | P1 | Features / Public | UNVERIFIED | `PublicVerificationPage.tsx`; `publicLinks.ts:72-86` | 2 | public-route |
| 74 | `getPublicUrl` hardcodes `https://enregla.ec`; no `VITE_PUBLIC_APP_URL` env var | P1 | Deploy / Features | **CONFIRMED** (pass2-domain §1a row 1) | `publicLinks.ts:93` | 1 | fragility |
| 75 | `dompurify ≤3.3.3` via `jspdf` (dead dep): 4 moderate CVEs in `npm audit` | P2 | Supply-chain | UNVERIFIED (audit output cited) | `npm audit` | 1 | CVE noise |
| 76 | CLAUDE.md / AGENTS.md stale (branch=main claimed, focus=real-time-data claimed; actual = feat/dominio-v2, dominio-v2 focus); UI-v2 folder claim false | P2 | Docs drift | UNVERIFIED | grep | 1 | onboarding confusion |
| 77 | README.md severely outdated: `src/features-v2/`, `src/features/documents/`, `scripts/create-demo-data.sql`, `VITE_UI_VERSION` all false/missing | P2 | Docs drift | UNVERIFIED | grep | 2 | onboarding confusion |
| 78 | OAUTH-SETUP.md frames a fixed issue as open; lists localhost:3000 but dev runs on 5173 | P2 | Docs drift | UNVERIFIED | file contents | 1 | onboarding |
| 79 | Pre-production audit 2026-05-10 marked GO; regression caught same day (`046b578`); audit never amended | P2 | Docs drift | UNVERIFIED | audit file + git log | 1 | audit-hygiene |
| 80 | `docs/core/` vs `docs/product/` host near-identical duplicate of PRODUCT/ROADMAP/BACKLOG — drift risk | P3 | Docs | UNVERIFIED | ls | 2 | maintenance |
| 81 | Follow-up `2026-05-10-verification-process-gap.md` OPEN; Definition-of-Done / stop-hook / template — none landed | P2 | Process | UNVERIFIED | file contents | 2 | future audit quality |
| 82 | `CRON_SECRET`, HIBP toggle, `RESEND_FROM` operator actions from 2026-05-10 audit — status unknown / likely not set | P1 | Ops | UNVERIFIED | no commit evidence | 1 | ops / emails |
| 83 | Resend sender `onboarding@resend.dev` fallback is used when `RESEND_FROM` unset; `enregla.ec` not verified in Resend → expiry emails only reach mariodanilorojas@gmail.com | P1 | Email infra | UNVERIFIED | `email-service.ts:9`; pass2-domain §4 | 2 | real customers miss alerts |
| 84 | Plan Task 15 (delete `src/data/legal-references.ts`) never executed; 6 importers still reference it | P2 | Plan drift | UNVERIFIED | grep | 2 | plan hygiene |
| 85 | Plan Task 16 (push branch + open PR) never executed; branch `feat/dominio-v2` local only | P2 | Plan drift | UNVERIFIED | git log | 1 | plan hygiene |
| 86 | `Tabs` component hand-rolled (no `@radix-ui/react-tabs`); missing `aria-controls`/`aria-labelledby`/arrow-key nav; no `focus-visible` ring on `TabsTrigger` | P2 | Design system / A11y | UNVERIFIED | `tabs.tsx` | 3 | a11y |
| 87 | `SelectTrigger h-10`, `Input h-9`, `Button default h-8` — three different control heights in same form | P2 | Design system | UNVERIFIED | files | 1 | visual drift |
| 88 | `Skeleton` component declares two conflicting animations (`animate-pulse` + `animate-shimmer`) but only inline `style` animates | P2 | Design system | UNVERIFIED | `skeleton.tsx:13-26` | 1 | hygiene |
| 89 | Dialog/Sheet/AppLayout overlays all use `bg-black/20 backdrop-blur-sm` — no `--ds-overlay` token; perf cost on tablet | P2 | Design system | UNVERIFIED | grep | 2 | perf/consistency |
| 90 | `ComplianceInvoiceCard` per-line `amount: 0` hardcoded; only total is a range; spec intent was per-issuer grouping | P2 | Features / Dashboard | UNVERIFIED | `DashboardView.tsx:155-166` | 2 | dashboard accuracy |
| 91 | 103 `console.log/error/warn` in prod source (38 in `useAuth.ts` alone, mostly commented) — no `drop_console` | P3 | Logging | UNVERIFIED | grep | 1 | log-leak |
| 92 | `ShareLocationModal` hand-rolls `<div role="dialog">` — no focus trap, no ESC, no scroll-lock; should use `Dialog` primitive | P1 | Features / A11y | UNVERIFIED | `ShareLocationModal.tsx:128-135` | 2 | a11y |
| 93 | `leads.created_at` index ok, but no DB-layer rate-limit, no captcha — combined with #5, unbounded anon insert | P0 | Security | Part of #5 | — | — | — |
| 94 | Token refresh & auth listener: module-level `authSubscription` set AFTER subscription → StrictMode double-reg in dev | P2 | Auth | UNVERIFIED | `useAuth.ts:149-200` | 2 | dev-only |
| 95 | `withTimeout` rejects in UI but does not abort underlying fetch (no AbortSignal) | P3 | Perf | UNVERIFIED | `queryClient.ts:14` | 2 | connection-slot leak |
| 96 | CSS build warning: malformed `var(--ds-status-*-text)` in generated output | P2 | Design system | UNVERIFIED (reproduced in build) | build log | 1 | hygiene |
| 97 | No `/reset-password` route in `App.tsx`; `resetPasswordForEmail` exists but landing is missing | P2 | Auth | UNVERIFIED | `App.tsx` routes; `lib/auth.ts:59` | 2 | pw-reset UX |
| 98 | LoginView "¿Olvidaste tu contraseña?" + "Solicita acceso" links `href="#"` | P3 | Features | UNVERIFIED | `LoginView.tsx:189,252` | 1 | trust-wart |
| 99 | No UI to invite team members or edit `profiles.business_role` → all non-RL users stuck as `empleado`, AssigneePicker warns on every non-RL task | P1 | Features | UNVERIFIED | no-such-file search | 4 | multi-user teams |

**Row count: 99 distinct deduped findings across 13 reports.**

---

## 2. Contradictions (where Pass 1 and Pass 2, or two Pass-1 agents, disagree)

### C-1 — Domain direction: `.ec` vs `.se` (P0 contradiction, reconciled)

- **Pass-1 auth-security** (P0-3): claimed prod is `.se` per MEMORY, but code hardcodes `.ec` → OAuth breaks, CORS breaks.
- **Pass-2 domain-verify** (§8): **flipped it**. Prod IS `app.enregla.ec` (confirmed by commit `c493222`, updated `reference_deploy_flow.md`). Pass-1 relied on a stale MEMORY line (`supabase whitelist solo app.enregla.se`) that was superseded on 2026-05-11.
- **Reconciliation**: production is `.ec`. The real P0 is **source-vs-deployed drift**: edge function `send-expiry-alerts` v8 still has `.se` defaults; expiry emails link to a dead domain. Redeploy fixes it.
- **Source-of-truth issue**: this is a **documentation-hygiene P0**. The MEMORY file, the pre-production audit HTML, and the Pass-1 auth-security report all carried the wrong direction. Any future agent auditing will hit the same inversion.

### C-2 — Public-link RLS severity: P0 vs latent P1

- **Pass-1 auth-security** (P0-1): called it a "live data-exfiltration primitive" for any customer who ever shared a link.
- **Pass-2 public-link-rls** (§4): reproduced the probe and found anon cannot see any non-demo `permits`/`public_links`/`documents` because `public_links` has no anon SELECT policy and `permits_select` blocks non-demo anon. The broken policies (`documents_select_anon`, `permit_docs_select_public_link`) are **effectively dead code** — their EXISTS subquery returns 0 rows for anon.
- **Reconciliation**: policy **shape** is malformed (no token binding). Exploitability today is blocked by other RLS layers. It is a **latent time-bomb**: the moment anyone adds a token-aware anon SELECT policy (or "fixes" the broken public page by adding anon access to `public_links`), the leak detonates.
- **Severity**: downgrade from "live P0" to "P1 + ship-blocker for any public-link changes". Design flaw still needs remediation; urgency is architectural, not active-breach.

### C-3 — `get_public_permits` RPC token binding

- **Pass-1 db** (DB-06): listed it among three anon-exposed SECURITY DEFINER functions, implied concern about unbounded use.
- **Pass-1 auth-security** (P0-1): implied the RPC is "correctly gated by token" (contrasting with the broken policies).
- **Pass-2 public-link-rls** (§2): confirmed RPC binds correctly via `WHERE pl.token = link_token`. **REFUTED** any claim it is token-unbound.
- **Reconciliation**: RPC is safe. Advisor lint about anon-exposure remains (intended). Only `user_company_id()` needs `REVOKE`.

### C-4 — Storage demo-mode uploads

- **CLAUDE.md** (project instruction): "Storage policies must allow uploads to `permits/` folder without auth."
- **Pass-1 auth-security** (DB-05): noted storage INSERT policy is `TO authenticated` only → conflicts with CLAUDE.md.
- **Pass-2 db-verify** (§4): **CONFIRMED** storage INSERT is `roles={authenticated}`. CLAUDE.md is outdated.
- **Reconciliation**: policy or docs must change. Pick a truth. Finding #32.

### C-5 — `LegalPermitDetailView` breakage claim

- **Pass-1 features** (TL;DR #4): "LUAE and MSP cards in index will always 404 the detail view."
- **Pass-1 frontend** (P0-4): same claim.
- **Pass-2 dead-ui-verify** (§6): **PARTIAL**. Both the static TS file AND the DB table `legal_references` contain exactly the same 6 permit_types (ruc, patente_municipal, bomberos, arcsa, uso_suelo, rotulacion). **Neither** source has `luae` or `msp`. The 404-on-LUAE/MSP is not happening today because LUAE/MSP don't exist anywhere. Architectural split is real; bug is latent.
- **Reconciliation**: fix the architectural split (one source of truth) before anyone seeds LUAE/MSP into DB.

### C-6 — `handle_new_user` regression introduction

- **Pass-1 db** (DB-01): claimed the bug exists.
- **Pass-2 db-verify** (§1e–1f): **CONFIRMED + more damning**. The bug was introduced by migration `20260510_pre_production_audit_fixes` — the same "hardening" migration that was supposed to tighten security. All 4 existing profiles were created BEFORE 2026-05-10 by the prior migration which correctly inserted `'admin'`. The regression is specifically traceable to the pre-production audit's own remediation work.
- **Reconciliation**: Pass-2 strengthens Pass-1's P0. Also points to a verification-process failure (audit landed broken code; ties to follow-up `2026-05-10-verification-process-gap.md` which is still OPEN → finding #81).

### C-7 — `permits.type` collision count

- **Pass-1 db** (DB-02): 18 distinct values, 13 legacy display-case.
- **Pass-2 db-verify** (§3): 18 distinct values, ~10 hard duplicate pairs (~29 rows of 51 affected).
- **Reconciliation**: Pass-2 quantifies blast radius. Same finding, worse damage.

### C-8 — Deployed vs source edge-function

- **Pass-1 auth-security** (P0-3): treated source as canonical.
- **Pass-2 domain-verify** (§4): **Deployed v8 ≠ source**. A separate class of bug from the domain confusion itself.
- **Reconciliation**: source-vs-deployed drift is a missing CI/CD gate. CI doesn't validate edge-function deployment state.

---

## 3. Gaps — areas NO pass investigated

These are zero-coverage topics that both the Pass-1 agent mesh and the Pass-2 verifications missed. The final-report consolidator should call them out as **unknowns**, not "fine".

### Critical gaps

1. **Billing / subscription / payment** — no pass examined billing. Is there any billing code? Stripe keys? Subscription table? Trial expiration logic? Zero evidence either way. If product has paid tier, this is a massive blind spot.

2. **Rate-limiting (app-wide)** — only tangentially mentioned (leads INSERT, public-link token). No pass audited:
   - Supabase PostgREST request limits per IP
   - Auth endpoint limits (login brute-force, password reset abuse)
   - Storage upload limits (no per-user quota seen)
   - Edge function invocation limits (`send-expiry-alerts` has `x-cron-secret` but no rate cap)

3. **Backup strategy / disaster recovery / point-in-time recovery** — Supabase default PITR? Retention period? Restore runbook? Zero coverage.

4. **Log retention / PII handling** — `notification_logs`, `permit_events`, Sentry (mentioned in `.env.example`), 103 `console.log` in prod source. No pass examined:
   - PII surface in logs
   - GDPR / Ecuador data-protection compliance
   - Log retention window
   - Who can query logs

5. **Admin / support tooling** — no pass found any admin dashboard. How does support impersonate a user? How is a company manually un-locked if `handle_new_user` fails? How is a RUC collision resolved? Zero ops-tooling audit.

6. **Multi-tenant boundary on non-RLS shared resources**:
   - `permit_issuers` is a shared catalog (is it properly immutable for tenants?)
   - `permit_requirements` is shared across business_types
   - `legal_references` + `legal_consequences` / `legal_process_steps` / `legal_required_documents` — shared across tenants, updated via migration only? Advisor path unclear.
   - Storage bucket `permit-documents` is one bucket — path-based tenancy; is path-injection possible? No test.

7. **Email deliverability / Resend edge cases** — Pass 2 surfaced the `.ec` not-yet-verified flag in passing (finding #83). No pass examined:
   - SPF/DKIM/DMARC setup for `enregla.ec`
   - Bounce handling
   - Unsubscribe flow (`notification_preferences` exists, but is unsubscribe link in every email?)
   - Legal requirements (CAN-SPAM / LGPD-equivalent in Ecuador)

8. **Cron job health** — `pg_cron` fires `send-expiry-alerts`. No heartbeat, no Slack alert, no dead-man's-switch. If cron breaks, permits expire silently and users never get warned. Pass-1 docs-drift flagged this as "not done" from the 2026-05-10 audit but nobody verified current state.

9. **i18n** — app is Spanish-only. Is there any locale abstraction, or hardcoded strings everywhere? No pass examined. `AssigneePicker`, `Banner`, `PermitUploadForm`, `IncrementalWizard` all contain raw Spanish strings. Costs a rewrite if English is ever added.

10. **Supabase Auth config drift** — Pass 2 could not query Supabase Auth URL Configuration via MCP (dashboard-only). **Manual verification still required** to confirm Site URL, Redirect URLs, leaked-password toggle, MFA settings, email templates. Explicitly listed as TODO in pass2-domain-verify §5.

### Medium gaps

11. **Migration replay / local-dev reproducibility** — pass1-db DB-20 flagged 35 repo files vs 47 prod migrations. No pass tried a fresh `supabase db reset` to see if it works. Dev onboarding is probably broken.

12. **Edge function secrets state** — `CRON_SECRET`, `ALLOWED_ORIGIN`, `APP_URL`, `RESEND_API_KEY`, `RESEND_FROM` — none queryable via MCP. Pass 2 flagged this as unknown. Emails-sent and cron-fires status is opaque.

13. **Browser compatibility** — no pass examined minimum supported browsers, polyfill strategy, or CSS-variable fallbacks for older browsers.

14. **Accessibility beyond color-contrast and focus-ring** — no pass did a keyboard-navigation smoke, screen-reader run, or heading-structure audit. Pass-1 design-system spot-checks caught ~5 issues but no systematic run.

15. **Performance telemetry / real-user monitoring** — Sentry DSN in `.env.example` but no pass verified it's wired, nor that Web Vitals are captured. 1.25 MB bundle + no RUM = flying blind.

16. **Database connection limits / pooling** — Supabase uses pgbouncer by default; no pass audited connection-pool settings, RLS overhead at scale, or slow-query logging.

17. **CSP report-to endpoint** — flagged in design-system as missing, but no pass looked at whether violations are actually caught anywhere (Sentry? log?).

### Minor gaps

18. **Service-worker / offline** — not audited. No SW in `public/` seen. Probably intentional (no offline support) but not stated.

19. **Source maps in prod** — Vite default is to emit sourcemaps; no pass checked whether they ship to prod (info-leak if so).

20. **Robots.txt / SEO / open-graph** — no pass examined `/public` for these. Product is internal SaaS + one public verification route; minor but affects share previews.

---

## 4. Ranked Top-20 (severity × blast radius × confidence)

Ranking weights: P0 > P1 > P2. Within same sev, broader blast radius wins. Within same radius, CONFIRMED > PARTIAL > UNVERIFIED.

| Rank | Title | One-line impact | Fix cx |
|------|-------|-----------------|--------|
| 1 | `handle_new_user` inserts `role='member'` (CHECK rejects) | Every new Google-OAuth signup silently loses its profile; onboarding UPDATE no-ops; dashboard empty forever | 1 |
| 2 | `@theme` tokens lack `--color-*` prefix | 9+ Tailwind utilities emit zero CSS across 13 files (calendar, dropdown, sheet, sidebar, tooltip, checkbox, textarea, form, select render unstyled app-wide) | 2 |
| 3 | Edge function `send-expiry-alerts` v8 deployed with `.se` defaults | Every expiry email contains dead `https://app.enregla.se/...` links; customers get warnings they can't act on | 1 (redeploy) |
| 4 | `permits.type` has 18 values, 10 dup pairs, no CHECK | Compliance rollups, Marco Legal joins, renewal cost estimates all wrong for ~29/51 live rows | 3 |
| 5 | `leads` INSERT WITH CHECK (true) for public role | Any attacker can spam leads table unbounded — DB bloat, cost escalation, stored-XSS surface for internal CRM | 2 |
| 6 | 1.25 MB single JS chunk shipped to public `/p/:token` route | Unauthenticated visitors download entire authenticated app (xyflow, react-table, query, design-system, settings, onboarding) | 4 |
| 7 | Public-link RLS has no token binding (latent) | Policies malformed; not exploitable today due to other RLS layers; detonates on next "fix" of public page | 3 |
| 8 | Auto-trigger creates permits with NULL `issuer_id` | 41/46 live permits orphaned from issuer catalog; PermitInfoCard shows "no definido" for every new permit | 2 |
| 9 | "Nuevo Permiso" button dead app-wide + fake settings tabs (Notifications, Profile, Security) | 4 user-facing CTAs do nothing; NotificationsTab silently discards saves | 1-2 each |
| 10 | Generated TS types stale + 28-line placeholder file | No type safety on any v2 domain field; 38 `as any`; any schema rename compiles and breaks at runtime | 2 |
| 11 | `CompanyTab` hardcodes 4 giros vs DB 12 | User with `business_type='farmacia'` editing Settings silently downgrades to `retail`; triggers permit regen on wrong business_type | 1 |
| 12 | `IncrementalWizard` brand says "PermitOps" not "EnRegla" | Every new user's first screen shows wrong brand (2 copy locations) | 1 |
| 13 | `RenewPermitModal` unreachable from LocationDetailView | Renewal flow from sede is dead code | 2 |
| 14 | Legal index (DB) vs detail (static TS) architectural split | Latent 404 for any future DB-only permit_type; `toLegalReference` also strips consequences/docs/steps | 3 |
| 15 | `DesignSystemView` raw `blue-900` labeled as brand; `/design-system-showcase` correct but both shipped | Misleads contributors on brand palette; 2 dev routes exposed to authenticated users | 2 |
| 16 | `user_company_id()` SECURITY DEFINER granted to anon | Defense-in-depth gap; attack surface if function logic ever changes | 1 |
| 17 | TanStack Query not used by 8/14 hooks; `AssigneePicker` invalidation no-op | Stale UI after mutations, 2× permit fetch per page, race conditions on nav | 4 |
| 18 | CI runs lint/typecheck/test/build but no coverage, audit, bundle-budget, migrations dry-run, E2E, edge-fn typecheck | Regressions (like #1, #6, #3) land green; zero automated guard on the audit's own findings | 3 |
| 19 | Resend `enregla.ec` unverified + falls back to `onboarding@resend.dev` | Expiry alerts only reach mariodanilorojas@gmail.com today; once domain verified, #3 detonates on every customer | 2 |
| 20 | Storage/Documents INSERT is `TO authenticated` only; CLAUDE.md says demo = anon | Either demo uploads are broken or the spec is aspirational; no one knows which | 2 |

---

## 5. Quick wins (<30 min, high upside)

| Title | Why it's quick | Why it matters |
|-------|----------------|----------------|
| Fix `handle_new_user` role literal `'member'` → `'admin'` (or add 'member' to CHECK) | One-line migration | Unblocks every new signup — #1 in Top-20 |
| Redeploy `send-expiry-alerts` from current source | `supabase functions deploy send-expiry-alerts` | Fixes email dead-links (#3) |
| Set `ALLOWED_ORIGIN` + `APP_URL` secrets on edge function | Dashboard config | Makes defaults irrelevant; future-proof |
| Wire `SettingsView.tsx:22` to render `<NotificationPreferences/>` instead of `<NotificationsTab/>` | Single import + JSX swap | Fixes silent data loss in a critical user setting |
| Replace `CompanyTab.BUSINESS_TYPES` with `import { BUSINESS_TYPES } from '@/lib/domain/business-types'` | 6-line edit | Stops silent business_type downgrade on save |
| Add `onClick` to `ProfileTab` Guardar (pattern already in `CompanyTab`) + `SecurityTab` Cerrar sesiones (`supabase.auth.signOut({scope:'global'})`) | Two handler functions | Removes fake security/profile controls |
| Replace "PermitOps"/"PM" → "EnRegla"/"ER" in `IncrementalWizard:157,161` + `ProfileStep:24` | Three strings | Brand integrity at onboarding |
| Add `noopener,noreferrer` to `window.open(url, '_blank')` in `DocumentList:35` + `PermitDetailView:557` | Two one-char edits | Closes window.opener leak on PDF preview |
| `REVOKE EXECUTE ON FUNCTION public.user_company_id() FROM anon` | One SQL line | Tightens attack surface on the RLS helper used in every policy |
| Enable leaked-password protection in Supabase Auth dashboard | Single toggle | Blocks HIBP-listed passwords |
| Delete `@custom-variant dark (&:is(.dark *));` from `src/index.css:14` | One-line delete | Aligns with "solo modo claro" directive; prevents accidental `dark:` bleeds |
| Add `aria-hidden="true"` to decorative dots in `RiskBadge`, `StatusBadge`, `badge.tsx` | Three attribute adds | Screen-readers stop announcing bullets before labels |
| `npm uninstall recharts sonner framer-motion d3-force @types/d3-force html2canvas jspdf @tanstack/react-virtual @tanstack/react-query-devtools @radix-ui/react-tooltip @radix-ui/react-separator` | One command | ~47 MB off node_modules + kills `dompurify` CVE chain |
| Delete `.deprecated/design-tokens.css` + `src/data/mock/` + `src/data/classification-rules.ts` | `git rm` | Removes ~800+ LOC of confusing dead code |
| Fix `components.json` alias `"ui": "@/components/ui"` (not `ui-v2`) | One JSON edit | Future `shadcn add` works |

---

## 6. Ship-blocking list (MUST fix before production traffic beyond the existing 4 users)

These are non-negotiable. Anything else can ship as "known-issue + fast-follow".

### P0 blockers — data integrity / auth

1. **Finding #1** — `handle_new_user` regression. New signups are silently broken. Without this, no user after 2026-05-10 can onboard at all.
2. **Finding #9** — Auto-trigger NULL `issuer_id`. Every new permit is missing core v2 data; Dashboard cost/invoice calculations are wrong; PermitInfoCard shows "no definido" for everything.
3. **Finding #2** — `permits.type` data split. Marco Legal joins and compliance rollups are wrong for existing rows; no CHECK means it keeps happening. Backfill + CHECK required before onboarding new customers who will rely on those numbers.

### P0 blockers — security surface

4. **Finding #5** — `leads` anon INSERT unbounded. Trivially DoS'd / spam'd the moment anyone points a bot at the REST endpoint.
5. **Finding #4** — Public-link RLS shape. Must either (a) remove the broken policies + route everything through the `get_public_permits` RPC (already correct), or (b) add proper token binding. Do NOT ship a "fix" to the broken public page that adds anon SELECT without addressing this.
6. **Finding #32** — Storage policy ≠ CLAUDE.md demo mode spec. Pick a truth. If demo uploads need to work without auth, extend policies; if not, fix CLAUDE.md.

### P0 blockers — core UX / brand

7. **Finding #10/11** — "Nuevo Permiso" buttons dead. Users can't create permits through the UI at all.
8. **Finding #12** — `NotificationsTab` silent data loss. Toggles appear to save; they don't. Trust-killer.
9. **Finding #15** — `CompanyTab` 4-giros → silent data corruption. Must fix before any non-top-4-giro customer opens settings.
10. **Finding #19** — "PermitOps" branding on onboarding. First impression of every new customer is the wrong product name.
11. **Finding #13/14** — ProfileTab / SecurityTab fake buttons. Security button that does nothing is actively misleading.

### P0 blockers — email pipeline

12. **Finding #6** — Redeploy `send-expiry-alerts` edge function. Every email today links to a dead domain.
13. **Finding #83** — Verify `enregla.ec` in Resend and set `RESEND_FROM`. Without this, only one email address receives alerts → customers will never get their expiry warnings (which is the entire product value prop).

### P0 blockers — design system rendering

14. **Finding #8** — `@theme` missing `--color-*` prefix. Calendar, dropdown, sheet, tooltip, checkbox, form, select, textarea, sidebar all render unstyled. This is a "the app looks broken on half the screens" issue.

### P1 ship-blockers (material risk with first 10-20 paying customers)

15. **Finding #20** — Internal CRM dead. No way to view `leads` or `partners` in-product. If landing page is live, leads are piling up into a black hole.
16. **Finding #30** — Auth state machine brittle. Slow networks kick real users to /login. At 4 users you don't see it; at 40 you get support tickets.
17. **Finding #26** — Unbounded company creation + no RUC unique. First customer who registers and then someone else squats their RUC is a legal disaster.
18. **Finding #34** — Public `/p/:token` downloads 1.25 MB bundle. First customer whose supplier opens a QR on a phone in the field will have a terrible experience.
19. **Finding #72** — `src/types/index.ts` has 3 legacy enum systems that disagree with DB. A silent bug waiting for the next refactor.
20. **Finding #81** — Verification-process-gap follow-up OPEN. Without Definition-of-Done / stop-hook, the next "audit" will land another `handle_new_user`-class regression. Process meta-problem.

### What is NOT ship-blocking (defer to fast-follow)

- All P2/P3 hygiene (dead code, docs drift, orphan widgets, legacy `src/types/index.ts`)
- Unused deps cleanup (#35) — quick win but not blocking
- Coverage thresholds, CI improvements (#38/39)
- Design-system routes exposed (#21) — annoying but not harmful
- Contrast ratios on `risk-medio` (#44) — important but not production-stopping
- All "stale docs" findings (#76-80) — fix in a follow-up sweep

---

## Appendix — source-of-truth flags

Two items surfaced as cross-cutting documentation-hygiene P0s for the final report to highlight:

- **Domain direction inversion** (C-1). `.se` appears in multiple stale docs + one MEMORY entry. Any agent re-auditing will re-derive the wrong answer. Recommend: batch-purge `.se` from all non-historical docs + add a note in CLAUDE.md that canonical domain is `.ec`.
- **`handle_new_user` regression introduced by the 2026-05-10 pre-production audit** (C-6). The verification-process-gap follow-up (#81) documented the risk; the risk materialized the same day; nothing in the audit report itself was amended. Recommend: amend pre-production audit header with "SUPERSEDED by regression patched in commit `046b578` + still-broken `handle_new_user` in this same migration". Tie back to stop-hook / Definition-of-Done as an actual enforcement mechanism.

---

_End pass 3 — reconciliation._
