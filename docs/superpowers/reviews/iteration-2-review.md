# Iteration 2 Review

**Date**: 2026-05-05
**Branch**: feature/atlassian-ds-migration
**Reviewer**: Automated comprehensive audit (17 views, 10 criteria)

## Methodology

Each view was spot-checked against the 10-point rubric below. Evidence came from:

- `grep` for hardcoded hex colors (`#[0-9a-fA-F]{6}`) in production `src/features/` and `src/components/` (excluding `design-system/` showcase files, which display raw tokens intentionally).
- `grep` for legacy Tailwind utility classes: `bg-gray-*`, `text-gray-*`, `text-blue-*`, `text-red-*`, `shadow-sm/md/lg/xl`, `text-sm`, `text-lg`, `text-xs`, `text-xl`.
- `grep` for legacy design tokens: `--color-*`, `--font-size-sm`, `--font-size-3xl`.
- `grep` for emojis (`🏢📋⚠🔍🏛✅❌`) in production code.
- `grep` for Lucide icon imports (expected from `@/lib/lucide-icons`, not `lucide-react`).
- Targeted `Read` on 10 representative files (Dashboard, LocationDetail, LocationsListV2, LocationCardV2, PermitList, PermitDetail, Renewal, LegalReference, LegalCategoryDetail, Login, AuthCallback, Network, Settings, ProfileTab, PublicVerification, PermitCard, ShareLocationModal, IncrementalWizard, Stepper, AppLayout, App, Input, Dialog, Skeleton).

### Scoring Rubric (0-10 each)

1. **Tokens** — uses `--ds-*` tokens exclusively
2. **Icons** — Lucide via `@/lib/lucide-icons` only, no emojis
3. **Shadows** — uses `--ds-shadow-*` (no `shadow-sm/md/lg`)
4. **Spacing** — uses `--ds-space-*` (no magic `px-5`, `p-6`, `gap-4`)
5. **Typography** — uses `--ds-font-size-*` (no `text-sm`/`text-lg`)
6. **Interactive states** — hover/focus/active/focus-visible present
7. **Responsive** — mobile/tablet/desktop breakpoints
8. **Loading** — uses `SkeletonList`/`SkeletonCard` components
9. **Empty** — uses `EmptyState` component
10. **A11y** — keyboard nav, aria-*, role, focus-visible, `sr-only`

---

## Scores

| # | View | T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | Total |
|---|------|----|----|----|----|----|----|----|----|----|-----|-------|
| 1 | Dashboard (`DashboardView` + Widget + Map) | 10 | 10 | 9 | 10 | 10 | 8 | 9 | 10 | 10 | 6 | **92** |
| 2 | LocationsListViewV2 + LocationCardV2 | 5 | 10 | 4 | 7 | 5 | 8 | 9 | 8 | 10 | 5 | **71** |
| 3 | LocationDetailView + tabs | 10 | 10 | 8 | 10 | 10 | 8 | 9 | 7 | 8 | 6 | **86** |
| 4 | NetworkMapPage | 10 | 10 | 9 | 10 | 10 | 7 | 8 | 5 | 5 | 5 | **79** |
| 5 | PermitListView + Table + Filters | 10 | 10 | 9 | 10 | 10 | 9 | 9 | 5 | 10 | 7 | **89** |
| 6 | PermitDetailView + Timeline | 10 | 10 | 9 | 10 | 10 | 9 | 9 | 8 | 9 | 7 | **91** |
| 7 | RenewalGridView + MonthCard | 10 | 10 | 9 | 10 | 10 | 8 | 9 | 5 | 10 | 6 | **87** |
| 8 | LegalReferenceView + CategoryCard | 10 | 10 | 9 | 10 | 10 | 8 | 9 | 5 | 5 | 6 | **82** |
| 9 | LegalCategoryDetailView | 10 | 10 | 9 | 10 | 10 | 8 | 9 | 5 | 5 | 6 | **82** |
| 10 | LoginView | 10 | 10 | 10 | 10 | 10 | 9 | 10 | 8 | 10 | 8 | **95** |
| 11 | AuthCallback | 10 | 10 | 10 | 10 | 10 | 7 | 10 | 7 | 10 | 8 | **92** |
| 12 | IncrementalWizard + Stepper + Steps | 3 | 9 | 5 | 4 | 4 | 7 | 8 | 5 | 5 | 5 | **55** |
| 13 | SettingsView + tabs | 10 | 10 | 9 | 10 | 10 | 8 | 9 | 5 | 5 | 6 | **82** |
| 14 | PublicVerificationPage | 10 | 10 | 10 | 10 | 10 | 8 | 10 | 8 | 10 | 9 | **95** |
| 15 | UI components (`src/components/ui/*`) | 6 | 10 | 8 | 9 | 7 | 9 | 9 | 10 | 10 | 8 | **86** |
| 16 | App.tsx (routing + inline loaders) | 2 | 10 | 5 | 5 | 3 | 5 | 8 | 5 | 5 | 5 | **53** |
| 17 | AppLayout.tsx | 1 | 7 | 3 | 3 | 2 | 7 | 9 | 5 | 5 | 5 | **47** |

