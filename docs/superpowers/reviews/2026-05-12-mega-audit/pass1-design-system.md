# Pass 1 — Design System & UI Quality Audit

**Date**: 2026-05-12
**Scope**: `src/components/ui/`, `src/styles/`, `src/features/design-system/`, Tailwind/Vite config, reference HTML showcases.
**Auditor**: Claude (Opus 4.7)

---

## TL;DR — Top 5

1. **P0 — Broken Tailwind theme wiring (silent, app-wide).** The `@theme` block in `src/index.css` declares variables like `--primary`, `--accent`, `--background`, `--popover`, `--destructive`, etc. without the `--color-` prefix. Tailwind 4 only generates `bg-*` / `text-*` / `border-*` utilities from `--color-<name>` entries. Result: every utility such as `bg-primary`, `bg-accent`, `bg-background`, `bg-popover`, `text-destructive`, `text-muted-foreground`, `bg-muted`, `border-input`, `ring-ring`, `ring-offset-background` present in ~12 primitives (checkbox, textarea, select, sheet, dropdown-menu, calendar, form, table, sidebar, …) produces **no CSS**. These components are rendering with no background, no border, no ring, and invisible text tokens — the only reason they look acceptable is inherited body color and browser defaults. This is also why `bg-ds-*` classes in `LeadsTable.tsx` / `PartnerScorecard.tsx` and `bg-info` / `bg-surface` / `text-text-secondary` in `PublicLinkBanner.tsx` do not render — no corresponding `--color-*` entries exist in `@theme`.
2. **P0 — `DesignSystemView.tsx` (route `/design-system`) is a fraud.** It advertises itself as "Sistema de Diseño de EnRegla" but renders 737 lines of raw Tailwind defaults (`blue-900`, `gray-500`, `red-500`, `#1e3a8a` for primary, etc.) that have zero relationship with the actual `atlassian-tokens.css` palette (`#0f265c` blue, `#ff7043` orange, `#DE350B` red, `#36B37E` green). It also lies in its type scale section (claims 30px for `text-3xl` — Tailwind default is 30px but the project scale defines 35px at `--ds-font-size-600`). The real showcase that uses tokens is `DesignSystemShowcase.tsx` at a separate route `/design-system-showcase`. Two routes, opposite contracts — the visible one misleads contributors.
3. **P0 — Form infrastructure exists but is unused.** `src/components/ui/form.tsx` is a full shadcn/react-hook-form wrapper. `react-hook-form`, `@hookform/resolvers` and `zod` are all in `package.json`. **No file in `src/` imports `form.tsx`, no file imports `zod`, and no file imports `@hookform/resolvers`.** All forms (login, permit upload, onboarding, location creation, settings tabs, share modal) are hand-rolled with `useState` for each field plus ad-hoc validation — inconsistent error UI, duplicated submit/loading/error plumbing, no a11y `aria-invalid`/`aria-describedby` wiring. Either delete Form/zod/hook-form or migrate to them; both should not coexist.
4. **P1 — Hard drift between ui primitives: "migrated" vs "raw shadcn".** Half the primitives reference `var(--ds-*)` tokens and project risk palette (button, badge, card, input, dialog, banner, avatar, tabs, progress, breadcrumb, skeleton, empty-state, label). The other half still use raw shadcn semantic tokens that don't resolve (select, textarea, checkbox, sheet, calendar, table, dropdown-menu-sub, form). There is no written migration plan. `components.json` declares `ui: "@/components/ui-v2"` but no such directory exists — the folder is `@/components/ui`. Alias is stale.
5. **P1 — `DocumentList`, `PermitUploadForm`, `LegalMatrixView`, `RoleBadge`, `ProtectedRoute`, `AppLayout`, `DesignSystemView` still use raw Tailwind palette (`bg-red-50`, `border-gray-200`, `text-gray-500`, `bg-amber-500`, `bg-teal-100`, `from-blue-900 to-blue-800`, …).** These 6 files account for ~45 `border-*`, ~78 `bg-*` and ~153 `text-*` raw-palette occurrences. Most of that is `DesignSystemView` (~210 of them), but `DocumentList` and `PermitUploadForm` are real user-facing surfaces that bypass tokens entirely, including `text-[13px]`, `text-[12px]`, `text-[11px]` arbitrary font sizes.

---

## Severity scale

- **P0** — Broken or directly contradicts documented contract (light-only, token-first, brand colors). Ship-blocker.
- **P1** — Real visual or functional inconsistency affecting trust/coherence.
- **P2** — Tech debt / cleanup that will bite later.
- **P3** — Nit.

---

## Findings

### P0-01 — `@theme` exposes Tailwind tokens without the `--color-` prefix; ~12 primitives render with broken utilities

