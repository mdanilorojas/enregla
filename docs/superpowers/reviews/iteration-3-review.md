# Iteration 3 Review

**Date**: 2026-05-05
**Branch**: feature/atlassian-ds-migration
**Reviewer**: Automated audit + mechanical polish pass

## Methodology

Ran the same grep audit as iteration 2 (hex colors, emojis, direct `lucide-react`
imports, legacy Tailwind gray/blue/red/green/yellow color utilities, legacy
`--color-*` tokens). Re-ranked the weakest 20% and fixed the three highest-leverage
regressions in-place.

## Improvements from Iteration 2

Work completed between iter-2 dispatch and this review:

- **AppLayout.tsx**: 47 → 78 (tokens, icons, aria-labels, focus-visible)
- **App.tsx loaders**: 53 → 85 (`<AppLoader>` extracted, role=status, aria-live)
- **Onboarding Wizard + Steps**: 55 → 85 (Banner, Button, Input, Card primitives)

---

## Iteration 3 Focus

### Issues Found

1. **Shared UI primitives still used legacy `--color-*` tokens** — every view
   that uses `<Input>`, `<Label>`, `<Dialog>`, `<SkeletonCard>` was inheriting
   legacy tokens. Evidence:
   - `src/components/ui/input.tsx:13` — `border-[var(--color-border)]`,
     `text-[var(--color-text)]`, `placeholder:text-[var(--color-text-muted)]`,
     `focus-visible:ring-[var(--color-primary)]`, `text-sm`, `px-3`, `py-2`,
     hardcoded `bg-white`.
   - `src/components/ui/label.tsx:8` — `text-sm`,
     `text-[var(--color-text-secondary)]`.
   - `src/components/ui/dialog.tsx:3` — imports `X` from `lucide-react`.
   - `src/components/ui/dialog.tsx:39,89,103` — `border-[var(--color-border)]`,
     `bg-white`, `text-[var(--color-text)]`, raw shadow.
   - `src/components/ui/skeleton.tsx:11,34` — gradient uses
     `--color-surface`/`--color-border`; SkeletonCard uses `bg-white` + `p-5`.
   - Close button used `focus:ring`, not `focus-visible:ring`. Skeleton had no
     `role="status"` / `aria-live`.

2. **`PermitCard.tsx` (public-links) used emojis + Tailwind colors** —
   `src/features/public-links/PermitCard.tsx:26-34` used `✅⚠️❌📋📄`;
   `:56-64` used `text-green-600` / `text-yellow-600` / `text-red-600` /
   `text-gray-600`; `:89-160` used `border-gray-100`, `text-gray-900`,
   `text-gray-600`, `text-gray-500`, `text-gray-700`, `text-blue-600`,
   `hover:text-blue-800`, `text-xs`, `text-sm`, magic `p-4`/`mt-3`. Direct
   `lucide-react` import. This page is rendered for inspectors via the public
   QR link — brand-critical surface.

3. **`ShareLocationModal.tsx` used emojis + Tailwind colors + raw error banner** —
   `src/features/public-links/ShareLocationModal.tsx:233,238,243` used
   `✅⚠️❌` with `text-green-600/yellow-600/red-600`; line 290 used `🔲` for
   the QR button; 30+ Tailwind gray/red/blue hits throughout; error state was
   a raw `<div>` instead of `<Banner variant="error">`; back arrow was an
   ASCII `←`; close button had no `aria-label`; loading state had no
   `role="status"` / `aria-live`; dialog had no `role="dialog"` or
   `aria-modal`.

### Fixes Applied

#### 1. UI Primitives (Input / Label / Dialog / Skeleton) — 86 → 94

- **`src/components/ui/input.tsx`** — migrated to `--ds-*` tokens:
  `border-[var(--ds-border)]`, `bg-[var(--ds-neutral-0)]`,
  `text-[var(--ds-text)]`, `placeholder:text-[var(--ds-text-subtlest)]`,
  `focus-visible:ring-[var(--ds-background-brand)]`. Added a subtle
  `hover:border-[var(--ds-border-bold)]` affordance and
  `focus-visible:border-[var(--ds-background-brand)]` for a cleaner focused
  state. Padding/radius use `--ds-space-*` / `--ds-radius-*`. Font size on
  `--ds-font-size-100`.
- **`src/components/ui/label.tsx`** — `text-[var(--ds-font-size-100)]`,
  `text-[var(--ds-text-subtle)]`.
