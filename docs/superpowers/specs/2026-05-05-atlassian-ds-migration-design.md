# Atlassian Design System Migration + Structural Improvements - Design Spec

**Fecha:** 2026-05-05
**Estado:** Approved - Ready for Implementation Plan
**Branch:** `feature/atlassian-ds-migration`

## Contexto

El proyecto EnRegla actualmente usa un sistema de tokens propio con azul `#1E3A8A` y componentes basados en shadcn/ui. Después de explorar el Banco Pichincha como inspiración, decidimos migrar a un sistema inspirado en Atlassian Design System con colores `#0f265c` (blue) y `#ff7043` (orange).

El showcase aprobado está en `design-system-complete.html` con todos los componentes, tokens y templates incluyendo el mapa interactivo con React Flow.

## Objetivo

Migrar completamente el proyecto a Atlassian Design System + ejecutar mejoras estructurales identificadas, con 5 iteraciones recursivas de pulido donde el output de cada iteración es el input de la siguiente.

## Arquitectura

### Estrategia de Migración: Big Bang (Foundation First)

**Decisión**: Reemplazar completamente el sistema de tokens actual, no híbrido.

**Razones:**
- Evita inconsistencias visuales durante transición
- No mantiene dos sistemas simultáneos
- Las 5 iteraciones empiezan con base sólida
- Menos confusión cognitiva para desarrolladores

### Organización de Trabajo

```
Iteración 1 (Full Implementation)
├── Phase 0: Foundation (Partes 1-3) → SECUENCIAL
│   └── Tokens + UI Components + Dependencies
├── Phase 1: Core Features (Partes 4-13) → PARALELO
│   └── 10 vistas core con DS + cambios estructurales
└── Phase 2: Secondary (Partes 14-17) → PARALELO
    └── 4 vistas secundarias con DS aplicado

Iteraciones 2-5 (Recursive Polish)
└── Review TODO → Identificar 20% débil → Re-hacer → Repeat
```

### Principios de División

- Cada parte = 1 archivo + checklist de microtareas atómicas
- Cada microtarea ejecutable por 1 subagent independiente
- Dependencias explícitas (Phase 0 bloquea Phase 1)
- Dentro de Phase 1 y 2, todas las partes son independientes
- Cada parte tiene criterios de aceptación claros (checklist + screenshot)

## Sistema de Tokens

### Escalas de Color (50-900)

**Primary Blue** (Base: `#0f265c`)
```css
--ds-blue-50: #e8ebf3;
--ds-blue-100: #d1d7e7;
--ds-blue-200: #a3afcf;
--ds-blue-300: #7587b7;
--ds-blue-400: #475f9f;
--ds-blue-500: #0f265c;  /* Primary */
--ds-blue-600: #0d2153;  /* Hover */
--ds-blue-700: #0b1c4a;  /* Pressed */
--ds-blue-800: #091741;
--ds-blue-900: #071238;
```

**Accent Orange** (Base: `#ff7043`)
```css
--ds-orange-50: #fff4f0;
--ds-orange-100: #ffe8e0;
--ds-orange-200: #ffd1c1;
--ds-orange-300: #ffb99d;
--ds-orange-400: #ff9670;
--ds-orange-500: #ff7043;  /* Accent */
--ds-orange-600: #ff5722;
--ds-orange-700: #f44336;
--ds-orange-800: #e53935;
--ds-orange-900: #d32f2f;
```

**Semantic Colors**
- Success Green: `#36B37E` (scale 50-900)
- Error Red: `#DE350B` (scale 50-900)
- Warning Yellow: `#FFAB00` (scale 50-900)
- Neutral Grays: `#FFFFFF` to `#091E42` (scale 0-900)

### Tipografía

Font family: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto'` (system fonts)

Escala:
- `--ds-font-size-050`: 11px (tiny)
- `--ds-font-size-075`: 12px (small)
- `--ds-font-size-100`: 14px (body - default)
- `--ds-font-size-200`: 16px (body large)
- `--ds-font-size-300`: 20px (h4)
- `--ds-font-size-400`: 24px (h3)
- `--ds-font-size-500`: 29px (h2)
- `--ds-font-size-600`: 35px (h1)

### Espaciado (4px base)

