# ui-v2: shadcn Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build complete new UI using shadcn/ui from scratch with design-first approach, implementing all screens (Dashboard, Locations, Permits, Onboarding, Public View) with A/B design system testing

**Architecture:** Parallel directory structure (`features-v2/`) alongside existing features, feature flag routing via `VITE_UI_VERSION`, CSS variables for design tokens, shadcn components installed as-needed

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS 4, shadcn/ui, Radix UI, existing Supabase backend

---

## File Structure Overview

This plan will create/modify these files:

### Foundation (Milestone 1 - Setup)
- `src/config.ts` - Feature flags and config
- `src/styles/design-tokens-professional.css` - Design system option A (blue, trust)
- `src/styles/design-tokens-energetic.css` - Design system option B (orange, urgent)
- `.env.development` - Local dev environment variables
- `components.json` - shadcn configuration
- `tailwind.config.js` - Extended Tailwind theme
- `src/lib/utils.ts` - shadcn utility functions (cn helper)

### Dashboard Components (Milestone 1)
- `src/features-v2/dashboard/DashboardView.tsx` - Main dashboard view
- `src/features-v2/dashboard/RiskOverviewCard.tsx` - Hero card with risk level
- `src/features-v2/dashboard/MetricsGrid.tsx` - 3-column metrics grid
- `src/features-v2/dashboard/SedeCard.tsx` - Location card component
- `src/components/ui-v2/button.tsx` - shadcn button
- `src/components/ui-v2/card.tsx` - shadcn card
- `src/components/ui-v2/badge.tsx` - shadcn badge
- `src/components/ui-v2/StatusBadge.tsx` - Custom status badge wrapper
- `src/components/ui-v2/RiskBadge.tsx` - Custom risk badge wrapper
- `src/components/ui-v2/DesignSystemToggle.tsx` - Design system A/B toggle
- `src/App.tsx` - Modified for feature flag routing

### Location Detail (Milestone 2)
- `src/features-v2/locations/LocationDetailView.tsx`
- `src/features-v2/locations/PermitsTable.tsx`
- `src/features-v2/locations/PublicLinkBanner.tsx`
- `src/features-v2/permits/RenewPermitModal.tsx`
- `src/components/ui-v2/table.tsx` - shadcn table
- `src/components/ui-v2/dialog.tsx` - shadcn dialog
- `src/components/ui-v2/dropdown-menu.tsx` - shadcn dropdown

### Onboarding (Milestone 3)
- `src/features-v2/onboarding/OnboardingWizard.tsx`
- `src/features-v2/onboarding/steps/Step1Company.tsx`
- `src/features-v2/onboarding/steps/Step2Regulatory.tsx`
- `src/features-v2/onboarding/steps/Step3Locations.tsx`
- `src/features-v2/onboarding/steps/Step4Review.tsx`
- `src/components/ui-v2/input.tsx` - shadcn input
- `src/components/ui-v2/select.tsx` - shadcn select
- `src/components/ui-v2/checkbox.tsx` - shadcn checkbox
- `src/components/ui-v2/label.tsx` - shadcn label
- `src/components/ui-v2/form.tsx` - shadcn form

### Public Links (Milestone 4)
- `src/features-v2/publicLinks/GeneratePublicLinkModal.tsx`
- `src/features-v2/publicLinks/PublicLinkSuccessModal.tsx`
- `src/features-v2/publicLinks/PublicLinkQR.tsx`
- `src/components/ui-v2/toast.tsx` - shadcn toast

### Public View (Milestone 5)
- `src/features-v2/public/PublicVerificationView.tsx`

### Permit Detail (Milestone 6)
- `src/features-v2/permits/PermitDetailView.tsx`
- `src/features-v2/permits/PermitHistory.tsx`

### Layout (Milestone 7)
- `src/components/layout-v2/AppShell.tsx`
- `src/components/layout-v2/Sidebar.tsx`
- `src/components/layout-v2/TopBar.tsx`
- `src/components/ui-v2/separator.tsx` - shadcn separator
- `src/components/ui-v2/avatar.tsx` - shadcn avatar

### Remaining Screens (Milestone 8)
- `src/features-v2/auth/LoginView.tsx`
- `src/features-v2/locations/LocationListView.tsx`
- `src/features-v2/permits/PermitListView.tsx`
- `src/components/ui-v2/skeleton.tsx` - shadcn skeleton

---

## MILESTONE 1: Foundation + Dashboard

**Goal:** Setup design system, install shadcn, build Dashboard with A/B toggle

---

### Task 1: Foundation Setup - Design Tokens (Professional)

**Files:**
- Create: `src/styles/design-tokens-professional.css`

- [ ] **Step 1: Create design tokens file (Professional theme)**

```bash
mkdir -p src/styles
touch src/styles/design-tokens-professional.css
```

- [ ] **Step 2: Write Professional design tokens**

