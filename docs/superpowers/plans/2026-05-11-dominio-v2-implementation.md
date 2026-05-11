# EnRegla v2 — Dominio Rediseñado · Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar EnRegla de un tracker con data mock a un producto de compliance operativo — fix del bug de "sin trámites pendientes", factura con costos reales, 10 giros, 5 emisores con datos reales, 8 permisos, roles requeridos, asignación de permits a personas, trazabilidad vía events, y Marco Legal filtrado por giro + matriz pública.

**Architecture:** 9 migraciones SQL atómicas + 2 tablas nuevas (`permit_issuers`, `permit_events`) + seed maestro (~85 filas) + plomería de datos en frontend sin tocar el diseño del dashboard. Los cambios se aplican primero a DB remota via `mcp__supabase__apply_migration` y se commitean como archivos `.sql` en paralelo para version-control parity.

**Tech Stack:** Supabase Postgres (RLS, triggers, pg_cron), React 19 + Vite + TypeScript, React Query, Zustand, Vitest.

**Spec canonical:** `docs/superpowers/specs/2026-05-10-dominio-enregla-v2-design.md`
**Branch:** `feat/dominio-v2` (partiendo de `main` una vez mergeado `audit/pre-production-2026-05-10`).

---

## File Structure

### Nuevos archivos

| Archivo | Responsabilidad |
|---|---|
| `supabase/migrations/20260511000000_issuers_schema.sql` | Crear tabla `permit_issuers` + RLS + seed de 5 emisores |
| `supabase/migrations/20260511000001_business_types_expand.sql` | Ampliar CHECK de `companies.business_type` a 12 valores |
| `supabase/migrations/20260511000002_permit_requirements_fields.sql` | Columnas de costo, multa, rol, issuer_id en `permit_requirements` |
| `supabase/migrations/20260511000003_permits_domain.sql` | `issuer_id` + `assigned_to_profile_id` en `permits` |
| `supabase/migrations/20260511000004_profiles_business_role.sql` | `business_role` en `profiles` + extender trigger |
| `supabase/migrations/20260511000005_permit_events.sql` | Tabla `permit_events` + triggers de auditoría |
| `supabase/migrations/20260511000006_legal_tables_seed.sql` | Migrar marco legal de TS a DB |
| `supabase/migrations/20260511000007_permit_requirements_seed.sql` | Matriz 10×8 con costos y multas reales |
| `src/lib/domain/business-types.ts` | Catálogo de giros + labels UI |
| `src/lib/domain/permit-roles.ts` | Enum de business_role + UI labels + badge colors |
| `src/lib/domain/issuers.ts` | Hook `useIssuers()` y helpers para el catálogo |
| `src/lib/domain/permit-requirements.ts` | Hook `usePermitRequirements()` con filtros por giro |
| `src/hooks/useCompany.ts` | Hook para fetch de la empresa del usuario |
| `src/hooks/usePermitEvents.ts` | Hook para fetch del timeline de events de un permit |
| `src/features/permits/PermitInfoCard.tsx` | Tarjeta nueva con emisor + costo + multa + rol + asignado |
| `src/features/permits/AssigneePicker.tsx` | Dropdown de asignación con warning de rol |
| `src/features/permits/PermitEventsTimeline.tsx` | Render del timeline de eventos |
| `src/features/legal/LegalMatrixView.tsx` | Vista de matriz 10×8 del Marco Legal |
| `src/components/ui/RoleBadge.tsx` | Badge con colores por rol (ALL/RL/CT/TR) |
| `src/components/ui/CostRangeLabel.tsx` | Muestra rango `$X – $Y` o `sin estimar` |

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/features/dashboard/DashboardView.tsx` | Fix bug + suma de costos reales + brandName desde company |
| `src/features/permits/PermitDetailView.tsx` | Insertar `<PermitInfoCard>` y `<PermitEventsTimeline>` |
| `src/features/legal/LegalIndexView.tsx` | Toggle "solo mi giro" + fetch desde DB |
| `src/features/legal/LegalCategoryDetailView.tsx` | Usar hook DB en vez de TS |
| `src/features/legal/LegalPermitDetailView.tsx` | Usar hook DB en vez de TS |
| `src/features/onboarding-incremental/steps/CompanyStep.tsx` | Dropdown con 12 giros |
| `src/types/database.types.ts` | Regenerar tras migraciones |
| `src/App.tsx` | Agregar ruta `/marco-legal/matriz` |

### Archivos a eliminar (al final, task 9)

| Archivo | Razón |
|---|---|
| `src/data/legal-references.ts` | Reemplazado por DB tras migración 6 |

---

## Task 1 · Migración: `permit_issuers` + seed

**Files:**
- Create: `supabase/migrations/20260511000000_issuers_schema.sql`

- [ ] **Step 1.1: Escribir la migración SQL**

Crear `supabase/migrations/20260511000000_issuers_schema.sql`:

```sql
-- Tabla catálogo de emisores de permisos
CREATE TABLE public.permit_issuers (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                   text UNIQUE NOT NULL,
  name                   text NOT NULL,
  short_name             text NOT NULL,
  scope                  text NOT NULL CHECK (scope IN ('nacional','municipal')),
  city                   text,
  portal_url             text,
  procedures_portal_url  text,
  contact_url            text,
  phone                  text,
  address                text,
  notes                  text,
  logo_url               text,
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now()
);

-- RLS: lectura pública, mutación solo service_role (staff)
ALTER TABLE public.permit_issuers ENABLE ROW LEVEL SECURITY;

CREATE POLICY issuers_select ON public.permit_issuers
  FOR SELECT TO anon, authenticated USING (true);

REVOKE INSERT, UPDATE, DELETE ON public.permit_issuers FROM anon, authenticated;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER issuers_set_updated_at
  BEFORE UPDATE ON public.permit_issuers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed con datos reales (scraping del 2026-05-10)
INSERT INTO public.permit_issuers (slug, name, short_name, scope, city, portal_url, phone, address) VALUES
  ('sri',
   'Servicio de Rentas Internas',
   'SRI',
   'nacional',
   NULL,
   'https://www.sri.gob.ec',
   '02 393 6300',
   'Plataforma Gubernamental Financiera, Av. Amazonas entre Unión Nacional de Periodistas y José Villalengua, Quito'),
  ('gad_quito',
   'Gobierno Autónomo Descentralizado del Distrito Metropolitano de Quito',
   'GAD Quito',
   'municipal',
   'Quito',
   'https://www.quito.gob.ec',
   '(593-2) 3952300 · 1800 510 510',
   'Venezuela entre Espejo y Chile, Quito 170101'),
  ('bomberos_quito',
   'Cuerpo de Bomberos del Distrito Metropolitano de Quito',
   'Bomberos Quito',
   'municipal',
   'Quito',
   'https://bomberosquito.gob.ec',
   '102 (emergencia)',
   NULL),
  ('arcsa',
   'Agencia Nacional de Regulación, Control y Vigilancia Sanitaria',
   'ARCSA',
   'nacional',
   NULL,
   'https://www.controlsanitario.gob.ec',
   '+593 4 3727 440',
   'Sede principal Guayaquil; oficina en Quito'),
  ('msp',
   'Ministerio de Salud Pública',
   'MSP',
   'nacional',
   NULL,
   'https://www.salud.gob.ec',
   '(593-2) 381-4400',
   'Av. Quitumbe Ñan y Av. Amaru Ñan, Plataforma Gubernamental Desarrollo Social, Quito CP 170702');

-- URLs secundarias específicas
UPDATE public.permit_issuers SET procedures_portal_url = 'https://servicios.quito.gob.ec/' WHERE slug = 'gad_quito';
UPDATE public.permit_issuers SET procedures_portal_url = 'https://portalat.bomberosquito.gob.ec:8181' WHERE slug = 'bomberos_quito';
UPDATE public.permit_issuers SET procedures_portal_url = 'https://aplicaciones.controlsanitario.gob.ec/' WHERE slug = 'arcsa';
UPDATE public.permit_issuers SET contact_url = 'https://www.quito.gob.ec/?page_id=4451' WHERE slug = 'gad_quito';
UPDATE public.permit_issuers SET contact_url = 'https://www.contactociudadano.gob.ec' WHERE slug = 'arcsa';
```

- [ ] **Step 1.2: Aplicar la migración a prod via MCP**

Usar `mcp__supabase__apply_migration` con `name: "20260511000000_issuers_schema"` y el contenido completo del archivo.

- [ ] **Step 1.3: Verificar que la tabla existe con 5 filas**

Ejecutar: `mcp__supabase__execute_sql` con:
```sql
SELECT count(*) AS n, array_agg(slug ORDER BY slug) AS slugs
FROM public.permit_issuers;
```

Expected: `{n: 5, slugs: ["arcsa","bomberos_quito","gad_quito","msp","sri"]}`

- [ ] **Step 1.4: Verificar RLS leyendo como anon**

Ejecutar:
```sql
SET LOCAL ROLE anon;
SELECT count(*) FROM public.permit_issuers;
```

Expected: `5` (lectura anon funciona).

- [ ] **Step 1.5: Verificar que anon NO puede insertar**

Ejecutar:
```sql
SET LOCAL ROLE anon;
INSERT INTO public.permit_issuers (slug, name, short_name, scope) VALUES ('hack','Hack','H','nacional');
```

Expected: `ERROR: permission denied for table permit_issuers`

- [ ] **Step 1.6: Commit**

```bash
git add supabase/migrations/20260511000000_issuers_schema.sql
git commit -m "feat(db): nueva tabla permit_issuers + seed de 5 emisores reales"
```

---

## Task 2 · Migración: ampliar giros de negocio

**Files:**
- Create: `supabase/migrations/20260511000001_business_types_expand.sql`

- [ ] **Step 2.1: Escribir la migración**

Crear `supabase/migrations/20260511000001_business_types_expand.sql`:

```sql
-- Ampliar business_type de 4 a 12 valores
ALTER TABLE public.companies
  DROP CONSTRAINT IF EXISTS companies_business_type_check;

ALTER TABLE public.companies
  ADD CONSTRAINT companies_business_type_check CHECK (business_type IN (
    'restaurante',
    'retail',
    'food_truck',
    'consultorio',
    'cafeteria',
    'panaderia',
    'bar',
    'farmacia',
    'gimnasio',
    'salon_belleza',
    'oficina',
    'otro'
  ));

COMMENT ON COLUMN public.companies.business_type IS
  'Tipo de negocio. Define permisos aplicables via permit_requirements.business_type.';