- `--ds-space-025`: 2px
- `--ds-space-050`: 4px
- `--ds-space-075`: 6px
- `--ds-space-100`: 8px
- `--ds-space-150`: 12px
- `--ds-space-200`: 16px
- `--ds-space-250`: 20px
- `--ds-space-300`: 24px
- `--ds-space-400`: 32px
- `--ds-space-500`: 40px
- `--ds-space-600`: 48px

### Elevación (Sombras)

- `--ds-shadow-raised`: Cards, Buttons
- `--ds-shadow-overflow`: Dropdowns, Popovers
- `--ds-shadow-overlay`: Modals, Dialogs

### Border Radius

- `--ds-radius-050`: 2px
- `--ds-radius-100`: 3px (buttons, small elements)
- `--ds-radius-200`: 6px (cards)
- `--ds-radius-300`: 8px
- `--ds-radius-400`: 12px
- `--ds-radius-round`: 50%

## Phase 0: Foundation (Partes 1-3)

### Parte 1: Design Tokens Migration

**Archivos:**
- Crear: `src/styles/atlassian-tokens.css`
- Deprecar: `src/styles/design-tokens.css` → mover a `.deprecated/`
- Modificar: `src/index.css` o `App.tsx` (imports)

**Checklist:**
- [ ] Crear atlassian-tokens.css con todas las escalas (blue, orange, green, red, neutral)
- [ ] Incluir tokens semánticos (primary, accent, success, danger, warning)
- [ ] Incluir tokens de tipografía, spacing, shadows, radius, easing
- [ ] Mapeo de compatibilidad: tokens viejos → nuevos (para no romper imports existentes temporalmente)
- [ ] Actualizar import en aplicación
- [ ] Verificar que app compila sin errores
- [ ] Commit: "feat(tokens): migrate to Atlassian Design System tokens"

**Criterios de Aceptación:**
- App compila sin errores
- Tokens disponibles globalmente
- Sistema viejo deprecado pero no elimina aún (safety net)

### Parte 2: UI Components Base

**Componentes a migrar (10 total, paralelizables):**

1. **Button.tsx**
   - Variantes: primary, default, subtle, link, warning, danger
   - Tamaños: sm, default, lg
   - Estados: loading (con Loader2), disabled
   - API: `<Button variant="primary" size="default" loading={false}>`

2. **Badge.tsx** (Lozenge)
   - Variantes: default, success, removed, inprogress, new, moved
   - Prop `dot`: muestra indicador circular
   - Tamaños: sm, default, lg
   - Custom: risk-critico, risk-alto, risk-medio, risk-bajo

3. **Card.tsx**
   - Variante `interactive`: hover lift + cursor pointer
   - Focus-visible styles
   - Shadows con tokens

4. **Avatar.tsx**
   - Tamaños: sm (24px), default (32px), large (48px)
   - Colores dinámicos por inicial

5. **Progress.tsx**
   - Variantes: default, success, warning, danger
   - Height: 6px fijo
   - Border-radius: 3px

6. **Input.tsx** (TextField)
   - Estados: normal, hover, focus, error, disabled
   - Label integrado opcional
   - Icon slot (left/right)

7. **Select.tsx**
   - Dropdown con tokens de shadow
   - Search opcional
   - Multi-select opcional

8. **Textarea.tsx**
   - Mínimo 100px altura
   - Resize vertical
   - Character counter opcional

9. **Checkbox.tsx** + **Radio.tsx**
   - Tokens de color para estados checked/unchecked
   - Label clickable
   - Grupo (RadioGroup)

10. **Table.tsx**
    - Header sticky
    - Hover states en filas
    - Sorting indicators
    - Responsive overflow

**Checklist por componente:**
- [ ] Usa tokens Atlassian exclusivamente (cero hardcoded colors)
- [ ] Integra Lucide icons donde aplique
- [ ] Mantiene API compatible con uso existente (si es posible)
- [ ] Focus-visible para accesibilidad
- [ ] Transitions con tokens de easing
- [ ] Responsive (mobile-first)

**Commits:**
- Un commit por cada 2-3 componentes migrados
- Mensaje: "feat(ui): migrate {Button,Badge,Card} to Atlassian DS"

