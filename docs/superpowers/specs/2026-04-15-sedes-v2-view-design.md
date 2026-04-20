# Vista de Sedes V2 - Especificación de Diseño

**Fecha:** 2026-04-15  
**Estado:** Aprobado  
**Versión UI:** v2

---

## Objetivo

Crear una vista limpia y moderna de listado de sedes sin mapa embebido, usando el sistema de diseño V2 (shadcn/ui) para reemplazar la vista V1 actual cuando `UI_VERSION=v2`.

---

## Problema Actual

La vista actual de sedes (`LocationListView`) tiene:
- ❌ Mapa de red embebido que ocupa espacio
- ❌ Diseño V1 que no coincide con el nuevo sistema de diseño
- ❌ Layout complejo con toggle de mapa
- ❌ Se solapa con el sidebar V2

**Necesidad:** Vista limpia, moderna, enfocada solo en tarjetas de sedes con información esencial.

---

## Arquitectura

### **Componentes Nuevos**

```
src/features-v2/locations/
├── LocationsListViewV2.tsx    # Vista principal con grid de tarjetas
└── LocationCardV2.tsx         # Tarjeta individual de sede
```

### **Dependencias**

**Hooks:**
- `useAuth()` - Obtener `companyId` del usuario autenticado
- `useLocations(companyId)` - Cargar sedes de la empresa
- `usePermits({ companyId })` - Cargar permisos de la empresa
- `useNavigate()` - Navegación a detalle de sede

**UI Components (shadcn/ui):**
- `Card`, `CardHeader`, `CardContent` - Estructura de tarjeta
- `Badge` - Chips de Estado y Nivel de Riesgo

**Icons (lucide-react):**
- `Building2` - Ícono de sede
- `Plus` - Botón crear sede

---

## Diseño Visual

### **Vista Principal: LocationsListViewV2**

