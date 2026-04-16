# Automatic Risk Calculation for Locations - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement automatic risk level calculation for locations based on time since creation (0-48h) and permit status (48h+), removing manual risk selection from CreateLocationModal.

**Architecture:** Database trigger creates permits automatically when location is inserted → Frontend calculates risk on-demand using two-stage logic → UI components consume calculated risk level.

**Tech Stack:** PostgreSQL triggers, TypeScript, React hooks, Supabase client, Vitest for testing

---

## File Structure

**New files:**
- `supabase/migrations/010_permit_requirements.sql` - New table + trigger for auto-creating permits
- `src/lib/dashboard-metrics.test.ts` - Tests for risk calculation logic

**Modified files:**
- `src/types/database.ts` - Add `permit_requirements` table types
- `src/lib/dashboard-metrics.ts` - Update `calculateLocationRiskLevel()` with two-stage logic
- `src/hooks/useLocations.ts` - Add risk calculation using `usePermits` hook
- `src/lib/api/locations.ts` - Remove `risk_level` parameter from `createLocation()`
- `src/features-v2/locations/CreateLocationModal.tsx` - Remove risk level field from form

---

## Task 1: Database Migration - permit_requirements Table

**Files:**
- Create: `supabase/migrations/010_permit_requirements.sql`

- [ ] **Step 1: Create migration file**

```sql
-- Tabla de mapeo categoría → permisos requeridos
CREATE TABLE IF NOT EXISTS permit_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_type TEXT NOT NULL,
  permit_type TEXT NOT NULL,
  is_mandatory BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(business_type, permit_type)
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_permit_requirements_business_type ON permit_requirements(business_type);
CREATE INDEX idx_permit_requirements_permit_type ON permit_requirements(permit_type);
```

- [ ] **Step 2: Add seed data for 4 business categories**

```sql
-- Restaurante / Cafetería
INSERT INTO permit_requirements (business_type, permit_type) VALUES
  ('restaurante', 'ruc'),
  ('restaurante', 'patente_municipal'),
  ('restaurante', 'uso_suelo'),
  ('restaurante', 'bomberos'),
  ('restaurante', 'arcsa');

-- Retail General
INSERT INTO permit_requirements (business_type, permit_type) VALUES
  ('retail', 'ruc'),
  ('retail', 'patente_municipal'),
  ('retail', 'uso_suelo'),
  ('retail', 'bomberos');

-- Consultorio / Clínica
INSERT INTO permit_requirements (business_type, permit_type) VALUES
  ('consultorio', 'ruc'),
  ('consultorio', 'patente_municipal'),
  ('consultorio', 'uso_suelo'),
  ('consultorio', 'bomberos'),
  ('consultorio', 'arcsa'),
  ('consultorio', 'permiso_ministerio_salud');

-- Food Truck
INSERT INTO permit_requirements (business_type, permit_type) VALUES
  ('food_truck', 'ruc'),
  ('food_truck', 'patente_municipal'),
  ('food_truck', 'bomberos'),
  ('food_truck', 'arcsa'),
  ('food_truck', 'permiso_movilidad');
```

- [ ] **Step 3: Apply migration using Supabase MCP**

Run: Use `mcp__supabase__apply_migration` tool with migration file path

Expected: Migration applies successfully, `permit_requirements` table created with 20 rows

- [ ] **Step 4: Verify table and data**

Run: Use `mcp__supabase__execute_sql` with query:
```sql
SELECT business_type, COUNT(*) as permit_count 
FROM permit_requirements 
GROUP BY business_type 
ORDER BY business_type;
```

Expected: 4 rows returned (consultorio: 6, food_truck: 5, restaurante: 5, retail: 4)

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/010_permit_requirements.sql
git commit -m "feat(db): add permit_requirements table with business type mappings

- Create permit_requirements table with unique constraint
- Seed 4 business categories: restaurante, retail, consultorio, food_truck
- Add indexes for fast lookups

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Database Trigger - Auto-create Permits

**Files:**
- Modify: `supabase/migrations/010_permit_requirements.sql`

- [ ] **Step 1: Add trigger function to migration**