### Parte 3: Dependencies & Icons Setup

**Archivos:**
- Modificar: `package.json`
- Crear: `src/lib/lucide-icons.ts`
- Modificar: varios imports existentes

**Checklist:**
- [ ] Instalar `lucide-react` (`npm install lucide-react`)
- [ ] Instalar/verificar `reactflow` v11 (`npm install reactflow@^11.11.0`)
- [ ] Instalar `@tanstack/react-table` v8 (`npm install @tanstack/react-table@^8.20.0`)
- [ ] Crear `lucide-icons.ts` con exports centralizados
- [ ] Documentar iconos disponibles
- [ ] Commit: "chore(deps): add Lucide, React Flow, TanStack Table"

**Iconos principales a exportar:**
```typescript
export {
  Building2,      // Sede
  Landmark,       // Empresa
  Plus,           // Create
  Download,       // Export
  Upload,         // Import
  Trash2,         // Delete
  Edit,           // Edit
  Eye,            // View
  AlertTriangle,  // Warning
  CheckCircle,    // Success
  XCircle,        // Error
  Info,           // Information
  Search,         // Search
  Filter,         // Filter
  ChevronRight,   // Navigate
  ChevronDown,    // Expand
  Calendar,       // Date
  Clock,          // Time
  FileText,       // Document
  Users,          // People
  Settings,       // Settings
  LogOut,         // Logout
  Menu,           // Menu
  X,              // Close
  Loader2,        // Loading
} from 'lucide-react'
```

## Phase 1: Core Features (Partes 4-13)

### Parte 4: Dashboard Refactor

**Archivos:**
- Modificar: `src/features/dashboard/DashboardView.tsx`
- Eliminar: `src/features/dashboard/RiskOverviewCard.tsx`
- Eliminar: `src/features/dashboard/MetricsGrid.tsx`
- Crear: `src/features/dashboard/DashboardWidget.tsx`
- Crear: `src/features/dashboard/DashboardMap.tsx`

**Estructura del Dashboard:**

```
┌─────────────────────────────────────────┐
│ Dashboard Widget                        │
│ ┌─────────────────────────────────┐   │
│ │ Métricas (Grid 2x2)             │   │
│ │ • Total Sedes: 8                │   │
│ │ • Vigentes: 45 (green)          │   │
│ │ • Por Vencer: 8 (orange)        │   │
│ │ • Vencidos: 3 (red)             │   │
│ └─────────────────────────────────┘   │
│                                         │
│ ┌─────────────────────────────────┐   │
│ │ Mapa de Red Interactivo         │   │
│ │ (React Flow - 500px height)    │   │
│ │                                 │   │
│ │  [Empresa Centro]               │   │
│ │   ├─ Sede 1 (green)            │   │
│ │   ├─ Sede 2 (orange pulse)    │   │
│ │   ├─ Sede 3 (red dotted)       │   │
│ │   └─ Sede 4 (green)             │   │
│ └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Custom Nodes (React Flow):**
- `EmpresaNode`: Blue primary background, white text, Landmark icon
- `SedeNode`: White background, 2px border color según estado, Building2 icon + info (nombre, código, permisos, progress bar)

**Custom Edges:**
- `CustomEdge`: Bezier path con colores según estado
  - Success: Verde sólida `#36B37E`
  - Warning: Gris base `#B3B9C4` + pulsos naranjas `#ff7043` con `stroke-dasharray: 25 75` y animación `pathPulse`
  - Danger: Roja dotted `#DE350B` con animación `dash-red`

**Checklist:**
- [ ] Hook `useDashboardData`: Retorna métricas y datos para el map
- [ ] DashboardWidget: Card unificada con métricas
- [ ] DashboardMap: React Flow con nodos y edges custom
- [ ] Positions calculadas para equidistancia (empresa centro, sedes equidistantes)
- [ ] Handles inteligentes (conexión por lado más cercano)
- [ ] Loading state con SkeletonCard
- [ ] Empty state: "Sin datos" con CTA "Crear Primera Sede"
- [ ] Responsive: map altura reduce en mobile, métricas 1-col
- [ ] Commit: "feat(dashboard): unified widget with React Flow network map"

