# ui-v2: shadcn Migration from Scratch - Design Specification

**Date:** 2026-04-14  
**Branch:** `feature/ui-v2`  
**Objective:** Build complete new UI using shadcn/ui from ground up, reusing existing backend/hooks/API

---

## Executive Summary

The previous shadcn migration (Session 1-4) failed because it tried to ADAPT existing custom components TO shadcn. This created a hybrid mess that looked terrible.

**New Approach:** Build ui-v2 from scratch in parallel directory structure, designing FOR shadcn from the start while preserving all working backend logic.

**Key Decisions:**
- ✅ **Design-first:** shadcn provides primitives (Radix UI), not the design system
- ✅ **Start fresh:** New `features-v2/` directory, rewrite all UI components
- ✅ **Feature flag:** Toggle between v1/v2 at runtime via `VITE_UI_VERSION`
- ✅ **Full scope:** Implement all screens (Dashboard, Locations, Permits, Onboarding, Public View)
- ✅ **Design tokens:** CSS variables for colors, spacing, typography
- ✅ **Install as needed:** Add shadcn components per screen, not upfront bulk install
- ✅ **A/B design systems:** Build with TWO design token files, user chooses which after seeing Dashboard

---

## Architecture: Approach A - Parallel Features with Route-Level Flag

### Directory Structure

```
src/
├── features/              # v1 - existing features (UNTOUCHED during development)
│   ├── dashboard/
│   ├── locations/
│   ├── permits/
│   ├── onboarding/
│   ├── publicLinks/
│   └── public/
│
├── features-v2/           # v2 - NEW shadcn-based features
│   ├── auth/
│   │   └── LoginView.tsx
│   ├── dashboard/
│   │   ├── DashboardView.tsx
│   │   ├── RiskOverviewCard.tsx
│   │   ├── MetricsGrid.tsx
│   │   ├── SedeCard.tsx
│   │   └── UpcomingRenewals.tsx
│   ├── locations/
│   │   ├── LocationListView.tsx
│   │   ├── LocationDetailView.tsx
│   │   ├── PermitsTable.tsx
│   │   └── PublicLinkBanner.tsx
│   ├── permits/
│   │   ├── PermitListView.tsx
│   │   ├── PermitDetailView.tsx
│   │   ├── RenewPermitModal.tsx
│   │   └── PermitHistory.tsx
│   ├── onboarding/
│   │   ├── OnboardingWizard.tsx
│   │   └── steps/
│   │       ├── Step1Company.tsx
│   │       ├── Step2Regulatory.tsx
│   │       ├── Step3Locations.tsx
│   │       └── Step4Review.tsx
│   ├── publicLinks/
│   │   ├── GeneratePublicLinkModal.tsx
│   │   ├── PublicLinkSuccessModal.tsx
│   │   └── PublicLinkQR.tsx
│   └── public/
│       └── PublicVerificationView.tsx
│
├── components/
│   ├── ui/                # v1 - existing custom components
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   └── ...
│   └── ui-v2/             # v2 - shadcn components
│       ├── button.tsx     # shadcn (lowercase convention)
│       ├── card.tsx       # shadcn
│       ├── dialog.tsx     # shadcn
│       ├── input.tsx      # shadcn
│       ├── select.tsx     # shadcn
│       ├── badge.tsx      # shadcn
│       ├── table.tsx      # shadcn
│       └── DesignSystemToggle.tsx  # Custom component for A/B testing
│
├── components/layout/     # SHARED - used by both v1 and v2
│   ├── AppShell.tsx       # May need v2 version
│   ├── Sidebar.tsx        # May need v2 version
│   └── TopBar.tsx         # May need v2 version
│
├── hooks/                 # SHARED - both v1 and v2 use these
│   ├── useAuth.ts
│   ├── useLocations.ts
│   ├── usePermits.ts
│   ├── useDocuments.ts
│   └── usePublicLink.ts
│
├── lib/                   # SHARED - API layer
│   ├── supabase.ts
│   ├── utils.ts          # shadcn utilities (cn() helper)
│   └── api/
│       ├── auth.ts
│       ├── permits.ts
│       ├── locations.ts
│       ├── documents.ts
│       ├── publicLinks.ts
│       └── onboarding.ts
│
├── store/                 # SHARED - state management
│   └── authStore.ts
│
├── types/                 # SHARED - TypeScript definitions
│   └── database.ts
│
├── styles/
│   ├── design-tokens-professional.css  # Option A: Deep blue, muted
│   └── design-tokens-energetic.css     # Option B: Orange, bright
│
├── config.ts              # Feature flags and config
└── App.tsx                # Route switching based on UI_VERSION
```

