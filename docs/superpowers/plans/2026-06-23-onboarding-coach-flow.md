# Onboarding Coach Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reframe the existing incremental onboarding wizard into a guided "coach" flow — welcome screen, a permit-education moment driven by `business_type`, and a final handoff where the user uploads permits inline, reads legal info, or requests "lo sacamos por ti" (lead + WhatsApp).

**Architecture:** Keep the existing per-step persistence engine (`saveProfile`/`saveCompany`/`saveLocationWithPermits`, the permit auto-generation DB trigger, resume logic in `App.tsx`). Extend `IncrementalWizard`'s internal step machine with three new presentational screens (`WelcomeStep`, `PermitPreviewStep`, `PermitHandoffStep`) plus celebration interludes. The two content screens derive entirely from existing data (`permit_requirements`, `legal_references`, generated `permits`) so they need no new persistence. Only new infra: one CHECK-constraint migration and one lead-insert API function.

**Tech Stack:** React + TypeScript + Vite, Tailwind + CSS design tokens (`--ds-*`), Supabase (Postgres + Storage), TanStack Query, react-router-dom, Vitest + @testing-library/react (jsdom).

## Global Constraints

- **Spanish UI copy**, voseo/neutral Latam register matching existing screens ("creá", "subí", "tu empresa"). Verbatim brand line: greeting uses "Bienvenido a EnRegla".
- **Design tokens only** for spacing/color: `var(--ds-space-*)`, `var(--ds-text*)`, `var(--ds-border*)`, `var(--ds-radius-*)`, `var(--ds-font-size-*)`. No raw hex except the existing fallback pattern `var(--ds-status-vigente,#16a34a)`.
- **Light mode only.** Risk palette stays: crítico=rojo, alto=naranja, medio=amarillo, bajo=verde.
- **No new dependencies.** Reuse installed libs only.
- **business_type whitelist** (must match DB RPC + `BUSINESS_TYPES`): `restaurante, retail, food_truck, consultorio, cafeteria, panaderia, bar, farmacia, gimnasio, salon_belleza, oficina, otro`.
- **leads.source** after migration: `('diagnostico','partners','home','sobre','otro','onboarding')`.
- **Onboarding is non-blocking:** "Ir al Dashboard" is always available on the handoff; returning users with a sede skip onboarding entirely.
- **WhatsApp env:** `VITE_WHATSAPP_NUMBER` (E.164 sin +), `VITE_WHATSAPP_DISPLAY`. CTA hidden when unset.
- **Permit upload reuse:** never reimplement upload — pass the real `Permit` + `updatePermit` from `usePermits` into the existing `PermitUploadForm`.
- **Imports:** icons from `@/lib/lucide-icons`, supabase from `@/lib/supabase`, UI from `@/components/ui/*`.
- **Test commands:** run a single test with `npx vitest run --config config/vitest.config.ts <path>`.

---

## File Structure

**Create:**
- `supabase/migrations/<timestamp>_leads_source_onboarding.sql` — extend `leads.source` CHECK.
- `src/lib/whatsapp.ts` — shared `buildWhatsappUrl(number, message)` helper.
- `src/lib/whatsapp.test.ts` — unit test for the helper.
- `src/features/onboarding-incremental/steps/WelcomeStep.tsx` — greeting + full_name (replaces ProfileStep in flow).
- `src/features/onboarding-incremental/steps/PermitPreviewStep.tsx` — education screen.
- `src/features/onboarding-incremental/steps/PermitHandoffStep.tsx` — final handoff.
- `src/features/onboarding-incremental/components/StepInterlude.tsx` — celebration transition.
- `src/features/onboarding-incremental/components/PermitRequirementCard.tsx` — preview row.
- `src/features/onboarding-incremental/components/PermitHandoffCard.tsx` — handoff row.
- `src/features/onboarding-incremental/components/GetItForYouForm.tsx` — lead capture + WhatsApp.
- `src/lib/api/onboarding.test.ts` — test for lead-payload builder.
- `src/features/onboarding-incremental/steps/PermitPreviewStep.test.tsx` — render smoke test.

**Modify:**
- `src/lib/api/onboarding.ts` — add `buildPermitServiceLead` + `createPermitServiceLead`; make `saveLocationWithPermits` return `{ id }` (already returns id — keep).
- `src/features/onboarding-incremental/IncrementalWizard.tsx` — new step machine (`welcome → company → interlude → preview → locations → handoff`), capture `locationId`.
- `src/features/onboarding-incremental/Stepper.tsx` — used as-is, fed 3 milestones.
- `src/features/onboarding-incremental/components/ProgressStepper.tsx` — 3 milestones (Empresa·Sede·Permisos), accept extended step union.
- `src/App.tsx` — `OnboardingRoute` maps new initial steps (`welcome` instead of `profile`).

**Reuse unchanged:** `PermitUploadForm`, `uploadPermitDocument`, `usePermits`, `usePermitRequirements`, `useLegalReferences`, `permitTypeLabel`, `businessTypeLabel`, `CompanyStep`, `LocationsStep`.

---

### Task 1: Migration — extend `leads.source` CHECK

**Files:**
- Create: `supabase/migrations/20260623120000_leads_source_onboarding.sql`

**Interfaces:**
- Produces: ability to insert `leads` rows with `source = 'onboarding'`.

- [ ] **Step 1: Write the migration**

```sql
-- Extiende leads.source para atribuir solicitudes "lo sacamos por ti" del onboarding.
-- RLS sin cambios: la policy de INSERT ya es WITH CHECK (true) para autenticados/anon.
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_source_check;
ALTER TABLE leads ADD CONSTRAINT leads_source_check
  CHECK (source IN ('diagnostico', 'partners', 'home', 'sobre', 'otro', 'onboarding'));

COMMENT ON COLUMN leads.source IS 'Pagina/flujo de origen del lead (landing o onboarding)';
```

- [ ] **Step 2: Apply via Supabase MCP**

Use `mcp__supabase__apply_migration` with name `leads_source_onboarding` and the SQL above.
Expected: success, no error.

- [ ] **Step 3: Verify behavior, not shape (security smoke test)**

Use `mcp__supabase__execute_sql`:

```sql
SET ROLE authenticated;
INSERT INTO leads (nombre, negocio, email, telefono, ciudad, source, status)
VALUES ('Test QA', 'Empresa QA', 'qa@test.com', NULL, 'Quito', 'onboarding', 'nuevo')
RETURNING id, source;
RESET ROLE;
DELETE FROM leads WHERE email = 'qa@test.com';
```
Expected: INSERT returns a row with `source = 'onboarding'`; DELETE removes it. If it errors with `23514`, the CHECK didn't apply.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260623120000_leads_source_onboarding.sql
git commit -m "feat(db): permitir leads.source='onboarding' para solicitudes del wizard"
```

---

### Task 2: Update `LeadSource` type

**Files:**
- Modify: `src/types/crm.ts:10`

**Interfaces:**
- Produces: `LeadSource` union includes `'onboarding'`.

- [ ] **Step 1: Edit the type**

Change line 10 from:
```ts
export type LeadSource = 'diagnostico' | 'partners' | 'home' | 'sobre' | 'otro'
```
to:
```ts
export type LeadSource = 'diagnostico' | 'partners' | 'home' | 'sobre' | 'otro' | 'onboarding'
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b config/tsconfig.json`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/crm.ts
git commit -m "feat(crm): agregar 'onboarding' a LeadSource"
```

