# Network Map V3 - Static Layout Design

**Date:** 2026-04-21  
**Status:** Approved  
**Author:** Claude Code + Usuario

## Context

The current NetworkMapViewV2 uses d3-force physics simulation to position nodes dynamically. Users report that the constant movement makes visual scanning difficult and the interface feels unpredictable. This redesign eliminates physics-based layout in favor of a static, calculated radial layout that prioritizes scanability and predictability.

## Goals

1. **Eliminate physics-based movement** - Replace d3-force with static position calculation
2. **Improve visual scanning** - Static positions make it easy to find and compare sedes/permits
3. **Maintain interactivity** - Preserve drag feedback, click navigation, and hover states
4. **Add polish** - Implement entrance animations (fade + stagger) for professional feel
5. **Keep existing functionality** - Loading/error/empty states, responsive behavior, navigation

## Non-Goals

- Not changing the Design Brief (already approved)
- Not modifying node components (CompanyNode, SedeNode, PermitNode already redesigned)
- Not adding new features (filtering, search, grouping) - pure layout refactor
- Not persisting custom positions (drag is visual feedback only)

## Architecture

### High-Level Structure

```
src/features/network/
├── NetworkMapV3.tsx           ← New main component
├── hooks/
│   ├── useStaticLayout.ts     ← Position calculation logic
│   └── useNodeAnimation.ts    ← Fade-in + stagger animation
├── nodes/                     ← Existing (already redesigned)
│   ├── CompanyNode.tsx
│   ├── SedeNode.tsx
│   └── PermitNode.tsx
└── NetworkMapViewV2.tsx       ← Keep temporarily, remove after V3 is stable
```

### Component Hierarchy

```
NetworkMapV3
├── Loading State (spinner + "Cargando mapa de red...")
├── Error State (error message + retry button)
├── Empty State (Building2 icon + "No hay sedes")
└── Success State
    └── ReactFlow
        ├── Background (dots)
        ├── Controls (zoom/pan)
        ├── MiniMap
        ├── Legend (fixed bottom-left)
        └── Nodes + Edges
```

## Core Logic

### 1. Static Layout Calculation (`useStaticLayout`)

**Purpose:** Pure function that calculates static node positions based on data.

**Algorithm:**

```typescript
function calculateStaticLayout(locations, permits, isDesktop) {
  const nodes = [];
  const edges = [];

  // 1. Company node at origin
  nodes.push({
    id: 'company',
    type: 'company',
    position: { x: 0, y: 0 },
    data: { name: 'Empresa', locationCount: locations.length }
  });

  // 2. Sedes in circle (radius 350px)
  locations.forEach((loc, i) => {
    const angle = (2 * Math.PI * i / locations.length) - Math.PI / 2; // Start at top
    const sedePos = {
      x: Math.cos(angle) * 350,
      y: Math.sin(angle) * 350
    };

    nodes.push({
      id: loc.id,
      type: 'sede',
      position: sedePos,
      data: { /* sede data */ }
    });

    // Edge: Company → Sede
    edges.push({
      id: `company-${loc.id}`,
      source: 'company',
      target: loc.id,
      // ... styling
    });

    // 3. Permits around each sede (only on desktop)
    if (isDesktop) {
      const locPermits = permits.filter(p => p.location_id === loc.id && p.is_active);
      
      // Dynamic radius based on permit count
      const permitRadius = Math.max(120, Math.min(240, 80 + locPermits.length * 12));

      locPermits.forEach((permit, j) => {
        const permitAngle = (2 * Math.PI * j / locPermits.length) + angle; // Offset by sede angle
        const permitPos = {
          x: sedePos.x + Math.cos(permitAngle) * permitRadius,
          y: sedePos.y + Math.sin(permitAngle) * permitRadius
        };

        nodes.push({
          id: permit.id,
          type: 'permit',
          position: permitPos,
          data: { /* permit data */ }
        });

        // Edge: Sede → Permit
        edges.push({
          id: `${loc.id}-${permit.id}`,
          source: loc.id,
          target: permit.id,
          // ... styling
        });
      });
    }
  });

  return { nodes, edges };
}
```

