# Document Upload Flow - Design Specification

**Date:** 2026-04-14  
**Status:** Approved  
**Author:** Claude + User

---

## Executive Summary

Implement the core document upload flow for EnRegla: users upload permit documents directly from the permits grid in LocationDetailView, confirm issue date, and the system automatically calculates expiry dates based on Ecuadorian regulatory law. This is the **core loop** of the product:

> **Document → Vigencia → Vencimiento → Acción**

### Key Decisions

- ✅ **Inline grid expansion** - Upload happens directly in permits table (not modal)
- ✅ **Automatic expiry calculation** - System calculates based on permit type rules, not user-editable
- ✅ **Issue date confirmation** - Defaults to today, but user can adjust if document was issued earlier
- ✅ **Status transitions** - `no_registrado` → `vigente` on successful upload
- ✅ **Technical B2B aesthetic** - Clean, operational, mono font for dates/IDs

---

## Problem Statement

Currently, permits are auto-generated when a location is created (based on regulatory factors), but they remain in `no_registrado` status with no way to upload the actual permit documents. Users need a fast, operational way to:

1. Upload permit documents (PDFs, images)
2. Confirm when the permit was issued
3. See automatically calculated expiry dates (per Ecuadorian law)
4. Have permit status update to `vigente`
5. See document thumbnails/metadata in the grid

Without this flow, the product is incomplete - there's no way to actually manage the documents that drive compliance.

---

## Solution Architecture

### High-Level Flow

```
LocationDetailView
  └─ PermitsTable (existing, enhanced)
      ├─ Permit row: status=no_registrado
      │   └─ Button: "Subir documento"
      │       └─ Click → Row expands
      │           └─ PermitUploadForm (new inline component)
      │               ├─ File upload (drag & drop)
      │               ├─ Issue date picker (default: today)
      │               ├─ Calculated expiry display (read-only)
      │               └─ Save button
      │                   └─ Upload to Supabase Storage
      │                   └─ Update permit record
      │                   └─ Refresh grid
      │
      ├─ Permit row: status=vigente
      │   ├─ Document thumbnail
      │   ├─ Issue/expiry dates (mono font)
      │   └─ "Reemplazar" button → same flow
```

### Directory Structure

**New files:**
```
src/lib/permitRules.ts                    # Expiry calculation logic
src/features-v2/permits/PermitUploadForm.tsx  # Inline upload form
```

**Modified files:**
```
src/features-v2/locations/PermitsTable.tsx    # Add expandable rows
src/features-v2/locations/LocationDetailView.tsx # Integration
src/hooks/usePermits.ts                        # Add refresh after upload
```

**Existing (reused):**
```
src/lib/api/documents.ts                   # uploadPermitDocument() already exists
src/types/database.ts                       # Permit, Document types
```

---

## Data Model

### Permit Schema (existing)

```typescript
{
  id: string;
  company_id: string;
  location_id: string;
  type: string;                    // e.g., "Permiso Sanitario (ARCSA)"
  issuer: string | null;           // e.g., "ARCSA"
  status: 'vigente' | 'por_vencer' | 'vencido' | 'en_tramite' | 'no_registrado';
  permit_number: string | null;
  issue_date: string | null;       // ISO date, user confirms
  expiry_date: string | null;      // ISO date, system calculates
  notes: string | null;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}
```

### Document Schema (existing)

```typescript
{
  id: string;
  permit_id: string;               // FK to permits
  file_path: string;               // Supabase Storage path
  file_name: string;
  file_size: number | null;
  file_type: string | null;
  uploaded_by: string | null;      // User ID
  uploaded_at: string;
}
```

### Permit Duration Rules

Based on `deep-research-report.md`, expiry rules by permit type:

