# Cálculo Automático de Nivel de Riesgo para Sedes - Diseño

**Fecha:** 2026-04-15  
**Estado:** Aprobado  
**Autor:** Claude (brainstorming con usuario)

## Objetivo

Eliminar la selección manual de nivel de riesgo al crear sedes. El sistema debe calcular el riesgo automáticamente basándose en:
- **Etapa 1 (0-48h):** Tiempo transcurrido desde creación de la sede
- **Etapa 2 (48h+):** Estado de cumplimiento de permisos obligatorios

## Contexto del Problema

Actualmente, `CreateLocationModal` solicita al usuario seleccionar manualmente el nivel de riesgo entre 4 opciones (bajo, medio, alto, crítico). Esto es problemático porque:

1. El usuario no tiene información suficiente para evaluar el riesgo al momento de crear la sede
2. El riesgo es una métrica calculable basada en datos objetivos (permisos vencidos, faltantes, tiempo transcurrido)
3. La selección manual no se actualiza cuando cambia el estado de los permisos

## Solución Propuesta

### Arquitectura

**Componentes principales:**

1. **Tabla `permit_requirements`:** Mapeo estático de categoría de negocio → permisos obligatorios
2. **Trigger PostgreSQL:** Auto-creación de permisos al insertar una sede
3. **Función `calculateLocationRiskLevel()`:** Lógica de cálculo en dos etapas
4. **Hook `useLocations`:** Calcula riesgo on-demand al cargar sedes
5. **Simplificación de `CreateLocationModal`:** Eliminar campo manual de riesgo

**Flujo de datos:**

```
Usuario crea sede
  ↓
INSERT locations (con created_at)
  ↓
Trigger auto_create_location_permits()
  ↓
  1. Lee company.business_type
  2. Busca permisos en permit_requirements
  3. INSERT permits en estado 'no_registrado'
  ↓
Frontend carga locations + permits
  ↓
useLocations ejecuta calculateLocationRiskLevel()
  ↓
  - Si <48h desde created_at: usar tiempo + presencia de documentos
  - Si ≥48h: usar estado de permisos (vencidos, faltantes, etc.)
  ↓
UI muestra risk_level calculado
```

---

## Diseño Detallado

### 1. Estructura de Base de Datos

**Nueva tabla: `permit_requirements`**

```sql
CREATE TABLE permit_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_type TEXT NOT NULL,
  permit_type TEXT NOT NULL,
  is_mandatory BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(business_type, permit_type)
);
```

**Propósito:** Almacenar mapeo estático de qué permisos son obligatorios para cada tipo de negocio.

**Datos iniciales (4 categorías base):**

| business_type | Permisos obligatorios |
|---------------|----------------------|
| `restaurante` | ruc, patente_municipal, uso_suelo, bomberos, arcsa |
| `retail` | ruc, patente_municipal, uso_suelo, bomberos |
| `consultorio` | ruc, patente_municipal, uso_suelo, bomberos, arcsa, permiso_ministerio_salud |
| `food_truck` | ruc, patente_municipal, bomberos, arcsa, permiso_movilidad |

**Fuente de datos:** Extraído de `docs/deep-research-report.md` (requisitos regulatorios de Quito, Ecuador).

---

**Función de base de datos: `auto_create_location_permits()`**