**Key differences from V2:**
- ✅ Positions calculated **once** (in useMemo), not updated on every tick
- ✅ No d3-force simulation
- ✅ Permit radius scales dynamically (120-240px) based on count
- ✅ Permits distributed in arc aligned with sede's angle (not random offset)

**Edge case handling:**
- 0 locations: return empty arrays (triggers Empty State)
- 1 location: position at angle -90° (top)
- Many permits (>12): radius caps at 240px, permits may be closer together

### 2. Node Animation (`useNodeAnimation`)

**Purpose:** Detect new nodes and apply fade-in + stagger effect.

**Algorithm:**

```typescript
function useNodeAnimation(nodes: Node[]) {
  const [animatedNodes, setAnimatedNodes] = useState<Set<string>>(new Set());
  const nodeIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const currentIds = new Set(nodes.map(n => n.id));
    const newNodeIds = nodes
      .map(n => n.id)
      .filter(id => !nodeIdsRef.current.has(id));

    if (newNodeIds.length > 0) {
      // Stagger: empresa (0ms) → sedes (50ms each) → permisos (50ms each)
      const sortedNew = newNodeIds.sort((a, b) => {
        if (a === 'company') return -1;
        if (b === 'company') return 1;
        // Sedes before permits
        const aNode = nodes.find(n => n.id === a);
        const bNode = nodes.find(n => n.id === b);
        if (aNode?.type === 'sede' && bNode?.type === 'permit') return -1;
        if (aNode?.type === 'permit' && bNode?.type === 'sede') return 1;
        return 0;
      });

      sortedNew.forEach((id, index) => {
        setTimeout(() => {
          setAnimatedNodes(prev => new Set([...prev, id]));
        }, index * 50); // 50ms stagger
      });
    }

    nodeIdsRef.current = currentIds;
  }, [nodes]);

  return animatedNodes;
}
```

**Usage in component:**
```tsx
const animatedNodeIds = useNodeAnimation(nodes);

// In render, add class to ReactFlow nodes:
const nodesWithAnimation = nodes.map(node => ({
  ...node,
  className: animatedNodeIds.has(node.id) 
    ? 'animate-fadeIn' 
    : 'opacity-100'
}));
```

**CSS:**
```css
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.animate-fadeIn {
  animation: fadeIn 300ms ease-out forwards;
}

@media (prefers-reduced-motion: reduce) {
  .animate-fadeIn {
    animation: fadeIn 100ms ease-out forwards; /* Shorter, no scale */
  }
}
```

### 3. Drag Behavior (Visual Feedback Only)

**Requirements:**
- Node moves while dragging (responsive feel)
- Node snaps back to original position on release
- No physics, no persistence

**Implementation:**
```typescript
const onNodeDragStart: OnNodeDrag = useCallback((event, node) => {
  // Visual feedback: cursor changes to grabbing
  // No position change needed - React Flow handles visual drag
}, []);

const onNodeDragStop: OnNodeDrag = useCallback((event, node) => {
  // Snap back to calculated position
  setNodes(prev => prev.map(n => 
    n.id === node.id 
      ? { ...n, position: calculateOriginalPosition(n.id) } // Reset to static position
      : n
  ));
}, []);
```

**Alternative (simpler):** Disable drag entirely by setting `nodesDraggable={false}` on ReactFlow. User feedback indicated visual feedback is nice-to-have, not critical.

**Decision:** Implement snap-back behavior. If it feels janky in testing, disable drag.

## Data Flow

```
useAuth() → profile.company_id
          ↓
useLocations(companyId) → locations[]
usePermits(companyId)   → permits[]
          ↓
useStaticLayout(locations, permits, isDesktop)
          ↓
{ nodes, edges } (with static positions)
          ↓
useNodeAnimation(nodes) → animatedNodeIds
          ↓
ReactFlow(nodes, edges) → Render
```

