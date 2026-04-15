# Network Map V2 - Manual Testing Checklist

**Status:** Ready for Manual Testing  
**Date:** 2026-04-15  
**Implementation:** Complete (Tasks 1-8)  
**Branch:** feature/ui-v2  

---

## Prerequisites

1. ✅ Dev server running: `npm run dev`
2. ✅ UI_VERSION set to 'v2' in `src/config.ts`
3. ✅ All code compiled without errors

---

## Testing Steps

### Step 1: Server Verification
- [ ] Open `http://localhost:5173`
- [ ] Verify server responds

### Step 2: UI Version Check
- [ ] Confirm `src/config.ts` has `UI_VERSION = 'v2'`
- [ ] Check console for version logs (if any)

### Step 3: Navigate to Network Map
- [ ] Open `http://localhost:5173/mapa-red`
- [ ] Verify NetworkMapViewV2 loads (not V1)
- [ ] Check for any console errors

### Step 4: Loading State
- [ ] Refresh page and observe initial render
- [ ] Verify spinner appears with "Cargando mapa de red..."

### Step 5: Desktop View (≥768px)
- [ ] Company (HQ) node visible at center (blue)
- [ ] Location nodes in circle around HQ
- [ ] Permit nodes in arcs around locations
- [ ] All edges connecting Company→Sedes→Permits

**Edge Verification:**
- [ ] Company→Sede edges colored by risk_level
  - Red (#ef4444) for crítico
  - Orange (#f97316) for alto
  - Yellow (#eab308) for medio
  - Green (#22c55e) for bajo
- [ ] Critical risk edges are animated (red flowing lines)
- [ ] Sede→Permit edges colored by status
  - Green for vigente
  - Yellow for por_vencer
  - Red for vencido
  - Gray for no_registrado
- [ ] Expired permit edges are animated (red flowing lines)

### Step 6: Mobile View (<768px)
- [ ] Resize browser to mobile width or use dev tools
- [ ] Company (HQ) node still visible at center
- [ ] Location nodes still in circle
- [ ] **Permit nodes NOT visible** (responsive hide)
- [ ] **Sede→Permit edges NOT visible**
- [ ] Only Company→Sede edges present

### Step 7: Interactive Features

**Click Navigation:**
- [ ] Click any location (sede) node
- [ ] Verify navigation to `/sedes/{id}` detail page

**Drag & Drop:**
- [ ] Drag a location node to new position
- [ ] Node moves with mouse
- [ ] Physics simulation adjusts other nodes
- [ ] Edges update dynamically

**Zoom & Pan:**
- [ ] Use mouse wheel to zoom in/out
- [ ] Pan around canvas with mouse drag
- [ ] Use Controls buttons (zoom in, zoom out, fit view)
- [ ] Verify fit view centers and scales graph properly

### Step 8: UI Components

**Legend (Bottom Left):**
- [ ] Legend box visible
- [ ] Shows 4 status indicators:
  - 🟢 Vigente (green)
  - 🟡 Por vencer (yellow)
  - 🔴 Vencido (red)
  - ⚪ No registrado (gray)
- [ ] NO 'en_tramite' status present

**MiniMap (Bottom Right):**
- [ ] MiniMap visible
- [ ] Shows all nodes with correct colors:
  - Company nodes: blue
  - Sede nodes: colored by risk_level
  - Permit nodes: colored by status
- [ ] MiniMap is pannable (can drag viewport)
- [ ] MiniMap is zoomable

**Background:**
- [ ] Dots pattern visible
- [ ] Light gray (#e2e5ea) color

### Step 9: Edge Cases

**Empty State:**
- [ ] If testing with no locations: verify Building2 icon appears
- [ ] Message: "No hay sedes"
- [ ] Subtext: "Crea tu primera sede para visualizar la red"

**Error State:**
- [ ] (Simulate by breaking network): verify error message
- [ ] Shows "Error al cargar mapa de red"
- [ ] Retry button present and functional

### Step 10: Performance

- [ ] Initial load time < 2 seconds
- [ ] Smooth animations (no jank)
- [ ] Drag interactions feel responsive
- [ ] Zoom/pan operations smooth

---

## Known Issues to Watch For

1. **State Synchronization:**
   - When resizing from desktop→mobile→desktop, verify permits appear/disappear correctly
   - No stale nodes should remain visible

2. **Physics Simulation:**
   - Dragged nodes should stop at cursor position
   - Released nodes should settle smoothly
   - Other nodes should repel appropriately

3. **Edge Routing:**
   - Edges should connect to appropriate handles (top/bottom/left/right)
   - No overlapping edges on same connection
   - Handles should face correct direction

4. **Data Loading:**
   - Verify real Supabase data loads (not mock data)
   - Check that company name displays correctly (not hardcoded 'Empresa')
   - Permit counts match actual database records

---

## Completion Criteria

- [ ] All 10 testing steps completed
- [ ] Zero console errors
- [ ] Zero visual glitches
- [ ] Desktop view shows all nodes correctly
- [ ] Mobile view shows only HQ + locations
- [ ] Animations work on critical/expired edges
- [ ] Navigation works on click
- [ ] Drag & drop works smoothly
- [ ] All UI components visible and functional

---

## Report Issues Found

**Format:**
```
Issue #N: [Brief Description]
- Location: [Component/Feature]
- Steps to Reproduce: [1, 2, 3...]
- Expected: [What should happen]
- Actual: [What actually happens]
- Severity: [Critical/Important/Minor]
```

---

## Sign-off

**Tested By:** _______________  
**Date:** _______________  
**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________

---

## Next Steps After Testing

1. If PASS: Mark Task 9 complete, proceed to code review
2. If FAIL: Document all issues, prioritize fixes, re-test after corrections
3. Final review: Run through spec self-review checklist in plan