```css
/* src/styles/design-tokens-professional.css */

:root {
  /* Surface hierarchy */
  --color-background: #F8F9FA;
  --color-surface: #FFFFFF;
  --color-border-subtle: #E5E7EB;
  --color-border-default: #D1D5DB;
  --color-border-strong: #9CA3AF;
  
  /* Brand - Trust + Authority */
  --color-brand-primary: #1E3A8A;
  --color-brand-primary-hover: #1E40AF;
  --color-brand-accent: #E65100;
  --color-brand-accent-hover: #D84800;
  
  /* Text hierarchy */
  --color-text-primary: #111827;
  --color-text-secondary: #4B5563;
  --color-text-tertiary: #6B7280;
  --color-text-disabled: #9CA3AF;
  
  /* Semantic: Legal/Compliance Status */
  --color-legal-vigente: #059669;
  --color-legal-vigente-bg: #D1FAE5;
  --color-legal-por-vencer: #D97706;
  --color-legal-por-vencer-bg: #FEF3C7;
  --color-legal-vencido: #DC2626;
  --color-legal-vencido-bg: #FEE2E2;
  --color-legal-no-registrado: #6B7280;
  --color-legal-no-registrado-bg: #F3F4F6;
  --color-legal-en-tramite: #2563EB;
  --color-legal-en-tramite-bg: #DBEAFE;
  
  /* Semantic: Risk Levels */
  --color-risk-bajo: #10B981;
  --color-risk-bajo-bg: #D1FAE5;
  --color-risk-medio: #F59E0B;
  --color-risk-medio-bg: #FEF3C7;
  --color-risk-alto: #F97316;
  --color-risk-alto-bg: #FFEDD5;
  --color-risk-critico: #EF4444;
  --color-risk-critico-bg: #FEE2E2;
  
  /* Spacing - generous for premium feel */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;
  
  /* Typography */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', 'Consolas', monospace;
  
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
  
  /* Shadows - grounded */
  --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  
  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  
  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Z-index scale */
  --z-base: 0;
  --z-dropdown: 10;
  --z-sticky: 20;
  --z-overlay: 30;
  --z-modal: 40;
  --z-notification: 50;
}
```

- [ ] **Step 3: Import design tokens in main CSS**

```bash
# Modify src/index.css to import the design tokens
```

Add to the TOP of `src/index.css` (before @import "tailwindcss"):

```css
/* Import design tokens based on localStorage */
@import url('./styles/design-tokens-professional.css');
```

- [ ] **Step 4: Commit**

```bash
git add src/styles/design-tokens-professional.css src/index.css
git commit -m "feat(ui-v2): add Professional design system tokens

- Deep blue primary (#1E3A8A) for trust/authority
- Muted semantic colors for legal/compliance status
- Generous spacing scale for premium feel
- Professional shadows and transitions

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 2: Foundation Setup - Design Tokens (Energetic)

**Files:**
- Create: `src/styles/design-tokens-energetic.css`

- [ ] **Step 1: Create Energetic design tokens file**

```bash
touch src/styles/design-tokens-energetic.css
```

- [ ] **Step 2: Write Energetic design tokens**

```css
/* src/styles/design-tokens-energetic.css */