```sql
CREATE OR REPLACE FUNCTION auto_create_location_permits()
RETURNS TRIGGER AS $$
DECLARE
  company_business_type TEXT;
  permit_req RECORD;
BEGIN
  -- Obtener business_type de la empresa
  SELECT business_type INTO company_business_type
  FROM companies
  WHERE id = NEW.company_id;
  
  -- Crear permisos basados en el business_type
  FOR permit_req IN 
    SELECT permit_type 
    FROM permit_requirements 
    WHERE business_type = company_business_type
  LOOP
    INSERT INTO permits (
      company_id,
      location_id,
      type,
      status
    ) VALUES (
      NEW.company_id,
      NEW.id,
      permit_req.permit_type,
      'no_registrado'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Trigger:**

```sql
CREATE TRIGGER trigger_auto_create_permits
  AFTER INSERT ON locations
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_location_permits();
```

**Comportamiento:**
- Se ejecuta automáticamente después de crear una sede
- Lee `company.business_type` de la empresa padre
- Crea todos los permisos obligatorios en estado `no_registrado`
- Si `business_type` no está en `permit_requirements`, no crea permisos (sede queda sin permisos, riesgo crítico después de 48h)

---

**Actualización de tipos TypeScript:**

```typescript
// src/types/database.ts

export interface Database {
  public: {
    Tables: {
      // ... tablas existentes
      permit_requirements: {
        Row: {
          id: string;
          business_type: string;
          permit_type: string;
          is_mandatory: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_type: string;
          permit_type: string;
          is_mandatory?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_type?: string;
          permit_type?: string;
          is_mandatory?: boolean;
          created_at?: string;
        };
      };
    };
  };
}

export type PermitRequirement = Database['public']['Tables']['permit_requirements']['Row'];
```

---

### 2. Lógica de Cálculo de Riesgo (2 Etapas)

**Función: `calculateLocationRiskLevel()`**

**Ubicación:** `src/lib/dashboard-metrics.ts`

**Firma:**

```typescript
export function calculateLocationRiskLevel(
  location: Location,
  permits: Permit[]
): RiskLevel
```

**Lógica:**

**Etapa 1: Primera 48 horas (tiempo desde creación)**

```
Si horas_desde_creación ≤ 48:
  Si hay permisos con documentos (status != 'no_registrado' y != 'vencido'):
    → Transición anticipada a Etapa 2
  Sino:
    Si horas_desde_creación ≤ 24:
      → Riesgo BAJO
    Sino (24-48h):
      → Riesgo MEDIO
```

**Justificación:** Durante las primeras 48h, se asume que la sede está en proceso de setup. Se da un período de gracia para subir documentos. Si el usuario sube documentos antes de 48h, se evalúa inmediatamente con lógica de permisos (más estricta).

**Etapa 2: Después de 48h O si ya hay documentos**

```
Si no hay permisos activos:
  → Riesgo CRÍTICO

Si hay permisos vencidos O permisos faltantes (no_registrado):
  → Riesgo CRÍTICO

Si hay permisos por vencer:
  → Riesgo MEDIO

Sino (todos vigentes):
  → Riesgo BAJO
