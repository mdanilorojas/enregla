# Incremental Onboarding System - Design Spec

**Date:** 2026-04-14  
**Status:** Approved  
**Author:** Claude + User

---

## Problem Statement

The current onboarding wizard uses an all-or-nothing approach: it collects company info, regulatory factors, and locations, then creates everything in a single transaction at the end. This causes several issues:

1. **Progress loss:** If any step fails (RLS policy, validation, network), user loses all progress
2. **RLS complexity:** A single transaction creating company + locations + permits requires complex permission logic
3. **Poor UX:** Can't pause and resume; must complete in one sitting
4. **Debugging difficulty:** Hard to isolate which part failed when the transaction rolls back

**User's observation:** "After logging in, the flow should create the company during the process to avoid this problem. Divide into scaffolds - one step is create my company and finish it, then create locations, then jump to dashboard."

---

## Solution: Multi-Step Persistence

Each onboarding step saves to the database **immediately** when the user clicks "Next":

```
Step 1: Profile (save full_name) →
Step 2: Company (save company + update profile.company_id) →
Step 3: Locations (save each location + auto-generate permits) →
Dashboard ✅
```

### Key Principles

- **Incremental saves:** Database writes happen after each step, not at the end
- **Resumable:** User can close browser and resume from where they left off
- **Editable:** "Back" button allows editing previous steps
- **Per-location permits:** Each location has its own regulatory factors, permits auto-generate when location is saved

---

## User Flow

### Decision Flow

```
User logs in
    ↓
Has profile.full_name? 
    NO → Show Step 1: Profile
    YES ↓
Has profile.company_id?
    NO → Show Step 2: Company  
    YES ↓
Has any locations for company?
    NO → Show Step 3: Locations
    YES ↓
Dashboard ✅
```

### Step Details

#### **Step 1: Profile Setup**

**Shown when:** `profile.full_name` is null/empty

**Collects:**
- Full name (required)

**On "Next":**
```typescript
await supabase
  .from('profiles')
  .update({ 
    full_name: formData.fullName,
    role: 'admin' // Default for first user
  })
  .eq('id', user.id)
```

**Success:** Navigate to Step 2

---

#### **Step 2: Company Setup**

**Shown when:** `profile.company_id` is null

**Collects:**
- Company name (required)
- RUC (13 digits, required, numeric only)
- City (dropdown: Quito, Guayaquil, Cuenca, etc.)
- Business type (dropdown: Supermercado, Farmacia, Restaurante, etc.)

**On "Next":**
```typescript
// 1. Create company
const { data: company } = await supabase
  .from('companies')
  .insert({
    name: formData.name,
    ruc: formData.ruc,
    city: formData.city,
    business_type: formData.businessType,
    location_count: 0
  })
  .select()
  .single()

// 2. Link company to profile
await supabase
  .from('profiles')
  .update({ company_id: company.id })
  .eq('id', user.id)
```

**Success:** Navigate to Step 3

---

#### **Step 3: Locations Setup**

**Shown when:** User has `company_id` but no locations

**Collects (repeatable):**
- Location name (required)
- Address (required)
- Status (dropdown: operando, en_preparacion, cerrado)
- **Regulatory factors per location:**
  - ☐ Vende alimentos → generates ARCSA permit
  - ☐ Vende alcohol → generates SCPM permit
  - ☐ Servicios de salud → generates MSP permit
  - ☐ Maneja químicos → generates CONSEP permit

**UI Features:**
- "Agregar otra sede" button
- Can add multiple locations
- Each location card shows its regulatory checkboxes
- Require at least 1 location to proceed

**On "Ir al Dashboard":**
```typescript
for (const locationData of locations) {
  // 1. Create location
  const { data: location } = await supabase
    .from('locations')
    .insert({
      company_id: profile.company_id,
      name: locationData.name,
      address: locationData.address,
      status: locationData.status,
      risk_level: 'medio'
    })
    .select()
    .single()

  // 2. Build permit list based on regulatory factors
  const permits = []
  
  // Base permits (always)
  permits.push(
    { type: 'Patente Municipal', issuer: 'Municipio' },
    { type: 'RUC', issuer: 'SRI' }
  )
  
  // Conditional permits
  if (locationData.regulatory.alimentos) {
    permits.push({ type: 'Permiso Sanitario (ARCSA)', issuer: 'ARCSA' })
  }
  if (locationData.regulatory.alcohol) {
    permits.push({ type: 'Permiso de Alcohol (SCPM)', issuer: 'SCPM' })
  }
  if (locationData.regulatory.salud) {
    permits.push({ type: 'Permiso de Salud (MSP)', issuer: 'MSP' })
  }
  if (locationData.regulatory.quimicos) {
    permits.push({ type: 'Permiso Químicos (CONSEP)', issuer: 'CONSEP' })
  }

  // 3. Insert permits
  await supabase.from('permits').insert(
    permits.map(p => ({
      company_id: profile.company_id,
      location_id: location.id,
      type: p.type,
      issuer: p.issuer,
      status: 'no_registrado',
      is_active: true,
      version: 1
    }))
  )
}
```