| Permit Type | Duration | Renewal Type | Notes |
|-------------|----------|--------------|-------|
| Permiso Sanitario (ARCSA) | 1 year | Calendar | From issue date + 1 year |
| ARCSA Supermercado/Comisariato | 1 year | Calendar | From issue date + 1 year |
| ARCSA Farmacia | 1 year | Calendar | From issue date + 1 year |
| Permiso de Funcionamiento (ACESS) | 1 year | Calendar | From issue date + 1 year |
| Permiso Anual de Funcionamiento | 1 year | Fiscal | From issue date + 1 year |
| LUAE | Indefinite | Annual renewal | By RUC 9th digit month |
| Bomberos | Until year-end | Year-end | Expires 31-Dec of issue year |
| Licencia Rayos X | 4 years | Calendar | From issue date + 4 years |
| PUCA | 1 year | Annual renewal | January renewal |
| Patente Municipal | 1 year | Calendar | From issue date + 1 year |
| RUC | Indefinite | N/A | No expiry |

---

## Permit Rules Logic

### `src/lib/permitRules.ts`

This new file encapsulates all permit duration/expiry calculation logic:

```typescript
export interface PermitDuration {
  years?: number;
  type: 'calendar' | 'fiscal' | 'year_end' | 'annual_renewal' | 'indefinite';
  renewalMonth?: number | 'byRUC';
}

export const PERMIT_DURATIONS: Record<string, PermitDuration> = {
  'Permiso Sanitario (ARCSA)': { years: 1, type: 'calendar' },
  'ARCSA Supermercado/Comisariato': { years: 1, type: 'calendar' },
  'ARCSA Farmacia': { years: 1, type: 'calendar' },
  'Permiso de Funcionamiento (ACESS)': { years: 1, type: 'calendar' },
  'Permiso Anual de Funcionamiento': { years: 1, type: 'fiscal' },
  'LUAE': { type: 'annual_renewal', renewalMonth: 'byRUC' },
  'Bomberos': { type: 'year_end' },
  'Licencia Rayos X': { years: 4, type: 'calendar' },
  'PUCA': { type: 'annual_renewal', renewalMonth: 1 },
  'Patente Municipal': { years: 1, type: 'calendar' },
  'RUC': { type: 'indefinite' },
  // Defaults for unrecognized permits
  'Permiso de Alcohol (SCPM)': { years: 1, type: 'calendar' },
  'Permiso de Salud (MSP)': { years: 1, type: 'calendar' },
  'Permiso Químicos (CONSEP)': { years: 1, type: 'calendar' },
};

/**
 * Calculate expiry date for a permit based on its type and issue date
 */
export function calculateExpiryDate(permitType: string, issueDate: Date): Date | null {
  const duration = PERMIT_DURATIONS[permitType];
  
  if (!duration) {
    // Fallback: assume 1 year calendar if permit type not found
    console.warn(`Unknown permit type: ${permitType}, defaulting to 1 year`);
    const expiry = new Date(issueDate);
    expiry.setFullYear(expiry.getFullYear() + 1);
    return expiry;
  }

  switch (duration.type) {
    case 'calendar':
      const expiry = new Date(issueDate);
      expiry.setFullYear(expiry.getFullYear() + (duration.years || 1));
      return expiry;

    case 'fiscal':
      // Fiscal year = 1 year from issue date
      const fiscalExpiry = new Date(issueDate);
      fiscalExpiry.setFullYear(fiscalExpiry.getFullYear() + 1);
      return fiscalExpiry;

    case 'year_end':
      // Expires 31-Dec of issue year
      return new Date(issueDate.getFullYear(), 11, 31); // Month 11 = December

    case 'annual_renewal':
      // For LUAE/PUCA: set expiry to end of year, user will see renewal reminder
      return new Date(issueDate.getFullYear(), 11, 31);

    case 'indefinite':
      // No expiry
      return null;

    default:
      return null;
  }
}

/**
 * Calculate permit status based on expiry date
 */
export function calculatePermitStatus(expiryDate: Date | null): 'vigente' | 'por_vencer' | 'vencido' {
  if (!expiryDate) return 'vigente'; // Indefinite permits stay vigente

  const now = new Date();
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) return 'vencido';
  if (daysUntilExpiry <= 30) return 'por_vencer';
  return 'vigente';
}

/**
 * Format permit duration for display
 */
export function formatPermitDuration(permitType: string): string {
  const duration = PERMIT_DURATIONS[permitType];
  if (!duration) return 'Vigencia: 1 año';

  switch (duration.type) {
    case 'calendar':
      return `Vigencia: ${duration.years} año${duration.years !== 1 ? 's' : ''}`;
    case 'fiscal':
      return 'Vigencia: 1 año fiscal';
    case 'year_end':
      return 'Vigencia: Hasta 31-dic del año en curso';
    case 'annual_renewal':
      return 'Vigencia: Renovación anual';
    case 'indefinite':
      return 'Vigencia: Indefinida';
    default:
      return 'Vigencia: 1 año';
  }
}
```

