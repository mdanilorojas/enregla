# Pass 1 — Feature Completeness Audit

**Scope:** EnRegla compliance SaaS, branch `feat/dominio-v2`.
**Method:** Code-level trace of every feature path (UI → hook → API → DB → back to UI), cross-referenced against `docs/superpowers/specs/2026-05-10-dominio-enregla-v2-design.md` and `docs/superpowers/plans/2026-05-11-dominio-v2-implementation.md`.
**Not covered here:** auth/security, DB schema health, build/tests, docs drift, deps/perf — see the sibling `pass1-*.md` files.

---

## TL;DR — Top 5 critical gaps

| # | Gap | Severity | Evidence |
|---|-----|----------|----------|
| 1 | **"Nuevo Permiso" buttons are completely dead.** Two buttons on `/permisos` (header + empty state) have no `onClick`, no `Link`, no modal. Users cannot create a permit through the UI at all — only through the auto-trigger that fires on location creation. | P0 | `src/features/permits/PermitListView.tsx:85-87,111-115` |
| 2 | **Internal CRM has zero routes.** `LeadsTable`, `PartnerScorecard`, `useLeads`, `usePartners` all exist and compile, but nothing in `App.tsx` renders them. The DB tables `leads` and `partners` exist but are write-only from the staff perspective (no way to view them in-product). | P0 | `src/App.tsx:67-124` (no CRM route); `src/features/internal-crm/*` only self-imports |
| 3 | **`permits.issuer_id` is never populated for newly-created permits.** Auto-trigger `auto_create_location_permits` (migration 010) inserts `type`, `status`, `is_active` only — never `issuer_id`. Result: `PermitInfoCard` renders "Emisor: no definido" for every permit created after onboarding, even though `permit_requirements.issuer_id` is set. Back-fill only ran once against legacy rows in migration 20260511000003. | P0 | `supabase/migrations/010_permit_requirements.sql:72-85`; read path `src/features/permits/PermitInfoCard.tsx:20` |
| 4 | **`LegalPermitDetailView` still reads from the deleted-in-spec TS file.** The spec and plan Task 15 demand `src/data/legal-references.ts` be deleted. It still exists (455 lines) and is imported by `selectors.ts`, `PermitCard.tsx`, `LegalPermitDetailView.tsx`, `LegalIndexView.tsx`, `CategoryChips.tsx`, and `classification-rules.ts`. Worse: `LegalIndexView` fetches from DB via `useLegalReferences`, but clicking a card routes to `/marco-legal/:permitType` which reads *only* from the TS `LEGAL_REFERENCES` constant — only 6 of the 8 permits are there. LUAE and MSP cards in the index will always 404 the detail view. | P0 | `src/features/legal/selectors.ts:7-9,30-33`; `src/data/legal-references.ts` |
| 5 | **`LocationDetailView` is missing two entire tabs.** `LocationDocumentsTab` is a hard-coded `<EmptyState>` with no data wiring; `LocationHistoryTab` defaults `events = []` with no hook. These tabs are advertised in the tab bar and navigable, but deliver nothing. | P1 | `src/features/locations/LocationDocumentsTab.tsx:10-17`; `src/features/locations/LocationHistoryTab.tsx:15-24` |

---

## Per-feature audit

### 1. Onboarding (`/setup`) — **STATUS: GAPS (functional but brittle)**

**Happy path:** ProfileStep → CompanyStep → LocationsStep → navigate to `/`. Each step calls a dedicated API helper (`saveProfile`, `saveCompany`, `saveLocationWithPermits`) and refreshes the auth profile.