**Success:** Navigate to `/` (dashboard)

---

## Wizard UI Design

### Progress Indicator

```
[✓] Tu perfil  →  [✓] Tu empresa  →  [ ] Sedes  →  Dashboard
```

**States:**
- ✓ Completed: Green checkmark, completed step
- Current: Highlighted with colored background
- Future: Gray text, not yet accessible

### Navigation

**"Atrás" Button:**
- Available on Steps 2 and 3
- Loads data from database for previous step
- Allows editing (update operation, not insert)

**"Siguiente" Button:**
- Steps 1-2: "Siguiente"
- Step 3: "Ir al Dashboard"
- Validates form before saving
- Shows loading spinner during save
- On error: stays on current step, shows error message

### Layout

Reuse current `OnboardingWizard.tsx` structure:
- Left sidebar: Progress steps + logo
- Main area: Current step form
- Footer: Back/Next buttons

---

## Data Model

**No schema changes needed!** Existing tables already support incremental flow:

### profiles
```sql
id           UUID PRIMARY KEY
company_id   UUID REFERENCES companies(id) -- CAN BE NULL initially
full_name    TEXT                          -- Filled in Step 1
role         TEXT                          -- Defaults to 'admin'
```

### companies
```sql
id              UUID PRIMARY KEY
name            TEXT
ruc             TEXT
city            TEXT
business_type   TEXT
location_count  INTEGER
```

### locations
```sql
id          UUID PRIMARY KEY
company_id  UUID REFERENCES companies(id) -- FK enforces company must exist
name        TEXT
address     TEXT
status      TEXT
risk_level  TEXT
```

### permits
```sql
id           UUID PRIMARY KEY
company_id   UUID REFERENCES companies(id)
location_id  UUID REFERENCES locations(id)
type         TEXT
issuer       TEXT
status       TEXT -- Starts as 'no_registrado'
is_active    BOOLEAN
version      INTEGER
```

---

## API Functions

### New Functions (in `src/lib/api/onboarding.ts`)

```typescript
// Step 1: Profile
export async function saveProfile(
  userId: string, 
  fullName: string
): Promise<void>

// Step 2: Company
export async function saveCompany(
  userId: string,
  companyData: {
    name: string
    ruc: string
    city: string
    business_type: string
  }
): Promise<Company>

// Step 3: Locations
export async function saveLocationWithPermits(
  companyId: string,
  locationData: {
    name: string
    address: string
    status: 'operando' | 'en_preparacion' | 'cerrado'
    regulatory: {
      alimentos: boolean
      alcohol: boolean
      salud: boolean
      quimicos: boolean
    }
  }
): Promise<Location>

// Routing helper
export async function checkHasLocations(
  companyId: string
): Promise<boolean>
```

### Modified Functions

**`completeOnboarding`** - Keep for reference but mark as deprecated. New flow uses per-step functions.

**`generateInitialPermits`** - Refactor to accept single location + regulatory factors (not batch).

---

## Routing Logic

### In `App.tsx`

```typescript
function OnboardingRoute() {
  const { user, profile, loading } = useAuth()
  const [step, setStep] = useState<'profile' | 'company' | 'locations' | 'complete'>('profile')
  const [hasLocations, setHasLocations] = useState(false)

  useEffect(() => {
    if (!profile) return
    
    // Determine step
    if (!profile.full_name) {
      setStep('profile')
    } else if (!profile.company_id) {
      setStep('company')
    } else {
      // Check if has locations
      checkHasLocations(profile.company_id).then(hasLocs => {
        setHasLocations(hasLocs)
        setStep(hasLocs ? 'complete' : 'locations')
      })
    }
  }, [profile])

  if (loading) return <LoadingSpinner />
  if (step === 'complete' && hasLocations) {
    return <Navigate to="/" replace />
  }

  return <IncrementalOnboardingWizard initialStep={step} />
}
```

---

## Component Structure

### New Files

```
src/features-v2/onboarding-incremental/
  IncrementalWizard.tsx              # Main wizard with stepper
  steps/
    ProfileStep.tsx                   # Step 1
    CompanyStep.tsx                   # Step 2  
    LocationsStep.tsx                 # Step 3 (reuse form cards from current)
  components/
    ProgressStepper.tsx               # Visual progress indicator
```

### Component Hierarchy

```
<IncrementalWizard>
  <ProgressStepper currentStep={step} completedSteps={[...]} />
  
  {step === 'profile' && <ProfileStep onNext={handleProfileSave} />}
  {step === 'company' && <CompanyStep onNext={handleCompanySave} onBack={handleBack} />}
  {step === 'locations' && <LocationsStep onComplete={handleLocationsSave} onBack={handleBack} />}
</IncrementalWizard>
```

---

## Error Handling

### Save Failures

**If database write fails:**
1. Catch error, extract user-friendly message
2. Display error above form (red banner)
3. Keep form filled with user's data
4. Allow retry (user can fix and click "Next" again)
5. Log error to console for debugging