### Feature Flag System

```typescript
// src/config.ts
export const UI_VERSION = import.meta.env.VITE_UI_VERSION || 'v1';
export const DESIGN_SYSTEM = localStorage.getItem('design-system') || 'professional';
```

```typescript
// src/App.tsx
import { DashboardView } from '@/features/dashboard/DashboardView';
import { DashboardView as DashboardViewV2 } from '@/features-v2/dashboard/DashboardView';
import { LocationDetailView } from '@/features/locations/LocationDetailView';
import { LocationDetailView as LocationDetailViewV2 } from '@/features-v2/locations/LocationDetailView';
import { UI_VERSION } from '@/config';

// Route components selection
const Dashboard = UI_VERSION === 'v2' ? DashboardViewV2 : DashboardView;
const LocationDetail = UI_VERSION === 'v2' ? LocationDetailViewV2 : LocationDetailView;
// ... repeat for all routes

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginView />} />
        
        <Route element={<ProtectedRoute><ProtectedOnboardingRoute /></ProtectedRoute>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/sedes" element={<LocationList />} />
          <Route path="/sedes/:id" element={<LocationDetail />} />
          <Route path="/permisos" element={<PermitList />} />
          <Route path="/permisos/:id" element={<PermitDetail />} />
          {/* ... other routes */}
        </Route>
        
        <Route path="/p/:token" element={<PublicVerification />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### Environment Configuration

```bash
# .env.development (local dev - use v2)
VITE_UI_VERSION=v2

# .env.production (or leave unset - defaults to v1)
VITE_UI_VERSION=v1

# Vercel staging environment variable
VITE_UI_VERSION=v2
```

### Migration Path

1. **Phase 1 (Development):** Build all `features-v2/` alongside existing `features/`
2. **Phase 2 (Testing):** Set `VITE_UI_VERSION=v2` locally, test all flows
3. **Phase 3 (Staging):** Deploy to Vercel staging with `VITE_UI_VERSION=v2`
4. **Phase 4 (Review):** User reviews staging, provides feedback
5. **Phase 5 (Cleanup - after validation):**
   - Delete `src/features/` directory
   - Delete `src/components/ui/` directory
   - Rename `features-v2/` → `features/`
   - Rename `ui-v2/` → `ui/`
   - Remove feature flag code from `App.tsx`
   - Delete unused design tokens file
   - Set `VITE_UI_VERSION=v2` in production

---

## Design System: A/B Testing Approach

### Two Design Token Files

**Option A: Professional (Deep Blue, Trust-focused)**

```css
/* src/styles/design-tokens-professional.css */

