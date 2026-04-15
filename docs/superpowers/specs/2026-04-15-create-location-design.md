# Create Location Feature - Design Specification

**Date:** 2026-04-15  
**Feature:** CREAR SEDE modal with form  
**Version:** V2 (shadcn/ui)  

---

## Overview

Modal with form to create new locations (sedes) in EnRegla system. Integrates with Supabase `locations` table. Follows existing V2 patterns (RenewPermitModal, shadcn/ui components).

---

## User Flow

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