```sql
-- Función para auto-crear permisos al crear una sede
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
  
  -- Si no encontramos business_type, retornar sin hacer nada
  -- (la sede quedará sin permisos, riesgo crítico después de 48h)
  IF company_business_type IS NULL THEN
    RETURN NEW;
  END IF;
  
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
      status,
      is_active
    ) VALUES (
      NEW.company_id,
      NEW.id,
      permit_req.permit_type,
      'no_registrado',
      true
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

- [ ] **Step 2: Add trigger definition**

```sql
-- Trigger: ejecutar después de INSERT de location
CREATE TRIGGER trigger_auto_create_permits
  AFTER INSERT ON locations
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_location_permits();
```

- [ ] **Step 3: Apply updated migration**

Run: Use `mcp__supabase__apply_migration` with updated file

Expected: Function and trigger created successfully

- [ ] **Step 4: Test trigger manually**

Run: Use `mcp__supabase__execute_sql` with:
```sql
-- Get a valid company_id first
SELECT id, business_type FROM companies LIMIT 1;

-- Insert test location (replace <company_id> with actual ID)
INSERT INTO locations (company_id, name, address, status, risk_level) 
VALUES ('<company_id>', 'Test Location Trigger', 'Test Address', 'operando', 'bajo')
RETURNING id;

-- Verify permits were created (replace <location_id> with returned ID)
SELECT type, status FROM permits WHERE location_id = '<location_id>';

-- Clean up test data
DELETE FROM permits WHERE location_id = '<location_id>';
DELETE FROM locations WHERE id = '<location_id>';
```

Expected: Permits auto-created based on company's business_type, then cleaned up

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/010_permit_requirements.sql
git commit -m "feat(db): add trigger to auto-create permits on location insert

- Create auto_create_location_permits() function
- Add AFTER INSERT trigger on locations table
- Permits created based on company.business_type
- Handle NULL business_type gracefully

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: TypeScript Types for permit_requirements

**Files:**
- Modify: `src/types/database.ts:240-268`

- [ ] **Step 1: Add permit_requirements table type definition**

Add after `public_links` table definition (around line 207):

```typescript
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
```

- [ ] **Step 2: Add helper type export**

Add after line 267 (after existing helper types):

```typescript
export type PermitRequirement = Database['public']['Tables']['permit_requirements']['Row'];
```

- [ ] **Step 3: Verify TypeScript compilation**

Run: `npm run typecheck` or `tsc --noEmit`

Expected: No type errors

- [ ] **Step 4: Commit**

```bash
git add src/types/database.ts
git commit -m "types: add permit_requirements table types

- Add Row, Insert, Update types for permit_requirements
- Export PermitRequirement helper type

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Update calculateLocationRiskLevel() - Tests First

**Files:**
- Create: `src/lib/dashboard-metrics.test.ts`

- [ ] **Step 1: Create test file with mock helpers**

```typescript
import { describe, test, expect } from 'vitest';
import { calculateLocationRiskLevel } from './dashboard-metrics';
import type { Location, Permit } from '@/types/database';

// Helper: Create mock location with specific age
function createMockLocation({ hoursAgo }: { hoursAgo: number }): Location {
  const createdAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  return {
    id: 'test-location-id',
    company_id: 'test-company-id',
    name: 'Test Location',
    address: 'Test Address',
    status: 'operando',
    risk_level: 'bajo', // Will be overwritten by calculation
    created_at: createdAt.toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// Helper: Create mock permit with specific status
function createMockPermit({ 
  status, 
  locationId = 'test-location-id' 
}: { 
  status: 'vigente' | 'por_vencer' | 'vencido' | 'no_registrado';
  locationId?: string;
}): Permit {
  return {
    id: `permit-${Math.random()}`,
    company_id: 'test-company-id',
    location_id: locationId,
    type: 'ruc',
    status,
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

describe('calculateLocationRiskLevel', () => {
  describe('Etapa 1: 0-48 horas sin documentos', () => {
    test('0-24h sin documentos → bajo', () => {});
    test('24-48h sin documentos → medio', () => {});
    test('<48h con documentos → transición a etapa 2', () => {});
  });

  describe('Etapa 2: 48h+ o con documentos', () => {
    test('sin permisos → crítico', () => {});
    test('con permisos faltantes → crítico', () => {});
    test('con permisos vencidos → crítico', () => {});
    test('con permisos por vencer → medio', () => {});
    test('todos vigentes → bajo', () => {});
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test dashboard-metrics.test.ts`