```

- [ ] **Step 2.2: Aplicar migración via MCP**

Usar `mcp__supabase__apply_migration` con `name: "20260511000001_business_types_expand"`.

- [ ] **Step 2.3: Verificar constraint**

```sql
-- Debe aceptar el nuevo valor
INSERT INTO public.companies (name, business_type, city) VALUES ('Test Café', 'cafeteria', 'Quito');
-- Limpiar
DELETE FROM public.companies WHERE name = 'Test Café' AND business_type = 'cafeteria';
```

Expected: INSERT succeeds, DELETE succeeds.

- [ ] **Step 2.4: Commit**

```bash
git add supabase/migrations/20260511000001_business_types_expand.sql
git commit -m "feat(db): ampliar business_type a 12 giros (cafeteria, panaderia, bar, farmacia, gimnasio, salon_belleza, oficina, otro)"
```

---

## Task 3 · Migración: campos de costo, multa, rol, issuer en permit_requirements

**Files:**
- Create: `supabase/migrations/20260511000002_permit_requirements_fields.sql`

- [ ] **Step 3.1: Escribir la migración**

Crear `supabase/migrations/20260511000002_permit_requirements_fields.sql`:

```sql
ALTER TABLE public.permit_requirements
  ADD COLUMN issuer_id        uuid REFERENCES public.permit_issuers(id) ON DELETE SET NULL,
  ADD COLUMN required_role    text NOT NULL DEFAULT 'anyone'
    CHECK (required_role IN ('anyone','representante_legal','contador','tecnico_responsable')),
  ADD COLUMN cost_min         numeric(10,2),
  ADD COLUMN cost_max         numeric(10,2),
  ADD COLUMN cost_currency    text DEFAULT 'USD',
  ADD COLUMN cost_notes       text,
  ADD COLUMN cost_updated_at  date,
  ADD COLUMN fine_min         numeric(10,2),
  ADD COLUMN fine_max         numeric(10,2),
  ADD COLUMN fine_source      text,
  ADD COLUMN applies_when     text;

-- Constraint sanity: si hay cost_min también debe haber cost_max y viceversa
ALTER TABLE public.permit_requirements
  ADD CONSTRAINT cost_range_both_or_neither CHECK (
    (cost_min IS NULL AND cost_max IS NULL) OR
    (cost_min IS NOT NULL AND cost_max IS NOT NULL AND cost_min <= cost_max)
  );

ALTER TABLE public.permit_requirements
  ADD CONSTRAINT fine_range_both_or_neither CHECK (
    (fine_min IS NULL AND fine_max IS NULL) OR
    (fine_min IS NOT NULL AND fine_max IS NOT NULL AND fine_min <= fine_max)
  );

-- Índice para lookup rápido por giro
CREATE INDEX IF NOT EXISTS idx_permit_requirements_business_type
  ON public.permit_requirements (business_type);
```

- [ ] **Step 3.2: Aplicar migración via MCP**

Usar `mcp__supabase__apply_migration` con `name: "20260511000002_permit_requirements_fields"`.

- [ ] **Step 3.3: Verificar columnas nuevas**

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema='public' AND table_name='permit_requirements'
  AND column_name IN ('issuer_id','required_role','cost_min','cost_max','fine_min','fine_max','applies_when')
ORDER BY column_name;
```

Expected: 7 filas con los tipos correctos (`uuid`, `text`, `numeric`, `numeric`, `numeric`, `numeric`, `text`).

- [ ] **Step 3.4: Verificar el constraint de rango**

```sql
-- Debe fallar: min > max
INSERT INTO public.permit_requirements (business_type, permit_type, cost_min, cost_max)
VALUES ('restaurante', 'test_bad_range', 200, 100);
```

Expected: `ERROR: new row for relation "permit_requirements" violates check constraint "cost_range_both_or_neither"`

- [ ] **Step 3.5: Commit**

```bash
git add supabase/migrations/20260511000002_permit_requirements_fields.sql
git commit -m "feat(db): campos de costo, multa, rol, issuer en permit_requirements"
```

---

## Task 4 · Migración: domain de permits

**Files:**
- Create: `supabase/migrations/20260511000003_permits_domain.sql`

- [ ] **Step 4.1: Escribir la migración**

Crear `supabase/migrations/20260511000003_permits_domain.sql`:

```sql
ALTER TABLE public.permits
  ADD COLUMN issuer_id              uuid REFERENCES public.permit_issuers(id) ON DELETE SET NULL,
  ADD COLUMN assigned_to_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.permits.issuer IS
  'DEPRECATED: reemplazado por issuer_id. Drop en release posterior.';

COMMENT ON COLUMN public.permits.assigned_to_profile_id IS
  'Persona del equipo asignada a ejecutar el trámite. NULL = sin asignar.';

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_permits_assigned_to
  ON public.permits (assigned_to_profile_id)
  WHERE assigned_to_profile_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_permits_issuer
  ON public.permits (issuer_id);

-- Data migration: mapear issuer string → issuer_id donde se pueda
UPDATE public.permits p
SET issuer_id = pi.id
FROM public.permit_issuers pi
WHERE p.issuer IS NOT NULL
  AND p.issuer_id IS NULL
  AND (
    lower(p.issuer) IN (lower(pi.slug), lower(pi.short_name), lower(pi.name))
    OR (p.issuer = 'Municipio' AND pi.slug = 'gad_quito')
    OR (p.issuer = 'CBomberos' AND pi.slug = 'bomberos_quito')
    OR (p.issuer ILIKE 'Bomberos%' AND pi.slug = 'bomberos_quito')
  );

-- Data cleanup: registros con issuer obsoleto/no aplicable quedan issuer_id = NULL
-- SCPM y CONSEP no son emisores del MVP; se mantiene permits.issuer como string histórico.
```

- [ ] **Step 4.2: Aplicar migración via MCP**

Usar `mcp__supabase__apply_migration` con `name: "20260511000003_permits_domain"`.

- [ ] **Step 4.3: Verificar mapeo de data legacy**

```sql
SELECT p.issuer AS legacy, pi.slug AS mapped, count(*) AS n
FROM public.permits p
LEFT JOIN public.permit_issuers pi ON pi.id = p.issuer_id
GROUP BY p.issuer, pi.slug
ORDER BY n DESC;
```

Expected: "SRI" → `sri`, "ARCSA" → `arcsa`, "Municipio" → `gad_quito`. "SCPM" y "CONSEP" quedan con `mapped = NULL` (correcto).

- [ ] **Step 4.4: Commit**

```bash
git add supabase/migrations/20260511000003_permits_domain.sql
git commit -m "feat(db): permits.issuer_id + permits.assigned_to_profile_id + migración de issuer legacy"
```

---

## Task 5 · Migración: business_role en profiles

**Files:**
- Create: `supabase/migrations/20260511000004_profiles_business_role.sql`

- [ ] **Step 5.1: Escribir la migración**

Crear `supabase/migrations/20260511000004_profiles_business_role.sql`:

```sql
ALTER TABLE public.profiles
  ADD COLUMN business_role text NOT NULL DEFAULT 'empleado'
    CHECK (business_role IN ('empleado','representante_legal','contador','tecnico_responsable'));

COMMENT ON COLUMN public.profiles.business_role IS
  'Rol de negocio del miembro del equipo. Usado para matching con permit_requirements.required_role.';

-- Extender el trigger auto_assign_company_to_profile para setear
-- business_role = 'representante_legal' al primer usuario que crea la company
CREATE OR REPLACE FUNCTION public.auto_assign_company_to_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    UPDATE profiles
    SET company_id = NEW.id,
        role = 'admin',
        business_role = 'representante_legal',
        updated_at = NOW()
    WHERE id = auth.uid()
      AND company_id IS NULL;
  END IF;
  RETURN NEW;
END;
$$;
```

- [ ] **Step 5.2: Aplicar migración via MCP**

Usar `mcp__supabase__apply_migration` con `name: "20260511000004_profiles_business_role"`.

- [ ] **Step 5.3: Verificar existing profiles**

```sql
SELECT business_role, count(*) FROM public.profiles GROUP BY business_role;
```

Expected: todos los profiles existentes en `empleado` (default); el demo user Danilo pasa a `empleado` también (se actualiza manual si hace falta).

- [ ] **Step 5.4: Setear demo user como RL (opcional, data de prueba)**

```sql
UPDATE public.profiles
SET business_role = 'representante_legal'
WHERE id = '4bb8066b-0807-4eb7-81a8-29436b6875ea';
```

- [ ] **Step 5.5: Commit**

```bash
git add supabase/migrations/20260511000004_profiles_business_role.sql
git commit -m "feat(db): profiles.business_role + trigger asigna RL al crear company"
```

---

## Task 6 · Migración: tabla `permit_events` + triggers de auditoría

**Files:**
- Create: `supabase/migrations/20260511000005_permit_events.sql`

- [ ] **Step 6.1: Escribir la migración**

Crear `supabase/migrations/20260511000005_permit_events.sql`:

