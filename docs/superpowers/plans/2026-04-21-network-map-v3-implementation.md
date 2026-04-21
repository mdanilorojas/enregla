# Network Map V3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace physics-based d3-force layout with static radial positioning for improved scanability

**Architecture:** New NetworkMapV3 component with two custom hooks (useStaticLayout for position calculation, useNodeAnimation for fade-in stagger). No d3-force dependency. Positions calculated once in useMemo, drag behavior snaps back to original position.

**Tech Stack:** React 19, TypeScript, React Flow v12, Tailwind CSS, Vitest

---

## File Structure

**New files:**
- `src/features/network/NetworkMapV3.tsx` - Main component (similar structure to V2 but without physics)
- `src/features/network/useStaticLayout.ts` - Hook that calculates static node/edge positions
- `src/features/network/useNodeAnimation.ts` - Hook that detects new nodes and applies fade-in + stagger
- `src/features/network/NetworkMapPage.tsx` - Page wrapper that switches between V2 and V3
- `tests/features/network/useStaticLayout.test.ts` - Unit tests for layout calculation
- `tests/features/network/NetworkMapV3.test.tsx` - Integration tests for component

**Modified files:**
- `src/App.tsx` - Update route to use NetworkMapPage wrapper temporarily
- `src/index.css` - Add fadeIn animation keyframes

**Files to keep (no changes):**
- `src/features/network/nodes/CompanyNode.tsx` - Already redesigned
- `src/features/network/nodes/SedeNode.tsx` - Already redesigned  
- `src/features/network/nodes/PermitNode.tsx` - Already redesigned
- `src/features/network/NetworkMapViewV2.tsx` - Keep for comparison

---

## Task 1: Create useStaticLayout Hook with Tests

**Files:**
- Create: `src/features/network/useStaticLayout.ts`
- Create: `tests/features/network/useStaticLayout.test.ts`

- [ ] **Step 1: Write failing test for company node at origin**

```typescript
// tests/features/network/useStaticLayout.test.ts
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStaticLayout } from '@/features/network/useStaticLayout';

describe('useStaticLayout', () => {
  it('positions company node at origin (0, 0)', () => {
    const { result } = renderHook(() =>
      useStaticLayout({
        locations: [],
        permits: [],
        isDesktop: true,
        companyName: 'Test Company',
      })
    );

    const companyNode = result.current.nodes.find(n => n.id === 'company');
    
    expect(companyNode).toBeDefined();
    expect(companyNode?.position).toEqual({ x: 0, y: 0 });
    expect(companyNode?.type).toBe('company');
    expect(companyNode?.data.name).toBe('Test Company');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- useStaticLayout.test.ts`  
Expected: FAIL with "Cannot find module '@/features/network/useStaticLayout'"

- [ ] **Step 3: Create minimal useStaticLayout hook**