**Severity**: P0
**Evidence**:
- `src/index.css:16-44` — the whole `@theme` block: `--primary`, `--primary-foreground`, `--secondary`, `--accent`, `--destructive`, `--muted`, `--muted-foreground`, `--input`, `--ring`, `--foreground`, `--background`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--border`. None are prefixed with `--color-`.
- `src/index.css:225-233` — only `--color-sidebar*` entries use the correct prefix.
- Consumers that rely on these non-resolving utilities:
  - `src/components/ui/checkbox.tsx:16` — `border-primary`, `ring-offset-background`, `ring-ring`, `bg-primary`, `text-primary-foreground`.
  - `src/components/ui/textarea.tsx:12` — `border-input`, `bg-background`, `ring-offset-background`, `placeholder:text-muted-foreground`, `ring-ring`.
  - `src/components/ui/select.tsx:20, 106` — `border-input`, `bg-background`, `ring-offset-background`, `data-[placeholder]:text-muted-foreground`, `ring-ring`.
  - `src/components/ui/sheet.tsx:34, 68, 111, 123` — `bg-background`, `ring-offset-background`, `ring-ring`, `bg-secondary`, `text-foreground`, `text-muted-foreground`.
  - `src/components/ui/dropdown-menu.tsx:30, 50, 102, 126, 165` — `focus:bg-accent`, `bg-popover`, `text-popover-foreground`, `focus:text-accent-foreground`, `bg-muted`.
  - `src/components/ui/calendar.tsx:30, 82, 87-120, 202` — `bg-background`, `text-muted-foreground`, `bg-popover`, `border-input`, `bg-accent`, `text-accent-foreground`, `data-[selected-single=true]:bg-primary`, `text-primary-foreground`, `border-ring`, `ring-ring/50`.
  - `src/components/ui/form.tsx:96, 136, 158` — `text-destructive`, `text-muted-foreground`.
  - `src/components/ui/table.tsx:46, 61, 76, 102` — `bg-muted/50`, `text-muted-foreground`.
  - `src/components/ui/tooltip.tsx` (see grep).
  - `src/features/locations/PublicLinkBanner.tsx:19, 23, 28, 44, 48, 52-53` — `bg-info-bg`, `bg-info`, `border-info-border`, `bg-surface`, `border-border`, `text-text`, `text-text-secondary` — none of these exist as Tailwind classes either.
  - `src/features/internal-crm/LeadsTable.tsx:40-111` — 21 `bg-ds-*` / `text-ds-*` / `border-ds-*` occurrences. No `--color-ds-*` exists in `@theme`.
  - `src/features/internal-crm/PartnerScorecard.tsx:55-89` — 11 more `bg-ds-*`/`text-ds-*`/`border-ds-*` occurrences.

**Impact**:
- All of these utilities emit zero CSS. Primitives render without backgrounds, borders, focus rings, placeholder colors. They look "mostly fine" only because the surrounding card/dialog provides a white background, body color inherits to text, and the browser supplies default borders on `<input>`. But focus rings are missing on textarea/select/checkbox/sheet close button, dropdown item hover is invisible, calendar today/range states don't render, form error messages render in default color (not red), muted foreground is body color.
- LeadsTable & PartnerScorecard look nearly unstyled compared to the rest of the CRM.
- PublicLinkBanner's two states render as white-on-white with a transparent avatar disc.
- This is the biggest rendering bug in the design system and it is completely silent.

**Fix**: Prefix every `@theme` color token with `--color-` (Tailwind 4 contract). Add `--color-ds-blue-500`, `--color-ds-red-500` … mappings for every `ds-*` color currently used in CRM. Add `--color-info`, `--color-info-bg`, `--color-text`, `--color-text-secondary`, `--color-surface` aliases if `PublicLinkBanner` is to keep that API. Then rerun the app and eyeball every primitive.

---

### P0-02 — `DesignSystemView.tsx` is a parallel universe with raw Tailwind defaults

**Severity**: P0
**Evidence**: `src/features/design-system/DesignSystemView.tsx`
- Lines 74-104 — hard-codes raw Tailwind palette (`blue-50`…`blue-950` mapped to `#eff6ff`, `#1e3a8a`, etc.) instead of the actual brand `#0f265c` blue scale.
- Lines 100-105 — semantic colors section lists `#10b981` (green-500), `#f59e0b` (yellow-500), `#ef4444` (red-500), `#3b82f6` (blue-500) — none match the real tokens (`#36B37E`, `#FFAB00`, `#DE350B`, `#0f265c`).
- Lines 297-388 — the "Buttons" tab mocks up `bg-blue-900`, `bg-gray-100`, `bg-red-500` etc. — wrong brand color AND wrong component (does not use `<Button>` from `@/components/ui/button`).
- Lines 396-540 — `FormsSection` mocks inputs/selects/checkboxes with raw `border-gray-300`, `focus:ring-blue-900` — does not use `@/components/ui/{input,select,checkbox,textarea,form}`.
- Lines 562, 596 — includes `bg-gradient-to-br from-blue-900 to-blue-800` decorative card.
- Lines 659-731 — spacing/radius/shadow tabs hard-code `bg-blue-900` as the sample color.
- Registered at `src/App.tsx:116` as `/design-system`, alongside a second, token-correct showcase `/design-system-showcase` (`DesignSystemShowcase.tsx`).

**Impact**: Anyone learning the design system from the live app sees the wrong palette, wrong buttons, wrong forms, wrong spacing ramp. Brand colors (`#0f265c` blue, `#ff7043` orange) never appear. Contributors will copy-paste the wrong styles. Directly contradicts CLAUDE.md principle "Jerarquía Funcional sobre Decoración" and the brand personality "Preciso" — the design system doc is imprecise about the design system.

**Fix**: Delete `DesignSystemView.tsx` and the `/design-system` route, or rewrite it using `<Button>`, `<Input>`, `<Select>`, `<Card>`, `<Badge>`, `<RiskBadge>`, `<StatusBadge>`, `<Banner>` and the real `--ds-*` tokens. Consolidate with `DesignSystemShowcase` under a single route.

---

### P0-03 — `form.tsx` + react-hook-form + zod are installed but entirely unused; all forms are hand-rolled and inconsistent

**Severity**: P0
**Evidence**:
- `package.json:16,17,50` — declares `@hookform/resolvers`, `react-hook-form`, `zod`.
- `src/components/ui/form.tsx` — 178 lines exporting `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage`.
- Grep `from '@/components/ui/form'` → **0 files**. Grep `from 'zod'` → **0 files**. Grep `@hookform/resolvers` → **0 files**. Grep `useForm|react-hook-form|zodResolver` → only `form.tsx` itself.
- Hand-rolled forms (each with its own useState + submit + loading + error pattern):
  - `src/features/auth/LoginView.tsx:22-63`
  - `src/features/permits/PermitUploadForm.tsx:77-210` (manual file validation, manual date validation, inline error state).
  - `src/features/onboarding-incremental/steps/ProfileStep.tsx`, `CompanyStep.tsx`, `LocationsStep.tsx`.
  - `src/features/locations/CreateLocationModal.tsx`.
  - `src/features/locations/RenewPermitModal.tsx`.
  - `src/features/settings/ProfileTab.tsx`, `CompanyTab.tsx`, `SecurityTab.tsx`, `NotificationsTab.tsx`, `NotificationPreferences.tsx`.
  - `src/features/public-links/ShareLocationModal.tsx`.

**Impact**:
- Inconsistent error UX: some forms show inline error under each field (`PermitUploadForm` uses a single global red banner), some use `<Banner variant="error">`, some surface `text-red-500` paragraphs (not token-resolved) — no standard pattern.
- Accessibility gaps: no `aria-invalid`, no `aria-describedby` on most inputs. `form.tsx` would wire these for free.
- Bundle bloat: `react-hook-form` + `zod` + `@hookform/resolvers` ship for no reason.
- Validation logic (emails, passwords, required fields, date ranges) is duplicated across ~10 files.

