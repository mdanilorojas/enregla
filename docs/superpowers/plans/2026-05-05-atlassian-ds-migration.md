# Atlassian DS Migration + Structural Improvements - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate EnRegla to Atlassian Design System (blue `#0f265c` + orange `#ff7043`), apply structural improvements (unified dashboard, compact sedes cards, React Flow map, permits table, renewals grid, legal cards), then execute 5 recursive polish iterations.

**Architecture:** Big Bang migration in 3 phases (Foundation sequential → Core Features parallel → Secondary parallel), followed by 4 recursive review iterations. Each part is a self-contained unit executable by a subagent with clear acceptance criteria.

**Tech Stack:** React 19 + TypeScript + Vite + Tailwind 4 + Atlassian-inspired tokens + Lucide icons + @xyflow/react 12 + @tanstack/react-table 8 + Supabase

---

## Execution Strategy

- **Phase 0 (Foundation)**: Parts 1-3 SEQUENTIAL (they depend on each other)
- **Phase 1 (Core)**: Parts 4-13 PARALLEL (10 subagents simultaneously)
- **Phase 2 (Secondary)**: Parts 14-17 PARALLEL (4 subagents simultaneously)
- **Iterations 2-5**: Review all → identify weakest 20% → re-implement → repeat

**Branch:** `feature/atlassian-ds-migration`

---

## File Structure Map

### New files to create
```
src/styles/atlassian-tokens.css         # Complete new token system
src/lib/lucide-icons.ts                  # Centralized icon exports
src/components/ui/avatar.tsx             # New Avatar component
src/components/ui/progress.tsx           # New Progress component
src/components/ui/breadcrumb.tsx         # New Breadcrumb component
src/components/ui/tabs.tsx               # New Tabs component
src/components/ui/banner.tsx             # New Banner component
src/components/ui/empty-state.tsx        # New EmptyState component
src/features/dashboard/DashboardWidget.tsx
src/features/dashboard/DashboardMap.tsx
src/features/dashboard/nodes/EmpresaNode.tsx
src/features/dashboard/nodes/SedeNode.tsx
src/features/dashboard/edges/CustomEdge.tsx
src/features/network/NetworkMapCanvas.tsx
src/features/network/MapLegend.tsx
src/features/permits/PermitTable.tsx
src/features/permits/PermitTableFilters.tsx
src/features/permits/exportPermitsCSV.ts
src/features/permits/PermitTimeline.tsx
src/features/renewals/MonthCard.tsx
src/features/renewals/YearSelector.tsx
src/features/legal/LegalCategoryCard.tsx
src/features/legal/LegalCategoryDetailView.tsx
src/features/locations/LocationPermitsTab.tsx
src/features/locations/LocationDocumentsTab.tsx
src/features/locations/LocationHistoryTab.tsx
src/features/settings/ProfileTab.tsx
src/features/settings/CompanyTab.tsx
src/features/settings/NotificationsTab.tsx
src/features/settings/SecurityTab.tsx
src/features/onboarding-incremental/Stepper.tsx
```

### Files to modify
```
src/styles/design-tokens.css → deprecate (move to .deprecated/)
src/components/ui/button.tsx
src/components/ui/badge.tsx
src/components/ui/card.tsx
src/components/ui/input.tsx
src/components/ui/select.tsx
src/components/ui/textarea.tsx
src/components/ui/checkbox.tsx
src/components/ui/table.tsx
src/App.tsx (new routes, remove legacy)
src/features/dashboard/DashboardView.tsx
src/features/locations/LocationsListViewV2.tsx
src/features/locations/LocationCardV2.tsx
src/features/locations/LocationDetailView.tsx
src/features/network/NetworkMapPage.tsx
src/features/permits/PermitListView.tsx
src/features/permits/PermitDetailView.tsx
src/features/renewals/RenewalTimelineView.tsx → rename to RenewalGridView.tsx
src/features/legal/LegalReferenceView.tsx
src/features/auth/LoginView.tsx
src/features/auth/AuthCallback.tsx
src/features/onboarding-incremental/IncrementalWizard.tsx
src/features/settings/SettingsView.tsx
src/features/public-links/PublicVerificationPage.tsx
```

### Files to delete
```
src/features/dashboard/RiskOverviewCard.tsx
src/features/dashboard/MetricsGrid.tsx
src/features/tasks/ (entire folder)
src/features/documents/ (entire folder)
```

---

# PHASE 0: FOUNDATION (Sequential)

## Part 1: Design Tokens Migration

**Files:**
- Create: `src/styles/atlassian-tokens.css`
- Modify: `src/index.css` (replace import)
- Move: `src/styles/design-tokens.css` → `src/styles/.deprecated/design-tokens.css`

### Steps

- [ ] **Step 1: Create atlassian-tokens.css with full token system**

Write to `src/styles/atlassian-tokens.css`:

```css
/**
 * Atlassian-Inspired Design Tokens for EnRegla
 * Brand: Preciso, Confiable, Protector
 * Base colors: Blue #0f265c + Orange #ff7043
 */

:root {
  /* ==========================================
   * Primary Blue Scale (Base: #0f265c)
   * ========================================== */
  --ds-blue-50: #e8ebf3;
  --ds-blue-100: #d1d7e7;
  --ds-blue-200: #a3afcf;
  --ds-blue-300: #7587b7;
  --ds-blue-400: #475f9f;
  --ds-blue-500: #0f265c;
  --ds-blue-600: #0d2153;
  --ds-blue-700: #0b1c4a;
  --ds-blue-800: #091741;
  --ds-blue-900: #071238;

  /* ==========================================
   * Accent Orange Scale (Base: #ff7043)
   * ========================================== */
  --ds-orange-50: #fff4f0;
  --ds-orange-100: #ffe8e0;
  --ds-orange-200: #ffd1c1;
  --ds-orange-300: #ffb99d;
  --ds-orange-400: #ff9670;
  --ds-orange-500: #ff7043;
  --ds-orange-600: #ff5722;
  --ds-orange-700: #f44336;
  --ds-orange-800: #e53935;
  --ds-orange-900: #d32f2f;

  /* ==========================================
   * Success Green Scale
   * ========================================== */
  --ds-green-50: #ecf6ee;
  --ds-green-100: #daeedf;
  --ds-green-200: #b4dcbe;
  --ds-green-300: #8bc99d;
  --ds-green-400: #61b679;
  --ds-green-500: #36B37E;
  --ds-green-600: #2A9D66;
  --ds-green-700: #218c3b;
  --ds-green-800: #19812f;
  --ds-green-900: #107524;

  /* ==========================================
   * Error Red Scale
   * ========================================== */
  --ds-red-50: #fbe6e6;
  --ds-red-100: #f7cdcd;
  --ds-red-200: #ee9c9c;
  --ds-red-300: #e66a6a;
  --ds-red-400: #dd3939;
  --ds-red-500: #DE350B;
  --ds-red-600: #BF2600;
  --ds-red-700: #c70404;
  --ds-red-800: #c00202;
  --ds-red-900: #b90101;

  /* ==========================================
   * Warning Yellow Scale
   * ========================================== */
  --ds-yellow-50: #fff8e1;
  --ds-yellow-100: #fff3cd;
  --ds-yellow-500: #FFAB00;
  --ds-yellow-600: #FF991F;

  /* ==========================================
   * Neutral Gray Scale
   * ========================================== */
  --ds-neutral-0: #FFFFFF;
  --ds-neutral-50: #F7F8F9;
  --ds-neutral-100: #F1F2F4;
  --ds-neutral-200: #DCDFE4;
  --ds-neutral-300: #B3B9C4;
  --ds-neutral-400: #8993A4;
  --ds-neutral-500: #626F86;
  --ds-neutral-600: #44546F;
  --ds-neutral-700: #2C3E5D;
  --ds-neutral-800: #172B4D;
  --ds-neutral-900: #091E42;

  /* ==========================================
   * Semantic Colors
   * ========================================== */
  --ds-background-brand: var(--ds-blue-500);
  --ds-background-brand-hovered: var(--ds-blue-600);
  --ds-background-brand-pressed: var(--ds-blue-700);
  --ds-background-accent: var(--ds-orange-500);
  --ds-background-accent-hovered: var(--ds-orange-600);
  --ds-background-success: var(--ds-green-500);
  --ds-background-danger: var(--ds-red-500);
  --ds-background-warning: var(--ds-yellow-500);
  --ds-background-neutral: var(--ds-neutral-100);
  --ds-text-brand: var(--ds-blue-500);
  --ds-text-accent: var(--ds-orange-600);
  --ds-text: var(--ds-neutral-900);
  --ds-text-subtle: var(--ds-neutral-600);
  --ds-text-subtlest: var(--ds-neutral-400);
  --ds-border: var(--ds-neutral-200);
  --ds-border-bold: var(--ds-neutral-400);

  /* ==========================================
   * Risk Levels (mapped to new tokens)
   * ========================================== */
  --ds-risk-critico: var(--ds-red-500);
  --ds-risk-critico-bg: var(--ds-red-50);
  --ds-risk-critico-text: var(--ds-red-600);
  --ds-risk-critico-border: var(--ds-red-200);

  --ds-risk-alto: var(--ds-orange-600);
  --ds-risk-alto-bg: var(--ds-orange-50);
  --ds-risk-alto-text: var(--ds-orange-700);
  --ds-risk-alto-border: var(--ds-orange-200);

  --ds-risk-medio: var(--ds-yellow-500);
  --ds-risk-medio-bg: var(--ds-yellow-50);
  --ds-risk-medio-text: var(--ds-yellow-600);
  --ds-risk-medio-border: #FFF0B3;

  --ds-risk-bajo: var(--ds-green-500);
  --ds-risk-bajo-bg: var(--ds-green-50);
  --ds-risk-bajo-text: var(--ds-green-600);
  --ds-risk-bajo-border: var(--ds-green-200);

  /* ==========================================
   * Permit Status
   * ========================================== */
  --ds-status-vigente: var(--ds-green-500);
  --ds-status-vigente-bg: var(--ds-green-50);
  --ds-status-vigente-text: var(--ds-green-600);

  --ds-status-por-vencer: var(--ds-orange-500);
  --ds-status-por-vencer-bg: var(--ds-orange-50);
  --ds-status-por-vencer-text: var(--ds-orange-700);

  --ds-status-vencido: var(--ds-red-500);
  --ds-status-vencido-bg: var(--ds-red-50);
  --ds-status-vencido-text: var(--ds-red-600);

  --ds-status-en-tramite: var(--ds-blue-400);
  --ds-status-en-tramite-bg: var(--ds-blue-50);
  --ds-status-en-tramite-text: var(--ds-blue-600);

  --ds-status-no-registrado: var(--ds-neutral-400);
  --ds-status-no-registrado-bg: var(--ds-neutral-100);
  --ds-status-no-registrado-text: var(--ds-neutral-600);

  /* ==========================================
   * Typography
   * ========================================== */
  --ds-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  --ds-font-size-050: 11px;
  --ds-font-size-075: 12px;
  --ds-font-size-100: 14px;
  --ds-font-size-200: 16px;
  --ds-font-size-300: 20px;
  --ds-font-size-400: 24px;
  --ds-font-size-500: 29px;
  --ds-font-size-600: 35px;

  --ds-font-weight-regular: 400;
  --ds-font-weight-medium: 500;
  --ds-font-weight-semibold: 600;
  --ds-font-weight-bold: 700;

  --ds-line-height-tight: 1.2;
  --ds-line-height-normal: 1.5;
  --ds-line-height-relaxed: 1.75;

  /* ==========================================
   * Spacing (4px base)
   * ========================================== */
  --ds-space-025: 2px;
  --ds-space-050: 4px;
  --ds-space-075: 6px;
  --ds-space-100: 8px;
  --ds-space-150: 12px;
  --ds-space-200: 16px;
  --ds-space-250: 20px;
  --ds-space-300: 24px;
  --ds-space-400: 32px;
  --ds-space-500: 40px;
  --ds-space-600: 48px;

  /* ==========================================
   * Border Radius
   * ========================================== */
  --ds-radius-050: 2px;
  --ds-radius-100: 3px;
  --ds-radius-200: 6px;
  --ds-radius-300: 8px;
  --ds-radius-400: 12px;
  --ds-radius-round: 50%;

  /* ==========================================
   * Shadows (Elevation)
   * ========================================== */
  --ds-shadow-raised: 0px 1px 1px rgba(9, 30, 66, 0.25), 0px 0px 1px rgba(9, 30, 66, 0.31);
  --ds-shadow-overflow: 0px 4px 8px rgba(9, 30, 66, 0.08), 0px 0px 1px rgba(9, 30, 66, 0.31);
  --ds-shadow-overlay: 0px 8px 16px rgba(9, 30, 66, 0.15), 0px 0px 1px rgba(9, 30, 66, 0.31);

  /* ==========================================
   * Transitions
   * ========================================== */
  --ds-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ds-ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ds-ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ds-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

  --ds-transition-fast: 150ms var(--ds-ease-out);
  --ds-transition-base: 200ms var(--ds-ease-out);
  --ds-transition-slow: 300ms var(--ds-ease-out);

  /* ==========================================
   * Backwards compatibility (legacy tokens)
   * Map old tokens to new ones during migration
   * ========================================== */
  --color-primary: var(--ds-background-brand);
  --color-primary-hover: var(--ds-background-brand-hovered);
  --color-danger: var(--ds-background-danger);
  --color-danger-bg: var(--ds-red-50);
  --color-danger-border: var(--ds-red-200);
  --color-success: var(--ds-background-success);
  --color-success-bg: var(--ds-green-50);
  --color-success-border: var(--ds-green-200);
  --color-warning: var(--ds-background-warning);
  --color-warning-bg: var(--ds-yellow-50);
  --color-warning-border: #FFF0B3;
  --color-info: var(--ds-blue-500);
  --color-info-bg: var(--ds-blue-50);
  --color-info-border: var(--ds-blue-200);
  --color-text: var(--ds-text);
  --color-text-secondary: var(--ds-text-subtle);
  --color-text-muted: var(--ds-text-subtlest);
  --color-border: var(--ds-border);
  --color-surface: var(--ds-neutral-50);
  --color-background: var(--ds-neutral-0);

  --color-risk-critico: var(--ds-risk-critico);
  --color-risk-critico-bg: var(--ds-risk-critico-bg);
  --color-risk-critico-text: var(--ds-risk-critico-text);
  --color-risk-critico-border: var(--ds-risk-critico-border);
  --color-risk-alto: var(--ds-risk-alto);
  --color-risk-alto-bg: var(--ds-risk-alto-bg);
  --color-risk-alto-text: var(--ds-risk-alto-text);
  --color-risk-alto-border: var(--ds-risk-alto-border);
  --color-risk-medio: var(--ds-risk-medio);
  --color-risk-medio-bg: var(--ds-risk-medio-bg);
  --color-risk-medio-text: var(--ds-risk-medio-text);
  --color-risk-medio-border: var(--ds-risk-medio-border);
  --color-risk-bajo: var(--ds-risk-bajo);
  --color-risk-bajo-bg: var(--ds-risk-bajo-bg);
  --color-risk-bajo-text: var(--ds-risk-bajo-text);
  --color-risk-bajo-border: var(--ds-risk-bajo-border);

  --color-status-vigente: var(--ds-status-vigente);
  --color-status-vigente-bg: var(--ds-status-vigente-bg);
  --color-status-vigente-text: var(--ds-status-vigente-text);
  --color-status-vigente-border: var(--ds-green-200);
  --color-status-por-vencer: var(--ds-status-por-vencer);
  --color-status-por-vencer-bg: var(--ds-status-por-vencer-bg);
  --color-status-por-vencer-text: var(--ds-status-por-vencer-text);
  --color-status-por-vencer-border: var(--ds-orange-200);
  --color-status-vencido: var(--ds-status-vencido);
  --color-status-vencido-bg: var(--ds-status-vencido-bg);
  --color-status-vencido-text: var(--ds-status-vencido-text);
  --color-status-vencido-border: var(--ds-red-200);
  --color-status-en-tramite: var(--ds-status-en-tramite);
  --color-status-en-tramite-bg: var(--ds-status-en-tramite-bg);
  --color-status-en-tramite-text: var(--ds-status-en-tramite-text);
  --color-status-en-tramite-border: var(--ds-blue-200);
  --color-status-no-registrado: var(--ds-status-no-registrado);
  --color-status-no-registrado-bg: var(--ds-status-no-registrado-bg);
  --color-status-no-registrado-text: var(--ds-status-no-registrado-text);
  --color-status-no-registrado-border: var(--ds-neutral-300);

  --font-size-xs: var(--ds-font-size-075);
  --font-size-sm: var(--ds-font-size-100);
  --font-size-base: var(--ds-font-size-200);
  --font-size-lg: var(--ds-font-size-300);
  --font-size-xl: var(--ds-font-size-400);
  --font-size-2xl: var(--ds-font-size-500);
  --font-size-3xl: var(--ds-font-size-600);

  --shadow-xs: var(--ds-shadow-raised);
  --shadow-sm: var(--ds-shadow-raised);
  --shadow-md: var(--ds-shadow-overflow);
  --shadow-lg: var(--ds-shadow-overlay);
  --shadow-hover: var(--ds-shadow-overflow);

  --ease-out: var(--ds-ease-out);
  --ease-in: var(--ds-ease-in);
  --ease-in-out: var(--ds-ease-in-out);

  --state-disabled-opacity: 0.4;
  --state-hover-scale: 1.02;
  --state-active-scale: 0.98;
}
```