```typescript
// src/features/network/useStaticLayout.ts
import { useMemo } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { Location, Permit } from '@/types/database';

interface UseStaticLayoutOptions {
  locations: Location[];
  permits: Permit[];
  isDesktop: boolean;
  companyName: string;
}

export function useStaticLayout({ 
  locations, 
  permits, 
  isDesktop,
  companyName 
}: UseStaticLayoutOptions) {
  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Company node at origin
    nodes.push({
      id: 'company',
      type: 'company',
      position: { x: 0, y: 0 },
      data: {
        name: companyName,
        locationCount: locations.length,
      },
    });

    return { nodes, edges };
  }, [locations, permits, isDesktop, companyName]);

  return { nodes, edges };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- useStaticLayout.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/network/useStaticLayout.ts tests/features/network/useStaticLayout.test.ts
git commit -m "feat(network): add useStaticLayout hook with company node positioning

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Add Sede Nodes in Radial Layout

**Files:**
- Modify: `src/features/network/useStaticLayout.ts`
- Modify: `tests/features/network/useStaticLayout.test.ts`

- [ ] **Step 1: Write failing test for sede circle distribution**

```typescript
// Add to tests/features/network/useStaticLayout.test.ts
it('distributes sedes in circle with radius 350px', () => {
  const mockLocations: Location[] = [
    { 
      id: 'loc-1', 
      name: 'Sede 1', 
      address: 'Calle 1', 
      risk_level: 'bajo',
      company_id: 'comp-1',
      is_active: true,
      created_at: '2024-01-01',
    },
    { 
      id: 'loc-2', 
      name: 'Sede 2', 
      address: 'Calle 2', 
      risk_level: 'medio',
      company_id: 'comp-1',
      is_active: true,
      created_at: '2024-01-01',
    },
  ];

  const { result } = renderHook(() =>
    useStaticLayout({
      locations: mockLocations,
      permits: [],
      isDesktop: true,
      companyName: 'Test',
    })
  );

  const sedeNodes = result.current.nodes.filter(n => n.type === 'sede');
  
  expect(sedeNodes).toHaveLength(2);
  
  sedeNodes.forEach(sede => {
    const distance = Math.sqrt(sede.position.x ** 2 + sede.position.y ** 2);
    expect(distance).toBeCloseTo(350, 1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- useStaticLayout.test.ts`  
Expected: FAIL with "Expected length 2, received 0"

- [ ] **Step 3: Implement sede positioning logic**

```typescript
// Modify src/features/network/useStaticLayout.ts
// Inside useMemo, after company node:

// Helper function to calculate handle pair
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

// Color mapping for risk levels
const riskColor: Record<string, string> = {
  critico: '#ef4444',
  alto: '#f97316',
  medio: '#eab308',
  bajo: '#22c55e',
};

// Calculate compliance
function calculateCompliance(permits: Permit[]): number {
  const active = permits.filter(p => p.is_active);
  if (active.length === 0) return 0;
  const vigentes = active.filter(p => p.status === 'vigente').length;
  return Math.round((vigentes / active.length) * 100);
}

// Count critical issues
function countCritical(permits: Permit[]): number {
  return permits.filter(p =>
    p.is_active && (p.status === 'vencido' || p.status === 'no_registrado')
  ).length;
}

// Sedes in circle (radius 350px)
const SEDE_RADIUS = 350;
const companyPos = { x: 0, y: 0 };

locations.forEach((loc, i) => {
  const angle = (2 * Math.PI * i / locations.length) - Math.PI / 2; // Start at top
  const sedePos = {
    x: Math.cos(angle) * SEDE_RADIUS,
    y: Math.sin(angle) * SEDE_RADIUS,
  };

  const locPermits = permits.filter(p => p.location_id === loc.id && p.is_active);
  const compliance = calculateCompliance(locPermits);
  const critical = countCritical(locPermits);

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
  const handles = getHandlePair(companyPos.x, companyPos.y, sedePos.x, sedePos.y);
  edges.push({
    id: `company-${loc.id}`,
    source: 'company',
    target: loc.id,
    sourceHandle: handles.sourceHandle,
    targetHandle: handles.targetHandle,
    style: {
      stroke: riskColor[loc.risk_level] || '#9ca3af',
      strokeWidth: 2,
      opacity: 0.35,
    },
    animated: loc.risk_level === 'critico',
  });
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- useStaticLayout.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/network/useStaticLayout.ts tests/features/network/useStaticLayout.test.ts
git commit -m "feat(network): add sede radial positioning and edges

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Add Permit Nodes with Dynamic Radius

**Files:**
- Modify: `src/features/network/useStaticLayout.ts`
- Modify: `tests/features/network/useStaticLayout.test.ts`

- [ ] **Step 1: Write failing test for permit positioning with dynamic radius**

```typescript
// Add to tests/features/network/useStaticLayout.test.ts
it('positions permits around sede with dynamic radius based on count', () => {
  const mockLocation: Location = {
    id: 'loc-1',
    name: 'Sede Test',
    address: 'Test Address',
    risk_level: 'bajo',
    company_id: 'comp-1',
    is_active: true,
    created_at: '2024-01-01',
  };

  const mockPermits: Permit[] = Array.from({ length: 5 }, (_, i) => ({
    id: `permit-${i}`,
    type: 'Funcionamiento',
    status: 'vigente' as const,
    location_id: 'loc-1',
    company_id: 'comp-1',
    is_active: true,
    issuer: 'Test',
    created_at: '2024-01-01',
  }));

  const { result } = renderHook(() =>
    useStaticLayout({
      locations: [mockLocation],
      permits: mockPermits,
      isDesktop: true,
      companyName: 'Test',
    })
  );

  const permitNodes = result.current.nodes.filter(n => n.type === 'permit');
  
  expect(permitNodes).toHaveLength(5);
  
  // Expected radius for 5 permits: Math.max(120, Math.min(240, 80 + 5 * 12)) = 140px
  const expectedRadius = 140;
  
  permitNodes.forEach(permit => {
    // Calculate distance from sede (at angle -90° = top, x=0, y=-350)
    const sedePos = { x: 0, y: -350 };
    const dx = permit.position.x - sedePos.x;
    const dy = permit.position.y - sedePos.y;
    const distance = Math.sqrt(dx ** 2 + dy ** 2);
    
    expect(distance).toBeCloseTo(expectedRadius, 1);
  });
});

it('hides permits when isDesktop is false', () => {
  const mockLocation: Location = {
    id: 'loc-1',
    name: 'Sede Test',
    address: 'Test',
    risk_level: 'bajo',
    company_id: 'comp-1',
    is_active: true,
    created_at: '2024-01-01',
  };

  const mockPermits: Permit[] = [
    {
      id: 'permit-1',
      type: 'Test',
      status: 'vigente',
      location_id: 'loc-1',
      company_id: 'comp-1',
      is_active: true,
      issuer: 'Test',
      created_at: '2024-01-01',
    },
  ];

  const { result } = renderHook(() =>
    useStaticLayout({
      locations: [mockLocation],
      permits: mockPermits,
      isDesktop: false, // Mobile
      companyName: 'Test',
    })
  );

  const permitNodes = result.current.nodes.filter(n => n.type === 'permit');
  expect(permitNodes).toHaveLength(0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- useStaticLayout.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement permit positioning with dynamic radius**

```typescript
// Modify src/features/network/useStaticLayout.ts
// Inside the locations.forEach loop, after creating sede node and edge:

// Permit status colors
const statusEdgeColor: Record<string, string> = {
  vigente: '#22c55e',
  por_vencer: '#eab308',
  vencido: '#ef4444',
  no_registrado: '#d1d5db',
};

// Permits around each sede (only on desktop)
if (isDesktop) {
  locPermits.forEach((permit, j) => {
    // Dynamic radius based on permit count: 120px min, 240px max
    const permitRadius = Math.max(120, Math.min(240, 80 + locPermits.length * 12));
    
    // Distribute in arc aligned with sede's angle
    const permitAngle = (2 * Math.PI * j / locPermits.length) + angle;
    const permitPos = {
      x: sedePos.x + Math.cos(permitAngle) * permitRadius,
      y: sedePos.y + Math.sin(permitAngle) * permitRadius,
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
        stroke: statusEdgeColor[permit.status] || '#d1d5db',
        strokeWidth: (permit.status === 'vencido' || permit.status === 'no_registrado') ? 2.5 : 1.5,
        opacity: permit.status === 'no_registrado' ? 0.35 : 0.6,
      },
      animated: permit.status === 'vencido',
    });
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- useStaticLayout.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/network/useStaticLayout.ts tests/features/network/useStaticLayout.test.ts
git commit -m "feat(network): add permit positioning with dynamic radius

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Create useNodeAnimation Hook

**Files:**
- Create: `src/features/network/useNodeAnimation.ts`
- Create: `tests/features/network/useNodeAnimation.test.ts`

- [ ] **Step 1: Write failing test for animation detection**

```typescript
// tests/features/network/useNodeAnimation.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNodeAnimation } from '@/features/network/useNodeAnimation';
import type { Node } from '@xyflow/react';

describe('useNodeAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns empty set initially', () => {
    const { result } = renderHook(() => useNodeAnimation([]));
    expect(result.current.size).toBe(0);
  });

  it('detects and animates new nodes with stagger', () => {
    const { result, rerender } = renderHook(
      ({ nodes }) => useNodeAnimation(nodes),
      { initialProps: { nodes: [] as Node[] } }
    );

    const newNodes: Node[] = [
      { id: 'company', type: 'company', position: { x: 0, y: 0 }, data: {} },
      { id: 'sede-1', type: 'sede', position: { x: 100, y: 0 }, data: {} },
      { id: 'permit-1', type: 'permit', position: { x: 200, y: 0 }, data: {} },
    ];

    act(() => {
      rerender({ nodes: newNodes });
    });

    // Initially, no nodes animated yet (stagger hasn't fired)
    expect(result.current.has('company')).toBe(false);

    // Company should animate immediately (0ms)
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(result.current.has('company')).toBe(true);

    // Sede after 50ms
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(result.current.has('sede-1')).toBe(true);

    // Permit after another 50ms
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(result.current.has('permit-1')).toBe(true);
  });

  it('sorts company first, then sedes, then permits', () => {
    const { result, rerender } = renderHook(
      ({ nodes }) => useNodeAnimation(nodes),
      { initialProps: { nodes: [] as Node[] } }
    );

    const newNodes: Node[] = [
      { id: 'permit-1', type: 'permit', position: { x: 0, y: 0 }, data: {} },
      { id: 'sede-1', type: 'sede', position: { x: 0, y: 0 }, data: {} },
      { id: 'company', type: 'company', position: { x: 0, y: 0 }, data: {} },
    ];

    act(() => {
      rerender({ nodes: newNodes });
      vi.advanceTimersByTime(0);
    });

    // Company should be first despite being last in array
    expect(result.current.has('company')).toBe(true);
    expect(result.current.has('sede-1')).toBe(false);
    expect(result.current.has('permit-1')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- useNodeAnimation.test.ts`  
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Implement useNodeAnimation hook**

```typescript
// src/features/network/useNodeAnimation.ts
import { useState, useEffect, useRef } from 'react';
import type { Node } from '@xyflow/react';

export function useNodeAnimation(nodes: Node[]): Set<string> {
  const [animatedNodes, setAnimatedNodes] = useState<Set<string>>(new Set());
  const nodeIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const currentIds = new Set(nodes.map(n => n.id));
    const newNodeIds = nodes
      .map(n => n.id)
      .filter(id => !nodeIdsRef.current.has(id));

    if (newNodeIds.length > 0) {
      // Sort: empresa first, then sedes, then permisos
      const sortedNew = newNodeIds.sort((a, b) => {
        if (a === 'company') return -1;
        if (b === 'company') return 1;
        
        const aNode = nodes.find(n => n.id === a);
        const bNode = nodes.find(n => n.id === b);
        
        if (aNode?.type === 'sede' && bNode?.type === 'permit') return -1;
        if (aNode?.type === 'permit' && bNode?.type === 'sede') return 1;
        
        return 0;
      });

      // Stagger animation: 50ms delay between each node
      sortedNew.forEach((id, index) => {
        setTimeout(() => {
          setAnimatedNodes(prev => new Set([...prev, id]));
        }, index * 50);
      });
    }

    nodeIdsRef.current = currentIds;
  }, [nodes]);

  return animatedNodes;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- useNodeAnimation.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/network/useNodeAnimation.ts tests/features/network/useNodeAnimation.test.ts
git commit -m "feat(network): add useNodeAnimation hook with stagger

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Add Fade-In Animation CSS

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Add fadeIn keyframes and class**

```css
/* Add to src/index.css at the end */

/* Network Map V3 - Node entrance animation */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fadeIn {
  animation: fadeIn 300ms ease-out forwards;
}

/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .animate-fadeIn {
    animation: fadeIn 100ms ease-out forwards;
    /* Shorter duration, no scale transform */
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/index.css
git commit -m "style(network): add fadeIn animation for node entrance

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Create NetworkMapV3 Component - States Only

**Files:**
- Create: `src/features/network/NetworkMapV3.tsx`

- [ ] **Step 1: Write failing test for loading state**

```typescript
// tests/features/network/NetworkMapV3.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { NetworkMapV3 } from '@/features/network/NetworkMapV3';

// Mock hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ profile: { company_id: 'test-company' } }),
}));

vi.mock('@/hooks/useLocations', () => ({
  useLocations: vi.fn(),
}));

vi.mock('@/hooks/usePermits', () => ({
  usePermits: vi.fn(),
}));

vi.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: () => true, // Desktop by default
}));

describe('NetworkMapV3', () => {
  it('shows loading state while fetching data', () => {
    const { useLocations } = require('@/hooks/useLocations');
    const { usePermits } = require('@/hooks/usePermits');
    
    useLocations.mockReturnValue({
      locations: [],
      loading: true,
      error: null,
    });
    
    usePermits.mockReturnValue({
      permits: [],
      loading: true,
      error: null,
    });

    render(
      <BrowserRouter>
        <NetworkMapV3 />
      </BrowserRouter>
    );

    expect(screen.getByText('Cargando mapa de red...')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- NetworkMapV3.test.tsx`  
Expected: FAIL

- [ ] **Step 3: Create NetworkMapV3 component with all states**

```typescript
// src/features/network/NetworkMapV3.tsx
import { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
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
import { useStaticLayout } from './useStaticLayout';
import { useNodeAnimation } from './useNodeAnimation';
import { SedeNode } from './nodes/SedeNode';
import { PermitNode } from './nodes/PermitNode';
import { CompanyNode } from './nodes/CompanyNode';
import type { RiskLevel, PermitStatus } from '@/types';

// Node types for ReactFlow
const nodeTypes = {
  sede: SedeNode,
  permit: PermitNode,
  company: CompanyNode,
};

// Color mapping for risk levels (for MiniMap)
const riskColor: Record<RiskLevel, string> = {
  critico: '#ef4444',
  alto: '#f97316',
  medio: '#eab308',
  bajo: '#22c55e',
};

// Color mapping for permit status (for MiniMap)
const statusEdgeColor: Record<PermitStatus, string> = {
  vigente: '#22c55e',
  por_vencer: '#eab308',
  vencido: '#ef4444',
  no_registrado: '#d1d5db',
};

interface NetworkMapV3Props {
  embedded?: boolean;
}

export function NetworkMapV3({ embedded = false }: NetworkMapV3Props) {
  const navigate = useNavigate();

  // Load data from Supabase
  const { profile } = useAuth();
  const companyId = profile?.company_id;

  const { locations, loading: locationsLoading, error: locationsError } = useLocations(companyId);
  const { permits, loading: permitsLoading, error: permitsError } = usePermits({ companyId });

  // Combined loading and error states
  const loading = locationsLoading || permitsLoading;
  const error = locationsError || permitsError;

  // Responsive detection
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const isMobile = useMediaQuery('(max-width: 767px)');

  // Calculate static layout
  const { nodes: staticNodes, edges: staticEdges } = useStaticLayout({
    locations,
    permits,
    isDesktop,
    companyName: 'Empresa', // TODO: Fetch from companies table
  });

  // Detect new nodes for animation
  const animatedNodeIds = useNodeAnimation(staticNodes);

  // Add animation class to nodes
  const nodesWithAnimation = useMemo(
    () =>
      staticNodes.map(node => ({
        ...node,
        className: animatedNodeIds.has(node.id) ? 'animate-fadeIn' : 'opacity-100',
      })),
    [staticNodes, animatedNodeIds]
  );

  // ReactFlow state management
  const [nodes, setNodes, onNodesChange] = useNodesState(nodesWithAnimation);
  const [edges, , onEdgesChange] = useEdgesState(staticEdges);

  // Sync ReactFlow state when data changes
  useMemo(() => {
    setNodes(nodesWithAnimation);
  }, [nodesWithAnimation, setNodes]);

  // Click handler for navigation
  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      if (node.type === 'sede') {
        navigate(`/sedes/${node.id}`);
      } else if (node.type === 'permit') {
        navigate(`/permisos/${node.id}`);
      }
    },
    [navigate]
  );

  // Drag handlers (snap back to original position)
  const originalPositions = useMemo(() => {
    const posMap = new Map<string, { x: number; y: number }>();
    staticNodes.forEach(n => {
      posMap.set(n.id, n.position);
    });
    return posMap;
  }, [staticNodes]);

  const onNodeDragStop: OnNodeDrag = useCallback(
    (_, node) => {
      const originalPos = originalPositions.get(node.id);
      if (originalPos) {
        setNodes(prev =>
          prev.map(n => (n.id === node.id ? { ...n, position: originalPos } : n))
        );
      }
    },
    [originalPositions, setNodes]
  );

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

  // Mobile fallback
  if (isMobile) {
    return (
      <div className={embedded ? 'h-full' : 'h-[calc(100vh-64px)]'}>
        <div className="h-full flex items-center justify-center bg-[#FAFBFD]">
          <div className="text-center px-4">
            <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Vista disponible en desktop</h3>
            <p className="text-sm text-gray-500">
              El mapa de red requiere una pantalla más grande para visualizarse correctamente
            </p>
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

  // Success state - render map
  return (
    <div className={embedded ? 'h-full relative' : 'h-[calc(100vh-64px)] relative'}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3, duration: 800 }}
        minZoom={0.15}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
        className="bg-[#FAFBFD]"
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#e2e5ea" />
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
      <div
        className={`absolute ${
          embedded ? 'bottom-3 left-3' : 'bottom-6 left-6'
        } bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200/80 shadow-lg ${
          embedded ? 'px-3 py-2' : 'px-4 py-3'
        } z-10`}
      >
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

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- NetworkMapV3.test.tsx`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/network/NetworkMapV3.tsx tests/features/network/NetworkMapV3.test.tsx
git commit -m "feat(network): create NetworkMapV3 component with all states

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Create NetworkMapPage Wrapper for Testing

**Files:**
- Create: `src/features/network/NetworkMapPage.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create NetworkMapPage wrapper with version toggle**

```typescript
// src/features/network/NetworkMapPage.tsx
import { useState } from 'react';
import { NetworkMapViewV2 } from './NetworkMapViewV2';
import { NetworkMapV3 } from './NetworkMapV3';

export function NetworkMapPage() {
  const [useV3, setUseV3] = useState(true);

  return (
    <div className="relative h-full">
      {/* Version toggle (top-right, temporary for testing) */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-white rounded-lg shadow-lg px-3 py-2 border border-gray-200">
        <span className="text-xs font-medium text-gray-600">Versión:</span>
        <button
          onClick={() => setUseV3(false)}
          className={`px-2 py-1 text-xs rounded ${
            !useV3
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          V2
        </button>
        <button
          onClick={() => setUseV3(true)}
          className={`px-2 py-1 text-xs rounded ${
            useV3
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          V3
        </button>
      </div>

      {/* Render selected version */}
      {useV3 ? <NetworkMapV3 /> : <NetworkMapViewV2 />}
    </div>
  );
}
```

- [ ] **Step 2: Update App.tsx to use NetworkMapPage**

```typescript
// Modify src/App.tsx
// Find the line:
import { NetworkMapViewV2 } from '@/features/network/NetworkMapViewV2';

// Replace with:
import { NetworkMapPage } from '@/features/network/NetworkMapPage';

// Find the route:
<Route path="/mapa-red" element={<NetworkMapViewV2 />} />

// Replace with:
<Route path="/mapa-red" element={<NetworkMapPage />} />
```

- [ ] **Step 3: Test manually - start dev server**

Run: `npm run dev`  
Expected: Dev server starts successfully

- [ ] **Step 4: Open browser and test toggle**

Navigate to: `http://localhost:5173/mapa-red`  
Expected: 
- See version toggle (V2/V3) in top-right
- V3 selected by default
- Map renders with static layout (no movement)
- Toggle to V2 shows old physics-based version

- [ ] **Step 5: Commit**

```bash
git add src/features/network/NetworkMapPage.tsx src/App.tsx
git commit -m "feat(network): add NetworkMapPage wrapper with version toggle

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Manual Testing & Polish

**Files:**
- None (manual testing only)

- [ ] **Step 1: Test with 1 sede**

Actions:
1. Navigate to `/sedes`
2. Ensure only 1 sede exists (archive others if needed)
3. Navigate to `/mapa-red`
4. Verify sede appears at top (angle -90°)

Expected: Single sede at top, no layout issues

- [ ] **Step 2: Test with 3 sedes**

Actions:
1. Add 2 more sedes
2. Refresh map
3. Verify distribution

Expected: 3 sedes evenly distributed in circle

- [ ] **Step 3: Test drag snap-back**

Actions:
1. Drag a sede node
2. Release mouse

Expected: Node snaps back to original position smoothly

- [ ] **Step 4: Test navigation clicks**

Actions:
1. Click on sede node
2. Verify navigation to `/sedes/:id`
3. Go back
4. Click on permit node
5. Verify navigation to `/permisos/:id`

Expected: Both navigations work correctly

- [ ] **Step 5: Test responsive behavior**

Actions:
1. Resize browser to tablet width (800px)
2. Verify permisos are hidden
3. Resize to mobile (<768px)
4. Verify "Vista disponible en desktop" message

Expected: Responsive states work correctly

- [ ] **Step 6: Test entrance animation**

Actions:
1. Refresh page with hard reload (Ctrl+Shift+R)
2. Watch nodes appear

Expected: 
- Empresa appears first
- Sedes appear with 50ms stagger
- Permisos appear last
- Smooth fade-in effect

- [ ] **Step 7: Test with many permits (>8)**

Actions:
1. Add 12 permits to a single sede
2. Refresh map

Expected: Permits distributed with larger radius (~220px), no overlap

- [ ] **Step 8: Document any issues found**

If issues are found, document in a comment and create follow-up tasks.

---

## Task 9: Final Comparison & Decision

**Files:**
- None (testing & decision only)

- [ ] **Step 1: Compare V2 vs V3 side-by-side**

Actions:
1. Navigate to `/mapa-red`
2. Toggle between V2 and V3 using the version toggle
3. Compare:
   - Visual scanability
   - Performance (check browser DevTools Performance tab)
   - User experience (drag, click, navigation)

Expected: V3 should feel more stable and scannable

- [ ] **Step 2: Get user approval**

Ask user: "V3 is ready for testing. Please compare V2 vs V3 and confirm if V3 is approved for production. Any adjustments needed?"

Wait for approval before proceeding.

- [ ] **Step 3: If approved, proceed to Task 10. If changes needed, address feedback first**

---

## Task 10: Production Deployment

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/features/network/NetworkMapPage.tsx`

- [ ] **Step 1: Remove version toggle from NetworkMapPage**

```typescript
// Modify src/features/network/NetworkMapPage.tsx
// Replace entire file with:
import { NetworkMapV3 } from './NetworkMapV3';

export function NetworkMapPage() {
  return <NetworkMapV3 />;
}
```

- [ ] **Step 2: Update route in App.tsx**

```typescript
// Modify src/App.tsx
// Keep the import:
import { NetworkMapPage } from '@/features/network/NetworkMapPage';

// Route already correct:
<Route path="/mapa-red" element={<NetworkMapPage />} />
```

- [ ] **Step 3: Run all tests**

Run: `npm test`  
Expected: All tests pass

- [ ] **Step 4: Build for production**

Run: `npm run build`  
Expected: Build succeeds with no errors

- [ ] **Step 5: Commit**

```bash
git add src/features/network/NetworkMapPage.tsx src/App.tsx
git commit -m "feat(network): deploy NetworkMapV3 to production

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 11: Cleanup (After 1 Sprint Stability Period)

**Files:**
- Delete: `src/features/network/NetworkMapViewV2.tsx`
- Delete: `src/features/network/useForceLayout.ts`
- Modify: `package.json`

**IMPORTANT:** Only execute this task after V3 has been stable in production for at least 1 sprint and user confirms no rollback needed.

- [ ] **Step 1: Confirm with user before cleanup**

Ask: "V3 has been stable for 1 sprint. Ready to delete V2 and d3-force? This cannot be easily undone."

Wait for explicit "yes" before proceeding.

- [ ] **Step 2: Delete V2 files**

```bash
git rm src/features/network/NetworkMapViewV2.tsx
git rm src/features/network/useForceLayout.ts
```

- [ ] **Step 3: Remove d3-force from package.json**

```bash
npm uninstall d3-force @types/d3-force
```

- [ ] **Step 4: Run tests to ensure nothing broke**

Run: `npm test`  
Expected: All tests still pass

- [ ] **Step 5: Commit cleanup**

```bash
git add package.json package-lock.json
git commit -m "chore(network): remove V2 and d3-force after V3 stable

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Spec Coverage Self-Review

Checking spec requirements against tasks:

1. **Eliminate physics-based movement** ✅ Task 1-3 (useStaticLayout)
2. **Improve visual scanning** ✅ Task 1-3 (static radial layout)
3. **Maintain interactivity** ✅ Task 6 (drag snap-back, click navigation)
4. **Add polish** ✅ Task 4-5 (fade-in + stagger animation)
5. **Loading/error/empty states** ✅ Task 6 (all states implemented)
6. **Responsive behavior** ✅ Task 6 (mobile fallback, tablet hides permits)
7. **Edge styling** ✅ Task 2-3 (risk colors, status colors, animated)
8. **MiniMap** ✅ Task 6 (color-coded by risk/status)
9. **Legend** ✅ Task 6 (fixed bottom-left)
10. **Testing** ✅ Task 1-6 (unit + integration tests)
11. **Migration plan** ✅ Task 7-11 (toggle → deploy → cleanup)

No spec gaps found.

---

**End of Implementation Plan**
