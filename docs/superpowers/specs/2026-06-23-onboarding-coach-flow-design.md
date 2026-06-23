# Onboarding Coach Flow — Design Spec

**Date:** 2026-06-23
**Status:** Draft (awaiting user review)
**Author:** Claude + Danilo
**Branch:** `feat/onboarding-coach-flow`

---

## Problem Statement

The current onboarding (`IncrementalWizard`, 3 steps: Perfil → Empresa → Sedes) works
and persists incrementally, but it reads as a **dry data-entry form**. It dumps the user
straight into "fill these fields" with no framing, no education, and no closure. The user
never learns *why* they're here or *what they just unlocked*.

The founder wants onboarding to feel like a **guided coach** that walks a brand-new account
through the value, in their words:

> "Hola, tienes que primero crear tu empresa. Crea tu empresa. Perfecto, bienvenido a
> EnRegla. Luego crea tu primera sede. Perfecto. Explícame qué tipo de empresa eres.
> Perfecto, para este tipo de empresas sabemos que necesitas estos permisos. Luego de que
> creaste tu sede, recuerda subir estos permisos. Si los tienes a la mano, súbelos. Si no,
> recuerda sacarlos. Te dejamos información legal o contáctanos y los sacamos por ti."

Three concrete gaps vs. today:

1. **No framing / welcome** — the flow starts cold at a name field.
2. **No permit-education moment** — the app *knows* which permits a `business_type` needs
   (DB `permit_requirements`) but never shows the user. The "para este tipo de negocio
   necesitas estos permisos" teaching moment doesn't exist.
3. **No closure / handoff** — after the sede is created and permits auto-generate, the user
   is dropped on the dashboard with zero guidance on what to do with those permits.

---

## Solution: A Coach-Style Wizard (same engine, new skin + 3 screens)

We **keep the existing persistence engine** (per-step DB writes, resumability, the
`saveProfile` / `saveCompany` / `saveLocationWithPermits` API, the permit auto-generation
trigger) and reframe the experience into a guided coach with celebration interludes and
two new content screens.

### Why not rebuild

- DB writes, RLS, the permit-generation trigger, and resume logic all work today. Touching
  them is risk with no upside.
- The two new "content" screens (permit preview, permit handoff) are **derived from data
  that already exists** (`permit_requirements`, `legal_references`, generated `permits`).
  They need **no new persistence** → they're resumable for free.
- Inline upload reuses `PermitUploadForm`. Lead capture reuses the `leads` table and the
  `wa.me` WhatsApp pattern already shipped in `PaywallView`.

The only new infra is a **one-line migration** (extend a CHECK constraint) and **one API
function** (insert a lead).

---

## Screen Flow

```
┌─────────────┐   ┌─────────────┐   ┌──────────────────┐   ┌────────────┐   ┌──────────────────────┐
│ 0. Bienvenida│→ │ 1. Tu empresa│→ │ 2. Permisos que   │→ │ 3. Tu sede │→ │ 4. Súbelos o sácalos  │→ Dashboard
│  (welcome +  │   │  (CompanyStep)│   │   vas a necesitar │   │(LocationsStep)│   │  (handoff)           │
│   full_name) │   │      ↓        │   │   (preview)       │   │      ↓        │   │  upload / legal /     │
│              │   │  🎉 interlude │   │                   │   │  permits auto │   │  contáctanos          │
└─────────────┘   └─────────────┘   └──────────────────┘   │  generan       │   └──────────────────────┘
                                                             └────────────┘
```

The progress stepper shows **3 user-facing milestones** — *Empresa · Sede · Permisos* — so
the user perceives 3 steps, not 5 screens. Welcome is pre-step framing; interludes and the
preview are transitions, not "work."

---

## Screen Details

### Screen 0 — Bienvenida (NEW: `WelcomeStep.tsx`)

**Replaces** the bare "Perfil" step. Shown when `profile.full_name` is empty.

- Greets using the Google OAuth name if present (`user.user_metadata.full_name`).
- Copy: *"Hola 👋 Bienvenido a EnRegla. Vamos a dejar tu negocio en regla en 3 pasos
  rápidos. Lo primero: creá tu empresa."*
