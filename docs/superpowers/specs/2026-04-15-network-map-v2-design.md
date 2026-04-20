# Network Map V2 - Especificación de Diseño

**Fecha:** 2026-04-15  
**Estado:** Aprobado  
**Versión UI:** v2

---

## Objetivo

Crear un grafo interactivo de red de sedes con datos en tiempo real de Supabase, comportamiento responsive (permisos solo en desktop), y animaciones visuales para resaltar conflictos y riesgos críticos.

---

## Problema Actual

El `NetworkMapView` existente:
- ❌ Usa `useAppStore` (store local) en lugar de datos en tiempo real de Supabase
- ❌ No refleja cambios inmediatos que el usuario crea
- ❌ Siempre muestra permisos (sobrecarga visual en mobile)
- ❌ No está alineado con el patrón de componentes V2

**Necesidad:** Grafo que refleje datos reales de Supabase, con comportamiento responsive inteligente.

---

## Arquitectura

### **Componente Principal**

```
src/features-v2/network/
└── NetworkMapViewV2.tsx    # Nueva implementación con datos de Supabase
```

### **Componentes Reutilizados (sin cambios)**

```
src/features/network/nodes/
├── CompanyNode.tsx          # Nodo HQ central (azul)
├── SedeNode.tsx            # Cards de sucursales
└── PermitNode.tsx          # Nodos de permisos (solo desktop)
```

### **Hook de física (reutilizado)**

```
src/features/network/useForceLayout.ts    # Simulación física de nodos
```

### **Dependencias**

**Hooks:**
- `useAuth()` - Obtener `companyId` del usuario
- `useLocations(companyId)` - Cargar sedes de Supabase
- `usePermits({ companyId })` - Cargar permisos de Supabase
- `useMediaQuery('(min-width: 768px)')` - Detectar desktop/mobile

**Librerías:**
- `@xyflow/react` - ReactFlow para renderizado de grafo
- `react-router-dom` - Navegación al click en sedes
- `lucide-react` - Iconos

---

## Flujo de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                        Supabase DB                           │
│  (locations table)              (permits table)             │
└──────────────┬─────────────────────────┬────────────────────┘
               │                         │
               ▼                         ▼
     useLocations(companyId)   usePermits({ companyId })
               │                         │
               └────────┬────────────────┘
                        │
                        ▼
              NetworkMapViewV2.tsx
                        │
          ┌─────────────┴──────────────┐
          │                            │
          ▼                            ▼
  Compute Nodes                 Compute Edges
  - Company (HQ)                - Company → Sedes
  - Sedes (circular)            - Sedes → Permisos (desktop)
  - Permisos (desktop)
          │                            │
          └────────────┬───────────────┘
                       │
                       ▼
                  ReactFlow
                       │
            ┌──────────┴───────────┐
            │                      │
            ▼                      ▼
     CompanyNode              SedeNode
     SedeNode                 PermitNode (desktop)
     PermitNode (desktop)
```

---

## Diseño Visual

### **Layout General**

```
Desktop (≥768px):                       Mobile (<768px):
┌─────────────────────────────────┐    ┌─────────────────────────┐
│                                 │    │                         │
│    ○ Permit    ○ Permit        │    │                         │
│      ╲           ╱              │    │                         │
│       ╲         ╱               │    │                         │
│      [Sede A]────┐              │    │      [Sede A]───┐       │
│          │       │              │    │          │      │       │
│          │   ┌───────┐          │    │          │  ┌───────┐   │
│          │   │  HQ   │          │    │          │  │  HQ   │   │
│          │   └───────┘          │    │          │  └───────┘   │
│          │       │              │    │          │      │       │
│      [Sede B]────┘              │    │      [Sede B]───┘       │
│       ╱         ╲               │    │                         │
│      ╱           ╲              │    │                         │
│    ○ Permit    ○ Permit        │    │                         │
│                                 │    │                         │
│  [Leyenda]          [MiniMap]  │    │  [Leyenda]  [MiniMap]  │
└─────────────────────────────────┘    └─────────────────────────┘
```

**Diferencias clave:**
- Desktop: Muestra HQ → Sedes → Permisos (3 niveles)
- Mobile: Solo muestra HQ → Sedes (2 niveles, más limpio)

---

## Generación de Nodos

### **1. Nodo Company (HQ Central)**

**Posición:** Centro del canvas `{ x: 0, y: 0 }`

**Datos:**
```typescript
{
  id: 'company',
  type: 'company',
  position: { x: 0, y: 0 },
  data: {
    name: company?.name || 'Empresa',
    locationCount: locations.length
  }
}
```

**Visual:** Card azul grande con ícono de edificio, nombre de empresa, y contador de sedes.

---

### **2. Nodos de Sedes (Circular)**

**Posición:** Círculo de radio 300px alrededor de HQ, distribuidos uniformemente.

**Cálculo de posición:**
```typescript
locations.map((loc, i) => {
  const angle = (2 * Math.PI * i) / locations.length - Math.PI / 2;
  const position = {
    x: Math.cos(angle) * 300,
    y: Math.sin(angle) * 300
  };
  // ...
})
```

**Datos por sede:**
```typescript
{
  id: loc.id,
  type: 'sede',
  position: { x, y },
  data: {
    name: loc.name,
    address: loc.address,
    riskLevel: loc.risk_level,      // 'critico' | 'alto' | 'medio' | 'bajo'
    compliance: calculateCompliance(locPermits),
    critical: countCritical(locPermits),
    permitCount: locPermits.length
  }
}
```

**Funciones auxiliares:**
```typescript
function calculateCompliance(permits: Permit[]): number {
  const active = permits.filter(p => p.is_active);
  if (active.length === 0) return 0;
  const vigentes = active.filter(p => p.status === 'vigente').length;
  return Math.round((vigentes / active.length) * 100);
}