:root {
  /* Surface hierarchy */
  --color-background: #F8F9FA;
  --color-surface: #FFFFFF;
  --color-border-subtle: #E5E7EB;
  --color-border-default: #D1D5DB;
  
  /* Brand - Trust + Authority */
  --color-brand-primary: #1E3A8A;        /* Deep blue */
  --color-brand-primary-hover: #1E40AF;
  --color-brand-accent: #E65100;         /* Orange for CTAs */
  --color-brand-accent-hover: #D84800;
  
  /* Text hierarchy */
  --color-text-primary: #111827;
  --color-text-secondary: #4B5563;
  --color-text-tertiary: #6B7280;
  
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
  
  /* Shadows - grounded */
  --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  
  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  
  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

**Option B: Energetic (Orange Primary, Urgent)**

```css
/* src/styles/design-tokens-energetic.css */

:root {
  /* Surface hierarchy */
  --color-background: #F6F7F9;
  --color-surface: #FFFFFF;
  --color-border-subtle: #E5E7EB;
  --color-border-default: #D1D5DB;
  
  /* Brand - Urgency + Action */
  --color-brand-primary: #E65100;        /* Orange primary */
  --color-brand-primary-hover: #D84800;
  --color-brand-accent: #1E40AF;         /* Blue for secondary */
  --color-brand-accent-hover: #1E3A8A;
  
  /* Text hierarchy */
  --color-text-primary: #111827;
  --color-text-secondary: #4B5563;
  --color-text-tertiary: #6B7280;
  
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
  
  /* Spacing, Typography, Shadows, Radius, Transitions */
  /* (Same as Professional - only colors differ) */
}
```

### Design System Toggle Component

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
    
    // Swap CSS files
    const oldLink = document.getElementById('design-tokens');
    if (oldLink) {
      oldLink.remove();
    }
    
    const link = document.createElement('link');
    link.id = 'design-tokens';
    link.rel = 'stylesheet';
    link.href = `/src/styles/design-tokens-${newSystem}.css`;
    document.head.appendChild(link);
    
    // Force re-render
    window.location.reload();
  };
  
  return (
    <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg p-2 border border-gray-200">
      <button
        onClick={toggleSystem}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-gray-50 rounded transition-colors"
      >
        <span>🎨</span>
        <span className="font-semibold">
          {system === 'professional' ? 'Professional (Blue)' : 'Energetic (Orange)'}
        </span>
        <span className="text-xs text-gray-500 ml-2">Click to switch</span>
      </button>
      <p className="text-xs text-gray-500 mt-1 px-3">
        Testing design systems - choice applies to all screens
      </p>
    </div>
  );
}
```

**Usage in Dashboard:**

```tsx
// src/features-v2/dashboard/DashboardView.tsx
import { DesignSystemToggle } from '@/components/ui-v2/DesignSystemToggle';

export function DashboardView() {
  return (
    <>
      {/* Only show in dev/staging, not production */}
      {import.meta.env.DEV && <DesignSystemToggle />}
      
      <div className="min-h-screen bg-background">
        {/* Dashboard content */}
      </div>
    </>
  );
}
```

### Tailwind Configuration

```javascript
// tailwind.config.js
export default {
  content: ['./src/**/*.{ts,tsx}'],
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
        
        'legal-vigente': 'var(--color-legal-vigente)',
        'legal-vigente-bg': 'var(--color-legal-vigente-bg)',
        // ... map all design tokens
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
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
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
    },
  },
  plugins: [],
};
```

### shadcn Configuration

```json
// components.json
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

---

## Component Structure

### shadcn Components to Install (As Needed Per Screen)

**Core components (install first for Dashboard):**
- `button` - Primary actions, CTAs
- `card` - Main content containers
- `badge` - Status indicators (vigente, por vencer, etc.)
- `dialog` - Modals (renewal, public link generation)
- `table` - Permits table, documents list

**Form components (for Onboarding, Modals):**
- `input` - Text inputs
- `select` - Dropdowns (ciudad, tipo de negocio)
- `checkbox` - Regulatory factors selection
- `label` - Form labels
- `form` - Form context and validation

**Additional components (install as needed):**
- `dropdown-menu` - User menu, actions menu
- `tabs` - If needed for navigation
- `separator` - Visual dividers
- `skeleton` - Loading states
- `toast` - Notifications (success, error)
- `progress` - Upload progress

### Custom Components (Build on top of shadcn)

```typescript
// src/components/ui-v2/StatusBadge.tsx
import { Badge } from './badge';
import { cn } from '@/lib/utils';

type PermitStatus = 'vigente' | 'por_vencer' | 'vencido' | 'no_registrado' | 'en_tramite';

const statusConfig: Record<PermitStatus, { label: string; className: string }> = {
  vigente: {
    label: 'Vigente',
    className: 'bg-legal-vigente-bg text-legal-vigente',
  },
  por_vencer: {
    label: 'Por Vencer',
    className: 'bg-legal-por-vencer-bg text-legal-por-vencer',
  },
  vencido: {
    label: 'Vencido',
    className: 'bg-legal-vencido-bg text-legal-vencido',
  },
  no_registrado: {
    label: 'No Registrado',
    className: 'bg-legal-no-registrado-bg text-legal-no-registrado',
  },
  en_tramite: {
    label: 'En Trámite',
    className: 'bg-legal-en-tramite-bg text-legal-en-tramite',
  },
};

export function StatusBadge({ status }: { status: PermitStatus }) {
  const config = statusConfig[status];
  return (
    <Badge className={cn('font-semibold', config.className)}>
      {config.label}
    </Badge>
  );
}
```

