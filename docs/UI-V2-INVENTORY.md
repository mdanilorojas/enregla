# Inventario UI v1 vs UI v2 - EnRegla

**Fecha**: 2026-04-20  
**Branch**: feature/ui-v2  
**Objetivo**: Preparar merge a main con scope claro

---

## 📊 Estado Actual

### ✅ Features Migradas a UI-v2 (LISTO)

| Feature | UI Vieja | UI v2 | Estado | Notas |
|---------|----------|-------|--------|-------|
| **Auth** | ✓ | ✓ (integrado) | 🟢 Completo | LoginView con Manrope, sin AI slop |
| **Dashboard** | ✓ | ✓ | 🟡 Coexisten | Dos dashboards activos |
| **Locations (Sedes)** | ✓ | ✓ | 🟡 Coexisten | LocationsListViewV2 + CreateLocationModal |
| **Design System** | - | ✓ | 🟢 Completo | DesignSystemView para testing |

### 🔄 Features Parcialmente Migradas (MEZCLADAS)

| Feature | Problema | Acción Requerida |
|---------|----------|------------------|
| **Dashboard** | Dos versiones conviven (DashboardView en ambas carpetas) | Decidir cuál es la versión oficial |
| **Locations** | LocationListView (vieja) + LocationsListViewV2 (nueva) | Unificar en una sola vista |
| **Network** | Existe en ambas carpetas | Revisar si hay diferencias |
| **Onboarding** | Existe viejo + onboarding-incremental en v2 | Consolidar enfoque |
| **Permits** | Existe en ambas carpetas | Verificar duplicación |

### ❌ Features NO Migradas (SOLO EN UI VIEJA)

| Feature | Ubicación | Criticidad | Decisión |
|---------|-----------|------------|----------|
| **Documents** | `features/documents/` | Alta | ¿Migrar o mantener? |
| **Legal** | `features/legal/` | Alta | ¿Migrar o mantener? |
| **Renewals** | `features/renewals/` | Alta | ¿Migrar o mantener? |
| **Tasks** | `features/tasks/` | Media | ¿Migrar o mantener? |
| **Public Links** | `features/publicLinks/` | Baja | Existe `public-links` en v2 (verificar) |

---

## 🎯 Estado por Feature Crítica

### 1. Dashboard (CRÍTICO - Coexistencia)

**UI Vieja** (`src/features/dashboard/`):
- `DashboardView.tsx` - Vista principal
- Widgets: ActionQueue, ComplianceTrend, CriticalAlerts, DailyInsight, DashboardHero, DeadlineStrip, ExpirationCalendar, LiveStatusIndicator, LocationGrid, QuickActions, RiskOverview

**UI v2** (`src/features-v2/dashboard/`):
- `DashboardView.tsx` - Nueva versión
- Componentes: MetricsGrid, RiskOverviewCard, SedeCard

**Problema**: Ambas versiones existen. Routing puede estar apuntando a cualquiera.

**Acción**: Definir cuál es la versión oficial y eliminar/archivar la otra.

---

### 2. Sedes/Locations (CRÍTICO - Coexistencia)

**UI Vieja** (`src/features/locations/`):
- `LocationListView.tsx` (vieja)
- `LocationDetailView.tsx`
- `PermitsTable.tsx`

**UI v2** (`src/features-v2/locations/`):
- `LocationsListViewV2.tsx` (nueva)
- `LocationCardV2.tsx`
- `CreateLocationModal.tsx` (con risk calculation automático)
- `LocationDetailView.tsx` (también existe en v2)

**Problema**: Dos LocationDetailView, dos ListViews.

**Acción**: Unificar en v2, eliminar versión vieja.

---

### 3. Chat (MENCIONADO POR USUARIO)

**Estado**: Usuario dice "tengo chat 100" pero no veo carpeta `features/chat` o `features-v2/chat`.

**Acción**: Confirmar dónde está el código de chat.

---