```sql
CREATE TABLE public.permit_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_id   uuid NOT NULL REFERENCES public.permits(id) ON DELETE CASCADE,
  actor_id    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type  text NOT NULL CHECK (event_type IN (
    'created',
    'status_changed',
    'document_uploaded',
    'document_deleted',
    'assigned',
    'unassigned',
    'renewed',
    'dates_updated'
  )),
  from_value  text,
  to_value    text,
  metadata    jsonb,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_permit_events_permit_created
  ON public.permit_events (permit_id, created_at DESC);

-- RLS: mismo company scoping que permits
ALTER TABLE public.permit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY permit_events_select ON public.permit_events
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.permits p
    WHERE p.id = permit_events.permit_id
      AND (
        p.company_id = '50707999-f033-41c4-91c9-989966311972'::uuid
        OR p.company_id IN (SELECT company_id FROM public.profiles WHERE id = (SELECT auth.uid()))
      )
  ));

CREATE POLICY permit_events_select_anon_demo ON public.permit_events
  FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM public.permits p
    WHERE p.id = permit_events.permit_id
      AND p.company_id = '50707999-f033-41c4-91c9-989966311972'::uuid
  ));

-- Writes: se hacen vía triggers (SECURITY DEFINER). Nadie puede escribir directo.
REVOKE INSERT, UPDATE, DELETE ON public.permit_events FROM anon, authenticated;

-- Trigger de permits: dispara status_changed, assigned, unassigned, dates_updated
CREATE OR REPLACE FUNCTION public.log_permit_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  actor uuid := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO permit_events (permit_id, actor_id, event_type, to_value)
    VALUES (NEW.id, actor, 'created', NEW.status);
    RETURN NEW;
  END IF;

  -- UPDATE: detectar cambios relevantes
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO permit_events (permit_id, actor_id, event_type, from_value, to_value)
    VALUES (NEW.id, actor, 'status_changed', OLD.status, NEW.status);
  END IF;

  IF NEW.assigned_to_profile_id IS DISTINCT FROM OLD.assigned_to_profile_id THEN
    IF NEW.assigned_to_profile_id IS NULL THEN
      INSERT INTO permit_events (permit_id, actor_id, event_type, from_value)
      VALUES (NEW.id, actor, 'unassigned', OLD.assigned_to_profile_id::text);
    ELSE
      INSERT INTO permit_events (permit_id, actor_id, event_type, from_value, to_value)
      VALUES (NEW.id, actor, 'assigned',
              OLD.assigned_to_profile_id::text,
              NEW.assigned_to_profile_id::text);
    END IF;
  END IF;

  IF NEW.expiry_date IS DISTINCT FROM OLD.expiry_date
     OR NEW.issue_date IS DISTINCT FROM OLD.issue_date THEN
    INSERT INTO permit_events (permit_id, actor_id, event_type, metadata)
    VALUES (NEW.id, actor, 'dates_updated',
            jsonb_build_object(
              'issue_date_from', OLD.issue_date,
              'issue_date_to',   NEW.issue_date,
              'expiry_date_from', OLD.expiry_date,
              'expiry_date_to',   NEW.expiry_date
            ));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS permits_log_event ON public.permits;
CREATE TRIGGER permits_log_event
  AFTER INSERT OR UPDATE ON public.permits
  FOR EACH ROW EXECUTE FUNCTION public.log_permit_event();

-- Trigger de documents: dispara document_uploaded, document_deleted
CREATE OR REPLACE FUNCTION public.log_document_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  actor uuid := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO permit_events (permit_id, actor_id, event_type, to_value, metadata)
    VALUES (NEW.permit_id, actor, 'document_uploaded', NEW.file_name,
            jsonb_build_object('document_id', NEW.id, 'file_size', NEW.file_size));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO permit_events (permit_id, actor_id, event_type, from_value, metadata)
    VALUES (OLD.permit_id, actor, 'document_deleted', OLD.file_name,
            jsonb_build_object('document_id', OLD.id));
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS documents_log_event ON public.documents;
CREATE TRIGGER documents_log_event
  AFTER INSERT OR DELETE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.log_document_event();
```

- [ ] **Step 6.2: Aplicar migración via MCP**

Usar `mcp__supabase__apply_migration` con `name: "20260511000005_permit_events"`.

- [ ] **Step 6.3: Verificar que el trigger dispara**

```sql
-- Tomar un permit del demo
WITH test_permit AS (
  SELECT id FROM permits WHERE company_id = '50707999-f033-41c4-91c9-989966311972' LIMIT 1
)
UPDATE permits SET status = status WHERE id IN (SELECT id FROM test_permit);
-- Ahora cambio real
WITH test_permit AS (
  SELECT id, status FROM permits WHERE company_id = '50707999-f033-41c4-91c9-989966311972' LIMIT 1
)
UPDATE permits p
SET status = CASE WHEN tp.status = 'vigente' THEN 'por_vencer' ELSE 'vigente' END
FROM test_permit tp WHERE p.id = tp.id;

-- Verificar
SELECT event_type, from_value, to_value
FROM permit_events
WHERE permit_id IN (SELECT id FROM permits WHERE company_id = '50707999-f033-41c4-91c9-989966311972' LIMIT 1)
ORDER BY created_at DESC LIMIT 5;
```

Expected: al menos 1 evento `status_changed` visible.

- [ ] **Step 6.4: Commit**

```bash
git add supabase/migrations/20260511000005_permit_events.sql
git commit -m "feat(db): tabla permit_events + triggers de auditoría en permits y documents"
```

---

## Task 7 · Migración: poblar tablas legales desde TS

**Files:**
- Create: `supabase/migrations/20260511000006_legal_tables_seed.sql`
- Read (reference only): `src/data/legal-references.ts`

Esta migración es la más larga — traduce la data de `src/data/legal-references.ts` a SQL. El engineer ejecutando este task debe abrir ese archivo TS y copiar los textos literales a INSERTS.

- [ ] **Step 7.1: Leer `src/data/legal-references.ts` completo**

Objetivo: identificar todos los `permit_type`, sus `description`, `frequency_basis`, `estimated_cost`, `disclaimer`, `applies_to`, `business_categories`, `government_portal_url`, y sus tablas hijas (`sources`, `consequences`, `required_documents`, `process_steps`).

- [ ] **Step 7.2: Escribir la migración con INSERTs reales**

Crear `supabase/migrations/20260511000006_legal_tables_seed.sql`:

```sql
-- Limpia por si hay restos previos (hoy están vacías, pero idempotente)
DELETE FROM public.legal_process_steps;
DELETE FROM public.legal_required_documents;
DELETE FROM public.legal_consequences;
DELETE FROM public.legal_sources;
DELETE FROM public.legal_references;

-- Nota: los textos "FILL_FROM_TS_..." deben reemplazarse con el contenido
-- exacto del archivo src/data/legal-references.ts. Ver step 7.1.

-- PERMIT: RUC
INSERT INTO public.legal_references (permit_type, description, frequency_basis, estimated_cost, disclaimer, applies_to, business_categories, government_portal_url, government_portal_name)
VALUES (
  'ruc',
  'El Registro Único de Contribuyentes (RUC) es el número de identificación tributaria para personas naturales y jurídicas en Ecuador. Es requisito previo para toda actividad económica formal y para la obtención de otros permisos.',
  'Obligatorio al inicio y actualización en cada cambio',
  'Sin costo',
  NULL,
  ARRAY['Personas naturales con actividad económica','Personas jurídicas','Sociedades de hecho'],
  ARRAY['restaurante','retail','food_truck','consultorio','cafeteria','panaderia','bar','farmacia','gimnasio','salon_belleza','oficina','otro'],
  'https://www.sri.gob.ec',
  'Servicio de Rentas Internas'
);

-- Luego insertar sources, consequences, required_documents, process_steps por permiso
-- Usando el patrón:
WITH ref AS (SELECT id FROM public.legal_references WHERE permit_type = 'ruc')
INSERT INTO public.legal_sources (legal_reference_id, name, short_name, type, articles, url, entity, scope, display_order)
VALUES
  ((SELECT id FROM ref),
   'Ley del Registro Único de Contribuyentes',
   'Ley RUC',
   'ley_organica',
   'Art. 1–3 (obligación de inscripción); Art. 9 (actualización de información)',
   'https://www.sri.gob.ec',
   'Servicio de Rentas Internas (SRI)',
   'nacional',
   1);

-- Repetir patrón para cada permit_type: ruc, patente_municipal, uso_suelo,
-- rotulacion, bomberos, arcsa (y añadir los nuevos: luae, msp si están en el TS).
-- El código fuente tiene ~400 líneas de datos legales, esta migración tendrá ~800 líneas SQL.
-- El engineer debe traducir fielmente.
```

**Nota operativa:** esta migración se genera mecánicamente leyendo el TS. Si el engineer prefiere scriptear la generación, puede:
1. Escribir un script Node en `scripts/generate-legal-seed.ts` que lee el TS, evalúa el objeto, y escupe el SQL.
2. Commitear el script + la migración generada.

Por brevedad el plan no copia las ~800 líneas SQL aquí. El criterio de "DONE" es: cada `permit_type` del TS aparece en `legal_references` con exactamente los mismos strings, y sus tablas hijas también.

- [ ] **Step 7.3: Aplicar migración via MCP**

Usar `mcp__supabase__apply_migration` con `name: "20260511000006_legal_tables_seed"`.

- [ ] **Step 7.4: Verificar paridad TS ↔ DB**

```sql
SELECT permit_type, length(description) AS desc_len,
       array_length(business_categories, 1) AS n_categories
FROM public.legal_references
ORDER BY permit_type;
```

Esperado: mínimo 6 filas (ruc, patente_municipal, uso_suelo, rotulacion, bomberos, arcsa). Si agregaste `luae` y `msp`, 8.

- [ ] **Step 7.5: Commit**

```bash
git add supabase/migrations/20260511000006_legal_tables_seed.sql scripts/generate-legal-seed.ts
git commit -m "feat(db): migrar marco legal de src/data/legal-references.ts a tablas DB"
```

---

## Task 8 · Migración: seed de matriz permit_requirements (10×8)

**Files:**
- Create: `supabase/migrations/20260511000007_permit_requirements_seed.sql`

- [ ] **Step 8.1: Escribir la migración con matriz completa**

Crear `supabase/migrations/20260511000007_permit_requirements_seed.sql`:

```sql
-- Limpia seed previo (20 filas actuales con formato viejo)
DELETE FROM public.permit_requirements;

-- Matriz 10×8. Formato:
--   (business_type, permit_type, is_mandatory, issuer_slug, required_role,
--    cost_min, cost_max, cost_notes, cost_updated_at,
--    fine_min, fine_max, fine_source, applies_when)
-- El issuer_id se resuelve con subquery a permit_issuers.

-- Helpers
DO $$
DECLARE
  sri_id            uuid := (SELECT id FROM permit_issuers WHERE slug='sri');
  gad_quito_id      uuid := (SELECT id FROM permit_issuers WHERE slug='gad_quito');
  bomberos_id       uuid := (SELECT id FROM permit_issuers WHERE slug='bomberos_quito');
  arcsa_id          uuid := (SELECT id FROM permit_issuers WHERE slug='arcsa');
  msp_id            uuid := (SELECT id FROM permit_issuers WHERE slug='msp');
BEGIN

-- RUC (aplica a todos los giros)
INSERT INTO permit_requirements (business_type, permit_type, is_mandatory, issuer_id, required_role,
  cost_min, cost_max, cost_currency, cost_notes, cost_updated_at,
  fine_min, fine_max, fine_source)
SELECT bt, 'ruc', true, sri_id, 'representante_legal',
       0, 0, 'USD', 'Gratuito', '2026-01-01'::date,
       30, 1500, 'Ley RUC Art. 10 — multa por no inscripción o actualización'
FROM unnest(ARRAY['restaurante','retail','food_truck','consultorio','cafeteria','panaderia','bar','farmacia','gimnasio','salon_belleza','oficina','otro']) AS bt;

-- Patente municipal (aplica a todos)
INSERT INTO permit_requirements (business_type, permit_type, is_mandatory, issuer_id, required_role,
  cost_min, cost_max, cost_currency, cost_notes, cost_updated_at,
  fine_min, fine_max, fine_source)
SELECT bt, 'patente_municipal', true, gad_quito_id, 'anyone',
       25, 25000, 'USD', 'Varía por patrimonio declarado: 1.5 por mil hasta máx 25.000', '2026-01-01'::date,
       100, 500, 'Código Municipal Art. 26 — multa por no pago anual'
FROM unnest(ARRAY['restaurante','retail','food_truck','consultorio','cafeteria','panaderia','bar','farmacia','gimnasio','salon_belleza','oficina','otro']) AS bt;

-- Uso de suelo (todos menos food_truck)
INSERT INTO permit_requirements (business_type, permit_type, is_mandatory, issuer_id, required_role,
  cost_min, cost_max, cost_currency, cost_notes, cost_updated_at)
SELECT bt, 'uso_suelo', true, gad_quito_id, 'representante_legal',
       50, 200, 'USD', 'Varía por zona y metros cuadrados', '2026-01-01'::date
FROM unnest(ARRAY['restaurante','retail','consultorio','cafeteria','panaderia','bar','farmacia','gimnasio','salon_belleza','oficina','otro']) AS bt;

-- LUAE (todos, food_truck opcional)
INSERT INTO permit_requirements (business_type, permit_type, is_mandatory, issuer_id, required_role,
  cost_min, cost_max, cost_currency, cost_updated_at,
  fine_min, fine_max, fine_source)
SELECT bt, 'luae', true, gad_quito_id, 'representante_legal',
       120, 120, 'USD', '2026-01-01'::date,
       200, 1000, 'Ordenanza Metropolitana de LUAE — multa por no obtener/renovar'
FROM unnest(ARRAY['restaurante','retail','consultorio','cafeteria','panaderia','bar','farmacia','gimnasio','salon_belleza','oficina','otro']) AS bt;

INSERT INTO permit_requirements (business_type, permit_type, is_mandatory, issuer_id, required_role,
  cost_min, cost_max, cost_currency, cost_notes, cost_updated_at)
VALUES ('food_truck', 'luae', false, gad_quito_id, 'representante_legal',
        120, 120, 'USD', 'Aplicable según ordenanza vigente', '2026-01-01'::date);

-- Bomberos (aplica a todos)
INSERT INTO permit_requirements (business_type, permit_type, is_mandatory, issuer_id, required_role,
  cost_min, cost_max, cost_currency, cost_updated_at,
  fine_min, fine_max, fine_source)
SELECT bt, 'bomberos', true, bomberos_id, 'anyone',
       50, 200, 'USD', '2026-01-01'::date,
       100, 500, 'Reglamento Prevención Incendios — multa por no permiso'
FROM unnest(ARRAY['restaurante','retail','food_truck','consultorio','cafeteria','panaderia','bar','farmacia','gimnasio','salon_belleza','oficina','otro']) AS bt;

-- ARCSA (aplica a food + farmacia; opcional consultorio + salón)
INSERT INTO permit_requirements (business_type, permit_type, is_mandatory, issuer_id, required_role,
  cost_min, cost_max, cost_currency, cost_updated_at,
  fine_min, fine_max, fine_source)
SELECT bt, 'arcsa', true, arcsa_id, 'tecnico_responsable',
       40, 100, 'USD', '2026-01-01'::date,
       500, 5000, 'Ley de Vigilancia Sanitaria Art. 147 — multas por infracciones'
FROM unnest(ARRAY['restaurante','food_truck','cafeteria','panaderia','bar','farmacia']) AS bt;

INSERT INTO permit_requirements (business_type, permit_type, is_mandatory, issuer_id, required_role,
  cost_min, cost_max, cost_currency, cost_notes, cost_updated_at)
SELECT bt, 'arcsa', false, arcsa_id, 'tecnico_responsable',
       40, 100, 'USD', 'Requerido si se venden productos con registro sanitario', '2026-01-01'::date
FROM unnest(ARRAY['consultorio','salon_belleza']) AS bt;

-- Rotulación (condicional — applies_when no NULL, is_mandatory=false)
INSERT INTO permit_requirements (business_type, permit_type, is_mandatory, issuer_id, required_role,
  cost_min, cost_max, cost_currency, cost_updated_at, applies_when)
SELECT bt, 'rotulacion', false, gad_quito_id, 'anyone',
       30, 150, 'USD', '2026-01-01'::date,
       'Requerido si el local tiene letrero o rótulo exterior'
FROM unnest(ARRAY['restaurante','retail','consultorio','cafeteria','panaderia','bar','farmacia','gimnasio','salon_belleza','oficina','otro']) AS bt;

-- Permiso MSP (consultorio, farmacia obligatorio; gimnasio, salón opcional)
INSERT INTO permit_requirements (business_type, permit_type, is_mandatory, issuer_id, required_role,
  cost_min, cost_max, cost_currency, cost_updated_at,
  fine_min, fine_max, fine_source)
SELECT bt, 'msp', true, msp_id, 'tecnico_responsable',
       60, 150, 'USD', '2026-01-01'::date,
       500, 3000, 'Ley Orgánica de Salud Art. 6 — sanciones por funcionamiento sin permiso'
FROM unnest(ARRAY['consultorio','farmacia']) AS bt;

INSERT INTO permit_requirements (business_type, permit_type, is_mandatory, issuer_id, required_role,
  cost_min, cost_max, cost_currency, cost_notes, cost_updated_at)
SELECT bt, 'msp', false, msp_id, 'tecnico_responsable',
       60, 150, 'USD', 'Requerido si se ofrecen servicios de salud', '2026-01-01'::date
FROM unnest(ARRAY['gimnasio','salon_belleza']) AS bt;

END $$;
```

- [ ] **Step 8.2: Aplicar migración via MCP**

Usar `mcp__supabase__apply_migration` con `name: "20260511000007_permit_requirements_seed"`.

- [ ] **Step 8.3: Verificar conteos**

```sql
SELECT count(*) AS total FROM permit_requirements;
SELECT permit_type, count(*) AS giros FROM permit_requirements GROUP BY permit_type ORDER BY permit_type;
```

Expected: total ~85 filas. RUC, patente, bomberos en 12; uso_suelo en 11; LUAE en 11 (10 + 1 food_truck opcional); ARCSA en 8; rotulacion en 11; msp en 4.

- [ ] **Step 8.4: Verificar referencias correctas**

```sql
SELECT pr.business_type, pr.permit_type, pi.short_name AS issuer, pr.required_role, pr.cost_min, pr.cost_max
FROM permit_requirements pr
JOIN permit_issuers pi ON pi.id = pr.issuer_id
WHERE pr.business_type = 'farmacia'
ORDER BY pr.permit_type;
```

Expected: RUC (SRI, RL), bomberos (Bomberos, ALL), LUAE (GAD, RL), ARCSA (ARCSA, TR), MSP (MSP, TR), patente (GAD, ALL), rotulación (GAD, ALL), uso_suelo (GAD, RL).

- [ ] **Step 8.5: Commit**

```bash
git add supabase/migrations/20260511000007_permit_requirements_seed.sql
git commit -m "feat(db): seed de matriz permit_requirements (10 giros × 8 permisos) con costos y multas reales"
```

---

## Task 9 · Frontend: catálogos de dominio

**Files:**
- Create: `src/lib/domain/business-types.ts`
- Create: `src/lib/domain/permit-roles.ts`
- Create: `src/lib/domain/issuers.ts`
- Create: `src/lib/domain/permit-requirements.ts`
- Create: `src/lib/__tests__/business-types.test.ts`

- [ ] **Step 9.1: Regenerar tipos Supabase**

Desde la raíz del repo:

```bash
npx supabase gen types typescript --linked > src/types/database.types.ts
```

Si no hay Supabase CLI instalado: pedir al usuario que regenere vía dashboard y pegue el contenido.

- [ ] **Step 9.2: Escribir test para business-types**

Crear `src/lib/__tests__/business-types.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { BUSINESS_TYPES, businessTypeLabel, BusinessType } from '@/lib/domain/business-types';

describe('BUSINESS_TYPES', () => {
  it('exports 12 types including "otro"', () => {
    expect(BUSINESS_TYPES).toHaveLength(12);
    expect(BUSINESS_TYPES.includes('otro')).toBe(true);
  });

  it('maps every type to a label', () => {
    for (const t of BUSINESS_TYPES) {
      expect(businessTypeLabel(t)).toBeTruthy();
      expect(businessTypeLabel(t)).not.toEqual(t); // not just the slug back
    }
  });

  it('businessTypeLabel returns slug for unknown value', () => {
    expect(businessTypeLabel('foo' as BusinessType)).toEqual('foo');
  });
});
```

- [ ] **Step 9.3: Correr el test — debe FAIL**

```bash
npm test -- --run src/lib/__tests__/business-types.test.ts
```

Expected: FAIL "Cannot find module '@/lib/domain/business-types'".

- [ ] **Step 9.4: Implementar business-types**

Crear `src/lib/domain/business-types.ts`:

```ts
export const BUSINESS_TYPES = [
  'restaurante',
  'retail',
  'food_truck',
  'consultorio',
  'cafeteria',
  'panaderia',
  'bar',
  'farmacia',
  'gimnasio',
  'salon_belleza',
  'oficina',
  'otro',
] as const;

export type BusinessType = typeof BUSINESS_TYPES[number];

const LABELS: Record<BusinessType, string> = {
  restaurante: 'Restaurante',
  retail: 'Retail / Tienda',
  food_truck: 'Food truck',
  consultorio: 'Consultorio médico',
  cafeteria: 'Cafetería',
  panaderia: 'Panadería',
  bar: 'Bar / Discoteca',
  farmacia: 'Farmacia',
  gimnasio: 'Gimnasio',
  salon_belleza: 'Salón de belleza',
  oficina: 'Oficina profesional',
  otro: 'Otro',
};

export function businessTypeLabel(t: string): string {
  return LABELS[t as BusinessType] ?? t;
}
```

- [ ] **Step 9.5: Correr test — debe PASS**

```bash
npm test -- --run src/lib/__tests__/business-types.test.ts
```

Expected: PASS.

- [ ] **Step 9.6: Implementar permit-roles**

Crear `src/lib/domain/permit-roles.ts`:

```ts
export type BusinessRole =
  | 'empleado'
  | 'representante_legal'
  | 'contador'
  | 'tecnico_responsable';

export type RequiredRole =
  | 'anyone'
  | 'representante_legal'
  | 'contador'
  | 'tecnico_responsable';

export const BUSINESS_ROLE_LABELS: Record<BusinessRole, string> = {
  empleado: 'Empleado',
  representante_legal: 'Representante Legal',
  contador: 'Contador',
  tecnico_responsable: 'Técnico Responsable',
};

export const REQUIRED_ROLE_LABELS: Record<RequiredRole, string> = {
  anyone: 'Cualquier miembro',
  representante_legal: 'Representante Legal',
  contador: 'Contador',
  tecnico_responsable: 'Técnico Responsable',
};

export const REQUIRED_ROLE_SHORT: Record<RequiredRole, string> = {
  anyone: 'ALL',
  representante_legal: 'RL',
  contador: 'CT',
  tecnico_responsable: 'TR',
};

/** Devuelve true si el usuario con businessRole puede ejecutar un permit que requiere requiredRole. */
export function roleMatches(businessRole: BusinessRole, requiredRole: RequiredRole): boolean {
  if (requiredRole === 'anyone') return true;
  return (businessRole as string) === (requiredRole as string);
}
```

