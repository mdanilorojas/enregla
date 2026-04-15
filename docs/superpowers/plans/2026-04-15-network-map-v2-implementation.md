# Network Map V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create interactive network graph with real-time Supabase data, responsive behavior (permits only on desktop), and animated red lines for critical risks.

**Architecture:** NetworkMapViewV2 component loads data from useAuth/useLocations/usePermits hooks, computes nodes/edges based on screen size (useMediaQuery), renders with ReactFlow reusing existing node components (CompanyNode, SedeNode, PermitNode).

**Tech Stack:** React, TypeScript, @xyflow/react (ReactFlow), Supabase hooks, react-router-dom, lucide-react

---

## File Structure

**New files to create:**
- `src/features-v2/network/NetworkMapViewV2.tsx` - Main network graph component with Supabase data
- `src/hooks/useMediaQuery.ts` - Custom hook for responsive breakpoint detection

**Files to modify:**
- `src/features/network/NetworkMapPage.tsx` - Update to conditionally render V2 when UI_VERSION='v2'

**Existing files to reference (no changes):**
- `src/features/network/nodes/CompanyNode.tsx` - HQ central node
- `src/features/network/nodes/SedeNode.tsx` - Location cards
- `src/features/network/nodes/PermitNode.tsx` - Permit nodes
- `src/features/network/useForceLayout.ts` - Physics simulation
- `src/hooks/useAuth.ts` - Auth hook
- `src/hooks/useLocations.ts` - Locations hook
- `src/hooks/usePermits.ts` - Permits hook

---

## Task 1: Create useMediaQuery Hook

**Files:**
- Create: `src/hooks/useMediaQuery.ts`

- [ ] **Step 1: Create hook file with TypeScript**

```typescript
import { useState, useEffect } from 'react';

/**
 * Custom hook to detect if a media query matches
 * @param query - Media query string (e.g., '(min-width: 768px)')
 * @returns boolean indicating if query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // Set initial value
    setMatches(media.matches);

    // Create listener for changes
    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Add listener
    media.addEventListener('change', listener);

    // Cleanup
    return () => {
      media.removeEventListener('change', listener);
    };
  }, [query]);

  return matches;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run build` or check editor

Expected: No compilation errors

- [ ] **Step 3: Commit useMediaQuery hook**

```bash
git add src/hooks/useMediaQuery.ts
git commit -m "feat(hooks): add useMediaQuery hook for responsive detection

- Custom hook for detecting media query matches
- Listens to window.matchMedia changes
- Used for responsive network map (desktop/mobile)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Create NetworkMapViewV2 Component - Part 1 (Setup & Imports)

**Files:**
- Create: `src/features-v2/network/NetworkMapViewV2.tsx`

- [ ] **Step 1: Create component file with imports and types**

```typescript
import { useMemo, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeMouseHandler,
  type OnNodeDrag,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLocations } from '@/hooks/useLocations';
import { usePermits } from '@/hooks/usePermits';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useForceLayout } from '@/features/network/useForceLayout';
import { SedeNode } from '@/features/network/nodes/SedeNode';
import { PermitNode } from '@/features/network/nodes/PermitNode';
import { CompanyNode } from '@/features/network/nodes/CompanyNode';
import type { RiskLevel, PermitStatus, Location, Permit } from '@/types';

// Node types for ReactFlow
const nodeTypes = {
  sede: SedeNode,
  permit: PermitNode,
  company: CompanyNode,
};

interface NetworkMapViewV2Props {
  embedded?: boolean;
}