### 4. Marco Legal (NO MIGRADO)

**Ubicación**: `src/features/legal/LegalReferenceView.tsx`

**Estado**: Solo existe en UI vieja.

**Acción**: Usuario menciona que debe recrearse con UI v2.

---

### 5. Renovaciones (NO MIGRADO)

**Ubicación**: `src/features/renewals/RenewalTimelineView.tsx`

**Estado**: Solo existe en UI vieja.

**Acción**: Usuario menciona que debe recrearse con UI v2.

---

### 6. Tareas (NO MIGRADO)

**Ubicación**: `src/features/tasks/TaskBoardView.tsx`

**Estado**: Solo existe en UI vieja.

**Acción**: Usuario menciona que debe recrearse con UI v2.

---

### 7. Mapa de Permisos/Network (PROBLEMÁTICO)

**UI Vieja** (`src/features/network/`):
- `NetworkMapView.tsx`
- `NetworkMapPage.tsx`
- Nodos: CompanyNode, PermitNode, SedeNode
- `useForceLayout.ts` (D3 force layout)

**UI v2** (`src/features-v2/network/`):
- Existe carpeta pero necesita verificación

**Problema**: Usuario dice "el mapa interactivo funciona mal".

**Acción**: Puede dejarse como está para arreglar después del merge.

---

## 🧹 Código Basura Identificado

### Componentes UI Viejos Potencialmente Basura

- `src/components/ui/` (si existe) - Reemplazado por `ui-v2`
- Estilos inline hard-coded en features viejas
- Imports de `ui` en lugar de `ui-v2`

### Verificar:
1. ¿Hay carpeta `src/components/ui/` que debe eliminarse?
2. ¿Features viejas importan componentes incorrectos?

---

## 🎯 Scope Propuesto para PR feature/ui-v2

### ✅ INCLUIR EN ESTE PR (MVP)

1. **Sistema de diseño unificado** ✓
   - Tokens CSS consolidados
   - Componentes ui-v2 con Manrope
   - Badges funcionales (risk + status)
   - LoginView profesionalizado

2. **Dashboard unificado**
   - Elegir versión oficial (v2 recomendado)
   - Eliminar versión vieja

3. **Sedes/Locations unificado**
   - LocationsListViewV2 como versión oficial
   - CreateLocationModal con risk calculation
   - Eliminar LocationListView vieja

4. **Auth mejorado** ✓
   - Ya está con nueva UI

### 🔄 DEJAR PARA DESPUÉS (Post-Merge)

1. **Marco Legal** - Recrear con UI v2 (PR separado)
2. **Renovaciones** - Recrear con UI v2 (PR separado)
3. **Tareas** - Recrear con UI v2 (PR separado)
4. **Mapa interactivo** - Arreglar bugs (PR separado)
5. **Documents** - Evaluar migración (PR separado)
6. **Chat** - Verificar estado actual

### ❌ ELIMINAR EN ESTE PR

- Features duplicadas (mantener solo v2)
- Imports de `ui` vieja (si aplica)
- Código comentado/muerto

---

## 📋 Próximos Pasos

1. ✅ **Inventario completado**
2. ⏳ **Identificar código basura específico**
3. ⏳ **Definir scope final del PR**
4. ⏳ **Code review con superpowers**
5. ⏳ **Merge preparado**

---

## ✅ Decisiones del Usuario (2026-04-20)

1. **Dashboard**: ✅ Mantener v2 (features-v2/dashboard) - Eliminar v1
2. **Chat**: ❌ No existe, error del usuario - Ignorar
3. **Locations**: ✅ Eliminar completamente versión vieja (features/locations)
4. **Post-Merge**: ✅ Legal, Renewals, Tasks, Documents → PRs separados
5. **Mapa**: ✅ No es blocker - Arreglar después del merge

---

**Generado por**: Claude Code + PM Skills  
**Siguiente**: Identificar código basura y definir scope MVP