- [ ] **Step 9.7: Implementar hook de issuers**

Crear `src/lib/domain/issuers.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Issuer {
  id: string;
  slug: string;
  name: string;
  short_name: string;
  scope: 'nacional' | 'municipal';
  city: string | null;
  portal_url: string | null;
  procedures_portal_url: string | null;
  contact_url: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  logo_url: string | null;
}

export function useIssuers() {
  return useQuery({
    queryKey: ['permit_issuers'],
    queryFn: async (): Promise<Issuer[]> => {
      const { data, error } = await supabase
        .from('permit_issuers')
        .select('*')
        .order('short_name');
      if (error) throw new Error(error.message);
      return (data as unknown as Issuer[]) ?? [];
    },
    staleTime: 60 * 60 * 1000, // 1h
  });
}

export function useIssuer(issuerId: string | null | undefined) {
  const { data: issuers } = useIssuers();
  if (!issuerId) return null;
  return issuers?.find(i => i.id === issuerId) ?? null;
}
```

- [ ] **Step 9.8: Implementar hook de permit-requirements**

Crear `src/lib/domain/permit-requirements.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { BusinessType } from './business-types';
import type { RequiredRole } from './permit-roles';

export interface PermitRequirement {
  id: string;
  business_type: BusinessType;
  permit_type: string;
  is_mandatory: boolean;
  issuer_id: string | null;
  required_role: RequiredRole;
  cost_min: number | null;
  cost_max: number | null;
  cost_currency: string | null;
  cost_notes: string | null;
  cost_updated_at: string | null;
  fine_min: number | null;
  fine_max: number | null;
  fine_source: string | null;
  applies_when: string | null;
}

export function usePermitRequirements(businessType?: BusinessType | null) {
  return useQuery({
    queryKey: ['permit_requirements', businessType ?? 'all'],
    queryFn: async (): Promise<PermitRequirement[]> => {
      let query = supabase.from('permit_requirements').select('*');
      if (businessType) query = query.eq('business_type', businessType);
      const { data, error } = await query.order('permit_type');
      if (error) throw new Error(error.message);
      return (data as unknown as PermitRequirement[]) ?? [];
    },
    staleTime: 30 * 60 * 1000, // 30 min
  });
}

/** Lookup por tipo de permit + giro. Útil en PermitDetailView para traer costo y rol. */
export function useRequirementFor(permitType: string, businessType: BusinessType | null | undefined) {
  const { data } = usePermitRequirements(businessType ?? undefined);
  return data?.find(r => r.permit_type === permitType) ?? null;
}
```

- [ ] **Step 9.9: Correr todos los tests**

```bash
npm test -- --run
npx tsc -b config/tsconfig.json --noEmit
```

Expected: tests pass, typecheck clean.

- [ ] **Step 9.10: Commit**

```bash
git add src/lib/domain/ src/lib/__tests__/business-types.test.ts src/types/database.types.ts
git commit -m "feat(domain): catálogos de business-types, permit-roles, issuers, permit-requirements"
```

---

## Task 10 · Frontend: hooks de company, events y componentes UI

**Files:**
- Create: `src/hooks/useCompany.ts`
- Create: `src/hooks/usePermitEvents.ts`
- Create: `src/components/ui/RoleBadge.tsx`
- Create: `src/components/ui/CostRangeLabel.tsx`

- [ ] **Step 10.1: Implementar useCompany**

Crear `src/hooks/useCompany.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { BusinessType } from '@/lib/domain/business-types';

export interface Company {
  id: string;
  name: string;
  business_type: BusinessType;
  city: string | null;
  ruc: string | null;
}

export function useCompany(companyId: string | null | undefined) {
  return useQuery({
    queryKey: ['company', companyId],
    queryFn: async (): Promise<Company | null> => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, business_type, city, ruc')
        .eq('id', companyId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as Company | null;
    },
    enabled: !!companyId,
    staleTime: 10 * 60 * 1000, // 10 min
  });
}
```

- [ ] **Step 10.2: Implementar usePermitEvents**

Crear `src/hooks/usePermitEvents.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type EventType =
  | 'created'
  | 'status_changed'
  | 'document_uploaded'
  | 'document_deleted'
  | 'assigned'
  | 'unassigned'
  | 'renewed'
  | 'dates_updated';

export interface PermitEvent {
  id: string;
  permit_id: string;
  actor_id: string | null;
  event_type: EventType;
  from_value: string | null;
  to_value: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export function usePermitEvents(permitId: string | null | undefined) {
  return useQuery({
    queryKey: ['permit_events', permitId],
    queryFn: async (): Promise<PermitEvent[]> => {
      if (!permitId) return [];
      const { data, error } = await supabase
        .from('permit_events')
        .select('*')
        .eq('permit_id', permitId)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data as unknown as PermitEvent[]) ?? [];
    },
    enabled: !!permitId,
    staleTime: 30 * 1000,
  });
}
```

- [ ] **Step 10.3: Implementar RoleBadge**

Crear `src/components/ui/RoleBadge.tsx`:

```tsx
import type { RequiredRole } from '@/lib/domain/permit-roles';
import { REQUIRED_ROLE_LABELS, REQUIRED_ROLE_SHORT } from '@/lib/domain/permit-roles';
import { cn } from '@/lib/utils';

interface RoleBadgeProps {
  role: RequiredRole;
  variant?: 'full' | 'short';
  className?: string;
}

const COLOR_BY_ROLE: Record<RequiredRole, string> = {
  anyone: 'bg-[var(--ds-neutral-100)] text-[var(--ds-text-subtle)]',
  representante_legal: 'bg-blue-100 text-blue-700',
  contador: 'bg-teal-100 text-teal-800',
  tecnico_responsable: 'bg-amber-100 text-amber-800',
};

export function RoleBadge({ role, variant = 'short', className }: RoleBadgeProps) {
  const label = variant === 'short' ? REQUIRED_ROLE_SHORT[role] : REQUIRED_ROLE_LABELS[role];
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold tracking-wide',
        COLOR_BY_ROLE[role],
        className
      )}
      title={REQUIRED_ROLE_LABELS[role]}
    >
      {label}
    </span>
  );
}
```

- [ ] **Step 10.4: Implementar CostRangeLabel**

Crear `src/components/ui/CostRangeLabel.tsx`:

```tsx
import { cn } from '@/lib/utils';

interface CostRangeLabelProps {
  min: number | null | undefined;
  max: number | null | undefined;
  currency?: string;
  className?: string;
  emptyLabel?: string;
}

export function CostRangeLabel({ min, max, currency = 'USD', className, emptyLabel = 'sin estimar' }: CostRangeLabelProps) {
  const symbol = currency === 'USD' ? '$' : currency + ' ';
  if (min == null && max == null) {
    return <span className={cn('text-[var(--ds-text-subtlest)] italic', className)}>{emptyLabel}</span>;
  }
  if (min === 0 && max === 0) {
    return <span className={cn('text-[var(--ds-text)] font-medium', className)}>Gratuito</span>;
  }
  if (min === max) {
    return <span className={cn('text-[var(--ds-text)] font-medium tabular-nums', className)}>{symbol}{min}</span>;
  }
  return <span className={cn('text-[var(--ds-text)] font-medium tabular-nums', className)}>{symbol}{min} – {symbol}{max}</span>;
}
```

- [ ] **Step 10.5: Typecheck + tests**

```bash
npx tsc -b config/tsconfig.json --noEmit
npm test -- --run
```

Expected: ambos limpios.

- [ ] **Step 10.6: Commit**

```bash
git add src/hooks/useCompany.ts src/hooks/usePermitEvents.ts src/components/ui/RoleBadge.tsx src/components/ui/CostRangeLabel.tsx
git commit -m "feat(domain): hooks useCompany/usePermitEvents + RoleBadge + CostRangeLabel"
```

---

## Task 11 · Frontend: fix del dashboard (plomería de datos)

**Files:**
- Modify: `src/features/dashboard/DashboardView.tsx`
- Modify: `src/components/ui/ComplianceInvoiceCard.tsx` (extender tipo `InvoiceLine.amount` a rango)

- [ ] **Step 11.1: Extender tipo InvoiceLine**

Abrir `src/components/ui/ComplianceInvoiceCard.tsx` y cambiar el tipo `InvoiceLine`:

```ts
export type InvoiceAmount = number | { min: number; max: number };

export interface InvoiceLine {
  label: string;
  detail: string;
  amount: InvoiceAmount;
}
```

Luego en el render reemplazar la muestra del `amount` por una función que soporta ambos:

```tsx
function formatAmount(a: InvoiceAmount): string {
  if (typeof a === 'number') return `$${a.toLocaleString()}`;
  if (a.min === a.max) return `$${a.min.toLocaleString()}`;
  return `$${a.min.toLocaleString()} – $${a.max.toLocaleString()}`;
}
```

Usar `formatAmount(line.amount)` donde antes se mostraba `${line.amount}`.

- [ ] **Step 11.2: Re-escribir `metrics` en DashboardView**

En `src/features/dashboard/DashboardView.tsx`, reemplazar líneas 15-100 (la constante + el `useMemo` de `metrics`):