```
┌─────────────────────────────────────────────────────────┐
│  Sedes                            [+ Crear Sede] (btn)  │
│  Gestión de sedes y ubicaciones de tu empresa           │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │ Sede Card 1  │  │ Sede Card 2  │                    │
│  │              │  │              │                    │
│  └──────────────┘  └──────────────┘                    │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │ Sede Card 3  │  │ Sede Card 4  │                    │
│  │              │  │              │                    │
│  └──────────────┘  └──────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

**Layout:**
- Padding: `p-8` (32px)
- Max width: `max-w-7xl mx-auto`
- Grid: `grid-cols-1 md:grid-cols-2 gap-6`
- Background: `bg-background` (blanco/gris muy claro)

**Header:**
- Título: `text-3xl font-bold` - "Sedes"
- Descripción: `text-text-secondary text-sm mt-1` - "Gestión de sedes y ubicaciones de tu empresa"
- Botón: `bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800` - "+ Crear Sede"
- Layout: `flex items-start justify-between`

---

### **Tarjeta: LocationCardV2**

**Estructura visual exacta:**

```
┌─────────────────────────────────────────┐
│ 🏢 Supermaxi Mall del Sol               │ ← Nombre (text-lg font-semibold)
│    SEDE-HQ08K6P5-ACD                    │ ← Código (text-xs text-gray-500)
│                                         │
│ Dirección              Ciudad           │ ← Labels (text-xs font-medium text-gray-500)
│ Av. Principal 123      Quito            │ ← Valores (text-sm)
├─────────────────────────────────────────┤ ← Divider (border-t border-gray-100)
│ Estado                                  │ ← Label (text-xs font-medium text-gray-500)
│ [Operando]                              │ ← Badge
│                                         │
│ Nivel de Riesgo                         │ ← Label (text-xs font-medium text-gray-500)
│ [Crítica]                               │ ← Badge
│                                         │
│ Permisos                           4/9  │ ← Label + Contador (text-xs / font-mono)
│ ●●●●○○○○○                              │ ← Dots (w-2 h-2 rounded-full)
└─────────────────────────────────────────┘
```

**Elementos por sección:**

**1. Header (ícono + nombre + código):**
- Ícono: `Building2` size 20, `text-gray-500`
- Nombre: `text-lg font-semibold text-gray-900`
- Código: `text-xs text-gray-500 mt-0.5` - formato `SEDE-{8chars}-{3chars}`
- Layout: `flex items-start gap-3`

**2. Dirección + Ciudad (2 columnas):**
- Container: `grid grid-cols-2 gap-4 mt-4`
- Labels: `text-xs font-medium text-gray-500 mb-1` - "Dirección" / "Ciudad"
- Valores: `text-sm text-gray-900`

**3. Divider:**
- Clase: `border-t border-gray-100 my-4`

**4. Estado:**
- Label: `text-xs font-medium text-gray-500 mb-2` - "Estado"
- Badge: shadcn `Badge` component
  - "Operando" → `variant="default"` (verde)
  - "Inactivo" → `variant="secondary"` (gris)
  - "En construcción" → `variant="outline"` (borde)

**5. Nivel de Riesgo:**
- Label: `text-xs font-medium text-gray-500 mb-2 mt-3` - "Nivel de Riesgo"
- Badge: shadcn `Badge` component con variantes custom
  - "Crítica" → `variant="destructive"` (rojo)
  - "Alta" → `className="bg-orange-500 text-white"` (naranja)
  - "Media" → `className="bg-amber-500 text-white"` (amarillo)
  - "Baja" → `variant="default"` (verde)

**6. Permisos + Dots:**
- Container: `mt-3`
- Label + Contador: `flex items-center justify-between text-xs`
  - Label: `font-medium text-gray-500` - "Permisos"
  - Contador: `font-mono text-gray-900` - "4/9"
- Dots: `flex items-center gap-1 mt-2`
  - Tamaño: `w-2 h-2 rounded-full`
  - Colores por estado:
    - vigente: `bg-emerald-400`
    - por_vencer: `bg-amber-400`
    - vencido: `bg-red-400`
    - no_registrado: `bg-gray-300`
    - en_tramite: `bg-blue-400`

**Interactividad:**
- Cursor: `cursor-pointer`
- Hover: `hover:shadow-lg transition-shadow duration-200`
- Click: Navega a `/sedes/${location.id}`

---

## Lógica de Datos

### **Carga de Datos**

```typescript
const { companyId } = useAuth();
const { locations, loading: loadingLocations, error: locationsError } = useLocations(companyId);
const { permits, loading: loadingPermits, error: permitsError } = usePermits({ companyId });
```

### **Filtrado de Permisos por Sede**

Para cada sede, filtrar permisos:

```typescript
const locationPermits = permits.filter(
  p => p.location_id === location.id && p.is_active
);
```

### **Agrupación por Estado**

```typescript
const permitsByStatus = {
  vigente: locationPermits.filter(p => p.status === 'vigente'),
  por_vencer: locationPermits.filter(p => p.status === 'por_vencer'),
  vencido: locationPermits.filter(p => p.status === 'vencido'),
  no_registrado: locationPermits.filter(p => p.status === 'no_registrado'),
  en_tramite: locationPermits.filter(p => p.status === 'en_tramite'),
};
```

### **Generación de Dots**

```typescript
// Orden de renderizado: vigente, por_vencer, vencido, en_tramite, no_registrado
const permitsOrdered = [
  ...permitsByStatus.vigente,
  ...permitsByStatus.por_vencer,
  ...permitsByStatus.vencido,
  ...permitsByStatus.en_tramite,
  ...permitsByStatus.no_registrado,
];