**Key points:**
- All calculation logic centralized in one file
- Easy to update when laws change
- Fallback for unknown permit types (default 1 year)
- Status calculation (`vigente`/`por_vencer`/`vencido`) also here
- Helper for displaying duration to user

---

## Components

### `src/features-v2/permits/PermitUploadForm.tsx` (NEW)

Inline form that appears when permit row expands.

**Props:**
```typescript
interface PermitUploadFormProps {
  permit: Permit;
  onSuccess: () => void;    // Refresh permits list
  onCancel: () => void;     // Collapse row
}
```

**State:**
```typescript
const [file, setFile] = useState<File | null>(null);
const [issueDate, setIssueDate] = useState<Date>(new Date());
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// Computed
const expiryDate = useMemo(() => {
  return calculateExpiryDate(permit.type, issueDate);
}, [permit.type, issueDate]);
```

**UI Structure:**
```tsx
<div className="bg-gray-50 p-4 border-t border-gray-200">
  {/* File upload zone */}
  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
    {file ? (
      <div>File: {file.name} ({formatFileSize(file.size)})</div>
    ) : (
      <div>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" />
        <p>Arrastra el documento aquí o haz click para seleccionar</p>
      </div>
    )}
  </div>

  {/* Issue date picker */}
  <div className="mt-4">
    <label>Fecha de emisión del permiso</label>
    <DatePicker value={issueDate} onChange={setIssueDate} />
    <p className="text-xs text-gray-500">
      Confirma la fecha en que fue emitido el permiso
    </p>
  </div>

  {/* Calculated expiry (read-only) */}
  <div className="mt-4 bg-blue-50 p-3 rounded border border-blue-200">
    <p className="text-sm font-semibold text-gray-900">
      Vencimiento calculado
    </p>
    <p className="font-mono text-lg text-gray-900">
      {expiryDate ? format(expiryDate, 'dd/MM/yyyy') : 'Indefinido'}
    </p>
    <p className="text-xs text-gray-600 mt-1">
      {formatPermitDuration(permit.type)}
    </p>
  </div>

  {/* Error message */}
  {error && (
    <div className="mt-4 bg-red-50 border border-red-200 p-3 rounded">
      <p className="text-sm text-red-700">{error}</p>
    </div>
  )}

  {/* Actions */}
  <div className="mt-4 flex gap-3">
    <button onClick={onCancel} disabled={loading}>
      Cancelar
    </button>
    <button onClick={handleUpload} disabled={!file || loading}>
      {loading ? 'Subiendo...' : 'Guardar documento'}
    </button>
  </div>
</div>
```

**Upload logic:**
```typescript
const handleUpload = async () => {
  if (!file) return;
  
  setLoading(true);
  setError(null);

  try {
    // 1. Upload file to Supabase Storage
    await uploadPermitDocument(permit.id, file);

    // 2. Update permit with dates and status
    const expiryDateISO = expiryDate ? expiryDate.toISOString().split('T')[0] : null;
    const issueDateISO = issueDate.toISOString().split('T')[0];

    await updatePermit(permit.id, {
      issue_date: issueDateISO,
      expiry_date: expiryDateISO,
      status: 'vigente',
    });

    // 3. Success - refresh parent
    onSuccess();
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Error al subir el documento');
  } finally {
    setLoading(false);
  }
};
```

**Styling:**
- Technical B2B aesthetic (clean, minimal)
- Mono font for calculated expiry date
- Subtle border/background for expanded state
- Blue info box for expiry calculation (not a warning, just info)

---

### `src/features-v2/locations/PermitsTable.tsx` (MODIFIED)

Enhanced to support expandable rows.

**New state:**
```typescript
const [expandedPermitId, setExpandedPermitId] = useState<string | null>(null);
```