**Criterios de Aceptación:**
- Sin duplicación de métricas
- Map visualmente igual al showcase aprobado
- Interactivo: zoom, pan, hover effects
- Performance: renderiza en <500ms con 20 sedes

### Parte 5: Sedes List View

**Archivos:**
- Modificar: `src/features/locations/LocationsListViewV2.tsx`
- Modificar: `src/features/locations/LocationCardV2.tsx`

**Layout Compacto (Card):**

```
┌───────────────────────────────┐
│ [🏢] Sede Central             │ ← Header: icon + nombre
│      SEDE-001                 │ ← Código
│                               │
│ Operativa | • Bajo            │ ← Meta: Estado | Riesgo badge
│                               │
│ 8/8 permisos vigentes         │ ← Info
│ ████████████████ 100%         │ ← Progress bar (6px)
└───────────────────────────────┘
```

**Checklist:**
- [ ] Card con prop `interactive` (hover lift + cursor pointer)
- [ ] Icon container: 40x40px, background surface, border-radius 6px
- [ ] Title + code stack
- [ ] Meta row: "Operativa | [Badge]" separados por pipe
- [ ] Badge con `dot` indicator y color por riesgo
- [ ] Progress bar con color según %: verde (100%), naranja (<70%), rojo (<30%)
- [ ] Grid responsive: 1-col mobile, 2-col tablet+
- [ ] Header view: título + botón "Crear Sede" (primary + Plus icon)
- [ ] Empty state premium
- [ ] Loading: SkeletonList
- [ ] Commit: "feat(sedes): compact card layout with Estado|Riesgo inline"

### Parte 6: Sedes Detail View

**Archivos:**
- Modificar: `src/features/locations/LocationDetailView.tsx`
- Crear: `src/features/locations/LocationPermitsTab.tsx`
- Crear: `src/features/locations/LocationDocumentsTab.tsx`
- Crear: `src/features/locations/LocationHistoryTab.tsx`

**Layout:**

```
Breadcrumb: Inicio / Sedes / {nombre}
─────────────────────────────────────
Header: {nombre} + [Edit button]
─────────────────────────────────────
Stats: [Card1] [Card2] [Card3]
       Vigentes Por Vencer Vencidos
─────────────────────────────────────
Tabs: General | Permisos | Documentos | Historial
─────────────────────────────────────
Content area (cambia según tab)
```

**Checklist:**
- [ ] Breadcrumb component reutilizable
- [ ] 3 stat cards con iconos Lucide
- [ ] Tabs component reutilizable
- [ ] Cada tab en componente separado (lazy load)
- [ ] General tab: Info básica + badges
- [ ] Permisos tab: Mini tabla + CTA "Ver todos"
- [ ] Documentos tab: Upload area + grid de archivos
- [ ] Historial tab: Timeline vertical de eventos
- [ ] Responsive: tabs vertical en mobile
- [ ] Commit: "feat(sedes): enhanced detail view with tabs"

### Parte 7: Mapa Interactivo Standalone

**Archivos:**
- Modificar: `src/features/network/NetworkMapPage.tsx`
- Crear: `src/features/network/NetworkMapCanvas.tsx`
- Crear: `src/features/network/MapLegend.tsx`
- Reutilizar nodos/edges de Dashboard

**Layout:**

```
┌─────────────────────────────────────┐
│ Header: Mapa de Red | Legend       │
│                                     │
│                                     │
│        [React Flow Canvas]         │
│         Fullscreen minus header    │
│                                     │
│                                     │
│ ┌─────────┐                        │
│ │Controls │ (zoom, fit, reset)     │
│ └─────────┘                        │
└─────────────────────────────────────┘
```

**Checklist:**
- [ ] NetworkMapCanvas reutiliza nodos/edges del Dashboard
- [ ] Controls panel: Zoom in/out, fit view, reset
- [ ] Legend: Explicar colores (Verde=OK, Naranja=Atención, Rojo=Crítico)
- [ ] Node tooltips on hover: Mostrar detalles completos
- [ ] Edge tooltips: Estado + fecha última verificación
- [ ] Background grid sutil con Background component
- [ ] Responsive: touch gestures en mobile
- [ ] Commit: "feat(network): standalone interactive map"

