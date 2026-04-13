# PermitOps V1 DEMO-GRADE - Especificación de Diseño

**Fecha:** 2026-04-13  
**Versión:** V1 DEMO-GRADE  
**Dominio:** enregla.ec  
**Objetivo:** Demo convincente para vender a Supermaxi Ecuador

---

## Resumen Ejecutivo

PermitOps es un sistema de control operativo para negocios con múltiples sedes que necesitan gestionar permisos municipales, bomberos, sanidad, alcohol y otros requisitos regulatorios en Quito, Ecuador.

**Este es un V1 DEMO-GRADE**: construido para ser altamente convincente en una demo de 5 minutos, no para producción completa. Prioriza el relato comercial sobre la completitud técnica exhaustiva.

### Relato Demo (5 minutos)

```
1. CONTEXTO → Onboarding: definir negocio + regulación aplicable
2. GLOBAL → Dashboard: estado operativo entre sedes  
3. DETALLE → Sede específica: permisos, riesgo, faltantes
4. ACCIÓN → Renovar permiso: versionado trazable sin pérdida de historial
5. TRANSPARENCIA → QR + link público: verificación externa en tiempo real
```

### Debe sentirse como:

- ✅ Control operativo profesional, no caos de Excel/WhatsApp
- ✅ Protección del negocio ante revisión externa
- ✅ Precisión y trazabilidad completa
- ✅ Años adelante de carpetas físicas y correos
- ✅ Transparencia pública que genera confianza

### NO debe sentirse como:

- ❌ SaaS genérico
- ❌ GovTech burocrático
- ❌ ERP complejo
- ❌ Admin panel con tablas grises

---

## Principios de Diseño

### 1. DEMO-GRADE, No Mockup

- Sistema funcional con persistencia real (Supabase)
- Flujos completos end-to-end
- Datos seed convincentes y realistas
- UI premium, no genérica

### 2. Relato Primero

- Cada feature debe servir al relato de demo de 5 minutos
- No construir lo que no se verá en la demo
- Optimizar para convencer, no para completitud

### 3. Manual Inteligente (V1)

- Sin IA generativa
- Sin automatización compleja
- Inputs manuales, validación humana
- Lógica simple basada en reglas
- Principio: primero ordenar → luego automatizar → luego inteligencia

### 4. Español Operativo

- Toda la UI en español
- Lenguaje aterrizado a Quito, Ecuador
- Tono operativo serio, no startup ni legal inflado
- Zero labels en inglés en la UI

---

## User Personas & Roles

### 1. ADMIN (Administrador)
- **Acceso:** Total
- **Puede:** Gestionar usuarios, generar links públicos, todas las acciones de operator
- **Dashboard:** Full control + user management
- **Típico:** Dueño del sistema, IT manager, gerente general

### 2. OPERATOR (Usuario Operativo)
- **Acceso:** Operaciones CRUD
- **Puede:** Crear, editar, subir documentos, renovar permisos
- **Dashboard:** Full access con acciones
- **Típico:** Personal administrativo, asistente legal, encargado de sucursal

### 3. VIEWER (Stakeholder Interno)
- **Acceso:** Solo lectura
- **Puede:** Ver dashboard, descargar reportes (no editar)
- **Dashboard:** Vista de métricas sin botones de acción
- **Típico:** Gerencia, jefaturas, CFO, dueños

### 4. PÚBLICO (Sin Rol - Sin Login)
- **Acceso:** Via link público tokenizado
- **Puede:** Ver permisos vigentes de una sede específica
- **Vista:** Página pública branded, solo permisos activos
- **Típico:** Inspector municipal, auditor de bomberos, administrador de mall, cliente verificando

---

## Stack Técnico

### Frontend
```
├── React 19 + TypeScript 6
├── Vite 8 (build tool)
├── Tailwind CSS 4 (styling premium, no genérico)
├── Zustand (state mínimo)
├── React Router 7 (rutas básicas)
├── Framer Motion (transiciones suaves)
├── qrcode.react (generación de QR)
└── html2canvas + jsPDF (exports - ya instalados)
```

### Backend
```
├── Supabase
│   ├── PostgreSQL (database)
│   ├── Auth (email/password)
│   ├── Storage (documentos PDF)
│   └── RLS básica por rol
```

### NO incluir en V1 (diferir a V2)
```
❌ Resend/emails automáticos
❌ Sentry/monitoring profundo
❌ Testing E2E exhaustivo (solo smoke tests)
❌ CI/CD pipeline complejo
❌ Analytics profundas
❌ Edge Functions complejas
```

---

## Database Schema

### Tablas Core

#### `companies`
```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  business_type TEXT NOT NULL, -- 'retail', 'restaurant', 'hotel', etc.
  city TEXT NOT NULL, -- 'Quito', 'Guayaquil', 'Cuenca'
  location_count INT DEFAULT 0,
  regulatory_factors JSONB DEFAULT '{}', -- {food: true, alcohol: true, health: false}
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `locations`
```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  status TEXT NOT NULL, -- 'operando' | 'en_preparacion' | 'cerrado'
  risk_level TEXT NOT NULL, -- 'bajo' | 'medio' | 'alto' | 'critico'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `permits`
```sql
CREATE TABLE permits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'patente_municipal', 'bomberos', 'sanidad', 'alcohol'
  status TEXT NOT NULL, -- 'vigente' | 'por_vencer' | 'vencido' | 'en_tramite' | 'no_registrado'
  permit_number TEXT,
  issue_date DATE,
  expiry_date DATE,
  issuer TEXT,
  notes TEXT,
  
  -- Versionado y archivo
  is_active BOOLEAN DEFAULT TRUE, -- false = archivado
  version INT DEFAULT 1,
  superseded_by UUID REFERENCES permits(id), -- apunta al permiso que lo reemplazó
  archived_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_permits_active ON permits(company_id, is_active);
CREATE INDEX idx_permits_expiry ON permits(expiry_date) WHERE is_active = true;
CREATE INDEX idx_permits_location ON permits(location_id);
```