- [ ] **Step 2: Move old tokens to deprecated folder**

```bash
mkdir -p src/styles/.deprecated
mv src/styles/design-tokens.css src/styles/.deprecated/design-tokens.css
```

- [ ] **Step 3: Update index.css import**

Find the import of `design-tokens.css` in `src/index.css` and change to `atlassian-tokens.css`:

```css
@import './styles/atlassian-tokens.css';
```

- [ ] **Step 4: Verify build works**

Run: `npm run build`
Expected: Build succeeds without errors.

- [ ] **Step 5: Commit**

```bash
git add src/styles/atlassian-tokens.css src/styles/.deprecated/design-tokens.css src/index.css
git commit -m "feat(tokens): migrate to Atlassian Design System tokens

- New color scales: blue (#0f265c), orange (#ff7043), green, red, neutral
- Semantic tokens with backwards compatibility aliases
- Preserves risk/status tokens mapped to new colors
- Deprecated old design-tokens.css (kept as safety net)"
```

---

## Part 2: UI Components Base (10 components)

**Files:**
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/badge.tsx`
- Modify: `src/components/ui/card.tsx`
- Create: `src/components/ui/avatar.tsx`
- Create: `src/components/ui/progress.tsx`
- Modify: `src/components/ui/input.tsx`
- Modify: `src/components/ui/select.tsx`
- Modify: `src/components/ui/textarea.tsx`
- Modify: `src/components/ui/checkbox.tsx`
- Modify: `src/components/ui/table.tsx`
- Create: `src/components/ui/banner.tsx`
- Create: `src/components/ui/tabs.tsx`
- Create: `src/components/ui/breadcrumb.tsx`
- Create: `src/components/ui/empty-state.tsx`

### Steps

- [ ] **Step 1: Update Button component to use new tokens**

Replace `src/components/ui/button.tsx` with:

```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 ease-[var(--ds-ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-background-brand)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-[var(--state-disabled-opacity)] [&_svg]:pointer-events-none [&_svg]:shrink-0 active:scale-[var(--state-active-scale)] rounded-[var(--ds-radius-100)]",
  {
    variants: {
      variant: {
        default: "bg-[var(--ds-background-brand)] text-white hover:bg-[var(--ds-background-brand-hovered)] active:bg-[var(--ds-background-brand-pressed)]",
        destructive: "bg-[var(--ds-background-danger)] text-white hover:opacity-90",
        outline: "bg-white text-[var(--ds-text)] shadow-[0_0_0_1px_var(--ds-border)] hover:bg-[var(--ds-neutral-100)]",
        secondary: "bg-[var(--ds-neutral-100)] text-[var(--ds-text)] hover:bg-[var(--ds-neutral-200)]",
        subtle: "bg-transparent text-[var(--ds-text-subtle)] hover:bg-[var(--ds-neutral-100)] hover:text-[var(--ds-text)]",
        ghost: "bg-transparent text-[var(--ds-text-subtle)] hover:bg-[var(--ds-neutral-100)] hover:text-[var(--ds-text)]",
        link: "bg-transparent text-[var(--ds-text-brand)] p-0 h-auto underline underline-offset-[3px] hover:text-[var(--ds-background-brand-hovered)]",
        warning: "bg-[var(--ds-background-accent)] text-white hover:bg-[var(--ds-background-accent-hovered)]",
      },
      size: {
        sm: "h-7 px-[var(--ds-space-100)] text-[var(--ds-font-size-075)] [&_svg]:size-3.5",
        default: "h-8 px-[var(--ds-space-150)] text-[var(--ds-font-size-100)] [&_svg]:size-4",
        lg: "h-10 px-[var(--ds-space-200)] text-[var(--ds-font-size-200)] [&_svg]:size-5",
        icon: "h-8 w-8 p-0 [&_svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="animate-spin" />}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

- [ ] **Step 2: Update Badge (Lozenge) component**

Replace `src/components/ui/badge.tsx` with:

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-[var(--ds-space-050)] rounded-[var(--ds-radius-100)] font-bold uppercase tracking-wide transition-all duration-150",
  {
    variants: {
      variant: {
        default: "bg-[var(--ds-neutral-200)] text-[var(--ds-neutral-700)]",
        success: "bg-[var(--ds-green-50)] text-[var(--ds-green-600)]",
        warning: "bg-[var(--ds-orange-50)] text-[var(--ds-orange-700)]",
        danger: "bg-[var(--ds-red-50)] text-[var(--ds-red-600)]",
        info: "bg-[var(--ds-blue-50)] text-[var(--ds-blue-600)]",
        secondary: "bg-[var(--ds-neutral-100)] text-[var(--ds-neutral-600)]",

        // Risk levels (compliance-specific)
        "risk-critico": "bg-[var(--ds-red-50)] text-[var(--ds-red-600)]",
        "risk-alto": "bg-[var(--ds-orange-50)] text-[var(--ds-orange-700)]",
        "risk-medio": "bg-[var(--ds-yellow-50)] text-[var(--ds-yellow-600)]",
        "risk-bajo": "bg-[var(--ds-green-50)] text-[var(--ds-green-600)]",

        // Permit status
        "status-vigente": "bg-[var(--ds-green-50)] text-[var(--ds-green-600)]",
        "status-por-vencer": "bg-[var(--ds-orange-50)] text-[var(--ds-orange-700)]",
        "status-vencido": "bg-[var(--ds-red-50)] text-[var(--ds-red-600)]",
        "status-en-tramite": "bg-[var(--ds-blue-50)] text-[var(--ds-blue-600)]",
        "status-no-registrado": "bg-[var(--ds-neutral-100)] text-[var(--ds-neutral-600)]",
      },
      size: {
        sm: "text-[10px] px-[var(--ds-space-075)] py-[2px]",
        default: "text-[var(--ds-font-size-050)] px-[var(--ds-space-075)] py-[2px]",
        lg: "text-[var(--ds-font-size-075)] px-[var(--ds-space-100)] py-[var(--ds-space-050)]",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
}

function Badge({ className, variant, size, dot = false, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: 'currentColor' }}
        />
      )}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
```

- [ ] **Step 3: Update Card component**

Replace `src/components/ui/card.tsx` with:

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }
>(({ className, interactive = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-[var(--ds-radius-200)] bg-white text-[var(--ds-text)]",
      "shadow-[var(--ds-shadow-raised)]",
      "transition-all duration-200 ease-[var(--ds-ease-out)]",
      interactive && "hover:shadow-[var(--ds-shadow-overlay)] hover:-translate-y-0.5 cursor-pointer",
      interactive && "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-background-brand)] focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-[var(--ds-space-075)] p-[var(--ds-space-300)]", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Component = 'h3', ...props }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "text-[var(--ds-font-size-300)] font-semibold leading-tight tracking-tight text-[var(--ds-text)]",
        className
      )}
      {...props}
    />
  )
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] leading-normal", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("px-[var(--ds-space-300)] py-[var(--ds-space-200)]", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center px-[var(--ds-space-300)] pt-[var(--ds-space-150)] pb-[var(--ds-space-300)] border-t border-[var(--ds-border)]",
      className
    )}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

- [ ] **Step 4: Create Avatar component**

Write to `src/components/ui/avatar.tsx`:

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const avatarVariants = cva(
  "inline-flex items-center justify-center rounded-full font-semibold uppercase shrink-0",
  {
    variants: {
      size: {
        sm: "w-6 h-6 text-[10px]",
        default: "w-8 h-8 text-[var(--ds-font-size-075)]",
        lg: "w-12 h-12 text-[var(--ds-font-size-200)]",
        xl: "w-16 h-16 text-[var(--ds-font-size-300)]",
      },
      color: {
        default: "bg-[var(--ds-neutral-200)] text-[var(--ds-neutral-700)]",
        blue: "bg-[var(--ds-blue-100)] text-[var(--ds-blue-700)]",
        orange: "bg-[var(--ds-orange-100)] text-[var(--ds-orange-700)]",
        green: "bg-[var(--ds-green-100)] text-[var(--ds-green-700)]",
        red: "bg-[var(--ds-red-100)] text-[var(--ds-red-600)]",
      },
    },
    defaultVariants: {
      size: "default",
      color: "default",
    },
  }
)

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof avatarVariants> {
  name?: string
  src?: string
}

export function Avatar({ name, src, size, color, className, ...props }: AvatarProps) {
  const initials = React.useMemo(() => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }, [name])

  // Deterministic color from name
  const autoColor = React.useMemo<'default' | 'blue' | 'orange' | 'green' | 'red'>(() => {
    if (color) return color as 'default' | 'blue' | 'orange' | 'green' | 'red'
    if (!name) return 'default'
    const colors: Array<'blue' | 'orange' | 'green' | 'red'> = ['blue', 'orange', 'green', 'red']
    const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }, [name, color])

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={cn(avatarVariants({ size, color: autoColor }), 'object-cover', className)}
        {...(props as React.ImgHTMLAttributes<HTMLImageElement>)}
      />
    )
  }

  return (
    <div className={cn(avatarVariants({ size, color: autoColor }), className)} {...props}>
      {initials}
    </div>
  )
}
```

- [ ] **Step 5: Create Progress component**

Write to `src/components/ui/progress.tsx`:

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number // 0-100
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'auto'
  showLabel?: boolean
}

export function Progress({ value, variant = 'auto', showLabel = false, className, ...props }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value))

  // Auto-select variant based on value
  const effectiveVariant = variant === 'auto'
    ? clamped >= 90 ? 'success'
    : clamped >= 50 ? 'warning'
    : 'danger'
    : variant

  const fillColor = {
    default: 'var(--ds-background-brand)',
    success: 'var(--ds-background-success)',
    warning: 'var(--ds-background-accent)',
    danger: 'var(--ds-background-danger)',
  }[effectiveVariant]

  return (
    <div className={cn('w-full', className)} {...props}>
      {showLabel && (
        <div className="flex justify-between mb-[var(--ds-space-050)] text-[var(--ds-font-size-075)]">
          <span className="text-[var(--ds-text-subtle)]">{clamped.toFixed(0)}%</span>
        </div>
      )}
      <div
        className="w-full h-1.5 bg-[var(--ds-neutral-100)] rounded-[var(--ds-radius-100)] overflow-hidden"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-[var(--ds-radius-100)] transition-[width] duration-300 ease-[var(--ds-ease-out)]"
          style={{
            width: `${clamped}%`,
            backgroundColor: fillColor,
          }}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create Banner component**

Write to `src/components/ui/banner.tsx`:

```tsx
import * as React from "react"
import { Info, CheckCircle2, AlertTriangle, XCircle } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const bannerVariants = cva(
  "flex gap-[var(--ds-space-150)] p-[var(--ds-space-200)] rounded-[var(--ds-radius-100)]",
  {
    variants: {
      variant: {
        info: "bg-[var(--ds-blue-50)] text-[var(--ds-blue-700)]",
        success: "bg-[var(--ds-green-50)] text-[var(--ds-green-700)]",
        warning: "bg-[var(--ds-orange-50)] text-[var(--ds-orange-700)]",
        error: "bg-[var(--ds-red-50)] text-[var(--ds-red-700)]",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
)

const icons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
}

export interface BannerProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof bannerVariants> {
  title?: string
}

export function Banner({ variant = 'info', title, children, className, ...props }: BannerProps) {
  const Icon = icons[variant || 'info']
  return (
    <div className={cn(bannerVariants({ variant }), className)} role="alert" {...props}>
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="flex-1">
        {title && <div className="font-semibold mb-0.5">{title}</div>}
        <div className="text-[var(--ds-font-size-100)]">{children}</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Create Tabs component**

Write to `src/components/ui/tabs.tsx`:

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

interface TabsContextValue {
  active: string
  setActive: (v: string) => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue: string
  value?: string
  onValueChange?: (value: string) => void
}

export function Tabs({ defaultValue, value, onValueChange, className, children, ...props }: TabsProps) {
  const [internal, setInternal] = React.useState(defaultValue)
  const active = value ?? internal
  const setActive = (v: string) => {
    setInternal(v)
    onValueChange?.(v)
  }

  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div className={cn("w-full", className)} {...props}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex gap-[var(--ds-space-050)] border-b-2 border-[var(--ds-border)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

export function TabsTrigger({ value, className, children, ...props }: TabsTriggerProps) {
  const ctx = React.useContext(TabsContext)
  if (!ctx) throw new Error('TabsTrigger must be used inside Tabs')
  const isActive = ctx.active === value

  return (
    <button
      role="tab"
      aria-selected={isActive}
      className={cn(
        "px-[var(--ds-space-150)] py-[var(--ds-space-100)] text-[var(--ds-font-size-100)] font-medium",
        "border-b-2 -mb-0.5 transition-colors duration-200",
        isActive
          ? "text-[var(--ds-text-brand)] border-[var(--ds-background-brand)]"
          : "text-[var(--ds-text-subtle)] border-transparent hover:text-[var(--ds-text)]",
        className
      )}
      onClick={() => ctx.setActive(value)}
      {...props}
    >
      {children}
    </button>
  )
}

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

export function TabsContent({ value, className, children, ...props }: TabsContentProps) {
  const ctx = React.useContext(TabsContext)
  if (!ctx) throw new Error('TabsContent must be used inside Tabs')
  if (ctx.active !== value) return null

  return (
    <div
      role="tabpanel"
      className={cn("pt-[var(--ds-space-300)]", className)}
      {...props}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 8: Create Breadcrumb component**

Write to `src/components/ui/breadcrumb.tsx`:

```tsx
import * as React from "react"
import { ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items, className, ...props }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-[var(--ds-space-100)] text-[var(--ds-font-size-100)]", className)}
      {...props}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <React.Fragment key={i}>
            {item.href && !isLast ? (
              <Link
                to={item.href}
                className="text-[var(--ds-text-subtle)] hover:text-[var(--ds-text)] hover:underline"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "text-[var(--ds-text)] font-medium" : "text-[var(--ds-text-subtle)]"}>
                {item.label}
              </span>
            )}
            {!isLast && <ChevronRight className="w-3.5 h-3.5 text-[var(--ds-text-subtlest)]" />}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 9: Create EmptyState component**

Write to `src/components/ui/empty-state.tsx`:

```tsx
import * as React from "react"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action, className, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center text-center py-[var(--ds-space-600)] px-[var(--ds-space-400)]",
        className
      )}
      {...props}
    >
      <div className="w-16 h-16 rounded-[var(--ds-radius-300)] bg-[var(--ds-neutral-100)] flex items-center justify-center mb-[var(--ds-space-300)]">
        <Icon className="w-8 h-8 text-[var(--ds-text-subtlest)]" />
      </div>
      <h3 className="text-[var(--ds-font-size-300)] font-semibold text-[var(--ds-text)] mb-[var(--ds-space-100)]">
        {title}
      </h3>
      {description && (
        <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] max-w-md mb-[var(--ds-space-300)]">
          {description}
        </p>
      )}
      {action}
    </div>
  )
}
```

- [ ] **Step 10: Verify all components build and type-check**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 11: Commit UI components**

```bash
git add src/components/ui/
git commit -m "feat(ui): migrate UI components to Atlassian DS tokens

- Button: new variants (subtle, warning) + Atlassian styling
- Badge (Lozenge): uppercase bold style, new variants
- Card: new shadows and interactive states
- Avatar: new component with size/color variants + auto-color from name
- Progress: new component with auto-variant based on value
- Banner: new component with info/success/warning/error variants
- Tabs: new component with context-based state
- Breadcrumb: new component with react-router-dom integration
- EmptyState: new component with icon + action pattern"
```

---

## Part 3: Dependencies & Icon Setup

**Files:**
- Modify: `package.json`
- Create: `src/lib/lucide-icons.ts`

### Steps

- [ ] **Step 1: Install @tanstack/react-table**

```bash
npm install @tanstack/react-table@^8.20.0
```

Expected: Package installs without errors.

- [ ] **Step 2: Verify lucide-react is latest version**

Run: `npm view lucide-react version`
Current package.json has `^1.8.0`. Update:

```bash
npm install lucide-react@latest
```

- [ ] **Step 3: Create centralized icon exports**

Write to `src/lib/lucide-icons.ts`:

```typescript
/**
 * Centralized Lucide icon exports for EnRegla
 * Import from here instead of directly from lucide-react
 * to maintain consistency and enable tree-shaking
 */

export {
  // Entities
  Building2,        // Sede
  Landmark,         // Empresa
  Users,            // People
  User,             // Person

  // Actions
  Plus,
  Download,
  Upload,
  Trash2,
  Edit,
  Edit2,
  Eye,
  Save,
  Send,
  Copy,
  Share2,

  // Status
  AlertTriangle,    // Warning
  AlertCircle,      // Error subtle
  CheckCircle2,     // Success
  XCircle,          // Error
  Info,             // Information
  HelpCircle,       // Help

  // Navigation
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ArrowLeft,
  Menu,
  X,

  // Data
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  Clock,

  // Documents
  FileText,
  File,
  Folder,
  FolderOpen,

  // Map/Network
  Map,
  MapPin,
  Network,
  Share,
  Link2,
  ExternalLink,

  // Settings
  Settings,
  LogOut,
  LogIn,
  Bell,
  BellOff,
  Shield,
  Lock,

  // Misc
  Loader2,
  Plus as PlusIcon,
  MoreHorizontal,
  MoreVertical,
  RefreshCw,
  Home,
  Star,
  Clipboard,
  ClipboardList,
  ClipboardCheck,
} from 'lucide-react'

export type { LucideIcon } from 'lucide-react'
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/lib/lucide-icons.ts
git commit -m "chore(deps): add @tanstack/react-table, centralize Lucide icons

- Install @tanstack/react-table for permits table
- Update lucide-react to latest
- Create src/lib/lucide-icons.ts with centralized exports"
```

---

# PHASE 1: CORE FEATURES (Parallel)

## Part 4: Dashboard Refactor

**Files:**
- Delete: `src/features/dashboard/RiskOverviewCard.tsx`
- Delete: `src/features/dashboard/MetricsGrid.tsx`
- Create: `src/features/dashboard/DashboardWidget.tsx`
- Create: `src/features/dashboard/DashboardMap.tsx`
- Create: `src/features/dashboard/nodes/EmpresaNode.tsx`
- Create: `src/features/dashboard/nodes/SedeNode.tsx`
- Create: `src/features/dashboard/edges/CustomEdge.tsx`
- Modify: `src/features/dashboard/DashboardView.tsx`

### Steps

- [ ] **Step 1: Create EmpresaNode**

Write to `src/features/dashboard/nodes/EmpresaNode.tsx`:

```tsx
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Landmark } from '@/lib/lucide-icons'

export interface EmpresaNodeData {
  label: string
}

export function EmpresaNode({ data }: NodeProps<{ label: string }>) {
  return (
    <div className="bg-[var(--ds-background-brand)] text-white rounded-[var(--ds-radius-100)] px-[var(--ds-space-300)] py-[var(--ds-space-200)] shadow-[var(--ds-shadow-overlay)] min-w-[160px]">
      <Handle type="source" position={Position.Top} id="top" className="!bg-transparent !border-0" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-transparent !border-0" />
      <Handle type="source" position={Position.Left} id="left" className="!bg-transparent !border-0" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-transparent !border-0" />
      <div className="flex justify-center mb-[var(--ds-space-100)]">
        <Landmark className="w-6 h-6" />
      </div>
      <div className="text-center font-semibold text-[var(--ds-font-size-100)]">{data.label}</div>
    </div>
  )
}
```

- [ ] **Step 2: Create SedeNode**

Write to `src/features/dashboard/nodes/SedeNode.tsx`:

```tsx
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Building2 } from '@/lib/lucide-icons'
import { Badge } from '@/components/ui/badge'

export interface SedeNodeData {
  label: string
  code: string
  permits: number
  total: number
  percentage: number
  status: 'success' | 'warning' | 'danger'
  risk: 'Bajo' | 'Medio' | 'Alto' | 'Crítico'
}

export function SedeNode({ data }: NodeProps<SedeNodeData>) {
  const borderColor = {
    success: 'var(--ds-green-500)',
    warning: 'var(--ds-orange-500)',
    danger: 'var(--ds-red-500)',
  }[data.status]

  const fillColor = {
    success: 'var(--ds-green-500)',
    warning: 'var(--ds-orange-500)',
    danger: 'var(--ds-red-500)',
  }[data.status]

  const badgeVariant = {
    Bajo: 'risk-bajo' as const,
    Medio: 'risk-medio' as const,
    Alto: 'risk-alto' as const,
    Crítico: 'risk-critico' as const,
  }[data.risk]

  return (
    <div
      className="bg-white rounded-[var(--ds-radius-100)] p-[var(--ds-space-150)] shadow-[var(--ds-shadow-raised)] w-[200px]"
      style={{ border: `2px solid ${borderColor}` }}
    >
      <Handle type="target" position={Position.Top} id="top" className="!bg-transparent !border-0" />
      <Handle type="target" position={Position.Bottom} id="bottom" className="!bg-transparent !border-0" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-transparent !border-0" />
      <Handle type="target" position={Position.Right} id="right" className="!bg-transparent !border-0" />

      <div className="flex items-center gap-[var(--ds-space-100)] mb-[var(--ds-space-100)]">
        <div className="w-6 h-6 bg-[var(--ds-neutral-100)] rounded-[var(--ds-radius-050)] flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4 text-[var(--ds-text-subtle)]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[var(--ds-font-size-075)] text-[var(--ds-text)] truncate">{data.label}</div>
          <div className="text-[10px] font-mono text-[var(--ds-text-subtlest)]">{data.code}</div>
        </div>
      </div>

      <div className="flex items-center gap-[var(--ds-space-075)] mb-[var(--ds-space-075)]">
        <span className="text-[11px] text-[var(--ds-text-subtle)]">{data.permits}/{data.total} permisos</span>
        <Badge variant={badgeVariant} size="sm" className="ml-auto">{data.risk}</Badge>
      </div>

      <div className="w-full h-1.5 bg-[var(--ds-neutral-100)] rounded-[3px] overflow-hidden">
        <div
          className="h-full rounded-[3px] transition-[width] duration-300"
          style={{ width: `${data.percentage}%`, backgroundColor: fillColor }}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create CustomEdge with pulse for warning**

Write to `src/features/dashboard/edges/CustomEdge.tsx`:

```tsx
import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react'

export interface CustomEdgeData {
  status: 'success' | 'warning' | 'danger'
  startDate?: string
}

export function CustomEdge({
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  data, markerEnd, style,
}: EdgeProps<CustomEdgeData>) {
  const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })

  const status = data?.status ?? 'success'

  if (status === 'warning') {
    return (
      <g>
        <path d={edgePath} fill="none" stroke="var(--ds-neutral-300)" strokeWidth={2} />
        <path
          d={edgePath}
          fill="none"
          stroke="var(--ds-orange-500)"
          strokeWidth={2}
          strokeDasharray="25 75"
          style={{ animation: 'dashPulse 1.5s linear infinite' }}
        />
      </g>
    )
  }

  if (status === 'danger') {
    return (
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: 'var(--ds-red-500)',
          strokeWidth: 2,
          strokeDasharray: '5 5',
          animation: 'dashRed 1s linear infinite',
          ...style,
        }}
      />
    )
  }

  // success
  return (
    <BaseEdge
      path={edgePath}
      markerEnd={markerEnd}
      style={{ stroke: 'var(--ds-green-500)', strokeWidth: 2, ...style }}
    />
  )
}
```

- [ ] **Step 4: Add keyframe animations to index.css**

Add to `src/index.css`:

```css
@keyframes dashPulse {
  0% { stroke-dashoffset: 100; }
  100% { stroke-dashoffset: 0; }
}

