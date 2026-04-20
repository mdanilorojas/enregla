# Sedes V2 View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create clean, modern Sedes list view with card-based design using shadcn/ui components for UI V2.

**Architecture:** Two components - LocationsListViewV2 (grid container with header/states) and LocationCardV2 (individual sede card with permits dots). Uses existing hooks (useAuth, useLocations, usePermits) and shadcn/ui Card/Badge components.

**Tech Stack:** React, TypeScript, shadcn/ui (Card, Badge), lucide-react icons, React Router v6, Tailwind CSS

---

## File Structure

**New files to create:**
- `src/features-v2/locations/LocationCardV2.tsx` - Individual sede card component
- `src/features-v2/locations/LocationsListViewV2.tsx` - Main list view with grid

**Files to modify:**
- `src/App.tsx` - Update routing to use V2 component when UI_VERSION=v2

**Existing patterns to follow:**
- `src/features-v2/dashboard/SedeCard.tsx` - Reference for shadcn/ui Card usage
- `src/features-v2/dashboard/DashboardView.tsx` - Reference for loading/empty states

---

## Task 1: Create LocationCardV2 Component

**Files:**
- Create: `src/features-v2/locations/LocationCardV2.tsx`

- [ ] **Step 1: Create component file with TypeScript interface**

```typescript
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui-v2/card';
import { Badge } from '@/components/ui-v2/badge';
import type { Location, Permit } from '@/types/database';

interface LocationCardV2Props {
  location: Location;
  permits: Permit[];
}

export function LocationCardV2({ location, permits }: LocationCardV2Props) {
  const navigate = useNavigate();
  
  return (
    <div>TODO</div>
  );
}
```

- [ ] **Step 2: Add helper functions for data processing**

```typescript
// Add before component
function getLocationCode(id: string): string {
  return `SEDE-${id.substring(0, 8).toUpperCase()}-${id.substring(24, 27).toUpperCase()}`;
}

function getCityFromAddress(address: string | null | undefined): string {
  if (!address) return 'Sin ciudad';
  return address.split(',').pop()?.trim() || 'Sin ciudad';
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'outline' {
  const statusMap: Record<string, 'default' | 'secondary' | 'outline'> = {
    operando: 'default',
    inactivo: 'secondary',
    construccion: 'outline',
  };
  return statusMap[status.toLowerCase()] || 'secondary';
}

function getRiskLevelConfig(riskLevel: string): { variant: string; className?: string; label: string } {
  const riskMap: Record<string, { variant: string; className?: string; label: string }> = {
    critico: { variant: 'destructive', label: 'Crítica' },
    alto: { variant: 'default', className: 'bg-orange-500 text-white hover:bg-orange-600', label: 'Alta' },
    medio: { variant: 'default', className: 'bg-amber-500 text-white hover:bg-amber-600', label: 'Media' },
    bajo: { variant: 'default', label: 'Baja' },
  };
  return riskMap[riskLevel.toLowerCase()] || { variant: 'secondary', label: 'Desconocido' };
}

function getPermitColor(status: string): string {
  const colorMap: Record<string, string> = {
    vigente: 'bg-emerald-400',
    por_vencer: 'bg-amber-400',
    vencido: 'bg-red-400',
    no_registrado: 'bg-gray-300',
    en_tramite: 'bg-blue-400',
  };
  return colorMap[status] || 'bg-gray-300';
}
```

- [ ] **Step 3: Implement card header with icon, name, and code**

```typescript
export function LocationCardV2({ location, permits }: LocationCardV2Props) {
  const navigate = useNavigate();
  const locationCode = getLocationCode(location.id);
  const city = getCityFromAddress(location.address);

  const handleClick = () => {
    navigate(`/sedes/${location.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(`/sedes/${location.id}`);
    }
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Building2 size={20} className="text-gray-500 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {location.name}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {locationCode}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Content will be added in next step */}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Add two-column address/city section**

Replace the `{/* Content will be added in next step */}` comment with:

```typescript
        {/* Address and City - Two columns */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Dirección</p>
            <p className="text-sm text-gray-900">
              {location.address || 'Sin dirección'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Ciudad</p>
            <p className="text-sm text-gray-900">{city}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 my-4" />
```

- [ ] **Step 5: Add Estado and Nivel de Riesgo badges**

Add after the divider:

```typescript
        {/* Estado */}
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-500 mb-2">Estado</p>
          <Badge variant={getStatusVariant(location.status)}>
            {location.status === 'operando' ? 'Operando' : 
             location.status === 'inactivo' ? 'Inactivo' : 
             location.status === 'construccion' ? 'En construcción' : 
             location.status}
          </Badge>
        </div>

        {/* Nivel de Riesgo */}
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-500 mb-2">Nivel de Riesgo</p>
          {(() => {
            const riskConfig = getRiskLevelConfig(location.risk_level || 'bajo');
            return (
              <Badge 
                variant={riskConfig.variant as any}
                className={riskConfig.className}
              >
                {riskConfig.label}
              </Badge>
            );
          })()}
        </div>
```

- [ ] **Step 6: Implement permits section with dots**

Add after Nivel de Riesgo:

```typescript
        {/* Permisos */}
        <div>
          {/* Label and counter */}
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-medium text-gray-500">Permisos</span>
            <span className="font-mono text-gray-900">
              {(() => {
                const activePermits = permits.filter(p => p.is_active);
                const vigentes = activePermits.filter(p => p.status === 'vigente').length;
                return `${vigentes}/${activePermits.length}`;
              })()}
            </span>
          </div>

          {/* Colored dots */}
          <div className="flex items-center gap-1 flex-wrap">
            {(() => {
              const activePermits = permits.filter(p => p.is_active);
              
              // Group by status
              const vigente = activePermits.filter(p => p.status === 'vigente');
              const porVencer = activePermits.filter(p => p.status === 'por_vencer');
              const vencido = activePermits.filter(p => p.status === 'vencido');
              const enTramite = activePermits.filter(p => p.status === 'en_tramite');
              const noRegistrado = activePermits.filter(p => p.status === 'no_registrado');
              
              // Order: vigente, por_vencer, vencido, en_tramite, no_registrado
              const orderedPermits = [
                ...vigente,
                ...porVencer,
                ...vencido,
                ...enTramite,
                ...noRegistrado,
              ];

              if (orderedPermits.length === 0) {
                return null;
              }

              return orderedPermits.map((permit) => (
                <div
                  key={permit.id}
                  className={`w-2 h-2 rounded-full ${getPermitColor(permit.status)}`}
                  title={`${permit.type} - ${permit.status}`}
                />
              ));
            })()}
          </div>
        </div>
```

- [ ] **Step 7: Verify component compiles**

Run: `npm run build` or check TypeScript errors in editor

Expected: No compilation errors for LocationCardV2.tsx

- [ ] **Step 8: Commit LocationCardV2 component**

```bash
git add src/features-v2/locations/LocationCardV2.tsx
git commit -m "feat(sedes-v2): add LocationCardV2 component with permits dots

- Icon + name + code header
- Two-column address/city layout
- Estado and Nivel de Riesgo badges
- Permisos counter with colored status dots
- Full keyboard accessibility
- Hover effects and navigation

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Create LocationsListViewV2 Component

**Files:**
- Create: `src/features-v2/locations/LocationsListViewV2.tsx`

- [ ] **Step 1: Create component file with imports and data loading**

```typescript
import { useAuth } from '@/hooks/useAuth';
import { useLocations } from '@/hooks/useLocations';
import { usePermits } from '@/hooks/usePermits';
import { Building2, Plus } from 'lucide-react';
import { LocationCardV2 } from './LocationCardV2';
import { Card, CardContent } from '@/components/ui-v2/card';