```ts
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { resolveCompanyId } from '@/lib/demo'
import { useLocations } from '@/hooks/useLocations'
import { usePermits } from '@/hooks/usePermits'
import { useCompany } from '@/hooks/useCompany'
import { usePermitRequirements } from '@/lib/domain/permit-requirements'
import { LocationsGrid } from '@/features/locations/LocationsGrid'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Building2, Plus } from '@/lib/lucide-icons'
import { SkeletonList } from '@/components/ui/skeleton'
import { ComplianceWeatherCard, type WeatherState } from '@/components/ui/ComplianceWeatherCard'
import { ComplianceInvoiceCard, type InvoiceLine } from '@/components/ui/ComplianceInvoiceCard'

const PENDING_STATUSES = ['no_registrado','vencido','por_vencer','en_tramite'] as const

function buildComplianceCopy(state: WeatherState, brand: string): {
  chipLabel: string
  headline: React.ReactNode
} {
  if (state === 'sunny') {
    return {
      chipLabel: 'Casi al día',
      headline: (
        <>
          Vas bien, <span className="brand">{brand}</span>. Solo te falta ponerte al día en unos pocos permisos.
        </>
      ),
    }
  }
  if (state === 'warn') {
    return {
      chipLabel: 'Te estás atrasando',
      headline: (
        <>
          <span className="brand">{brand}</span>, se te están acumulando los papeles. <b>Ponte las pilas</b> antes que te caiga una multa.
        </>
      ),
    }
  }
  return {
    chipLabel: 'Te pueden cerrar',
    headline: (
      <>
        <span className="brand">{brand}</span>, <b>te pueden clausurar el local</b> en cualquier momento. Hay que actuar ya.
      </>
    ),
  }
}

function buildWarningText(state: WeatherState): React.ReactNode {
  if (state === 'sunny') return <>Si no los pagas, la multa puede llegar a</>
  if (state === 'warn') return <>Si no arreglas esto, la multa puede llegar a</>
  return <>Clausura + multas hasta</>
}

export function DashboardView() {
  const { companyId: authCompanyId } = useAuth()
  const companyId = resolveCompanyId(authCompanyId) ?? undefined

  const { data: company } = useCompany(companyId)
  const { locations, loading: loadingLocs } = useLocations(companyId)
  const { permits, loading: loadingPermits } = usePermits({ companyId })
  const { data: requirements } = usePermitRequirements(company?.business_type ?? null)

  const loading = loadingLocs || loadingPermits

  const metrics = useMemo(() => {
    const activePermits = permits.filter(p => p.is_active)
    const pending = activePermits.filter(p => (PENDING_STATUSES as readonly string[]).includes(p.status))
    const vigentes = activePermits.filter(p => p.status === 'vigente').length
    const porVencer = activePermits.filter(p => p.status === 'por_vencer').length
    const vencidos = activePermits.filter(p => p.status === 'vencido').length
    const noRegistrado = activePermits.filter(p => p.status === 'no_registrado').length
    const enTramite = activePermits.filter(p => p.status === 'en_tramite').length
    const total = activePermits.length
    const percentage = total > 0 ? Math.round((vigentes / total) * 100) : 0

    // Sumar costos reales de pendientes. Lookup por permit_type.
    const reqByPermitType = new Map(
      (requirements ?? []).map(r => [r.permit_type, r])
    )
    let costMin = 0
    let costMax = 0
    let fineMin = 0
    let fineMax = 0
    let pendingWithoutCost = 0
    for (const p of pending) {
      const req = reqByPermitType.get(p.type)
      if (!req || req.cost_min == null) {
        pendingWithoutCost++
        continue
      }
      costMin += Number(req.cost_min ?? 0)
      costMax += Number(req.cost_max ?? 0)
      if (req.fine_min != null) fineMin += Number(req.fine_min ?? 0)
      if (req.fine_max != null) fineMax += Number(req.fine_max ?? 0)
    }

    const state: WeatherState = vencidos > 0 && percentage < 50
      ? 'err'
      : percentage < 80 || vencidos > 0
        ? 'warn'
        : 'sunny'

    return {
      pending: pending.length,
      vigentes, porVencer, vencidos, noRegistrado, enTramite, total,
      percentage, state,
      costMin, costMax, fineMin, fineMax, pendingWithoutCost,
    }
  }, [permits, requirements])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-400)]">
        <div className="max-w-7xl mx-auto">
          <SkeletonList count={1} />
        </div>
      </div>
    )
  }

  if (locations.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-400)]">
        <div className="max-w-7xl mx-auto">
          <EmptyState
            icon={Building2}
            title="No hay sedes registradas"
            description="Crea tu primera sede para comenzar a gestionar permisos"
            action={
              <Link to="/sedes">
                <Button variant="default">
                  <Plus className="w-4 h-4" />
                  Crear Primera Sede
                </Button>
              </Link>
            }
          />
        </div>
      </div>
    )
  }

  const brandName = company?.name ?? 'tu negocio'
  const { chipLabel, headline } = buildComplianceCopy(metrics.state, brandName)

  const invoiceLines: InvoiceLine[] =
    metrics.pending === 0
      ? [{ label: 'Todo al día', detail: `${metrics.total} permisos vigentes`, amount: 0 }]
      : [
          ...(metrics.vencidos > 0
            ? [{ label: 'Vencidos', detail: `${metrics.vencidos} trámite${metrics.vencidos>1?'s':''}`, amount: { min: 0, max: 0 } as const }]
            : []),
          ...(metrics.porVencer > 0
            ? [{ label: 'Por vencer', detail: `${metrics.porVencer} próximos 30 días`, amount: { min: 0, max: 0 } as const }]
            : []),
          ...(metrics.noRegistrado > 0
            ? [{ label: 'No registrados', detail: `${metrics.noRegistrado} permisos`, amount: { min: 0, max: 0 } as const }]
            : []),
          ...(metrics.enTramite > 0
            ? [{ label: 'En trámite', detail: `${metrics.enTramite} en proceso`, amount: { min: 0, max: 0 } as const }]
            : []),
        ]

  return (
    <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-400)]">
      <div className="max-w-7xl mx-auto space-y-[var(--ds-space-400)]">
        <h1 className="text-[var(--ds-font-size-500)] font-bold text-[var(--ds-text)]">Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_440px] gap-5 items-stretch">
          <ComplianceWeatherCard
            state={metrics.state}
            chipLabel={chipLabel}
            headline={headline}
            percentage={metrics.percentage}
            permitsDone={metrics.vigentes}
            permitsTotal={metrics.total}
            locations={locations.length}
          />
          <ComplianceInvoiceCard
            lines={invoiceLines}
            total={metrics.pending > 0 ? { min: metrics.costMin, max: metrics.costMax } : 0}
            warningAmount={metrics.pending > 0 ? { min: metrics.fineMin, max: metrics.fineMax } : undefined}
            warningText={metrics.pending > 0 ? buildWarningText(metrics.state) : undefined}
          />
        </div>

        <LocationsGrid standalone={false} />
      </div>
    </div>
  )
}
```

- [ ] **Step 11.3: Extender `total` de ComplianceInvoiceCard al mismo tipo `InvoiceAmount`**

En `src/components/ui/ComplianceInvoiceCard.tsx`, cambiar `total: number` a `total: InvoiceAmount` y `warningAmount?: number` a `warningAmount?: InvoiceAmount`. Usar `formatAmount` en el render.

- [ ] **Step 11.4: Typecheck + tests**

```bash
npx tsc -b config/tsconfig.json --noEmit
npm test -- --run
```

Expected: limpio.

- [ ] **Step 11.5: Smoke test manual en browser**

Correr `npm run dev`, ir a `http://localhost:5173/`, verificar:
- El título dice el nombre de la empresa (no "Hamburguesas La Española" ni el primer sede).
- Si hay trámites con status `no_registrado`, `vencido`, `por_vencer`, o `en_tramite`, NO muestra "Sin trámites pendientes".
- El total del invoice muestra rango "$X – $Y" si hay pendientes con costo.
- Si todo está vigente, muestra "Todo al día" con 0.

Si algo no funciona, revisar que los 8 migraciones anteriores estén aplicadas.

- [ ] **Step 11.6: Commit**

```bash
git add src/features/dashboard/DashboardView.tsx src/components/ui/ComplianceInvoiceCard.tsx
git commit -m "fix(dashboard): bug 'sin trámites pendientes' + factura con costos reales rango + brand desde companies.name"
```

---

## Task 12 · Frontend: PermitInfoCard + AssigneePicker + PermitEventsTimeline

**Files:**
- Create: `src/features/permits/PermitInfoCard.tsx`
- Create: `src/features/permits/AssigneePicker.tsx`
- Create: `src/features/permits/PermitEventsTimeline.tsx`
- Modify: `src/features/permits/PermitDetailView.tsx`

- [ ] **Step 12.1: Implementar PermitInfoCard**

Crear `src/features/permits/PermitInfoCard.tsx`:

```tsx
import { useIssuer } from '@/lib/domain/issuers';
import { useRequirementFor } from '@/lib/domain/permit-requirements';
import { useCompany } from '@/hooks/useCompany';
import { Card } from '@/components/ui/card';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { CostRangeLabel } from '@/components/ui/CostRangeLabel';
import { ExternalLink } from '@/lib/lucide-icons';
import type { Permit } from '@/types';

interface Props {
  permit: Pick<Permit, 'id' | 'type' | 'issuer_id' | 'company_id'>;
}

export function PermitInfoCard({ permit }: Props) {
  const { data: company } = useCompany(permit.company_id ?? undefined);
  const issuer = useIssuer(permit.issuer_id);
  const req = useRequirementFor(permit.type, company?.business_type);

  return (
    <Card className="p-[var(--ds-space-300)]">
      <div className="flex flex-col gap-[var(--ds-space-200)] text-sm">
        <div className="flex justify-between">
          <span className="text-[var(--ds-text-subtle)]">Emisor</span>
          {issuer ? (
            <div className="flex items-center gap-2">
              <span className="font-medium">{issuer.short_name}</span>
              {issuer.portal_url && (
                <a href={issuer.portal_url} target="_blank" rel="noopener noreferrer" className="text-[var(--ds-text-link)]" aria-label={`Portal de ${issuer.name}`}>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          ) : (
            <span className="text-[var(--ds-text-subtlest)] italic">no definido</span>
          )}
        </div>

        <div className="flex justify-between">
          <span className="text-[var(--ds-text-subtle)]">Costo estimado</span>
          <CostRangeLabel min={req?.cost_min} max={req?.cost_max} currency={req?.cost_currency ?? 'USD'} />
        </div>
        {req?.cost_notes && (
          <div className="text-xs text-[var(--ds-text-subtle)] -mt-2">{req.cost_notes}</div>
        )}

        <div className="flex justify-between">
          <span className="text-[var(--ds-text-subtle)]">Multa si no se regulariza</span>
          <CostRangeLabel min={req?.fine_min} max={req?.fine_max} />
        </div>
        {req?.fine_source && (
          <div className="text-xs text-[var(--ds-text-subtle)] -mt-2">{req.fine_source}</div>
        )}

        <div className="flex justify-between">
          <span className="text-[var(--ds-text-subtle)]">Rol requerido</span>
          {req ? <RoleBadge role={req.required_role} variant="full" /> : <span className="text-[var(--ds-text-subtlest)] italic">no definido</span>}
        </div>

        {req?.applies_when && (
          <div className="text-xs text-[var(--ds-text-subtle)]">
            <strong>Aplica cuando:</strong> {req.applies_when}
          </div>
        )}
      </div>
    </Card>
  );
}
```