function countCritical(permits: Permit[]): number {
  return permits.filter(p => 
    p.is_active && (p.status === 'vencido' || p.status === 'no_registrado')
  ).length;
}
```

---

### **3. Nodos de Permisos (Solo Desktop)**

**Condición:** `if (isDesktop)`

**Posición:** Arco pequeño alrededor de su sede (radio 180px), distribuidos en abanico.

**Cálculo de posición:**
```typescript
if (isDesktop) {
  locPermits.forEach((permit, j) => {
    const pAngle = sedeAngle + ((j - (locPermits.length - 1) / 2) * 0.4);
    const position = {
      x: sedePos.x + Math.cos(pAngle) * 180,
      y: sedePos.y + Math.sin(pAngle) * 180
    };
    // ...
  })
}
```

**Datos por permiso:**
```typescript
{
  id: permit.id,
  type: 'permit',
  position: { x, y },
  data: {
    label: PERMIT_TYPE_LABELS[permit.type],
    status: permit.status,
    issuer: permit.issuer || 'N/A'
  }
}
```

---

## Generación de Edges

### **1. Company → Sedes**

**Colores según risk_level:**
```typescript
const riskColor: Record<RiskLevel, string> = {
  critico: '#ef4444',  // Rojo
  alto: '#f97316',     // Naranja
  medio: '#eab308',    // Amarillo
  bajo: '#22c55e'      // Verde
};
```

**Edge:**
```typescript
{
  id: `company-${loc.id}`,
  source: 'company',
  target: loc.id,
  sourceHandle: dynamicHandle,  // Calculado según ángulo
  targetHandle: dynamicHandle,
  style: {
    stroke: riskColor[loc.risk_level],
    strokeWidth: 2,
    opacity: 0.35
  },
  animated: loc.risk_level === 'critico'  // ⚡ Animación para crítico
}
```

**Cálculo de handles dinámicos:**
```typescript
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

---

### **2. Sedes → Permisos (Solo Desktop)**

**Condición:** `if (isDesktop)`

**Colores según status:**
```typescript
const statusEdgeColor: Record<PermitStatus, string> = {
  vigente: '#22c55e',       // Verde
  por_vencer: '#eab308',    // Amarillo
  vencido: '#ef4444',       // Rojo
  no_registrado: '#d1d5db'  // Gris
};
```

**Edge:**
```typescript
{
  id: `${loc.id}-${permit.id}`,
  source: loc.id,
  target: permit.id,
  sourceHandle: `s-${dynamicHandle}`,
  targetHandle: dynamicHandle,
  style: {
    stroke: statusEdgeColor[permit.status],
    strokeWidth: (permit.status === 'vencido' || permit.status === 'no_registrado') ? 2.5 : 1.5,
    opacity: permit.status === 'no_registrado' ? 0.35 : 0.6
  },
  animated: permit.status === 'vencido'  // ⚡ Animación para vencido
}
```

---

## Responsive Behavior

### **Breakpoint: 768px**

```typescript
const isDesktop = useMediaQuery('(min-width: 768px)');

// Generación condicional
const permitNodes = isDesktop ? computePermitNodes() : [];
const permitEdges = isDesktop ? computePermitEdges() : [];

const allNodes = [companyNode, ...sedeNodes, ...permitNodes];
const allEdges = [...companySedeEdges, ...permitEdges];
```

**Resultado:**
- **Mobile (<768px):** Solo HQ + Sedes (grafo limpio, 2 niveles)
- **Desktop (≥768px):** HQ + Sedes + Permisos (grafo completo, 3 niveles)

---

## Estados de la Vista

### **1. Loading State**