export function LocationsListViewV2() {
  const { profile } = useAuth();
  const companyId = profile?.company_id;
  
  const { locations, loading: loadingLocations, error: locationsError } = useLocations(companyId);
  const { permits, loading: loadingPermits, error: permitsError } = usePermits({ companyId });

  const loading = loadingLocations || loadingPermits;
  const error = locationsError || permitsError;

  return (
    <div>TODO</div>
  );
}
```

- [ ] **Step 2: Implement loading state with skeleton cards**

```typescript
export function LocationsListViewV2() {
  const { profile } = useAuth();
  const companyId = profile?.company_id;
  
  const { locations, loading: loadingLocations, error: locationsError } = useLocations(companyId);
  const { permits, loading: loadingPermits, error: permitsError } = usePermits({ companyId });

  const loading = loadingLocations || loadingPermits;
  const error = locationsError || permitsError;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-32 mb-2" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-64" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6 space-y-4">
                  <div className="h-6 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>TODO: error and success states</div>
  );
}
```

- [ ] **Step 3: Implement error state**

Replace `return <div>TODO: error and success states</div>` with:

```typescript
  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">Error al cargar sedes</p>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>TODO: empty and success states</div>
  );
```

- [ ] **Step 4: Implement empty state**

Replace `return <div>TODO: empty and success states</div>` with:

```typescript
  // Empty state
  if (locations.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold">No hay sedes</h3>
            <p className="mt-2 text-sm text-gray-500">
              Comienza creando tu primera sede
            </p>
            <button
              onClick={() => alert('Funcionalidad próximamente')}
              className="mt-6 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
            >
              <Plus size={16} />
              Crear Primera Sede
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>TODO: success state with grid</div>
  );
```

- [ ] **Step 5: Implement header with title and create button**

Replace `return <div>TODO: success state with grid</div>` with:

```typescript
  // Success state - filter permits for each location
  const getLocationPermits = (locationId: string) => {
    return permits.filter(p => p.location_id === locationId && p.is_active);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sedes</h1>
            <p className="text-sm text-gray-500 mt-1">
              Gestión de sedes y ubicaciones de tu empresa
            </p>
          </div>
          <button
            onClick={() => alert('Funcionalidad próximamente')}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
          >
            <Plus size={16} />
            Crear Sede
          </button>
        </div>

        {/* Grid will be added next */}
      </div>
    </div>
  );