- [ ] **Step 12.2: Implementar AssigneePicker**

Crear `src/features/permits/AssigneePicker.tsx`:

```tsx
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCompany } from '@/hooks/useCompany';
import { useRequirementFor } from '@/lib/domain/permit-requirements';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RoleBadge } from '@/components/ui/RoleBadge';
import type { BusinessRole } from '@/lib/domain/permit-roles';
import { BUSINESS_ROLE_LABELS, roleMatches } from '@/lib/domain/permit-roles';
import { AlertTriangle } from '@/lib/lucide-icons';

interface Props {
  permitId: string;
  permitType: string;
  companyId: string;
  currentAssigneeId: string | null;
  onChanged?: () => void;
}

interface TeamMember {
  id: string;
  full_name: string;
  business_role: BusinessRole;
}

export function AssigneePicker({ permitId, permitType, companyId, currentAssigneeId, onChanged }: Props) {
  const queryClient = useQueryClient();
  const { data: company } = useCompany(companyId);
  const req = useRequirementFor(permitType, company?.business_type);
  const [saving, setSaving] = useState(false);

  const { data: members } = useQuery({
    queryKey: ['team_members', companyId],
    queryFn: async (): Promise<TeamMember[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, business_role')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('full_name');
      if (error) throw new Error(error.message);
      return (data as unknown as TeamMember[]) ?? [];
    },
    enabled: !!companyId,
  });

  const selected = members?.find(m => m.id === currentAssigneeId) ?? null;
  const requiredRole = req?.required_role;

  async function onChange(newId: string) {
    setSaving(true);
    try {
      const target = newId === 'unassigned' ? null : newId;
      const { error } = await (supabase.from('permits') as any)
        .update({ assigned_to_profile_id: target })
        .eq('id', permitId);
      if (error) throw new Error(error.message);
      queryClient.invalidateQueries({ queryKey: ['permits'] });
      queryClient.invalidateQueries({ queryKey: ['permit_events', permitId] });
      onChanged?.();
    } finally {
      setSaving(false);
    }
  }

  const roleMismatch =
    selected && requiredRole && !roleMatches(selected.business_role, requiredRole);

  return (
    <div className="flex flex-col gap-1">
      <Select value={currentAssigneeId ?? 'unassigned'} onValueChange={onChange} disabled={saving}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Sin asignar" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unassigned">— Sin asignar —</SelectItem>
          {members?.map(m => (
            <SelectItem key={m.id} value={m.id}>
              <div className="flex items-center gap-2">
                <span>{m.full_name}</span>
                <span className="text-xs text-[var(--ds-text-subtle)]">({BUSINESS_ROLE_LABELS[m.business_role]})</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {roleMismatch && requiredRole && (
        <div className="flex items-start gap-2 text-xs text-[var(--ds-text-warning)] mt-1">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Este permiso requiere <strong>{BUSINESS_ROLE_LABELS[requiredRole as BusinessRole]}</strong>. Podés continuar, pero verificá el flow.
          </span>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 12.3: Implementar PermitEventsTimeline**

Crear `src/features/permits/PermitEventsTimeline.tsx`:

```tsx
import { usePermitEvents, type PermitEvent } from '@/hooks/usePermitEvents';
import { formatDate } from '@/lib/dates';
import { FileText, Calendar, UserCheck, UserMinus, CheckCircle, Trash2 } from '@/lib/lucide-icons';

interface Props {
  permitId: string;
}

const ICON_BY_TYPE = {
  created: FileText,
  status_changed: CheckCircle,
  document_uploaded: FileText,
  document_deleted: Trash2,
  assigned: UserCheck,
  unassigned: UserMinus,
  renewed: CheckCircle,
  dates_updated: Calendar,
} as const;

function describe(e: PermitEvent): string {
  switch (e.event_type) {
    case 'created': return `Permiso creado (estado ${e.to_value})`;
    case 'status_changed': return `Estado: ${e.from_value} → ${e.to_value}`;
    case 'document_uploaded': return `Documento subido: ${e.to_value}`;
    case 'document_deleted': return `Documento eliminado: ${e.from_value}`;
    case 'assigned': return `Asignado`;
    case 'unassigned': return `Sin asignar`;
    case 'renewed': return `Renovado`;
    case 'dates_updated': return `Fechas actualizadas`;
  }
}