**Fix**: Pick one. Either delete `form.tsx` + the three packages, or migrate forms to `useForm` + `zodResolver` starting with the biggest (`PermitUploadForm`, onboarding steps, `CreateLocationModal`). CLAUDE.md requires consistency — this violates it directly.

---

### P0-04 — Hardcoded brand hex values in `AppLayout` and `ComplianceWeatherCard` bypass tokens

**Severity**: P0
**Evidence**:
- `src/components/layout/AppLayout.tsx:156` — sidebar logo uses `bg-gradient-to-br from-blue-900 to-blue-800` (raw Tailwind). Should be `from-[var(--ds-blue-500)] to-[var(--ds-blue-600)]` to match the real `#0f265c` brand blue. Raw `blue-900` is `#1e3a8a` — wrong hue.
- `src/components/layout/AppLayout.tsx:257` — notification dot uses `bg-red-500` (raw) instead of `var(--ds-background-danger)` / `var(--ds-red-500)`.
- `src/components/ui/ComplianceWeatherCard.tsx:383-642` — 260 lines of inline `<style>` block hardcode `#0f265c`, `#15803d`, `#c2410c`, `#dc2626`, `#166534`, `#fed7aa`, `#fca5a5`, `#fecaca`, `#bbf7d0`, `#fef2f2`, `#172b4d`, etc. None reference `var(--ds-*)`. This is the hero of the Dashboard — the user's most-looked-at surface — and it cannot be restyled centrally.
- `src/features/legal/LegalMatrixView.tsx:39-42` — matrix cell states `bg-green-600`, `bg-blue-400`, `bg-amber-500` for Required / Conditional / Optional. These three should be the project risk/status palette, not raw Tailwind.
- `src/components/ui/RoleBadge.tsx:13-15` — role colors `bg-blue-100 text-blue-700`, `bg-teal-100 text-teal-800`, `bg-amber-100 text-amber-800`. Teal + amber are not in the project palette at all.
- `src/components/Auth/ProtectedRoute.tsx:15` — loading gradient uses `from-gray-50 to-gray-100` (raw). `AppLoader` + `AuthCallback` use `from-[var(--ds-blue-50)] to-[var(--ds-neutral-50)]` tokens — inconsistent.

**Impact**: Changing the brand palette via tokens won't change the hero card, sidebar logo, legal matrix, role badges, or route-loading screen. Marketing rebrand becomes a hunt.

**Fix**: Replace all of the above with token references (`var(--ds-*)`) or Tailwind classes that resolve from `@theme` once P0-01 is fixed. For `ComplianceWeatherCard`, extract the inline CSS block into a SCSS-ish structure or plain `.css` file and reference tokens.

---

### P1-05 — `DocumentList.tsx` uses arbitrary font sizes and raw palette for file-type badges

**Severity**: P1
**Evidence**: `src/components/documents/DocumentList.tsx`
- Lines 73, 76, 87, 125, 129, 132, 133, 138, 139 — `text-[13px]`, `text-[12px]`, `text-[11px]` arbitrary sizes. Project scale has `--ds-font-size-050: 11px`, `--ds-font-size-075: 12px`, `--ds-font-size-100: 14px`. 13px does not exist in the scale.
- Lines 69, 70, 106-109, 153, 163, 174 — `bg-red-50`, `bg-blue-50`, `bg-gray-50`, `bg-red-100`, `bg-blue-100`, `bg-gray-100` for the file-type icon chips and action buttons.
- Lines 86, 87, 178, 180 — `bg-red-50`, `text-red-600`, `border-red-100` for error banners — duplicates `<Banner variant="error">` which already exists.
- Lines 125, 73 — `text-gray-900`, `text-gray-500` for file names and metadata — should be `text-[var(--ds-text)]` / `text-[var(--ds-text-subtle)]`.

**Impact**: File list looks different from the rest of the app (off-palette reds/blues), 13px body text breaks the vertical rhythm, and the error banner doesn't reuse the `<Banner>` primitive — behavior drift over time is guaranteed.

**Fix**: Replace with `<Banner variant="error">`, `<Button variant="subtle" size="icon">` with token colors, and the `--ds-font-size-*` scale.

---

### P1-06 — `PermitUploadForm.tsx` bypasses tokens in a critical flow

**Severity**: P1
**Evidence**: `src/features/permits/PermitUploadForm.tsx`
- Line 213 — `bg-gray-50 border-t border-gray-100 p-6 space-y-4` root wrapper (raw palette).
- Line 216, 283 — `text-sm font-medium text-gray-700` labels (raw gray, also duplicates the `<Label>` primitive).
- Line 220, 238, 260, 274 — `border border-gray-200`, `border-gray-300`, `text-gray-400`, `text-gray-500` (raw).
- Line 319-322 — Vencimiento calculado panel: `bg-blue-50 border border-blue-200 rounded-lg` and `text-gray-900`. Should reuse `<Banner variant="info">` or a small info card with tokens.
- Line 328-330 — Error banner: `bg-red-50 border border-red-200 rounded-lg` + `text-red-700`. Duplicates `<Banner variant="error">`.
- Line 263 — `text-primary hover:text-primary/80` — `text-primary` does not resolve (see P0-01).

**Impact**: One of the highest-frequency user actions (uploading a permit) uses an inconsistent visual vocabulary — different grays, different reds, different radius (`rounded-lg` vs token `rounded-[var(--ds-radius-200)]`).

**Fix**: Same remediation as DocumentList — reuse `<Banner>`, `<Label>`, `<Input>`, `<Button>` and the token scale.

---

### P1-07 — `RiskBadge` / `StatusBadge` dots have no accessible name for screen readers in some contexts

**Severity**: P1
**Evidence**:
- `src/components/ui/RiskBadge.tsx:34` and `StatusBadge.tsx:40` — decorative dot `<span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />` has no `aria-hidden="true"`. Screen readers may announce "bullet" before the label. Minor but consistent fix.
- `src/components/ui/badge.tsx:52-55` — same dot rendered from the `dot` prop, same issue.

**Fix**: Add `aria-hidden="true"` to decorative dots.

---

### P1-08 — Color contrast on `risk-medio` badge fails WCAG AA