Expected: All tests fail (empty test bodies)

- [ ] **Step 3: Write Stage 1 tests**

```typescript
describe('Etapa 1: 0-48 horas sin documentos', () => {
  test('0-24h sin documentos → bajo', () => {
    const location = createMockLocation({ hoursAgo: 12 });
    const permits = [
      createMockPermit({ status: 'no_registrado' }),
      createMockPermit({ status: 'no_registrado' }),
    ];
    
    expect(calculateLocationRiskLevel(location, permits)).toBe('bajo');
  });

  test('24-48h sin documentos → medio', () => {
    const location = createMockLocation({ hoursAgo: 36 });
    const permits = [
      createMockPermit({ status: 'no_registrado' }),
    ];
    
    expect(calculateLocationRiskLevel(location, permits)).toBe('medio');
  });

  test('<48h con documentos → transición a etapa 2', () => {
    const location = createMockLocation({ hoursAgo: 12 });
    const permits = [
      createMockPermit({ status: 'vigente' }),
      createMockPermit({ status: 'vigente' }),
    ];
    
    // Con documentos subidos, usar lógica de etapa 2
    expect(calculateLocationRiskLevel(location, permits)).toBe('bajo');
  });
});
```

- [ ] **Step 4: Write Stage 2 tests**

```typescript
describe('Etapa 2: 48h+ o con documentos', () => {
  test('sin permisos → crítico', () => {
    const location = createMockLocation({ hoursAgo: 50 });
    const permits: Permit[] = [];
    
    expect(calculateLocationRiskLevel(location, permits)).toBe('critico');
  });

  test('con permisos faltantes → crítico', () => {
    const location = createMockLocation({ hoursAgo: 100 });
    const permits = [
      createMockPermit({ status: 'vigente' }),
      createMockPermit({ status: 'no_registrado' }),
    ];
    
    expect(calculateLocationRiskLevel(location, permits)).toBe('critico');
  });

  test('con permisos vencidos → crítico', () => {
    const location = createMockLocation({ hoursAgo: 100 });
    const permits = [
      createMockPermit({ status: 'vigente' }),
      createMockPermit({ status: 'vencido' }),
    ];
    
    expect(calculateLocationRiskLevel(location, permits)).toBe('critico');
  });

  test('con permisos por vencer → medio', () => {
    const location = createMockLocation({ hoursAgo: 100 });
    const permits = [
      createMockPermit({ status: 'vigente' }),
      createMockPermit({ status: 'por_vencer' }),
    ];
    
    expect(calculateLocationRiskLevel(location, permits)).toBe('medio');
  });

  test('todos vigentes → bajo', () => {
    const location = createMockLocation({ hoursAgo: 100 });
    const permits = [
      createMockPermit({ status: 'vigente' }),
      createMockPermit({ status: 'vigente' }),
      createMockPermit({ status: 'vigente' }),
    ];
    
    expect(calculateLocationRiskLevel(location, permits)).toBe('bajo');
  });
});
```

- [ ] **Step 5: Run tests to verify they fail with correct error**

Run: `npm test dashboard-metrics.test.ts`

Expected: Tests fail because `calculateLocationRiskLevel()` doesn't accept `location` parameter yet

- [ ] **Step 6: Commit tests**

```bash
git add src/lib/dashboard-metrics.test.ts
git commit -m "test: add tests for two-stage risk calculation

- Test Stage 1: time-based risk (0-48h)
- Test Stage 2: permit-based risk (48h+)
- Add mock helpers for Location and Permit

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Update calculateLocationRiskLevel() - Implementation

**Files:**
- Modify: `src/lib/dashboard-metrics.ts:118-135`

- [ ] **Step 1: Update function signature**

Replace existing function (lines 118-135):

```typescript
/**
 * Calculate location risk level based on two stages:
 * - Stage 1 (0-48h): Time-based risk
 * - Stage 2 (48h+): Permit-status-based risk
 */
