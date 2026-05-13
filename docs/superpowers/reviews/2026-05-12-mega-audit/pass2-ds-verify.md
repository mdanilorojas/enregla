# Pass 2 — Design-System P0 Verification

Independent reproduction of three claimed P0 bugs in EnRegla's design system.
Verification done against commit on branch `feat/dominio-v2` at 2026-05-12.

Build output used as evidence: `dist/assets/index-B1-dDQd7.css` (135.94 kB, 3139 modules transformed, build succeeded in 600 ms).

---

## CLAIM A — `@theme` tokens missing Tailwind 4 `--color-*` namespace → utilities emit zero CSS

**Verdict: CONFIRMED (P0).**

### Evidence 1 — the `@theme` block at `src/index.css` lines 16–44

```css
@theme {
  --font-sans: var(--font-family-sans);
  --font-heading: var(--font-family-sans);

  /* shadcn/ui compatibility - map to design tokens */
  --primary: var(--color-primary);
  --primary-foreground: #FFFFFF;
  --secondary: var(--color-secondary);
  --secondary-foreground: #FFFFFF;
  --accent: var(--color-accent);
  --accent-foreground: #FFFFFF;
  --destructive: var(--color-danger);
  --destructive-foreground: #FFFFFF;
  --muted: var(--color-text-muted);
  --muted-foreground: var(--color-text-secondary);
  --input: var(--color-border);
  --ring: var(--color-primary);
  --foreground: var(--color-text);

  /* Surface tokens used by shadcn primitives (Select/Popover/Dropdown/Dialog).
     Must be opaque — transparent backgrounds make dropdown options impossible
     to read/click against page content. */
  --background: var(--color-bg, #FFFFFF);
  --card: var(--color-bg, #FFFFFF);
  --card-foreground: var(--color-text);
  --popover: #FFFFFF;
  --popover-foreground: var(--color-text);
  --border: var(--color-border);
}
```