**State management:**
- `nodes`, `edges`: Managed by React Flow's `useNodesState`, `useEdgesState`
- Synced when `locations` or `permits` change
- No external state for positions (all derived from data)

## Edge Styling

**Kept from V2:**
- Company → Sede: Color by risk level, animated if critical
- Sede → Permit: Color by status, thicker if expired/unregistered

**New (from Design Brief):**
- Inline labels on edges for "Vence en X días" (future enhancement, not v1)

**Implementation:**
```typescript
// Company → Sede
{
  id: `company-${loc.id}`,
  source: 'company',
  target: loc.id,
  sourceHandle: getHandlePair(companyPos, sedePos).sourceHandle,
  targetHandle: getHandlePair(companyPos, sedePos).targetHandle,
  style: {
    stroke: riskColor[loc.risk_level],
    strokeWidth: 2,
    opacity: 0.35,
  },
  animated: loc.risk_level === 'critico',
}

// Sede → Permit
{
  id: `${loc.id}-${permit.id}`,
  source: loc.id,
  target: permit.id,
  sourceHandle: `s-${getHandlePair(sedePos, permitPos).sourceHandle}`,
  targetHandle: getHandlePair(sedePos, permitPos).targetHandle,
  style: {
    stroke: statusEdgeColor[permit.status],
    strokeWidth: permit.status === 'vencido' || permit.status === 'no_registrado' ? 2.5 : 1.5,
    opacity: permit.status === 'no_registrado' ? 0.35 : 0.6,
  },
  animated: permit.status === 'vencido',
}
```

## Responsive Behavior

**Breakpoints:**
- Desktop (≥768px): Show empresa + sedes + permisos
- Tablet (768-1024px): Show empresa + sedes only (hide permisos)
- Mobile (<768px): Fallback to empty state with CTA "Ver en desktop"

**Implementation:**
```typescript
const isDesktop = useMediaQuery('(min-width: 768px)');
const isMobile = useMediaQuery('(max-width: 767px)');

if (isMobile) {
  return (
    <div className="h-full flex items-center justify-center bg-[#FAFBFD]">
      <div className="text-center px-4">
        <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Vista disponible en desktop</h3>
        <p className="text-sm text-gray-500">
          El mapa de red requiere una pantalla más grande para visualizarse correctamente
        </p>
      </div>
    </div>
  );
}

// In useStaticLayout:
if (isDesktop) {
  // Add permit nodes
}
```

## Error Handling

**States:**
1. **Loading:** `locationsLoading || permitsLoading`
2. **Error:** `locationsError || permitsError`
3. **Empty:** `locations.length === 0`
4. **Success:** Render map

**Error recovery:**
```tsx
if (error) {
  return (
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
  );
}
```

## Testing Strategy

**Unit tests** (useStaticLayout):
```typescript
describe('useStaticLayout', () => {
  it('positions company at origin', () => {
    const { nodes } = calculateStaticLayout([...], [...], true);
    const company = nodes.find(n => n.id === 'company');
    expect(company.position).toEqual({ x: 0, y: 0 });
  });

  it('distributes sedes in circle with radius 350', () => {
    const locations = [mockLocation1, mockLocation2];
    const { nodes } = calculateStaticLayout(locations, [], true);
    const sedes = nodes.filter(n => n.type === 'sede');
    
    sedes.forEach(sede => {
      const distance = Math.sqrt(sede.position.x ** 2 + sede.position.y ** 2);
      expect(distance).toBeCloseTo(350, 1);
    });
  });

  it('scales permit radius based on count', () => {
    // 3 permisos → radius ~120px
    // 15 permisos → radius ~220px
  });

  it('hides permits on mobile', () => {
    const { nodes } = calculateStaticLayout([...], [...], false);
    const permits = nodes.filter(n => n.type === 'permit');
    expect(permits).toHaveLength(0);
  });
});
```

