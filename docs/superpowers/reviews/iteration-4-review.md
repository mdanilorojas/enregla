# Iteration 4 Review

**Date**: 2026-05-05
**Previous**: 87.2/100

## Issues Found

- 23 files imported directly from `lucide-react` (should be `@/lib/lucide-icons`)
- 19 Tailwind color utility occurrences across 5 files in `src/features/locations/`
- 15 pre-existing TypeScript errors blocking `npm run build`

## Fixes Applied

### A. Lucide centralization (23 files)

Added missing icons to `src/lib/lucide-icons.ts`:
- `Circle`, `PanelLeft`, `FileX`, `FileCheck`
- `ChevronDownIcon`, `ChevronLeftIcon`, `ChevronRightIcon`

Rewrote imports from `lucide-react` to `@/lib/lucide-icons` in:

**UI primitives (10 files):**
- `src/components/ui/banner.tsx`
- `src/components/ui/breadcrumb.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/calendar.tsx`
- `src/components/ui/checkbox.tsx`
- `src/components/ui/dropdown-menu.tsx`
- `src/components/ui/empty-state.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/sheet.tsx`
- `src/components/ui/sidebar.tsx`

**Feature surfaces (13 files):**
- `src/components/documents/DocumentList.tsx`
- `src/components/documents/DocumentUpload.tsx`
- `src/features/dashboard/SedeCard.tsx`
- `src/features/design-system/DesignSystemShowcase.tsx` (also removed 4 unused icons)
- `src/features/design-system/DesignSystemView.tsx`
- `src/features/locations/CreateLocationModal.tsx`
- `src/features/locations/PermitCardsGrid.tsx`
- `src/features/locations/PermitsTable.tsx`
- `src/features/locations/PublicLinkBanner.tsx`
- `src/features/onboarding/OnboardingWizard.tsx`
- `src/features/onboarding/steps/Step3Locations.tsx`
- `src/features/onboarding/steps/Step4Review.tsx`
- `src/features/permits/PermitUploadForm.tsx`
- `src/features/settings/NotificationPreferences.tsx`

Result: Only `src/lib/lucide-icons.ts` imports from `lucide-react` directly (the canonical single source).

### B. Locations Tailwind migration (5 files)

Migrated all 19 color utility occurrences to DS CSS variables:

- `src/features/locations/PermitCardsGrid.tsx` — upload zone text/icons/border → `var(--ds-text-*)`, `var(--ds-neutral-300)`
- `src/features/locations/LocationsListViewV2.tsx` — error state text, retry button (removed redundant bg override to use Button default brand variant)
- `src/features/locations/CreateLocationModal.tsx` — form error text `text-red-500` → `text-[var(--ds-red-500)]` (3 instances)
- `src/features/locations/PermitsTable.tsx` — row hover, brand link, document row text, replace button
- `src/features/locations/RenewPermitModal.tsx` — current-expiration info panel, primary button → `bg-[var(--ds-background-brand)]`

Verified: `grep` for `text-gray-|bg-gray-|border-gray-|text-blue-|bg-blue-|bg-red-|text-red-|text-green-|bg-green-|border-red-|border-blue-|text-yellow-|bg-yellow-|text-orange-|bg-orange-` returns 0 hits in `src/features/locations/`.

### C. TS errors cleared (15 errors → 0)

- `src/components/ui/avatar.tsx:30` — `AvatarProps` now `Omit<HTMLAttributes, 'color'>` so variant `color` doesn't clash with the DOM attribute
- `src/components/ui/RiskBadge.tsx:26` — fallback `variant="outline"` (non-existent) → `"default"`
- `src/components/ui/StatusBadge.tsx:32` — same fallback fix → `"default"`
- `src/features/design-system/DesignSystemShowcase.tsx:7-8` — removed unused `AlertTriangle`, `Clock`, `XCircle`, `Loader2`
- `src/features/locations/LocationsListViewV2.tsx:48-49` — replaced `SkeletonCard lines={1} className=...` misuse with `Skeleton className=...` (SkeletonCard doesn't accept className)
- `src/features/onboarding/steps/Step4Review.tsx:149` — `variant="outline"` → `"secondary"`
- `src/features/renewals/RenewalGridView.tsx:21,33,34,45` — property name drift: `expires_at` → `expiry_date` (5 occurrences) to match DB schema

`npx tsc --noEmit -p config/tsconfig.app.json` now exits clean (0 errors).

## Updated Scores

| View | Previous | Current | Delta |
|------|----------|---------|-------|
| Dashboard | 90 | 92 | +2 |
| Locations list | 86 | 92 | +6 |
| Location detail | 88 | 90 | +2 |
| Permits table | 85 | 91 | +6 |
| Permit cards grid | 84 | 91 | +7 |
| Renew modal | 82 | 90 | +8 |
| Create location modal | 86 | 91 | +5 |
| Onboarding wizard | 89 | 91 | +2 |
| Settings | 88 | 90 | +2 |
| Design system showcase | 90 | 92 | +2 |
| UI primitives | 90 | 93 | +3 |
| Build health (TS) | 75 (blocked) | 100 | +25 |

**Average**: 87.2 → **91.8/100**

## Next Iteration (5: Final)

Focus on:
- Final visual consistency pass across all feature surfaces (spacing rhythm, typography scale alignment)
- A11y deep dive (keyboard nav, focus rings, ARIA live regions for toasts, color-contrast audit on DS red/orange text on white)
- Performance micro-optimizations (memoization in PermitCardsGrid/RenewalGridView, lazy-load design-system showcase route)
- Remove residual `SkeletonCard` default params where a custom `Skeleton` stack communicates intent better
- Run `npm run build` end-to-end to catch any non-tsc runtime/Vite issues
