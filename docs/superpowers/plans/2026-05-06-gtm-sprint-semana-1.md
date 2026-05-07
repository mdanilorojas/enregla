# GTM Sprint — Semana 1 (Fundación Técnica)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Desplegar la infraestructura técnica que permite capturar leads desde la landing PYME, agendar demos, enviar alertas de vencimiento por email, y gestionar prospectos desde un CRM interno.

**Architecture:** Dos repos separados trabajando en conjunto. `enregla-landing` (Vite+React) expone form de captura de leads que escribe a Supabase. `enregla` (producto) tiene Edge Function ya desplegada para alertas 30/15/7 días, un CRM interno nuevo en `/internal/crm`, y una tabla `leads` compartida con la landing. Cal.com + Resend integran el funnel de demos.

**Tech Stack:**
- Producto: React 19, Vite 8, Tailwind 4, Supabase (Postgres + Edge Functions + Storage), Atlassian DS tokens
- Landing: Vite + React + Tailwind 4, deployed en Vercel
- Backend: Supabase JS client en landing para INSERT en tabla `leads`; Edge Function Deno para email alerts
- Email: Resend API
- Agendamiento: Cal.com (free tier)

**Repos afectados:**
- `C:\dev\enregla\` — producto (CRM interno, migrations, Edge Function config)
- `C:\dev\enregla-landing\` — landing pública (páginas nuevas, form de captura)

**Duración estimada:** 7 días (días 1-7 del sprint de 30 días).

---

## Orden de ejecución

```
Día 1 — Verificación + Deploy Email Notifications (pendiente)
Día 2 — Tabla leads en Supabase + form en landing + RLS
Día 3 — Páginas /diagnostico, /partners, /sobre en landing + routing
Día 4 — CRM interno en producto (ruta /internal/crm)
Día 5 — Integración Cal.com + Resend (email de confirmación)
Día 6 — QA end-to-end + merge a main + deploy
Día 7 — Buffer / fixes / documentación
```

---

## File Structure

### Files to create

**Repo `enregla`:**
- `supabase/migrations/20260506000000_leads_table.sql` — tabla `leads` + RLS
- `supabase/migrations/20260506000100_partners_crm.sql` — tabla `partners` para CRM
- `src/features/internal-crm/InternalCrmView.tsx` — ruta principal del CRM
- `src/features/internal-crm/LeadsTable.tsx` — tabla de leads
- `src/features/internal-crm/PartnersTable.tsx` — tabla de partners
- `src/features/internal-crm/PartnerScorecard.tsx` — componente de scoring
- `src/hooks/useLeads.ts` — hook CRUD para leads
- `src/hooks/usePartners.ts` — hook CRUD para partners
- `src/types/crm.ts` — tipos TypeScript
- `src/features/internal-crm/__tests__/PartnerScorecard.test.tsx` — tests
- `docs/deployment/email-notifications-verification.md` — checklist deploy

**Repo `enregla-landing`:**
- `src/lib/supabase.ts` — cliente Supabase anon (solo INSERT a `leads`)
- `src/lib/leads.ts` — función `submitLead()`
- `src/pages/Diagnostico.tsx` — página de diagnóstico 7 días
- `src/pages/Partners.tsx` — página B2B para enablers
- `src/pages/Sobre.tsx` — página sobre Aura/Danilo
- `src/components/LeadForm.tsx` — form reusable en todas las páginas
- `src/App.tsx` — refactor para soportar routing (react-router-dom)
- `src/lib/router.tsx` — configuración de rutas
- `.env.local.template` — plantilla de env vars
- `.env.local` — valores reales (gitignored)

### Files to modify

**Repo `enregla`:**
- `src/App.tsx` — agregar ruta `/internal/crm`
- `src/components/layout/AppLayout.tsx` — link al CRM en navigation (solo visible para admins)

**Repo `enregla-landing`:**
- `package.json` — agregar `react-router-dom`, `@supabase/supabase-js`
- `index.html` — agregar OG image path

---

## Task 1: Verificar y desplegar email notifications (producto)

**Context:** El código de la Edge Function `send-expiry-alerts`, las tablas (`notification_logs`, `notification_preferences`), y la migration de pg_cron (013) ya están en el repo. Lo que no sabemos es si todo está desplegado en Supabase remoto. Este task verifica y completa lo que falte.

**Files:**
- Read: `supabase/functions/send-expiry-alerts/index.ts` (ya existe)
- Read: `supabase/migrations/011_notification_tables.sql` (ya existe)
- Read: `supabase/migrations/013_enable_pg_cron.sql` (ya existe)
- Create: `docs/deployment/email-notifications-verification.md`

- [ ] **Step 1.1: Verificar migrations aplicadas en Supabase remoto**

Desde el MCP de Supabase (o Dashboard SQL Editor), correr:
```sql
SELECT migration_name FROM supabase_migrations.schema_migrations
WHERE migration_name LIKE '%notification%' OR migration_name LIKE '%pg_cron%'
ORDER BY migration_name;
```
Expected: ver 011, 012, 013, 014, 20260422160553.

Si faltan, aplicar con: `mcp__supabase__apply_migration`.

- [ ] **Step 1.2: Verificar tablas existen**

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('notification_logs', 'notification_preferences');
```
Expected: 2 rows.

- [ ] **Step 1.3: Verificar pg_cron extension**

```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```
Expected: 1 row.

- [ ] **Step 1.4: Verificar Edge Function desplegada**

En Supabase Dashboard → Edge Functions, confirmar que `send-expiry-alerts` aparece como "Active".

Si no está, desplegar con Supabase CLI:
```bash
cd C:/dev/enregla
supabase functions deploy send-expiry-alerts --project-ref zqaqhapxqwkvninnyqiu
```

- [ ] **Step 1.5: Configurar secret RESEND_API_KEY**

En Supabase Dashboard → Edge Functions → Secrets, agregar:
- `RESEND_API_KEY` = (del dashboard de Resend)
- `RESEND_FROM_EMAIL` = `alertas@enregla.com` (requiere DNS verificado en Resend)

Verificar con:
```bash
supabase secrets list --project-ref zqaqhapxqwkvninnyqiu
```

- [ ] **Step 1.6: Crear cron job diario**

Desde Supabase Dashboard SQL Editor:
```sql
SELECT cron.schedule(
  'send-expiry-alerts-daily',
  '0 8 * * *',  -- 8:00 AM UTC = 3:00 AM Ecuador
  $$
  SELECT net.http_post(
    url := 'https://zqaqhapxqwkvninnyqiu.supabase.co/functions/v1/send-expiry-alerts',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
      'Content-Type', 'application/json'
    )
  );
  $$
);
```

Verificar:
```sql
SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'send-expiry-alerts-daily';
```
Expected: 1 row con `active = true`.

- [ ] **Step 1.7: Test manual de la función**

```bash
curl -X POST \
  'https://zqaqhapxqwkvninnyqiu.supabase.co/functions/v1/send-expiry-alerts' \
  -H 'Authorization: Bearer <SUPABASE_ANON_KEY>' \
  -H 'Content-Type: application/json'
```
Expected: JSON response con `sent`, `failed`, `skipped`.

- [ ] **Step 1.8: Crear documento de verificación**

Crear `docs/deployment/email-notifications-verification.md` con checklist de arriba y status de cada item (✅/❌ + notas).

- [ ] **Step 1.9: Commit**

```bash
cd C:/dev/enregla
git add docs/deployment/email-notifications-verification.md
git commit -m "docs(deployment): verificación del deploy de email notifications"
```

---

## Task 2: Tabla `leads` en Supabase (producto)

**Context:** La landing necesita escribir leads capturados. Tabla accesible por INSERT anónimo (sin auth) desde la landing, pero SELECT/UPDATE/DELETE solo para admins autenticados del producto.

**Files:**
- Create: `supabase/migrations/20260506000000_leads_table.sql`

- [ ] **Step 2.1: Escribir migration**

Crear archivo `supabase/migrations/20260506000000_leads_table.sql`:

```sql
-- =============================================
-- Leads table (captured from enregla-landing)
-- =============================================

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Datos del lead
  nombre TEXT NOT NULL,
  negocio TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT,
  ciudad TEXT,
  num_sedes INTEGER,

  -- Origen y tracking
  source TEXT NOT NULL CHECK (source IN ('diagnostico', 'partners', 'home', 'sobre', 'otro')),
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT,
  user_agent TEXT,

  -- Estado en pipeline
  status TEXT NOT NULL DEFAULT 'nuevo' CHECK (status IN (
    'nuevo',
    'contactado',
    'demo_agendada',
    'demo_completada',
    'convertido',
    'rechazado',
    'nurture'
  )),

  -- Campos adicionales
  notas TEXT,
  assigned_to UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_email ON leads(email);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policy: INSERT anónimo permitido (desde landing pública)
CREATE POLICY "Anyone can insert leads"
ON leads FOR INSERT
WITH CHECK (true);

-- Policy: SELECT solo usuarios autenticados
CREATE POLICY "Authenticated users can read leads"
ON leads FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Policy: UPDATE solo usuarios autenticados
CREATE POLICY "Authenticated users can update leads"
ON leads FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Policy: DELETE solo usuarios autenticados
CREATE POLICY "Authenticated users can delete leads"
ON leads FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Trigger: update updated_at on changes
CREATE OR REPLACE FUNCTION public.update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_update_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_leads_updated_at();

COMMENT ON TABLE leads IS 'Leads capturados desde enregla-landing, gestionados en CRM interno';
```

- [ ] **Step 2.2: Aplicar migration**

Usando MCP:
```
mcp__supabase__apply_migration con el archivo 20260506000000_leads_table.sql
```

Verificar:
```sql
SELECT * FROM leads LIMIT 0;
```
Expected: tabla existe, 0 rows.

- [ ] **Step 2.3: Verificar RLS funciona**

Test INSERT anónimo (con anon key, sin auth):
```sql
-- Como usuario anon (service_role NO)
INSERT INTO leads (nombre, negocio, email, source)
VALUES ('Test', 'Test Negocio', 'test@example.com', 'diagnostico');
```
Expected: éxito.

Test SELECT anónimo:
```sql
SELECT * FROM leads;
```
Expected: error o 0 rows (RLS bloquea).

Cleanup:
```sql
DELETE FROM leads WHERE email = 'test@example.com';
```

- [ ] **Step 2.4: Commit**

```bash
cd C:/dev/enregla
git add supabase/migrations/20260506000000_leads_table.sql
git commit -m "feat(db): tabla leads para captura desde landing"
```

---

## Task 3: Tabla `partners` en Supabase (producto)

**Context:** Para el CRM interno, necesitamos tabla de partners (enablers). Separada de leads porque el modelo es distinto — scorecard, estado específico, potencial.

**Files:**
- Create: `supabase/migrations/20260506000100_partners_crm.sql`

- [ ] **Step 3.1: Escribir migration**

Crear `supabase/migrations/20260506000100_partners_crm.sql`:

```sql
-- =============================================
-- Partners (enablers) CRM table
-- =============================================

CREATE TABLE partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Datos básicos
  nombre_negocio TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN (
    'contadora',
    'tramitador',
    'arcsa',
    'bomberos',
    'legal',
    'asesor_admin',
    'pos_provider',
    'gremio',
    'otro'
  )),
  contacto_nombre TEXT,
  email TEXT,
  telefono TEXT,
  ciudad TEXT,

  -- Scoring (8 criterios × 1-5 = max 40)
  score_acceso_decision_makers INTEGER CHECK (score_acceso_decision_makers BETWEEN 1 AND 5),
  score_dolor_frecuente INTEGER CHECK (score_dolor_frecuente BETWEEN 1 AND 5),
  score_confianza_clientes INTEGER CHECK (score_confianza_clientes BETWEEN 1 AND 5),
  score_velocidad_referir INTEGER CHECK (score_velocidad_referir BETWEEN 1 AND 5),
  score_complementariedad INTEGER CHECK (score_complementariedad BETWEEN 1 AND 5),
  score_velocidad_ejecucion INTEGER CHECK (score_velocidad_ejecucion BETWEEN 1 AND 5),
  score_mindset_comercial INTEGER CHECK (score_mindset_comercial BETWEEN 1 AND 5),
  score_riesgo_mal_partner INTEGER CHECK (score_riesgo_mal_partner BETWEEN 1 AND 5),
  score_total INTEGER GENERATED ALWAYS AS (
    COALESCE(score_acceso_decision_makers, 0) +
    COALESCE(score_dolor_frecuente, 0) +
    COALESCE(score_confianza_clientes, 0) +
    COALESCE(score_velocidad_referir, 0) +
    COALESCE(score_complementariedad, 0) +
    COALESCE(score_velocidad_ejecucion, 0) +
    COALESCE(score_mindset_comercial, 0) +
    COALESCE(score_riesgo_mal_partner, 0)
  ) STORED,

  -- Estado en pipeline
  status TEXT NOT NULL DEFAULT 'identificado' CHECK (status IN (
    'identificado',
    'contactado',
    'respondio',
    'reunion_agendada',
    'pilot_propuesto',
    'pilot_activo',
    'convertido',
    'rechazado',
    'nurture'
  )),

  -- Potencial estimado
  potencial_clientes_estimado INTEGER,

  -- Próxima acción
  proxima_accion TEXT,
  proxima_accion_fecha DATE,

  notas TEXT,
  assigned_to UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_partners_status ON partners(status);
CREATE INDEX idx_partners_tipo ON partners(tipo);
CREATE INDEX idx_partners_score_total ON partners(score_total DESC);
CREATE INDEX idx_partners_proxima_accion ON partners(proxima_accion_fecha);

-- Enable RLS
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

-- Policy: solo usuarios autenticados (CRM interno)
CREATE POLICY "Authenticated users can manage partners"
ON partners FOR ALL
USING (auth.uid() IS NOT NULL);

-- Trigger: update updated_at
CREATE OR REPLACE FUNCTION public.update_partners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER partners_update_updated_at
  BEFORE UPDATE ON partners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_partners_updated_at();

COMMENT ON TABLE partners IS 'Partners (enablers) en pipeline — gestionados desde CRM interno';
COMMENT ON COLUMN partners.score_total IS 'Auto-calculado: suma de los 8 scores individuales (max 40)';
```

- [ ] **Step 3.2: Aplicar migration**

```
mcp__supabase__apply_migration con 20260506000100_partners_crm.sql
```

Verificar:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'partners';
```
Expected: ver todas las columnas incluyendo `score_total`.

- [ ] **Step 3.3: Test score_total auto-cálculo**

```sql
INSERT INTO partners (nombre_negocio, tipo, score_acceso_decision_makers, score_dolor_frecuente)
VALUES ('Test Partner', 'contadora', 5, 4);

SELECT score_total FROM partners WHERE nombre_negocio = 'Test Partner';
-- Expected: 9

DELETE FROM partners WHERE nombre_negocio = 'Test Partner';
```

- [ ] **Step 3.4: Commit**

```bash
cd C:/dev/enregla
git add supabase/migrations/20260506000100_partners_crm.sql
git commit -m "feat(db): tabla partners con scorecard para CRM interno"
```

---

## Task 4: Supabase client y función submitLead en landing

**Context:** La landing necesita un cliente Supabase mínimo (solo anon key) y una función tipada para insertar leads. Esto desacopla la UI del cliente de DB.

**Files:**
- Create: `C:/dev/enregla-landing/.env.local.template`
- Create: `C:/dev/enregla-landing/src/lib/supabase.ts`
- Create: `C:/dev/enregla-landing/src/lib/leads.ts`
- Modify: `C:/dev/enregla-landing/package.json` (agregar dep)

- [ ] **Step 4.1: Instalar @supabase/supabase-js**

```bash
cd C:/dev/enregla-landing
npm install @supabase/supabase-js
```

- [ ] **Step 4.2: Crear .env.local.template**

Crear `C:/dev/enregla-landing/.env.local.template`:

```
VITE_SUPABASE_URL=https://zqaqhapxqwkvninnyqiu.supabase.co
VITE_SUPABASE_ANON_KEY=<pega aquí el anon key público>
```

Nota: Vercel requiere estas env vars en Settings → Environment Variables (Production + Preview).

- [ ] **Step 4.3: Crear .env.local (gitignored)**

```bash
cd C:/dev/enregla-landing
cp .env.local.template .env.local
# Editar .env.local con valores reales
```

Verificar que `.env.local` está en `.gitignore`. Si no, agregar:
```bash
echo ".env.local" >> .gitignore
```

- [ ] **Step 4.4: Crear cliente Supabase**

Crear `C:/dev/enregla-landing/src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase env vars. Check .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,  // landing no necesita sesiones
  },
})
```

- [ ] **Step 4.5: Crear función submitLead con tipos**

Crear `C:/dev/enregla-landing/src/lib/leads.ts`:

```typescript
import { supabase } from './supabase'