### Parte 8: Permisos List - Professional Table

**Archivos:**
- Modificar: `src/features/permits/PermitListView.tsx`
- Crear: `src/features/permits/PermitTable.tsx`
- Crear: `src/features/permits/PermitTableFilters.tsx`
- Crear: `src/features/permits/exportPermitsCSV.ts`

**Columnas:**
1. Sede (string)
2. Tipo (string)
3. Estado (Badge/Lozenge)
4. Vencimiento (fecha formateada)
5. Autoridad (string)
6. Responsable (Avatar + nombre)
7. Acciones (Buttons: Ver, Editar)

**Funcionalidad:**
- Sorting por todas las columnas (excepto Acciones)
- Filtering: Estado, Tipo, Sede (dropdowns multi-select)
- Search: Busca en Sede, Tipo, Autoridad, Responsable
- Pagination: 25/50/100 por página con selector
- Export CSV: Descarga filas filtradas
- Row hover: Background neutral-50

**Checklist:**
- [ ] @tanstack/react-table v8 setup
- [ ] Column definitions con tipos
- [ ] Sorting + filtering + pagination
- [ ] Search input con debounce
- [ ] Export CSV function
- [ ] Header: Search + Filters + Actions (Export, Nuevo)
- [ ] Empty state: "No hay permisos"
- [ ] Loading: SkeletonTable
- [ ] Responsive: overflow-x en tabla, simplify en mobile
- [ ] Commit: "feat(permisos): professional table with sorting and filters"

### Parte 9: Permisos Detail View

**Archivos:**
- Modificar: `src/features/permits/PermitDetailView.tsx`
- Crear: `src/features/permits/PermitTimeline.tsx`
- Crear: `src/features/permits/PermitDocumentsSection.tsx`

**Layout 2-col:**

```
Breadcrumb: Inicio / Permisos / {número}
─────────────────────────────────────
Header: {tipo} - {número} + [Edit] [Delete]
─────────────────────────────────────
[Alert Banner si vencido/por vencer]
─────────────────────────────────────
┌──────────────┬─────────────────────┐
│ Info Card    │ Timeline Card       │
│ • Tipo       │ • Emitido: fecha    │
│ • Número     │ • Renovación: fecha │
│ • Autoridad  │ • Vence: fecha      │
│ • Responsable│                     │
│ • Estado     ├─────────────────────┤
│ • Riesgo     │ Documentos Section  │
└──────────────┤ • Upload area       │
               │ • Files grid        │
               └─────────────────────┘
```

**Checklist:**
- [ ] Alert banner condicional (warning/danger)
- [ ] Info card con grid 2-col de campos
- [ ] Badges para estado y riesgo
- [ ] Timeline vertical con iconos Lucide
- [ ] Upload area con drag & drop
- [ ] Files grid con preview thumbnails
- [ ] Actions: Edit, Delete, Download all
- [ ] Responsive: 1-col en mobile
- [ ] Commit: "feat(permisos): detail view with timeline"

### Parte 10: Renovaciones Grid

**Archivos:**
- Modificar: `src/features/renewals/RenewalTimelineView.tsx` (rename a RenewalGridView?)
- Crear: `src/features/renewals/MonthCard.tsx`
- Crear: `src/features/renewals/YearSelector.tsx`

**Layout:**

```
Header: Renovaciones | Year Selector [2026 ▼]
─────────────────────────────────────
Grid 3-col (responsive):
┌──────────┬──────────┬──────────┐
│ Marzo    │ Abril    │ Junio    │
│ 2026     │ 2026     │ 2026     │
│ 3 perm.  │ 5 perm.  │ 2 perm.  │
│ [Expand] │ [Expand] │ [Expand] │
└──────────┴──────────┴──────────┘
┌──────────┐
│Diciembre │
│ 2026     │
│ 1 perm.  │
│ [Expand] │
└──────────┘
```

**Checklist:**
- [ ] Solo mostrar meses con renovaciones
- [ ] Grid responsive: 1-col mobile, 2-col tablet, 3-col desktop
- [ ] Year selector dropdown
- [ ] Month card con expand inline
- [ ] Expanded content: Lista de permisos con links
- [ ] Empty state: "No hay renovaciones pendientes este año"
- [ ] Commit: "feat(renovaciones): 3-column grid with expandable month cards"