- One field: confirm/edit **nombre completo** (pre-filled from Google).
- CTA: **Crear mi empresa →**
- **On submit:** `saveProfile(user.id, fullName)` → advance to Company. (Unchanged API.)

### Screen 1 — Tu empresa (EXISTING: `CompanyStep.tsx`, unchanged form)

- Fields: nombre, RUC (13 díg.), ciudad, **tipo de negocio**.
- `business_type` chosen here drives screens 2 and 4.
- **On submit:** `saveCompany(...)` (RPC `create_company_for_user`) → show **interlude**.

**Interlude (NEW: `StepInterlude.tsx`):** full-screen celebration,
*"¡Genial! Bienvenido a EnRegla, {empresa} 🎉"*, auto-advances on CTA *Continuar →* to the
permit preview. (Coach-completo flourish; pure presentation, no persistence.)

### Screen 2 — Permisos que vas a necesitar (NEW: `PermitPreviewStep.tsx`)

The education moment. **Read-only.** Driven by `usePermitRequirements(business_type)`.

- Copy: *"Para un {businessTypeLabel} sabemos que vas a necesitar estos permisos. Todavía
  no tenés que hacer nada — primero creemos tu sede."*
- Renders a `PermitRequirementCard` per requirement:
  - Permit name (`permitTypeLabel`), emisor (`issuer`)
  - **Obligatorio** badge when `is_mandatory`
  - Costo estimado (`cost_min`–`cost_max cost_currency`) when present
  - Multa por no tenerlo (`fine_min`–`fine_max`) when present — reinforces stakes
  - `applies_when` note when present
