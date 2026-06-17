# Rediseño del Dashboard (Integración del Clima de Cumplimiento) Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar la vista principal del Dashboard (`src/features/dashboard/DashboardTestView.tsx`) para reemplazar la rosca radial por el componente animado `ComplianceWeatherCard.tsx` en una cuadrícula dividida, garantizando consistencia tipográfica e interactividad sutil en todo el diseño.

**Architecture:** Crear un módulo puro `compliance-weather.ts` para abstraer el mapeo de riesgos a estados del clima. Integrar este estado y el componente `ComplianceWeatherCard` en el layout de dos columnas paralelos al Action Hub, el cual será refactorizado para usar botones sutiles y transiciones de hover reglamentarias.

**Tech Stack:** React, TypeScript, Tailwind CSS, Lucide icons, Vitest.

## Global Constraints

- Reutilizar obligatoriamente los componentes oficiales de UI (`Card`, `Button`, `Badge`) importados de `@/components/ui/...`. No usar divs o buttons crudos con clases customizadas para tarjetas y botones.
- Uso estricto de tokens tipográficos del sistema de diseño: `text-[var(--ds-font-size-100)]` para textos base y `text-[var(--ds-font-size-075)]` para detalles secundarios. Queda prohibido hardcodear tamaños como `text-[10px]` o clases directas de Tailwind sin variables (como `text-xs`).
- Las tarjetas clickeables y las filas del listado de acciones deben ser interactivas de manera sutil usando `hover:bg-[var(--ds-neutral-50)]` y transiciones suaves de borde, sin aplicar elevación de sombras ni escala vertical (evitar `hover:-translate-y-*` o `hover:shadow-overlay`).
- Los botones de acción en listados deben utilizar la variante limpia `variant="subtle"` o `variant="link"` de `<Button>` con tamaño `size="sm"` para eliminar ruido visual.
- Mantener la paleta estricta de colores del semáforo de riesgo de EnRegla (rojo, naranja, amarillo, verde) y el modo claro (sin elementos de modo oscuro o paletas neón genéricas).

---

### Task 1: Crear el helper de mapeo del clima y sus pruebas unitarias

**Files:**
- Create: `src/features/dashboard/compliance-weather.ts`
- Create: `tests/features/dashboard/compliance-weather.test.ts`
- Test: `tests/features/dashboard/compliance-weather.test.ts`

**Interfaces:**
- Consumes: `WeatherState` de `src/components/ui/ComplianceWeatherCard.tsx`
- Produces: `computeComplianceWeather(metrics: { vencidos: number; porVencer: number; noRegistrado: number })` retornando un objeto con tipo `{ state: WeatherState; chipLabel: string; headline: string }`

- [ ] **Step 1: Escribir la prueba unitaria fallando**

Crear el archivo `tests/features/dashboard/compliance-weather.test.ts` con el siguiente código:
```typescript
import { describe, it, expect } from 'vitest'
import { computeComplianceWeather } from '@/features/dashboard/compliance-weather'

describe('computeComplianceWeather', () => {
  it('debe retornar estado de tormenta (err) si hay permisos vencidos', () => {
    const res = computeComplianceWeather({ vencidos: 1, porVencer: 2, noRegistrado: 0 })
    expect(res.state).toBe('err')
    expect(res.chipLabel).toBe('Riesgo Crítico')
    expect(res.headline).toContain('permisos vencidos')
  })

  it('debe retornar estado de nublado (warn) si no hay vencidos pero hay permisos por vencer o no registrados', () => {
    const res1 = computeComplianceWeather({ vencidos: 0, porVencer: 1, noRegistrado: 0 })
    expect(res1.state).toBe('warn')
    expect(res1.chipLabel).toBe('Alerta Operativa')

    const res2 = computeComplianceWeather({ vencidos: 0, porVencer: 0, noRegistrado: 1 })
    expect(res2.state).toBe('warn')
    expect(res2.chipLabel).toBe('Alerta Operativa')
  })

  it('debe retornar estado soleado (sunny) si no hay vencidos, por vencer ni no registrados', () => {
    const res = computeComplianceWeather({ vencidos: 0, porVencer: 0, noRegistrado: 0 })
    expect(res.state).toBe('sunny')
    expect(res.chipLabel).toBe('Operación Protegida')
    expect(res.headline).toContain('al día y segura')
  })
})
```