### Parte 11: Marco Legal List

**Archivos:**
- Modificar: `src/features/legal/LegalReferenceView.tsx`
- Crear: `src/features/legal/LegalCategoryCard.tsx`

**Layout:**

```
Header: Marco Legal | [Search bar]
─────────────────────────────────────
Grid 2-col:
┌────────────────┬────────────────┐
│ [🏛️] Sanitario│ [🌿] Ambiental │
│ Permisos MSP  │ Permisos MAE  │
│ 12 artículos  │ 8 artículos   │
│           →   │           →   │
└────────────────┴────────────────┘
┌────────────────┬────────────────┐
│ ... más cards                   │
└─────────────────────────────────┘
```

**Checklist:**
- [ ] Eliminar accordions existentes
- [ ] Crear LegalCategoryCard reusable
- [ ] Navigate on click to `/marco-legal/:categoria`
- [ ] Search filter (futuro opcional)
- [ ] Iconos Lucide por categoría
- [ ] Grid responsive
- [ ] Commit: "feat(legal): navigable card grid replacing accordions"

### Parte 12: Marco Legal Detail

**Archivos:**
- Crear: `src/features/legal/LegalCategoryDetailView.tsx`
- Agregar ruta en `App.tsx`: `/marco-legal/:categoria`

**Layout:**

```
Breadcrumb: Inicio / Marco Legal / {categoría}
─────────────────────────────────────
Header: {categoría}
─────────────────────────────────────
Descripción general (párrafo)
─────────────────────────────────────
Requisitos (sección)
☐ Requisito 1
☐ Requisito 2
☐ Requisito 3
─────────────────────────────────────
Permisos Relacionados
[Mini card 1] [Mini card 2]
─────────────────────────────────────
Banner: ¿Necesitas ayuda? [Contactar]
```

**Checklist:**
- [ ] Ruta nueva con param :categoria
- [ ] Fetch data por categoría
- [ ] Descripción, requisitos, permisos relacionados
- [ ] Banner de ayuda al final
- [ ] Breadcrumb clickable
- [ ] Commit: "feat(legal): category detail view with requirements"

### Parte 13: Cleanup - Remove Legacy

**Archivos a eliminar:**
- `src/features/tasks/` (toda la carpeta)
- `src/features/documents/` (toda la carpeta)
- Versiones viejas de network map (si existen V3, Real, etc.)

**Archivos a modificar:**
- `src/App.tsx`: Remover imports y rutas
- `src/components/layout/AppLayout.tsx`: Remover links de sidebar
- Buscar y eliminar imports huérfanos

**Checklist:**
- [ ] Eliminar TaskBoardView.tsx y archivos relacionados
- [ ] Eliminar DocumentVaultView.tsx y archivos relacionados
- [ ] Remover rutas `/tareas` y `/documentos`
- [ ] Remover links en sidebar/navigation
- [ ] Grep por imports viejos y limpiar
- [ ] Eliminar NetworkMap versiones viejas
- [ ] Consistency pass: buscar hardcoded colors → tokens
- [ ] Buscar emojis restantes → Lucide icons
- [ ] Verificar app compila sin errores
- [ ] Commit: "chore(cleanup): remove legacy features and hardcoded styles"

## Phase 2: Secondary Features (Partes 14-17)

### Parte 14: Login & Auth Views

**Archivos:**
- Modificar: `src/features/auth/LoginView.tsx`
- Modificar: `src/features/auth/AuthCallback.tsx`

**Layout:**

```
┌─────────────────────────────────┐
│        [Logo EnRegla]           │
│                                 │
│   Preciso, Confiable, Protector │
│                                 │
│  ┌───────────────────────────┐ │
│  │ Iniciar con Google        │ │
│  └───────────────────────────┘ │
│                                 │
│   [Banner Demo Mode si aplica] │
└─────────────────────────────────┘
Background: gradient blue-50 to surface
```

**Checklist:**
- [ ] Hero section con logo y tagline
- [ ] Google OAuth button con branding nuevo
- [ ] Gradient background sutil
- [ ] Demo mode banner informativo
- [ ] Loading con Loader2 icon
- [ ] AuthCallback con mismo styling
- [ ] Responsive
- [ ] Commit: "feat(auth): rebrand login with Atlassian DS"