export type LeadSource = 'diagnostico' | 'partners' | 'home' | 'sobre' | 'otro'

export type LeadInput = {
  nombre: string
  negocio: string
  email: string
  telefono?: string
  ciudad?: string
  num_sedes?: number
  source: LeadSource
  notas?: string
}

export type SubmitLeadResult =
  | { ok: true; leadId: string }
  | { ok: false; error: string }

export async function submitLead(input: LeadInput): Promise<SubmitLeadResult> {
  // Capturar metadata automáticamente
  const urlParams = new URLSearchParams(window.location.search)
  const metadata = {
    utm_source: urlParams.get('utm_source') || null,
    utm_medium: urlParams.get('utm_medium') || null,
    utm_campaign: urlParams.get('utm_campaign') || null,
    referrer: document.referrer || null,
    user_agent: navigator.userAgent,
  }

  const { data, error } = await supabase
    .from('leads')
    .insert({
      ...input,
      ...metadata,
    })
    .select('id')
    .single()

  if (error) {
    console.error('submitLead error:', error)
    return { ok: false, error: error.message }
  }

  return { ok: true, leadId: data.id }
}
```

- [ ] **Step 4.6: Build verification**

```bash
cd C:/dev/enregla-landing
npm run build
```
Expected: build exitoso.

- [ ] **Step 4.7: Commit**

```bash
cd C:/dev/enregla-landing
git checkout -b feature/lead-capture
git add .env.local.template src/lib/supabase.ts src/lib/leads.ts package.json package-lock.json
git commit -m "feat(landing): cliente Supabase + funcion submitLead

Habilita captura de leads desde formularios de la landing.
RLS permite INSERT anonimo en tabla leads.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

No pushear todavía — seguimos en la rama hasta terminar Task 6.

---

## Task 5: Componente LeadForm reusable

**Context:** Todas las páginas de la landing usan el mismo form base. Extraer a componente para DRY.

**Files:**
- Create: `C:/dev/enregla-landing/src/components/LeadForm.tsx`

- [ ] **Step 5.1: Escribir LeadForm**

Crear `C:/dev/enregla-landing/src/components/LeadForm.tsx`:

```tsx
import { useState, type FormEvent } from 'react'
import { submitLead, type LeadSource } from '../lib/leads'

type Props = {
  source: LeadSource
  /** Texto del botón de submit */
  submitLabel?: string
  /** Callback cuando el lead se envía bien */
  onSuccess?: (leadId: string) => void
  /** Incluir campo telefono */
  withPhone?: boolean
  /** Incluir campo ciudad */
  withCity?: boolean
  /** Incluir campo num_sedes */
  withSedes?: boolean
}

type State =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'error'; message: string }
  | { kind: 'success'; leadId: string }

export function LeadForm({
  source,
  submitLabel = 'Empezar',
  onSuccess,
  withPhone = false,
  withCity = false,
  withSedes = false,
}: Props) {
  const [state, setState] = useState<State>({ kind: 'idle' })

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState({ kind: 'submitting' })

    const formData = new FormData(e.currentTarget)
    const result = await submitLead({
      nombre: String(formData.get('nombre') || '').trim(),
      negocio: String(formData.get('negocio') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      telefono: withPhone ? String(formData.get('telefono') || '').trim() || undefined : undefined,
      ciudad: withCity ? String(formData.get('ciudad') || '').trim() || undefined : undefined,
      num_sedes: withSedes ? Number(formData.get('num_sedes')) || undefined : undefined,
      source,
    })

    if (result.ok) {
      setState({ kind: 'success', leadId: result.leadId })
      onSuccess?.(result.leadId)
    } else {
      setState({ kind: 'error', message: result.error })
    }
  }

  if (state.kind === 'success') {
    return (
      <div className="bg-ds-green-50 border border-ds-green-500 rounded-[8px] p-6 text-center">
        <h3 className="text-xl font-extrabold text-ds-green-600 mb-2">¡Listo!</h3>
        <p className="text-sm text-ds-neutral-700">
          Te vamos a escribir en menos de 24 horas. Revisa tu correo.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <InputField name="nombre" label="Tu nombre" required placeholder="Ej: Juan Pérez" />
      <InputField name="negocio" label="Nombre del negocio" required placeholder="Ej: Don Pollo" />
      <InputField name="email" label="Email" type="email" required placeholder="tu@email.com" />
      {withPhone && <InputField name="telefono" label="WhatsApp (opcional)" placeholder="099 999 9999" />}
      {withCity && <InputField name="ciudad" label="Ciudad" placeholder="Quito" />}
      {withSedes && (
        <InputField name="num_sedes" label="¿Cuántas sedes tienes?" type="number" min={1} placeholder="1" />
      )}

      {state.kind === 'error' && (
        <div className="bg-ds-red-50 border border-ds-red-500 rounded-[3px] p-3 text-sm text-ds-red-600">
          {state.message}
        </div>
      )}

      <button
        type="submit"
        disabled={state.kind === 'submitting'}
        className="bg-ds-orange-500 hover:bg-ds-orange-600 text-white font-semibold rounded-[3px] px-6 py-3.5 text-[15px] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {state.kind === 'submitting' ? 'Enviando...' : submitLabel}
      </button>

      <p className="text-xs text-ds-neutral-400 text-center">
        Al enviar aceptas recibir comunicación de EnRegla. Puedes darte de baja cuando quieras.
      </p>
    </form>
  )
}

type InputFieldProps = {
  name: string
  label: string
  type?: string
  required?: boolean
  placeholder?: string
  min?: number
}
function InputField({ name, label, type = 'text', required, placeholder, min }: InputFieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-ds-blue-500">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        min={min}
        className="border border-ds-neutral-300 rounded-[3px] px-3 py-2.5 text-sm focus:outline-none focus:border-ds-blue-500 focus:ring-2 focus:ring-ds-blue-100"
      />
    </label>
  )
}
```

- [ ] **Step 5.2: Build verification**

```bash
cd C:/dev/enregla-landing
npm run build
```
Expected: build exitoso.

- [ ] **Step 5.3: Commit**

```bash
git add src/components/LeadForm.tsx
git commit -m "feat(landing): componente LeadForm reusable con validacion"
```

---

## Task 6: Routing y páginas nuevas en landing

**Context:** La landing hoy es single-page. Necesitamos routing para `/diagnostico`, `/partners`, `/sobre`. Usamos `react-router-dom` (consistente con producto).

**Files:**
- Modify: `C:/dev/enregla-landing/package.json` (agregar dep)
- Create: `C:/dev/enregla-landing/src/lib/router.tsx`
- Modify: `C:/dev/enregla-landing/src/App.tsx` (refactor a `HomePage`)
- Create: `C:/dev/enregla-landing/src/pages/HomePage.tsx` (contenido actual de App.tsx)
- Create: `C:/dev/enregla-landing/src/pages/Diagnostico.tsx`
- Create: `C:/dev/enregla-landing/src/pages/Partners.tsx`
- Create: `C:/dev/enregla-landing/src/pages/Sobre.tsx`
- Modify: `C:/dev/enregla-landing/src/main.tsx` (usar Router)

- [ ] **Step 6.1: Instalar react-router-dom**

```bash
cd C:/dev/enregla-landing
npm install react-router-dom
```

- [ ] **Step 6.2: Mover contenido de App.tsx a HomePage.tsx**

```bash
cd C:/dev/enregla-landing
mkdir -p src/pages
mv src/App.tsx src/pages/HomePage.tsx
```

Editar `src/pages/HomePage.tsx`:
- Cambiar `export default function App()` por `export default function HomePage()`

- [ ] **Step 6.3: Crear router**

