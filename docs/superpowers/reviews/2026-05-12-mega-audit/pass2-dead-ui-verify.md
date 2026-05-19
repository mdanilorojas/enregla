# Pass 2 — Dead-UI Verification

Date: 2026-05-12
Scope: Independent verification of 10 P0 "dead UI" claims against code + live DB.
Method: Direct file reads (`C:\dev\enregla\src\...`) and `mcp__supabase__execute_sql` against the remote Supabase project. No claims trusted on face value.

---

## Claim 1 — Two "Nuevo Permiso" buttons in `PermitListView` have no onClick / no Link wrapper

**CONFIRMED.**

File: `C:\dev\enregla\src\features\permits\PermitListView.tsx`.

Header button (lines 85–87):

```tsx
<Button variant="default">
  <Plus className="w-4 h-4" />Nuevo Permiso
</Button>
```

Empty-state button (lines 112–115):

```tsx
<Button variant="default">
  <Plus className="w-4 h-4" />Nuevo Permiso
</Button>
```

Neither has an `onClick`, nor is wrapped in a `<Link>` or `<a>`. There is no `useNavigate` hook in the file and the only other interactive handler is `onClick={() => exportPermitsCSV(filtered)}` on the CSV export button (line 82). Both "Nuevo Permiso" CTAs are inert.

---

## Claim 2 — `/design-system` and `/design-system-showcase` BOTH shipped as authenticated routes in `App.tsx`

**CONFIRMED.**

File: `C:\dev\enregla\src\App.tsx`, lines 116–117, inside the `<Route element={<ProtectedRoute><ProtectedOnboardingRoute /></ProtectedRoute>}>` block that opens at line 100:

```tsx
<Route path="/design-system" element={<DesignSystemView />} />
<Route path="/design-system-showcase" element={<DesignSystemShowcase />} />
```

Both sit under the same `ProtectedRoute` parent as `/`, `/sedes`, `/permisos`, etc. (closing `</Route>` at line 120). Both are imported at the top (lines 20–21). Two nearly-duplicate internal design-system pages shipped to authenticated end-users.

---

## Claim 3 — `NotificationsTab` toggles don't persist; real `NotificationPreferences` not wired

**CONFIRMED.**

File: `C:\dev\enregla\src\features\settings\NotificationsTab.tsx` (35 lines total). Each toggle is a plain `<input type="checkbox" defaultChecked={defaultChecked} />` (line 19) with no `onChange`, no hook, no Supabase call. The entire file has zero imports from `@/hooks` or `@/lib/supabase`.

The "real" component `NotificationPreferences.tsx` exists and does the right thing: it uses `useNotificationPreferences(profile?.id)`, calls `updatePreferences(...)` on change, and toasts on success/error (lines 10–21). But searching the whole `src/` tree:

```
src\features\settings\NotificationPreferences.tsx:10:export function NotificationPreferences() { ... }
src\hooks\useNotificationPreferences.ts:...
```

there is **no import** of `NotificationPreferences` from anywhere else in `src/` — `SettingsView.tsx` and its tabs do not reference it. The persisting implementation is orphaned; the dead-toggle implementation is the one users see.

---

## Claim 4 — `SecurityTab` "Cerrar sesiones" and `ProfileTab` "Guardar cambios" have no onClick

**CONFIRMED (both).**

`C:\dev\enregla\src\features\settings\SecurityTab.tsx` line 23:

```tsx
<Button variant="destructive"><LogOut className="w-4 h-4" />Cerrar todas las sesiones</Button>
```

No `onClick`, no `supabase.auth.signOut()`, no navigation. Entire file has zero handlers.

`C:\dev\enregla\src\features\settings\ProfileTab.tsx` line 30:

```tsx
<Button variant="default">Guardar cambios</Button>
```

No `onClick`. The `<Input>` fields use `defaultValue` (uncontrolled) and there is no state, no mutation hook, and no form submit. Clicking the button is a no-op.

---

## Claim 5 — `LocationDetailView` has `RenewPermitModal` mounted but setters never called

**CONFIRMED.**