export function calculateLocationRiskLevel(
  location: Location,
  permits: Permit[]
): RiskLevel {
  const activePermits = permits.filter((p) => p.is_active && p.location_id === location.id);
  const hoursSinceCreation = (Date.now() - new Date(location.created_at).getTime()) / (1000 * 60 * 60);
  
  // STAGE 1: First 48 hours
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
    // If documents uploaded, transition to Stage 2
  }
  
  // STAGE 2: After 48h OR if documents already uploaded
  if (activePermits.length === 0) return 'critico';
  
  const hasVencidos = activePermits.some((p) => p.status === 'vencido');
  const hasFaltantes = activePermits.some((p) => p.status === 'no_registrado');
  const hasPorVencer = activePermits.some((p) => p.status === 'por_vencer');
  
  if (hasVencidos || hasFaltantes) return 'critico';
  if (hasPorVencer) return 'medio';
  
  return 'bajo';
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm test dashboard-metrics.test.ts`

Expected: All 8 tests pass

- [ ] **Step 3: Verify TypeScript compilation**

Run: `npm run typecheck`

Expected: No type errors

- [ ] **Step 4: Commit implementation**

```bash
git add src/lib/dashboard-metrics.ts
git commit -m "feat: implement two-stage risk calculation

- Stage 1 (0-48h): time-based (bajo/medio)
- Stage 2 (48h+): permit-status-based (crítico for missing/expired)
- Early transition if documents uploaded before 48h
- All tests passing

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Update useLocations Hook with Risk Calculation

**Files:**
- Modify: `src/hooks/useLocations.ts:1-44`

- [ ] **Step 1: Add imports**

```typescript
import { useState, useEffect } from 'react';
import { getCompanyLocations, getLocation } from '@/lib/api/locations';
import { usePermits } from '@/hooks/usePermits';
import { calculateLocationRiskLevel } from '@/lib/dashboard-metrics';
import type { Location } from '@/types/database';
```

- [ ] **Step 2: Update useLocations hook with risk calculation**

Replace lines 5-44:

```typescript
export function useLocations(companyId: string | null | undefined) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get permits for risk calculation
  const { permits } = usePermits({ companyId });

  useEffect(() => {
    if (!companyId) {
      setLocations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    getCompanyLocations(companyId)
      .then((data) => {
        // Calculate risk_level on-demand for each location
        const locationsWithRisk = data.map(location => ({
          ...location,
          risk_level: calculateLocationRiskLevel(location, permits),
        }));
        
        setLocations(locationsWithRisk);
        setError(null);
      })
      .catch((err) => {
        console.error('Error fetching locations:', err);
        setError(err.message || 'Failed to fetch locations');
        setLocations([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [companyId, permits]); // Re-calculate when permits change

  return { locations, loading, error, refetch: () => {
    if (companyId) {
      setLoading(true);
      getCompanyLocations(companyId)
        .then((data) => {
          const locationsWithRisk = data.map(location => ({
            ...location,
            risk_level: calculateLocationRiskLevel(location, permits),
          }));
          setLocations(locationsWithRisk);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }};
}
```

- [ ] **Step 3: Verify TypeScript compilation**

Run: `npm run typecheck`

Expected: No type errors

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useLocations.ts
git commit -m "feat: calculate risk level on-demand in useLocations

- Import usePermits hook for permit data
- Calculate risk for each location using calculateLocationRiskLevel()
- Re-calculate when permits change
- Update refetch function with risk calculation

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Remove risk_level Parameter from createLocation API

**Files:**
- Modify: `src/lib/api/locations.ts:58-81`

- [ ] **Step 1: Update createLocation function signature**

Replace lines 58-81:

```typescript
/**
 * Create a new location
 * Note: risk_level is set to 'bajo' by default but will be calculated on-demand
 */
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
      risk_level: 'bajo', // Default value, actual risk calculated on-demand
    })
    .select()
    .single();

  if (error) throw error;
  return location;
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npm run typecheck`

Expected: Type error in CreateLocationModal (expected - will fix next)

- [ ] **Step 3: Commit**