Per the Tailwind 4 theme-namespace spec (https://tailwindcss.com/docs/theme#theme-variable-namespaces), only variables that begin with `--color-*` produce color utilities; only `--spacing-*` produce spacing utilities; etc. All 17 declarations above are in the bare namespace (`--primary`, `--background`, `--destructive`, `--input`, `--ring`, `--border`, `--card`, `--popover`, `--foreground`, `--muted`, `--muted-foreground`, `--accent`, `--secondary`, and their `-foreground` pairs) and therefore produce **no utility classes at all**.

Compare with the **second** `@theme inline` block at lines 225–234, which is correct:

```css
@theme inline {
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  ...
}
```

Those `--color-sidebar*` declarations do generate `.bg-sidebar`, `.text-sidebar-foreground`, etc. — which we see emitted in the build.

### Evidence 2 — `tailwind.config.js` does NOT define the missing tokens

`config/tailwind.config.js` in full:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
};
```

No `theme.extend.colors`. No fallback. The JS config is essentially empty (only `content`).

### Evidence 3 — SMOKING GUN: built CSS contains zero declarations for these utilities

Commands run against the freshly-built `dist/assets/index-B1-dDQd7.css`:

```
grep -c 'bg-primary'            → 0
grep -c 'bg-background'         → 0
grep -c 'text-destructive'      → 0
grep -c 'border-input'          → 0
grep -c 'ring-ring'             → 0
grep -c 'text-muted-foreground' → 0
grep -c 'bg-popover'            → 0
grep -c 'bg-accent'             → 0
grep -c 'bg-card'               → 0
```

Meanwhile, utilities backed by correctly-namespaced tokens DO appear:

```
.bg-sidebar { ... }
.bg-sidebar-border { ... }
.border-sidebar-border { ... }
.text-sidebar-foreground { ... }
```

(Also all `.bg-blue-500`, `.bg-red-500`, `.bg-gray-100`, etc. from Tailwind's default palette.)

### Evidence 4 — subtlety about `--color-background`

`grep --color-background dist/assets/index-B1-dDQd7.css` DOES return a hit — but it is the *legacy alias* declared inside `:root { ... }` at `src/styles/atlassian-tokens.css:248`, not inside `@theme`. Tailwind 4 only scans `@theme` blocks for utility-generation tokens; arbitrary `:root` vars are just custom properties. So the variable exists but `.bg-background` is still not generated.

### Evidence 5 — 41 source usages currently render as no-ops

`grep -rEn 'bg-primary\b|bg-background\b|bg-popover\b|bg-accent\b|text-destructive\b|text-muted-foreground\b|border-input\b|ring-ring\b|ring-offset-background\b' src/` reports **41 total occurrences across 13 files**:

| File | Count |
|---|---|
| `src/components/ui/calendar.tsx` | 12 |
| `src/features/settings/NotificationPreferences.tsx` | 8 |
| `src/components/ui/dropdown-menu.tsx` | 4 |
| `src/components/ui/sidebar.tsx` | 3 |
| `src/components/ui/sheet.tsx` | 3 |
| `src/components/ui/form.tsx` | 3 |
| `src/components/ui/table.tsx` | 2 |
| `src/components/ui/tooltip.tsx` | 1 |
| `src/components/ui/textarea.tsx` | 1 |
| `src/components/ui/select.tsx` | 1 |
| `src/components/ui/checkbox.tsx` | 1 |
| `src/features/locations/PublicLinkBanner.tsx` | 1 |
| `src/features/locations/LocationsGrid.tsx` | 1 |

Every one of those class references currently produces nothing. Calendar, NotificationPreferences, and the shadcn primitives in `components/ui` will all render with missing backgrounds/borders/rings.

### Fix (for reference)

Change lines 20–44 of `src/index.css` so each token lives in the correct namespace:

```css
--color-primary: var(--color-primary, ...)   /* avoid self-reference */
--color-primary-foreground: #FFFFFF;
--color-destructive: var(--color-danger);
--color-background: var(--color-bg, #FFFFFF);
--color-card: var(--color-bg, #FFFFFF);
--color-popover: #FFFFFF;
--color-border: var(--color-border, ...);
--color-input: var(--color-border, ...);
--color-ring: var(--color-primary, ...);
--color-foreground: var(--color-text);
--color-muted: var(--color-text-muted);
--color-muted-foreground: var(--color-text-secondary);
--color-accent: var(--color-accent);
--color-accent-foreground: #FFFFFF;
--color-secondary: var(--color-secondary);
--color-secondary-foreground: #FFFFFF;
```

Note the self-reference risk: several of the bare names (e.g. `--primary`) point to `var(--color-primary)` that lives in `atlassian-tokens.css` under a DIFFERENT scope (`:root`). Moving them into the `--color-*` namespace inside `@theme` requires either renaming the legacy alias or using an explicit value so we don't create a cycle.

---

## CLAIM B — `/design-system` route shows wrong brand colors; `/design-system-showcase` is correct

**Verdict: CONFIRMED.**

### Evidence 1 — both routes exist

`src/App.tsx`:

```tsx
20: import { DesignSystemView } from '@/features/design-system/DesignSystemView';
21: import { DesignSystemShowcase } from '@/features/design-system/DesignSystemShowcase';
...
116: <Route path="/design-system" element={<DesignSystemView />} />
117: <Route path="/design-system-showcase" element={<DesignSystemShowcase />} />
```

### Evidence 2 — `DesignSystemView.tsx` hardcodes Tailwind's default palette and labels it "brand"

`src/features/design-system/DesignSystemView.tsx:111-113`:

```tsx
<p className="text-sm text-gray-600 mb-6">
  Azul profundo (#1e3a8a / blue-900) - Color principal de marca
</p>
```

That is FALSE. `#1e3a8a` is Tailwind's stock `blue-900`. The actual brand primary (per `src/styles/atlassian-tokens.css:5` — `/* Base colors: Blue #0f265c + Orange #ff7043 */` — and `--ds-blue-500: #0f265c` at line 16) is `#0f265c`.

Hex literals enumerated from `DesignSystemView.tsx` (`grep -oE '#[0-9a-fA-F]{6}'`):

```
#10b981  ← labeled "Éxito" (line 101) — wrong; brand success is #36B37E
#ef4444  ← labeled "Error" (line 103) — wrong; brand danger is #DE350B
#f59e0b  ← labeled "Advertencia" (line 102) — brand warning is #FFAB00
#3b82f6  ← labeled "Info" (line 104) — brand info is #0f265c / ds-blue-500
#1e3a8a  ← blue-900, referenced as "Color principal de marca" (line 83)
#172554, #1d4ed8, #1e40af, #2563eb, #60a5fa, #93c5fd, #bfdbfe, #dbeafe, #eff6ff
  ← all Tailwind stock blue ramp, none match the brand ramp
#111827 #1f2937 #374151 #4b5563 #6b7280 #9ca3af #d1d5db #e5e7eb #f3f4f6 #f9fafb
  ← Tailwind stock gray ramp, not the Atlassian neutral ramp
(no #0f265c, no #ff7043, no #36B37E, no #DE350B, no #FFAB00)
```

`grep -oE '#[0-9a-fA-F]{6}' DesignSystemShowcase.tsx` returns **empty**. The showcase file uses zero hex literals and instead pulls everything through `var(--color-primary)`, `var(--color-risk-critico)`, `var(--color-status-vigente)`, etc. (see `DesignSystemShowcase.tsx` lines 70, 89–102, 112–128). Those CSS variables resolve (via `atlassian-tokens.css`) to the brand palette.

### Evidence 3 — canonical brand blue `#0f265c`

Lives at `src/styles/atlassian-tokens.css:16`:

```css
--ds-blue-500: #0f265c;
```

File header comment at line 5: `Base colors: Blue #0f265c + Orange #ff7043`. Also hard-coded at `src/styles/atlassian-tokens.css:334`:

```css
--shadow-focus: 0 0 0 3px rgba(15, 38, 92, 0.15);
```

(15, 38, 92 is the decimal form of `#0f265c`.)

### Net

Anyone navigating to `/design-system` sees a "brand" palette that contradicts the actual product — users clicking the swatches to copy hex codes will propagate the wrong values. `/design-system-showcase` is the correct one and should be the only one kept (or DesignSystemView should be rewritten to read from the real tokens).

---

## CLAIM C — `react-hook-form` + `zod` + `@hookform/resolvers` installed but unused; all forms are hand-rolled

**Verdict: CONFIRMED.**

### Evidence 1 — dependencies are installed

`package.json`:

```json
"@hookform/resolvers": "^5.2.2",   // line 16
"react-hook-form": "^7.72.1",       // line 44
"zod": "^4.3.6",                    // line 50
```

### Evidence 2 — only ONE file imports from `react-hook-form`

`grep -rn "react-hook-form" src/`:

```
src\components\ui\form.tsx:11:} from "react-hook-form"
```

And that same file is the only user of `useForm` / `FormProvider` / `useFormContext` / `useFormField` (all occurrences are internal to `form.tsx`). No other file anywhere in `src/` imports from `react-hook-form` or from `@hookform/resolvers`.

### Evidence 3 — NO file imports `components/ui/form`

`grep -rn "components/ui/form" src/` → **zero matches**. The `form.tsx` primitive is orphaned — dead code.

### Evidence 4 — actual forms use `useState`

Sampled the forms named in the claim:

- `src/features/auth/LoginView.tsx:22-26`:
  ```
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  ```
- `src/features/permits/PermitUploadForm.tsx:78-81`:
  ```
  const [file, setFile] = useState<File | null>(preloadedFile);
  const [issueDate, setIssueDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  ```
- `src/features/onboarding-incremental/steps/CompanyStep.tsx:29`:
  ```
  const [data, setData] = useState<CompanyData>({ ... });
  ```
- Settings tabs (`src/features/settings/CompanyTab.tsx`), other onboarding steps (`LocationsStep.tsx`, `ProfileStep.tsx`, `IncrementalWizard.tsx`) all contain `useState` and zero `useForm`.

### Net

`react-hook-form` + `zod` + `@hookform/resolvers` together ship a meaningful bundle cost and zero runtime value. Either (a) adopt them for the existing hand-rolled forms, or (b) uninstall all three and delete `src/components/ui/form.tsx`.

---

## Summary

| Claim | Verdict | Severity |
|---|---|---|
| A — `@theme` missing `--color-*` prefix → 9+ utilities emit no CSS | CONFIRMED | P0 — visible production breakage across calendar, notifications, dropdowns, sheets, sidebar, tooltips, etc. |
| B — `/design-system` shows wrong brand palette | CONFIRMED | P1 — misleading reference surface; risk of other devs copying wrong hexes |
| C — `react-hook-form` stack installed but unused | CONFIRMED | P3 — dead code / unnecessary bundle weight |

Referenced evidence paths (absolute):

- `C:\dev\enregla\src\index.css` (lines 16–44, 225–234)
- `C:\dev\enregla\config\tailwind.config.js`
- `C:\dev\enregla\src\styles\atlassian-tokens.css` (lines 5, 16, 229–248, 334)
- `C:\dev\enregla\dist\assets\index-B1-dDQd7.css` (build artifact; 0 occurrences of the 9 utility names under test)
- `C:\dev\enregla\src\features\design-system\DesignSystemView.tsx` (lines 83, 101–104, 111–113)
- `C:\dev\enregla\src\features\design-system\DesignSystemShowcase.tsx` (lines 70, 89–102, 112–128)
- `C:\dev\enregla\src\App.tsx` (lines 20–21, 116–117)
- `C:\dev\enregla\src\components\ui\form.tsx` (line 11)
- `C:\dev\enregla\package.json` (lines 16, 44, 50)
- `C:\dev\enregla\src\features\auth\LoginView.tsx` (lines 22–26)
- `C:\dev\enregla\src\features\permits\PermitUploadForm.tsx` (lines 78–81)
- `C:\dev\enregla\src\features\onboarding-incremental\steps\CompanyStep.tsx` (line 29)
