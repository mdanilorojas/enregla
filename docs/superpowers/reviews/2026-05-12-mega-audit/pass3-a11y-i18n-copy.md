# Pass 3 — Accessibility, i18n & Copy Audit

**Date**: 2026-05-12
**Scope**: `C:\dev\enregla\src\` (all UI)
**Auditor**: Pass-3 agent (a11y/i18n/copy)
**Status**: Report only, no fixes applied.

---

## TL;DR — Top 5 issues

1. **P0 — Risk badges fail WCAG AA contrast.** `risk-medio` renders `#FF991F` (yellow-600) on `#fff8e1` (yellow-50) in ~10px bold text — approx. 2.3:1 contrast ratio (AA needs 4.5:1). `risk-alto` / `status-por-vencer` use `--ds-orange-700` which is actually `#f44336` (a red), not orange — palette is semantically wrong AND those badges are also borderline on `#fff4f0`. This affects the core compliance risk signal across the entire app (`Badge`, `StatusBadge`, dashboard, permits table, legal matrix).
2. **P0 — `ComplianceWeatherCard` ignores `prefers-reduced-motion`.** The hero card runs a canvas particle animation (`sunny`), a warn mist animation (`warn`), and a lightning strike loop every 3–9s (`err`). Plus 15+ CSS `@keyframes` for cloud drift, shield wobble, storm roll, spark flicker, mist move, sun breathe — all `infinite`, none gated. Users with vestibular disorders or motion sensitivity get the full storm regardless of their OS setting. This was already flagged in `pass1-design-system.md` and remains unaddressed.
3. **P1 — Brand name drift: "PermitOps" leaks into onboarding.** The app is called "EnRegla" everywhere except `ProfileStep.tsx:24` ("Bienvenido a PermitOps") and `IncrementalWizard.tsx:160` ("PermitOps"). The onboarding wizard is the **first** screen a new user sees after signup — they meet the wrong brand.
4. **P1 — `date-fns format()` called without `es` locale in three public-facing files.** `src/lib/dates.ts` correctly imports and passes `es`, but `PermitCard.tsx:127,140`, `PublicVerificationPage.tsx:274`, and `PermitUploadForm.tsx:167,168,294,321` call `format()` directly. Any token that resolves to month names (e.g. `"dd MMM yyyy HH:mm"` in `PublicVerificationPage`) renders "May" instead of "may.", "Dec" instead of "dic." — in a public share page shown to auditors.
5. **P1 — Mixed Spanish dialect (tuteo vs voseo).** 95% of the app uses tuteo ("tu empresa", "¿Olvidaste tu contraseña?", "Configura tu empresa"), but `LegalIndexView.tsx:213` uses voseo ("Probá con otras palabras o ajustá tu búsqueda") and `AssigneePicker.tsx:95` mixes ("Podés continuar, pero verificá"). Target audience is Ecuador (per `toLocaleDateString('es-EC')` calls + `demo@enregla.ec` domain) — Ecuadorian Spanish is predominantly tuteo/usted, not voseo. Argentinian voseo reads as foreign.

---

## Findings

### P0 — User cannot use with keyboard or SR

#### A11Y-1. Clickable `<div>` backdrop with no keyboard dismiss
- **Severity**: P0
- **Evidence**: `src/components/layout/AppLayout.tsx:139-143`
  ```tsx
  <div
    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden transition-all duration-300"
    onClick={() => setSidebarOpen(false)}
    aria-hidden="true"
  />
  ```
- **Impact**: Mobile sidebar backdrop. Keyboard-only users have no way to dismiss with Esc (no keydown handler). Since `aria-hidden="true"` and no role, SR users can't activate it either. The sidebar *does* have a close button so this is a degradation not a blocker — hence P0 for the pattern but mitigated. Still: no Esc handler anywhere in the mobile sidebar flow.
- **Fix location**: AppLayout mobile sidebar needs keyboard dismiss.