---

### Task 3: Shared `buildWhatsappUrl` helper

**Files:**
- Create: `src/lib/whatsapp.ts`
- Test: `src/lib/whatsapp.test.ts`

**Interfaces:**
- Produces: `export function buildWhatsappUrl(number: string, message: string): string | null`
  — returns `null` when `number` is empty, else `https://wa.me/<number>?text=<encoded>`.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/whatsapp.test.ts
import { describe, it, expect } from 'vitest';
import { buildWhatsappUrl } from './whatsapp';

describe('buildWhatsappUrl', () => {
  it('returns null when number is empty', () => {
    expect(buildWhatsappUrl('', 'hola')).toBeNull();
  });

  it('builds a wa.me url with encoded message', () => {
    const url = buildWhatsappUrl('593987654321', 'Hola, lo saco?');
    expect(url).toBe('https://wa.me/593987654321?text=Hola%2C%20lo%20saco%3F');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --config config/vitest.config.ts src/lib/whatsapp.test.ts`
Expected: FAIL — cannot find module `./whatsapp`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/whatsapp.ts
/** Construye un deep-link wa.me. Devuelve null si no hay numero configurado. */
export function buildWhatsappUrl(number: string, message: string): string | null {
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run --config config/vitest.config.ts src/lib/whatsapp.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/whatsapp.ts src/lib/whatsapp.test.ts
git commit -m "feat(lib): helper compartido buildWhatsappUrl"
```

---

### Task 4: Lead-payload builder + `createPermitServiceLead`

**Files:**
- Modify: `src/lib/api/onboarding.ts` (append at end of file)
- Test: `src/lib/api/onboarding.test.ts`

**Interfaces:**
- Consumes: `supabase` from `../supabase`.
- Produces:
  ```ts
  export interface PermitServiceLeadInput {
    nombre: string; email: string; telefono?: string;
    negocio: string; ciudad?: string; permitType: string;
  }
  export function buildPermitServiceLead(input: PermitServiceLeadInput): {
    nombre: string; negocio: string; email: string; telefono: string | null;
    ciudad: string | null; source: 'onboarding'; status: 'nuevo'; notas: string;
  }
  export async function createPermitServiceLead(input: PermitServiceLeadInput): Promise<void>
  ```

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/api/onboarding.test.ts
import { describe, it, expect } from 'vitest';
import { buildPermitServiceLead } from './onboarding';

describe('buildPermitServiceLead', () => {
  it('maps input to a leads row with source=onboarding and permit in notas', () => {
    const row = buildPermitServiceLead({
      nombre: 'Danilo Rojas',
      email: 'danilo@gmail.com',
      telefono: '0987654321',
      negocio: 'Mi Restaurante',
      ciudad: 'Quito',
      permitType: 'arcsa',
    });
    expect(row.source).toBe('onboarding');
    expect(row.status).toBe('nuevo');
    expect(row.nombre).toBe('Danilo Rojas');
    expect(row.email).toBe('danilo@gmail.com');
    expect(row.telefono).toBe('0987654321');
    expect(row.negocio).toBe('Mi Restaurante');
    expect(row.ciudad).toBe('Quito');
    expect(row.notas).toContain('arcsa');
    expect(row.notas.toLowerCase()).toContain('lo sacamos por ti');
  });

  it('nulls out optional empty fields', () => {
    const row = buildPermitServiceLead({
      nombre: 'X', email: 'x@y.com', negocio: 'N', permitType: 'bomberos',
    });
    expect(row.telefono).toBeNull();
    expect(row.ciudad).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --config config/vitest.config.ts src/lib/api/onboarding.test.ts`
Expected: FAIL — `buildPermitServiceLead` is not exported.

- [ ] **Step 3: Append implementation to `src/lib/api/onboarding.ts`**

```ts
// ===== Lead "lo sacamos por ti" (handoff de permisos en onboarding) =====

export interface PermitServiceLeadInput {
  nombre: string;
  email: string;
  telefono?: string;
  negocio: string;
  ciudad?: string;
  permitType: string;
}

/** Construye la fila de leads (puro, testeable sin red). */
export function buildPermitServiceLead(input: PermitServiceLeadInput) {
  return {
    nombre: input.nombre,
    negocio: input.negocio,
    email: input.email,
    telefono: input.telefono?.trim() ? input.telefono.trim() : null,
    ciudad: input.ciudad?.trim() ? input.ciudad.trim() : null,
    source: 'onboarding' as const,
    status: 'nuevo' as const,
    notas: `Solicitud "lo sacamos por ti" desde onboarding — permiso: ${input.permitType}`,
  };
}

/** Inserta un lead de solicitud de servicio. Aparece en el CRM interno (LeadsTable). */
export async function createPermitServiceLead(input: PermitServiceLeadInput): Promise<void> {
  const row = buildPermitServiceLead(input);
  // casting due to stale generated types — see audit follow-up
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('leads') as any).insert(row);
  if (error) throw error;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run --config config/vitest.config.ts src/lib/api/onboarding.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/api/onboarding.ts src/lib/api/onboarding.test.ts
git commit -m "feat(onboarding): createPermitServiceLead + builder testeable"
```

---

### Task 5: `StepInterlude` celebration component

**Files:**
- Create: `src/features/onboarding-incremental/components/StepInterlude.tsx`

**Interfaces:**
- Produces:
  ```ts
  export interface StepInterludeProps {
    title: string; subtitle?: string; ctaLabel: string; onContinue: () => void;
  }
  export function StepInterlude(props: StepInterludeProps): JSX.Element
  ```

- [ ] **Step 1: Write the component**

```tsx
// src/features/onboarding-incremental/components/StepInterlude.tsx
import { PartyPopper } from '@/lib/lucide-icons';
import { Button } from '@/components/ui/button';

export interface StepInterludeProps {
  title: string;
  subtitle?: string;
  ctaLabel: string;
  onContinue: () => void;
}

export function StepInterlude({ title, subtitle, ctaLabel, onContinue }: StepInterludeProps) {
  return (
    <div className="flex flex-col items-center text-center py-[var(--ds-space-600)]">
      <div className="w-16 h-16 rounded-full bg-[var(--ds-status-vigente-bg,#f0fdf4)] flex items-center justify-center mb-[var(--ds-space-300)]">
        <PartyPopper className="w-8 h-8 text-[var(--ds-status-vigente-text,#15803d)]" />
      </div>
      <h2 className="text-[var(--ds-font-size-400)] font-semibold text-[var(--ds-text)] tracking-tight mb-[var(--ds-space-100)]">
        {title}
      </h2>
      {subtitle && (
        <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] max-w-md mb-[var(--ds-space-400)]">
          {subtitle}
        </p>
      )}
      <Button onClick={onContinue}>{ctaLabel}</Button>
    </div>
  );
}
```

> If `PartyPopper` is not exported by `@/lib/lucide-icons`, fall back to `CheckCircle2` (confirmed present). Verify with: `grep -n "PartyPopper\|CheckCircle2" src/lib/lucide-icons.ts`. Use whichever exists; prefer `PartyPopper`.

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b config/tsconfig.json`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/onboarding-incremental/components/StepInterlude.tsx
git commit -m "feat(onboarding): componente StepInterlude (celebracion entre pasos)"
```

---

### Task 6: `WelcomeStep` screen

**Files:**
- Create: `src/features/onboarding-incremental/steps/WelcomeStep.tsx`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces:
  ```ts
  export interface WelcomeStepProps {
    initialName?: string; onNext: (fullName: string) => Promise<void>; loading: boolean;
  }
  export function WelcomeStep(props: WelcomeStepProps): JSX.Element
  ```
  Mirrors `ProfileStep`'s contract (a `<form>` with a hidden submit button, driven by the wizard footer's `requestSubmit()`).

- [ ] **Step 1: Write the component**

```tsx
// src/features/onboarding-incremental/steps/WelcomeStep.tsx
import { useState } from 'react';
import { Building2, MapPin, FileCheck } from '@/lib/lucide-icons';
import { Button } from '@/components/ui/button';

export interface WelcomeStepProps {
  initialName?: string;
  onNext: (fullName: string) => Promise<void>;
  loading: boolean;
}

const MILESTONES = [
  { icon: Building2, label: 'Creá tu empresa' },
  { icon: MapPin, label: 'Agregá tu primera sede' },
  { icon: FileCheck, label: 'Poné tus permisos en regla' },
];

export function WelcomeStep({ initialName = '', onNext, loading }: WelcomeStepProps) {
  const [fullName, setFullName] = useState(initialName);
  const firstName = (initialName || '').trim().split(' ')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim().length === 0) return;
    await onNext(fullName.trim());
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-[var(--ds-font-size-400)] font-semibold text-[var(--ds-text)] mb-[var(--ds-space-050)] tracking-tight">
        {firstName ? `Hola ${firstName} 👋` : 'Hola 👋'} Bienvenido a EnRegla
      </h2>
      <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mb-[var(--ds-space-400)]">
        Vamos a dejar tu negocio en regla en 3 pasos rápidos. Lo primero: creá tu empresa.
      </p>

      <div className="space-y-[var(--ds-space-150)] mb-[var(--ds-space-400)]">
        {MILESTONES.map(({ icon: Icon, label }, i) => (
          <div key={label} className="flex items-center gap-[var(--ds-space-150)]">
            <div className="w-8 h-8 rounded-full bg-[var(--ds-neutral-100)] flex items-center justify-center text-[var(--ds-font-size-075)] font-semibold text-[var(--ds-text-subtle)] shrink-0">
              {i + 1}
            </div>
            <Icon className="w-4 h-4 text-[var(--ds-text-subtle)]" />
            <span className="text-[var(--ds-font-size-100)] text-[var(--ds-text)]">{label}</span>
          </div>
        ))}
      </div>

      <div>
        <label className="block text-[var(--ds-font-size-075)] font-medium text-[var(--ds-text)] mb-[var(--ds-space-075)]">
          Confirmá tu nombre
        </label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Nombre completo"
          disabled={loading}
          autoFocus
          className="w-full bg-white border border-[var(--ds-border)] rounded-[var(--ds-radius-200)] px-[var(--ds-space-150)] py-[var(--ds-space-100)] text-[var(--ds-font-size-100)] text-[var(--ds-text)] placeholder:text-[var(--ds-text-subtlest)] focus:outline-none focus:ring-2 focus:ring-[var(--ds-background-brand)]/20 focus:border-[var(--ds-border-bold)] transition-all disabled:opacity-50"
        />
      </div>

      <Button type="submit" disabled={fullName.trim().length === 0 || loading} className="hidden">
        Crear mi empresa
      </Button>
    </form>
  );
}
```

> Verify `Building2`, `MapPin`, `FileCheck` are exported by `@/lib/lucide-icons` (`Building2` and `MapPin` are used in ProgressStepper, so they exist; if `FileCheck` is missing use `FileText`, confirmed present). Run: `grep -n "FileCheck\|FileText" src/lib/lucide-icons.ts`.

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b config/tsconfig.json`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/onboarding-incremental/steps/WelcomeStep.tsx
git commit -m "feat(onboarding): WelcomeStep con saludo + hitos + confirmar nombre"
```

---

### Task 7: `PermitRequirementCard` + `PermitPreviewStep`

**Files:**
- Create: `src/features/onboarding-incremental/components/PermitRequirementCard.tsx`
- Create: `src/features/onboarding-incremental/steps/PermitPreviewStep.tsx`
- Test: `src/features/onboarding-incremental/steps/PermitPreviewStep.test.tsx`

**Interfaces:**
- Consumes: `usePermitRequirements` from `@/lib/domain/permit-requirements`, `permitTypeLabel` from `@/lib/domain/permit-types`, `businessTypeLabel` from `@/lib/domain/business-types`, `useIssuers` from `@/lib/domain/issuers`.
- Produces:
  ```ts
  // PermitRequirementCard
  export interface PermitRequirementCardProps {
    permitTypeLabel: string; issuerLabel: string | null; isMandatory: boolean;
    costLabel: string | null; fineLabel: string | null; appliesWhen: string | null;
  }
  // PermitPreviewStep
  export interface PermitPreviewStepProps { businessType: string; }
  ```

- [ ] **Step 1: Write the failing render test**

```tsx
// src/features/onboarding-incremental/steps/PermitPreviewStep.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PermitPreviewStep } from './PermitPreviewStep';

// Mock the data hook so the test is deterministic (no network).
vi.mock('@/lib/domain/permit-requirements', () => ({
  usePermitRequirements: () => ({
    data: [
      {
        id: '1', business_type: 'restaurante', permit_type: 'bomberos',
        is_mandatory: true, issuer_id: null, required_role: 'admin',
        cost_min: 30, cost_max: 80, cost_currency: 'USD', cost_notes: null,
        cost_updated_at: null, fine_min: 200, fine_max: 2000, fine_source: null,
        applies_when: null,
      },
    ],
    isLoading: false,
    error: null,
  }),
}));
vi.mock('@/lib/domain/issuers', () => ({ useIssuers: () => ({ data: [] }) }));

describe('PermitPreviewStep', () => {
  it('renders the business-type heading and a requirement row', () => {
    render(<PermitPreviewStep businessType="restaurante" />);
    expect(screen.getByText(/vas a necesitar estos permisos/i)).toBeTruthy();
    expect(screen.getByText(/Restaurante/i)).toBeTruthy();
    expect(screen.getByText(/Bomberos/i)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --config config/vitest.config.ts src/features/onboarding-incremental/steps/PermitPreviewStep.test.tsx`
Expected: FAIL — cannot find module `./PermitPreviewStep`.

- [ ] **Step 3: Write `PermitRequirementCard.tsx`**

```tsx
// src/features/onboarding-incremental/components/PermitRequirementCard.tsx
import { ShieldAlert, FileText } from '@/lib/lucide-icons';

export interface PermitRequirementCardProps {
  permitTypeLabel: string;
  issuerLabel: string | null;
  isMandatory: boolean;
  costLabel: string | null;
  fineLabel: string | null;
  appliesWhen: string | null;
}

export function PermitRequirementCard({
  permitTypeLabel, issuerLabel, isMandatory, costLabel, fineLabel, appliesWhen,
}: PermitRequirementCardProps) {
  return (
    <div className="border border-[var(--ds-border)] rounded-[var(--ds-radius-300)] bg-white p-[var(--ds-space-250)]">
      <div className="flex items-start gap-[var(--ds-space-150)]">
        <FileText className="w-5 h-5 text-[var(--ds-text-subtle)] mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-[var(--ds-space-100)] flex-wrap">
            <span className="text-[var(--ds-font-size-100)] font-semibold text-[var(--ds-text)]">
              {permitTypeLabel}
            </span>
            {isMandatory && (
              <span className="text-[var(--ds-font-size-075)] font-semibold px-[var(--ds-space-100)] py-0.5 rounded-full bg-[var(--ds-orange-100,#ffedd5)] text-[var(--ds-orange-700,#c2410c)]">
                Obligatorio
              </span>
            )}
          </div>
          {issuerLabel && (
            <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] mt-0.5">
              Emite: {issuerLabel}
            </p>
          )}
          {appliesWhen && (
            <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] mt-0.5">
              Aplica cuando: {appliesWhen}
            </p>
          )}
          <div className="flex flex-wrap gap-[var(--ds-space-200)] mt-[var(--ds-space-100)]">
            {costLabel && (
              <span className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">
                Costo estimado: <b className="text-[var(--ds-text)]">{costLabel}</b>
              </span>
            )}
            {fineLabel && (
              <span className="text-[var(--ds-font-size-075)] text-[var(--ds-red-600,#dc2626)] inline-flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Multa: {fineLabel}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

> Verify `ShieldAlert` exists in `@/lib/lucide-icons`; if not, use `AlertCircle` (confirmed present in PermitUploadForm import). Run `grep -n "ShieldAlert\|AlertCircle" src/lib/lucide-icons.ts`.

- [ ] **Step 4: Write `PermitPreviewStep.tsx`**

```tsx
// src/features/onboarding-incremental/steps/PermitPreviewStep.tsx
import { usePermitRequirements } from '@/lib/domain/permit-requirements';
import { permitTypeLabel } from '@/lib/domain/permit-types';
import { businessTypeLabel } from '@/lib/domain/business-types';
import { useIssuers } from '@/lib/domain/issuers';
import { Banner } from '@/components/ui/banner';
import { Loader2 } from '@/lib/lucide-icons';
import type { BusinessType } from '@/lib/domain/business-types';
import { PermitRequirementCard } from '../components/PermitRequirementCard';

export interface PermitPreviewStepProps {
  businessType: string;
}

function money(min: number | null, max: number | null, currency: string | null): string | null {
  if (min == null && max == null) return null;
  const cur = currency ?? 'USD';
  if (min != null && max != null && min !== max) return `$${min}–$${max} ${cur}`;
  const v = min ?? max;
  return `$${v} ${cur}`;
}

export function PermitPreviewStep({ businessType }: PermitPreviewStepProps) {
  const { data, isLoading, error } = usePermitRequirements(businessType as BusinessType);
  const { data: issuers } = useIssuers();

  const issuerName = (id: string | null): string | null => {
    if (!id || !issuers) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const found = (issuers as any[]).find((x) => x.id === id);
    return found?.name ?? found?.nombre ?? null;
  };

  return (
    <div>
      <h2 className="text-[var(--ds-font-size-400)] font-semibold text-[var(--ds-text)] mb-[var(--ds-space-050)] tracking-tight">
        Para un {businessTypeLabel(businessType)} vas a necesitar estos permisos
      </h2>
      <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mb-[var(--ds-space-400)]">
        Todavía no tenés que hacer nada — primero creemos tu sede. Después te ayudamos a sacarlos.
      </p>

      {isLoading && (
        <div className="flex items-center gap-[var(--ds-space-100)] text-[var(--ds-text-subtle)]">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando permisos…
        </div>
      )}

      {error && (
        <Banner variant="info">
          No pudimos cargar el detalle ahora. Los vas a ver en el dashboard después de crear tu sede.
        </Banner>
      )}

      {!isLoading && !error && (!data || data.length === 0) && (
        <Banner variant="info">
          Vamos a generar los permisos base de tu negocio (RUC, patente municipal y los que
          apliquen) cuando crees tu sede.
        </Banner>
      )}

      {!isLoading && !error && data && data.length > 0 && (
        <div className="space-y-[var(--ds-space-200)]">
          {data.map((req) => (
            <PermitRequirementCard
              key={req.id}
              permitTypeLabel={permitTypeLabel(req.permit_type)}
              issuerLabel={issuerName(req.issuer_id)}
              isMandatory={req.is_mandatory}
              costLabel={money(req.cost_min, req.cost_max, req.cost_currency)}
              fineLabel={money(req.fine_min, req.fine_max, null)}
              appliesWhen={req.applies_when}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run --config config/vitest.config.ts src/features/onboarding-incremental/steps/PermitPreviewStep.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 6: Commit**

```bash
git add src/features/onboarding-incremental/components/PermitRequirementCard.tsx src/features/onboarding-incremental/steps/PermitPreviewStep.tsx src/features/onboarding-incremental/steps/PermitPreviewStep.test.tsx
git commit -m "feat(onboarding): PermitPreviewStep educativo por business_type"
```

---

### Task 8: `GetItForYouForm` (lead capture + WhatsApp)

**Files:**
- Create: `src/features/onboarding-incremental/components/GetItForYouForm.tsx`

**Interfaces:**
- Consumes: `createPermitServiceLead` (Task 4), `buildWhatsappUrl` (Task 3).
- Produces:
  ```ts
  export interface GetItForYouFormProps {
    permitType: string;       // slug, for notas
    permitLabel: string;      // human label, for copy
    nombre: string;           // from profile
    email: string;            // from session
    negocio: string;          // company name
    ciudad?: string;
  }
  export function GetItForYouForm(props: GetItForYouFormProps): JSX.Element
  ```

- [ ] **Step 1: Write the component**

```tsx
// src/features/onboarding-incremental/components/GetItForYouForm.tsx
import { useState } from 'react';
import { MessageSquare, Loader2, CheckCircle2 } from '@/lib/lucide-icons';
import { Button } from '@/components/ui/button';
import { Banner } from '@/components/ui/banner';
import { createPermitServiceLead } from '@/lib/api/onboarding';
import { buildWhatsappUrl } from '@/lib/whatsapp';

const WHATSAPP_NUMBER = (import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined) ?? '';

export interface GetItForYouFormProps {
  permitType: string;
  permitLabel: string;
  nombre: string;
  email: string;
  negocio: string;
  ciudad?: string;
}

export function GetItForYouForm({
  permitType, permitLabel, nombre, email, negocio, ciudad,
}: GetItForYouFormProps) {
  const [telefono, setTelefono] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const waUrl = buildWhatsappUrl(
    WHATSAPP_NUMBER,
    `Hola, quiero que me ayuden a sacar el permiso "${permitLabel}".\n\nEmpresa: ${negocio}`,
  );

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await createPermitServiceLead({ nombre, email, telefono, negocio, ciudad, permitType });
      setSent(true);
    } catch (err) {
      console.error('createPermitServiceLead error:', err);
      setError(err instanceof Error ? err.message : 'No se pudo enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <Banner variant="success" title="¡Listo!">
        Recibimos tu solicitud para el permiso {permitLabel}. Te contactamos pronto al {email}.
      </Banner>
    );
  }

  return (
    <div className="space-y-[var(--ds-space-150)]">
      <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">
        Dejanos tu teléfono y nosotros tramitamos el <b>{permitLabel}</b> por vos. Te contactamos
        al {email}.
      </p>
      <input
        type="tel"
        value={telefono}
        onChange={(e) => setTelefono(e.target.value)}
        placeholder="Teléfono (opcional)"
        disabled={loading}
        className="w-full bg-white border border-[var(--ds-border)] rounded-[var(--ds-radius-200)] px-[var(--ds-space-150)] py-[var(--ds-space-100)] text-[var(--ds-font-size-100)] text-[var(--ds-text)] placeholder:text-[var(--ds-text-subtlest)] focus:outline-none focus:ring-2 focus:ring-[var(--ds-background-brand)]/20 focus:border-[var(--ds-border-bold)]"
      />
      {error && <Banner variant="error">{error}</Banner>}
      <div className="flex flex-wrap gap-[var(--ds-space-100)]">
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Enviar solicitud
        </Button>
        {waUrl && (
          <a href={waUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" type="button">
              <MessageSquare className="w-4 h-4" />
              WhatsApp directo
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b config/tsconfig.json`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/onboarding-incremental/components/GetItForYouForm.tsx
git commit -m "feat(onboarding): GetItForYouForm (lead + WhatsApp)"
```

---

### Task 9: `PermitHandoffCard`

**Files:**
- Create: `src/features/onboarding-incremental/components/PermitHandoffCard.tsx`

**Interfaces:**
- Consumes: `PermitUploadForm` from `@/features/permits/PermitUploadForm`, `GetItForYouForm` (Task 8), `useLegalReferences` from `@/lib/domain/legal-references-db`, `permitTypeLabel`.
- Produces:
  ```ts
  import type { Permit } from '@/types/database';
  export interface PermitHandoffCardProps {
    permit: Permit;                       // DB Row permit (has id, type, status, location_id)
    businessType: string;
    leadInfo: { nombre: string; email: string; negocio: string; ciudad?: string };
    updatePermit: (permitId: string, updates: {
      issue_date?: string; expiry_date?: string | null;
      status?: 'vigente' | 'por_vencer' | 'vencido' | 'en_tramite' | 'no_registrado';
      permit_number?: string | null; notes?: string | null;
    }) => Promise<void>;
    onUploaded: () => void;               // parent refetches permits
  }
  ```

- [ ] **Step 1: Write the component**

```tsx
// src/features/onboarding-incremental/components/PermitHandoffCard.tsx
import { useState } from 'react';
import { Upload, FileText, ExternalLink, CheckCircle2 } from '@/lib/lucide-icons';
import { Button } from '@/components/ui/button';
import { PermitUploadForm } from '@/features/permits/PermitUploadForm';
import { useLegalReferences } from '@/lib/domain/legal-references-db';
import { permitTypeLabel } from '@/lib/domain/permit-types';
import type { BusinessType } from '@/lib/domain/business-types';
import type { Permit } from '@/types/database';
import { GetItForYouForm } from './GetItForYouForm';

export interface PermitHandoffCardProps {
  permit: Permit;
  businessType: string;
  leadInfo: { nombre: string; email: string; negocio: string; ciudad?: string };
  updatePermit: (
    permitId: string,
    updates: {
      issue_date?: string;
      expiry_date?: string | null;
      status?: 'vigente' | 'por_vencer' | 'vencido' | 'en_tramite' | 'no_registrado';
      permit_number?: string | null;
      notes?: string | null;
    }
  ) => Promise<void>;
  onUploaded: () => void;
}

type Panel = 'none' | 'upload' | 'help';

export function PermitHandoffCard({
  permit, businessType, leadInfo, updatePermit, onUploaded,
}: PermitHandoffCardProps) {
  const [panel, setPanel] = useState<Panel>('none');
  const { data: legalRefs } = useLegalReferences(businessType as BusinessType);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pType = (permit as any).type as string;
  const label = permitTypeLabel(pType);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const status = (permit as any).status as string;
  const isDone = status === 'vigente' || status === 'por_vencer';

  const legal = legalRefs?.find((r) => r.permit_type === pType) ?? null;

  return (
    <div className="border border-[var(--ds-border)] rounded-[var(--ds-radius-300)] bg-white p-[var(--ds-space-250)]">
      <div className="flex items-center justify-between gap-[var(--ds-space-150)]">
        <div className="flex items-center gap-[var(--ds-space-150)] min-w-0">
          <FileText className="w-5 h-5 text-[var(--ds-text-subtle)] shrink-0" />
          <span className="text-[var(--ds-font-size-100)] font-semibold text-[var(--ds-text)] truncate">
            {label}
          </span>
          {isDone ? (
            <span className="text-[var(--ds-font-size-075)] font-semibold px-[var(--ds-space-100)] py-0.5 rounded-full bg-[var(--ds-status-vigente-bg,#f0fdf4)] text-[var(--ds-status-vigente-text,#15803d)] inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Vigente
            </span>
          ) : (
            <span className="text-[var(--ds-font-size-075)] font-semibold px-[var(--ds-space-100)] py-0.5 rounded-full bg-[var(--ds-neutral-100)] text-[var(--ds-text-subtle)]">
              Sin registrar
            </span>
          )}
        </div>
        {!isDone && (
          <div className="flex gap-[var(--ds-space-100)] shrink-0">
            <Button size="sm" onClick={() => setPanel(panel === 'upload' ? 'none' : 'upload')}>
              <Upload className="w-4 h-4" /> Subir
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPanel(panel === 'help' ? 'none' : 'help')}>
              No lo tengo
            </Button>
          </div>
        )}
      </div>

      {panel === 'upload' && !isDone && (
        <div className="mt-[var(--ds-space-200)] pt-[var(--ds-space-200)] border-t border-[var(--ds-border)]">
          <PermitUploadForm
            permit={permit}
            updatePermit={updatePermit}
            onSuccess={() => { setPanel('none'); onUploaded(); }}
            onCancel={() => setPanel('none')}
          />
        </div>
      )}

      {panel === 'help' && !isDone && (
        <div className="mt-[var(--ds-space-200)] pt-[var(--ds-space-200)] border-t border-[var(--ds-border)] space-y-[var(--ds-space-200)]">
          {legal ? (
            <div className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] space-y-1">
              <p>{legal.description}</p>
              {legal.frequency_basis && <p>Se renueva: {legal.frequency_basis}</p>}
              {legal.estimated_cost && <p>Costo estimado: {legal.estimated_cost}</p>}
              {legal.disclaimer && <p className="italic">{legal.disclaimer}</p>}
              {legal.government_portal_url && (
                <a
                  href={legal.government_portal_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[var(--ds-text-brand)] font-semibold"
                >
                  {legal.government_portal_name ?? 'Ir al portal del gobierno'}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ) : (
            <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">
              Te ayudamos a tramitar este permiso.
            </p>
          )}

          <div className="pt-[var(--ds-space-150)] border-t border-[var(--ds-border)]">
            <h4 className="text-[var(--ds-font-size-100)] font-semibold text-[var(--ds-text)] mb-[var(--ds-space-100)]">
              ¿Lo sacamos por ti?
            </h4>
            <GetItForYouForm
              permitType={pType}
              permitLabel={label}
              nombre={leadInfo.nombre}
              email={leadInfo.email}
              negocio={leadInfo.negocio}
              ciudad={leadInfo.ciudad}
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

> `Permit` from `@/types/database` is the DB Row (snake_case: `type`, `status`, `location_id`). `usePermits` returns this shape and `PermitUploadForm` expects it — so passing straight through is type-correct. Verify field names if tsc complains: `grep -n "type\|status" src/types/database.ts | grep -i permit`.

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b config/tsconfig.json`
Expected: no new errors. If `permit.type`/`permit.status` typings complain, the `as any` casts already guard the reads; ensure `PermitUploadForm`'s `permit` prop accepts the same `Permit` type imported here (both import from `@/types/database`).

- [ ] **Step 3: Commit**

```bash
git add src/features/onboarding-incremental/components/PermitHandoffCard.tsx
git commit -m "feat(onboarding): PermitHandoffCard (subir / legal / lo sacamos por ti)"
```

---

### Task 10: `PermitHandoffStep`

**Files:**
- Create: `src/features/onboarding-incremental/steps/PermitHandoffStep.tsx`

**Interfaces:**
- Consumes: `usePermits` from `@/hooks/usePermits`, `PermitHandoffCard` (Task 9).
- Produces:
  ```ts
  export interface PermitHandoffStepProps {
    companyId: string;
    locationId: string;
    locationName: string;
    businessType: string;
    leadInfo: { nombre: string; email: string; negocio: string; ciudad?: string };
    onGoToDashboard: () => void;
  }
  ```

- [ ] **Step 1: Write the component**

```tsx
// src/features/onboarding-incremental/steps/PermitHandoffStep.tsx
import { usePermits } from '@/hooks/usePermits';
import { Loader2 } from '@/lib/lucide-icons';
import { Button } from '@/components/ui/button';
import { Banner } from '@/components/ui/banner';
import { PermitHandoffCard } from '../components/PermitHandoffCard';

export interface PermitHandoffStepProps {
  companyId: string;
  locationId: string;
  locationName: string;
  businessType: string;
  leadInfo: { nombre: string; email: string; negocio: string; ciudad?: string };
  onGoToDashboard: () => void;
}

export function PermitHandoffStep({
  companyId, locationId, locationName, businessType, leadInfo, onGoToDashboard,
}: PermitHandoffStepProps) {
  const { permits, loading, updatePermit, refetch } = usePermits({ companyId, locationId });

  return (
    <div>
      <h2 className="text-[var(--ds-font-size-400)] font-semibold text-[var(--ds-text)] mb-[var(--ds-space-050)] tracking-tight">
        ¡Tu sede {locationName} está lista! 🎉
      </h2>
      <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mb-[var(--ds-space-400)]">
        Estos son los permisos que necesitás. Si los tenés a la mano, subilos ahora. Si no, te
        decimos cómo sacarlos o los tramitamos por vos.
      </p>

      {loading && (
        <div className="flex items-center gap-[var(--ds-space-100)] text-[var(--ds-text-subtle)]">
          <Loader2 className="w-4 h-4 animate-spin" /> Generando tus permisos…
        </div>
      )}

      {!loading && permits.length === 0 && (
        <Banner variant="info">
          Tus permisos se están generando. Los vas a ver en el dashboard.
        </Banner>
      )}

      {!loading && permits.length > 0 && (
        <div className="space-y-[var(--ds-space-200)]">
          {permits.map((permit) => (
            <PermitHandoffCard
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              key={(permit as any).id}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              permit={permit as any}
              businessType={businessType}
              leadInfo={leadInfo}
              updatePermit={updatePermit}
              onUploaded={refetch}
            />
          ))}
        </div>
      )}

      <div className="mt-[var(--ds-space-500)] flex justify-end">
        <Button onClick={onGoToDashboard}>Ir al Dashboard</Button>
      </div>
    </div>
  );
}
```

> `usePermits` returns `{ permits, loading, updatePermit, refetch }` (confirmed in `src/hooks/usePermits.ts`). The `permit as any` cast bridges the `usePermits` permit shape to `PermitHandoffCard`'s `@/types/database` `Permit`. If tsc shows the exact return type, drop the `as any` and use it directly.

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b config/tsconfig.json`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/onboarding-incremental/steps/PermitHandoffStep.tsx
git commit -m "feat(onboarding): PermitHandoffStep lista permisos reales de la sede"
```

---

### Task 11: Update `ProgressStepper` to 3 milestones + extended union

**Files:**
- Modify: `src/features/onboarding-incremental/components/ProgressStepper.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: `ProgressStepperProps.currentStep` and `completedSteps` accept the union
  `'welcome' | 'company' | 'preview' | 'locations' | 'handoff'`; renders 3 milestones
  (Empresa, Sede, Permisos) where the active milestone is derived from the current substep.

- [ ] **Step 1: Replace the file**

```tsx
// src/features/onboarding-incremental/components/ProgressStepper.tsx
import { CheckCircle2, Building2, MapPin, FileCheck } from '@/lib/lucide-icons';

export type WizardStep = 'welcome' | 'company' | 'preview' | 'locations' | 'handoff';

interface Milestone {
  id: 'empresa' | 'sede' | 'permisos';
  label: string;
  icon: typeof Building2;
  steps: WizardStep[];
}

interface ProgressStepperProps {
  currentStep: WizardStep;
  completedSteps: WizardStep[];
}

const MILESTONES: Milestone[] = [
  { id: 'empresa', label: 'Tu empresa', icon: Building2, steps: ['welcome', 'company'] },
  { id: 'sede', label: 'Tu sede', icon: MapPin, steps: ['preview', 'locations'] },
  { id: 'permisos', label: 'Permisos', icon: FileCheck, steps: ['handoff'] },
];

const ORDER: WizardStep[] = ['welcome', 'company', 'preview', 'locations', 'handoff'];

export function ProgressStepper({ currentStep, completedSteps }: ProgressStepperProps) {
  const currentIdx = ORDER.indexOf(currentStep);

  return (
    <div className="space-y-[var(--ds-space-050)]">
      {MILESTONES.map((m) => {
        const Icon = m.icon;
        const isActive = m.steps.includes(currentStep);
        // milestone completed when all its steps are before the current step,
        // or explicitly in completedSteps
        const lastStepIdx = Math.max(...m.steps.map((s) => ORDER.indexOf(s)));
        const isCompleted =
          !isActive &&
          (lastStepIdx < currentIdx || m.steps.every((s) => completedSteps.includes(s)));

        return (
          <div
            key={m.id}
            className={`flex items-center gap-[var(--ds-space-150)] rounded-[var(--ds-radius-200)] px-[var(--ds-space-150)] py-[var(--ds-space-100)] transition-all ${
              isActive
                ? 'bg-[var(--ds-text)] text-white'
                : isCompleted
                ? 'text-[var(--ds-text-subtle)]'
                : 'text-[var(--ds-text-subtlest)]'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[var(--ds-font-size-075)] font-medium shrink-0 ${
                isActive ? 'bg-white text-[var(--ds-text)]' : 'bg-[var(--ds-neutral-100)] text-[var(--ds-text-subtle)]'
              }`}
            >
              {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
            </div>
            <span className="text-[var(--ds-font-size-075)] font-medium">{m.label}</span>
          </div>
        );
      })}
    </div>
  );
}
```

> If `FileCheck` is not exported by `@/lib/lucide-icons`, use `FileText`. Same grep as Task 6.

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b config/tsconfig.json`
Expected: errors only in `IncrementalWizard.tsx` (it still passes the old union) — fixed in Task 12.

- [ ] **Step 3: Commit**

```bash
git add src/features/onboarding-incremental/components/ProgressStepper.tsx
git commit -m "feat(onboarding): ProgressStepper a 3 hitos (Empresa/Sede/Permisos)"
```

---

### Task 12: Rewire `IncrementalWizard` step machine

**Files:**
- Modify: `src/features/onboarding-incremental/IncrementalWizard.tsx`

**Interfaces:**
- Consumes: `WelcomeStep`, `PermitPreviewStep`, `PermitHandoffStep`, `StepInterlude`, updated `ProgressStepper` (`WizardStep` type), `CompanyStep`, `LocationsStep`, `saveProfile`, `saveCompany`, `saveLocationWithPermits`.
- Produces: a wizard whose `initialStep` accepts `'welcome' | 'company' | 'preview' | 'locations'`.

- [ ] **Step 1: Replace the file**

```tsx
// src/features/onboarding-incremental/IncrementalWizard.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import {
  saveProfile,
  saveCompany,
  saveLocationWithPermits,
} from '@/lib/api/onboarding';
import { Button } from '@/components/ui/button';
import { Banner } from '@/components/ui/banner';
import { ProgressStepper, type WizardStep } from './components/ProgressStepper';
import { StepInterlude } from './components/StepInterlude';
import { WelcomeStep } from './steps/WelcomeStep';
import { CompanyStep } from './steps/CompanyStep';
import { PermitPreviewStep } from './steps/PermitPreviewStep';
import { LocationsStep } from './steps/LocationsStep';
import { PermitHandoffStep } from './steps/PermitHandoffStep';

// 'interlude' is a transient celebration shown after company save.
type Step = WizardStep | 'interlude';

interface CompanyData {
  name: string;
  ruc: string;
  city: string;
  business_type: string;
}

interface IncrementalWizardProps {
  initialStep?: WizardStep;
}

export function IncrementalWizard({ initialStep = 'welcome' }: IncrementalWizardProps) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const googleName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    (user?.user_metadata?.given_name && user?.user_metadata?.family_name
      ? `${user.user_metadata.given_name} ${user.user_metadata.family_name}`
      : '');

  const [currentStep, setCurrentStep] = useState<Step>(initialStep);
  const [completedSteps, setCompletedSteps] = useState<WizardStep[]>(() => {
    const steps: WizardStep[] = [];
    if (initialStep === 'company' || initialStep === 'preview' || initialStep === 'locations') {
      steps.push('welcome');
    }
    if (initialStep === 'preview' || initialStep === 'locations') {
      steps.push('company');
    }
    return steps;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [savedName, setSavedName] = useState(profile?.full_name || googleName);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(profile?.company_id || null);
  const [createdLocation, setCreatedLocation] = useState<{ id: string; name: string } | null>(null);

  const markDone = (step: WizardStep) =>
    setCompletedSteps((prev) => (prev.includes(step) ? prev : [...prev, step]));

  const handleWelcomeNext = async (fullName: string) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      await saveProfile(user.id, fullName);
      setSavedName(fullName);
      markDone('welcome');
      setCurrentStep('company');
    } catch (err) {
      console.error('Profile save error:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyNext = async (data: CompanyData) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const newId = await saveCompany(user.id, data);
      setCompanyId(newId);
      setCompany(data);
      markDone('company');
      setCurrentStep('interlude');
    } catch (err) {
      console.error('Company save error:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationsComplete = async (
    locations: Array<{ name: string; address: string; status: 'operando' | 'en_preparacion' | 'cerrado' }>
  ) => {
    if (!user || !companyId) return;
    setLoading(true);
    setError(null);
    try {
      let firstLocId: string | null = null;
      let firstLocName = '';
      for (const loc of locations) {
        const id = await saveLocationWithPermits(companyId, loc);
        if (!firstLocId) {
          firstLocId = id;
          firstLocName = loc.name;
        }
      }

      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (updatedProfile) useAuthStore.getState().setProfile(updatedProfile);

      markDone('locations');
      if (firstLocId) {
        setCreatedLocation({ id: firstLocId, name: firstLocName });
        setCurrentStep('handoff');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Locations save error:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar locales');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 'company') setCurrentStep('welcome');
    else if (currentStep === 'preview') setCurrentStep('company');
    else if (currentStep === 'locations') setCurrentStep('preview');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const handleSubmitForm = () => {
    const form = document.querySelector('form');
    if (form) form.requestSubmit();
  };

  // Footer visibility: interlude and handoff own their own CTAs.
  const footerStep = currentStep !== 'interlude' && currentStep !== 'handoff';
  const canGoBack = currentStep === 'company' || currentStep === 'preview' || currentStep === 'locations';
  // 'preview' advances via its own footer "Siguiente" → go to locations (no save).
  const handleFooterNext = () => {
    if (currentStep === 'preview') {
      markDone('company');
      setCurrentStep('locations');
    } else {
      handleSubmitForm();
    }
  };
  const nextLabel = currentStep === 'welcome' ? 'Crear mi empresa'
    : currentStep === 'preview' ? 'Crear mi primera sede'
    : currentStep === 'locations' ? 'Ir a permisos'
    : 'Siguiente';

  const stepperStep: WizardStep = currentStep === 'interlude' ? 'company' : currentStep;

  return (
    <div className="min-h-screen bg-[var(--ds-neutral-50)] flex">
      {/* Sidebar */}
      <div className="w-[280px] bg-white border-r border-[var(--ds-border)] p-[var(--ds-space-300)] flex flex-col shrink-0">
        <div className="flex items-center gap-[var(--ds-space-100)] mb-[var(--ds-space-500)]">
          <div className="w-8 h-8 rounded-[var(--ds-radius-200)] bg-[var(--ds-text)] flex items-center justify-center">
            <span className="text-white font-bold text-[var(--ds-font-size-050)]">ER</span>
          </div>
          <span className="text-[var(--ds-font-size-200)] font-semibold text-[var(--ds-text)] tracking-tight">
            EnRegla
          </span>
        </div>
        <ProgressStepper currentStep={stepperStep} completedSteps={completedSteps} />
        <div className="mt-auto pt-[var(--ds-space-300)]">
          <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtlest)] leading-relaxed">
            Configura tu empresa paso a paso. Cada paso se guarda automáticamente.
          </p>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-start justify-center overflow-y-auto py-[var(--ds-space-600)] px-[var(--ds-space-400)]">
          <div className="w-full max-w-2xl">
            {currentStep === 'welcome' && (
              <WelcomeStep initialName={savedName} onNext={handleWelcomeNext} loading={loading} />
            )}
            {currentStep === 'company' && (
              <CompanyStep initialData={company ?? undefined} onNext={handleCompanyNext} loading={loading} />
            )}
            {currentStep === 'interlude' && (
              <StepInterlude
                title={`¡Genial! Bienvenido a EnRegla${company?.name ? `, ${company.name}` : ''} 🎉`}
                subtitle="Tu empresa quedó registrada. Ahora te mostramos qué permisos vas a necesitar."
                ctaLabel="Ver mis permisos →"
                onContinue={() => setCurrentStep('preview')}
              />
            )}
            {currentStep === 'preview' && (
              <PermitPreviewStep businessType={company?.business_type ?? 'otro'} />
            )}
            {currentStep === 'locations' && (
              <LocationsStep onComplete={handleLocationsComplete} loading={loading} />
            )}
            {currentStep === 'handoff' && companyId && createdLocation && (
              <PermitHandoffStep
                companyId={companyId}
                locationId={createdLocation.id}
                locationName={createdLocation.name}
                businessType={company?.business_type ?? 'otro'}
                leadInfo={{
                  nombre: savedName,
                  email: user?.email ?? '',
                  negocio: company?.name ?? '',
                  ciudad: company?.city,
                }}
                onGoToDashboard={() => navigate('/')}
              />
            )}

            {error && (
              <div className="mt-[var(--ds-space-300)]">
                <Banner variant="error" title="Error">{error}</Banner>
              </div>
            )}
          </div>
        </div>

        {footerStep && (
          <div className="border-t border-[var(--ds-border)] px-[var(--ds-space-400)] py-[var(--ds-space-200)] flex items-center justify-between bg-white/80 backdrop-blur-xl">
            {canGoBack ? (
              <Button variant="ghost" onClick={handleBack} disabled={loading}>Atrás</Button>
            ) : (
              <Button variant="ghost" onClick={handleSignOut} disabled={loading}>Cerrar sesión</Button>
            )}
            <Button onClick={handleFooterNext} disabled={loading} loading={loading}>
              {nextLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
```

> Note: the `interlude` and `handoff` steps hide the footer (they own their CTAs). The `preview` step's footer "Crear mi primera sede" advances without a DB write. `LocationsStep`'s footer button label here is "Ir a permisos" but it triggers `requestSubmit()` on the LocationsStep form, which calls `handleLocationsComplete`.

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b config/tsconfig.json`
Expected: errors only in `App.tsx` (initialStep type) — fixed in Task 13. No errors inside the wizard.

- [ ] **Step 3: Run existing onboarding-adjacent tests**

Run: `npx vitest run --config config/vitest.config.ts src/lib/__tests__/business-types.test.ts`
Expected: PASS (regression guard for business_type whitelist still green).

- [ ] **Step 4: Commit**

```bash
git add src/features/onboarding-incremental/IncrementalWizard.tsx
git commit -m "feat(onboarding): coach flow — welcome, interlude, preview, handoff"
```

---

### Task 13: Update `App.tsx` routing

**Files:**
- Modify: `src/App.tsx:41-60`

**Interfaces:**
- Consumes: `IncrementalWizard` with `initialStep: WizardStep`.
- Produces: `OnboardingRoute` maps profile state → `'welcome' | 'company' | 'preview'`.

- [ ] **Step 1: Edit `OnboardingRoute`**

Replace the body of `OnboardingRoute` (lines 41-60) with:

```tsx
function OnboardingRoute() {
  const { profile, loading } = useAuth();

  if (loading) {
    return <AppLoader />;
  }

  // Map persisted state → first incomplete coach step.
  // welcome → company → preview → locations (handoff is reached inline after saving a sede).
  let initialStep: 'welcome' | 'company' | 'preview' = 'welcome';
  if (profile?.full_name && profile?.company_id) {
    initialStep = 'preview';
  } else if (profile?.full_name) {
    initialStep = 'company';
  } else {
    initialStep = 'welcome';
  }

  return <IncrementalWizard initialStep={initialStep} />;
}
```

> The has-locations → dashboard redirect is handled by `ProtectedOnboardingRoute` / the company guard (unchanged): a user who already has a `company_id` AND locations is redirected away from `/onboarding` before reaching this component. A user with `company_id` but no locations resumes at `preview` (re-teach, then locations). This matches the spec's resume table.

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b config/tsconfig.json`
Expected: no errors across the project.

- [ ] **Step 3: Full test run**

Run: `npx vitest run --config config/vitest.config.ts`
Expected: all tests PASS (including the 3 new test files).

- [ ] **Step 4: Lint**

Run: `npx eslint . --config config/eslint.config.js src/features/onboarding-incremental src/lib/whatsapp.ts src/lib/api/onboarding.ts`
Expected: no errors (warnings acceptable if pre-existing pattern).

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat(onboarding): routing mapea estado de perfil a pasos del coach flow"
```

---

### Task 14: Manual smoke test + cleanup of dead `ProfileStep`

**Files:**
- Modify (delete if now unused): `src/features/onboarding-incremental/steps/ProfileStep.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: confirmed working end-to-end flow.

- [ ] **Step 1: Check whether `ProfileStep` is still referenced**

Run: `grep -rn "ProfileStep" src/`
Expected: only its own definition file (the wizard now uses `WelcomeStep`). If so, it's safe to delete. If anything else imports it, leave it.

- [ ] **Step 2: Delete the orphan (only if grep shows no other importers)**

```bash
git rm src/features/onboarding-incremental/steps/ProfileStep.tsx
```

- [ ] **Step 3: Start dev server and smoke test the full flow**

Run: `npm run dev` (Vite). In the browser, with a fresh/test account (no company):
- [ ] Welcome greets with the Google name; "Crear mi empresa" advances.
- [ ] Company form saves; celebration interlude shows company name.
- [ ] Preview lists permits for the chosen business_type (try `restaurante` and `otro`).
- [ ] "Crear mi primera sede" → Locations; create one sede.
- [ ] Handoff lists real permits; "Subir" opens inline `PermitUploadForm`; uploading flips the card to Vigente.
- [ ] "No lo tengo" shows legal info + gov portal link; "Enviar solicitud" creates a lead.
- [ ] "Ir al Dashboard" navigates to `/`.

- [ ] **Step 4: Verify the lead landed (behavior, not shape)**

Use `mcp__supabase__execute_sql`:
```sql
SELECT id, nombre, email, source, status, notas, created_at
FROM leads WHERE source = 'onboarding' ORDER BY created_at DESC LIMIT 3;
```
Expected: the lead created in Step 3 appears with `source='onboarding'`, `status='nuevo'`, permit slug in `notas`. (Delete test rows afterward.)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(onboarding): smoke test ok, eliminar ProfileStep huérfano"
```

---

## Self-Review

**Spec coverage:**
- Welcome/framing → Task 6 (WelcomeStep) + Task 12 (wiring). ✓
- Permit-education moment from `permit_requirements` → Task 7. ✓
- Celebration interludes (Coach completo) → Task 5 + Task 12. ✓
- Handoff: inline upload → Task 9 (PermitUploadForm reuse) + Task 10. ✓
- Handoff: legal info + gov portal → Task 9 (useLegalReferences). ✓
- Handoff: "lo sacamos por ti" lead + optional phone + WhatsApp → Task 3, 4, 8. ✓
- Migration extend leads.source → Task 1; type → Task 2. ✓
- Non-blocking "Ir al Dashboard"; returning users skip → Task 10, 13. ✓
- Resume from DB-derived step → Task 13. ✓
- 3-milestone stepper → Task 11. ✓

**Placeholder scan:** No TBD/TODO; every code step shows full code; commands have expected output. ✓

**Type consistency:** `WizardStep` union defined in Task 11, consumed in Tasks 12-13. `createPermitServiceLead`/`buildPermitServiceLead` signatures match between Tasks 4 and 8. `updatePermit` signature copied verbatim from `PermitUploadForm` across Tasks 9-10-12. `usePermits({ companyId, locationId })` and its `{ permits, loading, updatePermit, refetch }` return match `src/hooks/usePermits.ts`. ✓

**Known soft spots flagged inline for the implementer:** icon-name existence checks (`PartyPopper`/`FileCheck`/`ShieldAlert` with confirmed fallbacks), and the `Permit` type bridge between `usePermits` and `@/types/database` (`as any` guards with a note to drop them if tsc is happy).