:root {
  /* Surface hierarchy */
  --color-background: #F6F7F9;
  --color-surface: #FFFFFF;
  --color-border-subtle: #E5E7EB;
  --color-border-default: #D1D5DB;
  --color-border-strong: #9CA3AF;
  
  /* Brand - Urgency + Action */
  --color-brand-primary: #E65100;
  --color-brand-primary-hover: #D84800;
  --color-brand-accent: #1E40AF;
  --color-brand-accent-hover: #1E3A8A;
  
  /* Text hierarchy */
  --color-text-primary: #111827;
  --color-text-secondary: #4B5563;
  --color-text-tertiary: #6B7280;
  --color-text-disabled: #9CA3AF;
  
  /* Semantic: Legal/Compliance Status - brighter */
  --color-legal-vigente: #10B981;
  --color-legal-vigente-bg: #D1FAE5;
  --color-legal-por-vencer: #F59E0B;
  --color-legal-por-vencer-bg: #FEF3C7;
  --color-legal-vencido: #EF4444;
  --color-legal-vencido-bg: #FEE2E2;
  --color-legal-no-registrado: #9CA3AF;
  --color-legal-no-registrado-bg: #F3F4F6;
  --color-legal-en-tramite: #3B82F6;
  --color-legal-en-tramite-bg: #DBEAFE;
  
  /* Semantic: Risk Levels - more vibrant */
  --color-risk-bajo: #10B981;
  --color-risk-bajo-bg: #D1FAE5;
  --color-risk-medio: #F59E0B;
  --color-risk-medio-bg: #FEF3C7;
  --color-risk-alto: #F97316;
  --color-risk-alto-bg: #FFEDD5;
  --color-risk-critico: #EF4444;
  --color-risk-critico-bg: #FEE2E2;
  
  /* Spacing, Typography, Shadows, Radius, Transitions - same as Professional */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;
  
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', 'Consolas', monospace;
  
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
  
  --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
  
  --z-base: 0;
  --z-dropdown: 10;
  --z-sticky: 20;
  --z-overlay: 30;
  --z-modal: 40;
  --z-notification: 50;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/styles/design-tokens-energetic.css
git commit -m "feat(ui-v2): add Energetic design system tokens

- Orange primary (#E65100) for urgency/action
- Brighter semantic colors for visibility
- Same spacing/typography as Professional
- Alternative A/B testing option

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 3: Foundation Setup - Config and Environment

**Files:**
- Create: `src/config.ts`
- Modify: `.env.development`

- [ ] **Step 1: Create config file**

```typescript
// src/config.ts

export const UI_VERSION = import.meta.env.VITE_UI_VERSION || 'v1';
export const DESIGN_SYSTEM = localStorage.getItem('design-system') || 'professional';
```

- [ ] **Step 2: Create/modify .env.development**

```bash
# .env.development

# Enable v2 UI for local development
VITE_UI_VERSION=v2

# Supabase credentials (keep existing)
VITE_SUPABASE_URL=your_existing_url
VITE_SUPABASE_ANON_KEY=your_existing_key
```

- [ ] **Step 3: Commit**

```bash
git add src/config.ts .env.development
git commit -m "feat(ui-v2): add feature flag config and env setup

- UI_VERSION flag for v1/v2 routing
- DESIGN_SYSTEM for localStorage-based design token switching
- Set v2 as default for local dev

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 4: shadcn Setup - Configuration

**Files:**
- Create: `components.json`
- Modify: `tailwind.config.js`
- Create: `src/lib/utils.ts`

- [ ] **Step 1: Create components.json for shadcn**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui-v2"
  }
}
```

- [ ] **Step 2: Create utils.ts for cn helper**

```bash
mkdir -p src/lib
touch src/lib/utils.ts
```

```typescript
// src/lib/utils.ts

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 3: Install required dependencies**

```bash
npm install clsx tailwind-merge class-variance-authority
```

Expected: Packages installed successfully

- [ ] **Step 4: Update tailwind.config.js**

```javascript
// tailwind.config.js

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        primary: 'var(--color-brand-primary)',
        'primary-hover': 'var(--color-brand-primary-hover)',
        accent: 'var(--color-brand-accent)',
        'accent-hover': 'var(--color-brand-accent-hover)',
        
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-tertiary': 'var(--color-text-tertiary)',
        
        border: {
          subtle: 'var(--color-border-subtle)',
          DEFAULT: 'var(--color-border-default)',
          strong: 'var(--color-border-strong)',
        },
        
        legal: {
          vigente: 'var(--color-legal-vigente)',
          'vigente-bg': 'var(--color-legal-vigente-bg)',
          'por-vencer': 'var(--color-legal-por-vencer)',
          'por-vencer-bg': 'var(--color-legal-por-vencer-bg)',
          vencido: 'var(--color-legal-vencido)',
          'vencido-bg': 'var(--color-legal-vencido-bg)',
          'no-registrado': 'var(--color-legal-no-registrado)',
          'no-registrado-bg': 'var(--color-legal-no-registrado-bg)',
          'en-tramite': 'var(--color-legal-en-tramite)',
          'en-tramite-bg': 'var(--color-legal-en-tramite-bg)',
        },
        
        risk: {
          bajo: 'var(--color-risk-bajo)',
          'bajo-bg': 'var(--color-risk-bajo-bg)',
          medio: 'var(--color-risk-medio)',
          'medio-bg': 'var(--color-risk-medio-bg)',
          alto: 'var(--color-risk-alto)',
          'alto-bg': 'var(--color-risk-alto-bg)',
          critico: 'var(--color-risk-critico)',
          'critico-bg': 'var(--color-risk-critico-bg)',
        },
      },
      spacing: {
        1: 'var(--space-1)',
        2: 'var(--space-2)',
        3: 'var(--space-3)',
        4: 'var(--space-4)',
        5: 'var(--space-5)',
        6: 'var(--space-6)',
        8: 'var(--space-8)',
        10: 'var(--space-10)',
        12: 'var(--space-12)',
        16: 'var(--space-16)',
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
      },
      fontSize: {
        xs: 'var(--text-xs)',
        sm: 'var(--text-sm)',
        base: 'var(--text-base)',
        lg: 'var(--text-lg)',
        xl: 'var(--text-xl)',
        '2xl': 'var(--text-2xl)',
        '3xl': 'var(--text-3xl)',
      },
      fontWeight: {
        normal: 'var(--font-weight-normal)',
        medium: 'var(--font-weight-medium)',
        semibold: 'var(--font-weight-semibold)',
        bold: 'var(--font-weight-bold)',
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      transitionDuration: {
        fast: 'var(--transition-fast)',
        base: 'var(--transition-base)',
        slow: 'var(--transition-slow)',
      },
      zIndex: {
        base: 'var(--z-base)',
        dropdown: 'var(--z-dropdown)',
        sticky: 'var(--z-sticky)',
        overlay: 'var(--z-overlay)',
        modal: 'var(--z-modal)',
        notification: 'var(--z-notification)',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 5: Commit**

```bash
git add components.json src/lib/utils.ts tailwind.config.js package.json package-lock.json
git commit -m "feat(ui-v2): configure shadcn and extend Tailwind theme

- Add components.json with ui-v2 alias
- Create cn() utility helper
- Extend Tailwind with design token mappings
- Install clsx, tailwind-merge, class-variance-authority

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 5: Install shadcn Components (Button, Card, Badge)

**Files:**
- Create: `src/components/ui-v2/button.tsx`
- Create: `src/components/ui-v2/card.tsx`
- Create: `src/components/ui-v2/badge.tsx`

- [ ] **Step 1: Create ui-v2 directory**

```bash
mkdir -p src/components/ui-v2
```

- [ ] **Step 2: Install button component via shadcn CLI**

```bash
npx shadcn-ui@latest add button
```

When prompted:
- Choose: Install to `src/components/ui-v2`
- Confirm installation

Expected: button.tsx created in src/components/ui-v2/

- [ ] **Step 3: Install card component**

```bash
npx shadcn-ui@latest add card
```

Expected: card.tsx created in src/components/ui-v2/

- [ ] **Step 4: Install badge component**

```bash
npx shadcn-ui@latest add badge
```

Expected: badge.tsx created in src/components/ui-v2/

- [ ] **Step 5: Verify installations**

```bash
ls -la src/components/ui-v2/
```

Expected files:
- button.tsx
- card.tsx
- badge.tsx

- [ ] **Step 6: Commit**

```bash
git add src/components/ui-v2/
git commit -m "feat(ui-v2): install shadcn button, card, badge components

- button: primary actions with variants
- card: main content containers
- badge: status indicators

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 6: Custom Badge Wrappers (StatusBadge, RiskBadge)

**Files:**
- Create: `src/components/ui-v2/StatusBadge.tsx`
- Create: `src/components/ui-v2/RiskBadge.tsx`

- [ ] **Step 1: Create StatusBadge component**

```typescript
// src/components/ui-v2/StatusBadge.tsx

import { Badge } from './badge';
import { cn } from '@/lib/utils';

type PermitStatus = 'vigente' | 'por_vencer' | 'vencido' | 'no_registrado' | 'en_tramite';

const statusConfig: Record<PermitStatus, { label: string; className: string }> = {
  vigente: {
    label: 'Vigente',
    className: 'bg-legal-vigente-bg text-legal-vigente border-legal-vigente',
  },
  por_vencer: {
    label: 'Por Vencer',
    className: 'bg-legal-por-vencer-bg text-legal-por-vencer border-legal-por-vencer',
  },
  vencido: {
    label: 'Vencido',
    className: 'bg-legal-vencido-bg text-legal-vencido border-legal-vencido',
  },
  no_registrado: {
    label: 'No Registrado',
    className: 'bg-legal-no-registrado-bg text-legal-no-registrado border-legal-no-registrado',
  },
  en_tramite: {
    label: 'En Trámite',
    className: 'bg-legal-en-tramite-bg text-legal-en-tramite border-legal-en-tramite',
  },
};

interface StatusBadgeProps {
  status: PermitStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge 
      variant="outline"
      className={cn('font-semibold border', config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
```

- [ ] **Step 2: Create RiskBadge component**

```typescript
// src/components/ui-v2/RiskBadge.tsx

import { Badge } from './badge';
import { cn } from '@/lib/utils';

type RiskLevel = 'bajo' | 'medio' | 'alto' | 'critico';

const riskConfig: Record<RiskLevel, { label: string; className: string }> = {
  bajo: {
    label: 'Riesgo Bajo',
    className: 'bg-risk-bajo-bg text-risk-bajo border-risk-bajo',
  },
  medio: {
    label: 'Riesgo Medio',
    className: 'bg-risk-medio-bg text-risk-medio border-risk-medio',
  },
  alto: {
    label: 'Riesgo Alto',
    className: 'bg-risk-alto-bg text-risk-alto border-risk-alto',
  },
  critico: {
    label: 'Riesgo Crítico',
    className: 'bg-risk-critico-bg text-risk-critico border-risk-critico',
  },
};

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
}

export function RiskBadge({ level, className }: RiskBadgeProps) {
  const config = riskConfig[level];
  return (
    <Badge 
      variant="outline"
      className={cn('font-semibold border', config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui-v2/StatusBadge.tsx src/components/ui-v2/RiskBadge.tsx
git commit -m "feat(ui-v2): add custom badge wrappers for status and risk

- StatusBadge: semantic permit status colors
- RiskBadge: risk level visualization
- Maps to design token color system

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 7: Design System Toggle Component

**Files:**
- Create: `src/components/ui-v2/DesignSystemToggle.tsx`

- [ ] **Step 1: Create DesignSystemToggle component**

```typescript
// src/components/ui-v2/DesignSystemToggle.tsx

import { useState } from 'react';
import { DESIGN_SYSTEM } from '@/config';

export function DesignSystemToggle() {
  const [system, setSystem] = useState(DESIGN_SYSTEM);
  
  const toggleSystem = () => {
    const newSystem = system === 'professional' ? 'energetic' : 'professional';
    setSystem(newSystem);
    localStorage.setItem('design-system', newSystem);
    
    // Swap CSS files by removing old and adding new
    const oldLink = document.getElementById('design-tokens');
    if (oldLink) {
      oldLink.remove();
    }
    
    const link = document.createElement('link');
    link.id = 'design-tokens';
    link.rel = 'stylesheet';
    link.href = `/src/styles/design-tokens-${newSystem}.css`;
    document.head.appendChild(link);
    
    // Force page reload to apply new tokens
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };
  
  return (
    <div className="fixed top-4 right-4 z-notification bg-surface rounded-lg shadow-lg p-2 border border-border-default">
      <button
        onClick={toggleSystem}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-gray-50 rounded-md transition-colors"
        type="button"
      >
        <span role="img" aria-label="Design">🎨</span>
        <span className="font-semibold">
          {system === 'professional' ? 'Professional (Blue)' : 'Energetic (Orange)'}
        </span>
        <span className="text-xs text-text-tertiary ml-2">Click to switch</span>
      </button>
      <p className="text-xs text-text-tertiary mt-1 px-3">
        Testing design systems - choice applies to all screens
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui-v2/DesignSystemToggle.tsx
git commit -m "feat(ui-v2): add design system toggle for A/B testing

- Toggle between Professional (blue) and Energetic (orange)
- Persists choice in localStorage
- Swaps CSS token files dynamically
- Fixed position in top-right corner

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 8: Dashboard - Directory Structure

**Files:**
- Create: `src/features-v2/dashboard/` directory

- [ ] **Step 1: Create features-v2 directory structure**

```bash
mkdir -p src/features-v2/dashboard
```

- [ ] **Step 2: Verify directory exists**

```bash
ls -la src/features-v2/
```

Expected: dashboard/ directory present

- [ ] **Step 3: Commit directory structure**

```bash
git add src/features-v2/.gitkeep
touch src/features-v2/.gitkeep
git add src/features-v2/
git commit -m "feat(ui-v2): create features-v2 directory structure

- Parallel feature directory for v2 UI
- Dashboard subdirectory for milestone 1

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 9: Dashboard - RiskOverviewCard Component

**Files:**
- Create: `src/features-v2/dashboard/RiskOverviewCard.tsx`

- [ ] **Step 1: Create RiskOverviewCard component**

```typescript
// src/features-v2/dashboard/RiskOverviewCard.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui-v2/card';
import { RiskBadge } from '@/components/ui-v2/RiskBadge';
import { AlertCircle } from 'lucide-react';

interface RiskOverviewCardProps {
  metrics: {
    vigentes: number;
    porVencer: number;
    faltantes: number;
    compliance: number;
  };
}

export function RiskOverviewCard({ metrics }: RiskOverviewCardProps) {
  // Calculate overall risk level
  const getRiskLevel = (): 'bajo' | 'medio' | 'alto' | 'critico' => {
    const alerts = metrics.porVencer + metrics.faltantes;
    if (alerts === 0) return 'bajo';
    if (alerts <= 2) return 'medio';
    if (alerts <= 4) return 'alto';
    return 'critico';
  };

  const riskLevel = getRiskLevel();
  const totalAlerts = metrics.porVencer + metrics.faltantes;

  return (
    <Card className="border-border-default shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-text-primary">
          Estado General del Cumplimiento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Risk Level Badge */}
        <div className="flex items-center justify-center">
          <RiskBadge level={riskLevel} className="text-lg px-6 py-3" />
        </div>

        {/* Compliance Percentage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-text-secondary">Cumplimiento</span>
            <span className="font-bold text-text-primary">{Math.round(metrics.compliance)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-slow"
              style={{ width: `${metrics.compliance}%` }}
            />
          </div>
          <p className="text-xs text-text-tertiary">
            {metrics.vigentes} de {metrics.vigentes + metrics.porVencer + metrics.faltantes} permisos vigentes
          </p>
        </div>

        {/* Alerts */}
        {totalAlerts > 0 && (
          <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-md">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm font-medium text-amber-800">
              {totalAlerts} {totalAlerts === 1 ? 'alerta que requiere' : 'alertas que requieren'} atención
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Install lucide-react icons**

```bash
npm install lucide-react
```

Expected: lucide-react installed successfully

- [ ] **Step 3: Test component renders (visual check in next task)**

- [ ] **Step 4: Commit**

```bash
git add src/features-v2/dashboard/RiskOverviewCard.tsx package.json package-lock.json
git commit -m "feat(ui-v2): add RiskOverviewCard dashboard component

- Hero card showing overall compliance status
- Dynamic risk level calculation
- Compliance progress bar
- Alert notifications for attention items
- Install lucide-react for icons

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 10: Dashboard - MetricsGrid Component

**Files:**
- Create: `src/features-v2/dashboard/MetricsGrid.tsx`

- [ ] **Step 1: Create MetricsGrid component**

```typescript
// src/features-v2/dashboard/MetricsGrid.tsx

import { Card, CardContent } from '@/components/ui-v2/card';
import { CalendarCheck, AlertCircle, XCircle } from 'lucide-react';

interface MetricsGridProps {
  metrics: {
    vigentes: number;
    porVencer: number;
    faltantes: number;
  };
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Vigentes */}
      <Card className="border-border-default shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <CalendarCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-secondary mb-1">
                Permisos Vigentes
              </p>
              <p className="text-3xl font-bold text-text-primary">
                {metrics.vigentes}
              </p>
              <p className="text-xs text-text-tertiary mt-1">
                En regla y actualizados
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Por Vencer */}
      <Card className="border-border-default shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-secondary mb-1">
                Por Vencer
              </p>
              <p className="text-3xl font-bold text-amber-600">
                {metrics.porVencer}
              </p>
              <p className="text-xs text-text-tertiary mt-1">
                Requieren renovación pronto
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Faltantes */}
      <Card className="border-border-default shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-secondary mb-1">
                Faltantes
              </p>
              <p className="text-3xl font-bold text-red-600">
                {metrics.faltantes}
              </p>
              <p className="text-xs text-text-tertiary mt-1">
                No registrados
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features-v2/dashboard/MetricsGrid.tsx
git commit -m "feat(ui-v2): add MetricsGrid dashboard component

- 3-column grid layout (responsive)
- Vigentes, Por Vencer, Faltantes metrics
- Icon-based visual indicators
- Color-coded by status severity

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 11: Dashboard - SedeCard Component

**Files:**
- Create: `src/features-v2/dashboard/SedeCard.tsx`

- [ ] **Step 1: Create SedeCard component**

```typescript
// src/features-v2/dashboard/SedeCard.tsx

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui-v2/card';
import { Button } from '@/components/ui-v2/button';
import { StatusBadge } from '@/components/ui-v2/StatusBadge';
import { RiskBadge } from '@/components/ui-v2/RiskBadge';
import { Building2, MapPin, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Location } from '@/types/database';

interface SedeCardProps {
  location: Location;
  permitCount?: {
    vigentes: number;
    total: number;
  };
}

export function SedeCard({ location, permitCount }: SedeCardProps) {
  const navigate = useNavigate();

  const statusLabels: Record<string, string> = {
    operando: 'Operando',
    en_preparacion: 'En Preparación',
    cerrado: 'Cerrado',
  };

  return (
    <Card className="border-border-default shadow-sm hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-bold text-text-primary truncate">
              {location.name}
            </CardTitle>
            <div className="flex items-center gap-1 mt-1 text-sm text-text-tertiary">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{location.address}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Status and Risk Badges */}
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={location.status as any} />
          <RiskBadge level={location.risk_level} />
        </div>

        {/* Permit Count */}
        {permitCount && (
          <div className="pt-3 border-t border-border-subtle">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Permisos</span>
              <span className={`text-sm font-semibold ${
                permitCount.vigentes === permitCount.total 
                  ? 'text-emerald-600' 
                  : 'text-amber-600'
              }`}>
                {permitCount.vigentes}/{permitCount.total}
              </span>
            </div>
            {permitCount.vigentes === permitCount.total ? (
              <p className="text-xs text-emerald-600 mt-1">✓ Todo en orden</p>
            ) : (
              <p className="text-xs text-amber-600 mt-1">⚠ Requiere atención</p>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          variant="ghost"
          className="w-full justify-between"
          onClick={() => navigate(`/sedes/${location.id}`)}
        >
          <span>Ver detalle</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features-v2/dashboard/SedeCard.tsx
git commit -m "feat(ui-v2): add SedeCard dashboard component

- Location card with name, address, status
- Status and risk badges
- Permit count summary
- Click to navigate to detail view

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 12: Dashboard - Main DashboardView Component

**Files:**
- Create: `src/features-v2/dashboard/DashboardView.tsx`

- [ ] **Step 1: Create DashboardView component**

```typescript
// src/features-v2/dashboard/DashboardView.tsx

import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocations } from '@/hooks/useLocations';
import { usePermits } from '@/hooks/usePermits';
import { RiskOverviewCard } from './RiskOverviewCard';
import { MetricsGrid } from './MetricsGrid';
import { SedeCard } from './SedeCard';
import { DesignSystemToggle } from '@/components/ui-v2/DesignSystemToggle';

export function DashboardView() {
  const { companyId } = useAuth();
  const { locations, loading: loadingLocations } = useLocations(companyId);
  const { permits, loading: loadingPermits } = usePermits({ companyId });

  // Calculate dashboard metrics
  const metrics = useMemo(() => {
    const vigentes = permits.filter(p => p.status === 'vigente' && p.is_active).length;
    const porVencer = permits.filter(p => p.status === 'por_vencer' && p.is_active).length;
    const faltantes = permits.filter(p => p.status === 'no_registrado' && p.is_active).length;
    const total = permits.filter(p => p.is_active).length;
    const compliance = total > 0 ? (vigentes / total) * 100 : 0;

    return { vigentes, porVencer, faltantes, compliance };
  }, [permits]);

  // Calculate permit counts per location
  const locationPermitCounts = useMemo(() => {
    const counts: Record<string, { vigentes: number; total: number }> = {};
    
    locations.forEach(location => {
      const locationPermits = permits.filter(p => p.location_id === location.id && p.is_active);
      const vigentes = locationPermits.filter(p => p.status === 'vigente').length;
      counts[location.id] = {
        vigentes,
        total: locationPermits.length,
      };
    });

    return counts;
  }, [locations, permits]);

  // Loading state
  if (loadingLocations || loadingPermits) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="h-48 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-3 gap-6">
            <div className="h-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Design System Toggle - only in dev */}
      {import.meta.env.DEV && <DesignSystemToggle />}

      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
            <p className="text-text-secondary mt-1">Resumen general de cumplimiento</p>
          </div>

          {/* Risk Overview */}
          <RiskOverviewCard metrics={metrics} />

          {/* Metrics Grid */}
          <MetricsGrid metrics={metrics} />

          {/* Sedes Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-text-primary">Sedes</h2>
              <span className="text-sm text-text-tertiary">
                {locations.length} {locations.length === 1 ? 'sede' : 'sedes'}
              </span>
            </div>
            
            {locations.length === 0 ? (
              <div className="text-center py-12 bg-surface rounded-lg border border-border-subtle">
                <p className="text-text-secondary">No hay sedes registradas</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {locations.map(location => (
                  <SedeCard
                    key={location.id}
                    location={location}
                    permitCount={locationPermitCounts[location.id]}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features-v2/dashboard/DashboardView.tsx
git commit -m "feat(ui-v2): add main DashboardView component

- Integrates RiskOverviewCard, MetricsGrid, SedeCards
- Uses existing useAuth, useLocations, usePermits hooks
- Calculates metrics from real Supabase data
- Includes design system toggle in dev mode
- Loading states and empty states

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 13: Feature Flag Routing Setup

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Read current App.tsx to understand structure**

```bash
head -50 src/App.tsx
```

- [ ] **Step 2: Modify App.tsx to add feature flag routing**

Add imports at top:

```typescript
import { UI_VERSION } from '@/config';
import { DashboardView as DashboardViewV2 } from '@/features-v2/dashboard/DashboardView';
```

After the existing import of DashboardView, add route component selection:

```typescript
// Select route components based on UI_VERSION
const Dashboard = UI_VERSION === 'v2' ? DashboardViewV2 : DashboardView;
```

In the Routes section, replace:
```typescript
<Route path="/" element={<DashboardView />} />
```

With:
```typescript
<Route path="/" element={<Dashboard />} />
```

- [ ] **Step 3: Test that it compiles**

```bash
npm run dev
```

Expected: Dev server starts without errors

- [ ] **Step 4: Stop dev server (Ctrl+C)**

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat(ui-v2): add feature flag routing for Dashboard

- Import DashboardViewV2 from features-v2
- Select component based on UI_VERSION config
- Dashboard route now switches between v1/v2

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 14: Visual Testing - Dashboard

**Files:**
- None (testing task)

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

Expected: Server starts on http://localhost:5173

- [ ] **Step 2: Open browser and navigate to http://localhost:5173**

Expected:
- Login screen appears (if not logged in)
- After login, Dashboard v2 loads
- Design system toggle appears in top-right
- RiskOverviewCard shows with risk badge
- MetricsGrid shows 3 metrics cards
- SedeCards grid shows locations

- [ ] **Step 3: Test design system toggle**

Click the design system toggle button in top-right

Expected:
- Page reloads
- Colors change from blue (Professional) to orange (Energetic) or vice versa
- All badges and buttons reflect new color scheme

- [ ] **Step 4: Test with Professional theme**

If currently on Energetic, toggle back to Professional

Expected:
- Primary buttons are deep blue (#1E3A8A)
- Overall feel is trust/authority

- [ ] **Step 5: Test with Energetic theme**

Toggle to Energetic

Expected:
- Primary buttons/accents are orange (#E65100)
- Overall feel is urgent/action-oriented

- [ ] **Step 6: Test sede card navigation**

Click "Ver detalle" on any sede card

Expected:
- Navigates to `/sedes/:id`
- Old v1 LocationDetailView loads (v2 not implemented yet)

- [ ] **Step 7: Navigate back to Dashboard**

Click browser back button or navigate to `/`

Expected:
- Dashboard v2 loads again
- Design system choice persists (from localStorage)

- [ ] **Step 8: Stop dev server (Ctrl+C) when testing complete**

- [ ] **Step 9: Document testing results in commit message**

```bash
git commit --allow-empty -m "test(ui-v2): Dashboard visual validation complete

Tested:
✓ Dashboard loads with real Supabase data
✓ RiskOverviewCard calculates risk correctly
✓ MetricsGrid shows accurate counts
✓ SedeCards display all locations
✓ Design system toggle works (Professional ↔ Energetic)
✓ Color tokens apply correctly
✓ Navigation to detail views works

Ready for staging deployment and user A/B testing

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 15: Milestone 1 Complete - Deploy to Staging

**Files:**
- None (deployment task)

- [ ] **Step 1: Ensure all changes are committed**

```bash
git status
```

Expected: Working tree clean

- [ ] **Step 2: Push branch to remote**

```bash
git push origin feature/ui-v2
```

Expected: Branch pushed successfully

- [ ] **Step 3: Create Vercel staging environment (if not exists)**

In Vercel dashboard:
1. Go to Project Settings
2. Add Environment Variable for Staging:
   - Key: `VITE_UI_VERSION`
   - Value: `v2`
   - Environment: Preview

- [ ] **Step 4: Deploy to Vercel staging**

```bash
# Vercel will auto-deploy on push, or trigger manually:
vercel --prod
```

Expected: Deployment successful, URL provided

- [ ] **Step 5: Test staging URL**

Navigate to staging URL (e.g., `https://enregla-git-feature-ui-v2-youraccount.vercel.app`)

Expected:
- Dashboard v2 loads
- Design system toggle works
- Real data from Supabase displays

- [ ] **Step 6: Share staging URL with user for A/B testing**

Message to user:
```
🎨 Dashboard v2 is live on staging!

URL: [staging-url]

Please test BOTH design systems:
1. Click the toggle in top-right to switch between Professional (blue) and Energetic (orange)
2. Explore the dashboard with each theme
3. Let me know which design system feels right for the Supermaxi demo

Once you choose, I'll continue building the remaining screens with your selected design system.
```

- [ ] **Step 7: Wait for user feedback on design system choice**

---

## MILESTONE 1 CHECKPOINT

**Completed:**
- ✅ Design token files (Professional + Energetic)
- ✅ shadcn configuration and setup
- ✅ Feature flag system
- ✅ Dashboard components (RiskOverviewCard, MetricsGrid, SedeCard)
- ✅ Design system toggle for A/B testing
- ✅ Feature flag routing in App.tsx
- ✅ Visual testing locally
- ✅ Deployed to staging

**Next Steps (After User Chooses Design System):**
- Milestone 2: Location Detail View
- Milestone 3: Onboarding Wizard
- Milestone 4: Public Link Generation
- Milestone 5: Public Verification View
- Milestone 6: Permit Detail & History
- Milestone 7: Layout Components (Sidebar, TopBar)
- Milestone 8: Remaining Screens + Polish

**User Decision Point:**
Once user reviews staging and chooses design system (Professional or Energetic), continue with Milestone 2 implementation using the selected design.

---

## MILESTONE 2 Preview: Location Detail View

**Goal:** Detail view with permits table, public link banner, renew modal

**shadcn components needed:**
- `table` - Permits table
- `dialog` - Renew modal
- `dropdown-menu` - Actions menu

**Components to build:**
- `LocationDetailView.tsx` - Main detail view
- `PermitsTable.tsx` - Sortable permits table
- `PublicLinkBanner.tsx` - Active link indicator
- `RenewPermitModal.tsx` - Basic renewal modal

**Tasks:**
1. Install shadcn table, dialog, dropdown-menu components
2. Create PermitsTable with sorting
3. Create PublicLinkBanner (if link exists)
4. Create basic RenewPermitModal
5. Create LocationDetailView integrating all pieces
6. Add feature flag routing for location detail
7. Visual testing
8. Deploy to staging for user review

*(Detailed task breakdown will be provided after Milestone 1 user feedback)*

---

**End of Milestone 1 Implementation Plan**

**Status:** Awaiting user feedback on design system choice (Professional vs Energetic) before proceeding to Milestone 2.