```typescript
// src/components/ui-v2/RiskBadge.tsx
import { Badge } from './badge';
import { cn } from '@/lib/utils';

type RiskLevel = 'bajo' | 'medio' | 'alto' | 'critico';

const riskConfig: Record<RiskLevel, { label: string; className: string }> = {
  bajo: {
    label: 'Bajo',
    className: 'bg-risk-bajo-bg text-risk-bajo',
  },
  medio: {
    label: 'Medio',
    className: 'bg-risk-medio-bg text-risk-medio',
  },
  alto: {
    label: 'Alto',
    className: 'bg-risk-alto-bg text-risk-alto',
  },
  critico: {
    label: 'Crítico',
    className: 'bg-risk-critico-bg text-risk-critico',
  },
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  const config = riskConfig[level];
  return (
    <Badge className={cn('font-semibold', config.className)}>
      {config.label}
    </Badge>
  );
}
```

---

## Data Flow & State Management

### No Changes to Backend

**What stays the same:**
- ✅ All hooks (`useAuth`, `useLocations`, `usePermits`, `useDocuments`)
- ✅ All API functions (`src/lib/api/*`)
- ✅ Supabase client and configuration
- ✅ Database schema and RLS policies
- ✅ Type definitions (`src/types/database.ts`)
- ✅ Zustand stores (`src/store/authStore.ts`)

**What changes:**
- ❌ Only the JSX/UI layer - how data is rendered
- ✅ Components import same hooks: `import { usePermits } from '@/hooks/usePermits';`
- ✅ Same data flow patterns, different visual presentation

### Example: Dashboard Data Flow

```tsx
// src/features-v2/dashboard/DashboardView.tsx

import { useAuth } from '@/hooks/useAuth';
import { useLocations } from '@/hooks/useLocations';
import { usePermits } from '@/hooks/usePermits';

export function DashboardView() {
  const { companyId, profile, role } = useAuth();
  const { locations, loading: loadingLocations } = useLocations(companyId);
  const { permits, loading: loadingPermits } = usePermits({ companyId });
  
  // Same business logic as v1
  const metrics = useMemo(() => {
    const vigentes = permits.filter(p => p.status === 'vigente' && p.is_active).length;
    const porVencer = permits.filter(p => p.status === 'por_vencer' && p.is_active).length;
    const faltantes = permits.filter(p => p.status === 'no_registrado' && p.is_active).length;
    const compliance = permits.length > 0 ? (vigentes / permits.length) * 100 : 0;
    
    return { vigentes, porVencer, faltantes, compliance };
  }, [permits]);
  
  // NEW: shadcn UI components for rendering
  return (
    <div className="p-8 space-y-6">
      <RiskOverviewCard metrics={metrics} />
      <MetricsGrid metrics={metrics} />
      <div className="grid grid-cols-3 gap-6">
        {locations.map(location => (
          <SedeCard key={location.id} location={location} />
        ))}
      </div>
    </div>
  );
}
```

---

## Screen-by-Screen Implementation Plan

### Milestone 1: Dashboard (Week 1)

**Goal:** Validate design system, prove shadcn approach works

**shadcn components to install:**
- `button`, `card`, `badge`

**Features to implement:**
1. Risk Overview Card (hero card with compliance gauge)
2. Metrics Grid (3 metric cards: vigentes, por vencer, faltantes)
3. Sede Cards (grid of location cards with status/risk)
4. Design System Toggle (for A/B testing)

**Files to create:**
```
src/features-v2/dashboard/
├── DashboardView.tsx
├── RiskOverviewCard.tsx
├── MetricsGrid.tsx
└── SedeCard.tsx

src/components/ui-v2/
├── button.tsx (shadcn)
├── card.tsx (shadcn)
├── badge.tsx (shadcn)
├── StatusBadge.tsx (custom wrapper)
├── RiskBadge.tsx (custom wrapper)
└── DesignSystemToggle.tsx
```