export function NetworkMapViewV2({ embedded = false }: NetworkMapViewV2Props) {
  const navigate = useNavigate();
  const draggingRef = useRef<string | null>(null);

  // Load data from Supabase
  const { profile } = useAuth();
  const companyId = profile?.company_id;
  
  const { locations, loading: loadingLocations, error: locationsError } = useLocations(companyId);
  const { permits, loading: loadingPermits, error: permitsError } = usePermits({ companyId });
  
  // Detect desktop for conditional permit rendering
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const loading = loadingLocations || loadingPermits;
  const error = locationsError || permitsError;

  // TODO: Add helper functions (Step 2)
  // TODO: Add node/edge generation (Step 3)
  // TODO: Add states (loading, error, empty) (Step 4)
  // TODO: Add ReactFlow render (Step 5)

  return <div>Component skeleton</div>;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run build` or check editor

Expected: No compilation errors (TODOs are comments, not actual issues)

- [ ] **Step 3: Commit component skeleton**

```bash
git add src/features-v2/network/NetworkMapViewV2.tsx
git commit -m "feat(network-v2): add NetworkMapViewV2 component skeleton

- Import all dependencies (ReactFlow, hooks, nodes)
- Setup props interface (embedded boolean)
- Load data from useAuth, useLocations, usePermits
- Detect desktop with useMediaQuery
- Ready for implementation

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Add Helper Functions to NetworkMapViewV2

**Files:**
- Modify: `src/features-v2/network/NetworkMapViewV2.tsx` (after imports, before component)

- [ ] **Step 1: Add color mapping constants**

Add after `nodeTypes` constant (around line 30):

```typescript
// Color mapping for risk levels
const riskColor: Record<RiskLevel, string> = {
  critico: '#ef4444',  // Red
  alto: '#f97316',     // Orange
  medio: '#eab308',    // Yellow
  bajo: '#22c55e',     // Green
};

// Color mapping for permit status
const statusEdgeColor: Record<PermitStatus, string> = {
  vigente: '#22c55e',       // Green
  por_vencer: '#eab308',    // Yellow
  vencido: '#ef4444',       // Red
  no_registrado: '#d1d5db', // Gray
};
```

- [ ] **Step 2: Add handle calculation function**

Add after color constants:

```typescript
/**
 * Calculate which handles to use based on node positions (for proper edge routing)
 */
function getHandlePair(sx: number, sy: number, tx: number, ty: number) {
  const angle = Math.atan2(ty - sy, tx - sx);
  if (angle >= -Math.PI / 4 && angle < Math.PI / 4) {
    return { sourceHandle: 'right', targetHandle: 'left' };
  } else if (angle >= Math.PI / 4 && angle < (3 * Math.PI) / 4) {
    return { sourceHandle: 'bottom', targetHandle: 'top' };
  } else if (angle >= -(3 * Math.PI) / 4 && angle < -Math.PI / 4) {
    return { sourceHandle: 'top', targetHandle: 'bottom' };
  }
  return { sourceHandle: 'left', targetHandle: 'right' };
}
```

- [ ] **Step 3: Add compliance and critical calculation functions**

Add after getHandlePair:

```typescript
/**
 * Calculate compliance percentage for a location's permits
 * @param permits - Array of permits for a location
 * @returns Compliance percentage (0-100)
 */
function calculateCompliance(permits: Permit[]): number {
  const active = permits.filter(p => p.is_active);
  if (active.length === 0) return 0;
  const vigentes = active.filter(p => p.status === 'vigente').length;
  return Math.round((vigentes / active.length) * 100);
}

/**
 * Count critical issues (expired or not registered permits)
 * @param permits - Array of permits for a location
 * @returns Count of critical permits
 */
function countCritical(permits: Permit[]): number {
  return permits.filter(p => 
    p.is_active && (p.status === 'vencido' || p.status === 'no_registrado')
  ).length;
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npm run build` or check editor

Expected: No compilation errors

- [ ] **Step 5: Commit helper functions**

```bash
git add src/features-v2/network/NetworkMapViewV2.tsx
git commit -m "feat(network-v2): add helper functions for graph generation

- Color mappings for risk levels and permit status
- Handle calculation for proper edge routing
- Compliance percentage calculation
- Critical issues counter

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Implement Node and Edge Generation

**Files:**
- Modify: `src/features-v2/network/NetworkMapViewV2.tsx` (inside component, replace TODO for Step 2)

- [ ] **Step 1: Add useMemo for nodes and edges generation**

Replace the line `// TODO: Add node/edge generation (Step 3)` with:

```typescript
  // Generate nodes and edges based on data
  const { seedNodes, seedEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    if (!profile?.company_id) {
      return { seedNodes: [], seedEdges: [] };
    }

    // 1. Company (HQ) node at center
    const companyPos = { x: 0, y: 0 };
    nodes.push({
      id: 'company',
      type: 'company',
      position: companyPos,
      data: {
        name: profile.company?.name || 'Empresa',
        locationCount: locations.length,
      },
    });

    // 2. Location nodes in circle around HQ
    locations.forEach((loc, i) => {
      const locPermits = permits.filter(p => p.location_id === loc.id && p.is_active);
      const compliance = calculateCompliance(locPermits);
      const critical = countCritical(locPermits);
      
      // Calculate position in circle (radius 300px)
      const angle = (2 * Math.PI * i) / locations.length - Math.PI / 2;
      const sedePos = {
        x: Math.cos(angle) * 300,
        y: Math.sin(angle) * 300,
      };

      nodes.push({
        id: loc.id,
        type: 'sede',
        position: sedePos,
        data: {
          name: loc.name,
          address: loc.address,
          riskLevel: loc.risk_level,
          compliance,
          critical,
          permitCount: locPermits.length,
        },
      });

      // Edge: Company → Sede
      const compHandles = getHandlePair(companyPos.x, companyPos.y, sedePos.x, sedePos.y);
      edges.push({
        id: `company-${loc.id}`,
        source: 'company',
        target: loc.id,
        sourceHandle: compHandles.sourceHandle,
        targetHandle: compHandles.targetHandle,
        style: {
          stroke: riskColor[loc.risk_level],
          strokeWidth: 2,
          opacity: 0.35,
        },
        animated: loc.risk_level === 'critico', // Animate red lines for critical
      });

      // 3. Permit nodes (only on desktop)
      if (isDesktop) {
        locPermits.forEach((permit, j) => {
          // Position permits in arc around their sede (radius 180px)
          const pAngle = angle + ((j - (locPermits.length - 1) / 2) * 0.4);
          const permitPos = {
            x: sedePos.x + Math.cos(pAngle) * 180,
            y: sedePos.y + Math.sin(pAngle) * 180,
          };

          nodes.push({
            id: permit.id,
            type: 'permit',
            position: permitPos,
            data: {
              label: permit.type,
              status: permit.status,
              issuer: permit.issuer || 'N/A',
            },
          });

          // Edge: Sede → Permit
          const permitHandles = getHandlePair(sedePos.x, sedePos.y, permitPos.x, permitPos.y);
          edges.push({
            id: `${loc.id}-${permit.id}`,
            source: loc.id,
            target: permit.id,
            sourceHandle: `s-${permitHandles.sourceHandle}`,
            targetHandle: permitHandles.targetHandle,
            style: {
              stroke: statusEdgeColor[permit.status],
              strokeWidth: (permit.status === 'vencido' || permit.status === 'no_registrado') ? 2.5 : 1.5,
              opacity: permit.status === 'no_registrado' ? 0.35 : 0.6,
            },
            animated: permit.status === 'vencido', // Animate red lines for expired
          });
        });
      }
    });

    return { seedNodes: nodes, seedEdges: edges };
  }, [profile, locations, permits, isDesktop]);
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run build` or check editor

Expected: No compilation errors

- [ ] **Step 3: Commit node/edge generation**

```bash
git add src/features-v2/network/NetworkMapViewV2.tsx
git commit -m "feat(network-v2): implement node and edge generation

- Company node at center
- Location nodes in circle (300px radius)
- Permit nodes in arc around locations (180px, desktop only)
- Company→Sede edges colored by risk, animated if critical
- Sede→Permit edges colored by status, animated if expired
- Responsive: permits only rendered on desktop

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Add ReactFlow State Management and Physics

**Files:**
- Modify: `src/features-v2/network/NetworkMapViewV2.tsx` (after useMemo, replace TODO for Step 3)

- [ ] **Step 1: Add ReactFlow state hooks**

Add after the `useMemo` block:

```typescript
  // ReactFlow state management
  const [nodes, setNodes, onNodesChange] = useNodesState(seedNodes);
  const [edges, , onEdgesChange] = useEdgesState(seedEdges);

  // Physics simulation callback
  const onForceTick = useCallback(
    (positions: Map<string, { x: number; y: number }>) => {
      setNodes((prev) =>
        prev.map((n) => {
          // Don't move node being dragged
          if (n.id === draggingRef.current) return n;
          const pos = positions.get(n.id);
          if (!pos) return n;
          return { ...n, position: { x: pos.x, y: pos.y } };
        }),
      );
    },
    [setNodes],
  );

  // Setup force layout physics
  const { fixNode, releaseNode } = useForceLayout({
    nodes: seedNodes,
    edges: seedEdges,
    onTick: onForceTick,
  });
```

- [ ] **Step 2: Add drag handlers for physics**

Add after useForceLayout:

```typescript
  // Drag handlers for physics simulation
  const onNodeDragStart: OnNodeDrag = useCallback(
    (_event, node) => {
      draggingRef.current = node.id;
      fixNode(node.id, node.position.x, node.position.y);
    },
    [fixNode],
  );

  const onNodeDrag: OnNodeDrag = useCallback(
    (_event, node) => {
      fixNode(node.id, node.position.x, node.position.y);
    },
    [fixNode],
  );

  const onNodeDragStop: OnNodeDrag = useCallback(
    (_event, node) => {
      draggingRef.current = null;
      releaseNode(node.id);
    },
    [releaseNode],
  );
```

- [ ] **Step 3: Add click handler for navigation**

Add after drag handlers:

```typescript
  // Click handler for sede navigation
  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      if (node.type === 'sede') {
        navigate(`/sedes/${node.id}`);
      }
    },
    [navigate],
  );
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npm run build` or check editor

Expected: No compilation errors

- [ ] **Step 5: Commit state management and physics**

```bash
git add src/features-v2/network/NetworkMapViewV2.tsx
git commit -m "feat(network-v2): add ReactFlow state and physics simulation