- Empty/unknown `business_type` (`otro`): show a soft fallback ("Generaremos los permisos
  base: RUC, patente municipal…") and continue.
- CTA: **Crear mi primera sede →** (advances to LocationsStep).

### Screen 3 — Tu primera sede (EXISTING: `LocationsStep.tsx`)

- Keep the existing multi-sede form (paste-from-Excel, duplicate, etc.).
- Coach copy nudges the single-sede happy path: *"Empezá con una sede. Podés agregar más
  ahora o después."*
- **On submit:** `saveLocationWithPermits(...)` per sede → DB trigger
  `auto_create_location_permits` generates the permits → advance to **handoff** (instead of
  navigating to dashboard).

### Screen 4 — Tus permisos: súbelos o sácalos (NEW: `PermitHandoffStep.tsx`)

The closure. Lists the **real generated permits** via `getLocationPermits(locationId)` (for
the first/primary sede created; multi-sede users see the first sede's permits with a note +
dashboard link for the rest — keeps the screen focused).

- Copy: *"¡Tu sede {name} está lista! Estos son los permisos que necesitás. Si los tenés a
  la mano, subilos ahora. Si no, te decimos cómo sacarlos."*
- Per permit → `PermitHandoffCard`:
  - **Status chip** (no_registrado / vigente / vencido) reflecting current state.
  - **Subir** → expands inline `PermitUploadForm` (existing component, takes the real
    `Permit`). On success the card flips to *vigente* with a ✓. **This is the inline upload
    the founder asked for** — no navigation, reusing shipped upload logic.
  - **No lo tengo / Sacarlo** → expands a legal panel from
    `useLegalReferences(business_type)` matched by `permit_type`:
    - `description`, `frequency_basis`, `estimated_cost`, `disclaimer`
    - **Link al portal del gobierno** (`government_portal_url` / `government_portal_name`)
    - **"Contáctanos y lo sacamos por ti"** → opens `GetItForYouForm`.
- Footer: **Ir al Dashboard** — always enabled. Onboarding is **non-blocking**; the user can
  leave with zero permits uploaded and finish later (dashboard `OnboardingChecklist` already
  nudges them).

#### GetItForYouForm (NEW)

Lead capture for the "we do it for you" service.

- Pre-filled (read-only-ish): **nombre** + **email** from the Google session
  (`user.email`, `profile.full_name`).
- Optional: **teléfono** (the only field the user types).
- Context auto-attached: `negocio` = company name, `ciudad`, the specific `permit_type`
  requested (in `notas`).
- **Primary action:** `createPermitServiceLead()` → inserts a `leads` row
  (`source = 'onboarding'`, `status = 'nuevo'`). Success state: *"Listo, recibimos tu
  solicitud. Te contactamos pronto."* The lead surfaces in the existing internal CRM
  (`LeadsTable`) — no new dashboard needed.
- **Secondary action:** **WhatsApp directo** → `wa.me` deep link with a pre-filled message
  (reuses the `VITE_WHATSAPP_NUMBER` env + builder pattern from `PaywallView`). Shown only
  when the env var is set.

---

## Data & Infra Changes

### Migration (NEW, small)

`leads.source` CHECK currently allows `('diagnostico','partners','home','sobre','otro')`.
Add `'onboarding'` so onboarding service requests are attributable in the CRM:

```sql
ALTER TABLE leads DROP CONSTRAINT leads_source_check;
ALTER TABLE leads ADD CONSTRAINT leads_source_check
  CHECK (source IN ('diagnostico','partners','home','sobre','otro','onboarding'));
```

RLS already allows authenticated INSERT (`"Anyone can insert leads" WITH CHECK (true)`), so
no policy change. (Verify behavior, not shape: smoke-test an insert as `authenticated`.)

### API (NEW)

`src/lib/api/onboarding.ts`:

```ts
export async function createPermitServiceLead(input: {
  nombre: string;
  email: string;
  telefono?: string;
  negocio: string;       // company name
  ciudad?: string;
  permitType: string;    // → notas
}): Promise<void>
```

Inserts into `leads` with `source: 'onboarding'`, `status: 'nuevo'`,
`notas: 'Solicitud "lo sacamos por ti" — permiso: {permitType} (onboarding)'`.

> **Staff notification:** out of scope for v1. The lead row + internal CRM is the source of
> truth. A Resend email-to-staff hook can be added later (mirrors `send-expiry-alerts`) if
> the CRM glance isn't enough.

### Reused, unchanged

- `usePermitRequirements`, `useLegalReferences`, `permitTypeLabel`, `businessTypeLabel`
- `PermitUploadForm`, `uploadPermitDocument`
- `getLocationPermits`
- `wa.me` builder pattern (extract a tiny shared `buildWhatsappUrl` helper from
  `PaywallView` into `src/lib/whatsapp.ts` so both call sites share it — surgical, on-path)

---

## Component Structure

```
src/features/onboarding-incremental/
  IncrementalWizard.tsx          # MODIFIED: new substep machine + interludes
  Stepper.tsx                    # MODIFIED: 3 milestones (Empresa·Sede·Permisos)
  components/
    ProgressStepper.tsx          # MODIFIED: same 3 milestones
    StepInterlude.tsx            # NEW: celebration transition
    PermitRequirementCard.tsx    # NEW: preview row (read-only)
    PermitHandoffCard.tsx        # NEW: handoff row (upload + legal + contact)
    GetItForYouForm.tsx          # NEW: lead capture + WhatsApp
  steps/
    WelcomeStep.tsx              # NEW: greeting + full_name
    CompanyStep.tsx              # unchanged
    LocationsStep.tsx            # ~unchanged (copy nudge only)
    PermitPreviewStep.tsx        # NEW
    PermitHandoffStep.tsx        # NEW
src/lib/
  whatsapp.ts                    # NEW: shared buildWhatsappUrl (extracted from PaywallView)
  api/onboarding.ts              # MODIFIED: + createPermitServiceLead
supabase/migrations/
  <ts>_leads_source_onboarding.sql   # NEW: extend CHECK
```

### Wizard substep machine

The wizard owns an internal step enum (route stays `/onboarding`):

```
welcome → company → (interlude) → preview → locations → handoff → navigate('/')
```

`IncrementalWizard` already tracks `currentStep` + `completedSteps`; we extend the enum and
the transition handlers. `companyId` and the created `locationId` are held in wizard state
(locationId is new — captured from `saveLocationWithPermits` return) to drive the handoff
query.

### Resume logic (`App.tsx` `OnboardingRoute`)

Unchanged routing contract — still derives `initialStep` from `profile.full_name` /
`profile.company_id` / has-locations. New mapping:

- no `full_name` → `welcome`
- `full_name`, no `company_id` → `company`
- `company_id`, no locations → `preview` (re-teach, then locations)
- `company_id` + has locations → skip onboarding (→ dashboard). Handoff is only reached
  inline right after creating the sede in-session; returning users who already have a sede
  go straight to the dashboard (where `OnboardingChecklist` covers permit follow-up). This
  keeps handoff from blocking re-entry.

---

## User Flow (success + branches)

See the HTML companion for the rendered diagram. Summary:

- **Entry:** new account logs in (Google) → no company → `/onboarding`.
- **Welcome:** confirm name → Company.
- **Company:** save → 🎉 interlude → Preview (educate) → Locations.
- **Locations:** save sede → permits auto-generate → Handoff.
- **Handoff — three user choices per permit:**
  - *Tengo el documento* → inline upload → permit vigente.
  - *No lo tengo* → legal info + gov portal link (self-serve).
  - *Que lo saquen por mí* → lead captured (+ optional phone) **or** WhatsApp direct.
- **Exit:** *Ir al Dashboard* anytime (non-blocking). Returning users skip onboarding.
- **Resume:** close browser mid-flow → next login resumes at first incomplete milestone
  (derived from DB, no draft storage).

---

## Error Handling

- Per-step save failures keep the existing pattern: red `Banner`, form stays filled, retry.
- Preview / handoff data fetches (`usePermitRequirements`, `useLegalReferences`,
  `getLocationPermits`): on error or empty, degrade gracefully — show a short "no pudimos
  cargar los permisos, podés verlos en el dashboard" with the dashboard CTA. Never trap the
  user in onboarding.
- Inline upload errors surface inside `PermitUploadForm` (existing behavior).
- Lead insert failure: inline error in `GetItForYouForm` + WhatsApp fallback still works
  (it's a static link).

---

## Testing Checklist

**Happy path**
- [ ] New account → Welcome greets with Google name → save → Company.
- [ ] Company saved → interlude shows company name → Preview.
- [ ] Preview lists the correct permits for the chosen `business_type` (matches DB
      `permit_requirements`).
- [ ] Create 1 sede → Handoff lists the real generated permits for that sede.
- [ ] Inline upload a PDF on a permit → card flips to *vigente*.
- [ ] "No lo tengo" → legal panel shows description + gov portal link.
- [ ] "Lo sacamos por ti" → submit → lead row created with `source='onboarding'`, visible in
      internal CRM; success message shown.
- [ ] WhatsApp button opens `wa.me` with prefilled text (when env set); hidden when unset.
- [ ] *Ir al Dashboard* works at any point.

**Branches / edge**
- [ ] `business_type = 'otro'` → preview shows base-permits fallback, flow continues.
- [ ] Multi-sede: handoff shows first sede's permits + note/link for the rest.
- [ ] Phone left blank → lead still submits (telefono nullable).
- [ ] Close browser at Preview → re-login resumes at Preview/Locations (derived).
- [ ] Returning user with a sede → goes straight to dashboard (no handoff trap).
- [ ] `permit_requirements` empty for a type → graceful fallback, no crash.

**Security (verify behavior, not shape)**
- [ ] `SET ROLE authenticated` → lead INSERT with `source='onboarding'` succeeds.
- [ ] `SET ROLE authenticated` → cannot read another company's permits in handoff query.
- [ ] Dev-server smoke test of the full flow before declaring GO.

---

## Out of Scope (YAGNI)

- Staff email notification on lead (CRM row suffices for v1).
- Multi-sede handoff aggregation (first sede + dashboard link is enough).
- Editing/deleting permits from the handoff screen (dashboard owns that).
- A/B keeping the old wizard — we modify in place; old screens are reused, not duplicated.
- Draft-to-localStorage (DB-derived resume already covers it).

---

## Success Criteria

✅ New account is greeted, framed, and walked through Empresa → Sede → Permisos as a coach.
✅ The user sees, before creating a sede, which permits their `business_type` requires (with
   cost/fine stakes), sourced from the DB.
✅ After the sede is created, the user can **upload a permit inline** or get **legal info +
   gov portal link**, or **request "lo sacamos por ti"** (lead captured + optional phone +
   WhatsApp direct).
✅ Onboarding never blocks: *Ir al Dashboard* is always available; returning users skip it.
✅ Only new infra is one CHECK-constraint migration + one lead-insert API fn; everything else
   reuses shipped components.

---

## Approval

**Status:** awaiting user review.
**Next step on approval:** invoke `writing-plans` to produce the implementation plan.