**Acceptance criteria:**
- ✅ Dashboard loads with real data from Supabase
- ✅ All metrics calculate correctly
- ✅ Design toggle switches between Professional/Energetic
- ✅ User reviews staging, chooses design system
- ✅ Looks premium, not generic

---

### Milestone 2: Location Detail (Week 1-2)

**Goal:** Detail view with permits table, public link banner

**shadcn components to install:**
- `table`, `dialog`, `dropdown-menu`

**Features to implement:**
1. Location header (name, address, status, risk)
2. Summary metrics (permisos vigentes, próximo vencimiento)
3. Permits table with status badges
4. Public link banner (if active link exists)
5. Renew permit modal (basic version)

**Files to create:**
```
src/features-v2/locations/
├── LocationDetailView.tsx
├── PermitsTable.tsx
└── PublicLinkBanner.tsx

src/features-v2/permits/
└── RenewPermitModal.tsx (basic)

src/components/ui-v2/
├── table.tsx (shadcn)
├── dialog.tsx (shadcn)
└── dropdown-menu.tsx (shadcn)
```

**Acceptance criteria:**
- ✅ Location detail shows all permit info
- ✅ Table is sortable and readable
- ✅ Renew modal opens and closes
- ✅ Public link banner displays if link exists

---

### Milestone 3: Onboarding Wizard (Week 2)

**Goal:** Multi-step onboarding flow

**shadcn components to install:**
- `input`, `select`, `checkbox`, `label`, `form`

**Features to implement:**
1. Step 1: Company data (name, RUC, city, business type)
2. Step 2: Regulatory factors (checkboxes)
3. Step 3: Initial locations (dynamic location list)
4. Step 4: Review and confirmation
5. Progress indicator

**Files to create:**
```
src/features-v2/onboarding/
├── OnboardingWizard.tsx
└── steps/
    ├── Step1Company.tsx
    ├── Step2Regulatory.tsx
    ├── Step3Locations.tsx
    └── Step4Review.tsx

src/components/ui-v2/
├── input.tsx (shadcn)
├── select.tsx (shadcn)
├── checkbox.tsx (shadcn)
├── label.tsx (shadcn)
└── form.tsx (shadcn)
```

**Acceptance criteria:**
- ✅ Wizard navigation works (next/back)
- ✅ Form validation on each step
- ✅ Data persists across steps
- ✅ Completion creates company + locations + permits

---

### Milestone 4: Public Link Generation (Week 2-3)

**Goal:** Generate public links with QR codes

**shadcn components to install:**
- `toast` (for success notifications)

**Features to implement:**
1. Generate link modal (scope selection, label input)
2. Success modal with QR code display
3. QR download/print functionality
4. Public link list in location detail

**Files to create:**
```
src/features-v2/publicLinks/
├── GeneratePublicLinkModal.tsx
├── PublicLinkSuccessModal.tsx
└── PublicLinkQR.tsx

src/components/ui-v2/
└── toast.tsx (shadcn)
```

**External dependencies:**
- `qrcode.react` (already installed)

**Acceptance criteria:**
- ✅ Modal generates link + stores in DB
- ✅ QR code displays correctly
- ✅ Download as PNG works
- ✅ Print layout is optimized

---

### Milestone 5: Public Verification View (Week 3)

**Goal:** Public-facing view (no auth required)

**Features to implement:**
1. Public header (different from internal)
2. Company/location identification
3. List of vigente permits only
4. Clean, professional layout
5. Powered by PermitOps footer

**Files to create:**
```
src/features-v2/public/
└── PublicVerificationView.tsx
```

**Acceptance criteria:**
- ✅ Works without authentication
- ✅ Shows only vigente, is_active permits
- ✅ Token tracks view_count
- ✅ Mobile responsive

---

### Milestone 6: Permit Detail & History (Week 3)

**Goal:** Full permit detail with version history

**Features to implement:**
1. Permit detail view (all metadata)
2. Version history timeline
3. Document list (download links)
4. Renew button (opens modal)

**Files to create:**
```
src/features-v2/permits/
├── PermitDetailView.tsx
└── PermitHistory.tsx
```

**Acceptance criteria:**
- ✅ Shows current version + archived versions
- ✅ Version timeline is clear
- ✅ Documents are downloadable
- ✅ Superseded_by relationship visible