| Finding | Severity | Evidence |
|---|---|---|
| Business-type dropdown NOW uses all 12 giros (fix from spec landed). | ✅ | `src/features/onboarding-incremental/steps/CompanyStep.tsx:136-141` |
| Sidebar brand still says **"PermitOps"** — not EnRegla. Left over from pre-rename. | P2 | `src/features/onboarding-incremental/IncrementalWizard.tsx:160` |
| `LocationsStep` has no way to preview which permits will auto-generate per location — user has zero feedback about what the trigger will do until they reach dashboard. | P2 | `src/features/onboarding-incremental/steps/LocationsStep.tsx:78-80` (banner says "permisos se crean automáticamente" but doesn't list them). |
| `handleProfileNext/handleCompanyNext` show errors in a `<Banner>` but the buttons also don't announce success — the only feedback that the profile save worked is advancing to the next step. No toast, no visible confirmation. | P3 | `src/features/onboarding-incremental/IncrementalWizard.tsx:56-94` |
| `LocationsStep` has no confirm-before-leave guard. Refreshing the page mid-step wipes unsubmitted locations. | P3 | `src/features/onboarding-incremental/steps/LocationsStep.tsx` |
| `CompanyStep` RUC validation is shown inline (good), but `canProceed` only checks RUC+name — city and business_type default to Quito/restaurante silently. | P3 | `src/features/onboarding-incremental/steps/CompanyStep.tsx:47-49` |
| `setSavedProfile(profile?.full_name || googleName)` pre-fills from OAuth, but **no mobile/tablet layout adjustment** — sidebar is 280px fixed even on tablet. Flex container just wraps. | P2 | `src/features/onboarding-incremental/IncrementalWizard.tsx:152-171` |

**Tablet/mobile:** The wizard sidebar is not collapsible on `< lg`. The sidebar takes 280px of a 768px iPad screen, leaving 488px for the form — usable but cramped. No breakpoint switch.

---

### 2. Sedes (`/sedes`, `/sedes/:id`) — **STATUS: GAPS**

**Happy path:** `LocationsGrid` → `useLocations` → `getCompanyLocations` → Supabase. Create via `CreateLocationModal` → `createLocation` API. Detail view is `LocationDetailView` with 3 tabs.

| Finding | Severity | Evidence |
|---|---|---|
| **`LocationHistoryTab` is a stub.** Receives `events: LocationHistoryEvent[]` as prop but `LocationDetailView` never passes any events — it renders the default `[]` → always shows empty state. No hook, no fetch of `permit_events` aggregated by location. | P1 | `src/features/locations/LocationHistoryTab.tsx:15`, consumer `src/features/locations/LocationDetailView.tsx:146` |
| **`LocationDocumentsTab` is a stub.** Empty state only, with code-comment `// locationId reserved for future per-location document filter (currently a placeholder)`. Users expect to see all docs for the sede; they see nothing. | P1 | `src/features/locations/LocationDocumentsTab.tsx:8-18` |
| **`RenewPermitModal` is mounted but never opened.** `LocationDetailView:151-159` renders it, but `setRenewModalOpen(true)` is never invoked anywhere (neither is `setSelectedPermit`). Dead code path — "renovar" action doesn't exist in the sede UI. | P1 | `src/features/locations/LocationDetailView.tsx:25-27, 151-159` — setters unused |
| **`LocationPermitsTab` "Nuevo Permiso" link goes to `/permisos` (the list), not a creation flow.** At `/permisos` the button is also dead (see TL;DR #1). Circular dead-end. | P0 (rolled into gap #1) | `src/features/locations/LocationPermitsTab.tsx:29-35` |
| Location code display uses `SEDE-${uuid.slice(0,8)}` — not persisted. No way for a user to reference a friendly ID. Spec does not demand this but it's inconsistent: `DashboardMap` reads `loc.code` if exists (which is never set) and falls back to the uuid slice. | P3 | `src/features/locations/LocationCardV2.tsx:19-20`; `src/features/network/NetworkMapPage.tsx:33` |
| Empty state on grid is good; loading is SkeletonList; error shows retry button. ✅ | ✅ | `src/features/locations/LocationsGrid.tsx:47-77` |
| `CreateLocationModal` has validation, loading, toast, confirm-on-close. ✅ solid. | ✅ | `src/features/locations/CreateLocationModal.tsx:138-147` |
| `LocationDetailView` metric cards (Vigentes / Por Vencer / Vencidos) only count 3 statuses. `no_registrado` and `en_tramite` are invisible here. | P2 | `src/features/locations/LocationDetailView.tsx:73-75` |
| Mobile responsiveness: breadcrumb → header → 3-card metric grid uses `md:grid-cols-3`, collapses to single col on mobile. Tabs are inline (no segmented control on mobile like `PermitDetailTabs` does). Workable but not polished. | P3 | `src/features/locations/LocationDetailView.tsx:108,132` |

---

### 3. Permisos (`/permisos`, `/permisos/:id`) — **STATUS: GAPS (list severely broken, detail is GO)**

**List happy path:** `PermitListView` → `usePermits({companyId})` → `getCompanyPermits` → Supabase → table via `PermitTable`. Filters in `PermitTableFilters`. CSV export works.

**Detail happy path:** `PermitDetailView` → `usePermits` + `usePermit` is unused (another orphan) but the view hydrates from the list → drag-drop file → opens `PermitUploadForm` modal → updates permit status to 'vigente' + uploads doc. New `PermitInfoCard` + `AssigneePicker` + `PermitEventsTimeline` cards added per spec.

| Finding | Severity | Evidence |
|---|---|---|
| **"Nuevo Permiso" buttons are dead (header + empty state).** No `onClick`, no `Link`, no modal. Users cannot create a permit manually. | P0 | `src/features/permits/PermitListView.tsx:85-87, 111-115` |
| **`PermitTable` "Responsable" column always renders `-`.** The mapping in `PermitListView:44` hardcodes `responsible: '-'` despite `permits.assigned_to_profile_id` existing and being displayed correctly in detail. | P1 | `src/features/permits/PermitListView.tsx:43-45`; `PermitTable.tsx:66-74` |
| **Edit icon on the list table routes to `/permisos/{id}?edit=true`** but `PermitDetailView` ignores the `?edit=true` query param — there's no edit mode. | P2 | `src/features/permits/PermitTable.tsx:83-85`; `PermitDetailView.tsx` (no useSearchParams) |
| **`permit.issuer_id` read but never written for new permits** (see TL;DR #3). Legacy-backfilled permits show emitter correctly; post-v2 permits show "no definido". | P0 | `supabase/migrations/010_permit_requirements.sql:72-85` (trigger doesn't set `issuer_id`) |
| `PermitInfoCard` shows emisor + costo + multa + rol (spec-compliant). ✅ | ✅ | `src/features/permits/PermitInfoCard.tsx` |
| `AssigneePicker` implements role-mismatch warning (non-blocking). ✅ | ✅ | `src/features/permits/AssigneePicker.tsx:91-97` |
| `PermitEventsTimeline` reads from `permit_events` table (correctly populated by DB triggers per migration 20260511000005). ✅ | ✅ | `src/features/permits/PermitEventsTimeline.tsx` |
| `PermitUploadForm` validates file type, 10MB size, future-date rejection, calculates expiry from `calculateExpiryDate(permit.type)`. Has rollback logic if DB insert fails. ✅ solid. | ✅ | `src/features/permits/PermitUploadForm.tsx:12-14, 146-208` |
| **Two file-size ceilings.** `PermitDetailView` (drag-drop validation) uses 5MB (`MAX_FILE_SIZE = 5 * 1024 * 1024`). `PermitUploadForm` (modal) uses 10MB. A user dragging an 8MB PDF sees "Archivo muy grande" (5MB limit), but if they go into the modal via "Subir documento" button and pick the file there, 10MB is accepted. Inconsistent ceiling. | P2 | `src/features/permits/PermitDetailView.tsx:77`; `src/features/permits/PermitUploadForm.tsx:12` |
| Document delete uses native `confirm()` dialog. Non-branded, no toast preview. Acceptable. | P3 | `src/features/permits/PermitDetailView.tsx:568` |
| No progress indicator during upload — just a "Subiendo..." button label. For 10MB files on slow connections this is lacking. | P2 | `src/features/permits/PermitUploadForm.tsx:339-341` |
| `PermitDetailView` layout uses `md:grid-cols-2 lg:grid-cols-3`, 6 cards stack on tablets = good. ✅ | ✅ | `src/features/permits/PermitDetailView.tsx:278` |
| `usePermit.ts` (singular) is an **orphan hook** — implements `getPermit` + `getPermitHistory` but never used. Dead code. | P3 | `src/hooks/usePermit.ts` (only self-reference) |

---

### 4. Renovaciones (`/renovaciones`) — **STATUS: GO (with minor gaps)**

**Happy path:** `RenewalGridView` → `usePermits + useLocations` → groups by month → `MonthCard` accordion → click row → `/permisos/:id`.

| Finding | Severity | Evidence |
|---|---|---|
| No loading skeleton. Empty state works but loading shows nothing (blank → populate). | P3 | `src/features/renewals/RenewalGridView.tsx` — no `loading` branch |
| Year selector computes available years from existing `expiry_date`. If DB has no permits, shows current + next year. ✅ | ✅ | `src/features/renewals/RenewalGridView.tsx:18-27` |
| Status type on `MonthRenewal` only has `vigente | por_vencer | vencido` — missing `en_tramite` and `no_registrado`. Permits with those statuses but non-null `expiry_date` will render with a crash-prone index into the variant map. | P2 | `src/features/renewals/MonthCard.tsx:14`; default fallback `?? 'vigente'` at `RenewalGridView.tsx:47` hides the problem |
| No action on the row besides navigate to detail. Spec doesn't demand more — fine. | ✅ | `src/features/renewals/MonthCard.tsx:64-81` |
| Mobile: grid uses `md:grid-cols-2 lg:grid-cols-3`. ✅ | ✅ | `src/features/renewals/RenewalGridView.tsx:74` |

---

### 5. Marco Legal (`/marco-legal`, `/marco-legal/matriz`, `/marco-legal/:permitType`) — **STATUS: BROKEN (detail route incomplete, catalog drift)**

**Happy paths:**
- Index: `LegalIndexView` → `useCompany` → `useLegalReferences(businessType)` → DB `legal_references` table → adapter `toLegalReference` → PermitCard grid.
- Matrix: `LegalMatrixView` → `usePermitRequirements()` + `useIssuers()` → DB → HTML table.
- Detail: `LegalPermitDetailView` → `getPermitByType()` → **TS file** `src/data/legal-references.ts`.

| Finding | Severity | Evidence |
|---|---|---|
| **Permit detail page reads from the obsolete TS file.** Indexes advertise LUAE and MSP (permits 7 & 8 per spec), but the TS file only has 6 (ruc, patente_municipal, bomberos, arcsa, uso_suelo, rotulacion). Clicking LUAE/MSP → `PermitNotFound`. | P0 | `src/features/legal/LegalPermitDetailView.tsx:28`; `src/features/legal/selectors.ts:30-33`; `src/data/legal-references.ts` (grep: only 6 `permitType` keys) |
| **`toLegalReference` adapter strips critical data.** `consequences: []`, `requiredDocuments: []`, `typicalProcess: []` are always empty because DB tables `legal_consequences`, `legal_required_documents`, `legal_process_steps` were never populated from TS (plan Task 7 Step 7.2 explicitly punted on "mechanical copy"). Result: even the 6 legacy permits, if reached via the DB path, would show empty Legal / Proceso / Riesgos tabs. In practice they don't because `LegalPermitDetailView` bypasses the DB and reads TS directly. | P0 | `src/features/legal/LegalIndexView.tsx:27-50` (adapter); `supabase/migrations/20260511000006_legal_tables_seed.sql` (did it actually seed children? TBD — appears abbreviated) |
| **LegalIndexView adapter dumps portal as a fake source**: `sources: [{ name: portalName || 'Portal oficial', shortName: ..., type: 'normativa', ... }]` — the real sources (`ley_organica` articles, URLs) never surface. | P1 | `src/features/legal/LegalIndexView.tsx:33-43` |
| **`PermitType` in `src/types/index.ts:14-20` still has 6 permits.** No LUAE, no MSP — so `isKnownPermitType()` filter in `LegalIndexView.tsx:17-19` silently drops LUAE & MSP rows from the DB result. Even though DB has them, they never render in the index. | P0 | `src/types/index.ts:14-20`; `src/features/legal/LegalIndexView.tsx:17-19, 27-28` |
| `BUSINESS_TYPES` in `src/lib/domain/business-types.ts` has 12; `IndustryType` in `src/types/index.ts:1-10` has 9 different values (includes `dark_kitchen`, `belleza`, `bodega`, `hospitalidad` which don't exist in DB check constraint). Two catalogs disagree. | P1 | `src/types/index.ts:1-10`; `src/lib/domain/business-types.ts:1-14` |
| Matrix view works — fetches data, handles null sample, has legend (R/O/T). `visibleGiros` filters out `otro` = clean. ✅ | ✅ | `src/features/legal/LegalMatrixView.tsx` |
| Toggle "Ver todos los permisos" (plan Step 13.2) is present and wired. Default is `showAll = false`. ✅ | ✅ | `src/features/legal/LegalIndexView.tsx:64, 70, 124-138` |
| `LegalDisclaimer` component renders — user is warned data is reference. ✅ | ✅ | `src/features/legal/LegalDisclaimer.tsx` (exists) |
| Matrix has no filter/search/sort. OK for MVP since 8 rows × 11 cols. ✅ | ✅ | `src/features/legal/LegalMatrixView.tsx` |
| **`classification-rules.ts` imports `getLegalReference` from TS, but nothing imports `classification-rules.ts` itself.** Dead chain. | P3 | `src/data/classification-rules.ts:11` |

---

### 6. Mapa de Red (`/mapa-red`) — **STATUS: GO**

**Happy path:** `NetworkMapPage` → `useLocations + usePermits` → compute percentages → `NetworkMapCanvas` → `DashboardMap` (xyflow). Radial layout around company node.

| Finding | Severity | Evidence |
|---|---|---|
| No loading state — while `useLocations` fetches, map briefly renders with empty nodes, then populates. | P3 | `src/features/network/NetworkMapPage.tsx` |
| No empty state. Zero sedes = empty canvas + legend floating, still reads as a map. Acceptable. | P3 | `src/features/network/NetworkMapPage.tsx:42-55` |
| Company name pulled from `profile.company_name` which **doesn't exist on the profile type** — always falls back to `'EnRegla Corp'` hardcoded. Should use `useCompany()` like Dashboard does. | P2 | `src/features/network/NetworkMapPage.tsx:48` |
| `height: 'calc(100vh - 140px)'` is fixed; on mobile that leaves a usable viewport but the radial layout `radius = 300` with `minZoom = 0.4` ends up squished on narrow screens. Attribution is hidden. | P3 | `src/features/network/NetworkMapPage.tsx:45`; `src/features/dashboard/DashboardMap.tsx:31, 88-90` |
| `DashboardWidget` + `DashboardSedeCard` exist in `src/features/dashboard/` — designed to be embedded somewhere but not used anywhere. **Orphan siblings.** | P3 | `src/features/dashboard/DashboardWidget.tsx`, `DashboardSedeCard.tsx` — only self-reference |

---

### 7. Dashboard (`/`) — **STATUS: GO (spec-landed)**

**Happy path:** `DashboardView` → `useCompany` + `useLocations` + `usePermits` + `usePermitRequirements(company.business_type)` → computes real costs + fines via `reqByPermitType` lookup → `ComplianceWeatherCard` + `ComplianceInvoiceCard` + `LocationsGrid(standalone=false)`.

| Finding | Severity | Evidence |
|---|---|---|
| Spec fix 12 ("sin trámites pendientes" bug) is correct: `PENDING_STATUSES` includes `no_registrado`, `vencido`, `por_vencer`, `en_tramite`. ✅ | ✅ | `src/features/dashboard/DashboardView.tsx:17` |
| Spec fix 11 (brandName from `companies.name`) is correct: `const brandName = company?.name ?? 'tu negocio'`. ✅ | ✅ | `src/features/dashboard/DashboardView.tsx:147` |
| Cost/fine rolled up from `permit_requirements.cost_min/cost_max`. ✅ | ✅ | `src/features/dashboard/DashboardView.tsx:84-99` |
| **Per-line amount in the invoice is always `0`.** The per-line `amount: 0 as InvoiceAmount` is hardcoded (line 156, 159, 162, 165); only the total is a proper range. Spec §6.1 shows the intent was per-issuer grouping. The invoice shows "Vencidos: $0" which is misleading. | P2 | `src/features/dashboard/DashboardView.tsx:155-166` |
| `pendingWithoutCost` is computed but never displayed. Should surface "N permisos sin estimar" per the spec's risk #1. | P3 | `src/features/dashboard/DashboardView.tsx:88, 111` (computed, never consumed) |
| Empty state (no sedes) → EmptyState CTA → `/sedes`. ✅ | ✅ | `src/features/dashboard/DashboardView.tsx:125-145` |
| Loading state uses `SkeletonList count={1}` — pretty sparse for a dashboard. | P3 | `src/features/dashboard/DashboardView.tsx:116-122` |
| Uses `lg:grid-cols-[minmax(0,1fr)_440px]` → on `< lg` collapses to single col. Tablet story OK. ✅ | ✅ | `src/features/dashboard/DashboardView.tsx:174` |

---

### 8. Internal CRM (Leads + Partner Scorecard) — **STATUS: BROKEN (not wired to any route)**

**Happy path:** There is none.

| Finding | Severity | Evidence |
|---|---|---|
| **`LeadsTable` has no route.** Component reads `leads` from DB via `useLeads`, renders status filter, allows inline status change, but `App.tsx` never mounts it. No `/internal/leads`, `/crm`, `/admin` route exists. | P0 | `src/App.tsx:67-124`; `src/features/internal-crm/LeadsTable.tsx:36` |
| **`PartnerScorecard` has no route.** Same — the scorecard widget works in isolation (unit tested!), but no view embeds it. | P0 | `src/features/internal-crm/__tests__/PartnerScorecard.test.tsx` exists, no consumer |
| **`useLeads` + `usePartners` orphaned.** Both hooks work but have only one consumer (`LeadsTable`) and zero consumers respectively. | P0 | grep `useLeads|usePartners` — only self-refs |
| No public landing page exists in this repo. The CRM presumes `leads.source ∈ {'diagnostico','partners','home','sobre','otro'}` — these seem to expect a separate landing SPA that POSTs to the `leads` table via anon insert. No proof of such POST surface in this codebase. | P1 | `src/types/crm.ts:10`; no `LandingView`/`SignupForm`/`CaptureForm` anywhere |
| DB migrations `20260506000000_leads_table.sql` and `20260506000100_partners_crm.sql` create the tables — so the schema exists and is ready; it's purely a missing frontend surface. | ℹ | `supabase/migrations/` |

---

### 9. Public verification (`/p/:token`) — **STATUS: GO**

**Happy path:** `PublicVerificationPage` → `getPublicLinkData(token)` → DB join `public_links → locations → permits → documents` → signed URLs (5min TTL) + view-count RPC fire-and-forget → 4 grouped sections (vigentes / por vencer / vencidos / pendientes).

**Token lifecycle:** `ShareLocationModal` → on open, tries `getLocationPublicLink(locationId)` → if none, creates via `createPublicLink({ token: crypto.randomUUID() })`. One-to-one link per location. ✅

| Finding | Severity | Evidence |
|---|---|---|
| Loading state + error state + "Link No Válido" states all present. ✅ | ✅ | `src/features/public-links/PublicVerificationPage.tsx:86-117` |
| Signed URLs revocation-safe (300s TTL). ✅ | ✅ | `src/lib/api/publicLinks.ts:4, 178-189` |
| `ShareLocationModal` generates QR via `qrcode.react`, copies link, downloads PNG. Full feature parity with spec. ✅ | ✅ | `src/features/public-links/ShareLocationModal.tsx:107-124` |
| **`PublicLinkBanner` is an orphan component.** 65 lines, no consumer. Was replaced by the Share modal flow launched from `LocationDetailView`'s "Generar QR" button. Dead code. | P3 | `src/features/locations/PublicLinkBanner.tsx` (grep: only self-refs) |
| `getPublicUrl` uses `https://enregla.ec` in prod — hardcoded. Domain was recently changed to `.ec` (see commit `c493222`). Note: `MEMORY.md` says auth lives only at `app.enregla.se` — worth a double-check. If enregla.ec is the public surface, good. | ℹ | `src/lib/api/publicLinks.ts:89-95` |
| Public page has no ability to show **which company** it belongs to — only location name. If a user generates a QR for a sede called "Centro", inspector has no context. | P3 | `src/features/public-links/PublicVerificationPage.tsx:132-140` |
| Footer links to `https://enregla.ec` which is a plain href to the same domain — circular. Should be a marketing page. | P3 | `src/features/public-links/PublicVerificationPage.tsx:278-286` |
| `deactivatePublicLink` exists in the API but is never called from the UI. Owners can't revoke a link they shared. | P1 | `src/lib/api/publicLinks.ts:72-86` — no consumer |
| Mobile story: `PublicVerificationPage` uses `md:grid-cols-2` for permit cards, reduces to single col on phones. `Card` uses `p-[var(--ds-space-600)]` (48px) which is generous. ✅ | ✅ | `src/features/public-links/PublicVerificationPage.tsx:177, 200, 223, 246` |

---

## Cross-feature observations

### Loading consistency
- **Good:** Dashboard, LocationsGrid, LocationDetailView, PermitListView use `<SkeletonList>` or `<Skeleton>`. ErrorBoundary wraps the whole app.
- **Inconsistent:** `RenewalGridView` has no loading state. `PublicVerificationPage` uses a plain text "Verificando permiso...". `NetworkMapPage` has no loading. `PermitEventsTimeline` uses text "Cargando timeline...". `LegalIndexView` has no explicit loading UI — `results.length === 0` shows the empty-state regardless of whether data arrived.

### Error state consistency
- **Good:** `LocationsGrid` shows error with Retry button. `ShareLocationModal` uses `<Banner variant="error">` with Reintentar (reloads window — P2, crude). `IncrementalWizard` shows inline Banner. `PermitUploadForm` shows inline alert with rollback.
- **Missing:** `PermitListView`, `PermitDetailView`, `RenewalGridView`, `LegalIndexView`, `NetworkMapPage` — none show an error state at all. They'll render empty or broken if the Supabase call fails. `usePermits` stores an `error` but `PermitListView` never renders it.

### Destructive-action guards
- `CreateLocationModal` uses native `window.confirm('¿Descartar cambios?')`. P2 — not brand-coherent.
- `PermitDetailView` document delete uses `confirm('¿Eliminar este documento?')`. Same P2.
- `DocumentList` (orphan) has a richer confirm message. If wired in, this would be better.
- No confirm on `signOut()` in `AppLayout`. Minor — Google re-auth is fast.

### Toast usage
- `react-hot-toast` is wired in `main.tsx`. Used by: `CreateLocationModal` (success/error), `RenewPermitModal`, `PermitDetailView`, `CompanyTab`, `NotificationPreferences` (orphan).
- **Not used by:** `IncrementalWizard` (uses inline Banner), `PermitListView` (no create flow), `PublicVerificationPage` (public, makes sense), Setting tabs besides CompanyTab.

### Settings inconsistency
- `SettingsView` uses 4 tabs: Profile, Company, Notifications, Security.
- **`NotificationsTab` is a fake stub** — toggles don't save anything. `defaultChecked` only. Real persistence is in the orphan `NotificationPreferences` component (rich UI, wired to `notification_preferences` table via `useNotificationPreferences`).
- **`ProfileTab` is a fake stub** — "Guardar cambios" button has no `onClick`; "Cambiar foto" button has no handler.
- **`SecurityTab` is a fake stub** — "Cerrar todas las sesiones" button has no handler.
- **`CompanyTab` is functional** but its `BUSINESS_TYPES` constant is hardcoded to 4 giros — not the spec's 12. Changing business_type from 12 → 4 in this view silently corrupts data.

### Mobile/tablet coverage
Grid classes inventory: `md:grid-cols-2 lg:grid-cols-3` is common (dashboard sede cards, renewals, permit detail, location detail metrics, public verification permits). `sm:grid-cols-2` used less. Overall, responsiveness is "good enough" for 1024-1280px tablets but not actively designed for.
- **`AppLayout.tsx:147-151`** handles sidebar toggle at `lg` (1024px) — good for tablets in landscape.
- **`IncrementalWizard`** has a fixed 280px sidebar that does not collapse. Bad on portrait tablets.
- **`NetworkMapPage`** uses absolute-positioned MapLegend at `top/right: 24px` — overlaps content on small screens.
- **`PermitDetailView`** 3-col grid of cards → stacks to 1-col on mobile. Has `md:grid-cols-2 lg:grid-cols-3`. ✅
- **`PermitDetailTabs`** (legal) has a segmented-control for mobile, tabs for desktop. Explicit design. ✅ (unique in the codebase — no other tabs do this)

### Document upload consistency
Two implementations:
1. `PermitDetailView` — drag-drop, 5MB ceiling, accepts PDF/PNG/JPG.
2. `PermitUploadForm` — form+file input, 10MB ceiling, accepts PDF/PNG/JPG.

When drag-drop validates OK, it opens the form modal (which accepts larger files). When the user picks via the modal directly, 10MB allowed. **Inconsistent ceilings** is a UX bug.

Neither shows upload progress percentage — just a disabled button with "Subiendo..." label. On a 10MB PDF over Latin America-to-AWS-us-east-1 this can take many seconds with no feedback. P2.

Storage bucket is `permit-documents` (private since audit). Signed URLs are 300s TTL, consumed by Public verification, PermitDetailView (preview), DocumentList (orphan). Good pattern.

### Orphan components (dead code, imports exist but nothing uses them)

| Component / Hook | Path | Notes |
|---|---|---|
| `LeadsTable` | `src/features/internal-crm/LeadsTable.tsx` | No route |
| `PartnerScorecard` | `src/features/internal-crm/PartnerScorecard.tsx` | No route, but has a unit test |
| `useLeads` | `src/hooks/useLeads.ts` | Used only by `LeadsTable` |
| `usePartners` | `src/hooks/usePartners.ts` | Zero consumers |
| `useDocuments` | `src/hooks/useDocuments.ts` | Zero consumers (PermitDetailView does its own fetch) |
| `usePermit` | `src/hooks/usePermit.ts` | Zero consumers (list view reuses `usePermits`) |
| `DocumentList` | `src/components/documents/DocumentList.tsx` | Rich component — could replace the inline PermitDetailView panel |
| `PublicLinkBanner` | `src/features/locations/PublicLinkBanner.tsx` | Replaced by `ShareLocationModal` flow |
| `NotificationPreferences` | `src/features/settings/NotificationPreferences.tsx` | Replaced by fake `NotificationsTab` stub |
| `DashboardWidget` + `DashboardSedeCard` | `src/features/dashboard/` | Never consumed |

---

## What the v2 spec and plan promised but didn't ship

Referenced against `2026-05-10-dominio-enregla-v2-design.md` and `2026-05-11-dominio-v2-implementation.md`.

| Spec/Plan reference | Status | Notes |
|---|---|---|
| Task 1: `permit_issuers` schema + seed | ✅ shipped | Migration 20260511000000 exists |
| Task 2: business_types expansion to 12 | ✅ shipped | Migration 20260511000001 + onboarding uses `BUSINESS_TYPES` |
| Task 3: `permit_requirements` cost/fine/role/issuer columns | ✅ shipped | Migration 20260511000002 |
| Task 4: `permits.issuer_id` + `assigned_to_profile_id` | ⚠️ partial | Migration ran, but auto-create trigger (old migration 010) does not set `issuer_id` for new permits — this is **regression**: legacy permits (post-backfill) have it; new ones don't. |
| Task 5: `profiles.business_role` | ✅ shipped | Migration 20260511000004 |
| Task 6: `permit_events` + triggers | ✅ shipped | Migration 20260511000005 + PermitEventsTimeline UI |
| Task 7: legal tables seed from TS | ❌ not shipped | Migration 20260511000006_legal_tables_seed.sql exists but appears truncated. `LegalPermitDetailView` still reads TS file. Plan Step 7.2 explicitly punted: "by brevedad el plan no copia las ~800 líneas". Nobody came back to finish it. |
| Task 8: `permit_requirements` seed (matrix 10×8) | ✅ shipped | Migration 20260511000007 |
| Task 9: frontend catalog files | ✅ shipped | `src/lib/domain/{business-types,permit-roles,issuers,permit-requirements}.ts` all exist |
| Task 10: `useCompany`, `usePermitEvents`, `RoleBadge`, `CostRangeLabel` | ✅ shipped | All exist and wired |
| Task 11: Dashboard fix (bug + brandName + cost range) | ⚠️ partial | Main fixes shipped (no "sin pendientes" bug, brand from company, total is range). But per-line amounts are hardcoded `0` instead of per-issuer grouping — see Dashboard gap above. |
| Task 12: PermitInfoCard + AssigneePicker + PermitEventsTimeline | ✅ shipped | All wired into `PermitDetailView` |
| Task 13: Marco Legal from DB + filter toggle + matrix route | ⚠️ partial | Index view reads DB. Toggle works. Matrix route works. But detail view path (`/marco-legal/:permitType`) still reads TS file → LUAE/MSP are 404. `PermitType` union in `src/types/index.ts` still has 6 values. |
| Task 14: Onboarding dropdown 12 giros | ✅ shipped | CompanyStep uses `BUSINESS_TYPES` |
| Task 15: delete `src/data/legal-references.ts` | ❌ not shipped | File still exists (455 lines), 6 consumers |
| Task 16: final verification + PR | partial | On branch `feat/dominio-v2` — visible in `git log` but not merged |

**Out-of-spec drift:**
- `src/types/index.ts` was never regenerated. `IndustryType` (9 values, different from DB), `PermitType` (6 values, missing LUAE/MSP), `PermitStatus` (4 values, missing `en_tramite`), `LocationStage` (3 different values from DB's location.status). A domain-model inconsistency that radiates into every UI that imports from `@/types`.
- `CompanyTab.tsx` never updated — still 4 giros hardcoded. Editing an existing company through Settings demotes it.
- `AppLayout` has no link to `/marco-legal/matriz` — only available via the "Ver matriz completa" link on the index page. Users who land on matrix and navigate away can't return without knowing the URL.
- No ability to edit `profiles.business_role` from the UI. Default is `empleado` for everyone except the RL (set by trigger on first company). All other team members stuck as `empleado` forever — `AssigneePicker` role-mismatch warning will always fire for non-RL tasks.
- No UI to invite team members at all. `AssigneePicker` pulls from `profiles where company_id = X`, but the only way to get profiles into a company is via the OAuth auto-create trigger + manually assigning company_id in DB. No "Invite" button anywhere.

---

## Raw file inventory

**Features present and routed:** Auth, Onboarding, Dashboard, Sedes list+detail, Permisos list+detail, Renovaciones, Marco Legal (index + matrix + detail), Mapa de red, Design system (2 routes — should not be public per spec §2), Settings, Public verification.

**Features present but unrouted:** Internal CRM (leads + partners), Legacy DashboardWidget.

**Key file paths:**
- Routes: `C:/dev/enregla/src/App.tsx`
- Nav menu: `C:/dev/enregla/src/components/layout/AppLayout.tsx:20-56`
- Auto-trigger (needs `issuer_id` fix): `C:/dev/enregla/supabase/migrations/010_permit_requirements.sql:49-95`
- Legacy legal data: `C:/dev/enregla/src/data/legal-references.ts`
- Type drift source of truth: `C:/dev/enregla/src/types/index.ts`

---

**End of pass 1 — features.**