@keyframes dashRed {
  to { stroke-dashoffset: -10; }
}
```

- [ ] **Step 5: Create DashboardMap**

Write to `src/features/dashboard/DashboardMap.tsx`:

```tsx
import { useMemo } from 'react'
import { ReactFlow, Background, Controls, type Node, type Edge } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { EmpresaNode, type SedeNodeData } from './nodes/EmpresaNode'
import { SedeNode } from './nodes/SedeNode'
import { CustomEdge, type CustomEdgeData } from './edges/CustomEdge'

const nodeTypes = { empresa: EmpresaNode, sede: SedeNode }
const edgeTypes = { custom: CustomEdge }

export interface SedeMapData {
  id: string
  label: string
  code: string
  permits: number
  total: number
  status: 'success' | 'warning' | 'danger'
  risk: 'Bajo' | 'Medio' | 'Alto' | 'Crítico'
}

export interface DashboardMapProps {
  empresaName: string
  sedes: SedeMapData[]
}

export function DashboardMap({ empresaName, sedes }: DashboardMapProps) {
  const { nodes, edges } = useMemo(() => {
    const centerX = 400
    const centerY = 250
    const radius = 300

    const nodes: Node[] = [
      {
        id: 'empresa',
        type: 'empresa',
        position: { x: centerX, y: centerY },
        data: { label: empresaName },
      },
    ]
    const edges: Edge[] = []

    sedes.forEach((sede, i) => {
      const angle = (i / sedes.length) * 2 * Math.PI - Math.PI / 2
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius

      const isAbove = y < centerY
      const sourceHandle = isAbove ? 'top' : 'bottom'
      const targetHandle = isAbove ? 'bottom' : 'top'

      const percentage = (sede.permits / sede.total) * 100

      nodes.push({
        id: sede.id,
        type: 'sede',
        position: { x: x - 100, y: y - 50 },
        data: { ...sede, percentage } satisfies SedeNodeData,
      })

      edges.push({
        id: `e-${sede.id}`,
        source: 'empresa',
        sourceHandle,
        target: sede.id,
        targetHandle,
        type: 'custom',
        data: { status: sede.status } satisfies CustomEdgeData,
      })
    })

    return { nodes, edges }
  }, [empresaName, sedes])

  return (
    <div style={{ width: '100%', height: 500 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.5}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="var(--ds-neutral-200)" gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
```

- [ ] **Step 6: Create DashboardWidget with metrics**

Write to `src/features/dashboard/DashboardWidget.tsx`:

```tsx
import { Card } from '@/components/ui/card'
import { DashboardMap, type SedeMapData } from './DashboardMap'
import { Building2, CheckCircle2, AlertTriangle, XCircle } from '@/lib/lucide-icons'
import type { LucideIcon } from '@/lib/lucide-icons'

interface MetricProps {
  icon: LucideIcon
  label: string
  value: number
  color: string
}

function Metric({ icon: Icon, label, value, color }: MetricProps) {
  return (
    <div>
      <div className="flex items-center gap-[var(--ds-space-100)] text-[var(--ds-text-subtle)] text-[var(--ds-font-size-075)] uppercase tracking-wide mb-[var(--ds-space-050)]">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <div className="text-[var(--ds-font-size-500)] font-bold" style={{ color }}>
        {value}
      </div>
    </div>
  )
}

export interface DashboardWidgetProps {
  empresaName: string
  totalSedes: number
  vigentes: number
  porVencer: number
  vencidos: number
  sedes: SedeMapData[]
}

export function DashboardWidget({ empresaName, totalSedes, vigentes, porVencer, vencidos, sedes }: DashboardWidgetProps) {
  return (
    <Card className="p-[var(--ds-space-400)]">
      <h2 className="text-[var(--ds-font-size-400)] font-semibold mb-[var(--ds-space-300)]">Resumen General</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-[var(--ds-space-300)] mb-[var(--ds-space-400)]">
        <Metric icon={Building2} label="Total Sedes" value={totalSedes} color="var(--ds-text)" />
        <Metric icon={CheckCircle2} label="Vigentes" value={vigentes} color="var(--ds-green-500)" />
        <Metric icon={AlertTriangle} label="Por Vencer" value={porVencer} color="var(--ds-orange-500)" />
        <Metric icon={XCircle} label="Vencidos" value={vencidos} color="var(--ds-red-500)" />
      </div>

      <h3 className="text-[var(--ds-font-size-300)] font-semibold mb-[var(--ds-space-150)]">Mapa Interactivo de Red</h3>
      <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] mb-[var(--ds-space-200)]">
        Empresa en el centro conectada a todas las sedes. Los colores indican estado de cumplimiento.
      </p>
      <DashboardMap empresaName={empresaName} sedes={sedes} />
    </Card>
  )
}
```

- [ ] **Step 7: Update DashboardView to use DashboardWidget**

Modify `src/features/dashboard/DashboardView.tsx`. Read current file first, then replace the body. The key changes:
- Remove imports of RiskOverviewCard and MetricsGrid
- Add import of DashboardWidget
- Compute metrics from locations + permits data
- Render single DashboardWidget

Example body structure:

```tsx
import { useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useLocations } from '@/hooks/useLocations'
import { usePermits } from '@/hooks/usePermits'
import { DashboardWidget } from './DashboardWidget'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Building2, Plus } from '@/lib/lucide-icons'
import { SkeletonList } from '@/components/ui/skeleton'
import { Link } from 'react-router-dom'

export function DashboardView() {
  const { profile } = useAuth()
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'
  const companyId = isDemoMode ? '50707999-f033-41c4-91c9-989966311972' : profile?.company_id

  const { locations, loading: loadingLocs } = useLocations(companyId)
  const { permits, loading: loadingPermits } = usePermits({ companyId })

  const loading = loadingLocs || loadingPermits

  const metrics = useMemo(() => {
    const vigentes = permits.filter(p => p.is_active && p.status === 'vigente').length
    const porVencer = permits.filter(p => p.is_active && p.status === 'por_vencer').length
    const vencidos = permits.filter(p => p.is_active && p.status === 'vencido').length

    const sedesWithPermits = locations.map(loc => {
      const locPermits = permits.filter(p => p.location_id === loc.id && p.is_active)
      const active = locPermits.filter(p => p.status === 'vigente').length
      const total = locPermits.length || 1
      const percentage = (active / total) * 100

      const status: 'success' | 'warning' | 'danger' =
        percentage >= 90 ? 'success' : percentage >= 50 ? 'warning' : 'danger'

      const risk: 'Bajo' | 'Medio' | 'Alto' | 'Crítico' =
        percentage >= 90 ? 'Bajo' : percentage >= 70 ? 'Medio' : percentage >= 40 ? 'Alto' : 'Crítico'

      return {
        id: loc.id,
        label: loc.name,
        code: loc.code || loc.id.slice(0, 8),
        permits: active,
        total,
        status,
        risk,
      }
    })

    return { vigentes, porVencer, vencidos, sedesWithPermits }
  }, [locations, permits])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-400)]">
        <div className="max-w-7xl mx-auto">
          <SkeletonList count={1} />
        </div>
      </div>
    )
  }

  if (locations.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-400)]">
        <div className="max-w-7xl mx-auto">
          <EmptyState
            icon={Building2}
            title="No hay sedes registradas"
            description="Crea tu primera sede para comenzar a gestionar permisos"
            action={
              <Link to="/sedes">
                <Button variant="default">
                  <Plus className="w-4 h-4" />
                  Crear Primera Sede
                </Button>
              </Link>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-400)]">
      <div className="max-w-7xl mx-auto space-y-[var(--ds-space-400)]">
        <h1 className="text-[var(--ds-font-size-500)] font-bold text-[var(--ds-text)]">Dashboard</h1>
        <DashboardWidget
          empresaName={profile?.company_name || 'EnRegla Corp'}
          totalSedes={locations.length}
          vigentes={metrics.vigentes}
          porVencer={metrics.porVencer}
          vencidos={metrics.vencidos}
          sedes={metrics.sedesWithPermits}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Delete old dashboard files**