**Row rendering logic:**
```typescript
{permits.map((permit) => (
  <React.Fragment key={permit.id}>
    {/* Main row */}
    <tr>
      <td>{permit.type}</td>
      <td>{permit.issuer}</td>
      <td>
        <StatusBadge status={permit.status} />
      </td>
      <td className="font-mono text-sm">
        {permit.issue_date ? format(parseISO(permit.issue_date), 'dd/MM/yyyy') : '—'}
      </td>
      <td className="font-mono text-sm">
        {permit.expiry_date ? format(parseISO(permit.expiry_date), 'dd/MM/yyyy') : '—'}
      </td>
      <td>
        {permit.status === 'no_registrado' ? (
          <button onClick={() => setExpandedPermitId(permit.id)}>
            Subir documento
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <DocumentIcon className="h-4 w-4" />
            <button onClick={() => setExpandedPermitId(permit.id)}>
              Reemplazar
            </button>
          </div>
        )}
      </td>
    </tr>

    {/* Expanded row with upload form */}
    {expandedPermitId === permit.id && (
      <tr>
        <td colSpan={6}>
          <PermitUploadForm
            permit={permit}
            onSuccess={() => {
              setExpandedPermitId(null);
              refetch(); // Refresh permits
            }}
            onCancel={() => setExpandedPermitId(null)}
          />
        </td>
      </tr>
    )}
  </React.Fragment>
))}
```

**Document thumbnail (for vigente permits):**
- Show file icon or PDF thumbnail
- Show uploaded date (small, gray)
- "Reemplazar" button opens same upload form
- When replacing, new document creates new record (versioning preserved via permit.version)

---

### `src/hooks/usePermits.ts` (ENHANCED)

Add `updatePermit` function:

```typescript
const updatePermit = async (permitId: string, updates: Partial<Permit>) => {
  const { error } = await supabase
    .from('permits')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', permitId);

  if (error) throw error;
  
  // Refresh permits list
  refetch();
};

return {
  permits,
  loading,
  updatePermit, // NEW
  refetch,
};
```

---

## User Flow (Step-by-Step)

### Scenario: User uploads first document for a permit

1. **User navigates to LocationDetailView**
   - URL: `/sedes/:locationId`
   - View shows location header, metrics, **permits table**

2. **User scans permits table**
   - Sees multiple permits with mixed statuses
   - Identifies permit with red/gray badge: `no_registrado`
   - Permit row shows: Type | Issuer | Status | Issue Date (—) | Expiry Date (—) | **[Subir documento]**

3. **User clicks "Subir documento" button**
   - Row expands smoothly (slide-down animation)
   - `PermitUploadForm` appears inline with gray background
   - Form shows: file upload zone, date picker, calculated expiry display

4. **User drags PDF into upload zone** (or clicks to select)
   - File name and size appear
   - Upload zone changes to "file loaded" state
   - Date picker defaults to today's date

5. **User confirms issue date**
   - If permit was issued today → leave as-is
   - If issued earlier → adjust date via date picker
   - As user changes date, **expiry date updates in real-time**

6. **User reviews calculated expiry**
   - Blue info box shows:
     - "Vencimiento calculado"
     - Expiry date in mono font: `15/02/2027`
     - Duration rule: "Vigencia: 1 año según ley ARCSA"

7. **User clicks "Guardar documento"**
   - Button shows loading spinner
   - File uploads to Supabase Storage
   - Permit record updates: `issue_date`, `expiry_date`, `status='vigente'`
   - Row collapses
   - Table refreshes

8. **User sees updated permit row**
   - Status badge now green: `vigente`
   - Issue date shows: `15/02/2026` (mono font)
   - Expiry date shows: `15/02/2027` (mono font)
   - Action changes to: [Document icon] **Reemplazar**

### Edge Cases

**User uploads but then cancels:**
- Click "Cancelar" → row collapses
- No data saved
- File not uploaded

**User tries to save without file:**
- "Guardar documento" button disabled
- No action

**Upload fails (network error, Supabase error):**
- Error message appears in red box
- Form stays open
- User can retry or cancel

**User adjusts issue date to future date:**
- Validation: issue date cannot be in the future
- Show error: "La fecha de emisión no puede ser futura"
- Disable save button