**Integration tests** (NetworkMapV3):
```typescript
describe('NetworkMapV3', () => {
  it('shows loading state initially');
  it('shows error state on data fetch failure');
  it('shows empty state when no locations');
  it('renders empresa + sedes + permits on desktop');
  it('navigates to /sedes/:id on sede click');
  it('navigates to /permisos/:id on permit click');
});
```

**Manual testing checklist:**
- [ ] Map loads with 1, 3, 5 sedes
- [ ] Drag node → snaps back on release
- [ ] Click sede → navigates to detail
- [ ] Click permit → navigates to detail
- [ ] Resize to tablet → permisos desaparecen
- [ ] Resize to mobile → mensaje "Vista disponible en desktop"
- [ ] Entrada animation plays (fade + stagger)
- [ ] Animation respects prefers-reduced-motion
- [ ] Add new sede in another tab → animates in
- [ ] Critical permiso shows pulse animation

## Migration Plan

**Phase 1: Build V3**
1. Create `NetworkMapV3.tsx` with static layout
2. Create `useStaticLayout.ts` hook
3. Create `useNodeAnimation.ts` hook
4. Write unit tests
5. Add temporary route `/mapa-red-v3` for testing

**Phase 2: Test & Polish**
1. Manual testing against checklist
2. Compare side-by-side with V2 (`/mapa-red` vs `/mapa-red-v3`)
3. Fix bugs, adjust spacing/radius if needed
4. Get user approval

**Phase 3: Deploy**
1. Update route `/mapa-red` to use V3
2. Keep V2 file for 1 sprint in case of rollback
3. Monitor for issues

**Phase 4: Cleanup**
1. Delete `NetworkMapViewV2.tsx`
2. Delete `useForceLayout.ts`
3. Remove `d3-force` from package.json
4. Update imports in `NetworkMapPage.tsx`

## Performance Considerations

**Current V2 cost:**
- d3-force runs ~60 ticks/sec while settling
- React re-renders on every tick
- Continuous animation even when idle

**V3 improvement:**
- Single position calculation (O(n) where n = node count)
- No continuous re-renders
- Animation only on mount/data change
- ~90% reduction in CPU usage after initial render

**Expected bundle size reduction:**
- Remove `d3-force`: ~50KB (minified)

## Open Questions

1. **Drag behavior final decision:** Keep snap-back or disable entirely?
   - **Resolution:** Implement snap-back first, disable if it feels off
   
2. **Animation timing:** 50ms stagger is based on Design Brief. Too fast/slow?
   - **Resolution:** Start with 50ms, adjust based on user feedback
   
3. **Permit radius formula:** `80 + count * 12` with cap at 240px. Good balance?
   - **Resolution:** Test with real data (3, 8, 15 permits), adjust if needed

4. **Company name:** Currently hardcoded "Empresa". Fetch from `companies` table?
   - **Resolution:** Add in V3, query `companies.name` by `profile.company_id`

## Success Criteria

**V3 is successful if:**
1. ✅ No continuous movement - nodes stay in place after render
2. ✅ Visual scanning improved - users can find specific sedes in < 5 seconds
3. ✅ All existing functionality works (navigation, responsive, states)
4. ✅ Entrance animation feels polished (not janky or slow)
5. ✅ Performance improved - no CPU usage when idle
6. ✅ No regressions in existing features

## Future Enhancements (Post-V3)

Not in scope for V3, but documented for future consideration:

- Edge labels: "Vence en 15 días" inline on edges
- Minimap improvements: Better contrast, sede names visible
- Filtering: Show only critical sedes, hide compliant ones
- Search: Find sede by name
- Clustering: Group sedes by region/risk level
- Export: Screenshot or PDF export
- Accessibility: Keyboard navigation between nodes

---

**End of Design Document**