// Mapear a dots visuales
permitsOrdered.map(permit => (
  <div className={`w-2 h-2 rounded-full ${getPermitColor(permit.status)}`} />
));
```

### **Contador de Permisos**

```typescript
const vigentesCount = permitsByStatus.vigente.length;
const totalCount = locationPermits.length;
const displayText = `${vigentesCount}/${totalCount}`;
```

---

## Estados de la Vista

### **1. Loading State**

Mostrar skeletons mientras carga:

```typescript
if (loadingLocations || loadingPermits) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[1, 2, 3, 4].map(i => (
        <Card key={i}>
          <CardContent className="p-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

### **2. Empty State**

Si no hay sedes:

```typescript
if (locations.length === 0) {
  return (
    <div className="text-center py-12">
      <Building2 className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-4 text-lg font-semibold">No hay sedes</h3>
      <p className="mt-2 text-sm text-gray-500">
        Comienza creando tu primera sede
      </p>
      <button className="mt-6 bg-black text-white px-4 py-2 rounded-lg">
        + Crear Primera Sede
      </button>
    </div>
  );
}
```

### **3. Error State**

Si falla la carga:

```typescript
if (locationsError || permitsError) {
  return (
    <div className="text-center py-12">
      <p className="text-red-500 mb-4">Error al cargar sedes</p>
      <button 
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-gray-900 text-white rounded-lg"
      >
        Reintentar
      </button>
    </div>
  );
}
```

---

## Integración con Routing

### **Actualización de App.tsx**

```typescript
import { LocationsListViewV2 } from '@/features-v2/locations/LocationsListViewV2';

// En las rutas:
<Route 
  path="/sedes" 
  element={UI_VERSION === 'v2' ? <LocationsListViewV2 /> : <LocationListView />} 
/>
```

**Estrategia:**
- `UI_VERSION=v2` → Usa `LocationsListViewV2` (nueva vista limpia)
- `UI_VERSION=v1` → Usa `LocationListView` (vista vieja con mapa)

Esto permite:
- ✅ Migración gradual
- ✅ Rollback fácil si hay problemas
- ✅ No afecta usuarios de V1

---

## Mapeo de Datos del Schema

### **Tabla: locations**

```typescript
interface Location {
  id: string;              // UUID
  company_id: string;      // UUID
  name: string;            // Nombre de la sede
  address: string;         // Dirección completa
  status: string;          // "operando" | "inactivo" | "construccion"
  risk_level: string;      // "critico" | "alto" | "medio" | "bajo"
  created_at: string;      // ISO timestamp
  updated_at: string;      // ISO timestamp
}
```

**Nota:** El código de sede (`SEDE-HQ08K6P5-ACD`) se genera a partir del `id`:
```typescript
const locationCode = `SEDE-${id.substring(0, 8).toUpperCase()}-${id.substring(24, 27).toUpperCase()}`;
```

**Ciudad:** Se extrae del campo `address` (último segmento después de última coma):
```typescript
const city = address.split(',').pop()?.trim() || 'Sin ciudad';
```

### **Tabla: permits**

```typescript
interface Permit {
  id: string;              // UUID
  company_id: string;      // UUID
  location_id: string;     // UUID - relación con location
  type: string;            // Tipo de permiso
  status: 'vigente' | 'por_vencer' | 'vencido' | 'en_tramite' | 'no_registrado';
  issue_date: string | null;
  expiry_date: string | null;
  is_active: boolean;      // Solo contar permisos activos
}
```

---

## Responsive Design

### **Breakpoints**

- **Mobile** (`< 768px`): 1 columna
  ```css
  grid-cols-1
  ```

- **Desktop** (`≥ 768px`): 2 columnas
  ```css
  md:grid-cols-2
  ```

### **Padding en Mobile**

- Desktop: `p-8` (32px)
- Mobile: `p-4` (16px) para aprovechar espacio

```typescript
<div className="min-h-screen bg-background p-4 md:p-8">
```

---

## Comportamiento de Navegación

### **Click en Tarjeta**

```typescript
onClick={() => navigate(`/sedes/${location.id}`)}
```

- Navega a `LocationDetailView` (V2 si existe, V1 si no)
- Toda la tarjeta es clickeable
- Cursor pointer en hover

### **Botón "Crear Sede"**

- **Funcionalidad:** Por definir (fuera del alcance de este spec)
- **Por ahora:** Placeholder que muestra mensaje "Próximamente"
- **Futuro:** Abrir modal o navegar a `/sedes/nueva`

---

## Accesibilidad

### **Tarjetas**

- `role="button"` para indicar que es clickeable
- `tabIndex={0}` para navegación con teclado
- `onKeyDown` para activar con Enter/Space

```typescript
<Card
  role="button"
  tabIndex={0}
  onClick={() => navigate(`/sedes/${location.id}`)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(`/sedes/${location.id}`);
    }
  }}
>
```

### **Dots de Permisos**

- Agregar `title` attribute con descripción:
  ```typescript
  <div 
    className="w-2 h-2 rounded-full bg-emerald-400"
    title="Permiso Vigente: Patente Municipal"
  />
  ```

### **Badges**

- Usar colores con suficiente contraste (WCAG AA)
- Texto legible sobre fondo coloreado

---

## Limitaciones y Consideraciones

### **Fuera del Alcance**

- ❌ Funcionalidad de "Crear Sede" (se implementará después)
- ❌ Filtros o búsqueda de sedes (no solicitado)
- ❌ Ordenamiento de sedes (se mantiene orden de DB)
- ❌ Paginación (no necesario para <100 sedes)

### **Manejo de Edge Cases**

**Sede sin permisos:**
- Mostrar "0/0" como contador
- No mostrar dots (array vacío)

**Sede sin dirección:**
- Mostrar "Sin dirección" en campo Dirección
- Mostrar "Sin ciudad" en campo Ciudad

**Campo status no reconocido:**
- Default: Badge con `variant="secondary"` y texto original

**Campo risk_level no reconocido:**
- Default: Badge con `variant="secondary"` y texto "Desconocido"

---

## Diferencias con V1

| Aspecto | V1 (LocationListView) | V2 (LocationsListViewV2) |
|---------|----------------------|-------------------------|
| Mapa embebido | ✅ Sí (con toggle) | ❌ No (ver en /mapa-red) |
| Diseño de tarjetas | Más detalladas (tareas, renovaciones) | Más limpias (solo permisos) |
| Sistema UI | Custom Tailwind | shadcn/ui components |
| Grid | 2 columnas fijas | Responsive (1 → 2 cols) |
| Sidebar | V1 (AppShell) | V2 (AppLayout) |
| Dots de permisos | ✅ Sí (inline) | ✅ Sí (inline) |
| Metadata extra | Tareas pendientes, próxima renovación | Solo permisos |

---

## Criterios de Éxito

### **Funcional**

- ✅ Vista carga correctamente en `/sedes` cuando `UI_VERSION=v2`
- ✅ Muestra todas las sedes de la empresa
- ✅ Cada tarjeta muestra información correcta de la sede
- ✅ Dots de permisos reflejan estados correctos
- ✅ Click en tarjeta navega a detalle de sede
- ✅ Loading states y empty states funcionan
- ✅ Responsive en mobile y desktop

### **Visual**

- ✅ Diseño coincide exactamente con mockup aprobado
- ✅ Spacing y tipografía consistentes con V2
- ✅ Colores de badges y dots correctos
- ✅ Hover effects suaves y profesionales

### **Rendimiento**

- ✅ Carga en < 1 segundo con ≤50 sedes
- ✅ Sin re-renders innecesarios
- ✅ Imágenes/assets optimizados (no hay en este caso)

---

## Siguientes Pasos

Después de implementar esta vista:

1. **Implementar otras vistas V2:**
   - Permisos
   - Renovaciones
   - Tareas
   - Marco Legal

2. **Agregar funcionalidad "Crear Sede":**
   - Modal o página de creación
   - Formulario con validación
   - Integración con API

3. **Eliminar V1:**
   - Una vez todas las vistas migren a V2
   - Limpiar archivos legacy
   - Remover flag `UI_VERSION`

---

## Referencias

- Sistema de diseño: `src/components/ui-v2/`
- Hooks: `src/hooks/useLocations.ts`, `src/hooks/usePermits.ts`
- Vista V1: `src/features/locations/LocationListView.tsx`
- Dashboard V2 (referencia): `src/features-v2/dashboard/`