```

**Cambio vs. lógica actual:** En la versión actual, `hasFaltantes` retorna `alto`. En la nueva versión, después de 48h, faltantes = `crítico` (más estricto).

**Implementación:**

```typescript
export function calculateLocationRiskLevel(
  location: Location,
  permits: Permit[]
): RiskLevel {
  const activePermits = permits.filter((p) => p.is_active && p.location_id === location.id);
  const hoursSinceCreation = (Date.now() - new Date(location.created_at).getTime()) / (1000 * 60 * 60);
  
  // ETAPA 1: Primera 48 horas
  if (hoursSinceCreation <= 48) {
    const permitsWithDocuments = activePermits.filter(p => 
      p.status !== 'no_registrado' && p.status !== 'vencido'
    );
    
    if (permitsWithDocuments.length === 0) {
      if (hoursSinceCreation <= 24) {
        return 'bajo';
      } else {
        return 'medio';
      }
    }
    // Si ya hay documentos, pasar a etapa 2
  }
  
  // ETAPA 2: Después de 48h O si ya hay documentos
  if (activePermits.length === 0) return 'critico';
  
  const hasVencidos = activePermits.some((p) => p.status === 'vencido');
  const hasFaltantes = activePermits.some((p) => p.status === 'no_registrado');
  const hasPorVencer = activePermits.some((p) => p.status === 'por_vencer');
  
  if (hasVencidos || hasFaltantes) return 'critico';
  if (hasPorVencer) return 'medio';
  
  return 'bajo';
}
```

---

### 3. Cambios en CreateLocationModal

**Archivo:** `src/features-v2/locations/CreateLocationModal.tsx`

**Cambios:**

1. **Eliminar estado `riskLevel`** (líneas 38-41)
2. **Eliminar validación de `riskLevel`** (líneas 75-78)
3. **Actualizar llamada a API** (líneas 93-99): remover parámetro `risk_level`
4. **Eliminar campo de formulario Select** (líneas 234-260): todo el bloque de "Nivel de riesgo inicial"
5. **Eliminar clearError para riskLevel**

**Resultado:** Formulario pasa de 4 campos a 3 campos (nombre, dirección, estado).

---

### 4. Cambios en API

**Archivo:** `src/lib/api/locations.ts`

**Función `createLocation`:**

**Antes:**

```typescript
export async function createLocation(data: {
  company_id: string;
  name: string;
  address: string;
  status: 'operando' | 'en_preparacion' | 'cerrado';
  risk_level: 'bajo' | 'medio' | 'alto' | 'critico';
}): Promise<Location>
```

**Después:**

```typescript
export async function createLocation(data: {
  company_id: string;
  name: string;
  address: string;
  status: 'operando' | 'en_preparacion' | 'cerrado';
}): Promise<Location> {
  const query = supabase.from('locations') as any;
  const { data: location, error } = await query
    .insert({
      company_id: data.company_id,
      name: data.name,
      address: data.address,
      status: data.status,
      risk_level: 'bajo', // Valor por defecto, se recalcula on-demand
    })
    .select()
    .single();

  if (error) throw error;
  return location;
}
```

**Nota:** `risk_level: 'bajo'` se inserta como valor por defecto para cumplir con constraint de BD, pero se ignora. El riesgo real se calcula on-demand en el frontend.

---

### 5. Integración en Frontend

**Hook `useLocations`:**

**Ubicación:** `src/hooks/useLocations.ts`

**Propósito:** Cargar sedes y calcular riesgo on-demand.

```typescript
import { useState, useEffect } from 'react';
import { getCompanyLocations } from '@/lib/api/locations';
import { usePermits } from '@/hooks/usePermits';
import { calculateLocationRiskLevel } from '@/lib/dashboard-metrics';
import type { Location } from '@/types/database';