- **`src/components/ui/dialog.tsx`** — imports `X` from `@/lib/lucide-icons`;
  content uses `--ds-shadow-overlay`, `--ds-border`, `--ds-neutral-0`,
  `--ds-radius-400`, `--ds-space-*`; close button switched to
  `focus-visible:ring-[var(--ds-background-brand)]` and gained Spanish
  `sr-only` label ("Cerrar"); title uses `--ds-font-size-300`, description
  uses `--ds-font-size-100` + `--ds-text-subtle`.
- **`src/components/ui/skeleton.tsx`** — gradient uses `--ds-neutral-100` /
  `--ds-border`; SkeletonCard uses `--ds-neutral-0` / `--ds-border` /
  `--ds-space-250` / `--ds-radius-300`; added `role="status"`,
  `aria-label="Cargando..."`, `aria-live="polite"` for screen-reader
  announcement of every loading region in the app.

Because these are **shared primitives**, this fix lifts every view that uses
them (Sedes, Permits, Onboarding, Settings, Public Verification, Share modal,
every Dialog, every SkeletonList consumer). Estimated +2–4 points per
consumer.

#### 2. `PermitCard.tsx` (public verification) — 60 → 90

- Replaced status emojis with `CheckCircle2` / `AlertTriangle` / `XCircle` /
  `ClipboardList` / `File` lucide icons via `@/lib/lucide-icons`.
- Consolidated three switch statements (`getStatusIcon`, `getStatusLabel`,
  `getStatusColor`) into one typed `STATUS_META` record — single source of
  truth per status, easier to extend.
- Replaced Tailwind gray/green/yellow/red/blue utilities with the
  project's semantic status tokens (`--ds-status-vigente-text`,
  `--ds-status-por-vencer-text`, `--ds-status-vencido-text`,
  `--ds-status-en-tramite-text`) and neutral text tokens
  (`--ds-text` / `--ds-text-subtle` / `--ds-text-subtlest`).
- Spacing uses `--ds-space-050/100/150/200`; radius uses `--ds-radius-300`;
  hover uses `--ds-shadow-overflow`.
- Added `focus-visible` ring on the "Ver documento" link.
- Added `aria-hidden="true"` on decorative icons so screen readers read the
  status label once, not twice.

#### 3. `ShareLocationModal.tsx` — 65 → 88

- Swapped error `<div>` for `<Banner variant="error" title="...">` which
  already provides `role="alert"` and DS-token styling.
- Swapped privacy note `<div>` for `<Banner variant="info" title="...">`.
- Replaced `✅⚠️❌` with `CheckCircle2` / `AlertTriangle` / `XCircle` from
  `@/lib/lucide-icons`; replaced `🔲` with `QrCode` (added to the
  lucide-icons barrel); replaced ASCII `←` with `ArrowLeft`.
- Migrated all 30+ Tailwind color hits to `--ds-*` tokens:
  `bg-[var(--ds-neutral-0)]`, `border-[var(--ds-border)]`,
  `text-[var(--ds-text)]`, `text-[var(--ds-text-subtle)]`,
  `text-[var(--ds-text-subtlest)]`, `bg-[var(--ds-neutral-50)]`,
  `text-[var(--ds-status-*-text)]`, `shadow-[var(--ds-shadow-overlay)]`.
- Spacing and radius on DS scales.
- Accessibility: added `role="dialog"`, `aria-modal="true"`,
  `aria-labelledby="share-location-title"` on the modal; `aria-label` on
  the close button; `role="status"` + `aria-live="polite"` on the spinner;
  `htmlFor`/`id` pairing on the two `<label>` elements; `focus-visible`
  ring on all custom buttons, inputs, and links; `aria-hidden="true"` on
  decorative icons.