**Average**: **78.4 / 100**

The migration is solid for feature views built in Parts 4-17 but breaks badly at the **shell and entry points** (AppLayout, App.tsx, Onboarding) which were either deprioritized or only partially touched in Part 15.

---

## Weakest 20% — re-implement in polish pass

### 1. AppLayout.tsx — **47/100**

Primary shell wrapping the entire authenticated app. Currently all Tailwind, **zero `--ds-*` tokens** (grep: `0 occurrences`). Eighteen Tailwind hits. Imports icons from `lucide-react` (should be `@/lib/lucide-icons`).

- `src/components/layout/AppLayout.tsx:18` — imports icons directly from `lucide-react` instead of the project's `@/lib/lucide-icons` wrapper.
- `src/components/layout/AppLayout.tsx:133` — `bg-gray-50` (needs `bg-[var(--ds-neutral-50)]`).
- `src/components/layout/AppLayout.tsx:143,147,192` — sidebar `bg-white border-gray-100` (needs `--ds-surface` / `--ds-border`).
- `src/components/layout/AppLayout.tsx:149` — brand logo uses `bg-gradient-to-br from-blue-900 to-blue-800` (should use `--ds-background-brand`).
- `src/components/layout/AppLayout.tsx:153,154,169,185,199,229,231` — text sizes hardcoded: `text-sm`, `text-xs`, `text-lg` (needs `--ds-font-size-*`).
- `src/components/layout/AppLayout.tsx:178-182` — active nav uses `bg-blue-50 text-blue-900` (needs `--ds-background-brand-subtle` + `--ds-text-brand`).
- `src/components/layout/AppLayout.tsx:216` — `shadow-sm` (needs `--ds-shadow-raised`).
- `src/components/layout/AppLayout.tsx:240` — red notification dot `bg-red-500` hardcoded (needs `--ds-red-500`).
- No `aria-label` on hamburger toggle (line 221), notification button (line 238), or sign-out button (line 201-207).
- No `focus-visible` styles on any nav `<Link>` or `<button>`.

**Specific fix**: Full rewrite mapping Tailwind → `--ds-*` tokens, swap imports to `@/lib/lucide-icons`, add aria-labels and focus-visible states. This is the single highest-leverage fix because it's visible on every page.

---

### 2. App.tsx (inline loading states) — **53/100**

The router file itself contains **three duplicated loading spinners** that are fully Tailwind-based.

- `src/App.tsx:27-33`, `src/App.tsx:55-61`, `src/App.tsx:91-97` — three near-identical inline loaders using `bg-gradient-to-br from-gray-50 to-gray-100`, `border-blue-200 border-t-blue-600`, `text-sm text-gray-600`. None use `--ds-*` tokens.
- Duplication violates DRY — should be a single `<PageLoader />` UI component using `--ds-neutral-*` tokens and, ideally, `SkeletonList` or the `Spinner` pattern used in `AuthCallback.tsx`.
- No `role="status"` / `aria-live="polite"` / `sr-only` loading announcement on any of the three spinners.

**Specific fix**: Extract `<AppLoader message="..." />` component in `src/components/ui/` using `--ds-*` tokens + ARIA live region. Replace all 3 inline instances.

---

### 3. IncrementalWizard + Steps — **55/100**

The onboarding flow is the entry experience for new users — brand-critical. It's largely unmigrated.

- `src/features/onboarding-incremental/IncrementalWizard.tsx:139` — hardcoded hex `bg-[#F9FAFB]` (needs `--ds-neutral-50`).
- `src/features/onboarding-incremental/IncrementalWizard.tsx:141,143,146,147,154` — sidebar uses `bg-white border-gray-100/80`, `bg-gray-900`, `text-[15px]`, `text-[11px]`, `text-[12px] text-gray-400` (all should be tokens).
- `src/features/onboarding-incremental/IncrementalWizard.tsx:200-202` — error banner uses raw `bg-red-50 border-red-200 text-[13px] text-red-900` instead of the `<Banner variant="error">` component that exists in the UI library.
- `src/features/onboarding-incremental/IncrementalWizard.tsx:208` — footer uses `border-gray-100/80 bg-white/80 backdrop-blur-xl` (needs tokens).
- `src/features/onboarding-incremental/IncrementalWizard.tsx:212,227,241` — magic sizes `text-[13px] px-5 py-2.5 bg-gray-900 shadow-sm` — should use `<Button>` component. Ignores the design system entirely at the action layer.
- `src/features/onboarding-incremental/steps/ProfileStep.tsx`, `CompanyStep.tsx`, `LocationsStep.tsx` — **zero `--ds-*` occurrences** across all three step files; 34 Tailwind utility class hits combined (`grep -rn "bg-gray-|text-gray-|bg-blue-|text-blue-|bg-red-|text-red-|shadow-sm"` in steps dir).
- `src/features/onboarding-incremental/steps/LocationsStep.tsx:177` — `bg-gray-900 text-white shadow-sm` on a tab-like toggle.
- No `aria-current="step"` on stepper, no focus-visible on back/next buttons, no live region announcing step transitions.