**Example error messages:**
- "Ya existe una empresa con ese RUC" (duplicate RUC)
- "Error al guardar. Por favor intenta de nuevo."
- "No se pudo conectar con el servidor."

### Resume Flow

**If user closes browser mid-onboarding:**
1. Next login triggers `useAuth` → loads profile
2. `OnboardingRoute` checks completion state
3. Wizard shows from first incomplete step
4. Previous steps show green checkmarks
5. User continues where they left off

---

## Testing Checklist

### Happy Path
- [ ] New user logs in → sees Profile step
- [ ] Fill name, click "Next" → saves profile, shows Company step
- [ ] Fill company, click "Next" → saves company, shows Locations step
- [ ] Add 1 location with "alimentos" checked → creates location + ARCSA permit
- [ ] Click "Ir al Dashboard" → navigates to `/`, dashboard loads

### Navigation
- [ ] From Company step, click "Atrás" → shows Profile step with name pre-filled
- [ ] Edit name, click "Next" → updates profile (not creates duplicate)
- [ ] From Locations step, click "Atrás" → shows Company step with data pre-filled

### Edge Cases
- [ ] Add 2 locations with different regulatory factors → each gets correct permits
- [ ] Leave location name empty → "Next" button disabled
- [ ] Enter 12-digit RUC → validation error, can't proceed
- [ ] Close browser at Company step → reopen, resume from Company step
- [ ] Complete onboarding → log out → log in → goes straight to dashboard

### Permits Auto-Generation
- [ ] Location with no regulatory boxes → gets 2 base permits (Patente, RUC)
- [ ] Location with "alimentos" → gets 3 permits (base + ARCSA)
- [ ] Location with "alcohol" + "salud" → gets 4 permits (base + SCPM + MSP)
- [ ] Location with all boxes → gets 6 permits

### Existing Users
- [ ] User with company already → skips to dashboard
- [ ] User with profile but no company → starts at Company step

---

## RLS Requirements

For this flow to work with RLS enabled, policies must allow:

```sql
-- Profiles: users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Companies: authenticated users can create companies
CREATE POLICY "Authenticated users can create companies"
  ON companies FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Companies: users can view companies they own
CREATE POLICY "Users can view own company"
  ON companies FOR SELECT
  USING (id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Locations: users can create locations for their company
CREATE POLICY "Users can create locations for own company"
  ON locations FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Permits: users can create permits for their company
CREATE POLICY "Users can create permits for own company"
  ON permits FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));
```

**Note:** Currently RLS is disabled for development. Re-enable before production with above policies.

---

## Migration Strategy

### Existing Users
- **Already completed onboarding:** No impact, they skip straight to dashboard ✅
- **No onboarding yet:** They'll use new incremental flow ✅

### Code Migration
- Keep old `OnboardingWizard.tsx` for v1 users
- Create new `IncrementalWizard.tsx` for v2 users
- Route based on `UI_VERSION` environment variable
- Once v2 is stable, deprecate v1

### Data Migration
**None needed!** Incremental flow uses same database schema.

---

## Future Enhancements

**Out of scope for this implementation, but noted for future:**

1. **Multi-user companies:** When second user joins, skip Company step (join existing company)
2. **Invite flow:** Admin invites users via email, they skip company setup
3. **Skip locations:** "I'll add locations later" button on Step 3
4. **Batch location import:** CSV upload for companies with many locations
5. **Progress persistence:** Save draft form data to localStorage (in addition to DB saves)

---

## Success Criteria

**Implementation is complete when:**

✅ User can create profile → company → locations in separate steps  
✅ Each step saves to database immediately  
✅ User can navigate back to edit previous steps  
✅ Permits auto-generate per location based on regulatory factors  
✅ User can close browser and resume where they left off  
✅ No duplicate records created when editing previous steps  
✅ Dashboard loads successfully after completing onboarding  
✅ Old onboarding wizard still works for v1 users  

---

## Implementation Notes

### Regulatory Factor Storage

Each location now has its own regulatory factors. Options:

**A) Store in locations table** (add JSONB column `regulatory_factors`)
**B) Store in separate table** (`location_regulatory_factors`)
**C) Infer from permits** (check which permit types exist)

**Decision:** Option C (infer from permits). No schema changes needed. If location has ARCSA permit, we know it deals with food.

### Company `location_count` Field

Currently updated at end of onboarding. With incremental flow:
- Increment when location is created
- Decrement when location is deleted
- Or: Use database trigger to auto-maintain
- Or: Compute from COUNT query (no stored value)

**Decision:** Update manually in Step 3 after all locations are saved.

---

## Open Questions

**Resolved:**
- ✅ Can user edit previous steps? → Yes, via "Atrás" button
- ✅ Per-location or per-company regulatory factors? → Per-location
- ✅ Save one location at a time or batch? → Batch (user adds multiple, saves all on "Next")
- ✅ Minimum locations required? → Yes, at least 1

---

## Approval

**Approved by:** User  
**Date:** 2026-04-14  
**Next step:** Write implementation plan