File: `C:\dev\enregla\src\features\locations\LocationDetailView.tsx`. Setters declared on lines 25–26:

```tsx
const [selectedPermit, setSelectedPermit] = useState<Permit | null>(null);
const [renewModalOpen, setRenewModalOpen] = useState(false);
```

All occurrences of those setters in the entire file (grep result):

```
25:  const [selectedPermit, setSelectedPermit] = useState<Permit | null>(null);
26:  const [renewModalOpen, setRenewModalOpen] = useState(false);
155:            setRenewModalOpen(false);
156:            setSelectedPermit(null);
```

Both setters are only ever invoked with *closing/null* values inside the modal's `onClose`. There is no `setRenewModalOpen(true)` and no `setSelectedPermit(permit)` anywhere in the file. The modal is mounted but unreachable from the UI — no code path opens it.

---

## Claim 6 — `LegalIndexView` reads DB, `LegalPermitDetailView` reads static TS, leading to 404 on LUAE/MSP

**PARTIAL — confirmed the split; DB table is `legal_references` (not `legal_permits`); no "LUAE" or "MSP" slugs exist in either source, so the 404-on-LUAE/MSP claim is not about *missing from DB only*, it's that neither source has them.**

`LegalIndexView.tsx` reads DB via `useLegalReferences(filter)` (line 12, 71) from `@/lib/domain/legal-references-db`. It uses `PERMIT_TO_CATEGORY` from the static file only for category bucketing — the actual list of permits rendered comes from the DB.

`LegalPermitDetailView.tsx` reads purely from the static file: line 14 imports `getPermitByType` from `./selectors`, which in `selectors.ts` looks up `LEGAL_REFERENCES` (a `Record<PermitType, LegalReference>`) imported from `@/data/legal-references`. No Supabase call anywhere in the detail view or its selectors.

Static file `src/data/legal-references.ts` exports: `LegalCategory` (type), `PERMIT_TO_CATEGORY`, `CategoryMeta` (type), `CATEGORY_META`, `CATEGORY_ORDER`, `LEGAL_REFERENCES`, `getLegalReference`, `getAllLegalReferences`. The `LEGAL_REFERENCES` object holds **6 permits**: `ruc`, `patente_municipal`, `bomberos`, `arcsa`, `uso_suelo`, `rotulacion`.