export function PermitEventsTimeline({ permitId }: Props) {
  const { data, isLoading } = usePermitEvents(permitId);
  if (isLoading) return <div className="text-sm text-[var(--ds-text-subtle)]">Cargando timeline...</div>;
  if (!data || data.length === 0) return <div className="text-sm text-[var(--ds-text-subtlest)] italic">Sin eventos registrados</div>;
  return (
    <ol className="flex flex-col gap-2">
      {data.map(ev => {
        const Icon = ICON_BY_TYPE[ev.event_type] ?? FileText;
        return (
          <li key={ev.id} className="flex items-start gap-2 text-sm">
            <Icon className="w-4 h-4 text-[var(--ds-text-subtle)] shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-[var(--ds-text)]">{describe(ev)}</div>
              <div className="text-xs text-[var(--ds-text-subtle)]">{formatDate(ev.created_at)}</div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
```

- [ ] **Step 12.4: Integrar en PermitDetailView**

En `src/features/permits/PermitDetailView.tsx`, agregar imports:

```ts
import { PermitInfoCard } from './PermitInfoCard'
import { AssigneePicker } from './AssigneePicker'
import { PermitEventsTimeline } from './PermitEventsTimeline'
```

Localizar el layout principal del detalle (busca `<Card>` con el timeline existente `<PermitTimeline>`) y añadir una columna o sección con:

```tsx
<PermitInfoCard permit={permit} />

<Card className="p-[var(--ds-space-300)]">
  <div className="text-[var(--ds-font-size-100)] font-semibold mb-2">Asignado a</div>
  <AssigneePicker
    permitId={permit.id}
    permitType={permit.type}
    companyId={permit.company_id!}
    currentAssigneeId={(permit as any).assigned_to_profile_id ?? null}
  />
</Card>

<Card className="p-[var(--ds-space-300)]">
  <div className="text-[var(--ds-font-size-100)] font-semibold mb-2">Historial</div>
  <PermitEventsTimeline permitId={permit.id} />
</Card>
```

Ubicación recomendada: después del header y antes del `<DocumentPanel>`. Respetar espaciado con el diseño actual.

- [ ] **Step 12.5: Typecheck + tests + smoke test browser**

```bash
npx tsc -b config/tsconfig.json --noEmit
npm test -- --run
npm run dev
```

Navegar a un permit detail. Verificar:
- Tarjeta de info muestra emisor con link a portal.
- Costo y multa aparecen como rango.
- Rol requerido como badge.
- Dropdown de asignación muestra empleados de la empresa.
- Al asignar, aparece warning si el rol no cuadra.
- Timeline muestra al menos el evento `created`.

- [ ] **Step 12.6: Commit**

```bash
git add src/features/permits/PermitInfoCard.tsx src/features/permits/AssigneePicker.tsx src/features/permits/PermitEventsTimeline.tsx src/features/permits/PermitDetailView.tsx
git commit -m "feat(permits): info card con emisor+costo+multa+rol, picker de asignación, timeline de eventos"
```

---

## Task 13 · Frontend: Marco Legal desde DB + filtro por giro + matriz

**Files:**
- Create: `src/lib/domain/legal-references-db.ts`
- Create: `src/features/legal/LegalMatrixView.tsx`
- Modify: `src/features/legal/LegalIndexView.tsx`
- Modify: `src/App.tsx` (agregar ruta)

- [ ] **Step 13.1: Crear hook que lee marco legal de DB**

Crear `src/lib/domain/legal-references-db.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { BusinessType } from './business-types';

export interface LegalReferenceRow {
  id: string;
  permit_type: string;
  description: string;
  frequency_basis: string;
  estimated_cost: string | null;
  disclaimer: string | null;
  applies_to: string[];
  business_categories: string[];
  government_portal_url: string | null;
  government_portal_name: string | null;
}

export function useLegalReferences(filterByBusinessType?: BusinessType | null) {
  return useQuery({
    queryKey: ['legal_references', filterByBusinessType ?? 'all'],
    queryFn: async (): Promise<LegalReferenceRow[]> => {
      let query = supabase.from('legal_references').select('*');
      if (filterByBusinessType) {
        query = query.contains('business_categories', [filterByBusinessType]);
      }
      const { data, error } = await query.order('permit_type');
      if (error) throw new Error(error.message);
      return (data as unknown as LegalReferenceRow[]) ?? [];
    },
    staleTime: 30 * 60 * 1000,
  });
}
```

- [ ] **Step 13.2: Reemplazar fuente de datos en LegalIndexView**

Localizar `src/features/legal/LegalIndexView.tsx`. Hoy importa de `@/data/legal-references`. Cambiar:

```tsx
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useCompany } from '@/hooks/useCompany'
import { resolveCompanyId } from '@/lib/demo'
import { useLegalReferences } from '@/lib/domain/legal-references-db'
import { Checkbox } from '@/components/ui/checkbox'
// ... resto de imports existentes excepto LEGAL_REFERENCES y CATEGORY_META del archivo TS

export function LegalIndexView() {
  const { companyId: authCompanyId } = useAuth()
  const companyId = resolveCompanyId(authCompanyId) ?? undefined
  const { data: company } = useCompany(companyId)
  const [showAll, setShowAll] = useState(false)

  const filter = showAll ? null : company?.business_type ?? null
  const { data: references, isLoading } = useLegalReferences(filter)

  // ... resto del render, usando `references` en vez de LEGAL_REFERENCES
}
```

Incluir en el header de la página un toggle:

```tsx
<div className="flex items-center gap-2 mb-4">
  <Checkbox id="show-all-legal" checked={showAll} onCheckedChange={(v) => setShowAll(!!v)} />
  <label htmlFor="show-all-legal" className="text-sm">Ver todos los permisos (no solo los de mi giro)</label>
</div>
```

- [ ] **Step 13.3: Crear LegalMatrixView**

Crear `src/features/legal/LegalMatrixView.tsx`:

```tsx
import { usePermitRequirements } from '@/lib/domain/permit-requirements';
import { useIssuers } from '@/lib/domain/issuers';
import { BUSINESS_TYPES, businessTypeLabel } from '@/lib/domain/business-types';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { CostRangeLabel } from '@/components/ui/CostRangeLabel';

const PERMIT_ORDER = ['ruc','patente_municipal','uso_suelo','luae','bomberos','arcsa','rotulacion','msp'];
const PERMIT_LABELS: Record<string,string> = {
  ruc: 'RUC',
  patente_municipal: 'Patente municipal',
  uso_suelo: 'Uso de suelo',
  luae: 'LUAE',
  bomberos: 'Bomberos',
  arcsa: 'ARCSA',
  rotulacion: 'Rotulación',
  msp: 'Permiso MSP',
};

export function LegalMatrixView() {
  const { data: requirements } = usePermitRequirements();
  const { data: issuers } = useIssuers();

  const byKey = new Map<string, any>();
  (requirements ?? []).forEach(r => byKey.set(`${r.business_type}|${r.permit_type}`, r));
  const issuerBySlug = new Map((issuers ?? []).map(i => [i.id, i]));

  function renderCell(bt: string, pt: string) {
    const r = byKey.get(`${bt}|${pt}`);
    if (!r) return <td className="text-center text-[var(--ds-text-subtlest)]">—</td>;
    const cls = r.is_mandatory
      ? 'bg-green-600 text-white'
      : r.applies_when
        ? 'bg-blue-400 text-white'
        : 'bg-amber-500 text-white';
    const label = r.is_mandatory ? 'R' : r.applies_when ? 'T' : 'O';
    return (
      <td className="text-center">
        <span className={`inline-block px-2 py-0.5 rounded font-bold text-xs ${cls}`}>{label}</span>
      </td>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-400)]">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-[var(--ds-font-size-500)] font-bold mb-2">Matriz de permisos por giro</h1>
        <p className="text-[var(--ds-text-subtle)] mb-6 max-w-3xl">
          Esta matriz muestra qué permisos aplican a cada tipo de negocio en Quito, con su emisor,
          costo estimado y rol responsable. <strong>R</strong> = obligatorio · <strong>O</strong> = opcional ·
          <strong> T</strong> = condicional.
        </p>

        <div className="overflow-x-auto border rounded-lg bg-white">
          <table className="w-full text-sm">
            <thead className="bg-[var(--ds-neutral-100)]">
              <tr>
                <th className="text-left p-2 min-w-[180px]">Permiso</th>
                <th className="text-left p-2">Emisor</th>
                <th className="text-left p-2">Rol</th>
                <th className="text-left p-2">Costo</th>
                {BUSINESS_TYPES.filter(t => t !== 'otro').map(t => (
                  <th key={t} className="p-2 text-xs">{businessTypeLabel(t)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMIT_ORDER.map(pt => {
                const sample = (requirements ?? []).find(r => r.permit_type === pt);
                const issuer = sample?.issuer_id ? issuerBySlug.get(sample.issuer_id) : null;
                return (
                  <tr key={pt} className="border-t">
                    <td className="p-2 font-semibold">{PERMIT_LABELS[pt] ?? pt}</td>
                    <td className="p-2">{issuer?.short_name ?? '—'}</td>
                    <td className="p-2">{sample ? <RoleBadge role={sample.required_role} /> : null}</td>
                    <td className="p-2">
                      <CostRangeLabel min={sample?.cost_min} max={sample?.cost_max} />
                    </td>
                    {BUSINESS_TYPES.filter(t => t !== 'otro').map(bt => renderCell(bt, pt))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 13.4: Agregar ruta /marco-legal/matriz**

En `src/App.tsx` agregar:

```tsx
import { LegalMatrixView } from '@/features/legal/LegalMatrixView'
// ... dentro de las rutas autenticadas (ProtectedOnboardingRoute wrapper)
<Route path="/marco-legal/matriz" element={<LegalMatrixView />} />
```

Y en `LegalIndexView.tsx` un link visible: `<Link to="/marco-legal/matriz">Ver matriz completa</Link>`.

- [ ] **Step 13.5: Typecheck + tests + smoke test**

```bash
npx tsc -b config/tsconfig.json --noEmit
npm test -- --run
npm run dev
```

Navegar a `/marco-legal` y verificar:
- Solo aparecen los permisos del giro del cliente.
- Al marcar "Ver todos", aparecen todos.
- Link a matriz funciona y renderiza.

- [ ] **Step 13.6: Commit**

```bash
git add src/lib/domain/legal-references-db.ts src/features/legal/LegalMatrixView.tsx src/features/legal/LegalIndexView.tsx src/App.tsx
git commit -m "feat(legal): marco legal desde DB + filtro por giro + matriz pública en /marco-legal/matriz"
```

---

## Task 14 · Onboarding: dropdown de 12 giros

**Files:**
- Modify: `src/features/onboarding-incremental/steps/CompanyStep.tsx`

- [ ] **Step 14.1: Cambiar el dropdown de business_type**

Abrir `src/features/onboarding-incremental/steps/CompanyStep.tsx`. Buscar el `<Select>` que pregunta por tipo de negocio. Reemplazar el hardcoded de 4 opciones por:

```tsx
import { BUSINESS_TYPES, businessTypeLabel } from '@/lib/domain/business-types'
// ...
<SelectContent>
  {BUSINESS_TYPES.map(t => (
    <SelectItem key={t} value={t}>{businessTypeLabel(t)}</SelectItem>
  ))}
</SelectContent>
```

- [ ] **Step 14.2: Typecheck + smoke test**

```bash
npx tsc -b config/tsconfig.json --noEmit
```

Navegar manualmente al onboarding (con un user nuevo) y verificar los 12 giros disponibles.

- [ ] **Step 14.3: Commit**

```bash
git add src/features/onboarding-incremental/steps/CompanyStep.tsx
git commit -m "feat(onboarding): dropdown de business_type con 12 giros"
```

---

## Task 15 · Limpieza: borrar legal-references.ts

**Files:**
- Delete: `src/data/legal-references.ts`

- [ ] **Step 15.1: Verificar que nadie más lo importa**

```bash
grep -r "data/legal-references" src/ --include="*.ts" --include="*.tsx"
```

Expected: sin matches (todos los consumers migrados al hook de DB).

- [ ] **Step 15.2: Borrar archivo**

```bash
rm src/data/legal-references.ts
```

- [ ] **Step 15.3: Typecheck + build**

```bash
npx tsc -b config/tsconfig.json --noEmit
npm run build
npm test -- --run
```

Todo debe pasar.

- [ ] **Step 15.4: Commit**

```bash
git add -A
git commit -m "chore(legal): eliminar src/data/legal-references.ts (reemplazado por DB)"
```

---

## Task 16 · Verificación final + PR

- [ ] **Step 16.1: Lint limpio**

```bash
npm run lint
```

Expected: 0 errors (warnings OK).

- [ ] **Step 16.2: Suite completa**

```bash
npx tsc -b config/tsconfig.json --noEmit
npm test -- --run
npm run build
```

Todo limpio.

- [ ] **Step 16.3: Smoke test E2E manual en dev server**

`npm run dev`. Hacer flow completo como usuario:
1. Login (demo o real).
2. Dashboard: el título dice tu nombre de empresa, factura con rango real, sin bug de "sin pendientes".
3. Click en sede → detalle → click en permit.
4. Info card muestra emisor + costo + multa + rol.
5. Asignar un permit a un miembro — warning si rol no cuadra.
6. Timeline aparece con el evento `assigned`.
7. Marco legal: toggle "ver todos" funciona.
8. `/marco-legal/matriz` muestra la matriz.

- [ ] **Step 16.4: Re-auditar Supabase advisors**

```
mcp__supabase__get_advisors type="security"
mcp__supabase__get_advisors type="performance"
```

Expected: ningún WARN nuevo (respecto a los documentados en el audit anterior).

- [ ] **Step 16.5: Crear PR**

```bash
git push -u origin feat/dominio-v2
gh pr create --title "feat: dominio v2 — costos reales, emisores catálogo, roles, trazabilidad" \
  --body "Implementa spec 2026-05-10-dominio-enregla-v2-design.md. 9 migraciones SQL, 2 tablas nuevas, seed con 5 emisores + matriz 10×8. Frontend plomea datos reales al dashboard (sin tocar diseño) y agrega info card + assignee picker + timeline al detalle de permits. Marco legal se sirve desde DB con filtro por giro + matriz pública."
```

---

## Self-Review

**Spec coverage — 14/14 decisiones cubiertas:**

1. 10 giros → Task 2 + Task 9.1.
2. 8 permisos → Task 7 + Task 8.
3. Matriz → Task 8 + Task 13.3.
4. Costos rango → Task 3 + Task 8 + Task 10.4 + Task 11.2.
5. USD/Quito → Task 8 datos, rest de código honra `cost_currency`.
6. Catálogo emisores cerrado → Task 1 (RLS bloquea writes de no-staff).
7. Datos emisor completos → Task 1 seed.
8. 4 roles → Task 5 + Task 9.6.
9. Opción 1 simple (un rol por permiso) → Task 3 CHECK constraint.
10. Warning no bloqueo → Task 12.2 render condicional.
11. Dashboard sin cambios de diseño → Task 11 sólo toca metrics + invoice data, no JSX del hero.
12. Sin filtro por sede → dashboard ya tiene cards abajo; no se agrega filtro.
13. Multas reales → Task 8 incluye `fine_min`/`fine_max`/`fine_source`.
14. Matriz en Marco Legal → Task 13.3.

**Placeholder scan:** sin "TBD" ni "TODO" ni pasos sin código. La única zona donde dejé "completar fielmente desde TS" es Task 7 Step 7.2, que es explícitamente un job mecánico (copiar strings). Justificado por volumen.

**Type consistency:** `BusinessType`, `BusinessRole`, `RequiredRole`, `Issuer`, `PermitRequirement`, `Company`, `PermitEvent` son consistentes entre Tasks 9, 10, 12, 13. `InvoiceAmount = number | {min,max}` usado consistente entre Task 11.1, 11.2, 11.3.

---

## Dependencies entre tasks

- Tasks 1–8 son DB. Ejecutar en orden estricto (cada una depende de la anterior para FK / referencias).
- Task 9 (frontend domain) puede empezar después de Task 1 (solo necesita que `permit_issuers` exista para regenerar tipos; los tipos de `permit_requirements` nuevos vienen en Task 3).
  - **Regeneración de tipos**: el ideal es hacerla después de **Task 6** cuando todos los schemas están estables.
- Tasks 10–14 pueden hacerse en paralelo entre sí (frontend independientes), con la condición de que Task 11 depende de Task 10 (para `useCompany` + `CostRangeLabel`).
- Tasks 15–16 al final.

Execution en subagentes (recomendado):
- Agent 1: Tasks 1→8 serial (DB migrations).
- Agent 2: Tasks 9, 10 paralelo una vez Agent 1 pasó Task 6.
- Agent 3: Tasks 11, 12, 13, 14 paralelo una vez Agent 2 terminó.
- Main: Tasks 15, 16.