**Severity**: P1
**Evidence**:
- `atlassian-tokens.css:128` — `--ds-risk-medio-text: var(--ds-yellow-600)` → `#FF991F` on `--ds-yellow-50` `#fff8e1` background. Contrast ratio ≈ 2.4:1. WCAG AA for normal text requires 4.5:1.
- Same problem in `badge.tsx:20` (`risk-medio: "bg-[var(--ds-yellow-50)] text-[var(--ds-yellow-600)]"`).
- `StatusBadge status-por-vencer` uses `text-[var(--ds-orange-700)]` on `bg-[var(--ds-orange-50)]` → roughly 4.1:1, also borderline-failing.

**Impact**: One of the four risk states is hard to read for sighted users and fails assistive-tech contrast checks. Audience is B2B compliance professionals — fails "Preciso, Confiable, Protector".

**Fix**: Darken `--ds-risk-medio-text` to `--ds-yellow-700` or darker (target 4.5:1). Rerun contrast audit for all badge variants with a tool.

---

### P1-09 — Typography scale is partially enforced but has random one-offs in card titles and hero text

**Severity**: P1
**Evidence**:
- `src/components/ui/card.tsx:44` — CardTitle uses `text-[var(--ds-font-size-300)]` (20px). Good.
- `src/components/ui/dialog.tsx:89` — DialogTitle uses `text-[var(--ds-font-size-300)]`. Good.
- `src/components/ui/ComplianceWeatherCard.tsx:591` — headline is `font-size: 24px` (not on scale: 20 and 29 are the neighbors, no 24). `big-pct` is `font-size: 120px` (not on any scale). `state-chip` is `10px` (also not on scale, which starts at 11).
- `src/components/layout/AppLayout.tsx:243` — page title uses `text-base lg:text-[var(--ds-font-size-300)]` — mixing the scale with Tailwind's `text-base` (16px). On tablet/small laptop (< lg breakpoint) the title renders 16px, jumping to 20px only at 1024px — creates a visible responsive step.
- `src/components/documents/DocumentList.tsx:73, 76, 87, 125, 129, 132, 133, 138, 139` — eight `text-[13px]` / `text-[12px]` / `text-[11px]` instances. 13px is not in the scale.
- `src/features/dashboard/nodes/SedeNode.tsx:51, 56` — `text-[10px]` and `text-[11px]`.
- `src/features/auth/LoginView.tsx:79, 113, 143` — `text-[10px]`. LoginView also uses tracking values `tracking-[0.2em]` which is fine but not tokenised.

**Impact**: The "Densidad Controlada" principle breaks when body/label/metadata sizes drift between 10 and 14 px at small step intervals — the eye cannot establish hierarchy.

**Fix**: Either add `text-[10px]` to the scale as `--ds-font-size-025` and allow it, or eliminate the 10/11/13 px outliers. Add an ESLint rule or Grep CI for `text-\[[0-9]+px\]` to catch regressions.

---

### P1-10 — `Card` primitive ships `shadow-raised` by default, no border — feels floating on white background

**Severity**: P1
**Evidence**: `src/components/ui/card.tsx:11-14`
- Default card: `rounded-[var(--ds-radius-200)] bg-white text-[var(--ds-text)] shadow-[var(--ds-shadow-raised)]` — no border, only `0 1px 1px + 0 0 1px` shadow.
- `CardFooter:80` has `border-t border-[var(--ds-border)]` but the outer card has no border.
- The reference `atlassian-ds-showcase.html` and `design-system-complete.html` both place cards over `--ds-neutral-50` page background, where a shadow-only card visually separates. But `AppLayout` uses `bg-[var(--ds-neutral-50)]` (F7F8F9, very close to white) — and on several routes (DashboardView, LegalMatrix, PublicVerificationPage) the background is white or `bg-[var(--ds-neutral-50)]` with white cards, so cards become almost invisible.

**Impact**: Reviewers of `docs/superpowers/` visuals have historically requested "more visible card edges". The token scale supports it (`--ds-border`). Shadow-only is Material design — contradicts "Corporativo moderno" aesthetic direction.

**Fix**: Add a subtle `border border-[var(--ds-border)]` to `Card` default, or introduce a `variant="bordered"` and apply it consistently.

---

### P1-11 — Dialog / Sheet overlay uses `bg-black/20 backdrop-blur-sm` — blur breaks consistency and perf

**Severity**: P1
**Evidence**:
- `src/components/ui/dialog.tsx:22` — overlay `bg-black/20 backdrop-blur-sm`.
- `src/components/ui/sheet.tsx:24` — same.
- `src/components/layout/AppLayout.tsx:140` — sidebar mobile overlay `bg-black/20 backdrop-blur-sm`.
- No token for overlay opacity or blur. Four separate places to change if we ever want a different overlay feel.

**Impact**: On tablet / mid-range laptops the `backdrop-filter: blur()` on a full-viewport element costs 4-6 ms per frame. The product is daytime office — blur is purely decorative and fights "Preciso" personality.

**Fix**: Introduce `--ds-overlay` tokens (e.g. `--ds-overlay-bg: rgba(9,30,66,0.48)` matching Atlassian). Use in all three sites. Drop `backdrop-blur-sm`.

---

### P1-12 — `ComplianceWeatherCard` violates light-mode-only directive and uses heavy animation

**Severity**: P1
**Evidence**: `src/components/ui/ComplianceWeatherCard.tsx:394-397`
```
.hero-card--sunny { background: linear-gradient(180deg, #6ab0ff 0%, ... #f4f1ea 100%); color: #0f265c; }
.hero-card--warn  { background: linear-gradient(180deg, #3d4a5c 0%, ... #7a849a 100%); color: #f1f5f9; }
.hero-card--err   { background: linear-gradient(180deg, #0a0d1a 0%, #1a1428 40%, #2a1820 70%, #3a1a1a 100%); color: #fecaca; }
```
- `warn` and `err` states render a dark card (with dark-text white/red) on a light-mode app. That is a de facto dark-mode surface embedded in a light-mode product. CLAUDE.md: "Solo modo claro".
- Lines 126-148 + 337-348 — `err` state runs a JS-driven lightning animation loop (`animate()` every 3-9s, DOM-mutation-heavy, not behind `prefers-reduced-motion`). The file imports `@keyframes` for continuous cloud drift, sun pulse, shield wobble, break-left/break-right, spark flicker, storm roll, mist move — all running forever, not gated by `prefers-reduced-motion`.
- `ac79bfb` (previous commit by user: "quitar lluvia de ComplianceWeatherCard estado err") suggests the user has already noticed one form of this. The rest of the animation stack is still there.