DB `public.legal_references` (note: table name differs from the claim's `legal_permits`) returns **6 permit_types**, identical set: `arcsa`, `bomberos`, `patente_municipal`, `rotulacion`, `ruc`, `uso_suelo`.

**Overlap = 6/6. Delta = 0.** Neither source contains `luae` or `msp` slugs. The architectural divergence (index from DB, detail from static TS) is real and IS a bug waiting to happen: the moment an admin inserts a new row into `public.legal_references` (say `luae`), `LegalIndexView` will show a card for it but clicking it routes to `/marco-legal/luae`, and `LegalPermitDetailView` will render `PermitNotFound` because `luae` is not a key of the static `LEGAL_REFERENCES`. Today's 6/6 overlap is coincidental; the bug is latent.

---

## Claim 7 — `IncrementalWizard` says "PermitOps" instead of "EnRegla"

**CONFIRMED.**

Grep for `PermitOps` under `src/features/onboarding-incremental/`:

```
src\features\onboarding-incremental\steps\ProfileStep.tsx:24:        Bienvenido a PermitOps
src\features\onboarding-incremental\IncrementalWizard.tsx:160:            PermitOps
```

Two hits. Both places expose the legacy product name "PermitOps" to the user during onboarding — the welcome heading in `ProfileStep` and a string in `IncrementalWizard` (header brand at line 160).

---

## Claim 8 — `CompanyTab.tsx` hardcoded 4 business types but DB CHECK allows 12

**CONFIRMED.**

`C:\dev\enregla\src\features\settings\CompanyTab.tsx` lines 11–16:

```tsx
const BUSINESS_TYPES = [
  { value: 'restaurante', label: 'Restaurante' },
  { value: 'retail', label: 'Retail / Comercio' },
  { value: 'food_truck', label: 'Food Truck' },
  { value: 'consultorio', label: 'Consultorio' },
] as const
```

4 values offered.

DB constraint `companies_business_type_check`:

```
CHECK ((business_type = ANY (ARRAY[
  'restaurante','retail','food_truck','consultorio',
  'cafeteria','panaderia','bar','farmacia',
  'gimnasio','salon_belleza','oficina','otro'
])))
```

12 values allowed. Users editing their company in Settings can only pick the first 4; the 8 additional types introduced by the `feat/dominio-v2` onboarding work (cafeteria, panaderia, bar, farmacia, gimnasio, salon_belleza, oficina, otro) are unselectable here. If a user's company was onboarded with `panaderia` and opens Settings, the `<select>`'s current value won't be in the options list.

---

## Claim 9 — Auto-trigger for permits doesn't populate `issuer_id`

**CONFIRMED.**

Only one function in the DB looks like the auto-creator: `public.auto_create_location_permits`. Its body:

```sql
CREATE OR REPLACE FUNCTION public.auto_create_location_permits()
RETURNS trigger ...
BEGIN
  SELECT business_type INTO company_business_type FROM companies WHERE id = NEW.company_id;
  IF company_business_type IS NULL THEN RETURN NEW; END IF;
  FOR permit_req IN
    SELECT permit_type FROM permit_requirements WHERE business_type = company_business_type
  LOOP
    INSERT INTO permits (company_id, location_id, type, status, is_active)
    VALUES (NEW.company_id, NEW.id, permit_req.permit_type, 'no_registrado', true);
  END LOOP;
  RETURN NEW;
END;
```

`INSERT INTO permits (...)` columns: `company_id, location_id, type, status, is_active`. **`issuer_id` is NOT set** — left NULL by default. Other candidate functions in public schema (`get_expiring_permits`, `get_public_permits`, `log_permit_event`) do not insert rows into `permits`.

Live sample from `permits`:

| metric | value |
|---|---|
| total rows | 46 |
| `issuer_id` NULL | 41 |
| `issuer_id` populated | 5 |

Latest 10 rows: **all 10 have `issuer_id = NULL`**. The 5 populated rows are older / manual. Confirms the trigger inserts without `issuer_id`, so every auto-created permit is orphaned from the `permit_issuers` lookup.

---

## Claim 10 — Orphan `internal-crm` components not routed

**CONFIRMED.**

Grep `App.tsx` for `LeadsTable|PartnerScorecard`: **0 matches**.

Grep whole `src/` tree: both components exist and define themselves but are not imported or referenced anywhere:

```
src\features\internal-crm\PartnerScorecard.tsx:36:export function PartnerScorecard({ initialScores = {}, onChange }: Props) { ... }
src\features\internal-crm\LeadsTable.tsx:36:export function LeadsTable() { ... }
```

Each file's only hit is its own export declaration — no consumer, no route, no parent feature. Dead code.

---

## Summary table

| # | Claim | Verdict |
|---|---|---|
| 1 | Two "Nuevo Permiso" buttons dead | CONFIRMED |
| 2 | Two design-system routes both shipped | CONFIRMED |
| 3 | `NotificationsTab` dead, real one orphaned | CONFIRMED |
| 4 | SecurityTab/ProfileTab buttons dead | CONFIRMED |
| 5 | `RenewPermitModal` unreachable | CONFIRMED |
| 6 | Legal index (DB) vs detail (static TS) split | PARTIAL (split real; today 6/6 overlap, bug is latent; DB table is `legal_references` not `legal_permits`; no `luae`/`msp` in either source) |
| 7 | "PermitOps" copy in onboarding | CONFIRMED (2 locations) |
| 8 | CompanyTab 4 types vs DB 12 | CONFIRMED |
| 9 | Auto-trigger doesn't set `issuer_id` | CONFIRMED (41/46 rows NULL; trigger INSERT omits the column) |
| 10 | `LeadsTable`/`PartnerScorecard` unrouted | CONFIRMED |

9 CONFIRMED, 1 PARTIAL. All P0 findings hold.