Mostrar spinner mientras cargan datos:

```typescript
if (loadingLocations || loadingPermits) {
  return (
    <div className="h-full flex items-center justify-center bg-[#FAFBFD]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-600">Cargando mapa de red...</p>
      </div>
    </div>
  );
}
```

---

### **2. Error State**

Si falla la carga:

```typescript
if (locationsError || permitsError) {
  return (
    <div className="h-full flex items-center justify-center bg-[#FAFBFD]">
      <div className="text-center">
        <p className="text-red-500 mb-4">Error al cargar mapa de red</p>
        <p className="text-sm text-gray-500 mb-4">
          {locationsError || permitsError}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
```

---

### **3. Empty State**

Si no hay sedes:

```typescript
if (locations.length === 0) {
  return (
    <div className="h-full flex items-center justify-center bg-[#FAFBFD]">
      <div className="text-center">
        <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No hay sedes</h3>
        <p className="text-sm text-gray-500">
          Crea tu primera sede para visualizar la red
        </p>
      </div>
    </div>
  );
}
```

---

### **4. Success State**

Renderiza el grafo completo con ReactFlow.

---

## Interactividad

### **Click en Sede**

```typescript
const onNodeClick: NodeMouseHandler = useCallback(
  (_, node) => {
    if (node.type === 'sede') {
      navigate(`/sedes/${node.id}`);
    }
  },
  [navigate]
);
```

**Comportamiento:** Navega a la vista de detalle de la sede.

---

### **Drag & Drop con Física**

Usar el hook existente `useForceLayout` para simular física de nodos:

```typescript
const { fixNode, releaseNode } = useForceLayout({
  nodes: seedNodes,
  edges: seedEdges,
  onTick: (positions) => {
    setNodes(prev => prev.map(n => {
      if (n.id === draggingRef.current) return n;
      const pos = positions.get(n.id);
      return pos ? { ...n, position: pos } : n;
    }));
  }
});

const onNodeDragStart: OnNodeDrag = useCallback(
  (_, node) => {
    draggingRef.current = node.id;
    fixNode(node.id, node.position.x, node.position.y);
  },
  [fixNode]
);

const onNodeDrag: OnNodeDrag = useCallback(
  (_, node) => {
    fixNode(node.id, node.position.x, node.position.y);
  },
  [fixNode]
);

const onNodeDragStop: OnNodeDrag = useCallback(
  (_, node) => {
    draggingRef.current = null;
    releaseNode(node.id);
  },
  [releaseNode]
);
```

**Comportamiento:** Los nodos pueden arrastrarse libremente, la simulación física ajusta automáticamente las posiciones.

---

### **Zoom & Pan**

ReactFlow Controls por defecto:
- Zoom in/out con botones o scroll
- Pan con drag en canvas vacío
- Fit view para centrar todo

---

## Componentes de UI

### **Leyenda (Bottom Left)**

```typescript
<div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200/80 shadow-lg px-4 py-3 z-10">
  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
    Estado de permisos
  </p>
  <div className="flex flex-wrap gap-x-4 gap-y-1.5">
    {[
      ['#22c55e', 'Vigente'],
      ['#eab308', 'Por vencer'],
      ['#ef4444', 'Vencido'],
      ['#d1d5db', 'No registrado']
    ].map(([color, label]) => (
      <div key={label} className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-[11px] text-gray-600">{label}</span>
      </div>
    ))}
  </div>
</div>
```

**Nota:** Solo 4 estados (eliminado "En trámite").

---

### **MiniMap (Bottom Right)**

```typescript
<MiniMap
  nodeColor={(n) => {
    if (n.type === 'company') return '#3b82f6';
    if (n.type === 'sede') {
      const riskColors = {
        critico: '#ef4444',
        alto: '#f97316',
        medio: '#eab308',
        bajo: '#22c55e'
      };
      return riskColors[(n.data as SedeData).riskLevel] || '#9ca3af';
    }
    const statusColors = {
      vigente: '#22c55e',
      por_vencer: '#eab308',
      vencido: '#ef4444',
      no_registrado: '#d1d5db'
    };
    return statusColors[(n.data as PermitData).status] || '#d1d5db';
  }}
  maskColor="rgba(248,250,252,0.7)"
  className="!bg-white !border-gray-200 !rounded-xl !shadow-lg !shadow-black/5"
  pannable
  zoomable
/>
```

---

### **Background**

```typescript
<Background 
  variant={BackgroundVariant.Dots} 
  gap={24} 
  size={1} 
  color="#e2e5ea" 
/>
```

Patrón de puntos gris claro sobre fondo `#FAFBFD`.

---

## Integración con Routing

### **Actualización de NetworkMapPage.tsx**