- useNodesState and useEdgesState for ReactFlow state
- useForceLayout for physics simulation
- Drag handlers (start, drag, stop) with node fixing
- Click handler for sede navigation
- Prevents moving node being dragged during physics updates

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Add Loading, Error, and Empty States

**Files:**
- Modify: `src/features-v2/network/NetworkMapViewV2.tsx` (before ReactFlow render, replace TODO for Step 4)

- [ ] **Step 1: Add loading state**

Replace the line `// TODO: Add states (loading, error, empty) (Step 4)` with:

```typescript
  // Loading state
  if (loading) {
    return (
      <div className={embedded ? 'h-full' : 'h-[calc(100vh-64px)]'}>
        <div className="h-full flex items-center justify-center bg-[#FAFBFD]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-600">Cargando mapa de red...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={embedded ? 'h-full' : 'h-[calc(100vh-64px)]'}>
        <div className="h-full flex items-center justify-center bg-[#FAFBFD]">
          <div className="text-center">
            <p className="text-red-500 mb-4">Error al cargar mapa de red</p>
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

  // Empty state (no locations)
  if (locations.length === 0) {
    return (
      <div className={embedded ? 'h-full' : 'h-[calc(100vh-64px)]'}>
        <div className="h-full flex items-center justify-center bg-[#FAFBFD]">
          <div className="text-center">
            <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay sedes</h3>
            <p className="text-sm text-gray-500">
              Crea tu primera sede para visualizar la red
            </p>
          </div>
        </div>
      </div>
    );
  }
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run build` or check editor