**Impact**:
- Color scheme violates brand direction.
- Continuous DOM animation on the landing page is CPU/battery drag, especially for users pinned to Dashboard.
- `prefers-reduced-motion` users still see it.

**Fix**: Use the risk/status palette for all three states (light surfaces with risk-colored left border, matching `LocationCardV2` pattern). Gate all `@keyframes` animations behind `@media (prefers-reduced-motion: no-preference)` (pattern already used in `index.css` for `.animate-slide-up` — extend).

---

### P1-13 — `components.json` aliases are wrong / stale

**Severity**: P1
**Evidence**: `components.json:14-19`
- `"ui": "@/components/ui-v2"` — there is no `ui-v2` directory. Actual directory is `@/components/ui`.
- Consequence: any future `npx shadcn add <component>` will create files in the wrong place or fail.

**Fix**: Update `"ui": "@/components/ui"`, or commit to creating a `ui-v2` directory and migrating.

---

### P2-14 — Two parallel design-system routes with different content

**Severity**: P2
**Evidence**:
- `src/App.tsx:116` — `/design-system` → `DesignSystemView` (raw Tailwind, described in P0-02).
- `src/App.tsx:117` — `/design-system-showcase` → `DesignSystemShowcase` (token-aware, decent).
- Plus three root-level HTML references: `design-system-complete.html` (3416 lines), `design-system-showcase.html` (932 lines), `atlassian-ds-showcase.html` (744 lines).

**Impact**: No single source of truth for the design system. Newcomer does not know which to trust.