- [ ] **Step 2: Ejecutar la prueba y verificar que falle**

Ejecutar: `npx vitest run tests/features/dashboard/compliance-weather.test.ts`
Expected: FAIL indicando que `computeComplianceWeather` no se puede importar o no está definida.

- [ ] **Step 3: Crear la implementación en la ruta correspondiente**

Crear el archivo `src/features/dashboard/compliance-weather.ts` con el siguiente código:
```typescript
import type { WeatherState } from '@/components/ui/ComplianceWeatherCard'

export interface WeatherMetrics {
  state: WeatherState
  chipLabel: string
  headline: string
}

export function computeComplianceWeather(metrics: {
  vencidos: number
  porVencer: number
  noRegistrado: number
}): WeatherMetrics {
  const { vencidos, porVencer, noRegistrado } = metrics

  if (vencidos > 0) {
    return {
      state: 'err',
      chipLabel: 'Riesgo Crítico',
      headline: 'Atención: tienes permisos vencidos que requieren acción.',
    }
  }

  if (porVencer > 0 || noRegistrado > 0) {
    return {
      state: 'warn',
      chipLabel: 'Alerta Operativa',
      headline: 'Tienes permisos próximos a vencer o sin registrar.',
    }
  }

  return {
    state: 'sunny',
    chipLabel: 'Operación Protegida',
    headline: 'Tu operación se encuentra al día y segura.',
  }
}
```

- [ ] **Step 4: Ejecutar la prueba de nuevo y verificar que pase**

Ejecutar: `npx vitest run tests/features/dashboard/compliance-weather.test.ts`
Expected: PASS

- [ ] **Step 5: Confirmar consistencia de tipos del proyecto**

Ejecutar: `npm run typecheck`
Expected: Exito sin errores de compilación TypeScript.

- [ ] **Step 6: Realizar Commit**

Ejecutar:
```bash
git add src/features/dashboard/compliance-weather.ts tests/features/dashboard/compliance-weather.test.ts
git commit -m "feat: add compliance weather logic mapping helper and unit tests"
```

---

### Task 2: Integrar el ComplianceWeatherCard en DashboardTestView

**Files:**
- Modify: `src/features/dashboard/DashboardTestView.tsx`

**Interfaces:**
- Consumes: `computeComplianceWeather` de `@/features/dashboard/compliance-weather` y `ComplianceWeatherCard` de `@/components/ui/ComplianceWeatherCard`

- [ ] **Step 1: Añadir imports requeridos**

Modificar las líneas iniciales de `src/features/dashboard/DashboardTestView.tsx` para importar `ComplianceWeatherCard` y `computeComplianceWeather`:
```typescript
import { ComplianceWeatherCard } from '@/components/ui/ComplianceWeatherCard'
import { computeComplianceWeather } from './compliance-weather'
```

- [ ] **Step 2: Calcular el estado derivado del clima dentro de useMemo**

En `DashboardTestView.tsx`, dentro del `useMemo` de `metrics` (alrededor de las líneas 101-115), calcular el clima usando el helper:
```typescript
    const riskLevel: 'low' | 'medium' | 'high' =
      vencidos > 0 && percentage < 50 ? 'high' : percentage < 80 || vencidos > 0 ? 'medium' : 'low'

    const weather = computeComplianceWeather({
      vencidos,
      porVencer,
      noRegistrado,
    })

    return {
      vigentes,
      porVencer,
      vencidos,
      noRegistrado,
      enTramite,
      total,
      percentage,
      riskLevel,
      pendingActions,
      mostUrgent,
      weather,
    }
```

- [ ] **Step 3: Reemplazar el contenedor radial izquierdo con ComplianceWeatherCard**

En `DashboardTestView.tsx`, reemplazar el bloque que contiene la rosca de radial progress SVG (aprox. líneas 265 a 392) por la llamada al componente `ComplianceWeatherCard`:
```typescript
          {/* Left Column: Compliance Weather Card */}
          <ComplianceWeatherCard
            state={metrics.weather.state}
            chipLabel={metrics.weather.chipLabel}
            headline={metrics.weather.headline}
            percentage={metrics.percentage}
            permitsDone={metrics.vigentes}
            permitsTotal={metrics.total}
            locations={locations.length}
          />
```

- [ ] **Step 4: Adaptar el contenedor Grid del Dashboard**