Expected: No compilation errors

- [ ] **Step 3: Commit states**

```bash
git add src/features-v2/network/NetworkMapViewV2.tsx
git commit -m "feat(network-v2): add loading, error, and empty states

- Loading: spinner with 'Cargando mapa de red...'
- Error: red message with error detail and retry button
- Empty: Building2 icon with 'No hay sedes' message
- All states respect embedded prop for height

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Implement ReactFlow Render with Legend and MiniMap

**Files:**
- Modify: `src/features-v2/network/NetworkMapViewV2.tsx` (replace `return <div>Component skeleton</div>`)

- [ ] **Step 1: Replace return with ReactFlow render**

Replace `return <div>Component skeleton</div>;` (should be the last line of component) with:

```typescript
  // Success state - render graph
  return (
    <div className={embedded ? 'h-full relative' : 'h-[calc(100vh-64px)] relative'}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3, duration: 800 }}
        minZoom={0.15}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
        className="bg-[#FAFBFD]"
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={24} 
          size={1} 
          color="#e2e5ea" 
        />
        <Controls
          showInteractive={false}
          className="!bg-white !border-gray-200 !rounded-xl !shadow-lg !shadow-black/5 [&>button]:!border-gray-100 [&>button]:!rounded-lg [&>button:hover]:!bg-gray-50"
        />
        <MiniMap
          nodeColor={(n) => {
            if (n.type === 'company') return '#3b82f6';
            if (n.type === 'sede') {
              const riskLevel = (n.data as { riskLevel: RiskLevel }).riskLevel;
              return riskColor[riskLevel] || '#9ca3af';
            }
            const status = (n.data as { status: PermitStatus }).status;
            return statusEdgeColor[status] || '#d1d5db';
          }}
          maskColor="rgba(248,250,252,0.7)"
          className="!bg-white !border-gray-200 !rounded-xl !shadow-lg !shadow-black/5"
          pannable
          zoomable
        />
      </ReactFlow>

      {/* Legend */}
      <div className={`absolute ${embedded ? 'bottom-3 left-3' : 'bottom-6 left-6'} bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200/80 shadow-lg ${embedded ? 'px-3 py-2' : 'px-4 py-3'} z-10`}>
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Estado de permisos
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {([
            ['#22c55e', 'Vigente'],
            ['#eab308', 'Por vencer'],
            ['#ef4444', 'Vencido'],
            ['#d1d5db', 'No registrado'],
          ] as const).map(([color, label]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[11px] text-gray-600">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run build` or check editor

Expected: No compilation errors

- [ ] **Step 3: Commit ReactFlow render**

```bash
git add src/features-v2/network/NetworkMapViewV2.tsx
git commit -m "feat(network-v2): implement ReactFlow render with UI components

- ReactFlow with all handlers and state
- Background with dots pattern
- Controls (zoom, fit, etc.)
- MiniMap with node coloring by type/risk/status
- Legend with 4 permit status indicators
- All components styled consistently

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Update NetworkMapPage to Use V2

**Files:**
- Modify: `src/features/network/NetworkMapPage.tsx`

- [ ] **Step 1: Add import for NetworkMapViewV2**

Add after existing imports (around line 2):

```typescript
import { NetworkMapViewV2 } from '@/features-v2/network/NetworkMapViewV2';
import { UI_VERSION } from '@/config';
```

- [ ] **Step 2: Update component to conditionally render V2**

Replace the `<NetworkMapView embedded={false} />` line with:

```typescript
      {UI_VERSION === 'v2' ? (
        <NetworkMapViewV2 embedded={false} />
      ) : (
        <NetworkMapView embedded={false} />
      )}
```

The full component should look like:

```typescript
import { NetworkMapView } from './NetworkMapView';
import { NetworkMapViewV2 } from '@/features-v2/network/NetworkMapViewV2';
import { UI_VERSION } from '@/config';

export function NetworkMapPage() {
  return (
    <div className="h-[calc(100vh-64px)]">
      <div className="absolute top-6 left-6 z-20 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200/80 shadow-lg px-4 py-3">
        <h2 className="text-lg font-bold text-gray-900 mb-0.5">Mapa de Red</h2>
        <p className="text-xs text-gray-500">Vista interactiva de sedes y permisos</p>
      </div>
      {UI_VERSION === 'v2' ? (
        <NetworkMapViewV2 embedded={false} />
      ) : (
        <NetworkMapView embedded={false} />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npm run build` or check editor

Expected: No compilation errors

- [ ] **Step 4: Commit NetworkMapPage update**

```bash
git add src/features/network/NetworkMapPage.tsx
git commit -m "feat(network-v2): integrate NetworkMapViewV2 into NetworkMapPage

- Import NetworkMapViewV2 and UI_VERSION
- Conditionally render V2 when UI_VERSION='v2'
- V1 users still see original NetworkMapView
- Maintains backward compatibility

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Manual Testing

**Files:**
- N/A (manual testing in browser)

- [ ] **Step 1: Verify dev server is running**

Check: `http://localhost:5173`

Expected: Server responds

- [ ] **Step 2: Verify UI_VERSION is set to v2**

Check: `src/config.ts` has `UI_VERSION = 'v2'`

Expected: Confirmed

- [ ] **Step 3: Navigate to network map**

Open: `http://localhost:5173/mapa-red`

Expected: NetworkMapViewV2 loads (not V1)

- [ ] **Step 4: Verify loading state appears briefly**

Refresh page and observe initial render

Expected: Spinner with "Cargando mapa de red..." appears

- [ ] **Step 5: Verify graph renders on desktop**

Check in desktop browser (≥768px width):
- Company (HQ) node at center (blue)
- Location nodes in circle around HQ
- Permit nodes in arcs around locations
- Edges connecting Company→Sedes→Permits
- Red animated edges for critical/expired

Expected: All elements visible and correctly positioned

- [ ] **Step 6: Verify responsive behavior on mobile**

Resize to mobile (<768px) or use dev tools:
- Company (HQ) node at center
- Location nodes in circle
- NO permit nodes visible
- NO sede→permit edges

Expected: Only HQ and location nodes visible (cleaner graph)

- [ ] **Step 7: Verify edge colors and animations**

Check edges:
- Company→Sede: colored by risk_level (red/orange/yellow/green)
- Critical risk: red line is animated
- Sede→Permit (desktop): colored by status
- Expired permit: red line is animated

Expected: Colors match risk/status, animations work

- [ ] **Step 8: Verify click navigation**

Click any location node

Expected: Navigates to `/sedes/{id}` detail page

- [ ] **Step 9: Verify drag & drop**

Drag a location node to new position

Expected: Node moves, physics adjusts other nodes, edges update

- [ ] **Step 10: Verify zoom and pan**

Use controls or mouse:
- Zoom in/out
- Pan around canvas
- Click "Fit View" button

Expected: All controls work smoothly

- [ ] **Step 11: Verify legend and minimap**

Check bottom left and right:
- Legend shows 4 status colors with labels
- MiniMap shows all nodes with correct colors
- MiniMap is pannable and zoomable

Expected: Both components visible and functional

- [ ] **Step 12: Test empty state**

If possible, test with account that has no locations

Expected: Shows Building2 icon with "No hay sedes" message

- [ ] **Step 13: Document any issues found**

List any bugs or visual issues

Expected: Note for fixes before completion

---

## Self-Review Checklist

**Spec Coverage:**
- ✅ NetworkMapViewV2 loads data from Supabase (useLocations, usePermits)
- ✅ Responsive: permits only on desktop (useMediaQuery)
- ✅ Company node at center
- ✅ Location nodes in circle (300px radius)
- ✅ Permit nodes in arc (180px, desktop only)
- ✅ Company→Sede edges colored by risk_level
- ✅ Sede→Permit edges colored by status
- ✅ Red animated edges for critical/expired
- ✅ Loading, error, empty states
- ✅ Click navigation to sede detail
- ✅ Drag & drop with physics
- ✅ Legend with 4 statuses (no 'en_tramite')
- ✅ MiniMap with node coloring
- ✅ Background with dots pattern
- ✅ Controls for zoom/pan
- ✅ Integration with NetworkMapPage via UI_VERSION

**Placeholder Scan:**
- ✅ No TODOs in final code
- ✅ All helper functions implemented
- ✅ All color mappings defined
- ✅ All state handlers complete

**Type Consistency:**
- ✅ `Location` and `Permit` types from `@/types` used consistently
- ✅ `RiskLevel` and `PermitStatus` types consistent
- ✅ Node and Edge types from ReactFlow used correctly
- ✅ Props interfaces match between components

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-15-network-map-v2-implementation.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
