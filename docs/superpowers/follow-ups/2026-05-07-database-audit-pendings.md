# Follow-ups del Database Audit (2026-05-07)

**Origen:** Sesión del 2026-05-07, branch `feature/database-audit`
**Status:** Dos tasks independientes, pueden hacerse en cualquier orden.

---

## Task 1 — Simplificar `LocationsStep` UI

**Contexto:** En Ola 12 del audit eliminamos `companies.regulatory_factors` porque optamos por la **Opción A: el `business_type` de la empresa define los permits que se crean** via `permit_requirements` + trigger `auto_create_location_permits`.

Pero el UI del onboarding en `src/features/onboarding-incremental/steps/LocationsStep.tsx` todavía pregunta **factores regulatorios por sede** (checkboxes de alimentos/alcohol/salud/químicos). Con el nuevo modelo eso es **redundante**:

1. El trigger DB corre automáticamente al crear location → crea permits basados en `business_type`
2. El código frontend en `saveLocationWithPermits` ALSO llama a `generateInitialPermits` con los factores del UI → **crea permits duplicados**

**Qué hacer:**

1. Eliminar el checkbox de factores regulatorios del UI (`LocationsStep.tsx` y subcomponentes)
2. Simplificar la interface `LocationInput` quitando el campo `regulatory`
3. Quitar la función `generateInitialPermits` de `src/lib/api/onboarding.ts` (ya no se necesita porque el trigger DB la reemplaza)
4. Simplificar `saveLocationWithPermits`: solo INSERT location, el trigger hace el resto

**Verificación post-cambio:**

- Crear una sede desde el wizard → verificar que se crean los permits correctos según el `business_type` de la company
- No duplicados de permits

**Files probablemente afectados:**
- `src/features/onboarding-incremental/steps/LocationsStep.tsx`
- `src/lib/api/onboarding.ts`
- Cualquier test que use `generateInitialPermits` directamente

**Estimación:** 30-60 min.

---

## Task 2 — Fix 5 errores TS de null-safety post-regeneración types

**Contexto:** En Ola 12 regeneramos `src/types/database.ts` desde el schema real de Supabase. Los tipos nuevos son más estrictos sobre `| null` (reflejan mejor la realidad de la DB). Eso expuso 5 bugs latentes de null-safety en código existente.

**Los errores exactos (salida de `npx tsc -p config/tsconfig.app.json --noEmit`):**

```
src/hooks/useNotificationPreferences.ts(32,24): error TS2345: Argument of type
'{ email_enabled: boolean | null; ... }' is not assignable to parameter of type
'SetStateAction<NotificationPreferences | null>'. Types of property
'email_enabled' are incompatible. Type 'boolean | null' is not assignable to
type 'boolean'.

src/lib/api/permits.ts(66,24): error TS2345: Argument of type 'string | null'
is not assignable to parameter of type 'string'.

src/lib/api/permits.ts(149,14): error TS18047: 'oldPermit.version' is possibly
'null'.

src/lib/dashboard-metrics.ts(64,53): error TS2769: Date() cannot accept 'string | null'.

src/lib/dashboard-metrics.ts(129,9): error TS2322: Type
'{ locationId: string | null; ... }' not assignable to 'UpcomingRenewal'
(expects locationId: string).
```

**Patrón de fix (los 5 son variaciones del mismo tema):**

- `useNotificationPreferences.ts:32` → agregar fallback `?? false` o actualizar tipo local `NotificationPreferences` para aceptar `boolean | null`
- `permits.ts:66` → agregar guard: `if (!value) throw new Error(...)` antes de usar
- `permits.ts:149` → `oldPermit.version ?? 1` o guard
- `dashboard-metrics.ts:64` → filter con `permits.filter(p => p.expiry_date)` antes del `new Date()`
- `dashboard-metrics.ts:129` → filter + `locationId: p.locationId!` con guard previo

**Verificación post-cambio:**

```bash
npx tsc -p config/tsconfig.app.json --noEmit
# Debe salir clean (0 errors)
```

**Estimación:** 30-45 min.

---

## Cómo retomar

En la próxima sesión:

1. `git checkout feature/database-audit` (o mergear primero a `main` y trabajar en branch nueva)
2. Lee este archivo
3. Elige una task (las dos son independientes)
4. Al terminar, marca el task como completado borrándolo de este archivo (o moviéndolo a sección "Completados" abajo)

---

## Completados

### Task 2 — Fix errores TS null-safety post-regeneración types ✅

**Terminado:** 2026-05-07 (misma sesión)

Resueltos 10 errores TS en 7 archivos (fueron más de los 5 documentados originalmente, los atrapamos todos):

- `useNotificationPreferences.ts:32` — default a `true` los campos nullable
- `permits.ts:66` — guard para `location_id` null
- `permits.ts:149` — `oldPermit.version ?? 1` fallback
- `dashboard-metrics.ts:64` — fallback a `Date.now()` si `location.created_at` null
- `dashboard-metrics.ts:129` — type predicate filter para narrow `location_id | expiry_date` no null
- `PermitDetailView.tsx:430` — conditional render de `formatDate(doc.uploaded_at)`
- `PermitTable.tsx:21` — cambio `locationId: string` a `string | null`
- `PermitsTable.tsx:79` — cast con import de type `PermitStatus`
- `DocumentList.tsx:129` — conditional render de `formatDate(doc.uploaded_at)`
- `LocationDetailView.tsx:43` — `is_active ?? true` fallback
- `PermitCardsGrid.tsx:205` — fallback a `statusConfig.no_registrado` si key no existe

**Resultado:** `npx tsc -p config/tsconfig.app.json --noEmit` clean (0 errors).
**Build:** exitoso en 708ms.

---

### Task 1 — Simplificar LocationsStep UI ✅

**Terminado:** 2026-05-07 (misma sesión del audit)

- Eliminada sección "Factores regulatorios" del `LocationsStep.tsx`
- Simplificada interface `LocationInput` (sin campo `regulatory`)
- Agregado banner informativo: "Los permisos se crean automáticamente según el tipo de negocio de la empresa."
- Eliminada función `generateInitialPermits` de `onboarding.ts` (reemplazada por trigger DB)
- Simplificada `saveLocationWithPermits` (solo INSERT location, trigger hace el resto)
- Actualizada `completeOnboarding` (legacy, quitado paso de permits manuales y update profile)
- Parchado `OnboardingWizard.tsx` legacy con type local `LocalOnboardingData` para que compile
- Eliminada `regulatory_factors` de `OnboardingData` interface