```

- [ ] **Step 6: Implement grid of location cards**

Add after the header div:

```typescript
        {/* Grid of location cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {locations.map((location) => (
            <LocationCardV2
              key={location.id}
              location={location}
              permits={getLocationPermits(location.id)}
            />
          ))}
        </div>
```

- [ ] **Step 7: Verify component compiles**

Run: `npm run build` or check TypeScript errors in editor

Expected: No compilation errors for LocationsListViewV2.tsx

- [ ] **Step 8: Commit LocationsListViewV2 component**

```bash
git add src/features-v2/locations/LocationsListViewV2.tsx
git commit -m "feat(sedes-v2): add LocationsListViewV2 main view

- Header with title, description, and create button
- Responsive grid (1 col mobile, 2 cols desktop)
- Loading state with skeleton cards
- Empty state with CTA
- Error state with retry
- Renders LocationCardV2 for each sede

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Update App.tsx Routing

**Files:**
- Modify: `src/App.tsx:11-12,108`

- [ ] **Step 1: Add import for LocationsListViewV2**

In `src/App.tsx`, add after existing imports (around line 12):

```typescript
import { LocationsListViewV2 } from '@/features-v2/locations/LocationsListViewV2';
```

- [ ] **Step 2: Update /sedes route to use V2 component conditionally**

Find the line (around line 108):

```typescript
<Route path="/sedes" element={<LocationListView />} />
```

Replace with:

```typescript
<Route path="/sedes" element={UI_VERSION === 'v2' ? <LocationsListViewV2 /> : <LocationListView />} />
```

- [ ] **Step 3: Verify no TypeScript errors**

Run: `npm run build` or check editor

Expected: No compilation errors in App.tsx

- [ ] **Step 4: Commit routing update**

```bash
git add src/App.tsx
git commit -m "feat(sedes-v2): integrate LocationsListViewV2 into routing

- Import LocationsListViewV2 component
- Conditionally render based on UI_VERSION flag
- V2 users see new clean card design
- V1 users still see original with embedded map

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Manual Testing

**Files:**
- N/A (manual testing in browser)

- [ ] **Step 1: Start dev server if not running**

Run: `npm run dev`

Expected: Server starts on port 5173 (or next available)

- [ ] **Step 2: Verify UI_VERSION is set to v2**

Check: `src/config.ts` or environment variable

Expected: `UI_VERSION = 'v2'`

- [ ] **Step 3: Navigate to /sedes route in browser**

Open: `http://localhost:5173/sedes`

Expected: New V2 sedes view loads (not V1 with map)

- [ ] **Step 4: Verify loading state appears briefly**

Refresh page and observe initial render

Expected: 4 skeleton cards appear while data loads

- [ ] **Step 5: Verify cards render with correct data**

Check each visible card displays:
- Building icon + sede name + code
- Two columns: Dirección and Ciudad
- Gray divider line
- Estado badge with color
- Nivel de Riesgo badge with color
- Permisos label with counter (e.g., "4/9")
- Colored dots matching permit statuses

Expected: All elements visible and correctly styled

- [ ] **Step 6: Verify hover effect on cards**

Hover over any card

Expected: Shadow increases (hover:shadow-lg transition)

- [ ] **Step 7: Verify click navigation**

Click any sede card

Expected: Navigates to `/sedes/{id}` detail page

- [ ] **Step 8: Test keyboard navigation**

Tab to a card, press Enter

Expected: Also navigates to detail page

- [ ] **Step 9: Test responsive design**

Resize browser to mobile width (<768px)

Expected: Grid changes to 1 column

- [ ] **Step 10: Test empty state (if possible)**

If you have a test account with no sedes, log in and visit /sedes

Expected: Empty state shows with "No hay sedes" message and create button

- [ ] **Step 11: Verify "Crear Sede" button shows alert**

Click "+ Crear Sede" button in header

Expected: Alert shows "Funcionalidad próximamente"

- [ ] **Step 12: Document any issues found**

If any visual or functional issues found, document them

Expected: List any bugs to fix before considering task complete

---

## Self-Review Checklist

**Spec Coverage:**
- ✅ LocationCardV2 matches exact visual design (icon, name, code, two-col address/city, divider, badges, dots)
- ✅ LocationsListViewV2 has header with title/description/button
- ✅ Responsive grid (1 col mobile, 2 cols desktop)
- ✅ Loading state with 4 skeleton cards
- ✅ Empty state with Building2 icon and CTA
- ✅ Error state with retry button
- ✅ Routing integration with UI_VERSION flag
- ✅ Keyboard accessibility (tabIndex, onKeyDown)
- ✅ Hover effects (shadow transition)
- ✅ Permits dots ordered correctly (vigente, por_vencer, vencido, en_tramite, no_registrado)
- ✅ Badge colors match spec (estado: green/gray/outline, riesgo: red/orange/amber/green)
- ✅ Dot colors match spec (emerald/amber/red/gray/blue for permit statuses)
- ✅ Counter format is "vigentes/total" (e.g., "4/9")

**Placeholder Scan:**
- ✅ No TODOs or TBDs in final code
- ✅ All helper functions fully implemented
- ✅ All badge variants defined
- ✅ All permit colors defined
- ✅ No "add validation" or "handle edge cases" placeholders

**Type Consistency:**
- ✅ `Location` type from `@/types/database` used consistently
- ✅ `Permit` type from `@/types/database` used consistently
- ✅ Props interfaces match between parent and child
- ✅ Function names consistent (getLocationCode, getCityFromAddress, etc.)
- ✅ No function renamed between tasks

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-15-sedes-v2-implementation.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