#### `documents`
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  permit_id UUID REFERENCES permits(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL, -- Supabase Storage path: {company_id}/permits/{permit_id}/{filename}
  file_name TEXT NOT NULL,
  file_size INT, -- bytes
  file_type TEXT, -- 'pdf', 'png', 'jpg'
  uploaded_by UUID REFERENCES profiles(id),
  uploaded_at TIMESTAMP DEFAULT NOW()
);
```

#### `public_links` (CRÍTICO PARA DEMO)
```sql
CREATE TABLE public_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id), -- null = toda la empresa
  token TEXT UNIQUE NOT NULL, -- UUID para URL: enregla.ec/p/{token}
  label TEXT NOT NULL, -- "Inspector Municipal 2026", "Arrendador Mall"
  is_active BOOLEAN DEFAULT TRUE,
  view_count INT DEFAULT 0, -- track de accesos
  last_viewed_at TIMESTAMP, -- último acceso
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_public_links_token ON public_links(token);
CREATE INDEX idx_public_links_company ON public_links(company_id, is_active);
```

#### `profiles` (extends auth.users)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL, -- 'admin' | 'operator' | 'viewer'
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tablas NO incluidas en V1 (simplificar para demo)

```
❌ renewals (simplificar: renovar = crear nueva versión de permit)
❌ tasks (demasiada complejidad para demo)
❌ audit_logs (nice-to-have, no crítico)
❌ notifications (no hay emails automáticos en V1)
```

---

## Row Level Security (RLS)

### Políticas Básicas por Rol

```sql
-- ADMIN: Full access
CREATE POLICY "Admins have full access"
ON permits FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin' 
    AND company_id = permits.company_id
  )
);

-- OPERATOR: CRUD en permisos
CREATE POLICY "Operators can manage permits"
ON permits FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('operator', 'admin')
    AND company_id = permits.company_id
  )
);

-- VIEWER: Solo lectura
CREATE POLICY "Viewers can read permits"
ON permits FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('viewer', 'operator', 'admin')
    AND company_id = permits.company_id
  )
);

-- Repetir patrón similar para: locations, documents, public_links
```

### Función para Vista Pública (sin auth)

```sql
CREATE OR REPLACE FUNCTION get_public_permits(link_token TEXT)
RETURNS TABLE (
  location_name TEXT,
  location_address TEXT,
  permit_type TEXT,
  permit_number TEXT,
  status TEXT,
  issue_date DATE,
  expiry_date DATE,
  issuer TEXT
) 
SECURITY DEFINER
AS $$
BEGIN
  -- Incrementar view_count y actualizar last_viewed_at
  UPDATE public_links
  SET 
    view_count = view_count + 1,
    last_viewed_at = NOW()
  WHERE token = link_token AND is_active = true;

  -- Retornar solo permisos vigentes y activos
  RETURN QUERY
  SELECT 
    l.name,
    l.address,
    p.type,
    p.permit_number,
    p.status,
    p.issue_date,
    p.expiry_date,
    p.issuer
  FROM permits p
  INNER JOIN locations l ON p.location_id = l.id
  INNER JOIN public_links pl ON pl.company_id = p.company_id
  WHERE pl.token = link_token
    AND pl.is_active = true
    AND (pl.expires_at IS NULL OR pl.expires_at > NOW())
    AND p.is_active = true -- Solo activos (no archivados)
    AND p.status = 'vigente' -- Solo vigentes (no vencidos ni faltantes)
    AND (pl.location_id IS NULL OR p.location_id = pl.location_id);
END;
$$ LANGUAGE plpgsql;
```

---

## API Layer

### Estructura de Archivos

```
src/lib/api/
├── supabase.ts         # Cliente de Supabase + tipos
├── auth.ts             # Login, register, logout
├── permits.ts          # CRUD de permisos + renovación
├── locations.ts        # CRUD de sedes
├── documents.ts        # Upload/download de documentos
├── publicLinks.ts      # Generación y gestión de links públicos
└── onboarding.ts       # Lógica del wizard de onboarding
```

### Operaciones Clave

#### `renewPermit` (CRÍTICO PARA DEMO)

```typescript
// src/lib/api/permits.ts

export async function renewPermit(params: {
  permitId: string;
  permitNumber: string;
  issueDate: string;
  expiryDate: string;
  documentFile?: File;
}) {
  // 1. Obtener permiso actual
  const { data: oldPermit, error: fetchError } = await supabase
    .from('permits')
    .select('*')
    .eq('id', params.permitId)
    .single();
  
  if (fetchError || !oldPermit) throw new Error('Permiso no encontrado');
  
  // 2. Crear nueva versión (permiso renovado)
  const newPermit = {
    company_id: oldPermit.company_id,
    location_id: oldPermit.location_id,
    type: oldPermit.type,
    status: 'vigente',
    permit_number: params.permitNumber,
    issue_date: params.issueDate,
    expiry_date: params.expiryDate,
    issuer: oldPermit.issuer,
    is_active: true,
    version: oldPermit.version + 1,
    superseded_by: null,
  };
  
  const { data: created, error: createError } = await supabase
    .from('permits')
    .insert(newPermit)
    .select()
    .single();
  
  if (createError) throw createError;
  
  // 3. Archivar permiso viejo
  await supabase
    .from('permits')
    .update({
      is_active: false,
      superseded_by: created.id,
      archived_at: new Date().toISOString(),
    })
    .eq('id', params.permitId);
  
  // 4. Subir documento si hay
  if (params.documentFile) {
    await uploadPermitDocument(created.id, params.documentFile);
  }
  
  return created;
}
```

#### `createPublicLink` (CRÍTICO PARA DEMO)

```typescript
// src/lib/api/publicLinks.ts