### Parte 15: Onboarding Wizard

**Archivos:**
- Modificar: `src/features/onboarding-incremental/IncrementalWizard.tsx`
- Modificar: steps individuales
- Crear: `src/features/onboarding-incremental/Stepper.tsx`

**Layout:**

```
┌─────────────────────────────────┐
│ Stepper: ① — ② — ③             │
│         active   next  future  │
├─────────────────────────────────┤
│                                 │
│        [Step Content]           │
│                                 │
├─────────────────────────────────┤
│ [← Back]         [Skip] [Next →]│
└─────────────────────────────────┘
```

**Checklist:**
- [ ] Stepper component visual
- [ ] 3 steps: Profile, Company, Locations
- [ ] Form fields con Input components nuevos
- [ ] Validation feedback con Banner components
- [ ] Navigation buttons con variantes correctas
- [ ] Skip functionality
- [ ] Progress persistence (localStorage?)
- [ ] Commit: "feat(onboarding): wizard with Atlassian DS"

### Parte 16: Settings View

**Archivos:**
- Modificar: `src/features/settings/SettingsView.tsx`
- Crear: `src/features/settings/ProfileTab.tsx`
- Crear: `src/features/settings/CompanyTab.tsx`
- Crear: `src/features/settings/NotificationsTab.tsx`
- Crear: `src/features/settings/SecurityTab.tsx`

**Layout 2-col:**

```
┌──────────────┬──────────────────────┐
│ Tabs (left)  │ Content (right)      │
│ • Perfil     │ [Active tab content] │
│ • Empresa    │                      │
│ • Notif.     │                      │
│ • Seguridad  │                      │
└──────────────┴──────────────────────┘
```

**Checklist:**
- [ ] Layout 2-col con tabs sidebar
- [ ] Profile tab: Avatar + campos + save
- [ ] Company tab: Info empresa + logo + save
- [ ] Notifications tab: Toggle switches
- [ ] Security tab: Cambiar password + sesiones
- [ ] Toast notifications on save
- [ ] Responsive: tabs horizontal en mobile
- [ ] Commit: "feat(settings): tabbed layout with forms"

### Parte 17: Public Verification Page

**Archivos:**
- Modificar: `src/features/public-links/PublicVerificationPage.tsx`

**Layout:**

```
Header: [Logo] {Empresa Nombre}
─────────────────────────────────────
┌─────────────────────────────────┐
│ [Badge Vigente]                 │
│                                 │
│ Permiso: {tipo}                 │
│ Número: {número}                │
│ Emisión: {fecha}                │
│ Vencimiento: {fecha}            │
│ Autoridad: {autoridad}          │
│                                 │
│ ✓ Verificado el {timestamp}    │
└─────────────────────────────────┘
─────────────────────────────────────
Footer: Powered by EnRegla
```

**Checklist:**
- [ ] Header público simple (sin sidebar)
- [ ] Card central con info completa
- [ ] Status badge grande
- [ ] Verification timestamp con CheckCircle icon
- [ ] Footer "Powered by EnRegla" con link
- [ ] Responsive 100% width en mobile
- [ ] Funciona sin autenticación
- [ ] Commit: "feat(public): verification page public branding"

## Iteraciones 2-5: Recursive Polish

### Proceso por Iteración

**Step 1: Comprehensive Review**

Ejecutar review de TODAS las vistas (17 partes) con checklist:

```markdown
## Review Checklist - {Vista}
- [ ] Usa tokens Atlassian exclusivamente (no hardcoded)
- [ ] Iconos Lucide (no emojis, no legacy)
- [ ] Shadows consistentes
- [ ] Spacing consistente (tokens)
- [ ] Typography scale correcta
- [ ] Interactive states (hover, focus, active)
- [ ] Responsive design
- [ ] Loading states premium
- [ ] Empty states premium
- [ ] Accessibility (keyboard nav, ARIA)

Score: X/10
```

**Step 2: Identify 20% Weakest**

Ordenar vistas por score. Top 20% más débil (≈3-4 vistas) son candidatas.

