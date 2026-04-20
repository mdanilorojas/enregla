# Plan de Merge UI-v2 → Main - EnRegla

**Fecha**: 2026-04-20  
**Branch**: feature/ui-v2 → main  
**Tipo**: Feature merge (transformación UI completa)

---

## 🎯 Scope del MVP (Este PR)

### ✅ INCLUIR - Sistema de Diseño Unificado

**Componentes ui-v2** (ya completado):
- ✅ Tipografía Manrope (reemplaza Inter prohibida)
- ✅ Tokens CSS consolidados (:root)
- ✅ Badges funcionales (risk + status con colores semánticos)
- ✅ Cards con ritmo visual (spacing variado)
- ✅ LoginView profesionalizado (sin AI slop)
- ✅ Accesibilidad WCAG AA (ARIA, reduced motion)

**Features UI-v2**:
- ✅ Auth mejorado (LoginView, AuthCallback)
- ✅ Dashboard v2 (MetricsGrid, RiskOverviewCard, SedeCard)
- ✅ Locations v2 (LocationsListViewV2, CreateLocationModal con risk auto)
- ✅ Design System View (testing de componentes)

---

## 🗑️ ELIMINAR - Código Viejo

### Features Completas a Borrar

**1. Dashboard viejo** → `src/features/dashboard/` (17 archivos)
```
src/features/dashboard/DashboardView.tsx
src/features/dashboard/DashboardSkeleton.tsx
src/features/dashboard/widgets/ActionQueue.tsx
src/features/dashboard/widgets/ComplianceTrend.tsx
src/features/dashboard/widgets/CriticalAlerts.tsx
src/features/dashboard/widgets/DailyInsight.tsx
src/features/dashboard/widgets/DashboardHero.tsx
src/features/dashboard/widgets/DeadlineStrip.tsx
src/features/dashboard/widgets/ExpirationCalendar.tsx
src/features/dashboard/widgets/ExportDashboard.tsx
src/features/dashboard/widgets/LiveStatusIndicator.tsx
src/features/dashboard/widgets/LocationGrid.tsx
src/features/dashboard/widgets/QuickActions.tsx
src/features/dashboard/widgets/RiskOverview.tsx
```

**2. Locations viejo** → `src/features/locations/` (3 archivos)
```
src/features/locations/LocationListView.tsx
src/features/locations/LocationDetailView.tsx (si está duplicado en v2)
src/features/locations/PermitsTable.tsx (verificar si se usa)
```

### Routing a Actualizar

**Antes**:
```tsx
import DashboardView from '@/features/dashboard/DashboardView'
import LocationListView from '@/features/locations/LocationListView'
```

**Después**:
```tsx
import DashboardView from '@/features-v2/dashboard/DashboardView'
import LocationsListViewV2 from '@/features-v2/locations/LocationsListViewV2'
```

---

## 🔄 DEJAR PARA DESPUÉS (Backlog Post-Merge)

Estos features quedan en `src/features/` sin tocar:

| Feature | Acción Post-Merge | Prioridad |
|---------|-------------------|-----------|
| **Legal** | Recrear con UI-v2 | Alta |
| **Renewals** | Recrear con UI-v2 | Alta |
| **Tasks** | Recrear con UI-v2 | Media |
| **Documents** | Evaluar migración | Media |
| **Network/Mapa** | Arreglar bugs | Media |
| **Permits** | Verificar duplicación | Baja |
| **PublicLinks** | Verificar vs public-links v2 | Baja |
| **Onboarding** | Consolidar versiones | Baja |

---

## 📋 Checklist Pre-Merge

### 1. Limpieza de Código

- [ ] Eliminar `src/features/dashboard/` completo
- [ ] Eliminar `src/features/locations/LocationListView.tsx`
- [ ] Verificar si LocationDetailView está duplicado
- [ ] Actualizar imports en routing
- [ ] Verificar que no haya imports rotos

### 2. Verificación Build

- [ ] `npm run build` pasa sin errores
- [ ] `npm run lint` sin errores críticos
- [ ] TypeScript compilation limpia
- [ ] Dev server arranca correctamente

### 3. Testing Funcional

- [ ] Login funciona con nueva UI
- [ ] Dashboard v2 carga correctamente
- [ ] Locations v2 muestra sedes
- [ ] CreateLocationModal funciona
- [ ] Risk calculation automático funciona
- [ ] Navigation entre vistas funciona

### 4. Review Visual

- [ ] Tipografía Manrope se ve bien
- [ ] Badges de riesgo usan colores correctos
- [ ] Cards tienen spacing variado
- [ ] LoginView sin floating orbs
- [ ] Responsive funciona (mobile/desktop)

### 5. Code Review

- [ ] Ejecutar superpowers:code-reviewer
- [ ] Revisar cambios en archivos críticos
- [ ] Verificar que no hay secretos expuestos
- [ ] Confirmar que tests pasan (si existen)

---

## 🚀 Proceso de Merge

### Paso 1: Preparación

```bash
# Asegurar branch actualizada
git checkout feature/ui-v2
git fetch origin
git rebase origin/main  # Resolver conflictos si los hay

# Build limpio
npm run build
```

### Paso 2: Limpieza

```bash
# Eliminar features viejas
rm -rf src/features/dashboard
rm src/features/locations/LocationListView.tsx

# Commit limpieza
git add -A
git commit -m "refactor: remove old dashboard and locations UI

- Remove features/dashboard (replaced by features-v2/dashboard)
- Remove LocationListView (replaced by LocationsListViewV2)
- Prepare for UI-v2 merge to main"
```

### Paso 3: Actualizar Routing

- Revisar `src/App.tsx` o archivo de rutas
- Actualizar imports a features-v2
- Commit cambios

### Paso 4: Code Review

```bash
# Ejecutar code review
/superpowers:code-reviewer
```

### Paso 5: PR

```bash
# Push branch
git push origin feature/ui-v2

# Crear PR
gh pr create --title "feat: UI v2 transformation with Manrope typography and unified design system" \
  --body "$(cat docs/UI-V2-MERGE-PLAN.md)"
```

### Paso 6: Merge

- Esperar aprobaciones (si aplica)
- Mergear a main
- Verificar deploy en producción

---

## 📊 Impacto Estimado

### Archivos Modificados: ~50-70
- Eliminados: ~20 (features viejas)
- Actualizados: ~30-40 (routing, imports, components)
- Nuevos: ~10 (documentación)

### Features Afectadas:
- ✅ Auth: Mejorado
- ✅ Dashboard: Reemplazado
- ✅ Locations: Reemplazado
- 🔄 Resto: Sin cambios (migración futura)

### Riesgos:
- 🟡 Routing puede romperse si no se actualiza correctamente
- 🟡 Features no migradas pueden tener inconsistencia visual
- 🟢 Bajo riesgo de breaking changes en features no tocadas

---

## 🎯 Criterio de Éxito

**El merge es exitoso si**:
1. ✅ Build pasa sin errores
2. ✅ Login funciona con Manrope
3. ✅ Dashboard v2 muestra métricas
4. ✅ Sedes v2 lista y crea locations
5. ✅ No hay errores 404 en navegación
6. ✅ Tipografía distintiva vs Inter genérico

---

**Próximo paso**: Ejecutar code review con superpowers antes del merge

**Generado por**: Claude Code + PM Skills  
**Última actualización**: 2026-04-20