```bash
git add src/lib/api/locations.ts
git commit -m "refactor: remove risk_level parameter from createLocation

- risk_level no longer passed by caller
- Set to 'bajo' by default in database
- Actual risk calculated on-demand by frontend

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Remove Risk Field from CreateLocationModal

**Files:**
- Modify: `src/features-v2/locations/CreateLocationModal.tsx:38-260`

- [ ] **Step 1: Remove riskLevel state (lines 38-41)**

Delete:
```typescript
const [riskLevel, setRiskLevel] = useState<'bajo' | 'medio' | 'alto' | 'critico' | ''>('');
```

- [ ] **Step 2: Remove riskLevel validation (lines 75-78)**

Delete from validate() function:
```typescript
// Validate risk level
if (!riskLevel) {
  newErrors.riskLevel = 'Debes seleccionar un nivel de riesgo';
}
```

- [ ] **Step 3: Remove riskLevel from hasData check (line 50)**

Update:
```typescript
// Before
const hasData = name || address || status || riskLevel;

// After
const hasData = name || address || status;
```

- [ ] **Step 4: Remove riskLevel from API call (lines 93-99)**

Update createLocation call:
```typescript
// Before
const newLocation = await createLocation({
  company_id: companyId,
  name: name.trim(),
  address: address.trim(),
  status: status as 'operando' | 'en_preparacion' | 'cerrado',
  risk_level: riskLevel as 'bajo' | 'medio' | 'alto' | 'critico',
});

// After
const newLocation = await createLocation({
  company_id: companyId,
  name: name.trim(),
  address: address.trim(),
  status: status as 'operando' | 'en_preparacion' | 'cerrado',
});
```

- [ ] **Step 5: Remove riskLevel reset in useEffect (lines 119-130)**

Update reset logic:
```typescript
// Before
setTimeout(() => {
  setName('');
  setAddress('');
  setStatus('');
  setRiskLevel('');
  setErrors({});
  setLoading(false);
}, 200);

// After
setTimeout(() => {
  setName('');
  setAddress('');
  setStatus('');
  setErrors({});
  setLoading(false);
}, 200);
```

- [ ] **Step 6: Remove risk level Select field JSX (lines 234-260)**

Delete entire block:
```typescript
{/* Risk level field */}
<div className="space-y-2">
  <label htmlFor="risk-level" className="text-sm font-medium">
    Nivel de riesgo inicial
  </label>
  <Select
    value={riskLevel}
    onValueChange={(value) => {
      setRiskLevel(value as any);
      clearError('riskLevel');
    }}
    disabled={loading}
  >
    <SelectTrigger id="risk-level">
      <SelectValue placeholder="Seleccionar nivel de riesgo" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="bajo">🟢 Bajo</SelectItem>
      <SelectItem value="medio">🟡 Medio</SelectItem>
      <SelectItem value="alto">🟠 Alto</SelectItem>
      <SelectItem value="critico">🔴 Crítico</SelectItem>
    </SelectContent>
  </Select>
  {errors.riskLevel && (
    <p className="text-xs text-red-500 mt-1">{errors.riskLevel}</p>
  )}
</div>
```

- [ ] **Step 7: Verify TypeScript compilation**

Run: `npm run typecheck`

Expected: No type errors

- [ ] **Step 8: Run dev server and test modal manually**

Run: `npm run dev`

Test:
1. Open app, navigate to locations page
2. Click "Crear Sede" button
3. Verify modal shows only 3 fields: nombre, dirección, estado
4. Fill all fields and submit
5. Verify location created successfully

Expected: Form works, location created with automatic risk calculation

- [ ] **Step 9: Commit**

```bash
git add src/features-v2/locations/CreateLocationModal.tsx
git commit -m "feat: remove manual risk level selection from create location form

- Remove riskLevel state and validation
- Remove risk level Select field from UI
- Update API call to not pass risk_level
- Form now has 3 fields instead of 4

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Integration Testing

**Files:**
- No code changes, manual testing only

- [ ] **Step 1: Test Stage 1 risk calculation (fresh location)**

Manual test:
1. Start dev server: `npm run dev`
2. Create a new location via UI
3. Immediately check dashboard - location should show "bajo" risk
4. Wait 25 hours (simulate with DB update): 
   - `UPDATE locations SET created_at = NOW() - INTERVAL '25 hours' WHERE id = '<location_id>'`
5. Refresh page - location should show "medio" risk

Expected: Stage 1 time-based risk works

- [ ] **Step 2: Test Stage 2 risk calculation (48h+ old location)**

Manual test:
1. Update location to be 50 hours old:
   - `UPDATE locations SET created_at = NOW() - INTERVAL '50 hours' WHERE id = '<location_id>'`