#### A11Y-2. `<th>` sort headers with onClick but no button/keyboard semantics
- **Severity**: P0 (keyboard users can't sort the permit table)
- **Evidence**: `src/features/permits/PermitTable.tsx:111-121`
  ```tsx
  <th
    key={header.id}
    onClick={header.column.getToggleSortingHandler()}
    className="... cursor-pointer ..."
  >
  ```
  No `role="button"`, no `tabIndex`, no keyboard handler, no `aria-sort`.
- **Impact**: Permit table sorting (one of the core data interactions) is mouse-only. Keyboard users cannot change sort order. SR users get no hint that headers are interactive.
- **Fix location**: Wrap the sort-toggle surface in a `<button>` inside `<th>`, add `aria-sort="ascending|descending|none"`.

#### A11Y-3. `risk-medio` badge fails WCAG AA contrast
- **Severity**: P0
- **Evidence**: `src/components/ui/badge.tsx:20`
  ```tsx
  "risk-medio": "bg-[var(--ds-yellow-50)] text-[var(--ds-yellow-600)]",
  ```
  Tokens (`src/styles/atlassian-tokens.css:67,73`): `--ds-yellow-50: #fff8e1`, `--ds-yellow-600: #FF991F`. Computed contrast ≈ **2.3 : 1**. Badge text uses `text-[var(--ds-font-size-050)]` (≈10-12px), bold — does not meet large-text exception. AA requires **4.5:1**.
- **Impact**: Medium-risk tag is used in Legal Matrix, dashboard risk summary, permits list. Low-vision users and anyone on a glossy laptop in daylight cannot read it. Critical for a compliance product whose entire value prop is "you can see your risk at a glance".
- **Fix location**: Same file, plus `--ds-yellow-600` token. Options: darken text to `--ds-yellow-900` (#ff9b00 — still fails, it's also orange) / introduce a true darker yellow (#7a5100-ish) for text; or change to dark-text-on-yellow pattern (`text-[var(--ds-text)]`).

#### A11Y-4. `risk-alto` / `status-por-vencer` palette bug + contrast
- **Severity**: P0
- **Evidence**: `src/styles/atlassian-tokens.css:25-34` — the orange scale breaks at 700/800/900:
  ```css
  --ds-orange-500: #ff7043;
  --ds-orange-600: #ff5722;
  --ds-orange-700: #f44336;  /* this is RED, not orange */
  --ds-orange-800: #e53935;  /* also red */
  --ds-orange-900: #d32f2f;  /* also red */
  ```
  Then `src/components/ui/badge.tsx:19,24`:
  ```tsx
  "risk-alto": "bg-[var(--ds-orange-50)] text-[var(--ds-orange-700)]",
  "status-por-vencer": "bg-[var(--ds-orange-50)] text-[var(--ds-orange-700)]",
  ```
  Contrast of `#f44336` on `#fff4f0` ≈ 3.8:1 — still fails AA for normal/small text.
- **Impact**: (1) Users can't distinguish "alto" (orange) from "crítico" (red) because both are actually red. Risk hierarchy collapses. (2) Contrast insufficient.
- **Fix location**: `atlassian-tokens.css` — fix orange-700/800/900 to actual orange shades, then re-verify contrast.

---

### P1 — Serious but not complete blockers

#### A11Y-5. `ComplianceWeatherCard` not gated by `prefers-reduced-motion`
- **Severity**: P1 (P0 for users with vestibular disorders)
- **Evidence**: `src/components/ui/ComplianceWeatherCard.tsx`
  - Lines 31-78: `useEffect` runs `requestAnimationFrame` loop for sunny particles.
  - Lines 81-124: same for warn mist.
  - Lines 126-148: `strike()` recursive `setTimeout` 3-9s fires `.animate(...)` on flash overlay + lightning bolt refs.
  - Lines 437-583 of the embedded CSS: `hcSunBreathe`, `hcSunCorePulse`, `hcCloudDrift`, `hcMistMove`, `hcStormRoll`, `hcShieldBreathe`, `hcShieldWobble`, `hcCrackGlow`, `hcBreakLeft`, `hcBreakRight`, `hcSparkFlicker`, `hcPulse` — all `infinite`, **zero** `@media (prefers-reduced-motion: reduce)` guard.
  - Global `index.css:81-140` — `animate-pulse-risk`, `animate-fade-in`, `animate-gauge-fill`, `animate-count-pulse`, `bg-shimmer`, `glow-emerald`, `glow-red`, `animate-blob` are all unguarded. Only `.animate-slide-up` and `.animate-fadeIn` are guarded.
- **Impact**: Motion-sensitive users see a permanent storm/particle animation on the main dashboard — the first screen they reach after login. The lightning strike in `err` state is a flash animation (opacity 0 → 1 → 0 in 700ms) which can trigger photosensitive users.
- **Fix location**: Guard all three `useEffect` hooks with `window.matchMedia('(prefers-reduced-motion: reduce)').matches`; wrap every `@keyframes` consumer in `index.css` with `@media (prefers-reduced-motion: no-preference)`.

#### A11Y-6. Icon-only pagination buttons without `aria-label`
- **Severity**: P1
- **Evidence**: `src/features/permits/PermitTable.tsx:155-166`
  ```tsx
  <Button ... onClick={() => table.previousPage()}>
    <ChevronLeft className="w-4 h-4" />
  </Button>
  <Button ... onClick={() => table.nextPage()}>
    <ChevronRight className="w-4 h-4" />
  </Button>
  ```
  No `aria-label`, no visible text. SR announces "button" with no content.
- **Impact**: SR users navigating the permits table lose pagination. Same pattern likely in any table. Pagination is a primary interaction for list views.
- **Fix location**: Add `aria-label="Página anterior"` / `"Página siguiente"`.

#### A11Y-7. Color-swatch copy buttons with no accessible name
- **Severity**: P1 (affects internal design-system route `/design-system`, not end-user critical)
- **Evidence**: `src/features/design-system/DesignSystemView.tsx:117-130, 145-156, 171-182`. All three color grids use `<button onClick={() => onCopy(color.hex)}>` with only a Copy/Check icon inside and no `aria-label`. On hover the icon appears, but nothing for SR.
- **Impact**: Internal tool, lower impact. Still: SR users can't identify which swatch they're about to copy.
- **Fix location**: `aria-label={`Copiar ${color.name} (${color.hex})`}`.

#### A11Y-8. Form labels without `htmlFor` → input without `id`
- **Severity**: P1
- **Evidence**:
  - `src/features/onboarding-incremental/steps/LocationsStep.tsx:109-119` — `<label>Nombre del local</label><input ... />` (no id, no htmlFor). Repeats at 123, 137.
  - `src/features/onboarding-incremental/steps/CompanyStep.tsx:65, 80, 109, 127` — same pattern.
  - `src/features/onboarding-incremental/steps/ProfileStep.tsx:32` — same.
  - `src/features/settings/CompanyTab.tsx:169, 181, 197, 218` — same.
  - `src/features/settings/ProfileTab.tsx:21, 26` — same.
  - `src/features/permits/PermitUploadForm.tsx:216, 283` — same.
- **Impact**: SR users don't hear "Nombre del local, text field, required" — they hear only "text field". Also breaks click-label-to-focus-input. Onboarding (3-step wizard) and Settings are primarily data-entry screens — this is a pervasive gap.
- **Fix location**: Add `id` to each input and `htmlFor` matching on label. (Some forms do it right: `LoginView.tsx:170/174`, `RenewPermitModal.tsx:67/71`, `CreateLocationModal.tsx:162/166`.)

#### COPY-1. "PermitOps" in onboarding — wrong brand name
- **Severity**: P1 (first-impression brand integrity)
- **Evidence**:
  - `src/features/onboarding-incremental/steps/ProfileStep.tsx:24` — `Bienvenido a PermitOps`
  - `src/features/onboarding-incremental/IncrementalWizard.tsx:157-161` — logo mark `PM` + label `PermitOps`
- **Impact**: New users' *first* screen says they signed up for a product called "PermitOps" while the URL, login page, sidebar, and emails say "EnRegla". Brand mismatch. Also a legacy code smell the audit has flagged before.
- **Fix location**: Replace both strings + the "PM" initials mark.

#### COPY-2. English leakage — `Loading...` in design system showcase
- **Severity**: P2 (dev-only route, but exposes slip in naming habits)
- **Evidence**: `src/features/design-system/DesignSystemShowcase.tsx:267` — `{buttonLoading ? 'Loading...' : 'Click to Load'}`. Also 228 "Default", 229 "Destructive", 245 "Default", 246 "Large", 258 "Normal", 259 "Disabled" — entirely English labels inside a component marketed as "Sistema de Diseño Enregla".
- **Impact**: Not user-facing (internal route), but `DesignSystemView.tsx` *is* routed and sits alongside the in-app showcase. Inconsistent with "Loading..." elsewhere consistently rendered as "Cargando...".
- **Fix location**: same file.

#### COPY-3. Voseo leakage in Spanish copy (Ecuador = tuteo)
- **Severity**: P1
- **Evidence**:
  - `src/features/legal/LegalIndexView.tsx:213` — `Probá con otras palabras o ajustá tu búsqueda.`
  - `src/features/permits/AssigneePicker.tsx:95` — `Podés continuar, pero verificá el flujo.`
  Everywhere else: tuteo ("Configura tu empresa", "¿Olvidaste tu contraseña?", "Crea tu primera sede", "Agrega todos los locales", "Comencemos"...).
- **Impact**: Target audience is Ecuador (per `demo@enregla.ec`, `toLocaleDateString('es-EC')` across 7 files, "Quito" placeholder in `CompanyTab`/`LegalMatrixView`). Ecuadorian Spanish is tuteo-or-usted. Voseo ("Probá", "Podés") reads as Argentinian/Uruguayan and is jarring for Ecuadorian users. Minor but breaks the "Confiable" brand personality.
- **Fix location**: `Probá` → `Prueba`, `ajustá` → `ajusta`, `Podés` → `Puedes`, `verificá` → `verifica`.

#### I18N-1. `date-fns format()` called without `es` locale in public pages
- **Severity**: P1
- **Evidence**:
  - `src/features/public-links/PublicVerificationPage.tsx:274` — `format(new Date(), "dd MMM yyyy HH:mm")` — renders "12 May 2026 14:30" (English "May") on the public verification page shown to auditors/regulators.
  - `src/features/public-links/PermitCard.tsx:127,140` — `format(parseISO(issueDate), 'dd/MM/yyyy')` — numeric only, so fine, but the import of `format` without locale is a footgun for future month-name use.
  - `src/features/permits/PermitUploadForm.tsx:294,321` — `format(issueDate, 'dd/MM/yyyy')`, `format(expiryDate, 'dd/MM/yyyy')` — numeric, safe but same footgun.
- **Impact**: Public verification page (the URL shared with landlords/auditors) shows English dates. For a locally-branded compliance product: embarrassing.
- **Fix location**: Pass `{ locale: es }` (import from `date-fns/locale`) — pattern already established in `src/lib/dates.ts`.

#### I18N-2. `toLocaleString("default", ...)` for month name in Calendar
- **Severity**: P1
- **Evidence**: `src/components/ui/calendar.tsx:38` — `date.toLocaleString("default", { month: "short" })`. The `"default"` locale means *"whatever the OS is set to"*. A user on an English Windows OS sees the date picker month as "May", an es-EC user on Ecuadorian Windows sees "may.".
- **Impact**: Date picker month labels are OS-dependent. Inconsistent with the rest of the app which is hard-coded `'es-EC'` / `es` locale. Used in `PermitUploadForm` for emission date selection.
- **Fix location**: `date.toLocaleString("es-EC", { month: "short" })` or use `date-fns` with `es`.

#### I18N-3. `ComplianceInvoiceCard` formats numbers with `en-US`
- **Severity**: P2
- **Evidence**: `src/components/ui/ComplianceInvoiceCard.tsx:22`
  ```ts
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 }).replace(/,/g, ' ');
  ```
- **Impact**: Using `en-US` and then replacing commas with spaces is a workaround for wanting thousand-separator = space. Cleaner: `n.toLocaleString('es-EC', ...)` which uses `.` as thousand separator in es-EC. The current code also produces ambiguous/"European-style" numbers that don't match es-EC convention.
- **Fix location**: same file.

#### I18N-4. Raw Supabase/API error messages surfaced to users
- **Severity**: P1
- **Evidence**:
  - `src/hooks/usePermits.ts:40,59,88` — `setError(err.message || 'Failed to fetch permits')` — fallback in English, primary is untranslated Postgres/Supabase text.
  - `src/hooks/usePermit.ts:34,59`, `usePartners.ts:22,41,62,85,101`, `useLocations.ts:33,58,88,101`, `useLeads.ts:22,41,64,87` — same "Failed to X" English fallback.
  - `src/features/locations/CreateLocationModal.tsx:104-107` — `toast.error(`Error al crear sede: ${errorMessage}`)` where `errorMessage` is raw Supabase PG error (e.g. `"duplicate key value violates unique constraint"`, `"new row violates row-level security policy"`).
  - `src/features/settings/CompanyTab.tsx:60,112` — `setError(fetchError.message)` — direct passthrough.
  - `src/features/auth/LoginView.tsx:47,60` — `setError(err instanceof Error ? err.message : 'Error al iniciar sesión')` — Supabase auth errors ("Invalid login credentials", "Email not confirmed") shown raw in English.
- **Impact**: Users see "duplicate key value violates unique constraint \"companies_ruc_unique\"" or "Invalid login credentials" instead of "Este RUC ya está registrado" / "Correo o contraseña incorrectos". Breaks the "Confiable, Protector" brand. The AuthCallback path is especially visible.
- **Fix location**: Error translation layer between Supabase and UI. For this pass, `useLocations/usePermits/usePartners/useLeads/usePermit` hooks + auth + onboarding wizard error paths are the pragmatic shortlist.

#### I18N-5. English fallback strings `'Failed to fetch X'` in hooks
- **Severity**: P2
- **Evidence**: Same hooks as I18N-4 — fallback strings are English: `'Failed to fetch permits'`, `'Failed to create partner'`, `'Failed to update lead'`, etc. Total ~13 occurrences across 5 hooks.
- **Impact**: When Supabase returns a non-Error object (shouldn't happen often), the user sees English.
- **Fix location**: Replace with Spanish fallbacks.

---

### P2 — Polish / quality

#### A11Y-9. Headings-out-of-order in DesignSystem route
- **Severity**: P2
- **Evidence**: `src/features/design-system/DesignSystemView.tsx` — `<h1>Sistema de Diseño</h1>` then jumps directly to `<h3>` for every section (lines 110, 141, 167, 199, 240, 262, 292, 400, 471, 485, 499, 546, 593, 650, 668, 706). No `<h2>` layer in between. Inside Cards, `<h4>` nests under these `<h3>`s — legal per HTML but weird.
- **Impact**: SR users on this page hear a broken heading outline. Internal-only route.
- **Fix location**: same file.

#### A11Y-10. Onboarding "Next" button hidden visually but still tabbable
- **Severity**: P2
- **Evidence**: `src/features/onboarding-incremental/steps/ProfileStep.tsx:47-53`
  ```tsx
  <Button type="submit" disabled={!canProceed || loading} className="hidden">
    Siguiente
  </Button>
  ```
  `className="hidden"` removes it from both layout and focus flow — BUT it's still in the DOM and form submission semantics rely on it. The parent `IncrementalWizard` has its own Next/Back buttons at 225-247, so this hidden submit *is* the enter-key submit handler. Works but confusing pattern; SR users pressing Tab just bypass it.
- **Impact**: Low — functional but non-obvious.
- **Fix location**: Either delete (since the wizard already has nav buttons) or restructure submit handling.

#### A11Y-11. Focus ring removed on MainContent wrapper
- **Severity**: P2
- **Evidence**: `src/components/layout/AppLayout.tsx:263-265`
  ```tsx
  className="... focus:outline-none"
  tabIndex={-1}
  ```
  This is the "skip to main content" target — intentional (it's programmatic focus only, not keyboard-tabbable). Paired with the skip link at 132. Acceptable pattern, just worth noting.
- **Impact**: None, this is actually correct.
- **Fix location**: No action.

#### A11Y-12. `<span className="sr-only">Close</span>` in Sheet — English
- **Severity**: P2
- **Evidence**: `src/components/ui/sheet.tsx:70` — `<span className="sr-only">Close</span>`. Dialog has "Cerrar" (`dialog.tsx:47`), Sheet has "Close". Sidebar Sheet uses "Toggle Sidebar" (English) at `sidebar.tsx:290, 309`.
- **Impact**: SR users hear English strings in Sheet and Sidebar toggles.
- **Fix location**: Translate to "Cerrar" / "Alternar barra lateral".

#### COPY-4. "Filtrar por Giro (Quito)" vs "Ver todos" English chip values
- **Severity**: P2
- **Evidence**: Minor inconsistency in chip labeling — not a blocker. (Verified `CategoryChips.tsx` labels come from `CATEGORY_META` which should be reviewed separately.)
- **Impact**: Low.
- **Fix location**: `src/data/legal-references.ts`.

#### COPY-5. `Sistema de Diseño Enregla` vs `EnRegla`
- **Severity**: P2
- **Evidence**:
  - `src/features/design-system/DesignSystemShowcase.tsx:20` — `Sistema de Diseño Enregla` (no capital R)
  - Everywhere else — `EnRegla` (camelcase, capital R)
- **Impact**: Typographic inconsistency. Brand guideline per atlassian-tokens comment at line 2 is "EnRegla".
- **Fix location**: `DesignSystemShowcase.tsx:20`.

#### I18N-6. `new Date(...).toLocaleDateString('es-EC')` — correct but brittle
- **Severity**: P2 (informational)
- **Evidence**: 7 files use `toLocaleDateString('es-EC', ...)` directly instead of going through `src/lib/dates.ts` (which exists and does it right). Files: `LeadsTable.tsx:106`, `RenewPermitModal.tsx:84`, `LocationHistoryTab.tsx:33`, `LocationPermitsTab.tsx:67`, `MonthCard.tsx:77`, `PermitTimeline.tsx:42`, `PermitTable.tsx:62`, `exportPermitsCSV.ts:19`.
- **Impact**: Works today. When the app adds a second locale (or switches to `date-fns` across the board), each call site needs a separate edit. Bypasses the `formatDate`/`formatDateShort` helpers.
- **Fix location**: Consolidate through `lib/dates.ts`. Not urgent.

#### I18N-7. Loading messages: "Loading..." appears in a dev showcase; rest localized
- **Severity**: P2
- **Evidence**: One occurrence `DesignSystemShowcase.tsx:267`. All other loading states ("Cargando...", "Cargando documento...", "Cargando empresa...", "Cargando timeline...", "Cargando permisos", "Cargando datos de verificación", "Eliminando...", "Renovando...", "Generando link...") are correctly in Spanish.
- **Impact**: Single occurrence. (Duplicate of COPY-2 but file under i18n lens.)
- **Fix location**: same as COPY-2.

#### COPY-6. Empty-state / error-state language spot-check
- **Severity**: P2 — mostly clean
- **Evidence**: Checked `EmptyState` usages. All Spanish: "No hay sedes registradas", "Sin renovaciones en {year}", "No se pudo generar el link", "Sin historial", "No hay permisos registrados", "Permiso vencido", "Próximo a vencer", "Sede no encontrada". Correct.
- **Impact**: None — positive finding.
- **Fix location**: n/a.

---

### P3 — Nitpicks / defensive

#### A11Y-13. Truncated text without `title` attribute
- **Severity**: P3
- **Evidence**: Files using `class="truncate"` WITHOUT `title`:
  - `src/components/layout/AppLayout.tsx:210-211` — user name + role in sidebar footer.
  - `src/features/dashboard/DashboardSedeCard.tsx:42` — sede label.
  - `src/features/dashboard/nodes/SedeNode.tsx:50` — sede label in network map.
  - `src/features/locations/LocationCardV2.tsx:69` — location name.
  - `src/features/legal/PermitCard.tsx:51, 54` — permit name/issuer.
  - `src/components/documents/DocumentList.tsx:125` — document file name.
  - Also `DesignSystemShowcase.tsx:479,484,525,530`.
  Files that DO it right: `PermitDetailView.tsx:545`, `PermitUploadForm.tsx:240` (both add `title={file.name}`).
- **Impact**: Users with long location names or document titles can't see the full string on hover. Minor UX degradation; for SR users the full text is typically in the DOM so this is a pointing-device-only concern.
- **Fix location**: Add `title={fullString}` on each truncated element.

#### A11Y-14. Image `alt` text usage
- **Severity**: P3 — mostly OK
- **Evidence**: Only 3 `<img>` tags in the src:
  - `avatar.tsx:58` — `alt={name || 'Avatar'}` — fallback is English but OK.
  - `PermitUploadForm.tsx:225` — `alt={file.name}` — OK.
  - `PermitDetailView.tsx:529` — `alt={doc.file_name}` — OK.
  No `alt=""` decorative-only images found. The Google logo SVG in LoginView uses `aria-hidden="true"` — correct.
- **Impact**: Low. "Avatar" could be "Foto de perfil".
- **Fix location**: `avatar.tsx`.

#### A11Y-15. `<iframe>` without `title` for document previews
- **Severity**: P3
- **Evidence**:
  - `PermitUploadForm.tsx:231` — has `title={file.name}`. OK.
  - `PermitDetailView.tsx:535` — has `title={doc.file_name}`. OK.
- **Impact**: None — positive finding.

#### A11Y-16. Modal backdrop click-to-close on non-Radix dialog
- **Severity**: P3
- **Evidence**: `src/features/public-links/ShareLocationModal.tsx:128-135` — custom modal, backdrop does NOT close on click (no onClick on the outer backdrop div). Esc key not handled either (no keydown listener). Only the X and "Volver a Sedes" buttons close it. The modal has `role="dialog"` + `aria-modal="true"` + `aria-labelledby` — good — but no focus trap and no Esc. Radix's `<Dialog>` handles all this; reimplementing from scratch loses those guarantees.
- **Impact**: Keyboard users cannot close with Esc. Focus can tab out of the modal into the page behind it.
- **Fix location**: Migrate to `<Dialog>` from `@/components/ui/dialog` (same Radix primitive already used elsewhere).

---

## Coverage summary

| Audit item | Status |
|---|---|
| 1. Keyboard accessibility (divs w/ onClick) | 2 real issues (A11Y-1, A11Y-2). Rest are `<button>` elements. |
| 2. ARIA on modals / icon buttons / form inputs | A11Y-6, A11Y-8 identified. Radix Dialog handles modal semantics; ShareLocationModal custom-built needs hardening (A11Y-16). |
| 3. Semantics (heading order) | A11Y-9 in DesignSystemView. Real app screens are OK. |
| 4. Color contrast (badges) | A11Y-3, A11Y-4 — critical. |
| 5. Reduced motion | A11Y-5 — critical. Only `.animate-slide-up` and `.animate-fadeIn` gated; ComplianceWeatherCard and 6+ other animations unguarded. |
| 6. SR content on icon-only buttons | A11Y-6, A11Y-7, A11Y-12 partial. Most app icon-buttons do have `aria-label`; pagination and design-system are the gaps. |
| 7. Copy consistency (Spanish) | COPY-1 (PermitOps), COPY-2 (Loading...), COPY-3 (voseo), COPY-5 (Enregla vs EnRegla). |
| 8. Date/number i18n | I18N-1 (date-fns no locale), I18N-2 (calendar OS-locale), I18N-3 (en-US numbers). |
| 9. Form error messages (raw Supabase) | I18N-4, I18N-5. Pervasive in hooks layer. |
| 10. Empty/loading states language | Almost all Spanish (COPY-6 positive). Single `Loading...` in design-system showcase (COPY-2). |
| 11. Alt text on images | OK (A11Y-14). |
| 12. Title on truncated content | A11Y-13 — inconsistent. |

## Severity distribution

- **P0 (blocking a11y)**: 4 — A11Y-1, A11Y-2, A11Y-3, A11Y-4
- **P1 (serious)**: 9 — A11Y-5, A11Y-6, A11Y-7, A11Y-8, COPY-1, COPY-3, I18N-1, I18N-2, I18N-4
- **P2 (polish)**: 8 — A11Y-9, A11Y-10, A11Y-12, COPY-2, COPY-4, COPY-5, I18N-3, I18N-5, I18N-6, I18N-7, COPY-6
- **P3 (nitpicks)**: 4 — A11Y-11 (non-issue), A11Y-13, A11Y-14, A11Y-15, A11Y-16