export function useLocations(companyId: string | null) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const { permits } = usePermits({ companyId });

  useEffect(() => {
    if (!companyId) return;
    
    async function fetchLocations() {
      try {
        const data = await getCompanyLocations(companyId);
        
        // Calcular risk_level on-demand
        const locationsWithRisk = data.map(location => ({
          ...location,
          risk_level: calculateLocationRiskLevel(location, permits),
        }));
        
        setLocations(locationsWithRisk);
      } catch (error) {
        console.error('Error fetching locations:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLocations();
  }, [companyId, permits]); // Re-calcular cuando cambien permisos

  return { locations, loading };
}
```

**Dependencia crítica:** El hook depende de que `usePermits` cargue los permisos. Si `permits` está vacío, el cálculo asumirá "sin permisos" y riesgo será crítico (después de 48h).

---

**Componentes sin cambios:**

- `LocationCardV2`: Ya consume `location.risk_level`, funciona automáticamente
- `LocationDetailView`: Ya consume `location.risk_level`, funciona automáticamente

---

### 6. Testing

**Archivo:** `src/lib/dashboard-metrics.test.ts` (crear si no existe)

**Test cases mínimos:**

**Etapa 1 (0-48h):**
- ✅ 0-24h sin documentos → bajo
- ✅ 24-48h sin documentos → medio
- ✅ <48h con documentos → transición a etapa 2 (usar lógica de permisos)

**Etapa 2 (48h+):**
- ✅ 48h+ sin permisos → crítico
- ✅ 48h+ con permisos faltantes → crítico
- ✅ 48h+ con permisos vencidos → crítico
- ✅ 48h+ con permisos por vencer → medio
- ✅ 48h+ todos vigentes → bajo

**Helpers para tests:**

```typescript
function createMockLocation({ hoursAgo }: { hoursAgo: number }): Location {
  return {
    id: 'test-id',
    company_id: 'company-id',
    name: 'Test Location',
    address: 'Test Address',
    status: 'operando',
    risk_level: 'bajo', // Se sobrescribe
    created_at: new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function createMockPermit({ status }: { status: string }): Permit {
  return {
    id: 'permit-id',
    company_id: 'company-id',
    location_id: 'test-id',
    type: 'ruc',
    status: status as any,
    permit_number: null,
    issue_date: null,
    expiry_date: null,
    issuer: null,
    notes: null,
    is_active: true,
    version: 1,
    superseded_by: null,
    archived_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
```

---

### 7. Manejo de Errores y Edge Cases

**Escenario: business_type no existe en permit_requirements**

- Trigger no falla, simplemente no crea permisos
- Sede queda sin permisos (`activePermits.length === 0`)
- Después de 48h, riesgo = crítico
- Usuario puede agregar permisos manualmente

**Escenario: Hook `useLocations` se ejecuta antes de `usePermits`**

- Si `permits` está vacío, `calculateLocationRiskLevel()` asume "sin permisos"
- Sedes recientes (<48h) mostrarán riesgo bajo/medio correctamente
- Sedes antiguas (>48h) mostrarán riesgo crítico hasta que carguen permisos
- Solución: asegurar que `usePermits` se ejecute en paralelo o antes

**Escenario: Migración en producción con sedes antiguas**

- Sedes existentes ya tienen `created_at`
- Si `created_at` no existe (caso raro), usar `updated_at` como fallback
- Para sedes muy antiguas (>48h), siempre usar etapa 2 (lógica de permisos)

**Escenario: Usuario elimina manualmente todos los permisos**

- `activePermits.length === 0` → riesgo crítico
- Comportamiento correcto: sin permisos = crítico

---

## Decisiones de Diseño

### ¿Por qué cálculo on-demand vs. almacenar en BD?

**Opción elegida:** Cálculo on-demand (Opción B del brainstorming)

**Razones:**
1. **Simplicidad:** No requiere jobs periódicos ni lógica de cache invalidation
2. **Datos siempre frescos:** El riesgo se calcula en cada render con datos actuales
3. **Escalabilidad suficiente:** Para 100-500 sedes, el cálculo toma ~50-200ms, aceptable
4. **Sin infraestructura adicional:** Funciona en local sin dependencias externas

**Trade-off:**
- Sacrificamos un poco de performance a cambio de simplicidad
- Si en el futuro crece a miles de sedes, migramos a cálculo periódico con cache

---

### ¿Por qué heredar business_type de company vs. campo propio?

**Opción elegida:** Heredar siempre de `company.business_type`

**Razones:**
1. **Consistencia:** Todas las sedes de una empresa son del mismo tipo
2. **Simplicidad:** No requiere agregar campo `category` a locations
3. **Menos errores:** Usuario no puede seleccionar categoría incorrecta por sede

**Restricción:** Solo se pueden crear empresas con `business_type` que esté en `permit_requirements`. Esto se controla a nivel de UI (dropdown con opciones fijas).

---

### ¿Por qué 48 horas como umbral?

**Justificación del usuario:** Es el tiempo razonable para que una empresa nueva:
1. Cree la sede en el sistema
2. Reúna documentación física
3. Escanee/suba documentos
4. Registre permisos en el sistema

Después de 48h, se asume que la empresa tuvo tiempo suficiente y la falta de documentación es crítica.

---

## Impacto

### Cambios breaking

**Base de datos:**
- Nueva tabla `permit_requirements` (no breaking, es nueva)
- Nuevo trigger `trigger_auto_create_permits` (no breaking, solo afecta INSERT nuevos)

**API:**
- Firma de `createLocation()` cambia (remover `risk_level`): **BREAKING para llamadas existentes**
- Impacto: Solo afecta a `CreateLocationModal`, que se actualiza en el mismo PR

**UI:**
- `CreateLocationModal` pierde campo de riesgo: **Mejora de UX** (menos campos)

### Migración

**Sedes existentes:**
- No requieren migración de datos
- Ya tienen `created_at`, funciona inmediatamente
- Trigger solo afecta sedes nuevas

**Permisos existentes:**
- No se modifican
- Siguen funcionando con lógica de cálculo

**Rollback:**
- Si falla, remover trigger y tabla `permit_requirements`
- Revertir cambios en `CreateLocationModal` y API
- Sedes creadas sin el trigger no tendrán permisos auto-generados (se agregan manualmente)

---

## Próximos Pasos

1. ✅ Diseño aprobado
2. ✅ Escribir plan de implementación detallado (writing-plans skill)
3. ✅ Ejecutar implementación (subagent-driven-development o executing-plans)
4. ⏳ Testing manual
5. ⏳ Code review
6. ⏳ Merge a main

---

## Apéndice: Mapeo de Permisos por Categoría

**Fuente:** `docs/deep-research-report.md`

### Restaurante / Cafetería

| Permiso | Autoridad | Tipo |
|---------|-----------|------|
| RUC | SRI | Obligatorio |
| RAET/Patente Municipal | Municipio Quito | Obligatorio |
| Certificado de Uso de Suelo (LUAE) | Municipio Quito | Obligatorio |
| Permiso de Bomberos | Cuerpo de Bomberos | Obligatorio |
| Permiso Sanitario ARCSA | ARCSA | Obligatorio |

### Retail General

| Permiso | Autoridad | Tipo |
|---------|-----------|------|
| RUC | SRI | Obligatorio |
| RAET/Patente Municipal | Municipio Quito | Obligatorio |
| Certificado de Uso de Suelo (LUAE) | Municipio Quito | Obligatorio |
| Permiso de Bomberos | Cuerpo de Bomberos | Obligatorio |

### Consultorio / Clínica

| Permiso | Autoridad | Tipo |
|---------|-----------|------|
| RUC | SRI | Obligatorio |
| RAET/Patente Municipal | Municipio Quito | Obligatorio |
| Certificado de Uso de Suelo (LUAE) | Municipio Quito | Obligatorio |
| Permiso de Bomberos | Cuerpo de Bomberos | Obligatorio |
| Permiso Sanitario ARCSA | ARCSA | Obligatorio |
| Permiso Ministerio de Salud | MSP | Obligatorio |

### Food Truck

| Permiso | Autoridad | Tipo |
|---------|-----------|------|
| RUC | SRI | Obligatorio |
| RAET/Patente Municipal | Municipio Quito | Obligatorio |
| Permiso de Bomberos | Cuerpo de Bomberos | Obligatorio |
| Permiso Sanitario ARCSA | ARCSA | Obligatorio |
| Permiso EMOV (Movilidad) | EMOV | Obligatorio |

---

## User Flow (Referencia del diseño anterior - Conservado)

1. User clicks "Crear Sede" button (in header or empty state)
2. Modal opens with empty form (4 fields)
3. User fills required fields: name, address, status, risk_level
4. User clicks "Crear" button
5. Validation runs → if fail, show errors under fields
6. If valid → API call to create location in Supabase
7. On success:
   - Toast notification: "✓ Sede creada exitosamente"
   - Modal closes automatically
   - Navigate to `/sedes/{newLocationId}` (detail view)
8. On error:
   - Toast notification: "✗ Error al crear sede: {error message}"
   - Modal stays open with data preserved
   - User can retry

---

## Architecture

### Components

**New file:** `src/features-v2/locations/CreateLocationModal.tsx`
- Modal component using shadcn/ui Dialog
- Props: `open: boolean`, `onClose: () => void`, `onSuccess: (locationId: string) => void`
- State: form fields, loading, errors
- Validation logic inline (simple checks)

### API Function

**New function in:** `src/lib/api/locations.ts`

```typescript
export async function createLocation(data: {
  company_id: string;
  name: string;
  address: string;
  status: 'operando' | 'en_preparacion' | 'cerrado';
  risk_level: 'bajo' | 'medio' | 'alto' | 'critico';
}): Promise<Location>
```

- Inserts row into `locations` table
- Returns created location with generated ID
- Throws error if Supabase operation fails

### Integration Points

**Modified file:** `src/features-v2/locations/LocationsListViewV2.tsx`
- Add state: `const [createModalOpen, setCreateModalOpen] = useState(false)`
- Replace `alert('Funcionalidad próximamente')` with `setCreateModalOpen(true)` (2 places: header button + empty state button)
- Add `<CreateLocationModal>` component at end of JSX
- Pass props: `open={createModalOpen}`, `onClose={() => setCreateModalOpen(false)}`, `onSuccess={handleLocationCreated}`
- Implement `handleLocationCreated`: show toast + navigate to detail

---

## Form Fields Specification

### Field 1: Nombre de la sede

- **Type:** Text input
- **Name:** `name`
- **Label:** "Nombre de la sede"
- **Placeholder:** "Ej: Supermaxi Norte, Oficina Centro, etc."
- **Required:** Yes
- **Validation:** Minimum 3 characters
- **Error message:** "El nombre debe tener al menos 3 caracteres"

### Field 2: Dirección

- **Type:** Textarea
- **Name:** `address`
- **Label:** "Dirección"
- **Placeholder:** "Av. Principal 123, Quito"
- **Required:** Yes
- **Validation:** Minimum 5 characters
- **Error message:** "La dirección debe tener al menos 5 caracteres"
- **Rows:** 3

### Field 3: Estado de la sede

- **Type:** Select
- **Name:** `status`
- **Label:** "Estado de la sede"
- **Required:** Yes
- **No default value** (user must choose)
- **Options:**
  - `operando` → "Operando"
  - `en_preparacion` → "En preparación"
  - `cerrado` → "Cerrado"
- **Error message:** "Debes seleccionar un estado"

### Field 4: Nivel de riesgo inicial

- **Type:** Select
- **Name:** `risk_level`
- **Label:** "Nivel de riesgo inicial"
- **Required:** Yes
- **No default value** (user must choose)
- **Options with visual indicators:**
  - `bajo` → "🟢 Bajo"
  - `medio` → "🟡 Medio"
  - `alto` → "🟠 Alto"
  - `critico` → "🔴 Crítico"
- **Error message:** "Debes seleccionar un nivel de riesgo"

---

## Validation Rules

### Client-Side Validation (before submit)

1. All fields are required (non-empty)
2. `name`: minimum 3 characters
3. `address`: minimum 5 characters
4. `status`: must be one of the 3 valid enum values
5. `risk_level`: must be one of the 4 valid enum values

**Validation timing:** On form submit (not real-time while typing)

**Error display:** 
- Show error text below each invalid field
- Use text-red-500 color
- Errors clear when user starts typing in that field

### Server-Side Validation

Supabase RLS policies enforce:
- User must be authenticated
- User's `company_id` must match the location's `company_id`
- All NOT NULL constraints in database schema

---

## Modal States

### 1. Idle (initial state)

- Form is empty and enabled
- "Crear" button is enabled
- "Cancelar" button is enabled
- User can type in fields
- User can close modal (X button, outside click, Escape key)

### 2. Loading (submitting)

- All form fields are disabled
- "Crear" button shows spinner icon and text "Creando..."
- "Crear" button is disabled
- "Cancelar" button is disabled
- Modal cannot be closed (prevent accidental dismissal)

### 3. Success (after creation)

- Toast appears: "✓ Sede creada exitosamente" (success variant, 3s duration)
- Modal closes automatically
- Navigation executes: `navigate(/sedes/${newLocationId})`
- Form resets for next use

### 4. Error (if creation fails)

- Toast appears: "✗ Error al crear sede: {error.message}" (error variant, 5s duration)
- Modal stays open
- Form data is preserved (user doesn't lose input)
- Loading state ends (form becomes enabled again)
- User can fix issues and retry

---

## UI Layout

### Modal Structure

```
┌─────────────────────────────────────┐
│ Crear Nueva Sede                [X] │ ← DialogTitle
├─────────────────────────────────────┤
│ Completa la información básica      │ ← DialogDescription
│ de la sede                          │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Nombre de la sede               │ │
│ │ [Input: Ej: Supermaxi Norte...] │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Dirección                       │ │
│ │ [Textarea: 3 rows]              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Estado de la sede               │ │
│ │ [Select: Seleccionar estado ▼]  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Nivel de riesgo inicial         │ │
│ │ [Select: Seleccionar riesgo ▼]  │ │
│ └─────────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│              [Cancelar]  [Crear]    │ ← DialogFooter
└─────────────────────────────────────┘
```

### Visual Styling

- Dialog width: `max-w-md` (medium, ~28rem)
- Field spacing: `space-y-4`
- Label styling: `text-sm font-medium`
- Error text: `text-xs text-red-500 mt-1`
- Buttons: "Cancelar" uses `variant="outline"`, "Crear" uses default (blue primary)
- Loading button: spinner + "Creando..." text

---

## Close/Cancel Behavior

### Clean close (no data entered)
- User clicks "Cancelar" or X → modal closes immediately
- Form resets to empty state

### Dirty close (data entered)
- If any field has content AND user tries to close:
  - Show confirmation dialog: "¿Descartar cambios?"
  - Options: "Cancelar" (stay in modal) | "Descartar" (close and reset)

### Cannot close during loading
- While loading is true, all close mechanisms are disabled
- Prevents accidental data loss during save

---

## Toast Notifications (Sonner)

### Success Toast
```typescript
toast.success("Sede creada exitosamente", {
  description: location.name,
  duration: 3000,
});
```

### Error Toast
```typescript
toast.error("Error al crear sede", {
  description: error.message,
  duration: 5000,
});
```

**Why sonner?** Already integrated in project, simpler API than alternatives.

---

## Data Flow Details

### On Submit

1. **Collect form data**
   ```typescript
   const formData = {
     company_id: profile.company_id,
     name: nameValue.trim(),
     address: addressValue.trim(),
     status: statusValue,
     risk_level: riskLevelValue,
   };
   ```

2. **Validate client-side**
   - Check all fields non-empty
   - Check length requirements
   - If invalid: set errors state, return early

3. **Call API**
   ```typescript
   setLoading(true);
   try {
     const newLocation = await createLocation(formData);
     toast.success("Sede creada exitosamente");
     onSuccess(newLocation.id); // Parent handles navigation
     onClose(); // Close modal
   } catch (error) {
     toast.error("Error al crear sede", { description: error.message });
   } finally {
     setLoading(false);
   }
   ```

### Supabase Insert

```typescript
const { data, error } = await supabase
  .from('locations')
  .insert({
    company_id: formData.company_id,
    name: formData.name,
    address: formData.address,
    status: formData.status,
    risk_level: formData.risk_level,
  })
  .select()
  .single();
```

- `created_at` and `updated_at` are auto-generated by Supabase (default timestamps)
- `id` is auto-generated (UUID)
- `.select().single()` returns the created row with generated fields

---

## Error Handling

### Validation Errors (client-side)

- Display inline below each field
- Non-blocking (user can see all errors at once)
- Errors clear when user starts editing that field

### Network Errors

- Caught in try-catch around API call
- Displayed via toast notification
- User can retry without losing form data

### Supabase Errors

Common error cases:
- **Auth error:** User not logged in → redirect to login
- **RLS error:** User doesn't have permission → show "Acceso denegado" toast
- **Constraint error:** Unlikely (no unique constraints beyond ID), but show generic error toast
- **Network timeout:** Show "Error de conexión, intenta nuevamente" toast

All errors preserve form state so user can retry.

---

## Testing Considerations

### Manual Testing Checklist

1. **Happy path:**
   - Fill all fields with valid data → click Crear → verify toast, navigation, new sede appears in list

2. **Validation:**
   - Submit empty form → verify all 4 error messages appear
   - Submit with name < 3 chars → verify name error
   - Submit with address < 5 chars → verify address error

3. **Loading state:**
   - Click Crear → verify button changes to "Creando..." with spinner
   - Verify form fields are disabled
   - Verify cannot close modal

4. **Cancel behavior:**
   - Open modal → don't fill anything → click Cancelar → verify closes immediately
   - Open modal → fill fields → click Cancelar → verify confirmation dialog
   - Click "Descartar" in confirmation → verify modal closes and form resets

5. **Error handling:**
   - Simulate network error (disconnect internet) → verify error toast
   - Verify form data is preserved after error
   - Verify can retry after fixing issue

6. **Navigation:**
   - Create sede successfully → verify navigates to `/sedes/{newId}`
   - Verify new sede detail page loads correctly

---

## Implementation Notes

### Dependencies

Already available in project:
- `@/components/ui-v2/dialog` (Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter)
- `@/components/ui-v2/button` (Button)
- `@/components/ui-v2/input` (Input)
- `@/components/ui-v2/textarea` (Textarea)
- `@/components/ui-v2/select` (Select, SelectContent, SelectItem, SelectTrigger, SelectValue)
- `sonner` (toast notifications)
- `react-router-dom` (useNavigate)
- `@/lib/supabase` (supabase client)

No new dependencies needed.

### File Changes Summary

**New files:**
1. `src/features-v2/locations/CreateLocationModal.tsx` (~150-200 lines)

**Modified files:**
1. `src/lib/api/locations.ts` (add `createLocation` function, ~20 lines)
2. `src/features-v2/locations/LocationsListViewV2.tsx` (add modal state and integration, ~15 lines)

**No changes to:**
- Database schema (already correct)
- Types (already defined in database.ts)
- Hooks (useLocations already has refetch, not needed here due to navigation)

---

## Success Criteria

Feature is complete when:
1. ✅ User can open modal from header button
2. ✅ User can open modal from empty state button
3. ✅ All 4 form fields are present and required
4. ✅ Client-side validation works as specified
5. ✅ Form submits data to Supabase correctly
6. ✅ Success shows toast + navigates to detail
7. ✅ Errors show toast + preserve form data
8. ✅ Loading state disables form and shows spinner
9. ✅ Cancel with data shows confirmation dialog
10. ✅ Created location appears in list after navigation back

---

## Future Enhancements (Out of Scope)

Not included in this iteration:
- Duplicate detection (checking if sede with same name exists)
- Address autocomplete (Google Maps API)
- Upload photo/logo for location
- Set GPS coordinates
- Add custom fields per company
- Bulk import locations via CSV

These can be added later without changing current architecture.

---

## Implementation Notes (2026-04-15)

**Completed:**
- Database migration with permit_requirements table and trigger
- Two-stage risk calculation logic in calculateLocationRiskLevel()
- Integration with useLocations hook
- Removed manual risk selection from CreateLocationModal
- All unit tests passing (8/8)
- Integration testing pending

**Migration applied:** `010_permit_requirements.sql`
**Tests:** `src/lib/dashboard-metrics.test.ts`
**Modified files:** 5 files updated

**Next steps:** Manual QA testing in staging, then merge to main.
