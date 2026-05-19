# Pass 1 — Frontend Architecture Audit

**Scope:** `C:\dev\enregla\src\` (React 19 + Vite 8 + TS 6 + react-router-dom 7 + TanStack Query 5 + Zustand 5 + Tailwind 4)
**Date:** 2026-05-12
**Method:** Static code review; no runtime verification.

---

## TL;DR — Top 5

1. **Data layer is schizophrenic.** `QueryClientProvider` is wired (`src/main.tsx:16`), but only 6 of ~11 data hooks actually use TanStack Query. The rest (`usePermits`, `useLocations`, `useLocation`, `usePermit`, `useDocuments`, `useLeads`, `usePartners`, `useNotificationPreferences`) are hand-rolled `useState`+`useEffect` with manual `refetch()` helpers. Two sources of truth, no shared cache, no auto-refetch across components.
2. **Double-fetch of permits on every page** that shows both locations + permits. `useLocations()` internally calls `usePermits({ companyId })` (`src/hooks/useLocations.ts:13`) for risk calculation — and **every** view (`DashboardView`, `LocationsGrid`, `LocationDetailView`, `PermitListView`, `PermitDetailView`, `NetworkMapPage`, `RenewalGridView`) *also* calls `usePermits({ companyId })` at the view level. Two independent network requests, two caches, no dedup.
3. **Two onboarding code paths, one never used.** `src/lib/api/onboarding.ts` exports both `completeOnboarding` (monolithic, grep=0 callers) and the step-by-step `saveProfile`/`saveCompany`/`saveLocationWithPermits` (used by `IncrementalWizard`). The unused path is 60+ LOC of dead code.
4. **Orphan feature tree: internal-crm.** `LeadsTable`, `PartnerScorecard`, `useLeads`, `usePartners`, and `types/crm.ts` exist and have UI + DB tables, but **zero routes** and zero imports anywhere. Users can't reach them.
5. **Type-safety escape hatches are endemic.** 38 `as any` casts (all justifying "stale generated types"), `database.types.ts` is unused, `types/index.ts` defines a *different* legacy type system (6 PermitTypes, 9 IndustryTypes) that disagrees with the DB (~12 business types) and is still imported by 4 legal views. Fixing the generated types would unblock ~35 of these casts.

---

## Findings

### P0 — Broken / crashes / data-correctness

#### P0-1. Invalidation key mismatch leaves AssigneePicker stale
- **Severity:** P0
- **Evidence:** `src/features/permits/AssigneePicker.tsx:61` — `queryClient.invalidateQueries({ queryKey: ['permits'] })` after mutating `assigned_to_profile_id`. But **no query in the codebase uses queryKey `['permits']`** (permits are fetched via `usePermits` which is *not* a RQ hook — it's a manual `useEffect`). The invalidation is a no-op.
- **Impact:** Changing assignee does not refresh the permit list that contains the new assignee. User sees stale `assigned_to_profile_id` until a manual page refresh. `permit_events` invalidation works (line 62) because that one *is* a RQ hook.
- **Fix:** Either migrate `usePermits` to TanStack Query (preferred) or replace line 61 with a call to `usePermits.refetch()` exposed via context/prop.

#### P0-2. NotificationsTab is a fake — persistence page in settings stores nothing
- **Severity:** P0
- **Evidence:** `src/features/settings/SettingsView.tsx:22` renders `<NotificationsTab />` which is `src/features/settings/NotificationsTab.tsx` — a component with hard-coded `<input type="checkbox" defaultChecked />` toggles and **no onChange, no API call, no hook**. Meanwhile `src/features/settings/NotificationPreferences.tsx` (fully functional, uses `useNotificationPreferences`) exists but is **never imported anywhere** (grep confirms 0 callers).
- **Impact:** Users toggling notification preferences in `/settings` → Notificaciones tab think they saved — nothing persists. Silent data loss.
- **Fix:** Swap `SettingsView.tsx:22` to render `<NotificationPreferences />` and delete `NotificationsTab.tsx`.

#### P0-3. LocationDetailView has dead `RenewPermitModal` state — renewal unreachable
- **Severity:** P0
- **Evidence:** `src/features/locations/LocationDetailView.tsx:25-27` — `const [selectedPermit, setSelectedPermit] = useState<Permit | null>(null); const [renewModalOpen, setRenewModalOpen] = useState(false);` Both setters appear only in the `onClose` handler (lines 155–156) that resets them to false/null. **Neither is ever called with a truthy/non-null value.** The `<RenewPermitModal>` at line 151 can therefore never open.
- **Impact:** Ability to renew a permit from the location detail page is broken; button or menu item that wires `setRenewModalOpen(true)` is missing. `updatePermit` + `handleConfirmRenewal` are dead handlers.
- **Fix:** Add trigger (e.g., in `LocationPermitsTab`) that calls `setSelectedPermit(permit); setRenewModalOpen(true)`; OR delete the dead modal+state.

#### P0-4. LegalIndexView (DB) links to LegalPermitDetailView (static) — broken navigation
- **Severity:** P0
- **Evidence:**
  - `src/features/legal/LegalIndexView.tsx:12,71` uses `useLegalReferences()` (reads `legal_references` table via RQ) to list permits.
  - Each card is a `<Link to={\`/marco-legal/${reference.permitType}\`}>` (`src/features/legal/PermitCard.tsx:38`).
  - The target route `LegalPermitDetailView` (`src/features/legal/LegalPermitDetailView.tsx:28`) calls `getPermitByType(permitType)` → `src/features/legal/selectors.ts:30` which reads the **static** `LEGAL_REFERENCES` from `src/data/legal-references.ts`.
- **Impact:** Any `permit_type` in DB that is not also in the hard-coded static map (`patente_municipal`, `bomberos`, `arcsa`, `uso_suelo`, `rotulacion`, `ruc` — 6 types) renders a "permiso no encontrado" error page. The DB includes at least `luae` and `msp` (`src/features/legal/LegalMatrixView.tsx:7`) — clicking those cards is broken.
- **Fix:** Migrate `LegalPermitDetailView` to `useLegalReferences` / `usePermitRequirements` too, reuse the DB→LegalReference adapter `toLegalReference` already defined in `LegalIndexView.tsx:27`.

#### P0-5. Nuevo Permiso buttons are decorative — no action
- **Severity:** P0
- **Evidence:** `src/features/permits/PermitListView.tsx:85-87` (header button) and `:112-115` (empty-state button). Both `<Button variant="default"><Plus />Nuevo Permiso</Button>` have **no `onClick`**. The click does nothing.
- **Impact:** From `/permisos` users can't create a permit. Only way today is via location → permit flow. Empty-state page is a dead-end.
- **Fix:** Wire to a modal (analogous to `CreateLocationModal`) or remove the button.

#### P0-6. SecurityTab "Cerrar todas las sesiones" has no handler
- **Severity:** P0
- **Evidence:** `src/features/settings/SecurityTab.tsx:23` — `<Button variant="destructive"><LogOut />Cerrar todas las sesiones</Button>` with no `onClick`.
- **Impact:** The advertised security feature does nothing. Users who think they've revoked sessions have not.
- **Fix:** Wire to `supabase.auth.signOut({ scope: 'global' })` or remove the button.

#### P0-7. ProfileTab "Guardar cambios" has no handler
- **Severity:** P0
- **Evidence:** `src/features/settings/ProfileTab.tsx:22, 30` — `<Input defaultValue={…full_name} />` (uncontrolled), `<Button variant="default">Guardar cambios</Button>` (no onClick).
- **Impact:** Users cannot update their own name from settings.
- **Fix:** Convert to controlled input, add save handler (pattern already present in `CompanyTab`).

#### P0-8. IncrementalWizard brand copy is "PermitOps" not "EnRegla"
- **Severity:** P0 (product-facing)
- **Evidence:** `src/features/onboarding-incremental/IncrementalWizard.tsx:157,161` ("PM" logo + "PermitOps" label); `src/features/onboarding-incremental/steps/ProfileStep.tsx:24` ("Bienvenido a PermitOps").
- **Impact:** Every new user's first impression shows a different brand name than the app they just signed up for. Brand integrity.
- **Fix:** Replace "PermitOps"/"PM" with "EnRegla"/"ER".

---

### P1 — Architectural debt / significant bugs

#### P1-1. TanStack Query is wired but mostly unused
- **Severity:** P1
- **Evidence:** `src/main.tsx:16` has `QueryClientProvider`; `src/lib/queryClient.ts` configures sane defaults. But only 6 hooks use `useQuery`: `useCompany`, `usePermitEvents`, `usePermitRequirements` + `useRequirementFor`, `useLegalReferences`, `useIssuers` + `useIssuer`, and one `useQuery`+`useQueryClient` in `AssigneePicker`. The high-traffic hooks (`usePermits`, `useLocations`, `useLocation`, `usePermit`, `useDocuments`, `useLeads`, `usePartners`, `useNotificationPreferences` — 8 files) are all hand-rolled `useState`+`useEffect`+`refetch()` callbacks.
- **Impact:**
  - No cache sharing between views — nav from `/sedes` → `/permisos` refetches locations + permits from scratch every time.
  - No auto-refetch on window focus (configured in `queryClient.ts:44` but never exercised for core entities).
  - `queryClient.clear()` on sign-out (`useAuth.ts:189–191`) clears nothing that matters for permits/locations — they live in component state.
  - Mutations need hand-rolled `await refetch()` chains; error paths leave UI inconsistent.
- **Fix:** Migrate the 8 hand-rolled hooks to `useQuery`/`useMutation`. Standard query keys: `['permits', { companyId, locationId }]`, `['locations', companyId]`, etc.

#### P1-2. Double-fetch of permits on every list page
- **Severity:** P1
- **Evidence:** `src/hooks/useLocations.ts:13` — `useLocations` internally calls `usePermits({ companyId })` to compute `risk_level` in a `useMemo`. Every consumer that *also* calls `usePermits({ companyId })` at the view level therefore triggers **two** independent permit fetches:
  - `DashboardView.tsx:63-64`
  - `LocationsGrid.tsx:28-29`
  - `LocationDetailView.tsx:22-23`
  - `PermitListView.tsx:19-20`
  - `PermitDetailView.tsx:46-47`
  - `NetworkMapPage.tsx:14-15`
  - `RenewalGridView.tsx:15-16`
- **Impact:** 2× Supabase round trips per navigation on the 7 main pages. Visible loading flicker; wasted bandwidth; any race between the two permit fetches can produce inconsistent `risk_level` vs raw `permits` props in the same render.
- **Fix:** Don't fetch permits inside `useLocations`. Compute `risk_level` from a `permits` arg passed in, or move risk calculation to the consumer that already has permits.

#### P1-3. Orphan feature: internal-crm (leads + partners)
- **Severity:** P1
- **Evidence:**
  - `src/features/internal-crm/LeadsTable.tsx` (119 LOC) — only importer is nothing (grep `LeadsTable` → only the file itself).
  - `src/features/internal-crm/PartnerScorecard.tsx` (101 LOC) — only imported by its own test.
  - `src/hooks/useLeads.ts` + `src/hooks/usePartners.ts` — only `LeadsTable` (orphan) imports `useLeads`. `usePartners` has zero callers.
  - No route in `App.tsx` references `/leads` or `/partners`.
- **Impact:** ~300 LOC + 2 DB tables (`leads`, `partners`) with RLS, unreachable. Either ship the CRM or remove the code. Current state confuses readers ("is this dead?") and carries maintenance cost.
- **Fix:** Either (a) add a `/crm/leads` + `/crm/partners` route behind admin role and a sidebar item, or (b) delete `features/internal-crm/`, `hooks/useLeads.ts`, `hooks/usePartners.ts`, `types/crm.ts` + migrations.

#### P1-4. Two parallel type systems + frozen legacy types
- **Severity:** P1
- **Evidence:**
  - `src/types/index.ts` (222 LOC) — hand-written legacy: `IndustryType` (9 values), `PermitType` (6 values: patente_municipal, bomberos, arcsa, uso_suelo, rotulacion, ruc), `Company`, `Location`, `Permit` interfaces that are camelCase and disagree with DB.
  - `src/types/database.ts` — generated from Supabase, snake_case, single source.
  - `src/types/database.types.ts` exists but is not imported anywhere.
  - `src/lib/domain/business-types.ts` — runtime source of truth with 12 business types.
- `src/features/legal/*` still imports `PERMIT_TYPE_LABELS` from `@/types` (the legacy). The legacy has 6 types; DB + `LegalMatrixView` use 8 (+`luae`, `msp`). Permits with those types render as "No encontrado" in `LegalPermitDetailView` (see P0-4).
- **Impact:** Runtime ≠ types. `isKnownPermitType` check (`LegalIndexView.tsx:17-19`) silently drops DB entries whose `permit_type` isn't in the legacy 6.
- **Fix:** (1) Delete `types/database.types.ts` (unused duplicate). (2) Move `PERMIT_TYPE_LABELS` / `RISK_LABELS` into `lib/domain/` keyed off DB strings. (3) Delete legacy `IndustryType`/`Company`/`Location`/`Permit` interfaces in `types/index.ts` (unused except by `data/mock/*` which is also orphan). (4) Keep `LegalReference`/`LegalSource`/`ObligationResult` if still needed by legal panels.

#### P1-5. Massive orphan tree in `src/data/`
- **Severity:** P1
- **Evidence:**
  - `src/data/mock/index.ts` (557 LOC) — exports `mockCompany`, `mockLocations`, `mockPermits`, etc. Grep `from '@/data/mock'` → **zero** importers.
  - `src/data/classification-rules.ts` (222 LOC) — exports `classifyLocation`, `classifyLocations`. Zero importers anywhere.
  - `src/data/legal-references.ts:449` `getLegalReference` is only used by orphan `classification-rules.ts`; the rest of the file (`PERMIT_TO_CATEGORY`, `CATEGORY_META`, `CATEGORY_ORDER`, `LEGAL_REFERENCES`, `getAllLegalReferences`) *is* used by the legal feature.
- **Impact:** ~800 LOC orphan code + stale mock fixtures. Confuses contributors. `data/legal-references.ts` mixes used static maps with unused `LEGAL_REFERENCES` constant (same data as DB).
- **Fix:** Delete `src/data/mock/` and `src/data/classification-rules.ts`. Audit whether `LEGAL_REFERENCES` static object can also go (it's the pre-DB fallback, now duplicated by `legal_references` table).

#### P1-6. `src/hooks/useDocuments.ts` orphan — two doc-fetch paths
- **Severity:** P1
- **Evidence:** `useDocuments` (42 LOC) has zero callers. Instead `PermitDetailView.tsx:62-75` re-implements the same fetch inline via `fetchDocuments` + `getPermitDocuments`.
- **Impact:** Two ways to fetch permit documents; new features may pick the wrong one or fork again.
- **Fix:** Migrate `PermitDetailView` to `useDocuments` (ideally RQ-backed per P1-1), delete the inline fetch.

#### P1-7. Auth init is module-scoped global mutable state
- **Severity:** P1
- **Evidence:** `src/hooks/useAuth.ts:10–14` — `let authInitialized = false; let authSubscription: any = null; let initializationPromise: Promise<void> | null = null;` — module-scoped, never reset. The cleanup in the effect (`:206-208`) explicitly says "Don't unsubscribe - keep it alive for the app lifetime". No global `AuthProvider`.
- **Impact:**
  - Under Vite HMR / StrictMode double-mount, the second mount sees `authInitialized=true` and bails — but if the first ran to completion, the listener is still live. Usually works but is fragile; the comments on the file show it was hacked around multiple times (see `src/lib/supabase.ts:15-31` noopLock workaround for a related pitfall).
  - `authSubscription` is never unsubscribed across module reloads; in HMR dev it accumulates dangling listeners.
  - Testing this hook in isolation (unit tests) is impossible without stubbing the module globals.
- **Fix:** Extract to a single `<AuthProvider>` at the root that owns the subscription + cleans up on unmount; `useAuth` becomes a plain `useContext` consumer. Drop the module globals.

#### P1-8. Duplicate auth libraries + orphan functions
- **Severity:** P1
- **Evidence:**
  - `src/lib/auth.ts` and `src/lib/api/auth.ts` both exist.
  - `src/lib/auth.ts` exports `signUp`, `signIn`, `signOut`, `getSession`, `getCurrentUser`, `resetPassword`, `updatePassword`, `onAuthStateChange`, `signInWithGoogle` — only `signInWithGoogle` is imported anywhere.
  - `src/lib/api/auth.ts` exports `login`, `register`, `logout`, `getCurrentUser`, `getSession` — `login` and `logout` are used; `register`, `getCurrentUser`, `getSession` are orphans.
- **Impact:** 8 dead functions across two files. Next contributor will ask "which one do I use?".
- **Fix:** Consolidate into one file; delete orphan exports.

#### P1-9. CompanyTab BUSINESS_TYPES list is stale (4 vs DB's 12)
- **Severity:** P1
- **Evidence:** `src/features/settings/CompanyTab.tsx:11-16` defines a local `BUSINESS_TYPES` array with 4 values (`restaurante`, `retail`, `food_truck`, `consultorio`). Meanwhile `src/lib/domain/business-types.ts` exports 12 values (per commit `db9dc6c feat(onboarding): dropdown de business_type con 12 giros`). Settings UI lets a user "downgrade" a valid `farmacia` company to `retail`.
- **Impact:** User with `business_type='farmacia'` opens CompanyTab → dropdown defaults to `retail` (not their current value, because their value isn't in the list) → on save, company `business_type` silently changes. This also invalidates their auto-generated `permits` because `auto_create_location_permits` trigger is keyed on `business_type`.
- **Fix:** Replace local `BUSINESS_TYPES` with `import { BUSINESS_TYPES, businessTypeLabel } from '@/lib/domain/business-types'`.

#### P1-10. `updatePermit` in `usePermits` does not update local state — relies on refetch
- **Severity:** P1
- **Evidence:** `src/hooks/usePermits.ts:67-93` — after `supabase.from('permits').update(...).eq('id', permitId)` succeeds, calls `await refetch()` (line 92) to refresh. No optimistic update, no `setPermits(prev => prev.map(...))`.
- **Impact:** UI shows stale status until the refetch completes (extra round trip). Worse, since `usePermits` is a child of `useLocations` in many views (P1-2), the refetch cascades.
- **Fix:** Optimistic update + RQ mutation.

#### P1-11. `useLeads`, `usePartners`, `useLocations` fetch without cleanup / cancellation
- **Severity:** P1
- **Evidence:** `src/hooks/useLeads.ts:10-30`, `src/hooks/usePartners.ts:10-30`, `src/hooks/useLocations.ts:15-39`, `src/hooks/usePermits.ts:16-46`, `src/hooks/usePermit.ts:11-41` — all `useEffect` blocks start a `supabase.from(...).then(...)` without AbortController or a `cancelled` flag. The effect cleanup returns nothing.
- **Impact:** If `companyId`/`locationId` changes before the previous fetch resolves, the stale response calls `setPermits(oldData)` after the newer one set newData → user sees old data in the new context. Classic race. React StrictMode may also emit warnings about setting state after unmount when navigating fast.
- **Fix:** Migrate to RQ (cancels automatically) OR add `let cancelled = false;` + `if (!cancelled) setX(…)` + `return () => { cancelled = true; }`. Note `CompanyTab.tsx:47,73-75` already uses this pattern correctly — good reference.

#### P1-12. Dead route: `/marco-legal/matriz` has no nav entry
- **Severity:** P1 (discoverability)
- **Evidence:** Route defined at `App.tsx:114`, `LegalMatrixView` (98 LOC) rendered only if user types the URL directly. `AppLayout` sidebar has `Marco Legal` → `/marco-legal`, but there's a small inline `<Link to="/marco-legal/matriz">` in `LegalIndexView.tsx:141`. Not prominent.
- **Impact:** Feature exists but hidden. Fine if intentional; document.
- **Fix:** Either add sidebar entry or tab within `/marco-legal`.

#### P1-13. Two design-system routes exposed in production
- **Severity:** P1
- **Evidence:** `App.tsx:116-117` mounts `/design-system` and `/design-system-showcase`, both behind `ProtectedRoute` but reachable for any authenticated user. The views are 736 + 589 LOC of raw Tailwind (`bg-blue-900`, `bg-gray-100`), not UI-v2 tokens. No nav entry.
- **Impact:** Authenticated users can stumble onto internal design pages. ~1.3k LOC shipped in bundle.
- **Fix:** Gate behind `import.meta.env.DEV` in the route definition, or require admin role, or delete.

#### P1-14. `MonthCard.status` type excludes valid statuses
- **Severity:** P1
- **Evidence:** `src/features/renewals/MonthCard.tsx:14` declares `status: 'vigente' | 'por_vencer' | 'vencido'`. But `RenewalGridView.tsx:46` passes `p.status` which can also be `en_tramite` or `no_registrado` — cast via `(p.status as MonthRenewal['status'])`. The `variant` map at `MonthCard.tsx:58-62` only covers 3 cases — `en_tramite` and `no_registrado` permits get `undefined` variant → badge renders with default variant but label reads e.g. "en tramite" with wrong styling.
- **Impact:** Badge colors lie for two of five statuses in the renewals view.
- **Fix:** Extend `MonthRenewal.status` to all 5 statuses + add variant entries.

#### P1-15. Orphan `LocationsStage`/legacy `PermitType` usage in `types/index.ts`
- **Severity:** P1
- Already covered by P1-4. `LocationStage` type enumerates `'apertura' | 'operando' | 'renovando'` but the DB stores `'operando' | 'en_preparacion' | 'cerrado'` (per `CreateLocationModal`). Anyone who imports `LocationStage` from `@/types` gets the wrong union.
- **Fix:** Delete `LocationStage` (no importers found) + related `Task`, `Renewal`, `Document`, `ClassificationResult`, `OnboardingInput`, etc.

#### P1-16. ShareLocationModal bypasses dialog primitives
- **Severity:** P1 (a11y)
- **Evidence:** `src/features/public-links/ShareLocationModal.tsx:128-135` — hand-rolled `<div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm">` with `role="dialog"` / `aria-modal="true"`. No focus trap, no ESC handler, no scroll lock. Other modals in the app (`CreateLocationModal`, `RenewPermitModal`) use `@radix-ui/react-dialog` via `components/ui/dialog`.
- **Impact:** Screen-reader users can tab out of the modal; ESC doesn't close it; focus isn't restored to the trigger button on close.
- **Fix:** Migrate to `Dialog` from `components/ui/dialog`.

#### P1-17. PublicVerificationPage has no 404 route and reads token un-validated
- **Severity:** P1
- **Evidence:** `src/features/public-links/PublicVerificationPage.tsx:11` — `useParams<{ token: string }>()`. `App.tsx:121` has a catch-all `<Route path="*" element={<Navigate to="/" replace />} />` — but this is *inside* the same Routes tree. When unauthenticated user visits `/p/invalid-token`, the `/p/:token` route matches (public), then `getPublicLinkData(token)` returns null → `PublicVerificationPage` renders its own error UI. That's OK but adds 2 requests for garbage tokens.
- **Impact:** Minor — but validate the token shape (UUID) client-side first to avoid DB round-trip for obvious junk.
- **Fix:** Add UUID regex check; render error state immediately.

---

### P2 — Hygiene / inconsistencies

#### P2-1. 38 `as any` casts, 0 `@ts-ignore`
- **Severity:** P2 (debt)
- **Evidence:** All 38 comments justify themselves as "stale generated types — see audit follow-up". See list in analysis (`useLeads.ts:55`, `useCompany.ts:20`, `usePermits.ts:79`, `useAuth.ts:13,69`, etc.). `@ts-ignore`/`@ts-expect-error` grep = 0 (good).
- **Impact:** Loses type safety on every mutation; masks schema drift. Onboarding of new features tends to copy the `as any` pattern.
- **Fix:** Regenerate `src/types/database.ts` (run `supabase gen types typescript --project-id …`). Delete the casts. Block regressions in CI (`grep -r 'as any' src/` → fail if > baseline).

#### P2-2. Orphan UI components (large)
- **Severity:** P2
- **Evidence:**
  - `src/components/ui/sidebar.tsx` (770 LOC) — zero importers except `use-mobile`.
  - `src/hooks/use-mobile.tsx` — only used by `sidebar.tsx`, mutual orphan.
  - `src/components/ui/form.tsx` (177 LOC) — uses `react-hook-form` + tokens `text-destructive`/`text-muted-foreground` that don't exist in the design system. Zero importers.
  - `src/components/ui/table.tsx` (117 LOC) — zero importers (PermitTable uses raw `<table>`).
  - `src/components/ui/tooltip.tsx`, `sheet.tsx`, `dropdown-menu.tsx`, `separator.tsx` — zero importers.
  - `src/components/ui/RiskBadge.tsx`, `StatusBadge.tsx` — exported from `components/ui/index.ts` but no file imports them.
  - `src/components/documents/DocumentList.tsx` — zero importers (uses old Tailwind `bg-blue-50` not tokens).
  - `src/features/locations/PublicLinkBanner.tsx` — zero importers (uses nonexistent `bg-info` class).
- **Impact:** ~1.5k+ LOC dead weight. Bundles the radix primitives for unused components. Confuses "do we have a Tooltip?" → yes in the file, no in the app.
- **Fix:** Delete the files + remove from `components/ui/index.ts` + drop unused radix deps (`@radix-ui/react-tooltip`, `@radix-ui/react-separator`).

#### P2-3. Unused dependencies (bundle bloat)
- **Severity:** P2
- **Evidence:** Grep in `src/` finds zero uses of:
  - `recharts` — 0 uses
  - `sonner` — 0 uses (toasts use `react-hot-toast` instead)
  - `framer-motion` — 0 uses
  - `d3-force` — 0 uses (react-flow provides its own layout)
  - `html2canvas` — 0 uses
  - `jspdf` — 0 uses
  - `@tanstack/react-virtual` — 0 uses
  - `@tanstack/react-query-devtools` — 0 uses (never mounted)
  - `react-hook-form` — only imported by orphan `components/ui/form.tsx`
  - `zod` — 0 uses
  - `@hookform/resolvers` — 0 uses
  - `@radix-ui/react-tooltip` — only by orphan `tooltip.tsx`
  - `@radix-ui/react-separator` — only by orphan `separator.tsx`
- **Impact:** ~13 unused deps. If tree-shaking isn't perfect (CJS interop, side effects), some ship in the bundle.
- **Fix:** `npm uninstall recharts sonner framer-motion d3-force @types/d3-force html2canvas jspdf @tanstack/react-virtual @tanstack/react-query-devtools @radix-ui/react-tooltip @radix-ui/react-separator`. Keep `react-hook-form` + `zod` only if you plan to use them (they're not live).

#### P2-4. `.deprecated` folder shipped in repo
- **Severity:** P2
- **Evidence:** `src/styles/.deprecated/design-tokens.css` — old design tokens not imported anywhere (`src/index.css` uses current tokens).
- **Impact:** Confuses contributors. `.deprecated` in tree is an anti-pattern; git history is for deprecation.
- **Fix:** Delete `src/styles/.deprecated/`. Rely on git for history.

#### P2-5. Double stepper in onboarding wizard
- **Severity:** P2
- **Evidence:** `src/features/onboarding-incremental/IncrementalWizard.tsx:164` renders `<ProgressStepper>` (vertical, in sidebar), `:178` renders `<Stepper>` (horizontal, above the form). Same data, two visual components.
- **Impact:** Visual noise. Users see their progress in two places.
- **Fix:** Pick one; delete the other. (Prefer `ProgressStepper` since it's in the sidebar per the design.)

#### P2-6. `NetworkMapCanvas` is a pointless wrapper
- **Severity:** P2
- **Evidence:** `src/features/network/NetworkMapCanvas.tsx` (15 LOC) wraps `<DashboardMap fillParent />` in a `<div className="w-full h-full">`. Zero added logic.
- **Fix:** Inline `DashboardMap` in `NetworkMapPage`, delete `NetworkMapCanvas`.

#### P2-7. `DashboardWidget` is orphan
- **Severity:** P2
- **Evidence:** `src/features/dashboard/DashboardWidget.tsx` (61 LOC) — zero importers. `DashboardView` replaced it with `ComplianceWeatherCard` + `ComplianceInvoiceCard`.
- **Fix:** Delete.

#### P2-8. `LocationDocumentsTab` and `LocationHistoryTab` are no-op placeholders
- **Severity:** P2
- **Evidence:**
  - `LocationDocumentsTab.tsx:10` — just an `<EmptyState>`, `locationId` prop intentionally unused (see eslint-disable comment).
  - `LocationHistoryTab.tsx:15` — receives `events` prop that's always `[]` because parent (`LocationDetailView`) never passes it.
- **Impact:** Two tabs in the location detail that show "empty" forever.
- **Fix:** Either implement (wire to `documents` + `permit_events` tables) or hide the tabs.

#### P2-9. Duplicate "useEffect race" comments indicating known issues
- **Severity:** P2
- **Evidence:** 8 lines across hooks have `// eslint-disable-next-line react-hooks/set-state-in-effect`. Every one is a "setState in effect body" that the new React 19 rule flags. The pattern works but signals an ongoing state-in-effect antipattern (P1-11 consequence).
- **Fix:** Subsumed by migrating to RQ.

#### P2-10. Inconsistent token usage: raw Tailwind vs design tokens
- **Severity:** P2
- **Evidence:** Most views use `var(--ds-*)` tokens. But:
  - `DesignSystemView.tsx` — raw `bg-blue-900`, `text-gray-900`, etc. for all 737 LOC.
  - `DesignSystemShowcase.tsx:15,18,19` — uses `var(--color-surface)`, `var(--color-text)` (yet another token set).
  - `DocumentList.tsx` (orphan) — `bg-blue-50`, `bg-red-100`, `text-gray-900`.
  - `ComplianceWeatherCard.tsx:70` — hard-coded hex `rgba(255, 245, 200)`.
  - `LegalMatrixView.tsx:39-42` — `bg-green-600`, `bg-amber-500`, `bg-blue-400` raw.
- **Fix:** Standardize on `--ds-*` tokens per `CLAUDE.md` brand direction.

#### P2-11. Orphan API exports in `lib/api/`
- **Severity:** P2
- **Evidence:**
  - `lib/api/permits.ts`: `updatePermitStatus` (line 77), `updatePermit` (line 100), `renewPermit` (line 132) — all orphan; real `updatePermit` lives in the hook. `getPermit`, `getPermitHistory` — only used by orphan `usePermit` hook.
  - `lib/api/locations.ts`: `updateLocationRisk` (line 38) — orphan.
  - `lib/api/publicLinks.ts`: `getCompanyPublicLinks` (line 43), `deactivatePublicLink` (line 72) — orphan.
  - `lib/api/onboarding.ts`: `completeOnboarding` (line 32), `updateProfile` (line 101), `checkHasLocations` (line 218) — orphan.
- **Impact:** ~250 LOC dead API. Duplicates with in-hook logic (see P1-10).
- **Fix:** Delete.

#### P2-12. Legacy `usePermit` hook (singular) orphan
- **Severity:** P2
- **Evidence:** `src/hooks/usePermit.ts` — grep for `usePermit\b` (word boundary) shows zero importers. `PermitDetailView` fetches via `usePermits().permits.find(...)` instead (`PermitDetailView.tsx:56`).
- **Fix:** Delete `usePermit.ts`.

#### P2-13. Multiple NetworkMapPage data source mismatches
- **Severity:** P2
- **Evidence:** `NetworkMapPage.tsx:33` does `(loc as { code?: string }).code || loc.id.slice(0, 8)` — `code` is not a column. `:48` does `(profile as { company_name?: string } | null)?.company_name` — not a column. Silent fallbacks hide the intent.
- **Fix:** Either remove the `code`/`company_name` casts (they're always undefined) or add those columns.

#### P2-14. `PermitListView.tsx:44` hard-codes `responsible: '-'`
- **Severity:** P2
- **Evidence:** The column "Responsable" in the table is populated with literal `-` for every row. Permits actually have `assigned_to_profile_id` (used in `AssigneePicker`) that could populate it.
- **Fix:** Join profiles to show assignee name; or remove the column.

#### P2-15. `NetworkMapPage` fails silently if locations have no code column
- Covered by P2-13.

#### P2-16. Demo mode `DEMO_USER_ID` constant lives next to prod data
- **Severity:** P2
- **Evidence:** `src/lib/demo.ts:7` — `DEMO_USER_ID = '4bb…'`. Demo mock user object is constructed in `useAuth.ts:61-69` with `as any` cast. Works but the mock-user shape is duplicated.
- **Fix:** Move mock user factory into `lib/demo.ts`; import cleanly.

#### P2-17. `AppLayout` scroll/resize effects don't depend on location
- **Severity:** P2
- **Evidence:** `AppLayout.tsx:94-115` — two `useEffect`s with empty deps that register window listeners. The third (`:117-125`) depends on `location.pathname` but its body calls `handlePathChange()` only once (no listener, no cleanup needed). Fine, but comment `// Cerrar sidebar al navegar en móvil` is misleading — it runs on every pathname change, including on desktop where it's a no-op.
- **Fix:** Cosmetic — clarify the comment.

#### P2-18. Unused `ErrorBoundary` fallback signature
- **Severity:** P2
- **Evidence:** `ErrorBoundary.tsx:5` accepts `fallback?: (error, reset) => ReactNode` but no caller passes a fallback (grep). Only the default is used.
- **Fix:** Acceptable dead code; ignore.

#### P2-19. `LoginView` has hardcoded "+200 empresas confían" social proof
- **Severity:** P2
- **Evidence:** `LoginView.tsx:120` — literal `<strong>+200 empresas</strong> confían en EnRegla`. Fine for marketing but uncited and fragile ("Solicita acceso" link at :252 points to `href="#"`).
- **Fix:** Link to real page or remove.

#### P2-20. Many `console.error` + commented `console.log` left in prod code
- **Severity:** P2
- **Evidence:** `useAuth.ts` has 30+ commented-out `console.log` statements (debugging remnants). Production `console.error` calls remain.
- **Fix:** Remove commented logs; keep console.error (silenced by prod browsers or routed to Sentry).

#### P2-21. `useAuthStore.getState().setProfile(...)` instead of hook in `IncrementalWizard`
- **Severity:** P2
- **Evidence:** `IncrementalWizard.tsx:120` — `useAuthStore.getState().setProfile(updatedProfile)`. The component is already re-rendering; just consume the action from the hook.
- **Fix:** `const setProfile = useAuthStore(s => s.setProfile)` at the top.

---

### P3 — Nits

#### P3-1. `cn` utility duplicated across files
- **Severity:** P3
- Used consistently from `lib/utils`. No nit — confirmed single source.

#### P3-2. `utils.ts` import naming inconsistency
- **Severity:** P3
- Most code imports `@/lib/lucide-icons` (re-exports from `lucide-react`) to keep icon bundle splittable. OK.

#### P3-3. `DashboardSedeCard` uses `memo` — good. `LocationCardV2` also memoized. `MonthCard` too.
- **Severity:** P3
- Fine.

#### P3-4. `useMemo` on trivial ops
- **Severity:** P3
- **Evidence:** `PermitListView.tsx:66-67` — `useMemo(() => Array.from(new Set(rows.map(r => r.status))), [rows])` and same for types. OK; deps-array-ok.

#### P3-5. `useCallback` on modal drag handlers
- **Severity:** P3
- **Evidence:** `PermitDetailView.tsx:90-137` — `useCallback` wraps `handleDragOver/Leave/Drop/FileInput`. Fine, keeps `DocumentPanel` memo-stable.

#### P3-6. `CompanyTab` RUC validation is client-only
- **Severity:** P3
- `:86 /^\d{13}$/` — DB doesn't enforce checksum; acceptable.

#### P3-7. `useEffect` with empty cleanup in `PublicVerificationPage` fine
- **Severity:** P3

#### P3-8. Toast duration inconsistencies
- **Severity:** P3
- `CreateLocationModal` uses 3000/5000ms; global default is 4000; Main's `<Toaster>` style matches.

#### P3-9. Inconsistent key shapes in RQ
- **Severity:** P3
- `['company', companyId]`, `['permit_events', permitId]`, `['team_members', companyId]`, `['permit_requirements', businessType ?? 'all']`, `['legal_references', filterByBusinessType ?? 'all']`, `['permit_issuers']`. Mild inconsistency. Fine.

---

## Appendix A — Route/Feature Coverage Matrix

| Feature dir | Exported from App.tsx? | Nav entry? | Notes |
|---|---|---|---|
| `features/auth` | ✅ `/login`, `/auth/callback` | n/a | OK |
| `features/dashboard` | ✅ `/` | ✅ Dashboard | `DashboardWidget` orphan (P2-7) |
| `features/design-system` | ✅ `/design-system`, `/design-system-showcase` | ❌ none | Two dev routes shipped (P1-13) |
| `features/internal-crm` | ❌ no route | ❌ no nav | Whole feature orphan (P1-3) |
| `features/legal` | ✅ `/marco-legal`, `/marco-legal/matriz`, `/marco-legal/:permitType` | ✅ Marco Legal | Detail view uses static data, index uses DB → broken for new permit_types (P0-4) |
| `features/locations` | ✅ `/sedes`, `/sedes/:id` | ✅ Sedes | `RenewPermitModal` dead state (P0-3); `PublicLinkBanner` orphan |
| `features/network` | ✅ `/mapa-red` | ✅ Mapa Interactivo | `NetworkMapCanvas` pointless wrapper (P2-6) |
| `features/onboarding-incremental` | ✅ `/setup` | n/a | Brand says "PermitOps" (P0-8); double stepper (P2-5) |
| `features/permits` | ✅ `/permisos`, `/permisos/:id` | ✅ Permisos | "Nuevo Permiso" button dead (P0-5) |
| `features/public-links` | ✅ `/p/:token` | n/a | ShareLocationModal uses ad-hoc portal (P1-16) |
| `features/renewals` | ✅ `/renovaciones` | ✅ Renovaciones | MonthCard type narrow (P1-14) |
| `features/settings` | ✅ `/settings`, `/settings/notifications` | ✅ Configuración | NotificationsTab fake (P0-2), ProfileTab no save (P0-7), SecurityTab no action (P0-6), CompanyTab stale giros list (P1-9) |

---

## Appendix B — Files to delete (safe orphans)

After confirming via grep (file-path searches included), the following have **zero importers** and can be removed without runtime impact:

- `src/components/documents/DocumentList.tsx` (192 LOC)
- `src/components/ui/sidebar.tsx` (770 LOC)
- `src/components/ui/sheet.tsx` (140 LOC)
- `src/components/ui/form.tsx` (177 LOC)
- `src/components/ui/dropdown-menu.tsx` (200 LOC)
- `src/components/ui/table.tsx` (117 LOC) — if you keep raw `<table>` usage
- `src/components/ui/tooltip.tsx` (28 LOC)
- `src/components/ui/separator.tsx` (29 LOC)
- `src/components/ui/RiskBadge.tsx` (38 LOC) — plus the `index.ts` export
- `src/components/ui/StatusBadge.tsx` (44 LOC) — plus the `index.ts` export
- `src/hooks/use-mobile.tsx` (20 LOC)
- `src/hooks/useDocuments.ts` (42 LOC) — after migrating consumers
- `src/hooks/usePermit.ts` (64 LOC)
- `src/features/dashboard/DashboardWidget.tsx` (61 LOC)
- `src/features/locations/PublicLinkBanner.tsx` (66 LOC)
- `src/features/network/NetworkMapCanvas.tsx` (15 LOC) — after inlining
- `src/features/settings/NotificationsTab.tsx` (36 LOC) — after swapping in NotificationPreferences
- `src/features/internal-crm/` (full dir — 4 files, ~230 LOC + tests) — if CRM stays out of scope
- `src/hooks/useLeads.ts`, `src/hooks/usePartners.ts` — if CRM out of scope
- `src/types/crm.ts` — if CRM out of scope
- `src/types/database.types.ts` — no importers (duplicate of database.ts)
- `src/data/mock/` (1 file, 557 LOC)
- `src/data/classification-rules.ts` (222 LOC)
- `src/styles/.deprecated/` (whole folder)
- `src/lib/auth.ts`: functions `signUp`, `signIn`, `signOut`, `getSession`, `getCurrentUser`, `resetPassword`, `updatePassword`, `onAuthStateChange` — keep only `signInWithGoogle`
- `src/lib/api/auth.ts`: functions `register`, `getCurrentUser`, `getSession`
- `src/lib/api/permits.ts`: `updatePermitStatus`, `updatePermit`, `renewPermit`, `getPermit` (after P2-12), `getPermitHistory`
- `src/lib/api/locations.ts`: `updateLocationRisk`
- `src/lib/api/publicLinks.ts`: `getCompanyPublicLinks`, `deactivatePublicLink`
- `src/lib/api/onboarding.ts`: `completeOnboarding`, `updateProfile`, `checkHasLocations`

Estimated dead-code removal: **~3,300 LOC** (not counting dependencies removed in P2-3).

---

## Appendix C — Count summary

| Metric | Count |
|---|---|
| `as any` casts | 38 |
| `@ts-ignore` / `@ts-expect-error` | 0 |
| Files using manual `useEffect` + `useState` for data fetching | 8 |
| Files using `useQuery` | 6 (+AssigneePicker) |
| `queryClient.invalidateQueries` calls | 2 (one broken, P0-1) |
| `useCallback` usages | 4 (PermitDetailView) |
| Orphan TSX files | ~20 |
| Orphan exports in `lib/api/*` | ~15 |
| Total hooks (`src/hooks/*`) | 10 |
| Routes defined in `App.tsx` | 15 (2 dev-only, 1 catch-all) |
| UI-v2 components exported from `components/ui/index.ts` | 42 symbols |
| UI-v2 components with zero callers | ≥9 |

---

## Priority recommendations (not fixes, just order)

1. P0 cluster — all 8 items are user-facing bugs visible in a demo. Do these first.
2. P1-1 + P1-2 + P1-11 — migrate the hand-rolled hooks to TanStack Query in one sweep. Fixes dup-fetch, invalidation, race conditions, and mutation consistency together.
3. P1-4 + P1-9 + P1-5 — type and data-model cleanup. Prevents future drift.
4. P1-7 + P1-8 — auth consolidation. Makes the app easier to test and reason about.
5. Appendix B — mechanical deletions. Can be one PR.