**Fix**: Delete DesignSystemView, keep DesignSystemShowcase, archive two of the three HTML references (keep one canonical reference, ideally `design-system-complete.html` if it's token-accurate).

---

### P2-15 — Deprecated design tokens file still present at `src/styles/.deprecated/design-tokens.css`

**Severity**: P2
**Evidence**: `src/styles/.deprecated/design-tokens.css` — 200+ lines of old tokens (`--color-primary: #1E3A8A`, `--color-enregla-*` scale inverted). Not imported anywhere (grep confirms), but present. The folder prefix `.deprecated/` is clever but a future contributor may re-import it "just to get back a class".

**Fix**: Delete. Git history preserves it.

---

### P2-16 — Empty `tailwind.config.js` files (Tailwind 4 uses CSS), plus stale `components.json` pointing at `config/tailwind.config.js`

**Severity**: P2
**Evidence**:
- `config/tailwind.config.js` — only `{ content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'] }`. Tailwind 4 in `@tailwindcss/vite` mode uses `@theme` in CSS — this file is mostly ceremonial. `content` is auto-detected.
- `components.json:7` — points to `config/tailwind.config.js`.
- There is no clarifying comment explaining that the actual theme lives in `src/index.css`.

**Fix**: Add a comment in `tailwind.config.js` noting "Tailwind 4 — theme lives in src/index.css `@theme` block", or delete the file and remove the `components.json` reference.

---

### P2-17 — `@custom-variant dark (&:is(.dark *));` is declared but light-mode-only

**Severity**: P2
**Evidence**: `src/index.css:14` — `@custom-variant dark (&:is(.dark *));`. CLAUDE.md: "Solo modo claro". Directive registers a `dark:` variant even though the app forbids it. No `.dark` class anywhere. Grep `dark:` in `src/` → zero hits.

**Impact**: Future contributor could add `dark:` classes that appear to work in dev and silently fail at runtime (no `.dark` on `<html>`). Directly contradicts the rule.

**Fix**: Remove line 14.

---

### P2-18 — Tailwind spacing scale used inconsistently: `var(--ds-space-*)` tokens in primitives, raw `p-4` / `gap-3` in features

**Severity**: P2
**Evidence**:
- Primitives use `p-[var(--ds-space-300)]` etc.
- Features mix both: `src/features/permits/PermitUploadForm.tsx:213-344` uses `p-6`, `space-y-4`, `gap-3`, `mt-1`, `mt-1.5`, `mb-2`. `src/components/documents/DocumentList.tsx` uses `p-8`, `p-4`, `gap-3`, `mt-1`, `mb-3`.
- There are ~262 bracket-spacing occurrences overall (mostly `var(--ds-space-*)` = legitimate) vs hundreds of plain `p-{4,6,8}`, `gap-{2,3,4}`, etc. No convention.

**Fix**: Either (a) extend `@theme` with `--spacing-050: 4px` … `--spacing-600: 48px` so Tailwind defaults map to tokens, or (b) write a convention that features use plain `p-4/p-6/gap-3` and primitives use tokens — but document it.

---

### P2-19 — `focus-visible:` rings only on some primitives, missing on others

**Severity**: P2
**Evidence**: Grep `focus-visible:` across primitives — present on `button`, `input`, `dialog`, `card` (interactive), `textarea`, `sidebar`, `checkbox`. **Not** present on `select` (uses `focus:` not `focus-visible:`), `dropdown-menu` (`focus:` only), `sheet`'s close button (`focus:`), `tabs` (no focus state at all). `Tabs` trigger has no visible keyboard focus indicator — only mouse-hover color change.
- `src/components/ui/tabs.tsx:51-73` — no `focus-visible:ring-*`.

**Impact**: Keyboard users cannot see which tab is focused. Fails WCAG 2.4.7.

**Fix**: Add `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-background-brand)] focus-visible:ring-offset-2` to `TabsTrigger`, `SelectTrigger`, `SelectItem`, `DropdownMenuItem`, `SheetContent`'s close button.

---

### P2-20 — Lucide icon sizing conflates two APIs (`size={20}` prop vs `className="w-5 h-5"`)

**Severity**: P2
**Evidence**:
- `src/lib/lucide-icons.ts` — centralized re-export (good).
- Consumers mix:
  - `size={20}` prop: `AppLayout.tsx:157,239,256`, `DocumentList.tsx`, `NotificationPreferences.tsx`, `DashboardMap.tsx` — 31 occurrences across 7 files.
  - `className="w-4 h-4"` / `w-5 h-5` etc: everywhere else (majority).
- Result: icons at the "same" visual size can differ by 1-2 px depending on how they were authored.
- Badge's `[&_svg]:size-3.5` in `button.tsx:23` implies icon size auto-follows button size — but that only works if the consumer does NOT also pass `size={14}`. Grep confirms both patterns coexist inside buttons.

**Fix**: Pick one (Tailwind class convention is more consistent with the rest of the codebase). Add ESLint rule that flags `size=` on lucide components imported from `@/lib/lucide-icons`.

---

### P2-21 — Iconography semantic consistency: `FileText` overloaded, `Building2` both for Empresa and Sede

**Severity**: P2
**Evidence**:
- `lucide-icons.ts:9-10` — `Building2` comment says "Sede", `Landmark` says "Empresa".
- `AppLayout.tsx:157` — uses `Building2` for the app logo in sidebar (Empresa-level brand). But same icon also used for Sede cards (`LocationCardV2.tsx:66`, `DashboardSedeCard.tsx:39`) and for the menu toggle button in the top bar (`AppLayout.tsx:240`).
- `FileText` used for: document items (`DocumentList`), permit-type icon (`PermitUploadForm`), menu item "Permisos" (`AppLayout.tsx:39`), and generic fallback in upload preview.

**Impact**: Users cannot build an icon-to-concept mental model. Semantics degrade from signal to noise.

**Fix**: Define a canonical icon for each domain concept (Empresa, Sede, Permiso, Documento, Renovación, etc.) in `lucide-icons.ts` with explicit const names (`EmpresaIcon = Landmark`), and lint imports.

---

### P2-22 — `Skeleton` has two conflicting animation declarations

**Severity**: P2
**Evidence**: `src/components/ui/skeleton.tsx:13-26`
- Line 14-16: `className="animate-pulse bg-gradient-to-r from-[var(--ds-neutral-100)] via-[var(--ds-border)] to-[var(--ds-neutral-100)] bg-[length:200%_100%] animate-shimmer"` — two animations declared (`animate-pulse` + `animate-shimmer`).
- Line 23-25: `style={{ animation: 'shimmer 1.5s ease-in-out infinite' }}` — inline style overrides. The `animate-pulse` class is dead.
- `index.css:113-122` declares `@keyframes shimmer` + `.bg-shimmer` but not `.animate-shimmer`. So `animate-shimmer` class is also a no-op — only the inline `style` actually animates.

**Fix**: Remove `animate-pulse` and `animate-shimmer` classes, keep inline style or move to `@keyframes`.

---

### P2-23 — `SelectTrigger` height (`h-10`) doesn't match `Input` (`h-9`) doesn't match `Button default` (`h-8`)

**Severity**: P2
**Evidence**:
- `src/components/ui/select.tsx:20` — `SelectTrigger` is `h-10`.
- `src/components/ui/input.tsx:13` — `Input` is `h-9`.
- `src/components/ui/button.tsx:24` — `Button` default is `h-8`; lg is `h-10`; sm is `h-7`.
- On any form with a label+input+button row, the three controls are three different heights. Inspection of `LoginView` confirms mismatched baseline.

**Fix**: Align to a single form-control height (`h-9` is the Atlassian default used in `design-system-complete.html`). Update Button default to `h-9`, Select to `h-9`, Input already at `h-9`.

---

### P3-24 — `Tabs` component re-implements Radix behavior instead of using `@radix-ui/react-tabs`

**Severity**: P3
**Evidence**: `src/components/ui/tabs.tsx:1-95` — hand-rolled state machine with context. `@radix-ui/react-tabs` is not in `package.json`. The existing implementation lacks `aria-controls` / `aria-labelledby` wiring that Radix provides for free, plus keyboard arrow-key navigation.

**Fix**: Add `@radix-ui/react-tabs` and replace. Low priority — current impl works for sighted mouse users.

---

### P3-25 — `atlassian-tokens.css` contains risk-yellow scale values that are nearly-identical orange gradients

**Severity**: P3
**Evidence**: `atlassian-tokens.css:66-76`
- `--ds-yellow-600: #FF991F` — orange-ish.
- `--ds-yellow-700: #ffae02`, `--ds-yellow-800: #ffa400`, `--ds-yellow-900: #ff9b00` — the differences between 500, 600, 700, 800, 900 are 1-2 hex points each. The "yellow" scale collapses into a single orange.

**Impact**: `risk-medio` (yellow) is visually indistinguishable from `risk-alto` (orange) in the badge palette at small sizes. Plus the text contrast on `yellow-600` over `yellow-50` is 2.4:1 (see P1-08).

**Fix**: Use a real yellow (e.g. `#F59E0B` / Atlassian `#FFAB00` already as `--ds-yellow-500`, darker `#9A6700` for text) so alto vs medio reads at a glance.

---

### P3-26 — `sidebar.tsx` is the full shadcn sidebar-02 block (650+ lines), but `AppLayout.tsx` uses a hand-rolled sidebar, making the former dead code

**Severity**: P3
**Evidence**:
- `src/components/ui/sidebar.tsx` — full shadcn sidebar, declares `SidebarProvider`, `Sidebar`, `SidebarHeader`, `SidebarContent`, `SidebarMenu`, 15+ exports, uses `bg-sidebar-*` tokens (the only `--color-sidebar-*` tokens that actually resolve).
- Grep confirms no file imports `sidebar.tsx` exports. `AppLayout.tsx` rolls its own aside.

**Fix**: Either migrate `AppLayout` to the shadcn sidebar or delete `sidebar.tsx`. Current state wastes ~650 lines and confuses contributors who'd naturally look for a "Sidebar" primitive.

---

### P3-27 — Responsive breakpoints barely used

**Severity**: P3
**Evidence**: Grep `md:|lg:|xl:|sm:|2xl:` → 94 occurrences across 23 files, but 39 of those are in the sidebar/design-system files alone. Key surfaces have minimal responsive logic:
- `DashboardView.tsx` — 1 breakpoint reference total (grid collapse).
- `PermitListView.tsx` — 4 breakpoints.
- Tablet portrait (768-1024 px) for `LegalMatrixView` — the matrix has 12 giro columns and no horizontal-scroll-aware design, will be unusable on tablet portrait.
- `AppLayout.tsx` sidebar width fixed at `w-64` with no wider-at-xl treatment — Dashboard content area becomes cramped at 1280 px with sidebar + 1400 max content width.
- `min-w-[180px]` on matrix permit column (`LegalMatrixView.tsx:65`) plus 12 columns → 2500+ px of table width; on 1024 px tablet user sees a horizontal scrollbar but no visual hint.

**Impact**: Per CLAUDE.md "Consistencia Multi-Contexto — debe funcionar igual de bien en desktop, laptop y tablet", the matrix view fails tablet.

**Fix**: Audit DashboardView, LegalMatrixView, PermitListView for tablet breakpoints. Add sticky first column to matrix.

---

### P3-28 — Error/empty/loading patterns not centralised

**Severity**: P3
**Evidence**:
- `EmptyState` primitive exists (`empty-state.tsx`) and is used by `DashboardView`. But `DocumentList:67-80` rolls its own empty state with raw palette.
- Loading: `AppLoader` + `SkeletonList` + `SkeletonCard` exist. But `DashboardView:115-122` uses `SkeletonList` inside a manual gradient wrapper; `LeadsTable:40` writes `<div className="p-6 text-ds-neutral-600">Cargando...</div>` with a broken class.
- Error: `Banner variant="error"` exists but `DocumentList`, `PermitUploadForm`, `LeadsTable` all roll their own error banners with raw palette.

**Fix**: Create an `AsyncBoundary` or enforce via lint: "if you render loading/error/empty, use `Skeleton*` / `Banner variant="error"` / `EmptyState`".

---

## Migration status — Shadcn → UI-v2

The CLAUDE.md claim of "UI-v2 system replacing Shadcn" is partially true. Below is the honest state of each primitive.

| Component | Token-aware? | Uses `var(--ds-*)` | Broken utilities (P0-01) | Status |
|---|---|---|---|---|
| `button.tsx` | Yes | Yes (`--ds-background-brand`, etc.) | No | **Migrated** |
| `badge.tsx` | Yes | Yes (full risk + status palette) | No | **Migrated** |
| `card.tsx` | Yes | Yes | No | **Migrated** (but shadow-only, see P1-10) |
| `input.tsx` | Yes | Yes (`--ds-border`, etc.) | No | **Migrated** |
| `label.tsx` | Yes | Yes | No | **Migrated** |
| `banner.tsx` | Yes | Yes | No | **Migrated** |
| `breadcrumb.tsx` | Yes | Yes | No | **Migrated** |
| `dialog.tsx` | Yes | Yes (shadow-overlay, tokens) | No | **Migrated** |
| `tabs.tsx` | Yes | Yes | No | **Migrated** (but hand-rolled, P3-24) |
| `avatar.tsx` | Yes | Yes | No | **Migrated** |
| `progress.tsx` | Yes | Yes | No | **Migrated** |
| `skeleton.tsx` | Yes | Yes | No | **Migrated** (but animation conflict P2-22) |
| `empty-state.tsx` | Yes | Yes | No | **Migrated** |
| `app-loader.tsx` | Yes | Yes | No | **Migrated** |
| `StatusBadge.tsx` / `RiskBadge.tsx` | Yes | Yes (wraps `badge.tsx`) | No | **Migrated** |
| `separator.tsx` | Partial | Partial (`--ds-border`) | No | **Migrated-ish** |
| `tooltip.tsx` | Partial | Mix | Yes (`bg-popover`, `text-popover-foreground`) | **Legacy shadcn** |
| `select.tsx` | Mix | Some | **Yes** (`border-input`, `bg-background`, `ring-ring`, `text-muted-foreground`) | **Legacy shadcn** |
| `textarea.tsx` | No | No | **Yes** (`border-input`, `bg-background`, `ring-ring`, `text-muted-foreground`) | **Legacy shadcn** |
| `checkbox.tsx` | No | No | **Yes** (`border-primary`, `bg-primary`, `text-primary-foreground`, `ring-ring`) | **Legacy shadcn** |
| `dropdown-menu.tsx` | Mix | Partial | **Yes** (`bg-popover`, `text-popover-foreground`, `bg-accent`, `text-accent-foreground`, `bg-muted`) | **Legacy shadcn** |
| `sheet.tsx` | No | No | **Yes** (`bg-background`, `ring-ring`, `bg-secondary`, `text-foreground`, `text-muted-foreground`) | **Legacy shadcn** |
| `calendar.tsx` | No | No | **Yes** (`bg-accent`, `text-accent-foreground`, `bg-popover`, `bg-primary`, `text-primary-foreground`, `border-ring`, `text-muted-foreground`) | **Legacy shadcn** |
| `form.tsx` | No | No | **Yes** (`text-destructive`, `text-muted-foreground`) | **Legacy shadcn AND unused** (see P0-03) |
| `table.tsx` | No | No | **Yes** (`bg-muted/50`, `text-muted-foreground`) | **Legacy shadcn** |
| `sidebar.tsx` | Partial | `--sidebar-*` | Partial | **Migrated but dead code** (P3-26) |
| `ComplianceWeatherCard.tsx` | No | No (inline `<style>` block) | N/A | **Not a primitive, but hardcoded** |
| `ComplianceInvoiceCard.tsx` | Unknown | — | — | *(not audited depth, file name suggests similar style block)* |

**Net**: ~14 primitives fully migrated, ~8 primitives still raw shadcn and silently broken because `@theme` doesn't emit the `bg-background` / `bg-popover` / `bg-accent` / `text-destructive` / `ring-ring` utilities (see P0-01). The listed primitives that consumers reach for most (select, textarea, checkbox, sheet, calendar, form, table) are the broken ones.

---

## Token drift — raw Tailwind palette where tokens exist

Consolidated list of files using raw `red/orange/yellow/green/blue/gray/amber/teal/...-N` classes (or gradient-to raw palette) where `var(--ds-*)` tokens exist. Severity indicated per-file: **B** (blocker, user-facing), **M** (moderate, internal-ish), **L** (low, showcase/test).

| File | Raw-palette count | Notes | Severity |
|---|---|---|---|
| `src/features/design-system/DesignSystemView.tsx` | ~210 | Entire file is raw Tailwind defaults — see P0-02 | **B** |
| `src/components/documents/DocumentList.tsx` | ~29 | `bg-red-50`, `bg-blue-50`, `bg-gray-{50,100,400,500,900}`, plus `text-[13px]` / `text-[12px]` / `text-[11px]` arbitrary sizes — see P1-05 | **B** |
| `src/features/permits/PermitUploadForm.tsx` | ~24 | `bg-gray-50`, `border-gray-{100,200,300}`, `text-gray-{400,500,700,900}`, `bg-blue-50`, `border-blue-200`, `bg-red-50`, `text-red-{600,700}`, `border-red-200` — see P1-06 | **B** |
| `src/features/legal/LegalMatrixView.tsx` | 3 | `bg-green-600`, `bg-blue-400`, `bg-amber-500` for matrix cells (R/O/T) — P0-04 | **B** |
| `src/components/ui/RoleBadge.tsx` | 3 | `bg-blue-100 text-blue-700`, `bg-teal-100 text-teal-800`, `bg-amber-100 text-amber-800` — P0-04 | **B** |
| `src/components/layout/AppLayout.tsx` | 2 | `bg-gradient-to-br from-blue-900 to-blue-800` logo bg + `bg-red-500` notification dot — P0-04 | **B** |
| `src/components/Auth/ProtectedRoute.tsx` | 2 | `bg-gradient-to-br from-gray-50 to-gray-100` loader — inconsistent with AppLoader | **M** |
| `src/features/locations/RenewPermitModal.tsx` | 1 | one `text-*` | **L** |
| `src/components/ui/ComplianceWeatherCard.tsx` | ~30 hex | Inline `<style>` with `#0f265c`, `#15803d`, `#c2410c`, `#dc2626` etc. — P1-12 | **B** |
| `src/features/internal-crm/LeadsTable.tsx` | 21 | `bg-ds-*`/`text-ds-*`/`border-ds-*` classes that do not resolve (no `--color-ds-*` in `@theme`) — P0-01 | **B** |
| `src/features/internal-crm/PartnerScorecard.tsx` | 11 | same as LeadsTable | **B** |
| `src/features/locations/PublicLinkBanner.tsx` | 6 | `bg-info-bg`, `bg-info`, `bg-surface`, `border-info-border`, `text-text`, `text-text-secondary` — none resolve | **B** |

Plus isolated instances:
- `src/features/dashboard/nodes/SedeNode.tsx` — `text-[10px]`, `text-[11px]` (font-size drift; P1-09).
- `src/features/auth/LoginView.tsx` — `text-[10px]`, `tracking-[0.2em]` (minor; P1-09).

---

## DesignSystemView freshness verdict

**Stale and actively misleading** (P0-02). It documents a design system that does not exist. Token palette (blue-900 = #1e3a8a) contradicts the real palette (blue-500 = #0f265c). Components mocked up as raw `<button className="bg-blue-900">` tags do not use the real `<Button>` primitive. Type scale lists 12 → 30 px which partially maps to project scale; form/card/spacing sections are pure Tailwind defaults.

Comparison table:

| Section | DesignSystemView says | Project tokens define | Match? |
|---|---|---|---|
| Primary color | `#1e3a8a` (blue-900) | `#0f265c` (ds-blue-500) | **No** |
| Success | `#10b981` (green-500) | `#36B37E` (ds-green-500) | **No** |
| Warning | `#f59e0b` (yellow-500) | `#FFAB00` (ds-yellow-500) | **No** |
| Error | `#ef4444` (red-500) | `#DE350B` (ds-red-500) | **No** |
| Info | `#3b82f6` (blue-500) | `#0f265c` (ds-blue-500) | **No** |
| Font stack | Default Tailwind | `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto'` | Missing |
| Font sizes | 12→30 px | 11→35 px | Partial |
| Button primitives | Raw `<button>` | `<Button>` component with 8 variants | **No** |
| Form primitives | Raw `<input>` | `<Input>`, `<Textarea>`, `<Select>`, `<Form*>` | **No** |
| Risk palette (crítico/alto/medio/bajo) | Not shown at all | Core to product | **Missing** |
| Status palette (vigente/por vencer/vencido/en tramite/no registrado) | Not shown at all | Core to product | **Missing** |
| `<Banner>` / `<Breadcrumb>` / `<Avatar>` / `<RiskBadge>` / `<StatusBadge>` | Not shown | Exist | **Missing** |

The real design-system source of truth is the reference HTML files at repo root (`design-system-complete.html` uses `--ds-blue-500: #0f265c` correctly) and `DesignSystemShowcase.tsx`. But users landing on `/design-system` get the wrong view.

---

## Accessibility spot-checks

- **Semantic HTML**: no `<div onClick>` buttons in the codebase (good). All interactive tiles (`LocationCardV2`, `DashboardSedeCard`) wrap a `<Link>` with `aria-label` (good).
- **ARIA**: `AppLayout` does skip-to-content link correctly; sidebar has `aria-label` and `aria-current`. Dialog close has `sr-only` label. Good baseline.
- **Focus visibility**: broken on `Tabs`, `SheetClose` (see P2-19), `DropdownMenuItem`, `SelectTrigger`/`SelectItem`. These receive `focus:` not `focus-visible:` and reference the broken `ring-ring` utility.
- **Contrast**: `risk-medio` / `status-por-vencer` fail WCAG AA (P1-08).
- **Screen reader**: decorative dots on badges have no `aria-hidden` (P1-07).
- **Reduced motion**: only `animate-slide-up` is gated behind `@media (prefers-reduced-motion: no-preference)`. ComplianceWeatherCard, `animate-pulse-risk`, `animate-blob`, `animate-fade-in`, `animate-count-pulse`, `animate-gauge-fill`, `animate-fadeIn`, and the shimmer/glow variants are not gated. Long animation loops fire for users who requested reduced motion.

---

## Summary by severity

- **P0** (ship-blockers): 4 findings.
- **P1** (real inconsistencies): 9 findings.
- **P2** (tech debt): 10 findings.
- **P3** (nits): 4 findings.

**Total**: 27 findings.

**Recommended sequence**:
1. Fix P0-01 (`@theme` color prefix) — unblocks everything.
2. Delete or rebuild `DesignSystemView` (P0-02).
3. Decide react-hook-form future (P0-03).
4. Hardcoded hex sweep (P0-04).
5. Then attack the legacy-shadcn primitives one by one using tokens (Select, Textarea, Checkbox, Sheet, Calendar, Form, Table, Tooltip).
6. Contrast and keyboard-focus fixes (P1-08, P2-19) can ship independently.