**Specific fix**: Replace ad-hoc `<button>` elements with `<Button>`, swap error `<div>` for `<Banner>`, migrate all colors/sizes/shadows to `--ds-*`, add `aria-current="step"` to `Stepper.tsx`, rewrite the three step forms to use `<Card>`/`<Input>`/`<Label>` from the UI library.

---

### 4. LocationsListViewV2 — **71/100** (bonus fix — easy win)

This is technically above the 3-lowest cutoff but is flagged because it's the Sedes landing page and its loading/error branches were clearly missed when Part 5 landed.

- `src/features/locations/LocationsListViewV2.tsx:44` — loading branch uses `bg-[var(--color-surface)]` (legacy) and hardcoded `p-6 md:p-8 space-y-6 mb-8 gap-6`.
- `src/features/locations/LocationsListViewV2.tsx:61` — error branch `bg-background p-4 md:p-8 text-red-600 text-sm text-gray-500 bg-gray-900 hover:bg-gray-800`.
- `src/features/locations/LocationsListViewV2.tsx:116,121,122` — success branch still uses `bg-[var(--color-surface)]`, `text-[var(--font-size-3xl)]`, `text-[var(--font-size-sm)] text-[var(--color-text-secondary)]`. Empty branch (line 81) correctly uses `--ds-*` — the three branches are inconsistent.
- No `focus-visible` ring on the Sedes card `<Link>` wrapping each location.

**Specific fix**: Align all three branches (loading/error/success) on `--ds-*` tokens; use `<Banner variant="error">` for the error branch; add `focus-visible` on the card link.

---

## Systemic Issues Observed

1. **Legacy `--color-*` tokens still live** in `src/components/ui/input.tsx:13`, `label.tsx:8`, `dialog.tsx:39,89,103`, `skeleton.tsx:11,34`. These are shared primitives — migrating them gives every view a bump. Recommend a dedicated sub-pass.
2. **Public-facing `PermitCard.tsx` uses emojis** (`src/features/public-links/PermitCard.tsx:26-34` → `✅⚠️❌📋📄`) and Tailwind colors (`text-green-600`, `text-yellow-600`, `text-red-600`). This contradicts the "Lucide only, no emojis" rule for iteration 2. Included in PublicVerification score.
3. **`ShareLocationModal.tsx`** (lines 233, 238, 243) uses emojis `✅⚠️❌` and `text-green-600/yellow-600/red-600` in preview. Same fix pattern as `PermitCard`.
4. **Loading skeletons inconsistent**: `DashboardView`, `LocationsListViewV2` use `SkeletonList/Card`; `LocationDetailView`, `PermitDetailView`, `PermitListView`, `NetworkMapPage`, `LegalReferenceView`, `RenewalGridView`, `SettingsView` use inline `animate-pulse` divs or plain "Cargando..." text. Should be standardized.
5. **EmptyState coverage partial**: Used in Dashboard, Locations, Permits, Renewals. Missing in Legal (detail), Network map, Settings tabs, Public verification.
6. **A11y gaps broad**: Only 3 files have any `aria-*`/`role` attributes in `src/features/`. No `focus-visible` strategy is visible beyond what UI primitives provide by default.

---

## Next Steps

Dispatch **3 implementers in parallel** to fix the 3 weakest views (target +2 points minimum each):

1. **Implementer A — AppLayout migration** (47 → 75+): tokens, icons, aria, focus-visible.
2. **Implementer B — App.tsx page loader** (53 → 80+): extract `<AppLoader>`, replace 3 call sites, add ARIA live region.
3. **Implementer C — IncrementalWizard + steps** (55 → 80+): swap to `<Button>`/`<Banner>`/`<Input>`/`<Card>`, migrate all tokens, add `aria-current="step"`, use `<Stepper>` contract.

**Optional bonus** — Implementer D: LocationsListViewV2 branch alignment (71 → 85+) + public `PermitCard` emoji removal. These are small, high-visibility fixes that lift both the Sedes landing and the public brand surface.

After the parallel pass, re-run the `grep` audit to confirm:

```bash
# Expected: 0 matches in src/features (excluding design-system) and src/components (excluding AppLayout if still pending)
grep -rn "bg-gray-|text-gray-|bg-blue-|text-blue-|bg-red-|text-red-|shadow-sm|shadow-md|shadow-lg|text-sm|text-xs|text-lg|--color-|#[0-9a-fA-F]\{6\}" src/features src/components
```