```typescript
import { NetworkMapView } from '@/features/network/NetworkMapView';
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

**Estrategia:**
- `UI_VERSION=v2` → Usa `NetworkMapViewV2` (datos de Supabase)
- `UI_VERSION=v1` → Usa `NetworkMapView` (store local)

---

## Manejo de Datos del Schema

### **Tabla: locations**

```typescript
interface Location {
  id: string;              // UUID
  company_id: string;      // UUID
  name: string;            // Nombre de la sede
  address: string;         // Dirección completa
  status: string;          // "operando" | "inactivo" | "construccion"
  risk_level: 'critico' | 'alto' | 'medio' | 'bajo';
  created_at: string;
  updated_at: string;
}
```

---

### **Tabla: permits**

```typescript
interface Permit {
  id: string;              // UUID
  company_id: string;      // UUID
  location_id: string;     // UUID - relación con location
  type: string;            // Tipo de permiso
  status: 'vigente' | 'por_vencer' | 'vencido' | 'no_registrado';
  issue_date: string | null;
  expiry_date: string | null;
  is_active: boolean;      // Solo contar permisos activos
  issuer: string | null;
}
```

**Nota:** Eliminado estado `'en_tramite'` del enum.

---

## Performance & Optimización

### **useMemo para cálculos pesados**

```typescript
const { seedNodes, seedEdges } = useMemo(() => {
  // Generar nodos y edges
  return { seedNodes: nodes, seedEdges: edges };
}, [company, locations, permits, isDesktop]);
```

Evita re-calcular nodos/edges en cada render.

---

### **useCallback para handlers**

```typescript
const onNodeClick = useCallback((_, node) => { ... }, [navigate]);
const onNodeDragStart = useCallback((_, node) => { ... }, [fixNode]);
const onNodeDrag = useCallback((_, node) => { ... }, [fixNode]);
const onNodeDragStop = useCallback((_, node) => { ... }, [releaseNode]);
```

---

### **Refs para estado de drag**

```typescript
const draggingRef = useRef<string | null>(null);
```

Evita re-renders al arrastrar nodos.

---

## Accesibilidad

### **Nodos clickeables**

```typescript
// SedeNode ya tiene:
cursor-pointer hover:scale-[1.03] transition-transform
```

Indicador visual de que es clickeable.

---

### **Navegación con teclado**

ReactFlow soporta navegación con teclado por defecto:
- Flechas: mover canvas
- +/- : zoom in/out
- Enter: seleccionar nodo

---

## Diferencias con V1

| Aspecto | V1 (NetworkMapView) | V2 (NetworkMapViewV2) |
|---------|---------------------|----------------------|
| Fuente de datos | useAppStore (local) | useLocations, usePermits (Supabase) |
| Tiempo real | ❌ No | ✅ Sí |
| Responsive | Siempre muestra permisos | Desktop: permisos, Mobile: solo sedes |
| Estados | Sin loading/error/empty | ✅ Loading, error, empty states |
| Patrón | V1 legacy | V2 con hooks |
| Integración | Directo | Conditional via UI_VERSION |

---

## Criterios de Éxito

### **Funcional**

- ✅ Carga datos de Supabase en tiempo real
- ✅ Muestra HQ + Sedes siempre
- ✅ Muestra Permisos solo en desktop (≥768px)
- ✅ Animación de líneas rojas para `risk_level=critico` y `status=vencido`
- ✅ Click en sede navega a detalle
- ✅ Drag & drop funciona con física de nodos
- ✅ Loading, error, empty states funcionan

### **Visual**

- ✅ Colores correctos según risk_level y status
- ✅ Leyenda con 4 estados (sin "En trámite")
- ✅ MiniMap con colores por tipo de nodo
- ✅ Background de puntos sobre fondo claro
- ✅ Animaciones suaves y profesionales

### **Performance**

- ✅ useMemo para cálculos pesados
- ✅ useCallback para handlers
- ✅ No re-renders innecesarios al arrastrar

---

## Siguientes Pasos

Después de implementar este componente:

1. **Testing manual:**
   - Verificar en mobile y desktop
   - Probar con diferentes cantidades de sedes/permisos
   - Validar animaciones de líneas rojas

2. **Integrar en otras vistas V2:**
   - Considerar embedding en Dashboard V2
   - Widget pequeño en LocationDetailView V2

3. **Optimizaciones futuras:**
   - Clustering para muchas sedes (>20)
   - Filtros por risk_level
   - Búsqueda de sedes en el grafo

---

## Referencias

- ReactFlow docs: https://reactflow.dev/
- Código existente: `src/features/network/NetworkMapView.tsx`
- Nodos: `src/features/network/nodes/`
- Hooks: `src/hooks/useLocations.ts`, `src/hooks/usePermits.ts`