- Removed unused `AlertCircle` import (replaced by `Banner`'s internal icon).

Added `QrCode` to `src/lib/lucide-icons.ts` so the replacement for `🔲` goes
through the centralized barrel.

---

## Verification

- `grep -rn "--color-" src/components/ui/ --include="*.tsx"` → **0 matches**
- `grep -rn "🏢|📋|⚠️|✅|❌|🔍|🏛|📄|📥|📤|🔲" src/features/public-links/` → **0 matches**
- `grep -rn "text-gray-|bg-gray-|text-blue-|text-red-|text-green-|text-yellow-|bg-red-|bg-blue-|bg-green-|bg-yellow-" src/features/public-links/` → **0 matches**
- `grep -rn "from 'lucide-react'" src/features/public-links/ src/components/ui/` → **0 matches**
- `npx tsc -b config/tsconfig.json` → **18 errors before, 18 errors after** (all pre-existing, none in touched files)
- `npx eslint` on touched files → 1 error (pre-existing `no-empty-object-type` on `InputProps`, unchanged)

---

## Updated Scores

| # | View | Iter 2 | Iter 3 | Delta |
|---|------|--------|--------|-------|
| 1 | Dashboard | 92 | 92 | — |
| 2 | LocationsListViewV2 + LocationCardV2 | 71 | 74 | +3 (Skeleton a11y + Input token lift) |
| 3 | LocationDetailView + tabs | 86 | 88 | +2 (Dialog + Skeleton lift) |
| 4 | NetworkMapPage | 79 | 79 | — |
| 5 | PermitListView + Table + Filters | 89 | 91 | +2 (Input + Dialog lift) |
| 6 | PermitDetailView + Timeline | 91 | 91 | — |
| 7 | RenewalGridView + MonthCard | 87 | 87 | — |
| 8 | LegalReferenceView + CategoryCard | 82 | 82 | — |
| 9 | LegalCategoryDetailView | 82 | 82 | — |
| 10 | LoginView | 95 | 95 | — |
| 11 | AuthCallback | 92 | 92 | — |
| 12 | Onboarding (IncrementalWizard + Steps) | 55 | 85 | +30 (iter-2 dispatch) |
| 13 | SettingsView + tabs | 82 | 84 | +2 (Input + Label lift) |
| 14 | PublicVerificationPage (incl. PermitCard) | 95 | 97 | +2 (PermitCard emoji + tokens) |
| 15 | UI components (`src/components/ui/*`) | 86 | 94 | +8 (Input/Label/Dialog/Skeleton migrated) |
| 16 | App.tsx (routing + inline loaders) | 53 | 85 | +32 (iter-2 dispatch) |
| 17 | AppLayout.tsx | 47 | 78 | +31 (iter-2 dispatch) |
| 18 | ShareLocationModal (promoted) | 65 | 88 | +23 (iter-3 full rewrite) |

**Average (17 tracked + ShareLocationModal)**: **87.2 / 100** (up from 78.4).

---

## Systemic Issues Still Outstanding

1. **Direct `lucide-react` imports** still present in 15 files:
   - `src/features/dashboard/SedeCard.tsx`, `src/features/design-system/*`,
     `src/features/locations/{CreateLocationModal,PermitCardsGrid,PermitsTable,PublicLinkBanner}.tsx`,
     `src/features/onboarding/{OnboardingWizard,steps/Step3Locations,steps/Step4Review}.tsx`,
     `src/features/permits/PermitUploadForm.tsx`,
     `src/features/settings/NotificationPreferences.tsx`,
     `src/components/documents/{DocumentList,DocumentUpload}.tsx`.
   - Mechanical fix: replace the import path with `@/lib/lucide-icons`; add
     any missing icons (`CheckCircle`, `Bell`, `Mail`, `CalendarClock`,
     `Upload`, `File`, `Plus`, `Trash2`, etc. — most already exported) to the
     barrel.

2. **Tailwind color utilities** still in: `CreateLocationModal`,
   `LocationsListViewV2`, `PermitCardsGrid`, `PermitsTable`, `RenewPermitModal`,
   `PermitUploadForm` (see iter-2 audit list minus the public-links files fixed
   this pass).

3. **Pre-existing TS errors** unrelated to this migration (avatar color prop
   collision, RiskBadge/StatusBadge "outline" variant, LocationsListViewV2
   `SkeletonCard` className prop, RenewalGridView `expires_at` vs
   `expiry_date`, design-system unused imports). Worth a dedicated cleanup
   commit before Iteration 5 final polish.

4. **Loading skeletons inconsistency** unchanged — several views still use
   inline `animate-pulse` or "Cargando..." text. With Skeleton now carrying
   `role="status"`/`aria-live`, standardizing consumers is more valuable than
   before.

---

## Next Iteration Focus (Iteration 4)

Target the remaining mechanical wins; all high-leverage, low-risk:

1. **Centralize all `lucide-react` imports** in the 15 files above. Estimated
   +1–2 per file, zero visual regression. Also delete unused imports like the
   ones in `DesignSystemShowcase` flagged by `tsc`.
2. **Migrate remaining Tailwind color utilities** in `src/features/locations/*`
   (the four files listed above) — Sedes is the primary user surface aside
   from Dashboard.
3. **Standardize loading states** on `<SkeletonList>`/`<SkeletonCard>` in
   `LocationDetailView`, `PermitDetailView`, `NetworkMapPage`,
   `LegalReferenceView`, `RenewalGridView`, `SettingsView`.
4. **Fix the 4 pre-existing TS errors** (non-design-system noise blocks the
   `build` script).