**User replaces existing document:**
- Same flow as initial upload
- New document record created in `documents` table
- Permit dates can be updated if user adjusts issue date
- Old document remains in database (soft history via permit.version)

---

## Error Handling

### Client-Side Validation

**Before upload:**
- ✅ File required
- ✅ File size < 10MB
- ✅ File type: PDF, JPG, JPEG, PNG only
- ✅ Issue date not in future
- ✅ Issue date not more than 10 years in past (sanity check)

**Error messages:**
- "Selecciona un documento para subir"
- "El archivo es demasiado grande (máximo 10MB)"
- "Formato no válido. Solo se aceptan PDF, JPG, PNG"
- "La fecha de emisión no puede ser futura"
- "Fecha inválida. Verifica la fecha de emisión"

### Server-Side Errors

**Supabase Storage upload fails:**
- Network error → "Error de conexión. Verifica tu internet e intenta de nuevo."
- Permission error → "Error de permisos. Contacta soporte."
- Generic → "Error al subir el archivo. Intenta de nuevo."

**Database update fails:**
- Permit not found → "Error: permiso no encontrado"
- RLS policy blocks → "Error de permisos. Contacta soporte."
- Generic → "Error al guardar. Intenta de nuevo."

**Rollback on failure:**
- If document uploads but permit update fails:
  - Delete uploaded file from Storage
  - Show error to user
  - User can retry (fresh file upload)

---

## Status Transitions

```
┌─────────────────┐
│  no_registrado  │  Initial state when permit created
└────────┬────────┘
         │
         │ User uploads document + confirms issue date
         ▼
┌─────────────────┐
│     vigente     │  Document uploaded, expiry > 30 days away
└────────┬────────┘
         │
         │ Cron job checks expiry_date daily
         ▼
┌─────────────────┐
│   por_vencer    │  Expiry date within 30 days
└────────┬────────┘
         │
         │ Expiry date passes
         ▼
┌─────────────────┐
│     vencido     │  Past expiry date
└────────┬────────┘
         │
         │ User uploads new document (renewal)
         │
         └──────> Back to vigente
```

**Notes:**
- `en_tramite` status exists in schema but not used in MVP
- Status calculation happens via cron job (future implementation)
- For MVP, status updates manually on document upload only

---

## Styling & Design System

### Technical B2B Aesthetic

**Color palette (from CLAUDE.md spec):**
- Background: `#F6F7F9`
- Ink Navy: `#0A1128`
- Primary / Action: `#E65100`
- Success: `#047857`
- Muted: `slate-500`, `slate-600`
- Borders: `slate-200`, `slate-300`

**Typography:**
- Sans principal: Inter (default)
- Mono for technical data:
  - Permit dates: `font-mono text-sm`
  - Status codes: `font-mono text-xs`
  - File sizes: `font-mono text-xs`

**Component styling:**
- Border radius: `rounded-lg` (8px) max
- Shadows: subtle or hard light (no fluffy shadows)
- Buttons: almost rectangular, clear hierarchy
- States: clean, precise, operational

**Permit status badges:**
```tsx
vigente     → Green bg, dark green text
por_vencer  → Orange bg, dark orange text
vencido     → Red bg, dark red text
no_registrado → Gray bg, gray text
```

**Upload form:**
- Light gray background (`bg-gray-50`)
- Dashed border for file drop zone
- Blue info box for calculated expiry (not warning style)
- Buttons: Primary action = orange gradient, Secondary = gray

---

## Future Enhancements (Out of Scope for MVP)

**Not implementing now, but design supports:**

1. **Automatic task generation**
   - When permit uploaded → create task for renewal
   - Task due date = 30-60 days before expiry
   - Task priority based on risk level

2. **OCR for issue date extraction**
   - Upload PDF → OCR scans for "Fecha de emisión"
   - Pre-fill date picker
   - User still confirms

3. **Document thumbnails**
   - Generate PDF thumbnail on upload
   - Show preview in grid

4. **Bulk upload**
   - Upload multiple permits at once
   - CSV import with metadata

5. **Permit versioning UI**
   - Show document history per permit
   - Compare old vs new documents
   - Restore previous version

6. **Email reminders**
   - 30 days before expiry → email reminder
   - Integration with task system