Documentar problemas específicos en:
`docs/superpowers/reviews/iteration-{N}-review.md`

**Step 3: Re-implement Weak Areas**

Dividir mejoras en microtareas. Usar subagents en paralelo.

Criterio: Cada vista debe mejorar mínimo +2 puntos de score.

**Step 4: Validation**

- Screenshots before/after en `docs/superpowers/screenshots/iteration-{N}/`
- Documentar comparación en review.md
- User approval checkpoint opcional

### Convergencia Esperada

- **Iteración 2**: Identifica problemas obvios (inconsistencias, bugs visuales)
- **Iteración 3**: Pule detalles finos (spacing, colors exactos)
- **Iteración 4**: Mejora micro-interactions (hover, transitions)
- **Iteración 5**: Perfection pass (accesibilidad, performance, edge cases)

**Target final**: Todas las vistas con score 9-10/10

## Accessibility (WCAG 2.2)

Criterios aplicados en cada iteración:

- **1.4.3 Contrast (Minimum)**: 4.5:1 para texto normal, 3:1 para large text
- **2.1.1 Keyboard**: Todo interactivo accesible por teclado
- **2.4.7 Focus Visible**: Focus states visibles
- **3.2.2 On Input**: No cambios de contexto inesperados
- **4.1.2 Name, Role, Value**: ARIA labels en componentes custom
- **4.1.3 Status Messages**: Live regions para feedback

**Testing**:
- axe-core DevTools
- Keyboard-only navigation test
- Screen reader spot checks (NVDA/VoiceOver)

## Performance

**Targets:**
- Dashboard initial render: <1s
- Permit table con 1000 rows: <500ms sort/filter
- React Flow map con 50 nodos: 60fps
- Lighthouse score: 90+ en Performance, Accessibility, Best Practices

**Optimizaciones:**
- React.memo en componentes de lista
- useMemo para data transforms
- Virtual scrolling en tablas grandes (>100 rows)
- Code splitting por ruta (React.lazy)
- Image optimization (WebP, lazy loading)

## Testing Strategy

**No TDD strict** (por tiempo), pero:

- Smoke tests manuales después de cada parte
- Screenshots de regression visual
- Playwright tests opcionales para flujos críticos (login, crear sede, crear permiso)

## Branches y Commits

- Branch principal: `feature/atlassian-ds-migration`
- Sub-branches opcionales: `feature/atlassian-ds-migration/phase-1-dashboard`
- Commits atómicos con mensajes semánticos:
  - `feat(dashboard): ...`
  - `fix(dashboard): ...`
  - `refactor(dashboard): ...`
  - `chore(cleanup): ...`
  - `docs(spec): ...`

## Criterios de Éxito Final

Después de Iteración 5:

- [ ] Todas las 17 partes implementadas
- [ ] Todas las vistas score 9-10/10
- [ ] Cero hardcoded colors en código
- [ ] Cero emojis (todo Lucide)
- [ ] WCAG 2.2 compliant
- [ ] Performance Lighthouse >90
- [ ] Legacy features eliminadas (TaskBoard, DocumentVault)
- [ ] Mejoras estructurales aplicadas (tabla permisos, grid renovaciones, cards legal)
- [ ] Design System al 100% en cada rincón del sistema
- [ ] 5 documentos de review (uno por iteración)
- [ ] Screenshots before/after documentando progreso

## Archivos Relevantes

- `design-system-complete.html` - Showcase aprobado
- `docs/superpowers/checkpoint-design-system.md` - Checkpoint del proceso
- `docs/superpowers/plans/2026-05-05-frontend-design-improvements.md` - Plan original (deprecado)
- Este documento: `docs/superpowers/specs/2026-05-05-atlassian-ds-migration-design.md`

## Próximos Pasos

1. ✅ Spec aprobado por usuario
2. 🔄 Invocar writing-plans skill para crear implementation plan detallado
3. ⏳ Crear branch `feature/atlassian-ds-migration`
4. ⏳ Ejecutar Iteración 1 (17 partes) con subagents
5. ⏳ Review + Iteración 2
6. ⏳ Review + Iteración 3
7. ⏳ Review + Iteración 4
8. ⏳ Review + Iteración 5
9. ⏳ Merge final a main