---

### Milestone 7: Layout Components (Week 3-4)

**Goal:** AppShell, Sidebar, TopBar with v2 styling

**shadcn components to install:**
- `separator`, `avatar`

**Features to implement:**
1. Sidebar v2 (navigation with active states)
2. TopBar v2 (search, notifications, user menu)
3. AppShell v2 (responsive layout)

**Files to create:**
```
src/components/layout-v2/
├── AppShell.tsx
├── Sidebar.tsx
└── TopBar.tsx

src/components/ui-v2/
├── separator.tsx (shadcn)
└── avatar.tsx (shadcn)
```

**Acceptance criteria:**
- ✅ Sidebar collapses on mobile
- ✅ Active route is highlighted
- ✅ User menu works (logout)
- ✅ Responsive layout

---

### Milestone 8: Remaining Screens (Week 4)

**Screens to implement:**
1. Login View (v2 styled)
2. Location List View
3. Permit List View
4. Any missing modals/dialogs

**Polish:**
- Loading states (skeleton screens)
- Empty states
- Error handling
- Transitions

---

## Testing & Validation Strategy

### Local Testing (During Development)

1. **Set `VITE_UI_VERSION=v2` in `.env.development`**
2. **Run `npm run dev`** - test all screens locally
3. **Toggle design systems** using the toggle button
4. **Test all user flows:**
   - Login → Dashboard → Location Detail → Renew Permit
   - Onboarding complete flow
   - Public link generation → QR download → Public view

### Staging Deployment (After Each Milestone)

1. **Deploy to Vercel staging** with `VITE_UI_VERSION=v2`
2. **User reviews live** at staging URL
3. **Provide feedback** on design, flow, functionality
4. **Iterate** if needed before next milestone

### Final Validation (After All Screens Complete)

1. **User reviews complete v2** on staging
2. **Test all edge cases:** empty states, errors, permissions
3. **Performance check:** load times, bundle size
4. **Mobile testing:** responsive on iPhone/Android
5. **Sign-off** for production deployment

### Production Cutover

1. **Merge `feature/ui-v2` to `main`**
2. **Run cleanup script:**
   - Delete `src/features/`
   - Delete `src/components/ui/`
   - Rename `features-v2/` → `features/`
   - Rename `ui-v2/` → `ui/`
   - Delete unused design tokens file
3. **Set `VITE_UI_VERSION=v2`** in production env vars
4. **Deploy to production**
5. **Monitor for errors** in first 24 hours

---

## Success Criteria

### Technical Success

- ✅ All screens load without errors
- ✅ All existing features work (auth, CRUD, file upload)
- ✅ No regressions in backend functionality
- ✅ Mobile responsive
- ✅ Performance: Dashboard loads in <2s

### Design Success

- ✅ Looks premium, professional, not generic
- ✅ Consistent spacing, typography, colors
- ✅ Clear visual hierarchy
- ✅ Accessible (keyboard navigation, screen reader friendly)

### Business Success (Demo Objective)

- ✅ Feels like "control operativo profesional" not Excel chaos
- ✅ Design system chosen by user (Professional or Energetic)
- ✅ Ready for Supermaxi demo
- ✅ User confident in the aesthetic

---

## Risks & Mitigations

### Risk: Design system toggle doesn't work as expected

**Mitigation:** Test toggle early in Milestone 1, fix before proceeding

### Risk: shadcn components don't match design vision

**Mitigation:** Design-first approach - we control all styling via design tokens, shadcn is just primitives

### Risk: Bundle size increases significantly

**Mitigation:** Tree-shaking, code splitting by route, lazy loading modals

### Risk: User doesn't like either design system

**Mitigation:** Easy to create third option - just add `design-tokens-hybrid.css`

### Risk: Feature flag confusion during development

**Mitigation:** Clear naming (`features-v2/`, `ui-v2/`), thorough documentation

---

## Next Steps

1. **User approves this design specification**
2. **Invoke `writing-plans` skill** to create detailed implementation plan
3. **Start Milestone 1: Dashboard** with design system toggle
4. **Deploy to staging** after Dashboard complete
5. **User chooses design system** (Professional or Energetic)
6. **Continue with remaining milestones** using chosen system

---

**End of Design Specification**