Modificar la clase del Grid contenedor principal de la vista (aprox. línea 262) para que las dos columnas sean más balanceadas:
```typescript
        {/* Core Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--ds-space-200)] lg:gap-[var(--ds-space-300)] items-stretch">
```

- [ ] **Step 5: Validar que compile y los tests pasen**

Ejecutar:
```bash
npm run typecheck
npm run test:run
```
Expected: Cero errores de compilación y todos los tests aprobados.

- [ ] **Step 6: Realizar Commit**

Ejecutar:
```bash
git add src/features/dashboard/DashboardTestView.tsx
git commit -m "feat: integrate ComplianceWeatherCard and adjust dashboard grid layout"
```

---

### Task 3: Refactorizar y alinear el listado de Acciones Requeridas

**Files:**
- Modify: `src/features/dashboard/DashboardTestView.tsx`

- [ ] **Step 1: Modificar la interactividad y los botones de ActionItemRow**

Modificar la función `ActionItemRow` en `src/features/dashboard/DashboardTestView.tsx` (alrededor de las líneas 489-554) para que use la variante sutil de botón y siga estrictamente los tokens tipográficos:

```typescript
function ActionItemRow({ action }: { action: CriticalAction }) {
  // Determine color coding for action status badge
  const badgeStyle = (() => {
    switch (action.status) {
      case 'vencido':
        return 'bg-[var(--ds-risk-critico-bg)] text-[var(--ds-risk-critico-text)] border-[var(--ds-risk-critico-border)] shadow-sm'
      case 'por_vencer':
        return 'bg-[var(--ds-risk-alto-bg)] text-[var(--ds-risk-alto-text)] border-[var(--ds-risk-alto-border)]'
      case 'no_registrado':
        return 'bg-[var(--ds-risk-medio-bg)] text-[var(--ds-risk-medio-text)] border-[var(--ds-risk-medio-border)]'
      default:
        return 'bg-[var(--ds-neutral-100)] text-[var(--ds-text-subtle)] border-transparent'
    }
  })()

  const labelText = (() => {
    switch (action.status) {
      case 'vencido':
        return 'Vencido'
      case 'por_vencer':
        return 'Por Vencer'
      case 'no_registrado':
        return 'Falta Registrar'
      default:
        return 'Pendiente'
    }
  })()

  const urgencyText = (() => {
    if (action.days === null) return 'Sin fecha límite'
    if (action.days < 0) {
      const abs = Math.abs(action.days)
      return `Expiró hace ${abs} día${abs === 1 ? '' : 's'}`
    }
    return `Expira en ${action.days} día${action.days === 1 ? '' : 's'}`
  })()

  return (
    <div className="flex justify-between items-center py-[var(--ds-space-150)] px-[var(--ds-space-150)] gap-[var(--ds-space-150)] hover:bg-[var(--ds-neutral-50)] rounded-[var(--ds-radius-100)] transition-all duration-200">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[var(--ds-font-size-100)] font-semibold text-[var(--ds-text)] truncate">
            {permitTypeLabel(action.type)}
          </span>
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[var(--ds-font-size-075)] font-bold uppercase border ${badgeStyle}`}>
            {labelText}
          </span>
        </div>
        <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] font-medium mt-1 flex flex-wrap gap-1.5 items-center">
          <span>{action.locationName}</span>
          <span>·</span>
          <span className={action.status === 'vencido' ? 'text-[var(--ds-status-vencido-text)] font-semibold' : action.status === 'por_vencer' ? 'text-[var(--ds-status-por-vencer-text)] font-semibold' : ''}>
            {urgencyText}
          </span>
        </p>
      </div>

      <Link to={`/permisos/${action.id}`} className="flex-shrink-0">
        <Button variant="subtle" size="sm" className="font-bold flex items-center gap-1">
          Resolver
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </Link>
    </div>
  )
}
```

- [ ] **Step 2: Verificar que compile y todo funcione correctamente**

Ejecutar:
```bash
npm run typecheck
npm run test:run
```
Expected: Sin errores de TypeScript ni fallas en pruebas.

- [ ] **Step 3: Realizar Commit**

Ejecutar:
```bash
git add src/features/dashboard/DashboardTestView.tsx
git commit -m "style: refactor ActionItemRow to use subtle button and design system typography tokens"
```