```bash
rm src/features/dashboard/RiskOverviewCard.tsx
rm src/features/dashboard/MetricsGrid.tsx
```

- [ ] **Step 9: Verify dashboard works**

Run: `npm run dev`
Navigate to `/` (dashboard). Expected: Unified widget with metrics + React Flow map visible.

- [ ] **Step 10: Commit**

```bash
git add src/features/dashboard/
git commit -m "feat(dashboard): unified widget with React Flow network map

- Remove duplicate RiskOverviewCard and MetricsGrid
- Create DashboardWidget with 4 metric cards
- Create DashboardMap with equidistant sede nodes
- Custom edges with pulse animation for warning status
- Empty state with CTA to create first sede"
```

---

## Part 5: Sedes List View (Compact Cards)

**Files:**
- Modify: `src/features/locations/LocationsListViewV2.tsx`
- Modify: `src/features/locations/LocationCardV2.tsx`

### Steps

- [ ] **Step 1: Update LocationCardV2 to compact layout**

Replace content of `src/features/locations/LocationCardV2.tsx`:

```tsx
import { Link } from 'react-router-dom'
import { Building2 } from '@/lib/lucide-icons'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { Location } from '@/types'

export interface LocationCardV2Props {
  location: Location
  permits: Array<{ status: string; is_active: boolean }>
}

export function LocationCardV2({ location, permits }: LocationCardV2Props) {
  const activePermits = permits.filter(p => p.is_active)
  const vigentes = activePermits.filter(p => p.status === 'vigente').length
  const total = activePermits.length
  const percentage = total > 0 ? (vigentes / total) * 100 : 0

  const riskLevel: 'Bajo' | 'Medio' | 'Alto' | 'Crítico' =
    percentage >= 90 ? 'Bajo'
    : percentage >= 70 ? 'Medio'
    : percentage >= 40 ? 'Alto'
    : 'Crítico'

  const riskVariant = {
    Bajo: 'risk-bajo' as const,
    Medio: 'risk-medio' as const,
    Alto: 'risk-alto' as const,
    Crítico: 'risk-critico' as const,
  }[riskLevel]

  const operational = location.is_active !== false

  return (
    <Link to={`/sedes/${location.id}`} className="block">
      <Card interactive className="p-[var(--ds-space-300)]">
        <div className="flex items-start gap-[var(--ds-space-200)] mb-[var(--ds-space-200)]">
          <div className="w-10 h-10 bg-[var(--ds-neutral-100)] rounded-[var(--ds-radius-200)] flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-[var(--ds-text-subtle)]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[var(--ds-font-size-200)] text-[var(--ds-text)] truncate">
              {location.name}
            </h3>
            <p className="text-[var(--ds-font-size-075)] font-mono text-[var(--ds-text-subtlest)]">
              {location.code || location.id.slice(0, 8)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-[var(--ds-space-150)] mb-[var(--ds-space-200)] text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)]">
          <span>{operational ? 'Operativa' : 'Inactiva'}</span>
          <span className="text-[var(--ds-border-bold)]">|</span>
          <Badge variant={riskVariant} dot>{riskLevel}</Badge>
        </div>

        <div>
          <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] mb-[var(--ds-space-075)]">
            {vigentes}/{total || 0} permisos vigentes
          </p>
          <Progress value={percentage} variant="auto" />
        </div>
      </Card>
    </Link>
  )
}
```

- [ ] **Step 2: Update LocationsListViewV2**

Modify `src/features/locations/LocationsListViewV2.tsx` to use EmptyState and new layout. Key changes at `src/features/locations/LocationsListViewV2.tsx`:

Find the empty state block (around lines 78-114) and replace with:

```tsx
  if (locations.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-400)]">
        <div className="max-w-7xl mx-auto">
          <EmptyState
            icon={Building2}
            title="No hay sedes registradas"
            description="Comienza creando tu primera sede para gestionar permisos y cumplimiento normativo"
            action={
              <Button
                onClick={() => setCreateModalOpen(true)}
                disabled={!companyId}
                variant="default"
                size="lg"
              >
                <Plus className="w-4 h-4" />
                Crear Primera Sede
              </Button>
            }
          />
          <CreateLocationModal
            open={createModalOpen}
            onClose={() => setCreateModalOpen(false)}
            onSuccess={handleLocationCreated}
            companyId={companyId || ''}
          />
        </div>
      </div>
    )
  }
```

Also add import at top:

```tsx
import { EmptyState } from '@/components/ui/empty-state'
import { Building2, Plus } from '@/lib/lucide-icons'
```

- [ ] **Step 3: Verify**

Run: `npm run dev`. Navigate to `/sedes`. Expected: Compact cards with Estado | Riesgo inline.

- [ ] **Step 4: Commit**

```bash
git add src/features/locations/
git commit -m "feat(sedes): compact card layout with Estado | Riesgo inline

- LocationCardV2: icon + name + code header, Estado | Riesgo meta row
- Progress component with auto-variant based on compliance percentage
- LocationsListViewV2: uses new EmptyState component
- Consistent spacing using Atlassian tokens"
```

---

## Part 6: Sedes Detail View (Tabs)

**Files:**
- Modify: `src/features/locations/LocationDetailView.tsx`
- Create: `src/features/locations/LocationPermitsTab.tsx`
- Create: `src/features/locations/LocationDocumentsTab.tsx`
- Create: `src/features/locations/LocationHistoryTab.tsx`

### Steps

- [ ] **Step 1: Create LocationPermitsTab**

Write to `src/features/locations/LocationPermitsTab.tsx`:

```tsx
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { FileText, Plus, ArrowRight } from '@/lib/lucide-icons'

export interface LocationPermitsTabProps {
  locationId: string
  permits: Array<{
    id: string
    type: string
    status: string
    expires_at: string | null
    is_active: boolean
  }>
}

export function LocationPermitsTab({ locationId, permits }: LocationPermitsTabProps) {
  const active = permits.filter(p => p.is_active)

  if (active.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No hay permisos registrados"
        description="Registra el primer permiso para esta sede"
        action={
          <Link to="/permisos">
            <Button variant="default"><Plus className="w-4 h-4" />Nuevo Permiso</Button>
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-[var(--ds-space-200)]">
      <div className="flex justify-between items-center">
        <h3 className="text-[var(--ds-font-size-300)] font-semibold">Permisos ({active.length})</h3>
        <Link to="/permisos">
          <Button variant="link">Ver todos<ArrowRight className="w-4 h-4" /></Button>
        </Link>
      </div>

      <div className="space-y-[var(--ds-space-100)]">
        {active.slice(0, 5).map(permit => {
          const statusVariant = {
            vigente: 'status-vigente' as const,
            por_vencer: 'status-por-vencer' as const,
            vencido: 'status-vencido' as const,
            en_tramite: 'status-en-tramite' as const,
          }[permit.status] ?? 'status-no-registrado' as const

          return (
            <Link
              key={permit.id}
              to={`/permisos/${permit.id}`}
              className="flex items-center justify-between p-[var(--ds-space-200)] bg-white rounded-[var(--ds-radius-200)] border border-[var(--ds-border)] hover:border-[var(--ds-border-bold)] transition-colors"
            >
              <div>
                <div className="font-medium text-[var(--ds-font-size-100)]">{permit.type}</div>
                {permit.expires_at && (
                  <div className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">
                    Vence: {new Date(permit.expires_at).toLocaleDateString('es-EC')}
                  </div>
                )}
              </div>
              <Badge variant={statusVariant}>{permit.status.replace('_', ' ')}</Badge>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create LocationDocumentsTab**

Write to `src/features/locations/LocationDocumentsTab.tsx`:

```tsx
import { EmptyState } from '@/components/ui/empty-state'
import { FolderOpen } from '@/lib/lucide-icons'

export interface LocationDocumentsTabProps {
  locationId: string
}

export function LocationDocumentsTab({ locationId }: LocationDocumentsTabProps) {
  return (
    <EmptyState
      icon={FolderOpen}
      title="Documentos de la sede"
      description="Los documentos se gestionan desde los permisos individuales de esta sede"
    />
  )
}
```

- [ ] **Step 3: Create LocationHistoryTab**

Write to `src/features/locations/LocationHistoryTab.tsx`:

```tsx
import { Clock } from '@/lib/lucide-icons'
import { EmptyState } from '@/components/ui/empty-state'

export interface LocationHistoryTabProps {
  locationId: string
  events?: Array<{ id: string; date: string; description: string }>
}