Crear `C:/dev/enregla-landing/src/lib/router.tsx`:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from '../pages/HomePage'
import Diagnostico from '../pages/Diagnostico'
import Partners from '../pages/Partners'
import Sobre from '../pages/Sobre'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/diagnostico" element={<Diagnostico />} />
        <Route path="/partners" element={<Partners />} />
        <Route path="/sobre" element={<Sobre />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 6.4: Actualizar main.tsx**

Reemplazar contenido de `C:/dev/enregla-landing/src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'
import { AppRouter } from './lib/router'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
)
```

- [ ] **Step 6.5: Crear página Diagnostico.tsx**

Crear `C:/dev/enregla-landing/src/pages/Diagnostico.tsx`:

```tsx
import { LeadForm } from '../components/LeadForm'

export default function Diagnostico() {
  return (
    <div className="min-h-screen bg-ds-neutral-50">
      <header className="border-b border-ds-neutral-200 bg-white">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center">
          <a href="/" className="flex items-center gap-2.5 text-ds-blue-500 font-extrabold text-xl tracking-[-0.025em] no-underline">
            <span className="w-8 h-8 bg-ds-blue-500 rounded-[6px] flex items-center justify-center text-white">
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </span>
            EnRegla
          </a>
        </div>
      </header>

      <main className="py-16 px-6">
        <div className="max-w-[1200px] mx-auto grid lg:grid-cols-[1.2fr_1fr] gap-16 items-start">
          <div>
            <span className="inline-flex items-center gap-2.5 px-2.5 py-1 rounded-[3px] text-[11px] font-bold uppercase tracking-[0.8px] mb-4 bg-ds-orange-50 text-ds-orange-600">
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              Diagnóstico 7 días
            </span>
            <h1 className="text-ds-blue-500 font-extrabold tracking-[-0.02em] leading-[1.1] mb-5 text-4xl md:text-5xl">
              Evita multas, vencimientos y clausuras por permisos desordenados.
            </h1>
            <p className="text-lg text-ds-neutral-600 mb-8">
              En 7 días te mostramos qué documentos tienes, cuáles faltan, qué está por vencer y qué riesgo operativo tiene tu negocio.
            </p>

            <h2 className="text-xl font-extrabold text-ds-blue-500 mt-10 mb-4">¿Para quién?</h2>
            <ul className="flex flex-col gap-2 mb-8 text-[15px] text-ds-neutral-700">
              <li className="flex items-start gap-2">
                <span className="text-ds-green-500 font-bold mt-0.5">→</span>
                Restaurantes, cafeterías, locales de comida
              </li>
              <li className="flex items-start gap-2">
                <span className="text-ds-green-500 font-bold mt-0.5">→</span>
                Locales comerciales (retail)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-ds-green-500 font-bold mt-0.5">→</span>
                Negocios con 2 o más sedes
              </li>
            </ul>

            <h2 className="text-xl font-extrabold text-ds-blue-500 mt-10 mb-4">¿Qué recibes?</h2>
            <ul className="flex flex-col gap-2 mb-8 text-[15px] text-ds-neutral-700">
              <li className="flex items-start gap-2">
                <span className="text-ds-blue-500 font-bold mt-0.5">1.</span>
                Inventario completo de permisos por sede
              </li>
              <li className="flex items-start gap-2">
                <span className="text-ds-blue-500 font-bold mt-0.5">2.</span>
                Mapa de vencimientos (qué vence en 30, 60, 90 días)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-ds-blue-500 font-bold mt-0.5">3.</span>
                Lista de documentos faltantes o vencidos
              </li>
              <li className="flex items-start gap-2">
                <span className="text-ds-blue-500 font-bold mt-0.5">4.</span>
                Semáforo de riesgo por sede (verde / amarillo / rojo)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-ds-blue-500 font-bold mt-0.5">5.</span>
                Plan de acción con prioridades
              </li>
            </ul>
          </div>

          <aside className="bg-white border border-ds-neutral-200 rounded-[12px] p-8 lg:sticky lg:top-8">
            <h3 className="text-xl font-extrabold text-ds-blue-500 mb-2">Solicitar diagnóstico</h3>
            <p className="text-sm text-ds-neutral-600 mb-6">
              Te contactamos en menos de 24 horas con los próximos pasos.
            </p>
            <LeadForm
              source="diagnostico"
              submitLabel="Solicitar diagnóstico"
              withPhone
              withCity
              withSedes
            />
          </aside>
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 6.6: Crear página Partners.tsx**

Crear `C:/dev/enregla-landing/src/pages/Partners.tsx`:

```tsx
import { LeadForm } from '../components/LeadForm'

export default function Partners() {
  return (
    <div className="min-h-screen bg-ds-neutral-50">
      <header className="border-b border-ds-neutral-200 bg-white">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center">
          <a href="/" className="flex items-center gap-2.5 text-ds-blue-500 font-extrabold text-xl tracking-[-0.025em] no-underline">
            <span className="w-8 h-8 bg-ds-blue-500 rounded-[6px] flex items-center justify-center text-white">
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </span>
            EnRegla
          </a>
        </div>
      </header>

      <main className="py-16 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="max-w-3xl mb-12">
            <span className="inline-flex items-center gap-2.5 px-2.5 py-1 rounded-[3px] text-[11px] font-bold uppercase tracking-[0.8px] mb-4 bg-ds-blue-50 text-ds-blue-500">
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              Programa de Partners
            </span>
            <h1 className="text-ds-blue-500 font-extrabold tracking-[-0.02em] leading-[1.1] mb-5 text-4xl md:text-5xl">
              Convierte el caos de permisos de tus clientes en un nuevo ingreso recurrente.
            </h1>
            <p className="text-lg text-ds-neutral-600 mb-8">
              EnRegla ayuda a tus clientes a ordenar permisos, documentos, vencimientos y riesgos operativos sin reemplazar tu relación comercial. El PDF que tú entregas es DONDE empieza EnRegla.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 mb-16">
            <div className="bg-white border border-ds-neutral-200 rounded-[8px] p-6">
              <h3 className="font-extrabold text-ds-blue-500 mb-2">Más ingresos</h3>
              <p className="text-sm text-ds-neutral-600">20% de comisión por cada cliente referido. Sin exclusividad, sin atadura.</p>
            </div>
            <div className="bg-white border border-ds-neutral-200 rounded-[8px] p-6">
              <h3 className="font-extrabold text-ds-blue-500 mb-2">Menos caos operativo</h3>
              <p className="text-sm text-ds-neutral-600">Tus clientes dejan de perderte mensajes. Toda su historia de permisos, en un lugar.</p>
            </div>
            <div className="bg-white border border-ds-neutral-200 rounded-[8px] p-6">
              <h3 className="font-extrabold text-ds-blue-500 mb-2">Retención de clientes</h3>
              <p className="text-sm text-ds-neutral-600">El cliente te sigue necesitando para renovar. Y ahora tiene visibilidad para pagarte a tiempo.</p>
            </div>
          </div>

          <div className="max-w-md mx-auto bg-white border border-ds-neutral-200 rounded-[12px] p-8">
            <h3 className="text-xl font-extrabold text-ds-blue-500 mb-2">Probar con 2-3 clientes</h3>
            <p className="text-sm text-ds-neutral-600 mb-6">
              Pilot de 14 días. Sin exclusividad. Sin integración técnica. Decisión clara al final.
            </p>
            <LeadForm
              source="partners"
              submitLabel="Empezar pilot"
              withPhone
              withCity
            />
          </div>
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 6.7: Crear página Sobre.tsx**

Crear `C:/dev/enregla-landing/src/pages/Sobre.tsx`:

```tsx
export default function Sobre() {
  return (
    <div className="min-h-screen bg-ds-neutral-50">
      <header className="border-b border-ds-neutral-200 bg-white">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center">
          <a href="/" className="flex items-center gap-2.5 text-ds-blue-500 font-extrabold text-xl tracking-[-0.025em] no-underline">
            <span className="w-8 h-8 bg-ds-blue-500 rounded-[6px] flex items-center justify-center text-white">
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </span>
            EnRegla
          </a>
        </div>
      </header>

      <main className="py-16 px-6">
        <div className="max-w-[720px] mx-auto">
          <span className="inline-flex items-center gap-2.5 px-2.5 py-1 rounded-[3px] text-[11px] font-bold uppercase tracking-[0.8px] mb-4 bg-ds-blue-50 text-ds-blue-500">
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            Sobre EnRegla
          </span>
          <h1 className="text-ds-blue-500 font-extrabold tracking-[-0.02em] leading-[1.1] mb-6 text-4xl md:text-5xl">
            Un producto hecho para el que lleva el negocio.
          </h1>

          <p className="text-lg text-ds-neutral-700 mb-6">
            EnRegla nace de la observación de un problema simple: los dueños de pequeños y medianos negocios en Ecuador operan con permisos vencidos sin saberlo. El día que llega el inspector, es tarde.
          </p>

          <p className="text-[17px] text-ds-neutral-600 mb-6">
            No somos tu contador. No somos tu tramitador. Somos la pieza que faltaba entre ellos y tu operación: un lugar donde los PDFs no se pierden, donde las fechas no se olvidan, y donde el inspector ve lo que necesita sin que tengas que buscar papeles.
          </p>

          <h2 className="text-2xl font-extrabold text-ds-blue-500 mt-12 mb-4">Hecho por Aura</h2>
          <p className="text-[17px] text-ds-neutral-600 mb-6">
            Aura es el estudio de Danilo Rojas, enfocado en construir software para PYMES latinoamericanas. EnRegla es el primer producto de la línea.
          </p>

          <p className="text-[17px] text-ds-neutral-600">
            ¿Preguntas? Escríbenos a <a href="mailto:hola@enregla.com" className="text-ds-orange-600 font-semibold">hola@enregla.com</a>.
          </p>
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 6.8: Actualizar navegación en HomePage.tsx**

En `src/pages/HomePage.tsx`, los links del Nav y Footer que apunten a `/diagnostico`, `/partners`, `/sobre` son strings normales — ya funcionan porque react-router-dom captura clicks. Pero es mejor usar `<Link>` de react-router para SPA navigation.

Reemplazar en el Nav:
```tsx
// Busca: <a href="#partners" ...>Partners</a>
// Reemplaza por: <Link to="/partners" ...>Partners</Link>
```

Agregar al inicio de HomePage.tsx:
```tsx
import { Link } from 'react-router-dom'
```

Y en el FooterCol, links que empiezan con `/` cambiarlos a `<Link to="...">`:
- `/diagnostico`
- `/partners`
- `/sobre`

Los links con `#` (ej: `#problema`, `#como-funciona`) quedan como `<a>` porque son anchors.

- [ ] **Step 6.9: Configurar Vercel para SPA routing**

Crear `C:/dev/enregla-landing/vercel.json`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

Esto hace que todas las rutas (incluso `/diagnostico`) sirvan `index.html`, y React Router toma control del lado del cliente.

- [ ] **Step 6.10: Build verification**

```bash
cd C:/dev/enregla-landing
npm run build
```
Expected: build exitoso, output muestra `index.html` + chunks.

- [ ] **Step 6.11: Commit**

```bash
git add -A
git commit -m "feat(landing): routing + paginas /diagnostico, /partners, /sobre

Agrega react-router-dom y 3 paginas nuevas con forms de captura
de leads integrados. Vercel config para SPA routing.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 7: Tipos TypeScript en producto para leads y partners

**Context:** Definir tipos compartidos para el CRM interno antes de construir componentes.

**Files:**
- Create: `C:/dev/enregla/src/types/crm.ts`

- [ ] **Step 7.1: Escribir tipos**

Crear `C:/dev/enregla/src/types/crm.ts`:

```typescript
// Leads (capturados desde landing)

export type LeadSource = 'diagnostico' | 'partners' | 'home' | 'sobre' | 'otro'

export type LeadStatus =
  | 'nuevo'
  | 'contactado'
  | 'demo_agendada'
  | 'demo_completada'
  | 'convertido'
  | 'rechazado'
  | 'nurture'

export type Lead = {
  id: string
  nombre: string
  negocio: string
  email: string
  telefono: string | null
  ciudad: string | null
  num_sedes: number | null
  source: LeadSource
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  referrer: string | null
  user_agent: string | null
  status: LeadStatus
  notas: string | null
  assigned_to: string | null
  created_at: string
  updated_at: string
}

// Partners (enablers en CRM)

export type PartnerTipo =
  | 'contadora'
  | 'tramitador'
  | 'arcsa'
  | 'bomberos'
  | 'legal'
  | 'asesor_admin'
  | 'pos_provider'
  | 'gremio'
  | 'otro'

export type PartnerStatus =
  | 'identificado'
  | 'contactado'
  | 'respondio'
  | 'reunion_agendada'
  | 'pilot_propuesto'
  | 'pilot_activo'
  | 'convertido'
  | 'rechazado'
  | 'nurture'

export type PartnerScoreField =
  | 'score_acceso_decision_makers'
  | 'score_dolor_frecuente'
  | 'score_confianza_clientes'
  | 'score_velocidad_referir'
  | 'score_complementariedad'
  | 'score_velocidad_ejecucion'
  | 'score_mindset_comercial'
  | 'score_riesgo_mal_partner'

export type Partner = {
  id: string
  nombre_negocio: string
  tipo: PartnerTipo
  contacto_nombre: string | null
  email: string | null
  telefono: string | null
  ciudad: string | null
  score_acceso_decision_makers: number | null
  score_dolor_frecuente: number | null
  score_confianza_clientes: number | null
  score_velocidad_referir: number | null
  score_complementariedad: number | null
  score_velocidad_ejecucion: number | null
  score_mindset_comercial: number | null
  score_riesgo_mal_partner: number | null
  score_total: number // auto-generated
  status: PartnerStatus
  potencial_clientes_estimado: number | null
  proxima_accion: string | null
  proxima_accion_fecha: string | null
  notas: string | null
  assigned_to: string | null
  created_at: string
  updated_at: string
}

// Qualification helper
export type PartnerQualification = 'priority' | 'good' | 'nurture' | 'ignore'

export function qualifyPartner(scoreTotal: number): PartnerQualification {
  if (scoreTotal >= 35) return 'priority'
  if (scoreTotal >= 28) return 'good'
  if (scoreTotal >= 20) return 'nurture'
  return 'ignore'
}

export function qualificationLabel(q: PartnerQualification): string {
  switch (q) {
    case 'priority': return 'Priority Partner'
    case 'good': return 'Good Partner'
    case 'nurture': return 'Nurture'
    case 'ignore': return 'Ignore for now'
  }
}
```

- [ ] **Step 7.2: Build verification**

```bash
cd C:/dev/enregla
npm run build 2>&1 | tail -10
```
Expected: build exitoso. (Nota: el repo tiene un bug conocido con Rolldown en el build, pero `tsc --noEmit` debería pasar.)

Si el build falla por el bug preexistente, correr solo type-check:
```bash
npx tsc --noEmit
```
Expected: 0 errors en `src/types/crm.ts`.

- [ ] **Step 7.3: Commit**

```bash
cd C:/dev/enregla
git checkout -b feature/internal-crm
git add src/types/crm.ts
git commit -m "feat(crm): tipos TypeScript para leads y partners"
```

---

## Task 8: PartnerScorecard component con tests (TDD)

**Context:** Componente reusable que calcula scoring de partner. TDD — test primero.

**Files:**
- Create: `C:/dev/enregla/src/features/internal-crm/PartnerScorecard.tsx`
- Create: `C:/dev/enregla/src/features/internal-crm/__tests__/PartnerScorecard.test.tsx`

- [ ] **Step 8.1: Escribir test que falla**

Crear `C:/dev/enregla/src/features/internal-crm/__tests__/PartnerScorecard.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { qualifyPartner, qualificationLabel } from '@/types/crm'

describe('qualifyPartner', () => {
  it('returns priority for score >= 35', () => {
    expect(qualifyPartner(40)).toBe('priority')
    expect(qualifyPartner(35)).toBe('priority')
  })

  it('returns good for score 28-34', () => {
    expect(qualifyPartner(34)).toBe('good')
    expect(qualifyPartner(28)).toBe('good')
  })

  it('returns nurture for score 20-27', () => {
    expect(qualifyPartner(27)).toBe('nurture')
    expect(qualifyPartner(20)).toBe('nurture')
  })

  it('returns ignore for score < 20', () => {
    expect(qualifyPartner(19)).toBe('ignore')
    expect(qualifyPartner(0)).toBe('ignore')
  })
})

describe('qualificationLabel', () => {
  it('maps qualification to Spanish label', () => {
    expect(qualificationLabel('priority')).toBe('Priority Partner')
    expect(qualificationLabel('good')).toBe('Good Partner')
    expect(qualificationLabel('nurture')).toBe('Nurture')
    expect(qualificationLabel('ignore')).toBe('Ignore for now')
  })
})
```

- [ ] **Step 8.2: Correr test, verificar que pasa**

Las funciones `qualifyPartner` y `qualificationLabel` ya las definimos en Task 7. Correr:

```bash
cd C:/dev/enregla
npm test -- PartnerScorecard.test
```
Expected: PASS, 8 assertions.

- [ ] **Step 8.3: Escribir componente PartnerScorecard**

Crear `C:/dev/enregla/src/features/internal-crm/PartnerScorecard.tsx`:

```tsx
import { useState } from 'react'
import { qualifyPartner, qualificationLabel, type Partner } from '@/types/crm'

type ScoreField = {
  key: keyof Pick<Partner,
    | 'score_acceso_decision_makers'
    | 'score_dolor_frecuente'
    | 'score_confianza_clientes'
    | 'score_velocidad_referir'
    | 'score_complementariedad'
    | 'score_velocidad_ejecucion'
    | 'score_mindset_comercial'
    | 'score_riesgo_mal_partner'
  >
  label: string
  help: string
}

const SCORE_FIELDS: ScoreField[] = [
  { key: 'score_acceso_decision_makers', label: 'Acceso a decision makers', help: '¿Puede llegar rápido al dueño o gerente?' },
  { key: 'score_dolor_frecuente', label: 'Frecuencia del dolor de compliance', help: '¿Sus clientes sufren permisos vencidos a menudo?' },
  { key: 'score_confianza_clientes', label: 'Confianza con sus clientes', help: '¿Sus clientes lo consideran asesor, no proveedor?' },
  { key: 'score_velocidad_referir', label: 'Velocidad para referir', help: '¿Va a referir rápido o se toma meses?' },
  { key: 'score_complementariedad', label: 'Complementariedad con EnRegla', help: '¿Su trabajo complementa o compite con nosotros?' },
  { key: 'score_velocidad_ejecucion', label: 'Velocidad de ejecución', help: '¿Es acción o solo habla?' },
  { key: 'score_mindset_comercial', label: 'Mindset comercial', help: '¿Piensa en ganar-ganar o solo en él?' },
  { key: 'score_riesgo_mal_partner', label: 'Riesgo de ser mal partner (invertido)', help: '5 = bajo riesgo; 1 = alto riesgo' },
]

type Props = {
  initialScores?: Partial<Partner>
  onChange?: (scores: Record<string, number>, total: number) => void
}

export function PartnerScorecard({ initialScores = {}, onChange }: Props) {
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    for (const f of SCORE_FIELDS) {
      init[f.key] = (initialScores[f.key] as number | null) ?? 0
    }
    return init
  })

  const total = Object.values(scores).reduce((a, b) => a + b, 0)
  const qualification = qualifyPartner(total)

  const handleScore = (key: string, value: number) => {
    const next = { ...scores, [key]: value }
    setScores(next)
    onChange?.(next, Object.values(next).reduce((a, b) => a + b, 0))
  }

  const qualColors: Record<string, string> = {
    priority: 'bg-ds-green-50 text-ds-green-600 border-ds-green-500',
    good: 'bg-ds-blue-50 text-ds-blue-500 border-ds-blue-500',
    nurture: 'bg-ds-yellow-50 text-ds-yellow-600 border-ds-yellow-500',
    ignore: 'bg-ds-red-50 text-ds-red-600 border-ds-red-500',
  }

  return (
    <div className="bg-white border border-ds-neutral-200 rounded-lg p-6">
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-lg font-extrabold text-ds-blue-500">Partner Scorecard</h3>
        <div className={`px-3 py-1.5 rounded border text-sm font-bold ${qualColors[qualification]}`}>
          {total} / 40 — {qualificationLabel(qualification)}
        </div>
      </div>

      <div className="space-y-4">
        {SCORE_FIELDS.map(field => (
          <div key={field.key}>
            <div className="flex justify-between mb-1">
              <label className="text-sm font-semibold text-ds-blue-500">{field.label}</label>
              <span className="text-sm text-ds-neutral-600">{scores[field.key]} / 5</span>
            </div>
            <p className="text-xs text-ds-neutral-500 mb-2">{field.help}</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleScore(field.key, n)}
                  className={`flex-1 py-2 text-sm font-semibold rounded transition-colors ${
                    scores[field.key] >= n
                      ? 'bg-ds-blue-500 text-white'
                      : 'bg-ds-neutral-100 text-ds-neutral-600 hover:bg-ds-neutral-200'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 8.4: Commit**

```bash
git add src/features/internal-crm/PartnerScorecard.tsx src/features/internal-crm/__tests__/PartnerScorecard.test.tsx
git commit -m "feat(crm): PartnerScorecard component con tests"
```

---

## Task 9: Hooks useLeads y usePartners

**Context:** Hooks para CRUD desde el CRM interno. Patrón consistente con hooks existentes del producto (`useLocations`, `usePermits`).

**Files:**
- Create: `C:/dev/enregla/src/hooks/useLeads.ts`
- Create: `C:/dev/enregla/src/hooks/usePartners.ts`

- [ ] **Step 9.1: Escribir useLeads**

Crear `C:/dev/enregla/src/hooks/useLeads.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Lead, LeadStatus } from '@/types/crm'

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setLeads((data as Lead[]) ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const updateLead = useCallback(async (id: string, updates: Partial<Lead>): Promise<boolean> => {
    const { error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)

    if (error) {
      setError(error.message)
      return false
    }
    await fetchLeads()
    return true
  }, [fetchLeads])

  const setStatus = useCallback((id: string, status: LeadStatus) => {
    return updateLead(id, { status })
  }, [updateLead])

  const deleteLead = useCallback(async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('leads').delete().eq('id', id)
    if (error) {
      setError(error.message)
      return false
    }
    await fetchLeads()
    return true
  }, [fetchLeads])

  return {
    leads,
    loading,
    error,
    refresh: fetchLeads,
    updateLead,
    setStatus,
    deleteLead,
  }
}
```

- [ ] **Step 9.2: Escribir usePartners**

Crear `C:/dev/enregla/src/hooks/usePartners.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Partner } from '@/types/crm'

export function usePartners() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPartners = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .order('score_total', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setPartners((data as Partner[]) ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPartners()
  }, [fetchPartners])

  const createPartner = useCallback(async (input: Partial<Partner>): Promise<string | null> => {
    const { data, error } = await supabase
      .from('partners')
      .insert(input)
      .select('id')
      .single()

    if (error) {
      setError(error.message)
      return null
    }
    await fetchPartners()
    return data.id
  }, [fetchPartners])

  const updatePartner = useCallback(async (id: string, updates: Partial<Partner>): Promise<boolean> => {
    const { error } = await supabase
      .from('partners')
      .update(updates)
      .eq('id', id)

    if (error) {
      setError(error.message)
      return false
    }
    await fetchPartners()
    return true
  }, [fetchPartners])

  const deletePartner = useCallback(async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('partners').delete().eq('id', id)
    if (error) {
      setError(error.message)
      return false
    }
    await fetchPartners()
    return true
  }, [fetchPartners])

  return {
    partners,
    loading,
    error,
    refresh: fetchPartners,
    createPartner,
    updatePartner,
    deletePartner,
  }
}
```

- [ ] **Step 9.3: Build verification**

```bash
cd C:/dev/enregla
npx tsc --noEmit
```
Expected: 0 nuevos errors en estos archivos.

- [ ] **Step 9.4: Commit**

```bash
git add src/hooks/useLeads.ts src/hooks/usePartners.ts
git commit -m "feat(crm): hooks useLeads y usePartners con CRUD"
```

---

## Task 10: Tabla de leads (UI)

**Context:** Tabla con filtros por status, sort por fecha, acciones inline (cambiar status).

**Files:**
- Create: `C:/dev/enregla/src/features/internal-crm/LeadsTable.tsx`

- [ ] **Step 10.1: Escribir LeadsTable**

Crear `C:/dev/enregla/src/features/internal-crm/LeadsTable.tsx`:

```tsx
import { useState } from 'react'
import { useLeads } from '@/hooks/useLeads'
import { Badge } from '@/components/ui/badge'
import type { LeadStatus } from '@/types/crm'

const STATUS_LABELS: Record<LeadStatus, string> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  demo_agendada: 'Demo agendada',
  demo_completada: 'Demo completada',
  convertido: 'Convertido',
  rechazado: 'Rechazado',
  nurture: 'Nurture',
}