export async function createPublicLink(params: {
  companyId: string;
  locationId?: string; // null = toda la empresa
  label: string;
}) {
  const token = crypto.randomUUID();
  
  const { data, error } = await supabase
    .from('public_links')
    .insert({
      company_id: params.companyId,
      location_id: params.locationId || null,
      token,
      label: params.label,
      created_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    ...data,
    publicUrl: `https://enregla.ec/p/${token}`,
  };
}
```

#### `getPublicPermits` (Para vista pública sin auth)

```typescript
// src/lib/api/publicLinks.ts

export async function getPublicPermits(token: string) {
  const { data, error } = await supabase.rpc('get_public_permits', {
    link_token: token,
  });
  
  if (error) throw error;
  return data;
}
```

---

## Pantallas & Flujos

### 1. Onboarding Wizard

**Ruta:** `/onboarding`  
**Acceso:** Solo primera vez (redirect si ya completado)  
**Propósito:** Definir contexto del negocio y regulación aplicable

#### Paso 1: Datos de la Empresa

```
┌─────────────────────────────────────────┐
│ Paso 1 de 4                             │
│ Datos de tu empresa                     │
├─────────────────────────────────────────┤
│                                         │
│ Nombre comercial                        │
│ [input]                                 │
│                                         │
│ RUC                                     │
│ [input: 1234567890001]                  │
│                                         │
│ Ciudad principal                        │
│ [dropdown: Quito ▾]                     │
│   - Quito                               │
│   - Guayaquil                           │
│   - Cuenca                              │
│                                         │
│ Tipo de negocio                         │
│ [dropdown: Retail ▾]                    │
│   - Retail / Supermercados              │
│   - Restaurante / Comida                │
│   - Hotel / Hospedaje                   │
│   - Salud / Clínica                     │
│   - Otro                                │
│                                         │
│         [Cancelar]  [Siguiente →]       │
└─────────────────────────────────────────┘
```

#### Paso 2: Factores Regulatorios

```
┌─────────────────────────────────────────┐
│ Paso 2 de 4                             │
│ ¿Qué actividades realizas?              │
├─────────────────────────────────────────┤
│                                         │
│ Esto determina qué permisos necesitas   │
│                                         │
│ ┌───────────────────────────────────┐   │
│ │ [✓] Manejo de alimentos           │   │
│ │     Preparación, venta o almacén  │   │
│ └───────────────────────────────────┘   │
│                                         │
│ ┌───────────────────────────────────┐   │
│ │ [✓] Venta de alcohol              │   │
│ │     Licores, cervezas, vinos      │   │
│ └───────────────────────────────────┘   │
│                                         │
│ ┌───────────────────────────────────┐   │
│ │ [ ] Servicios de salud            │   │
│ │     Consultas, tratamientos       │   │
│ └───────────────────────────────────┘   │
│                                         │
│ ┌───────────────────────────────────┐   │
│ │ [ ] Manejo de químicos peligrosos │   │
│ │     Productos tóxicos, inflamables│   │
│ └───────────────────────────────────┘   │
│                                         │
│         [← Atrás]  [Siguiente →]        │
└─────────────────────────────────────────┘
```

#### Paso 3: Sedes Iniciales

```
┌─────────────────────────────────────────┐
│ Paso 3 de 4                             │
│ ¿Cuántas sedes tienes?                  │
├─────────────────────────────────────────┤
│                                         │
│ Número de locales                       │
│ [input: 3]                              │
│                                         │
│ ──────────────────────────────────────  │
│                                         │
│ Sede 1                                  │
│ Nombre: [Supermaxi El Bosque]           │
│ Dirección: [Av. 6 de Diciembre...]      │
│ Estado: [Operando ▾]                    │
│                                         │
│ Sede 2                                  │
│ Nombre: [Supermaxi Mall del Sol]        │
│ Dirección: [Av. Naciones Unidas...]     │
│ Estado: [Operando ▾]                    │
│                                         │
│ Sede 3                                  │
│ Nombre: [Supermaxi Norte]               │
│ Dirección: [Av. Eloy Alfaro...]         │
│ Estado: [En preparación ▾]              │
│                                         │
│ [+ Agregar otra sede]                   │
│                                         │
│         [← Atrás]  [Siguiente →]        │
└─────────────────────────────────────────┘
```

#### Paso 4: Revisión y Confirmación

```
┌─────────────────────────────────────────┐
│ Paso 4 de 4                             │
│ Revisión de tu configuración            │
├─────────────────────────────────────────┤
│                                         │
│ 📋 Resumen                              │
│                                         │
│ Empresa: Supermaxi Ecuador              │
│ Tipo: Retail / Supermercados            │
│ Ciudad: Quito                           │
│ Sedes: 3 locales                        │
│                                         │
│ ──────────────────────────────────────  │
│                                         │
│ 📝 Permisos aplicables generados        │
│                                         │
│ Basado en tus actividades, el sistema   │
│ generó estos permisos por sede:         │
│                                         │
│ Por cada sede:                          │
│ ✓ Patente Municipal                     │
│ ✓ Permiso de Bomberos                   │
│ ✓ Permiso Sanitario (ARCSA)             │
│ ✓ Licencia de Alcohol                   │
│                                         │
│ Total: 12 permisos a gestionar          │
│                                         │
│ ──────────────────────────────────────  │
│                                         │
│ ℹ️  Después podrás registrar los        │
│    permisos que ya tienes vigentes      │
│                                         │
│         [← Atrás]  [Activar Sistema]    │
└─────────────────────────────────────────┘
```

**Lógica al completar onboarding:**

1. Crear `company` record
2. Crear `locations` records (una por cada sede)
3. **Auto-generar `permits` con status `no_registrado`** basado en factores regulatorios
4. Calcular `risk_level` inicial por sede (todos 'medio' si tienen faltantes)
5. Redirect a dashboard

---

### 2. Dashboard Operativo

**Ruta:** `/`  
**Acceso:** Autenticado (cualquier rol)  
**Propósito:** Visión global operativa entre todas las sedes

#### Layout

```
┌────────────────────────────────────────────────────────────┐
│ HEADER                                                     │
│ [Logo] PermitOps | Supermaxi Ecuador                      │
│                                    3 sedes · 12 permisos   │
│                                    [User Menu: Admin ▾]    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ RISK OVERVIEW CARD (Hero)                                 │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Estado General: Control Regular                      │  │
│ │                                                      │  │
│ │        ┌─────┐                                       │  │
│ │        │ 🟡  │  Nivel de Riesgo: MEDIO              │  │
│ │        └─────┘                                       │  │
│ │                                                      │  │
│ │ Compliance: 83%  [████████░░] 10/12 vigentes        │  │
│ │                                                      │  │
│ │ ⚠️  2 alertas que requieren atención                │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                            │
│ MÉTRICAS (3 cols)                                         │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │
│ │ Vigentes    │ │ Por Vencer  │ │ Faltantes   │         │
│ │    10/12    │ │      2      │ │      2      │         │
│ │   (green)   │ │   (amber)   │ │    (red)    │         │
│ └─────────────┘ └─────────────┘ └─────────────┘         │
│                                                            │
│ PRÓXIMOS VENCIMIENTOS                                     │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Timeline (horizontal)                                │  │
│ │ • Bomberos - Mall del Sol (15 días) [Renovar]       │  │
│ │ • Sanidad - Supermaxi Norte (22 días) [Ver]         │  │
│ │                                      [Ver todos →]   │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                            │
│ SEDES (grid 3 cols)                                       │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      │
│ │ El Bosque    │ │ Mall del Sol │ │ Norte        │      │
│ │ 🟢 Operando  │ │ 🟡 Operando  │ │ 🔴 En prep.  │      │
│ │ Riesgo: Bajo │ │ Riesgo: Medio│ │ Riesgo: Alto │      │
│ │ 4/4 vigentes │ │ 3/4 (1 x venc│ │ 3/5 (2 falt.)│      │
│ │ ✓ Todo OK    │ │ ⚠️  Acción   │ │ 🚨 Urgente   │      │
│ │ [Ver detalle]│ │ [Ver detalle]│ │ [Ver detalle]│      │
│ └──────────────┘ └──────────────┘ └──────────────┘      │
│                                                            │
│ ACCIONES RÁPIDAS (solo operator/admin)                   │
│ [+ Agregar Sede] [+ Registrar Permiso] [🔗 Link Público]│
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Comportamiento por rol:**
- **Viewer:** Solo ve métricas y cards de sedes, SIN botones de "Acciones Rápidas"
- **Operator/Admin:** Ve todo + botones de acción

**Cálculo de métricas:**
- **Vigentes:** `status = 'vigente' AND is_active = true`
- **Por Vencer:** `status = 'por_vencer' AND is_active = true` (expiry_date < 30 días)
- **Faltantes:** `status = 'no_registrado' AND is_active = true`
- **Compliance %:** `(vigentes / total activos) * 100`
- **Risk Level:** 
  - Bajo: 0 faltantes, 0 por vencer
  - Medio: 1-2 alertas
  - Alto: 3+ alertas o sede en preparación
  - Crítico: vencidos

---

### 3. Vista por Sede

**Ruta:** `/sedes/:locationId`  
**Acceso:** Autenticado (cualquier rol)  
**Propósito:** Estado completo de una sede específica

#### Layout

```
┌────────────────────────────────────────────────────────────┐
│ HEADER DE SEDE                                             │
│ ← Volver al Dashboard                                      │
│                                                            │
│ Supermaxi Mall del Sol                                     │
│ Av. Naciones Unidas y Shyris, Quito                       │
│ [Operando] 🟡 Riesgo: Medio                                │
│                                                            │
│ [🔗 Link Público] [⚙️ Editar Sede]    (solo operator/admin)│
├────────────────────────────────────────────────────────────┤
│                                                            │
│ RESUMEN                                                    │
│ Permisos Vigentes: 3/4                                     │
│ Próximo Vencimiento: 15 días (Bomberos)                   │
│ Documentos: 8 archivos                                     │
│                                                            │
│ ──────────────────────────────────────────────────────────  │
│                                                            │
│ PERMISOS (tabla/grid)                                      │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ TIPO          │ ESTADO    │ VENCE     │ ACCIÓN     │   │
│ ├─────────────────────────────────────────────────────┤   │
│ │ Patente Muni. │ Vigente   │ 12/2026   │ [Ver]      │   │
│ │ Bomberos      │ Por vencer│ 05/15/26  │ [Renovar]  │⚠️ │
│ │ Sanidad       │ Vigente   │ 08/2026   │ [Ver]      │   │
│ │ Alcohol       │ Faltante  │ -         │ [Agregar]  │🚨 │
│ └─────────────────────────────────────────────────────┘   │
│                                                            │
│ ──────────────────────────────────────────────────────────  │
│                                                            │
│ LINK PÚBLICO ACTIVO (si existe)                           │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ 🔗 Vista Pública Activa                              │  │
│ │                                                      │  │
│ │ [Mini QR]  Token: ...abc123                         │  │
│ │            Inspector Municipal 2026                  │  │
│ │            Vistas: 3 · Último acceso: hace 2 horas  │  │
│ │                                                      │  │
│ │ [Copiar Link] [Ver QR] [Desactivar]                 │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                            │
│ ──────────────────────────────────────────────────────────  │
│                                                            │
│ DOCUMENTOS                                                 │
│ 📄 patente-municipal-2026.pdf (120 KB)                     │
│ 📄 bomberos-certificado-2025.pdf (85 KB)                   │
│ 📄 sanidad-arcsa-2026.pdf (95 KB)                          │
│                                                            │
│ [+ Subir Documento]                    (solo operator/admin)│
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Interacciones clave:**
- Click en "Renovar" → Modal de renovación (ver siguiente sección)
- Click en "🔗 Link Público" → Modal para generar link (si no existe) o gestionar (si existe)
- Click en "Ver QR" → Modal con QR grande + opciones de descarga/impresión
- Click en nombre de permiso → Detalle completo del permiso con historial de versiones

---

### 4. Modal de Renovación de Permiso

**Trigger:** Click "Renovar" en un permiso `por_vencer`  
**Propósito:** Demostrar versionado trazable sin pérdida de historial

#### Layout del Modal

```
┌───────────────────────────────────────────────┐
│ Renovar Permiso: Bomberos                    │
│                                          [×]  │
├───────────────────────────────────────────────┤
│                                               │
│ PERMISO ACTUAL                                │
│ ┌───────────────────────────────────────┐     │
│ │ Versión: v1                           │     │
│ │ Emisión: 2025-05-10                   │     │
│ │ Vence: 2026-05-15 (en 15 días) ⚠️     │     │
│ └───────────────────────────────────────┘     │
│                                               │
│ NUEVA VERSIÓN                                 │
│                                               │
│ Número de permiso                             │
│ [input: CB-2026-005678]                       │
│                                               │
│ Fecha de emisión                              │
│ [date picker: 2026-05-16]                     │
│                                               │
│ Fecha de vencimiento                          │
│ [date picker: 2027-05-15]                     │
│                                               │
│ Documento (opcional)                          │
│ [file upload: bomberos-2026.pdf]              │
│ Arrastra o haz click para subir               │
│                                               │
│ ──────────────────────────────────────────    │
│                                               │
│ ℹ️  Al renovar:                               │
│    • Se creará una nueva versión (v2)        │
│    • La versión actual se archivará          │
│    • El historial completo se conservará     │
│                                               │
│         [Cancelar]  [Renovar Permiso]         │
└───────────────────────────────────────────────┘
```

**Flujo al confirmar:**

1. Validar campos (número, fechas)
2. Llamar a `renewPermit` API:
   - Crear nuevo permit (version = 2, is_active = true)
   - Archivar viejo (is_active = false, superseded_by = nuevo_id)
   - Subir documento a Supabase Storage si hay
3. Toast de éxito: "✓ Permiso renovado. Nueva versión creada."
4. Actualizar UI:
   - En tabla de permisos: status cambia a "Vigente"
   - En detalle de permiso: mostrar historial

#### Vista de Historial de Versiones (en detalle de permiso)

```
HISTORIAL DE VERSIONES

┌───────────────────────────────────────────────┐
│ v2 (Actual) ✓                                 │
│ Estado: Vigente                               │
│ Vigencia: 05/16/2026 - 05/15/2027            │
│ Número: CB-2026-005678                        │
│ Documento: bomberos-2026.pdf                  │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│ v1 (Archivada)                                │
│ Estado: Vigente (en su momento)               │
│ Vigencia: 05/10/2025 - 05/15/2026            │
│ Número: CB-2025-001234                        │
│ Documento: bomberos-2025.pdf                  │
│ Archivado: 13/04/2026 10:30 AM                │
└───────────────────────────────────────────────┘
```

---

### 5. Generar Link Público

**Trigger:** Click "🔗 Link Público" en dashboard o en vista de sede  
**Propósito:** Crear link tokenizado para verificación externa

#### Modal de Generación (si no existe link)

```
┌───────────────────────────────────────────────┐
│ Generar Link Público de Verificación         │
│                                          [×]  │
├───────────────────────────────────────────────┤
│                                               │
│ Alcance                                       │
│ ○ Toda la empresa (12 permisos vigentes)     │
│ ● Solo esta sede: Supermaxi Mall del Sol     │
│   (3 permisos vigentes)                       │
│                                               │
│ Etiqueta (para referencia interna)           │
│ [input: Inspector Municipal 2026]             │
│                                               │
│ ──────────────────────────────────────────    │
│                                               │
│ ℹ️  Este link:                                │
│    • Mostrará solo permisos vigentes         │
│    • No requiere login                        │
│    • Puede desactivarse en cualquier momento │
│    • Registra cuándo fue visto               │
│                                               │
│         [Cancelar]  [Generar Link]            │
└───────────────────────────────────────────────┘
```

#### Modal de Éxito (con QR)

```
┌───────────────────────────────────────────────┐
│ ✓ Link Público Generado                      │
│                                          [×]  │
├───────────────────────────────────────────────┤
│                                               │
│        ┌─────────────────────────┐            │
│        │                         │            │
│        │                         │            │
│        │      [QR CODE]          │            │
│        │       256x256           │            │
│        │                         │            │
│        │                         │            │
│        └─────────────────────────┘            │
│                                               │
│ https://enregla.ec/p/abc123def456ghi789       │
│                                               │
│ [Copiar Link] [Descargar QR] [Imprimir QR]   │
│                                               │
│ ──────────────────────────────────────────    │
│                                               │
│ 💡 Tip: Imprime este QR y colócalo en la     │
│    entrada del local para que inspectores    │
│    o clientes puedan escanear y verificar    │
│    permisos vigentes en tiempo real.         │
│                                               │
│              [Cerrar]                         │
└───────────────────────────────────────────────┘
```

**Funcionalidad de botones:**
- **Copiar Link:** Copiar URL al clipboard
- **Descargar QR:** Exportar QR como PNG (256x256 o 512x512)
- **Imprimir QR:** Abrir ventana de impresión con layout optimizado:
  ```
  [Logo PermitOps]
  
  Inspector Municipal 2026
  Supermaxi Mall del Sol
  
  [QR CODE - grande]
  
  Escanea este código para verificar permisos vigentes
  https://enregla.ec/p/abc123...
  ```

---

### 6. Vista Pública Externa (Sin Login)

**Ruta:** `/p/:token`  
**Acceso:** Público (sin auth)  
**Propósito:** Vista externa limpia para verificación de permisos vigentes

#### Layout

```
┌────────────────────────────────────────────────────────────┐
│ HEADER PÚBLICO (diferente de UI interna)                  │
│                                                            │
│       [Logo] PermitOps                                     │
│       Verificación de Cumplimiento Legal                   │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ IDENTIFICACIÓN DEL ESTABLECIMIENTO                        │
│ ┌──────────────────────────────────────────────────────┐  │
│ │                                                      │  │
│ │ Supermaxi Ecuador                                    │  │
│ │ Sede: Mall del Sol                                   │  │
│ │ Av. Naciones Unidas y Shyris, Quito                  │  │
│ │                                                      │  │
│ │ ✅ Esta sede mantiene todos sus permisos legales     │  │
│ │    vigentes y actualizados                           │  │
│ │                                                      │  │
│ │ Última actualización: Abril 13, 2026                 │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                            │
│ ──────────────────────────────────────────────────────────  │
│                                                            │
│ PERMISOS VIGENTES                                         │
│                                                            │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ 🏛️ Patente Municipal                                 │  │
│ │ Número: PM-2026-001234                               │  │
│ │ Emisor: Municipio de Quito                           │  │
│ │ Vigencia: Enero 2026 - Diciembre 2026               │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                            │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ 🚒 Permiso de Bomberos                               │  │
│ │ Número: CB-2026-005678                               │  │
│ │ Emisor: Cuerpo de Bomberos de Quito                 │  │
│ │ Vigencia: Mayo 2026 - Mayo 2027                     │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                            │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ 🏥 Permiso Sanitario                                 │  │
│ │ Número: ARCSA-2026-009876                            │  │
│ │ Emisor: ARCSA Ecuador                                │  │
│ │ Vigencia: Marzo 2026 - Agosto 2026                  │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ FOOTER                                                     │
│                                                            │
│ Esta vista pública es generada en tiempo real por el      │
│ sistema de gestión PermitOps.                              │
│                                                            │
│ Los datos mostrados reflejan únicamente permisos activos  │
│ y vigentes a la fecha de consulta.                        │
│                                                            │
│ Powered by PermitOps | enregla.ec                          │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Lo que NO muestra:**
- ❌ Permisos vencidos
- ❌ Permisos archivados (superseded)
- ❌ Permisos faltantes (`no_registrado`)
- ❌ Risk levels internos
- ❌ Notas privadas
- ❌ Botones de acción
- ❌ Links de edición
- ❌ Información de usuarios

**Solo muestra:**
- ✅ `status = 'vigente' AND is_active = true`
- ✅ Información pública: tipo, número, emisor, fechas
- ✅ Layout limpio y profesional
- ✅ Branding de PermitOps

**Tracking automático:**
Cada vez que alguien accede a `/p/:token`, la función `get_public_permits` automáticamente:
1. Incrementa `view_count`
2. Actualiza `last_viewed_at`

**Responsive:**
- Desktop: Cards en grid 1 col, anchos
- Tablet/Mobile: Stack vertical, optimizado para escaneo rápido

---

## Seed Data para Demo

### Empresa Demo: Supermaxi Ecuador

```javascript
const DEMO_COMPANY = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Supermaxi Ecuador',
  business_type: 'Retail - Supermercados',
  city: 'Quito',
  location_count: 3,
  regulatory_factors: {
    food: true,
    alcohol: true,
    health: false,
    chemicals: false,
  },
};
```

### 3 Sedes con Estados Diferentes

#### Sede 1: El Bosque (TODO OK)

```javascript
{
  id: 'loc-1',
  name: 'Supermaxi El Bosque',
  address: 'Av. 6 de Diciembre y Portugal, Quito',
  status: 'operando',
  risk_level: 'bajo',
  permits: [
    {
      type: 'patente_municipal',
      status: 'vigente',
      permit_number: 'PM-2026-001111',
      issue_date: '2026-01-15',
      expiry_date: '2026-12-31',
      issuer: 'Municipio de Quito',
      is_active: true,
      version: 1,
    },
    {
      type: 'bomberos',
      status: 'vigente',
      permit_number: 'CB-2026-001111',
      issue_date: '2026-03-10',
      expiry_date: '2027-03-15',
      issuer: 'Cuerpo de Bomberos de Quito',
      is_active: true,
      version: 1,
    },
    {
      type: 'sanidad',
      status: 'vigente',
      permit_number: 'ARCSA-2026-001111',
      issue_date: '2026-02-20',
      expiry_date: '2026-09-20',
      issuer: 'ARCSA Ecuador',
      is_active: true,
      version: 1,
    },
    {
      type: 'alcohol',
      status: 'vigente',
      permit_number: 'ALC-2026-001111',
      issue_date: '2026-01-05',
      expiry_date: '2026-11-05',
      issuer: 'Ministerio de Salud Pública',
      is_active: true,
      version: 1,
    },
  ],
}
```

#### Sede 2: Mall del Sol (CON ALERTA - para demo de renovación)

```javascript
{
  id: 'loc-2',
  name: 'Supermaxi Mall del Sol',
  address: 'Av. Naciones Unidas y Shyris, Quito',
  status: 'operando',
  risk_level: 'medio',
  permits: [
    {
      type: 'patente_municipal',
      status: 'vigente',
      permit_number: 'PM-2026-002222',
      issue_date: '2026-01-15',
      expiry_date: '2026-12-31',
      issuer: 'Municipio de Quito',
      is_active: true,
      version: 1,
    },
    {
      // ⭐ ESTE ES EL QUE SE RENOVARÁ EN LA DEMO
      type: 'bomberos',
      status: 'por_vencer',
      permit_number: 'CB-2025-002222',
      issue_date: '2025-05-10',
      expiry_date: '2026-05-15', // 15 días desde hoy (2026-04-30)
      issuer: 'Cuerpo de Bomberos de Quito',
      is_active: true,
      version: 1,
    },
    {
      type: 'sanidad',
      status: 'vigente',
      permit_number: 'ARCSA-2026-002222',
      issue_date: '2026-02-10',
      expiry_date: '2026-08-10',
      issuer: 'ARCSA Ecuador',
      is_active: true,
      version: 1,
    },
    {
      type: 'alcohol',
      status: 'no_registrado', // ⚠️ Faltante
      permit_number: null,
      issue_date: null,
      expiry_date: null,
      issuer: null,
      is_active: true,
      version: 1,
    },
  ],
  // ⭐ Link público ya existente para esta sede
  public_link: {
    id: 'link-1',
    token: 'abc123def456ghi789jkl012',
    label: 'Inspector Municipal 2026',
    is_active: true,
    view_count: 3,
    last_viewed_at: '2026-04-13T11:00:00Z', // hace 2 horas (asumiendo demo a las 13:00)
    created_at: '2026-04-10T09:00:00Z',
  },
}
```

#### Sede 3: Norte (ALTO RIESGO - en preparación)

```javascript
{
  id: 'loc-3',
  name: 'Supermaxi Norte',
  address: 'Av. Eloy Alfaro y Gaspar de Villarroel, Quito',
  status: 'en_preparacion',
  risk_level: 'alto',
  permits: [
    {
      type: 'patente_municipal',
      status: 'vigente',
      permit_number: 'PM-2026-003333',
      issue_date: '2026-01-15',
      expiry_date: '2026-12-31',
      issuer: 'Municipio de Quito',
      is_active: true,
      version: 1,
    },
    {
      type: 'bomberos',
      status: 'no_registrado', // 🚨 Faltante
      permit_number: null,
      issue_date: null,
      expiry_date: null,
      issuer: null,
      is_active: true,
      version: 1,
    },
    {
      type: 'sanidad',
      status: 'por_vencer',
      permit_number: 'ARCSA-2026-003333',
      issue_date: '2025-08-22',
      expiry_date: '2026-05-22', // 22 días desde hoy
      issuer: 'ARCSA Ecuador',
      is_active: true,
      version: 1,
    },
    {
      type: 'alcohol',
      status: 'no_registrado', // 🚨 Faltante
      permit_number: null,
      issue_date: null,
      expiry_date: null,
      issuer: null,
      is_active: true,
      version: 1,
    },
  ],
}
```

### Script de Seed

```typescript
// scripts/seed-demo.ts

export async function seedDemoData() {
  // 1. Crear empresa
  const company = await supabase.from('companies').insert(DEMO_COMPANY).select().single();
  
  // 2. Crear sedes
  const locations = [SEDE_EL_BOSQUE, SEDE_MALL_DEL_SOL, SEDE_NORTE];
  for (const loc of locations) {
    const location = await supabase.from('locations').insert({
      company_id: company.data.id,
      ...loc,
    }).select().single();
    
    // 3. Crear permisos para cada sede
    for (const permit of loc.permits) {
      await supabase.from('permits').insert({
        company_id: company.data.id,
        location_id: location.data.id,
        ...permit,
      });
    }
  }
  
  // 4. Crear link público para Sede 2
  await supabase.from('public_links').insert({
    company_id: company.data.id,
    location_id: 'loc-2', // Mall del Sol
    token: 'abc123def456ghi789jkl012',
    label: 'Inspector Municipal 2026',
    is_active: true,
    view_count: 3,
    last_viewed_at: '2026-04-13T11:00:00Z',
    created_by: (await supabase.auth.getUser()).data.user?.id,
  });
  
  console.log('✓ Demo data seeded successfully');
}
```

---

## Orden de Construcción (4 Semanas DEMO-GRADE)

### SEMANA 1: Fundación + Onboarding + Dashboard

**Objetivo:** Auth funcionando + onboarding completo + dashboard con seed data

**Entregables:**
- [ ] Setup de Supabase (proyecto + schema + RLS básica)
- [ ] Auth básica (login/register/logout)
- [ ] Onboarding wizard (4 pasos completos)
- [ ] Dashboard operativo con métricas reales
- [ ] Seed script con data de Supermaxi
- [ ] Navegación básica (header + sidebar + rutas)

**Tests de validación:**
- ✅ Usuario puede registrarse → completar onboarding → ver dashboard
- ✅ Dashboard muestra 3 sedes con métricas correctas
- ✅ Cálculo de risk levels y compliance % funciona

---

### SEMANA 2: Vista de Sede + Renovación

**Objetivo:** Detalle por sede + renovación con versionado

**Entregables:**
- [ ] Vista detallada de sede con grid de permisos
- [ ] Modal de renovación de permiso
- [ ] Lógica de versionado (`is_active`, `version`, `superseded_by`)
- [ ] Vista de historial de versiones en detalle de permiso
- [ ] Upload de documentos a Supabase Storage
- [ ] Lista de documentos asociados a permiso

**Tests de validación:**
- ✅ Click en sede → ver detalle con permisos
- ✅ Click "Renovar" → completar modal → nueva versión creada
- ✅ Permiso viejo archivado correctamente
- ✅ Historial muestra v1 (archivada) y v2 (actual)

---

### SEMANA 3: Link Público + QR + Vista Externa

**Objetivo:** Transparencia externa con QR descargable

**Entregables:**
- [ ] Modal para generar link público (alcance: sede o empresa)
- [ ] Generación de token único y almacenamiento en DB
- [ ] Modal de éxito con QR code grande
- [ ] Funcionalidad "Copiar Link"
- [ ] Funcionalidad "Descargar QR" (PNG 512x512)
- [ ] Funcionalidad "Imprimir QR" (layout optimizado)
- [ ] Ruta `/p/:token` sin auth
- [ ] Vista pública con solo permisos vigentes
- [ ] Tracking automático de `view_count` y `last_viewed_at`
- [ ] Banner en vista de sede mostrando acceso externo

**Tests de validación:**
- ✅ Generar link → QR se muestra correctamente
- ✅ Copiar link → URL en clipboard
- ✅ Descargar QR → PNG de 512x512 descargado
- ✅ Imprimir QR → ventana de impresión con layout correcto
- ✅ Abrir `/p/:token` en incognito → ver solo permisos vigentes
- ✅ Refresh vista pública → view_count incrementa
- ✅ Banner interno muestra "Visto hace X tiempo"

---

### SEMANA 4: Polish + Roles + Demo-Ready

**Objetivo:** UI premium + roles funcionando + ensayo de demo

**Entregables:**
- [ ] Implementación de roles (admin/operator/viewer)
- [ ] RLS por rol funcionando
- [ ] Dashboard adapta UI según rol (viewer no ve botones)
- [ ] Vista de sede adapta UI según rol
- [ ] Transiciones suaves con Framer Motion
- [ ] Loading states consistentes
- [ ] Empty states básicos
- [ ] Polish visual (espaciado, colores, tipografía premium)
- [ ] Responsive básico (desktop + tablet)
- [ ] Ensayo completo del relato demo de 5 minutos
- [ ] Documentación README para setup

**Tests de validación:**
- ✅ Usuario con rol "viewer" NO ve botones de acción
- ✅ Usuario con rol "operator" puede renovar permisos
- ✅ Usuario con rol "admin" puede generar links públicos
- ✅ Relato demo funciona end-to-end sin errores
- ✅ UI se siente premium y profesional

---

## Métricas de Éxito del Demo

### Durante la Demo (observable)

- ✅ Dashboard carga en <2 segundos
- ✅ Navegación fluida sin bugs visibles
- ✅ Modal de renovación se completa sin errores
- ✅ QR se genera y descarga correctamente
- ✅ Vista pública carga sin login
- ✅ UI se siente premium y seria (no genérica)

### Post-Demo (feedback del cliente)

**El cliente debe pensar:**
- "Esto me da control sobre el caos actual"
- "Esto reduce el riesgo de multas/cierres"
- "Esto nos hace ver más profesionales ante inspectores"
- "Esto está años adelante de Excel y carpetas"
- "Quiero esto para mi negocio"

**El cliente NO debe decir:**
- "¿Cómo funciona X?" (debe ser obvio)
- "Esto se ve genérico" (debe sentirse custom)
- "No veo el valor" (debe ser inmediato)
- "Necesito pensarlo" (debe ser convincente)

---

## Scope OUT (No incluir en V1)

Para mantener enfoque demo-grade, estas features quedan fuera:

### Features
- ❌ Gestión de tareas (demasiada complejidad)
- ❌ Sistema de renovaciones separado (simplificar: renovar = nueva versión)
- ❌ Notificaciones email automáticas (no crítico para demo)
- ❌ Audit log completo (track básico suficiente)
- ❌ User management UI (crear usuarios manualmente en Supabase)
- ❌ Multi-tenant con signup público (solo demo con 1 empresa)
- ❌ Exports avanzados (CSV, Excel)
- ❌ Analytics/reporting complejo
- ❌ Integración con APIs de gobierno
- ❌ Mobile apps nativas
- ❌ Dark mode

### Técnico
- ❌ Testing E2E exhaustivo (solo smoke tests)
- ❌ CI/CD pipeline complejo
- ❌ Monitoring profundo (Sentry, Datadog)
- ❌ Performance optimization avanzado
- ❌ Caching strategies
- ❌ Rate limiting
- ❌ API versioning
- ❌ Webhooks
- ❌ Real-time subscriptions (Supabase realtime)

---

## Deployment (Simplificado para Demo)

### Staging Environment

```
Vercel
├── URL: https://permitops-demo.vercel.app
├── Branch: main
└── Auto-deploy on push

Supabase
├── Project: permitops-demo
├── Plan: Free tier (suficiente para demo)
└── Database: con seed data pre-cargado
```

### Variables de Entorno

```bash
# .env.local
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Pre-Demo Checklist

- [ ] DB tiene seed data de Supermaxi
- [ ] Link público de Mall del Sol está activo
- [ ] View count está en 3 (hace 2 horas)
- [ ] Bomberos de Mall del Sol está por vencer (15 días)
- [ ] Usuario demo: `demo@supermaxi.com` / `Demo2026!`
- [ ] URL pública de QR funciona: `enregla.ec/p/abc123...`
- [ ] App deployada en `permitops-demo.vercel.app` o `enregla.ec`

---

## Por Qué Este Diseño Funciona

### 1. Relato Claro
Cada pantalla sirve a uno de los 5 actos del relato demo. No hay features "porque sí".

### 2. Versionado Visible
El historial de versiones de permisos es **tangible y convincente**. El cliente ve que no se pierde información.

### 3. QR es Demo Gold
Imprimir el QR y mostrarlo físicamente en la demo es un momento "wow". Es **concreto y accionable**.

### 4. Vista Pública Limpia
Mostrar la diferencia entre el "desorden interno" y la "presentación externa" es poderoso. Demuestra **control y profesionalismo**.

### 5. Roles Simples pero Efectivos
3 roles (admin/operator/viewer) cubren 90% de casos reales sin complejidad innecesaria.

### 6. Seed Data Realista
Supermaxi con 3 sedes, diferentes estados de riesgo, permisos por vencer, y faltantes hace la demo **creíble y relatable**.

### 7. UI Premium
No usar templates genéricos de admin. Jerarquía visual fuerte, espaciado generoso, color usado estratégicamente.

---

## Siguientes Pasos

1. **Revisar este spec** - ¿Algo falta? ¿Algo sobra?
2. **Aprobar diseño** - Confirmar que el relato y las pantallas tienen sentido
3. **Escribir plan de implementación** - Breakdown técnico detallado semana por semana
4. **Empezar construcción** - Semana 1: Fundación + Onboarding + Dashboard

---

**Fin del Spec - PermitOps V1 DEMO-GRADE**