7. **Mobile optimization**
   - Inline expansion might be cramped on mobile
   - Consider modal fallback for < 768px

8. **Permit number field**
   - Add input for `permit_number` (optional)
   - Useful for tracking/audits

---

## Testing Checklist

### Unit Tests

- [ ] `calculateExpiryDate()` for all permit types
- [ ] `calculatePermitStatus()` for edge cases (today, 30 days, 31 days, expired)
- [ ] `formatPermitDuration()` returns correct strings

### Integration Tests

- [ ] Upload document → file appears in Supabase Storage
- [ ] Permit record updates with correct dates
- [ ] Status transitions from `no_registrado` → `vigente`
- [ ] Grid refreshes after upload
- [ ] Error handling: upload fails → file deleted from storage

### Manual Testing

**Happy path:**
- [ ] New user creates location with permits
- [ ] Permits show `no_registrado` status
- [ ] Click "Subir documento" → row expands
- [ ] Upload PDF, confirm issue date
- [ ] Expiry calculates correctly in real-time
- [ ] Click save → upload succeeds
- [ ] Row collapses, status updates to `vigente`
- [ ] Dates appear in mono font
- [ ] "Reemplazar" button appears

**Edge cases:**
- [ ] Try to save without file → button disabled
- [ ] Upload file > 10MB → error message
- [ ] Upload .txt file → error message
- [ ] Set issue date to future → error message
- [ ] Network error during upload → error message + rollback
- [ ] Cancel mid-upload → row collapses, no data saved

**Replacement flow:**
- [ ] Click "Reemplazar" on vigente permit → row expands
- [ ] Upload new document with different issue date
- [ ] Save → dates update, status recalculates
- [ ] Old document preserved in database

**Different permit types:**
- [ ] ARCSA permit → calculates 1 year expiry
- [ ] Bomberos permit → calculates 31-Dec expiry
- [ ] RUC → shows "Indefinido" expiry
- [ ] LUAE → shows 31-Dec expiry with renewal hint

---

## Database Migration

**No migration needed!** Existing schema already supports this flow:

```sql
-- permits table already has:
issue_date     TIMESTAMP
expiry_date    TIMESTAMP
status         TEXT (vigente, por_vencer, vencido, en_tramite, no_registrado)

-- documents table already has:
permit_id      UUID REFERENCES permits(id)
file_path      TEXT
file_name      TEXT
uploaded_by    UUID REFERENCES auth.users(id)
```

Only addition needed: RLS policies (if not already present):

```sql
-- Users can update permits for their company
CREATE POLICY "Users can update own company permits"
  ON permits FOR UPDATE
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Users can insert documents for their company's permits
CREATE POLICY "Users can upload documents for own company"
  ON documents FOR INSERT
  WITH CHECK (permit_id IN (
    SELECT id FROM permits WHERE company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  ));
```

---

## Dependencies

**NPM packages needed:**
- `date-fns` - Already installed (for date formatting/parsing)
- `react-day-picker` or shadcn `calendar` - Date picker component
- `lucide-react` - Already installed (icons)

**Supabase Storage bucket:**
- `permit-documents` - Already created
- Public read access configured

**No new external APIs required.**

---

## Success Criteria

**Implementation is complete when:**

✅ User can upload document from permits grid  
✅ Issue date defaults to today, user can adjust  
✅ Expiry date calculates automatically based on permit type  
✅ Expiry date is not user-editable  
✅ Status updates from `no_registrado` → `vigente`  
✅ Grid shows document metadata after upload  
✅ User can replace documents (same flow)  
✅ All permit types from research report have correct duration rules  
✅ Error handling covers network, storage, and validation failures  
✅ Styling matches Technical B2B aesthetic  
✅ Manual testing checklist passes  

---

## Open Questions

**Resolved:**
- ✅ User can adjust issue date? → Yes, defaults to today but editable
- ✅ Expiry date user-editable? → No, system calculates only
- ✅ Modal or inline? → Inline expansion in grid
- ✅ Status transitions automatic? → On upload yes, cron job for expiry checks (future)

---

## Approval

**Approved by:** User  
**Date:** 2026-04-14  
**Next step:** Write implementation plan