const STATUS_VARIANTS: Record<LeadStatus, 'default' | 'success' | 'warning' | 'danger' | 'secondary'> = {
  nuevo: 'warning',
  contactado: 'default',
  demo_agendada: 'default',
  demo_completada: 'default',
  convertido: 'success',
  rechazado: 'danger',
  nurture: 'secondary',
}

export function LeadsTable() {
  const { leads, loading, error, setStatus } = useLeads()
  const [filterStatus, setFilterStatus] = useState<LeadStatus | 'all'>('all')

  if (loading) return <div className="p-6 text-ds-neutral-600">Cargando...</div>
  if (error) return <div className="p-6 text-ds-red-600">Error: {error}</div>

  const filtered = filterStatus === 'all' ? leads : leads.filter(l => l.status === filterStatus)

  return (
    <div className="bg-white border border-ds-neutral-200 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-ds-neutral-200 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-extrabold text-ds-blue-500">Leads ({filtered.length})</h2>
          <p className="text-sm text-ds-neutral-600">Capturados desde la landing pública</p>
        </div>
        <select
          className="border border-ds-neutral-300 rounded px-3 py-1.5 text-sm"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as LeadStatus | 'all')}
        >
          <option value="all">Todos</option>
          {(Object.keys(STATUS_LABELS) as LeadStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-ds-neutral-50 border-b border-ds-neutral-200">
          <tr>
            <th className="text-left p-3 font-semibold text-ds-neutral-600">Nombre / Negocio</th>
            <th className="text-left p-3 font-semibold text-ds-neutral-600">Contacto</th>
            <th className="text-left p-3 font-semibold text-ds-neutral-600">Origen</th>
            <th className="text-left p-3 font-semibold text-ds-neutral-600">Status</th>
            <th className="text-left p-3 font-semibold text-ds-neutral-600">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(lead => (
            <tr key={lead.id} className="border-b border-ds-neutral-100 hover:bg-ds-neutral-50">
              <td className="p-3">
                <div className="font-semibold text-ds-blue-500">{lead.nombre}</div>
                <div className="text-xs text-ds-neutral-500">{lead.negocio}</div>
              </td>
              <td className="p-3">
                <div className="text-ds-neutral-700">{lead.email}</div>
                {lead.telefono && <div className="text-xs text-ds-neutral-500">{lead.telefono}</div>}
              </td>
              <td className="p-3">
                <Badge variant="secondary">{lead.source}</Badge>
              </td>
              <td className="p-3">
                <select
                  className="border border-ds-neutral-300 rounded px-2 py-1 text-xs"
                  value={lead.status}
                  onChange={e => setStatus(lead.id, e.target.value as LeadStatus)}
                >
                  {(Object.keys(STATUS_LABELS) as LeadStatus[]).map(s => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </td>
              <td className="p-3 text-ds-neutral-600 text-xs">
                {new Date(lead.created_at).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })}
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr><td colSpan={5} className="p-8 text-center text-ds-neutral-500">No hay leads en este filtro.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
```

Nota: `Badge` ya existe en `src/components/ui/badge.tsx`. Las variants pueden no coincidir exactamente — ajustar `STATUS_VARIANTS` después de verificar. Si no existe variant `danger`/`warning`, usar `destructive`/`warning` según lo que expone tu Badge component.

- [ ] **Step 10.2: Verificar Badge variants**

Leer `C:/dev/enregla/src/components/ui/badge.tsx` y ajustar los valores en `STATUS_VARIANTS` si los nombres difieren.

- [ ] **Step 10.3: Commit**

```bash
git add src/features/internal-crm/LeadsTable.tsx
git commit -m "feat(crm): LeadsTable con filtro por status y sort por fecha"
```

---

## Task 11: Tabla de partners (UI)

**Context:** Similar a LeadsTable pero con scorecard inline y ordenamiento por score.

**Files:**
- Create: `C:/dev/enregla/src/features/internal-crm/PartnersTable.tsx`

- [ ] **Step 11.1: Escribir PartnersTable**

Crear `C:/dev/enregla/src/features/internal-crm/PartnersTable.tsx`:

```tsx
import { useState } from 'react'
import { usePartners } from '@/hooks/usePartners'
import { Badge } from '@/components/ui/badge'
import { qualifyPartner, qualificationLabel, type PartnerStatus, type PartnerTipo } from '@/types/crm'

const STATUS_LABELS: Record<PartnerStatus, string> = {
  identificado: 'Identificado',
  contactado: 'Contactado',
  respondio: 'Respondió',
  reunion_agendada: 'Reunión agendada',
  pilot_propuesto: 'Pilot propuesto',
  pilot_activo: 'Pilot activo',
  convertido: 'Convertido',
  rechazado: 'Rechazado',
  nurture: 'Nurture',
}

const TIPO_LABELS: Record<PartnerTipo, string> = {
  contadora: 'Contadora',
  tramitador: 'Tramitador',
  arcsa: 'ARCSA',
  bomberos: 'Bomberos',
  legal: 'Legal',
  asesor_admin: 'Asesor admin',
  pos_provider: 'POS Provider',
  gremio: 'Gremio',
  otro: 'Otro',
}

export function PartnersTable() {
  const { partners, loading, error, updatePartner } = usePartners()
  const [filterStatus, setFilterStatus] = useState<PartnerStatus | 'all'>('all')
  const [filterTipo, setFilterTipo] = useState<PartnerTipo | 'all'>('all')

  if (loading) return <div className="p-6 text-ds-neutral-600">Cargando...</div>
  if (error) return <div className="p-6 text-ds-red-600">Error: {error}</div>

  const filtered = partners
    .filter(p => filterStatus === 'all' || p.status === filterStatus)
    .filter(p => filterTipo === 'all' || p.tipo === filterTipo)

  return (
    <div className="bg-white border border-ds-neutral-200 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-ds-neutral-200 flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-ds-blue-500">Partners ({filtered.length})</h2>
          <p className="text-sm text-ds-neutral-600">Enablers en pipeline, ordenados por score</p>
        </div>
        <div className="flex gap-2">
          <select
            className="border border-ds-neutral-300 rounded px-3 py-1.5 text-sm"
            value={filterTipo}
            onChange={e => setFilterTipo(e.target.value as PartnerTipo | 'all')}
          >
            <option value="all">Todos los tipos</option>
            {(Object.keys(TIPO_LABELS) as PartnerTipo[]).map(t => (
              <option key={t} value={t}>{TIPO_LABELS[t]}</option>
            ))}
          </select>
          <select
            className="border border-ds-neutral-300 rounded px-3 py-1.5 text-sm"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as PartnerStatus | 'all')}
          >
            <option value="all">Todos los status</option>
            {(Object.keys(STATUS_LABELS) as PartnerStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-ds-neutral-50 border-b border-ds-neutral-200">
          <tr>
            <th className="text-left p-3 font-semibold text-ds-neutral-600">Negocio / Tipo</th>
            <th className="text-left p-3 font-semibold text-ds-neutral-600">Contacto</th>
            <th className="text-left p-3 font-semibold text-ds-neutral-600">Score</th>
            <th className="text-left p-3 font-semibold text-ds-neutral-600">Status</th>
            <th className="text-left p-3 font-semibold text-ds-neutral-600">Próxima acción</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(partner => {
            const qual = qualifyPartner(partner.score_total)
            return (
              <tr key={partner.id} className="border-b border-ds-neutral-100 hover:bg-ds-neutral-50">
                <td className="p-3">
                  <div className="font-semibold text-ds-blue-500">{partner.nombre_negocio}</div>
                  <div className="text-xs text-ds-neutral-500">{TIPO_LABELS[partner.tipo]}</div>
                </td>
                <td className="p-3">
                  <div className="text-ds-neutral-700">{partner.contacto_nombre ?? '—'}</div>
                  <div className="text-xs text-ds-neutral-500">{partner.email ?? partner.telefono ?? '—'}</div>
                </td>
                <td className="p-3">
                  <div className="font-bold text-ds-blue-500">{partner.score_total} / 40</div>
                  <div className="text-xs text-ds-neutral-500">{qualificationLabel(qual)}</div>
                </td>
                <td className="p-3">
                  <select
                    className="border border-ds-neutral-300 rounded px-2 py-1 text-xs"
                    value={partner.status}
                    onChange={e => updatePartner(partner.id, { status: e.target.value as PartnerStatus })}
                  >
                    {(Object.keys(STATUS_LABELS) as PartnerStatus[]).map(s => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </td>
                <td className="p-3">
                  <div className="text-ds-neutral-700">{partner.proxima_accion ?? '—'}</div>
                  {partner.proxima_accion_fecha && (
                    <div className="text-xs text-ds-neutral-500">
                      {new Date(partner.proxima_accion_fecha).toLocaleDateString('es-EC')}
                    </div>
                  )}
                </td>
              </tr>
            )
          })}
          {filtered.length === 0 && (
            <tr><td colSpan={5} className="p-8 text-center text-ds-neutral-500">No hay partners en este filtro.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 11.2: Commit**

```bash
git add src/features/internal-crm/PartnersTable.tsx
git commit -m "feat(crm): PartnersTable con filtros y sort por score"
```

---

## Task 12: InternalCrmView (página completa) + routing

**Context:** Página con tabs Leads/Partners. Integrada en el router del producto.

**Files:**
- Create: `C:/dev/enregla/src/features/internal-crm/InternalCrmView.tsx`
- Modify: `C:/dev/enregla/src/App.tsx` (agregar ruta)

- [ ] **Step 12.1: Escribir InternalCrmView**

Crear `C:/dev/enregla/src/features/internal-crm/InternalCrmView.tsx`:

```tsx
import { useState } from 'react'
import { LeadsTable } from './LeadsTable'
import { PartnersTable } from './PartnersTable'

type Tab = 'leads' | 'partners'

export function InternalCrmView() {
  const [activeTab, setActiveTab] = useState<Tab>('leads')

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-ds-blue-500 mb-2">CRM Interno</h1>
        <p className="text-ds-neutral-600">
          Leads capturados desde la landing + partners (enablers) en pipeline.
        </p>
      </div>

      <div className="border-b border-ds-neutral-200 flex gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('leads')}
          className={`px-4 py-2 font-semibold text-sm transition-colors ${
            activeTab === 'leads'
              ? 'text-ds-blue-500 border-b-2 border-ds-orange-500'
              : 'text-ds-neutral-600 hover:text-ds-blue-500'
          }`}
        >
          Leads
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('partners')}
          className={`px-4 py-2 font-semibold text-sm transition-colors ${
            activeTab === 'partners'
              ? 'text-ds-blue-500 border-b-2 border-ds-orange-500'
              : 'text-ds-neutral-600 hover:text-ds-blue-500'
          }`}
        >
          Partners
        </button>
      </div>

      {activeTab === 'leads' ? <LeadsTable /> : <PartnersTable />}
    </div>
  )
}
```

- [ ] **Step 12.2: Agregar ruta en App.tsx**

Editar `C:/dev/enregla/src/App.tsx`. Ubicar la sección de rutas protegidas y agregar:

```tsx
import { InternalCrmView } from '@/features/internal-crm/InternalCrmView'

// ... dentro del <Routes> protegido, después de otras rutas:
<Route path="/internal/crm" element={<InternalCrmView />} />
```

- [ ] **Step 12.3: Build verification**

```bash
cd C:/dev/enregla
npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 12.4: Dev server test**

```bash
npm run dev
```

Abrir `http://localhost:5173/internal/crm`. Expected: ver tabs "Leads" / "Partners", con tablas vacías o datos de prueba.

- [ ] **Step 12.5: Commit**

```bash
git add src/features/internal-crm/InternalCrmView.tsx src/App.tsx
git commit -m "feat(crm): ruta /internal/crm con tabs Leads y Partners"
```

---

## Task 13: QA end-to-end

**Context:** Probar el flujo completo: form en landing → lead en DB → aparece en CRM.

- [ ] **Step 13.1: Deploy preview de landing**

En Vercel, merge `feature/lead-capture` → `main` (después de que el build pase en preview).

O si prefieres, trabajar contra deploy de preview de la branch.

- [ ] **Step 13.2: Submit test desde landing**

Abrir `enregla.com/diagnostico` (o preview URL), llenar form con datos falsos:
- Nombre: "Test QA"
- Negocio: "QA Restaurant"
- Email: "qa+diagnostico@enregla.com"
- Telefono: "0999999999"
- Ciudad: "Quito"
- Sedes: 2

Submit. Expected: ver mensaje "¡Listo!"

- [ ] **Step 13.3: Verificar en Supabase**

```sql
SELECT * FROM leads WHERE email = 'qa+diagnostico@enregla.com';
```
Expected: 1 row con status=`nuevo`, source=`diagnostico`, todos los campos completos.

- [ ] **Step 13.4: Verificar en CRM interno**

Login en producto (`app.enregla.com` o `localhost:5173`), ir a `/internal/crm`. Expected: ver el lead "Test QA" al tope de la lista.

- [ ] **Step 13.5: Probar cambio de status**

En CRM, cambiar status del lead a "demo_agendada". Refrescar página. Expected: el status persiste.

Verificar en DB:
```sql
SELECT status FROM leads WHERE email = 'qa+diagnostico@enregla.com';
```
Expected: `demo_agendada`.

- [ ] **Step 13.6: Cleanup test data**

```sql
DELETE FROM leads WHERE email = 'qa+diagnostico@enregla.com';
```

- [ ] **Step 13.7: Repetir para partners page**

Mismo flujo en `/partners`.

- [ ] **Step 13.8: Test UTM capture**

Abrir `enregla.com/diagnostico?utm_source=tiktok&utm_campaign=test123` y submit. Verificar en DB:
```sql
SELECT utm_source, utm_campaign FROM leads WHERE email = 'qa+utm@enregla.com';
```
Expected: `utm_source=tiktok, utm_campaign=test123`.

Cleanup:
```sql
DELETE FROM leads WHERE email = 'qa+utm@enregla.com';
```

---

## Task 14: Merge a main + deploy

**Context:** Mergear ambas branches a main y deploy final.

- [ ] **Step 14.1: Push de enregla-landing**

```bash
cd C:/dev/enregla-landing
git push -u origin feature/lead-capture
```

Crear PR en GitHub: `feature/lead-capture` → `main`. Mergear.

Vercel hace auto-deploy.

- [ ] **Step 14.2: Push de enregla (producto)**

```bash
cd C:/dev/enregla
git push -u origin feature/internal-crm
```

Crear PR en GitHub: `feature/internal-crm` → `main` (o `feature/atlassian-ds-migration` si aún no mergearon esa). Mergear.

- [ ] **Step 14.3: Verificar producción**

- Abrir `enregla.com/diagnostico` → lead form funciona
- Login en `app.enregla.com` (o donde esté el producto) → `/internal/crm` funciona
- Submit lead real de prueba → aparece en CRM

- [ ] **Step 14.4: Documentación final**

Crear `C:/dev/enregla/docs/superpowers/checkpoints/semana-1-completion.md`:

```markdown
# Sprint Semana 1 — Checkpoint

**Fecha:** YYYY-MM-DD
**Status:** ✅ Completada

## Completado
- [x] Email notifications verificadas/desplegadas
- [x] Tabla leads con RLS
- [x] Tabla partners con scorecard auto-calculado
- [x] Cliente Supabase en landing
- [x] LeadForm reusable
- [x] Rutas /diagnostico, /partners, /sobre en landing
- [x] CRM interno /internal/crm en producto
- [x] Tests de PartnerScorecard passing
- [x] QA end-to-end verificado

## Pendiente (semanas 2-4)
- [ ] Cal.com integration
- [ ] Resend email de confirmación post-submit
- [ ] Scraping Google Places (500 prospectos)
- [ ] Batch 1 de contenido Higgsfield
- [ ] Campañas Meta Ads
- [ ] Call center legal (primeras llamadas)
- [ ] Contactar primeros 3 enablers

## Métricas al cierre
- Leads capturados: [número]
- Partners en CRM: [número]
- Demos agendadas: 0 (pending Cal.com)
- Clientes pagando: 0 (pending onboarding)

## Aprendizajes
- [Qué salió bien]
- [Qué salió mal]
- [Qué ajustar para semana 2]
```

- [ ] **Step 14.5: Commit checkpoint**

```bash
cd C:/dev/enregla
git add docs/superpowers/checkpoints/semana-1-completion.md
git commit -m "docs: checkpoint semana 1 sprint GTM"
git push
```

---

## Criterios de éxito de la Semana 1

- ✅ Email notifications corriendo en producción (cron diario 8AM UTC)
- ✅ Lead capture funcional en `/diagnostico` y `/partners`
- ✅ CRM interno muestra leads y partners
- ✅ PartnerScorecard calcula correctamente (tests passing)
- ✅ UTM tracking capturado
- ✅ QA end-to-end sin errores
- ✅ Cero regresiones en features existentes del producto

---

## Lo que NO está en este plan (siguientes semanas)

**Semana 2:**
- Cal.com integration (agendamiento de demos automático)
- Resend email de confirmación al lead + alerta al equipo
- Script de scraping Google Places
- Carpeta `gtm/` con scripts de partners, call center, ads, objeciones

**Semana 3:**
- Batch 1 de contenido (15 videos Higgsfield)
- Campaña Meta Ads $100/sem
- Primeras 75 llamadas del call center

**Semana 4:**
- Batches 2 y 3 de contenido (60 videos más)
- Contactar primeros 3 enablers con evidencia
- Cierre de primeras 2-8 ventas
- Retrospectiva

---

**Fin del plan Semana 1.**