2. Verify all permits are 'no_registrado' status
3. Refresh page - location should show "crítico" risk

Expected: Stage 2 permit-based risk works

- [ ] **Step 3: Test early transition (upload document before 48h)**

Manual test:
1. Create new location (will be <24h old)
2. Upload a document to one permit (change status to 'vigente')
3. Refresh page - should use Stage 2 logic (bajo if all others vigente)

Expected: Early transition to Stage 2 works

- [ ] **Step 4: Test trigger - auto-created permits**

Manual test:
1. Get company_id and business_type from database
2. Create new location via UI
3. Check database for auto-created permits:
   - Query: `SELECT * FROM permits WHERE location_id = '<new_location_id>'`
4. Verify number of permits matches business_type:
   - restaurante: 5 permits
   - retail: 4 permits
   - consultorio: 6 permits
   - food_truck: 5 permits

Expected: Permits auto-created based on company business type

- [ ] **Step 5: Test edge case - business_type not in permit_requirements**

Manual test:
1. Temporarily update company business_type to unsupported value:
   - `UPDATE companies SET business_type = 'unsupported' WHERE id = '<company_id>'`
2. Create new location via UI
3. Verify no permits created
4. Check location risk after 48h - should be crítico (no permits)
5. Restore original business_type

Expected: Graceful handling of unsupported business types

- [ ] **Step 6: Document test results**

Create test summary:
```
INTEGRATION TEST RESULTS
========================

✅ Stage 1 (0-24h): bajo risk confirmed
✅ Stage 1 (24-48h): medio risk confirmed  
✅ Stage 2 (48h+ with missing permits): crítico risk confirmed
✅ Early transition (upload before 48h): works correctly
✅ Auto-created permits: verified for all 4 business types
✅ Edge case (unsupported business_type): handled gracefully

All integration tests passed.
```

---

## Task 10: Update Documentation

**Files:**
- Modify: `docs/superpowers/specs/2026-04-15-create-location-design.md`

- [ ] **Step 1: Mark implementation as complete**

Update "Próximos Pasos" section:

```markdown
## Próximos Pasos

1. ✅ Diseño aprobado
2. ✅ Escribir plan de implementación detallado (writing-plans skill)
3. ✅ Ejecutar implementación (subagent-driven-development o executing-plans)
4. ⏳ Testing manual
5. ⏳ Code review
6. ⏳ Merge a main
```

- [ ] **Step 2: Add implementation notes section**

Add at end of document:

```markdown
---

## Implementation Notes (2026-04-15)

**Completed:**
- Database migration with permit_requirements table and trigger
- Two-stage risk calculation logic in calculateLocationRiskLevel()
- Integration with useLocations hook
- Removed manual risk selection from CreateLocationModal
- All unit tests passing (8/8)
- Integration testing completed

**Migration applied:** `010_permit_requirements.sql`
**Tests:** `src/lib/dashboard-metrics.test.ts`
**Modified files:** 5 files updated

**Next steps:** Manual QA testing in staging, then merge to main.
```

- [ ] **Step 3: Commit documentation update**

```bash
git add docs/superpowers/specs/2026-04-15-create-location-design.md
git commit -m "docs: mark automatic risk calculation as implemented

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ permit_requirements table created (Task 1)
- ✅ Trigger for auto-creating permits (Task 2)
- ✅ TypeScript types updated (Task 3)
- ✅ Two-stage risk calculation logic (Tasks 4-5)
- ✅ useLocations integration (Task 6)
- ✅ createLocation API updated (Task 7)
- ✅ CreateLocationModal simplified (Task 8)
- ✅ Testing (Tasks 4, 9)

**Placeholder scan:**
- ✅ All SQL queries complete and runnable
- ✅ All TypeScript code blocks complete
- ✅ All test cases have full implementations
- ✅ No "TBD", "TODO", or "implement later"

**Type consistency:**
- ✅ `calculateLocationRiskLevel()` signature consistent across all usages
- ✅ `Location` type includes `created_at` field
- ✅ `RiskLevel` type values consistent ('bajo', 'medio', 'alto', 'critico')

---

## Execution Complete

All tasks defined. Ready for execution with:
- **Option 1 (recommended):** superpowers:subagent-driven-development
- **Option 2:** superpowers:executing-plans