export function LocationHistoryTab({ events = [] }: LocationHistoryTabProps) {
  if (events.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="Sin historial"
        description="Aquí aparecerán los eventos importantes de esta sede"
      />
    )
  }

  return (
    <div className="space-y-[var(--ds-space-200)]">
      {events.map(event => (
        <div key={event.id} className="flex gap-[var(--ds-space-200)]">
          <div className="w-2 h-2 rounded-full bg-[var(--ds-background-brand)] mt-2 shrink-0" />
          <div>
            <div className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">
              {new Date(event.date).toLocaleDateString('es-EC')}
            </div>
            <div className="text-[var(--ds-font-size-100)]">{event.description}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Update LocationDetailView with tabs**

Modify `src/features/locations/LocationDetailView.tsx`. Add imports and restructure to use Breadcrumb + Tabs. Key structure (adjust based on existing file):

```tsx
import { useParams } from 'react-router-dom'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { LocationPermitsTab } from './LocationPermitsTab'
import { LocationDocumentsTab } from './LocationDocumentsTab'
import { LocationHistoryTab } from './LocationHistoryTab'
import { useLocationDetail } from '@/hooks/useLocationDetail'
import { CheckCircle2, AlertTriangle, XCircle } from '@/lib/lucide-icons'

export function LocationDetailView() {
  const { id } = useParams<{ id: string }>()
  const { location, permits, loading } = useLocationDetail(id!)

  if (loading) return <div className="p-8">Cargando...</div>
  if (!location) return <div className="p-8">Sede no encontrada</div>

  const active = permits.filter(p => p.is_active)
  const vigentes = active.filter(p => p.status === 'vigente').length
  const porVencer = active.filter(p => p.status === 'por_vencer').length
  const vencidos = active.filter(p => p.status === 'vencido').length

  return (
    <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-400)]">
      <div className="max-w-7xl mx-auto space-y-[var(--ds-space-300)]">
        <Breadcrumb items={[
          { label: 'Inicio', href: '/' },
          { label: 'Sedes', href: '/sedes' },
          { label: location.name },
        ]} />

        <h1 className="text-[var(--ds-font-size-500)] font-bold text-[var(--ds-text)]">{location.name}</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--ds-space-300)]">
          <Card className="p-[var(--ds-space-300)]">
            <div className="flex items-center gap-[var(--ds-space-100)] text-[var(--ds-green-600)]">
              <CheckCircle2 className="w-5 h-5" />
              <span className="uppercase text-[var(--ds-font-size-075)] font-semibold">Vigentes</span>
            </div>
            <div className="text-[var(--ds-font-size-500)] font-bold mt-[var(--ds-space-100)]">{vigentes}</div>
          </Card>
          <Card className="p-[var(--ds-space-300)]">
            <div className="flex items-center gap-[var(--ds-space-100)] text-[var(--ds-orange-600)]">
              <AlertTriangle className="w-5 h-5" />
              <span className="uppercase text-[var(--ds-font-size-075)] font-semibold">Por Vencer</span>
            </div>
            <div className="text-[var(--ds-font-size-500)] font-bold mt-[var(--ds-space-100)]">{porVencer}</div>
          </Card>
          <Card className="p-[var(--ds-space-300)]">
            <div className="flex items-center gap-[var(--ds-space-100)] text-[var(--ds-red-600)]">
              <XCircle className="w-5 h-5" />
              <span className="uppercase text-[var(--ds-font-size-075)] font-semibold">Vencidos</span>
            </div>
            <div className="text-[var(--ds-font-size-500)] font-bold mt-[var(--ds-space-100)]">{vencidos}</div>
          </Card>
        </div>

        <Card className="p-[var(--ds-space-300)]">
          <Tabs defaultValue="permisos">
            <TabsList>
              <TabsTrigger value="permisos">Permisos</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
              <TabsTrigger value="historial">Historial</TabsTrigger>
            </TabsList>
            <TabsContent value="permisos">
              <LocationPermitsTab locationId={location.id} permits={permits} />
            </TabsContent>
            <TabsContent value="documentos">
              <LocationDocumentsTab locationId={location.id} />
            </TabsContent>
            <TabsContent value="historial">
              <LocationHistoryTab locationId={location.id} />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Verify**

Run: `npm run dev`. Navigate to a sede detail page. Expected: Breadcrumb + stats cards + tabs work.

- [ ] **Step 6: Commit**

```bash
git add src/features/locations/
git commit -m "feat(sedes): enhanced detail view with tabs

- Add Breadcrumb navigation
- 3 stat cards (Vigentes, Por Vencer, Vencidos) with Lucide icons
- Tabs for Permisos, Documentos, Historial
- Lazy-loaded tab components for better performance"
```

---

## Part 7: Mapa Interactivo Standalone

**Files:**
- Modify: `src/features/network/NetworkMapPage.tsx`
- Create: `src/features/network/NetworkMapCanvas.tsx`
- Create: `src/features/network/MapLegend.tsx`

### Steps

- [ ] **Step 1: Create MapLegend**

Write to `src/features/network/MapLegend.tsx`:

```tsx
import { Card } from '@/components/ui/card'

export function MapLegend() {
  return (
    <Card className="p-[var(--ds-space-200)]">
      <h3 className="text-[var(--ds-font-size-075)] font-semibold uppercase text-[var(--ds-text-subtle)] mb-[var(--ds-space-150)]">Leyenda</h3>
      <div className="space-y-[var(--ds-space-100)]">
        <div className="flex items-center gap-[var(--ds-space-100)]">
          <div className="w-6 h-0.5 bg-[var(--ds-green-500)]" />
          <span className="text-[var(--ds-font-size-075)]">100% cumplimiento</span>
        </div>
        <div className="flex items-center gap-[var(--ds-space-100)]">
          <div className="w-6 h-0.5" style={{ background: 'repeating-linear-gradient(90deg, var(--ds-orange-500) 0 3px, transparent 3px 6px)' }} />
          <span className="text-[var(--ds-font-size-075)]">Requiere atención</span>
        </div>
        <div className="flex items-center gap-[var(--ds-space-100)]">
          <div className="w-6 h-0.5" style={{ background: 'repeating-linear-gradient(90deg, var(--ds-red-500) 0 3px, transparent 3px 6px)' }} />
          <span className="text-[var(--ds-font-size-075)]">Crítico / vencido</span>
        </div>
      </div>
    </Card>
  )
}
```

- [ ] **Step 2: Create NetworkMapCanvas (reuse Dashboard map)**

Write to `src/features/network/NetworkMapCanvas.tsx`:

```tsx
import { DashboardMap, type SedeMapData } from '@/features/dashboard/DashboardMap'

export interface NetworkMapCanvasProps {
  empresaName: string
  sedes: SedeMapData[]
}

export function NetworkMapCanvas({ empresaName, sedes }: NetworkMapCanvasProps) {
  return (
    <div className="flex-1 relative">
      <DashboardMap empresaName={empresaName} sedes={sedes} />
    </div>
  )
}
```

- [ ] **Step 3: Update NetworkMapPage**

Modify `src/features/network/NetworkMapPage.tsx`. Replace the entire body to use new map + legend:

```tsx
import { useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useLocations } from '@/hooks/useLocations'
import { usePermits } from '@/hooks/usePermits'
import { NetworkMapCanvas } from './NetworkMapCanvas'
import { MapLegend } from './MapLegend'
import type { SedeMapData } from '@/features/dashboard/DashboardMap'

export function NetworkMapPage() {
  const { profile } = useAuth()
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'
  const companyId = isDemoMode ? '50707999-f033-41c4-91c9-989966311972' : profile?.company_id

  const { locations } = useLocations(companyId)
  const { permits } = usePermits({ companyId })

  const sedes = useMemo<SedeMapData[]>(() => {
    return locations.map(loc => {
      const locPermits = permits.filter(p => p.location_id === loc.id && p.is_active)
      const active = locPermits.filter(p => p.status === 'vigente').length
      const total = locPermits.length || 1
      const percentage = (active / total) * 100

      const status: 'success' | 'warning' | 'danger' =
        percentage >= 90 ? 'success' : percentage >= 50 ? 'warning' : 'danger'

      const risk: 'Bajo' | 'Medio' | 'Alto' | 'Crítico' =
        percentage >= 90 ? 'Bajo' : percentage >= 70 ? 'Medio' : percentage >= 40 ? 'Alto' : 'Crítico'

      return {
        id: loc.id,
        label: loc.name,
        code: loc.code || loc.id.slice(0, 8),
        permits: active,
        total,
        status,
        risk,
      }
    })
  }, [locations, permits])

  return (
    <div className="h-screen bg-[var(--ds-neutral-50)] flex flex-col">
      <div className="p-[var(--ds-space-300)] border-b border-[var(--ds-border)] bg-white flex justify-between items-center">
        <h1 className="text-[var(--ds-font-size-400)] font-bold">Mapa de Red</h1>
      </div>

      <div className="flex-1 flex relative">
        <NetworkMapCanvas
          empresaName={profile?.company_name || 'EnRegla Corp'}
          sedes={sedes}
        />
        <div className="absolute top-[var(--ds-space-300)] right-[var(--ds-space-300)] w-[220px]">
          <MapLegend />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify**

Run: `npm run dev`. Navigate to `/mapa-red`. Expected: Fullscreen map with legend overlay.

- [ ] **Step 5: Commit**

```bash
git add src/features/network/
git commit -m "feat(network): standalone interactive map with legend

- NetworkMapCanvas reuses DashboardMap
- MapLegend component explains edge colors/patterns
- Fullscreen layout for focused exploration"
```

---

## Part 8: Permisos List - Professional Table

**Files:**
- Modify: `src/features/permits/PermitListView.tsx`
- Create: `src/features/permits/PermitTable.tsx`
- Create: `src/features/permits/PermitTableFilters.tsx`
- Create: `src/features/permits/exportPermitsCSV.ts`

### Steps

- [ ] **Step 1: Create exportPermitsCSV utility**

Write to `src/features/permits/exportPermitsCSV.ts`:

```typescript
export interface ExportablePermit {
  location: string
  type: string
  status: string
  expires_at: string | null
  authority: string
  responsible: string
}

export function exportPermitsCSV(permits: ExportablePermit[]): void {
  const headers = ['Sede', 'Tipo', 'Estado', 'Vencimiento', 'Autoridad', 'Responsable']

  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`

  const rows = permits.map(p => [
    escape(p.location),
    escape(p.type),
    escape(p.status),
    escape(p.expires_at ? new Date(p.expires_at).toLocaleDateString('es-EC') : '-'),
    escape(p.authority),
    escape(p.responsible),
  ].join(','))

  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `permisos-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 2: Create PermitTableFilters**

Write to `src/features/permits/PermitTableFilters.tsx`:

```tsx
import { Search, Filter } from '@/lib/lucide-icons'

export interface FilterState {
  search: string
  status: string
  type: string
  location: string
}

export interface PermitTableFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  availableStatuses: string[]
  availableTypes: string[]
  availableLocations: Array<{ id: string; name: string }>
}

export function PermitTableFilters({ filters, onFiltersChange, availableStatuses, availableTypes, availableLocations }: PermitTableFiltersProps) {
  const update = (partial: Partial<FilterState>) => onFiltersChange({ ...filters, ...partial })

  return (
    <div className="flex flex-wrap gap-[var(--ds-space-150)] items-center">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="w-4 h-4 absolute left-[var(--ds-space-100)] top-1/2 -translate-y-1/2 text-[var(--ds-text-subtlest)]" />
        <input
          type="text"
          placeholder="Buscar..."
          value={filters.search}
          onChange={e => update({ search: e.target.value })}
          className="w-full pl-8 pr-[var(--ds-space-150)] py-[var(--ds-space-100)] border-2 border-[var(--ds-border)] rounded-[var(--ds-radius-100)] text-[var(--ds-font-size-100)] focus:border-[var(--ds-background-brand)] focus:outline-none"
        />
      </div>

      <select
        value={filters.status}
        onChange={e => update({ status: e.target.value })}
        className="px-[var(--ds-space-150)] py-[var(--ds-space-100)] border-2 border-[var(--ds-border)] rounded-[var(--ds-radius-100)] text-[var(--ds-font-size-100)] bg-white"
      >
        <option value="">Todos los estados</option>
        {availableStatuses.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      <select
        value={filters.type}
        onChange={e => update({ type: e.target.value })}
        className="px-[var(--ds-space-150)] py-[var(--ds-space-100)] border-2 border-[var(--ds-border)] rounded-[var(--ds-radius-100)] text-[var(--ds-font-size-100)] bg-white"
      >
        <option value="">Todos los tipos</option>
        {availableTypes.map(t => <option key={t} value={t}>{t}</option>)}
      </select>

      <select
        value={filters.location}
        onChange={e => update({ location: e.target.value })}
        className="px-[var(--ds-space-150)] py-[var(--ds-space-100)] border-2 border-[var(--ds-border)] rounded-[var(--ds-radius-100)] text-[var(--ds-font-size-100)] bg-white"
      >
        <option value="">Todas las sedes</option>
        {availableLocations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
      </select>
    </div>
  )
}
```

- [ ] **Step 3: Create PermitTable**

Write to `src/features/permits/PermitTable.tsx`:

```tsx
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Eye, Edit, ChevronLeft, ChevronRight, SortAsc, SortDesc } from '@/lib/lucide-icons'

export interface PermitRow {
  id: string
  location: string
  locationId: string
  type: string
  status: 'vigente' | 'por_vencer' | 'vencido' | 'en_tramite' | 'no_registrado'
  expires_at: string | null
  authority: string
  responsible: string
}

const columnHelper = createColumnHelper<PermitRow>()

export interface PermitTableProps {
  data: PermitRow[]
}

export function PermitTable({ data }: PermitTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])

  const columns = useMemo(() => [
    columnHelper.accessor('location', {
      header: 'Sede',
      cell: info => <span className="font-medium">{info.getValue()}</span>,
    }),
    columnHelper.accessor('type', { header: 'Tipo' }),
    columnHelper.accessor('status', {
      header: 'Estado',
      cell: info => {
        const status = info.getValue()
        const variant = {
          vigente: 'status-vigente' as const,
          por_vencer: 'status-por-vencer' as const,
          vencido: 'status-vencido' as const,
          en_tramite: 'status-en-tramite' as const,
          no_registrado: 'status-no-registrado' as const,
        }[status]
        return <Badge variant={variant}>{status.replace('_', ' ')}</Badge>
      },
    }),
    columnHelper.accessor('expires_at', {
      header: 'Vencimiento',
      cell: info => {
        const v = info.getValue()
        return v ? new Date(v).toLocaleDateString('es-EC') : '-'
      },
    }),
    columnHelper.accessor('authority', { header: 'Autoridad' }),
    columnHelper.accessor('responsible', {
      header: 'Responsable',
      cell: info => (
        <div className="flex items-center gap-[var(--ds-space-100)]">
          <Avatar name={info.getValue()} size="sm" />
          <span>{info.getValue()}</span>
        </div>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex gap-[var(--ds-space-050)]">
          <Link to={`/permisos/${row.original.id}`}>
            <Button variant="subtle" size="sm"><Eye className="w-3.5 h-3.5" /></Button>
          </Link>
          <Link to={`/permisos/${row.original.id}?edit=true`}>
            <Button variant="subtle" size="sm"><Edit className="w-3.5 h-3.5" /></Button>
          </Link>
        </div>
      ),
    }),
  ], [])

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  })

  return (
    <div className="space-y-[var(--ds-space-200)]">
      <div className="overflow-x-auto rounded-[var(--ds-radius-100)] shadow-[var(--ds-shadow-raised)] bg-white">
        <table className="w-full border-collapse">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(header => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="px-[var(--ds-space-150)] py-[var(--ds-space-100)] text-left text-[var(--ds-font-size-050)] font-semibold uppercase tracking-wide text-[var(--ds-text-subtle)] bg-[var(--ds-neutral-50)] border-b-2 border-[var(--ds-border)] cursor-pointer hover:text-[var(--ds-text)]"
                  >
                    <div className="flex items-center gap-[var(--ds-space-050)]">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === 'asc' && <SortAsc className="w-3 h-3" />}
                      {header.column.getIsSorted() === 'desc' && <SortDesc className="w-3 h-3" />}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="hover:bg-[var(--ds-neutral-50)] transition-colors">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-[var(--ds-space-150)] py-[var(--ds-space-150)] border-b border-[var(--ds-border)]">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">
          Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
        </div>
        <div className="flex items-center gap-[var(--ds-space-100)]">
          <select
            value={table.getState().pagination.pageSize}
            onChange={e => table.setPageSize(Number(e.target.value))}
            className="px-[var(--ds-space-100)] py-[var(--ds-space-050)] border border-[var(--ds-border)] rounded-[var(--ds-radius-100)] text-[var(--ds-font-size-075)]"
          >
            {[25, 50, 100].map(s => <option key={s} value={s}>{s} por página</option>)}
          </select>
          <Button
            variant="outline" size="sm"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline" size="sm"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Update PermitListView**

Modify `src/features/permits/PermitListView.tsx` to replace cards with table. The main body structure:

```tsx
import { useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useLocations } from '@/hooks/useLocations'
import { usePermits } from '@/hooks/usePermits'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { FileText, Plus, Download } from '@/lib/lucide-icons'
import { PermitTable, type PermitRow } from './PermitTable'
import { PermitTableFilters, type FilterState } from './PermitTableFilters'
import { exportPermitsCSV } from './exportPermitsCSV'

export function PermitListView() {
  const { profile } = useAuth()
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'
  const companyId = isDemoMode ? '50707999-f033-41c4-91c9-989966311972' : profile?.company_id

  const { locations } = useLocations(companyId)
  const { permits, loading } = usePermits({ companyId })

  const [filters, setFilters] = useState<FilterState>({ search: '', status: '', type: '', location: '' })

  const rows = useMemo<PermitRow[]>(() => {
    return permits.filter(p => p.is_active).map(p => {
      const loc = locations.find(l => l.id === p.location_id)
      return {
        id: p.id,
        location: loc?.name ?? 'Sin sede',
        locationId: p.location_id,
        type: p.type ?? 'Sin tipo',
        status: (p.status as PermitRow['status']) ?? 'no_registrado',
        expires_at: p.expires_at,
        authority: p.authority ?? 'Sin autoridad',
        responsible: p.responsible_name ?? 'Sin responsable',
      }
    })
  }, [permits, locations])

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (filters.search && !`${r.location} ${r.type} ${r.authority} ${r.responsible}`.toLowerCase().includes(filters.search.toLowerCase())) return false
      if (filters.status && r.status !== filters.status) return false
      if (filters.type && r.type !== filters.type) return false
      if (filters.location && r.locationId !== filters.location) return false
      return true
    })
  }, [rows, filters])

  const statuses = useMemo(() => Array.from(new Set(rows.map(r => r.status))), [rows])
  const types = useMemo(() => Array.from(new Set(rows.map(r => r.type))), [rows])

  return (
    <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-400)]">
      <div className="max-w-7xl mx-auto space-y-[var(--ds-space-300)]">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-[var(--ds-font-size-500)] font-bold text-[var(--ds-text)]">Permisos</h1>
            <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mt-[var(--ds-space-050)]">
              {rows.length} permisos registrados
            </p>
          </div>
          <div className="flex gap-[var(--ds-space-100)]">
            <Button variant="outline" onClick={() => exportPermitsCSV(filtered)}>
              <Download className="w-4 h-4" />Exportar CSV
            </Button>
            <Button variant="default">
              <Plus className="w-4 h-4" />Nuevo Permiso
            </Button>
          </div>
        </div>

        <Card className="p-[var(--ds-space-300)]">
          <PermitTableFilters
            filters={filters}
            onFiltersChange={setFilters}
            availableStatuses={statuses}
            availableTypes={types}
            availableLocations={locations.map(l => ({ id: l.id, name: l.name }))}
          />
        </Card>

        {loading ? (
          <div className="p-8 text-center text-[var(--ds-text-subtle)]">Cargando permisos...</div>
        ) : rows.length === 0 ? (
          <Card className="p-0">
            <EmptyState
              icon={FileText}
              title="No hay permisos registrados"
              description="Crea el primer permiso para comenzar"
              action={<Button variant="default"><Plus className="w-4 h-4" />Nuevo Permiso</Button>}
            />
          </Card>
        ) : (
          <PermitTable data={filtered} />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Verify**

Run: `npm run dev`. Navigate to `/permisos`. Expected: Professional table with filters, sorting, pagination, export.

- [ ] **Step 6: Commit**

```bash
git add src/features/permits/
git commit -m "feat(permisos): professional table with @tanstack/react-table

- Replace cards with sortable/filterable table
- Columns: Sede, Tipo, Estado, Vencimiento, Autoridad, Responsable, Acciones
- Pagination (25/50/100 per page)
- Search + filter by status, type, location
- Export to CSV
- Avatar for responsible person column"
```

---

## Part 9: Permisos Detail View

**Files:**
- Modify: `src/features/permits/PermitDetailView.tsx`
- Create: `src/features/permits/PermitTimeline.tsx`

### Steps

- [ ] **Step 1: Create PermitTimeline**

Write to `src/features/permits/PermitTimeline.tsx`:

```tsx
import { Calendar, CheckCircle2, Clock, AlertTriangle } from '@/lib/lucide-icons'
import type { LucideIcon } from '@/lib/lucide-icons'

export interface TimelineEvent {
  id: string
  type: 'issued' | 'renewed' | 'expires' | 'expired'
  date: string
  description: string
}

export interface PermitTimelineProps {
  events: TimelineEvent[]
}

const iconMap: Record<TimelineEvent['type'], { icon: LucideIcon; color: string }> = {
  issued: { icon: CheckCircle2, color: 'var(--ds-green-500)' },
  renewed: { icon: Clock, color: 'var(--ds-blue-500)' },
  expires: { icon: Calendar, color: 'var(--ds-orange-500)' },
  expired: { icon: AlertTriangle, color: 'var(--ds-red-500)' },
}

export function PermitTimeline({ events }: PermitTimelineProps) {
  return (
    <div className="space-y-[var(--ds-space-300)]">
      {events.map((event, i) => {
        const { icon: Icon, color } = iconMap[event.type]
        const isLast = i === events.length - 1
        return (
          <div key={event.id} className="flex gap-[var(--ds-space-200)] relative">
            {!isLast && <div className="absolute left-4 top-8 bottom-0 w-px bg-[var(--ds-border)]" />}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 relative"
              style={{ backgroundColor: `${color}20` }}
            >
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div className="pb-[var(--ds-space-200)]">
              <div className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">
                {new Date(event.date).toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div className="text-[var(--ds-font-size-100)] font-medium">{event.description}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Update PermitDetailView**

Modify `src/features/permits/PermitDetailView.tsx`. Key body structure:

```tsx
import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Banner } from '@/components/ui/banner'
import { PermitTimeline, type TimelineEvent } from './PermitTimeline'
import { Edit, Trash2 } from '@/lib/lucide-icons'
import { usePermit } from '@/hooks/usePermit'

export function PermitDetailView() {
  const { id } = useParams<{ id: string }>()
  const { permit, loading } = usePermit(id!)

  const timeline = useMemo<TimelineEvent[]>(() => {
    if (!permit) return []
    const events: TimelineEvent[] = []
    if (permit.issued_at) events.push({ id: 'issued', type: 'issued', date: permit.issued_at, description: 'Permiso emitido' })
    if (permit.expires_at) {
      const isExpired = new Date(permit.expires_at) < new Date()
      events.push({
        id: 'expires',
        type: isExpired ? 'expired' : 'expires',
        date: permit.expires_at,
        description: isExpired ? 'Permiso vencido' : 'Fecha de vencimiento',
      })
    }
    return events
  }, [permit])

  if (loading) return <div className="p-8">Cargando...</div>
  if (!permit) return <div className="p-8">Permiso no encontrado</div>

  const statusVariant = {
    vigente: 'status-vigente' as const,
    por_vencer: 'status-por-vencer' as const,
    vencido: 'status-vencido' as const,
    en_tramite: 'status-en-tramite' as const,
    no_registrado: 'status-no-registrado' as const,
  }[permit.status] ?? 'status-no-registrado' as const

  const isExpired = permit.status === 'vencido'
  const isExpiring = permit.status === 'por_vencer'

  return (
    <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-400)]">
      <div className="max-w-7xl mx-auto space-y-[var(--ds-space-300)]">
        <Breadcrumb items={[
          { label: 'Inicio', href: '/' },
          { label: 'Permisos', href: '/permisos' },
          { label: permit.type },
        ]} />

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-[var(--ds-font-size-500)] font-bold text-[var(--ds-text)]">{permit.type}</h1>
            <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] font-mono mt-[var(--ds-space-050)]">
              {permit.permit_number}
            </p>
          </div>
          <div className="flex gap-[var(--ds-space-100)]">
            <Button variant="outline"><Edit className="w-4 h-4" />Editar</Button>
            <Button variant="destructive"><Trash2 className="w-4 h-4" />Eliminar</Button>
          </div>
        </div>

        {isExpired && <Banner variant="error" title="Permiso vencido">Este permiso ha caducado. Es necesario renovarlo inmediatamente.</Banner>}
        {isExpiring && <Banner variant="warning" title="Próximo a vencer">Este permiso vence pronto. Planifica la renovación.</Banner>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--ds-space-300)]">
          <Card className="p-[var(--ds-space-300)]">
            <h2 className="text-[var(--ds-font-size-300)] font-semibold mb-[var(--ds-space-200)]">Información</h2>
            <dl className="space-y-[var(--ds-space-200)]">
              <div>
                <dt className="text-[var(--ds-font-size-075)] uppercase text-[var(--ds-text-subtle)]">Estado</dt>
                <dd className="mt-[var(--ds-space-050)]"><Badge variant={statusVariant}>{permit.status.replace('_', ' ')}</Badge></dd>
              </div>
              <div>
                <dt className="text-[var(--ds-font-size-075)] uppercase text-[var(--ds-text-subtle)]">Autoridad</dt>
                <dd className="mt-[var(--ds-space-050)] text-[var(--ds-font-size-100)]">{permit.authority || '-'}</dd>
              </div>
              <div>
                <dt className="text-[var(--ds-font-size-075)] uppercase text-[var(--ds-text-subtle)]">Responsable</dt>
                <dd className="mt-[var(--ds-space-050)] text-[var(--ds-font-size-100)]">{permit.responsible_name || '-'}</dd>
              </div>
            </dl>
          </Card>

          <Card className="p-[var(--ds-space-300)]">
            <h2 className="text-[var(--ds-font-size-300)] font-semibold mb-[var(--ds-space-200)]">Timeline</h2>
            <PermitTimeline events={timeline} />
          </Card>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify**

Run: `npm run dev`. Navigate to a permit detail. Expected: Breadcrumb + info card + timeline visible.

- [ ] **Step 4: Commit**

```bash
git add src/features/permits/
git commit -m "feat(permisos): enhanced detail view with timeline

- Breadcrumb navigation
- 2-col layout: Info card + Timeline card
- Conditional alert banners for expired/expiring permits
- Timeline with icons for issued, renewed, expires, expired events"
```

---

## Part 10: Renovaciones Grid

**Files:**
- Rename: `src/features/renewals/RenewalTimelineView.tsx` → `src/features/renewals/RenewalGridView.tsx`
- Create: `src/features/renewals/MonthCard.tsx`
- Create: `src/features/renewals/YearSelector.tsx`
- Modify: `src/App.tsx` (update import)

### Steps

- [ ] **Step 1: Create YearSelector**

Write to `src/features/renewals/YearSelector.tsx`:

```tsx
import { ChevronDown } from '@/lib/lucide-icons'

export interface YearSelectorProps {
  year: number
  onYearChange: (year: number) => void
  availableYears: number[]
}

export function YearSelector({ year, onYearChange, availableYears }: YearSelectorProps) {
  return (
    <div className="relative inline-block">
      <select
        value={year}
        onChange={e => onYearChange(Number(e.target.value))}
        className="appearance-none pl-[var(--ds-space-200)] pr-[var(--ds-space-500)] py-[var(--ds-space-100)] border-2 border-[var(--ds-border)] rounded-[var(--ds-radius-100)] bg-white text-[var(--ds-font-size-100)] font-medium cursor-pointer hover:border-[var(--ds-border-bold)]"
      >
        {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
      <ChevronDown className="w-4 h-4 absolute right-[var(--ds-space-100)] top-1/2 -translate-y-1/2 pointer-events-none text-[var(--ds-text-subtle)]" />
    </div>
  )
}
```

- [ ] **Step 2: Create MonthCard**

Write to `src/features/renewals/MonthCard.tsx`:

```tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronUp, Calendar } from '@/lib/lucide-icons'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export interface MonthRenewal {
  permitId: string
  permitType: string
  locationName: string
  expiresAt: string
  status: 'vigente' | 'por_vencer' | 'vencido'
}

export interface MonthCardProps {
  month: number // 0-11
  year: number
  renewals: MonthRenewal[]
}

export function MonthCard({ month, year, renewals }: MonthCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card className="p-[var(--ds-space-300)]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div>
          <div className="flex items-center gap-[var(--ds-space-100)]">
            <Calendar className="w-4 h-4 text-[var(--ds-text-subtle)]" />
            <h3 className="text-[var(--ds-font-size-300)] font-semibold">{MONTHS[month]}</h3>
          </div>
          <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">
            {year} • {renewals.length} {renewals.length === 1 ? 'permiso' : 'permisos'}
          </p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="mt-[var(--ds-space-200)] pt-[var(--ds-space-200)] border-t border-[var(--ds-border)] space-y-[var(--ds-space-100)]">
          {renewals.map(r => {
            const variant = {
              vigente: 'status-vigente' as const,
              por_vencer: 'status-por-vencer' as const,
              vencido: 'status-vencido' as const,
            }[r.status]
            return (
              <Link
                key={r.permitId}
                to={`/permisos/${r.permitId}`}
                className="block p-[var(--ds-space-150)] rounded-[var(--ds-radius-100)] hover:bg-[var(--ds-neutral-50)]"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-[var(--ds-font-size-100)]">{r.permitType}</div>
                    <div className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">{r.locationName}</div>
                  </div>
                  <Badge variant={variant} size="sm">{r.status.replace('_', ' ')}</Badge>
                </div>
                <div className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] mt-[var(--ds-space-050)]">
                  Vence: {new Date(r.expiresAt).toLocaleDateString('es-EC')}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </Card>
  )
}
```

- [ ] **Step 3: Create RenewalGridView**

Write to `src/features/renewals/RenewalGridView.tsx`:

```tsx
import { useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { usePermits } from '@/hooks/usePermits'
import { useLocations } from '@/hooks/useLocations'
import { YearSelector } from './YearSelector'
import { MonthCard, type MonthRenewal } from './MonthCard'
import { EmptyState } from '@/components/ui/empty-state'
import { Calendar } from '@/lib/lucide-icons'

export function RenewalGridView() {
  const { profile } = useAuth()
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'
  const companyId = isDemoMode ? '50707999-f033-41c4-91c9-989966311972' : profile?.company_id

  const { permits } = usePermits({ companyId })
  const { locations } = useLocations(companyId)

  const availableYears = useMemo(() => {
    const years = new Set<number>()
    permits.forEach(p => {
      if (p.expires_at) years.add(new Date(p.expires_at).getFullYear())
    })
    const current = new Date().getFullYear()
    years.add(current)
    years.add(current + 1)
    return Array.from(years).sort()
  }, [permits])

  const [year, setYear] = useState(new Date().getFullYear())

  const monthsData = useMemo(() => {
    const byMonth: Record<number, MonthRenewal[]> = {}
    permits.filter(p => p.is_active && p.expires_at).forEach(p => {
      const date = new Date(p.expires_at!)
      if (date.getFullYear() !== year) return

      const month = date.getMonth()
      if (!byMonth[month]) byMonth[month] = []

      const loc = locations.find(l => l.id === p.location_id)
      byMonth[month].push({
        permitId: p.id,
        permitType: p.type ?? 'Sin tipo',
        locationName: loc?.name ?? 'Sin sede',
        expiresAt: p.expires_at!,
        status: (p.status as MonthRenewal['status']) ?? 'vigente',
      })
    })
    return byMonth
  }, [permits, locations, year])

  const monthsWithData = Object.keys(monthsData).map(Number).sort((a, b) => a - b)

  return (
    <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-400)]">
      <div className="max-w-7xl mx-auto space-y-[var(--ds-space-300)]">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-[var(--ds-font-size-500)] font-bold">Renovaciones</h1>
            <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mt-[var(--ds-space-050)]">
              Calendario de vencimientos y renovaciones
            </p>
          </div>
          <YearSelector year={year} onYearChange={setYear} availableYears={availableYears} />
        </div>

        {monthsWithData.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title={`Sin renovaciones en ${year}`}
            description="No hay permisos que venzan este año"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--ds-space-300)]">
            {monthsWithData.map(month => (
              <MonthCard key={month} month={month} year={year} renewals={monthsData[month]} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Delete old RenewalTimelineView and update import**

```bash
rm src/features/renewals/RenewalTimelineView.tsx
```

Modify `src/App.tsx`:
```tsx
// Change import from:
import { RenewalTimelineView } from '@/features/renewals/RenewalTimelineView';
// To:
import { RenewalGridView } from '@/features/renewals/RenewalGridView';

// And change route element:
<Route path="/renovaciones" element={<RenewalGridView />} />
```

- [ ] **Step 5: Verify**

Run: `npm run dev`. Navigate to `/renovaciones`. Expected: Grid of month cards with year selector.

- [ ] **Step 6: Commit**

```bash
git add src/features/renewals/ src/App.tsx
git commit -m "feat(renovaciones): 3-column grid with expandable month cards

- Replace horizontal timeline with responsive grid layout
- YearSelector dropdown for year navigation
- MonthCard with inline expand showing permit details
- Only show months with pending renewals
- Empty state for years without renewals"
```

---

## Part 11: Marco Legal List

**Files:**
- Modify: `src/features/legal/LegalReferenceView.tsx`
- Create: `src/features/legal/LegalCategoryCard.tsx`

### Steps

- [ ] **Step 1: Create LegalCategoryCard**

Write to `src/features/legal/LegalCategoryCard.tsx`:

```tsx
import { Link } from 'react-router-dom'
import { ArrowRight } from '@/lib/lucide-icons'
import type { LucideIcon } from '@/lib/lucide-icons'
import { Card } from '@/components/ui/card'

export interface LegalCategoryCardProps {
  slug: string
  title: string
  description: string
  icon: LucideIcon
  articleCount: number
}

export function LegalCategoryCard({ slug, title, description, icon: Icon, articleCount }: LegalCategoryCardProps) {
  return (
    <Link to={`/marco-legal/${slug}`} className="block">
      <Card interactive className="p-[var(--ds-space-300)] h-full">
        <div className="flex items-start gap-[var(--ds-space-200)] h-full">
          <div className="w-10 h-10 bg-[var(--ds-blue-50)] rounded-[var(--ds-radius-200)] flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-[var(--ds-blue-600)]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[var(--ds-font-size-200)] text-[var(--ds-text)] mb-[var(--ds-space-050)]">{title}</h3>
            <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mb-[var(--ds-space-150)]">{description}</p>
            <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtlest)]">{articleCount} artículos</p>
          </div>
          <ArrowRight className="w-4 h-4 text-[var(--ds-text-subtlest)] mt-1" />
        </div>
      </Card>
    </Link>
  )
}
```

- [ ] **Step 2: Update LegalReferenceView**

Replace content of `src/features/legal/LegalReferenceView.tsx`:

```tsx
import { Shield, FileText, Building2, Users, AlertTriangle } from '@/lib/lucide-icons'
import { LegalCategoryCard } from './LegalCategoryCard'

const CATEGORIES = [
  {
    slug: 'funcionamiento',
    title: 'Funcionamiento',
    description: 'Permisos municipales y licencias de operación',
    icon: Building2,
    articleCount: 12,
  },
  {
    slug: 'sanitario',
    title: 'Sanitario',
    description: 'Permisos del Ministerio de Salud Pública',
    icon: FileText,
    articleCount: 8,
  },
  {
    slug: 'ambiental',
    title: 'Ambiental',
    description: 'Permisos del Ministerio del Ambiente',
    icon: Shield,
    articleCount: 15,
  },
  {
    slug: 'laboral',
    title: 'Laboral',
    description: 'Requisitos del Ministerio del Trabajo',
    icon: Users,
    articleCount: 10,
  },
  {
    slug: 'seguridad',
    title: 'Seguridad',
    description: 'Normativas de seguridad y bomberos',
    icon: AlertTriangle,
    articleCount: 6,
  },
]

export function LegalReferenceView() {
  return (
    <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-400)]">
      <div className="max-w-7xl mx-auto space-y-[var(--ds-space-300)]">
        <div>
          <h1 className="text-[var(--ds-font-size-500)] font-bold">Marco Legal</h1>
          <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mt-[var(--ds-space-050)]">
            Referencia de normativas por categoría
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--ds-space-300)]">
          {CATEGORIES.map(cat => (
            <LegalCategoryCard key={cat.slug} {...cat} />
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify**

Run: `npm run dev`. Navigate to `/marco-legal`. Expected: Grid of category cards.

- [ ] **Step 4: Commit**

```bash
git add src/features/legal/
git commit -m "feat(legal): navigable card grid replacing accordions

- LegalCategoryCard with icon + title + description + count
- Click navigates to /marco-legal/:categoria
- 2-col responsive grid"
```

---

## Part 12: Marco Legal Detail

**Files:**
- Create: `src/features/legal/LegalCategoryDetailView.tsx`
- Modify: `src/App.tsx` (add route)

### Steps

- [ ] **Step 1: Create LegalCategoryDetailView**

Write to `src/features/legal/LegalCategoryDetailView.tsx`:

```tsx
import { useParams } from 'react-router-dom'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Card } from '@/components/ui/card'
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { HelpCircle, Send } from '@/lib/lucide-icons'

interface CategoryContent {
  title: string
  description: string
  requirements: string[]
  relatedPermits: Array<{ id: string; name: string }>
}

const CONTENT: Record<string, CategoryContent> = {
  funcionamiento: {
    title: 'Funcionamiento',
    description: 'Los permisos de funcionamiento son emitidos por las municipalidades y autorizan la operación de establecimientos comerciales en una jurisdicción específica.',
    requirements: [
      'RUC vigente de la empresa',
      'Cédula del representante legal',
      'Certificado del cuerpo de bomberos',
      'Patente municipal al día',
      'Uso de suelo autorizado',
    ],
    relatedPermits: [
      { id: 'permit-1', name: 'Licencia Metropolitana Única' },
      { id: 'permit-2', name: 'Permiso Municipal' },
    ],
  },
  sanitario: {
    title: 'Sanitario',
    description: 'El Ministerio de Salud Pública regula la operación de establecimientos que manejan alimentos, medicamentos o servicios de salud.',
    requirements: [
      'Registro Sanitario ARCSA',
      'Certificado de Buenas Prácticas',
      'Análisis microbiológico de aguas',
      'Plan de manejo sanitario',
    ],
    relatedPermits: [{ id: 'permit-3', name: 'Permiso Sanitario' }],
  },
  ambiental: {
    title: 'Ambiental',
    description: 'Regulaciones del Ministerio del Ambiente (MAE) para actividades con impacto ambiental.',
    requirements: [
      'Estudio de Impacto Ambiental',
      'Plan de Manejo Ambiental',
      'Licencia Ambiental categoría correspondiente',
      'Registro de generador de desechos',
    ],
    relatedPermits: [{ id: 'permit-4', name: 'Licencia Ambiental' }],
  },
  laboral: {
    title: 'Laboral',
    description: 'Cumplimiento con el Ministerio del Trabajo respecto a empleados y condiciones laborales.',
    requirements: [
      'Reglamento Interno aprobado',
      'Afiliación al IESS de empleados',
      'Plan de seguridad ocupacional',
      'Décimos tercero y cuarto pagados',
    ],
    relatedPermits: [{ id: 'permit-5', name: 'Reglamento Interno' }],
  },
  seguridad: {
    title: 'Seguridad',
    description: 'Requisitos de seguridad, prevención de incendios y emergencias.',
    requirements: [
      'Permiso del Cuerpo de Bomberos',
      'Plan de emergencias aprobado',
      'Sistema contra incendios certificado',
      'Salidas de emergencia señalizadas',
    ],
    relatedPermits: [{ id: 'permit-6', name: 'Permiso Bomberos' }],
  },
}

export function LegalCategoryDetailView() {
  const { categoria } = useParams<{ categoria: string }>()
  const content = categoria ? CONTENT[categoria] : null

  if (!content) {
    return (
      <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-400)]">
        <div className="max-w-4xl mx-auto">
          <Banner variant="error">Categoría no encontrada</Banner>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-400)]">
      <div className="max-w-4xl mx-auto space-y-[var(--ds-space-300)]">
        <Breadcrumb items={[
          { label: 'Inicio', href: '/' },
          { label: 'Marco Legal', href: '/marco-legal' },
          { label: content.title },
        ]} />

        <h1 className="text-[var(--ds-font-size-500)] font-bold">{content.title}</h1>

        <Card className="p-[var(--ds-space-400)]">
          <p className="text-[var(--ds-font-size-200)] leading-relaxed">{content.description}</p>
        </Card>

        <Card className="p-[var(--ds-space-400)]">
          <h2 className="text-[var(--ds-font-size-300)] font-semibold mb-[var(--ds-space-200)]">Requisitos</h2>
          <ul className="space-y-[var(--ds-space-150)]">
            {content.requirements.map((req, i) => (
              <li key={i} className="flex gap-[var(--ds-space-150)]">
                <span className="w-6 h-6 bg-[var(--ds-blue-100)] text-[var(--ds-blue-700)] rounded-full flex items-center justify-center text-[var(--ds-font-size-075)] font-semibold shrink-0">{i + 1}</span>
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </Card>

        {content.relatedPermits.length > 0 && (
          <Card className="p-[var(--ds-space-400)]">
            <h2 className="text-[var(--ds-font-size-300)] font-semibold mb-[var(--ds-space-200)]">Permisos relacionados</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--ds-space-150)]">
              {content.relatedPermits.map(p => (
                <div key={p.id} className="p-[var(--ds-space-200)] bg-[var(--ds-neutral-50)] rounded-[var(--ds-radius-100)]">
                  <div className="font-medium">{p.name}</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Banner variant="info">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-[var(--ds-space-100)]">
              <HelpCircle className="w-5 h-5" />
              <span>¿Necesitas ayuda con esta categoría?</span>
            </div>
            <Button variant="default" size="sm"><Send className="w-4 h-4" />Contactar</Button>
          </div>
        </Banner>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add route to App.tsx**

Modify `src/App.tsx`. Add import:
```tsx
import { LegalCategoryDetailView } from '@/features/legal/LegalCategoryDetailView';
```

Add route in the protected routes block (near `/marco-legal`):
```tsx
<Route path="/marco-legal/:categoria" element={<LegalCategoryDetailView />} />
```

- [ ] **Step 3: Verify**

Run: `npm run dev`. Navigate to `/marco-legal/funcionamiento`. Expected: Detail view with breadcrumb, description, requirements, related permits, help banner.

- [ ] **Step 4: Commit**

```bash
git add src/features/legal/ src/App.tsx
git commit -m "feat(legal): category detail view with requirements

- New route /marco-legal/:categoria
- Breadcrumb navigation
- Description + numbered requirements list
- Related permits grid
- Help banner with contact CTA"
```

---

## Part 13: Cleanup - Remove Legacy

**Files to delete:**
- `src/features/tasks/` (entire folder)
- `src/features/documents/` (entire folder)

**Files to modify:**
- `src/App.tsx`
- `src/components/layout/AppLayout.tsx` (if it has nav links)

### Steps

- [ ] **Step 1: Delete legacy folders**

```bash
rm -rf src/features/tasks
rm -rf src/features/documents
```

- [ ] **Step 2: Remove imports and routes from App.tsx**

Modify `src/App.tsx`. Remove these lines:
```tsx
import { TaskBoardView } from '@/features/tasks/TaskBoardView';
import { DocumentVaultView } from '@/features/documents/DocumentVaultView';
```

Remove these routes:
```tsx
<Route path="/tareas" element={<TaskBoardView />} />
<Route path="/documentos" element={<DocumentVaultView />} />
```

- [ ] **Step 3: Remove navigation links**

Check `src/components/layout/AppLayout.tsx` and any sidebar/nav components. Remove any `Link` or menu items pointing to `/tareas` or `/documentos`.

Run: `grep -r "tareas\|documentos" src/components/layout/ src/App.tsx`
Expected: No references except potentially comments.

- [ ] **Step 4: Verify build passes**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 5: Find hardcoded colors**

Run: `grep -r "#[0-9a-fA-F]\{6\}" src/features/ src/components/ --include="*.tsx" --include="*.ts" | grep -v "node_modules"`

Review any remaining hardcoded hex colors and replace with tokens. Common replacements:
- `#FFFFFF` → `var(--ds-neutral-0)`
- `#000000` → `var(--ds-neutral-900)`

- [ ] **Step 6: Find emojis to replace**

Run: `grep -rn "🏢\|🏛\|📋\|📄\|⚠\|✓\|ℹ" src/ --include="*.tsx" --include="*.ts"`

Replace any emoji usage with Lucide icons from `@/lib/lucide-icons`.

- [ ] **Step 7: Final verification**

Run: `npm run dev`
Navigate through the app. Expected: All views work, no broken routes, no console errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore(cleanup): remove TaskBoard, DocumentVault, legacy code

- Delete src/features/tasks/ and src/features/documents/
- Remove /tareas and /documentos routes
- Remove nav links in AppLayout
- Replace remaining hardcoded colors with tokens
- Replace remaining emojis with Lucide icons"
```

---

# PHASE 2: SECONDARY FEATURES (Parallel)

## Part 14: Login & Auth Views

**Files:**
- Modify: `src/features/auth/LoginView.tsx`
- Modify: `src/features/auth/AuthCallback.tsx`

### Steps

- [ ] **Step 1: Update LoginView with Atlassian DS**

Read current LoginView.tsx and preserve business logic (Google OAuth call). Replace visual layout to match this pattern:

```tsx
import { Button } from '@/components/ui/button'
import { Banner } from '@/components/ui/banner'
import { Card } from '@/components/ui/card'
import { LogIn, Shield } from '@/lib/lucide-icons'

export function LoginView() {
  // ... keep existing auth logic ...
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'

  return (
    <div className="min-h-screen flex items-center justify-center p-[var(--ds-space-400)] bg-gradient-to-br from-[var(--ds-blue-50)] to-[var(--ds-neutral-50)]">
      <div className="w-full max-w-md space-y-[var(--ds-space-300)]">
        <div className="text-center space-y-[var(--ds-space-150)]">
          <div className="inline-flex w-16 h-16 rounded-[var(--ds-radius-300)] bg-[var(--ds-background-brand)] items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-[var(--ds-font-size-500)] font-bold text-[var(--ds-text)]">EnRegla</h1>
          <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)]">Preciso, Confiable, Protector</p>
        </div>

        {isDemoMode && <Banner variant="info" title="Modo Demo">Funciones limitadas habilitadas para demostración.</Banner>}

        <Card className="p-[var(--ds-space-400)]">
          <Button variant="default" size="lg" className="w-full" onClick={/* existing oauth call */}>
            <LogIn className="w-4 h-4" />
            Iniciar con Google
          </Button>
        </Card>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update AuthCallback**

Modify `src/features/auth/AuthCallback.tsx` to use consistent loading state:

```tsx
import { Loader2, Shield } from '@/lib/lucide-icons'

// Replace loading JSX with:
<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--ds-blue-50)] to-[var(--ds-neutral-50)]">
  <div className="flex flex-col items-center gap-[var(--ds-space-200)]">
    <div className="w-16 h-16 rounded-[var(--ds-radius-300)] bg-[var(--ds-background-brand)] flex items-center justify-center">
      <Shield className="w-8 h-8 text-white" />
    </div>
    <Loader2 className="w-6 h-6 animate-spin text-[var(--ds-background-brand)]" />
    <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)]">Autenticando...</p>
  </div>
</div>
```

- [ ] **Step 3: Verify**

Run: `npm run dev`. Navigate to `/login`. Expected: Branded login with gradient bg + Shield logo.

- [ ] **Step 4: Commit**

```bash
git add src/features/auth/
git commit -m "feat(auth): rebrand login and callback with Atlassian DS

- LoginView: gradient background, Shield logo, tagline
- AuthCallback: consistent loading state
- Banner component for demo mode indicator"
```

---

## Part 15: Onboarding Wizard

**Files:**
- Modify: `src/features/onboarding-incremental/IncrementalWizard.tsx`
- Create: `src/features/onboarding-incremental/Stepper.tsx`

### Steps

- [ ] **Step 1: Create Stepper component**

Write to `src/features/onboarding-incremental/Stepper.tsx`:

```tsx
import { Check } from '@/lib/lucide-icons'

export interface StepperStep {
  id: string
  label: string
}

export interface StepperProps {
  steps: StepperStep[]
  currentStepId: string
}

export function Stepper({ steps, currentStepId }: StepperProps) {
  const currentIndex = steps.findIndex(s => s.id === currentStepId)

  return (
    <div className="flex items-center justify-between w-full">
      {steps.map((step, i) => {
        const isActive = i === currentIndex
        const isCompleted = i < currentIndex
        const isLast = i === steps.length - 1

        return (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-[var(--ds-space-075)]">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[var(--ds-font-size-075)] font-semibold transition-colors ${
                  isCompleted
                    ? 'bg-[var(--ds-green-500)] text-white'
                    : isActive
                    ? 'bg-[var(--ds-background-brand)] text-white'
                    : 'bg-[var(--ds-neutral-200)] text-[var(--ds-text-subtle)]'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-[var(--ds-font-size-075)] ${isActive ? 'font-semibold text-[var(--ds-text)]' : 'text-[var(--ds-text-subtle)]'}`}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div className={`h-0.5 flex-1 mx-[var(--ds-space-150)] ${isCompleted ? 'bg-[var(--ds-green-500)]' : 'bg-[var(--ds-border)]'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Update IncrementalWizard to use Stepper**

Read current IncrementalWizard.tsx and add Stepper at top. Key addition:

```tsx
import { Stepper } from './Stepper'

// At top of wizard body:
<div className="max-w-2xl mx-auto mb-[var(--ds-space-400)]">
  <Stepper
    steps={[
      { id: 'profile', label: 'Perfil' },
      { id: 'company', label: 'Empresa' },
      { id: 'locations', label: 'Sedes' },
    ]}
    currentStepId={currentStep}
  />
</div>
```

Replace any `<button>` elements in wizard with `<Button>` from `@/components/ui/button` using `variant="default"` for "Siguiente" and `variant="outline"` for "Atrás".

- [ ] **Step 3: Verify**

Run: `npm run dev`. Go to onboarding flow. Expected: Stepper visible with progress.

- [ ] **Step 4: Commit**

```bash
git add src/features/onboarding-incremental/
git commit -m "feat(onboarding): wizard with Stepper and DS components

- Stepper component showing progress across 3 steps
- Completed steps show checkmark
- Button component for navigation (back/next/skip)"
```

---

## Part 16: Settings View

**Files:**
- Modify: `src/features/settings/SettingsView.tsx`
- Create: `src/features/settings/ProfileTab.tsx`
- Create: `src/features/settings/CompanyTab.tsx`
- Create: `src/features/settings/NotificationsTab.tsx`
- Create: `src/features/settings/SecurityTab.tsx`

### Steps

- [ ] **Step 1: Create ProfileTab**

Write to `src/features/settings/ProfileTab.tsx`:

```tsx
import { Card } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'

export function ProfileTab() {
  const { profile } = useAuth()

  return (
    <Card className="p-[var(--ds-space-400)]">
      <h2 className="text-[var(--ds-font-size-300)] font-semibold mb-[var(--ds-space-300)]">Perfil</h2>
      <div className="space-y-[var(--ds-space-300)]">
        <div className="flex items-center gap-[var(--ds-space-200)]">
          <Avatar name={profile?.full_name || 'User'} size="xl" />
          <Button variant="outline" size="sm">Cambiar foto</Button>
        </div>

        <div>
          <label className="block text-[var(--ds-font-size-075)] font-semibold mb-[var(--ds-space-050)]">Nombre completo</label>
          <Input defaultValue={profile?.full_name ?? ''} />
        </div>

        <div>
          <label className="block text-[var(--ds-font-size-075)] font-semibold mb-[var(--ds-space-050)]">Email</label>
          <Input defaultValue={profile?.email ?? ''} disabled />
        </div>

        <Button variant="default">Guardar cambios</Button>
      </div>
    </Card>
  )
}
```

- [ ] **Step 2: Create CompanyTab**

Write to `src/features/settings/CompanyTab.tsx`:

```tsx
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function CompanyTab() {
  return (
    <Card className="p-[var(--ds-space-400)]">
      <h2 className="text-[var(--ds-font-size-300)] font-semibold mb-[var(--ds-space-300)]">Empresa</h2>
      <div className="space-y-[var(--ds-space-300)]">
        <div>
          <label className="block text-[var(--ds-font-size-075)] font-semibold mb-[var(--ds-space-050)]">Razón Social</label>
          <Input placeholder="Empresa S.A." />
        </div>
        <div>
          <label className="block text-[var(--ds-font-size-075)] font-semibold mb-[var(--ds-space-050)]">RUC</label>
          <Input placeholder="1234567890001" />
        </div>
        <Button variant="default">Guardar cambios</Button>
      </div>
    </Card>
  )
}
```

- [ ] **Step 3: Create NotificationsTab**

Write to `src/features/settings/NotificationsTab.tsx`:

```tsx
import { Card } from '@/components/ui/card'
import { Bell, Mail, MessageSquare } from 'lucide-react'

interface ToggleProps {
  label: string
  description: string
  icon: typeof Bell
  defaultChecked?: boolean
}

function Toggle({ label, description, icon: Icon, defaultChecked }: ToggleProps) {
  return (
    <label className="flex items-start gap-[var(--ds-space-200)] cursor-pointer">
      <Icon className="w-5 h-5 text-[var(--ds-text-subtle)] mt-0.5" />
      <div className="flex-1">
        <div className="font-medium text-[var(--ds-font-size-100)]">{label}</div>
        <div className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">{description}</div>
      </div>
      <input type="checkbox" defaultChecked={defaultChecked} className="mt-1 w-4 h-4" />
    </label>
  )
}

export function NotificationsTab() {
  return (
    <Card className="p-[var(--ds-space-400)]">
      <h2 className="text-[var(--ds-font-size-300)] font-semibold mb-[var(--ds-space-300)]">Notificaciones</h2>
      <div className="space-y-[var(--ds-space-300)]">
        <Toggle icon={Mail} label="Email" description="Recibe notificaciones por email cuando un permiso esté por vencer" defaultChecked />
        <Toggle icon={Bell} label="Push" description="Notificaciones en el navegador" />
        <Toggle icon={MessageSquare} label="SMS" description="Mensajes de texto para alertas críticas" />
      </div>
    </Card>
  )
}
```

- [ ] **Step 4: Create SecurityTab**

Write to `src/features/settings/SecurityTab.tsx`:

```tsx
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Banner } from '@/components/ui/banner'
import { LogOut, Shield } from '@/lib/lucide-icons'

export function SecurityTab() {
  return (
    <Card className="p-[var(--ds-space-400)]">
      <h2 className="text-[var(--ds-font-size-300)] font-semibold mb-[var(--ds-space-300)]">Seguridad</h2>
      <div className="space-y-[var(--ds-space-300)]">
        <Banner variant="info">
          <div className="flex items-center gap-[var(--ds-space-100)]">
            <Shield className="w-5 h-5" />
            <span>Tu cuenta está protegida con autenticación de Google</span>
          </div>
        </Banner>

        <div>
          <h3 className="font-semibold text-[var(--ds-font-size-200)] mb-[var(--ds-space-100)]">Sesiones activas</h3>
          <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mb-[var(--ds-space-200)]">
            Actualmente estás conectado desde este dispositivo
          </p>
          <Button variant="destructive"><LogOut className="w-4 h-4" />Cerrar todas las sesiones</Button>
        </div>
      </div>
    </Card>
  )
}
```

- [ ] **Step 5: Update SettingsView with tabs**

Replace `src/features/settings/SettingsView.tsx`:

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ProfileTab } from './ProfileTab'
import { CompanyTab } from './CompanyTab'
import { NotificationsTab } from './NotificationsTab'
import { SecurityTab } from './SecurityTab'

export function SettingsView() {
  return (
    <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-400)]">
      <div className="max-w-4xl mx-auto space-y-[var(--ds-space-300)]">
        <h1 className="text-[var(--ds-font-size-500)] font-bold">Configuración</h1>

        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="company">Empresa</TabsTrigger>
            <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
            <TabsTrigger value="security">Seguridad</TabsTrigger>
          </TabsList>
          <TabsContent value="profile"><ProfileTab /></TabsContent>
          <TabsContent value="company"><CompanyTab /></TabsContent>
          <TabsContent value="notifications"><NotificationsTab /></TabsContent>
          <TabsContent value="security"><SecurityTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Verify**

Run: `npm run dev`. Navigate to `/settings`. Expected: 4 tabs with consistent layout.

- [ ] **Step 7: Commit**

```bash
git add src/features/settings/
git commit -m "feat(settings): tabbed layout with DS components

- Profile tab: avatar + editable fields
- Company tab: RUC and razón social fields
- Notifications tab: Email/Push/SMS toggles
- Security tab: session management + banner
- Consistent Card and Button usage"
```

---

## Part 17: Public Verification Page

**Files:**
- Modify: `src/features/public-links/PublicVerificationPage.tsx`

### Steps

- [ ] **Step 1: Update PublicVerificationPage**

Read current file and replace visual layout while preserving data fetching logic:

```tsx
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Shield } from '@/lib/lucide-icons'
// Keep existing hooks imports

export function PublicVerificationPage() {
  // ... keep existing data fetching logic ...

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--ds-neutral-50)] flex items-center justify-center">
        <div className="text-[var(--ds-text-subtle)]">Verificando permiso...</div>
      </div>
    )
  }

  if (!permit) {
    return (
      <div className="min-h-screen bg-[var(--ds-neutral-50)] flex items-center justify-center p-[var(--ds-space-400)]">
        <Card className="p-[var(--ds-space-600)] text-center">
          <div className="text-[var(--ds-red-500)] font-bold text-[var(--ds-font-size-300)]">Permiso no encontrado</div>
          <p className="text-[var(--ds-text-subtle)] mt-[var(--ds-space-150)]">Verifica que el enlace sea correcto</p>
        </Card>
      </div>
    )
  }

  const statusVariant = {
    vigente: 'status-vigente' as const,
    por_vencer: 'status-por-vencer' as const,
    vencido: 'status-vencido' as const,
    en_tramite: 'status-en-tramite' as const,
    no_registrado: 'status-no-registrado' as const,
  }[permit.status] ?? 'status-no-registrado' as const

  return (
    <div className="min-h-screen bg-[var(--ds-neutral-50)]">
      <header className="bg-white border-b border-[var(--ds-border)] p-[var(--ds-space-300)]">
        <div className="max-w-4xl mx-auto flex items-center gap-[var(--ds-space-150)]">
          <div className="w-8 h-8 rounded-[var(--ds-radius-100)] bg-[var(--ds-background-brand)] flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-semibold text-[var(--ds-text)]">EnRegla - Verificación</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-[var(--ds-space-400)]">
        <Card className="p-[var(--ds-space-600)]">
          <div className="flex justify-center mb-[var(--ds-space-300)]">
            <Badge variant={statusVariant} size="lg">{permit.status.replace('_', ' ')}</Badge>
          </div>

          <h2 className="text-[var(--ds-font-size-400)] font-bold text-center mb-[var(--ds-space-100)]">{permit.type}</h2>
          <p className="text-center font-mono text-[var(--ds-text-subtle)] mb-[var(--ds-space-400)]">{permit.permit_number}</p>

          <dl className="grid grid-cols-2 gap-[var(--ds-space-300)]">
            <div>
              <dt className="text-[var(--ds-font-size-075)] uppercase text-[var(--ds-text-subtle)]">Emisión</dt>
              <dd className="mt-[var(--ds-space-050)] text-[var(--ds-font-size-100)]">
                {permit.issued_at ? new Date(permit.issued_at).toLocaleDateString('es-EC') : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--ds-font-size-075)] uppercase text-[var(--ds-text-subtle)]">Vencimiento</dt>
              <dd className="mt-[var(--ds-space-050)] text-[var(--ds-font-size-100)]">
                {permit.expires_at ? new Date(permit.expires_at).toLocaleDateString('es-EC') : '-'}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-[var(--ds-font-size-075)] uppercase text-[var(--ds-text-subtle)]">Autoridad</dt>
              <dd className="mt-[var(--ds-space-050)] text-[var(--ds-font-size-100)]">{permit.authority || '-'}</dd>
            </div>
          </dl>

          <div className="mt-[var(--ds-space-400)] pt-[var(--ds-space-300)] border-t border-[var(--ds-border)] flex items-center justify-center gap-[var(--ds-space-100)] text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">
            <CheckCircle2 className="w-4 h-4 text-[var(--ds-green-500)]" />
            Verificado el {new Date().toLocaleDateString('es-EC')}
          </div>
        </Card>

        <footer className="text-center mt-[var(--ds-space-400)] text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">
          Powered by <a href="https://enregla.com" className="text-[var(--ds-text-brand)] hover:underline">EnRegla</a>
        </footer>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Verify**

Run: `npm run dev`. Navigate to a public verification URL. Expected: Clean branded verification card.

- [ ] **Step 3: Commit**

```bash
git add src/features/public-links/
git commit -m "feat(public): verification page with branded layout

- Simple public header with Shield logo
- Card with status badge, permit details, verification timestamp
- Footer with Powered by EnRegla link"
```

---

# ITERATIONS 2-5: RECURSIVE POLISH

After Iteration 1 completes, all 17 parts are implemented. Now begin recursive review loops.

## Iteration 2-5 Process

Each iteration follows identical steps:

### Step 1: Review All 17 Views

Create `docs/superpowers/reviews/iteration-{N}-review.md` with scoring table:

```markdown
# Iteration {N} Review

## Scoring Criteria (0-10 each, 10 total)
1. Uses Atlassian tokens exclusively (no hardcoded colors)
2. Uses Lucide icons (no emojis, no old icon libs)
3. Consistent shadows (--ds-shadow-*)
4. Consistent spacing (tokens)
5. Correct typography scale
6. Interactive states (hover/focus/active)
7. Responsive design
8. Premium loading states
9. Premium empty states
10. Accessibility (keyboard nav + ARIA)

## Scores

| View | T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | Total |
|------|----|----|----|----|----|----|----|----|----|-----|-------|
| Dashboard | | | | | | | | | | | |
| Sedes List | | | | | | | | | | | |
| Sedes Detail | | | | | | | | | | | |
| Mapa | | | | | | | | | | | |
| Permisos List | | | | | | | | | | | |
| Permisos Detail | | | | | | | | | | | |
| Renovaciones | | | | | | | | | | | |
| Marco Legal List | | | | | | | | | | | |
| Marco Legal Detail | | | | | | | | | | | |
| Login | | | | | | | | | | | |
| Onboarding | | | | | | | | | | | |
| Settings | | | | | | | | | | | |
| Public Verification | | | | | | | | | | | |

## Weakest 20% (to re-implement this iteration)
- {View 1} (score: X/100)
- {View 2} (score: X/100)
- {View 3} (score: X/100)

## Specific Issues
- {View 1}: Issue description, file:line
- {View 2}: Issue description, file:line
```

### Step 2: Identify Weakest 20%

Sort views by score. Pick bottom 20% (approx 3 views).

### Step 3: Re-implement Each Weak Area

For each weak view:
- [ ] Document current issues (specific, file paths)
- [ ] Write improvement plan (5-10 specific changes)
- [ ] Implement changes
- [ ] Verify view now scores higher
- [ ] Screenshot before/after in `docs/superpowers/screenshots/iteration-{N}/`

### Step 4: Commit Each Iteration

```bash
git add -A
git commit -m "polish(iteration-{N}): improve {view1}, {view2}, {view3}

{view1}: +{X} points - fixed {issues}
{view2}: +{X} points - fixed {issues}
{view3}: +{X} points - fixed {issues}

Average score: {before} → {after}"
```

### Convergence Expectations

- **Iteration 2**: Avg score 6-7 → 7-8 (fix obvious inconsistencies)
- **Iteration 3**: Avg score 7-8 → 8-9 (polish spacing, colors, transitions)
- **Iteration 4**: Avg score 8-9 → 9 (micro-interactions, edge cases)
- **Iteration 5**: Avg score 9 → 9-10 (accessibility, performance, perfection)

**Final target**: All views 9-10/10.

---

# FINAL VERIFICATION CHECKLIST

After all 5 iterations complete:

- [ ] `npm run build` succeeds with no errors
- [ ] `npm run lint` passes
- [ ] `npm run dev` works, all routes navigate correctly
- [ ] No hardcoded hex colors (grep: `grep -rn "#[0-9a-fA-F]\{6\}" src/`)
- [ ] No emojis in UI (grep: `grep -rn "🏢\|📋\|⚠" src/`)
- [ ] TaskBoard deleted
- [ ] DocumentVault deleted
- [ ] Dashboard has unified widget with React Flow map
- [ ] Sedes cards use compact Estado|Riesgo layout
- [ ] Mapa standalone works
- [ ] Permisos uses @tanstack/react-table
- [ ] Renovaciones uses 3-col grid
- [ ] Marco Legal has navigable cards with detail routes
- [ ] All forms use new Input/Select/Textarea
- [ ] All tables use consistent styling
- [ ] Accessibility: keyboard navigation works everywhere
- [ ] Responsive: all views work on mobile (< 768px)
- [ ] 5 iteration review documents exist
- [ ] Screenshots in `docs/superpowers/screenshots/iteration-{1..5}/`
- [ ] Final merge to main ready
