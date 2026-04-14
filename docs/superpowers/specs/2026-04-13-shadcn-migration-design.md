# shadcn/ui + Radix UI Migration - Design Specification

**Created:** 2026-04-13  
**Project:** PermitOps (EnRegla)  
**Migration Type:** Component Library Replacement  
**Approach:** Incremental by Layers (4 Sessions)

---

## Executive Summary

Migrate PermitOps from custom component library to shadcn/ui + Radix UI + Tailwind CSS, adopting shadcn/ui's default design system for a modern, accessible, and maintainable UI. This migration will replace all custom components that have shadcn/ui equivalents while preserving specialized components (charts, gauges, custom visualizations).

**Key Decision:** Complete visual redesign - adopting shadcn/ui default theme and abandoning custom EnRegla branding colors in favor of a more professional, industry-standard design system.

---

## Current State Analysis

### Existing Component Library

**Custom Components (15 total):**
- `Button.tsx` - Custom variants (primary/secondary/ghost/danger)
- `Card.tsx` - Custom padding/hover/accent system
- `Badge.tsx` - Custom risk/status colors
- `Skeleton.tsx` - Custom shimmer animation
- `EmptyState.tsx` - Simple empty state handler
- `GlassModal.tsx` - Glass morphism modal
- `GlassNotification.tsx` - Fixed position notifications
- `GlassCard.tsx` - Glass morphism card variant
- `GlassBackground.tsx` - Decorative glass background
- `StatusDot.tsx` - Simple status indicator
- `LegalPill.tsx` - Branding pill component
- `ProgressBar.tsx` - Linear progress indicator
- `ProgressRing.tsx` - SVG circular progress
- `ComplianceGauge.tsx` - Custom compliance chart
- `RiskIndicator.tsx` - Custom risk visualization

**Current Stack:**
- React 19.2.4
- TypeScript 6.0.2
- Tailwind CSS 4.2.2
- Vite 8.0.4
- Framer Motion 12.38.0 (animations)
- lucide-react 1.7.0 (icons)

**Styling Approach:**
- Tailwind utility classes
- Custom CSS theme in `src/index.css`
- Custom color system (EnRegla branding)
- Custom animations (pulse-risk, glow-emerald, login-float, etc.)

### Pain Points

1. **Forms:** No form components - using raw HTML `<input>`, `<select>` with inconsistent styling
2. **Modals:** Custom GlassModal with glass morphism - accessibility concerns, no keyboard traps
3. **Notifications:** Manual positioning, no queue system, single notification at a time
4. **Consistency:** Each component has different patterns for variants, sizing, states
5. **Accessibility:** Missing ARIA labels, keyboard navigation inconsistent, focus management manual
6. **Type Safety:** Custom types not always compatible with standard HTML attributes

---

## Target State

### shadcn/ui Component Library

**What is shadcn/ui?**
- NOT an npm package - CLI tool that copies component source code into your project
- Built on Radix UI primitives (accessibility-first, unstyled headless components)
- Fully customizable - components live in your codebase
- Tailwind CSS for styling with CSS variables for theming
- TypeScript native with full type safety

**Installation Method:**
```bash
npx shadcn@latest init
```

**Configuration (`components.json`):**
```json
{
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

### New Dependencies

**Core:**
- `class-variance-authority` (^0.7.0) - Component variants system
- `clsx` (^2.1.0) - Conditional className utility
- `tailwind-merge` (^2.2.0) - Merge Tailwind classes intelligently
- `sonner` (^1.4.0) - Toast notification system (recommended by shadcn)

**Radix UI Primitives (auto-installed by shadcn CLI):**
- `@radix-ui/react-dialog` - Modal/Dialog
- `@radix-ui/react-dropdown-menu` - Dropdown menus
- `@radix-ui/react-select` - Select dropdown
- `@radix-ui/react-checkbox` - Checkbox
- `@radix-ui/react-label` - Form labels
- `@radix-ui/react-popover` - Popover overlay
- `@radix-ui/react-toast` - Toast notifications (if using radix toast instead of sonner)
- `@radix-ui/react-slot` - Component composition utility

### File Structure After Migration

```
src/
├── components/
│   ├── ui/                          # shadcn/ui components
│   │   ├── button.tsx               # Replaces Button.tsx
│   │   ├── card.tsx                 # Replaces Card.tsx
│   │   ├── badge.tsx                # Replaces Badge.tsx
│   │   ├── skeleton.tsx             # Replaces Skeleton.tsx
│   │   ├── dialog.tsx               # Replaces GlassModal.tsx
│   │   ├── input.tsx                # NEW - form input
│   │   ├── label.tsx                # NEW - form label
│   │   ├── select.tsx               # NEW - form select
│   │   ├── checkbox.tsx             # NEW - checkbox
│   │   ├── textarea.tsx             # NEW - textarea
│   │   ├── radio-group.tsx          # NEW - radio buttons
│   │   ├── switch.tsx               # NEW - toggle switch
│   │   ├── dropdown-menu.tsx        # NEW - dropdown actions
│   │   ├── popover.tsx              # NEW - popover overlay
│   │   ├── sheet.tsx                # NEW - side panel
│   │   ├── toast.tsx                # NEW - notifications (if using radix)
│   │   ├── table.tsx                # NEW - table structure
│   │   └── index.ts                 # Re-export all UI components
│   │
│   ├── ui-custom/                   # Specialized components NOT migrated
│   │   ├── ComplianceGauge.tsx      # Custom chart (no shadcn equivalent)
│   │   ├── ProgressRing.tsx         # Custom SVG animation
│   │   ├── ProgressBar.tsx          # Custom linear progress
│   │   ├── RiskIndicator.tsx        # Custom risk visualization
│   │   ├── StatusDot.tsx            # Micro-component
│   │   ├── LegalPill.tsx            # Branding component
│   │   ├── GlassCard.tsx            # Glass morphism effect
│   │   ├── GlassBackground.tsx      # Decorative background
│   │   └── PermitUploadModal.tsx    # Specialized drag-drop modal
│   │
│   ├── Auth/
│   ├── documents/
│   ├── layout/
│   └── Storage/
│
├── features/
│   ├── dashboard/
│   ├── permits/
│   ├── locations/
│   ├── onboarding/
│   └── publicLinks/
│
├── lib/
│   ├── utils.ts                     # NEW - cn() helper from shadcn
│   ├── supabase/
│   └── api/
│
├── hooks/
├── types/
└── index.css                        # Updated with shadcn CSS variables
```

---

## Migration Strategy: Incremental by Layers

**Approach:** 4 independent sessions, each session = 1 feature branch + 1 PR + full testing

### Why Incremental by Layers?

✅ **Lower Risk:** Each layer tested independently before moving to next  
✅ **Reversible:** Each session is a separate commit - easy rollback if needed  
✅ **Natural Testing Points:** UI basics → Forms → Overlays → Cleanup  
✅ **Parallel Work Possible:** Designer can work on next layer while dev tests current  
✅ **Aligns with shadcn/ui Architecture:** shadcn installs component-by-component  

### Alternative Approaches Considered (and rejected)

❌ **Big Bang:** High risk, all-or-nothing, hard to debug  
❌ **By Features:** Visual inconsistency during migration (half-migrated features)

---

## Session 1: Setup + UI Basics

**Branch:** `feat/shadcn-session-1-ui-basics`  
**Duration:** 2-3 hours  
**Goal:** Install shadcn/ui and migrate foundational components

### Installation & Setup

**Step 1: Install shadcn/ui CLI**
```bash
npx shadcn@latest init
```

**Interactive prompts:**
- Style: `New York` (modern, clean)
- Base color: `Slate` (neutral, professional)
- CSS variables: `Yes`
- React Server Components: `No` (we're using Vite)
- TypeScript: `Yes`
- Components directory: `src/components/ui`
- Utils directory: `src/lib/utils`
- Tailwind config: Auto-detect
- CSS file: `src/index.css`

**Step 2: Install Core Components**
```bash
npx shadcn@latest add button card badge skeleton
```

This installs:
- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/skeleton.tsx`
- `src/lib/utils.ts` (cn helper)

### Theme Update

**Update `src/index.css`:**

Remove custom theme section, replace with shadcn CSS variables:

```css
@import "tailwindcss";

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... dark mode variables */
  }
}

/* Keep ONLY specialized animations */
@keyframes pulse-risk {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-pulse-risk {
  animation: pulse-risk 2s ease-in-out infinite;
}

@keyframes gauge-fill {
  from { stroke-dashoffset: var(--gauge-circumference); }
  to { stroke-dashoffset: var(--gauge-offset); }
}

.animate-gauge-fill {
  animation: gauge-fill 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

/* Remove all other custom animations and colors */
```

### Component Migration

**Move Custom Components to `ui-custom/`:**
```bash
mkdir src/components/ui-custom
mv src/components/ui/ComplianceGauge.tsx src/components/ui-custom/
mv src/components/ui/ProgressRing.tsx src/components/ui-custom/
mv src/components/ui/ProgressBar.tsx src/components/ui-custom/
mv src/components/ui/RiskIndicator.tsx src/components/ui-custom/
mv src/components/ui/StatusDot.tsx src/components/ui-custom/
mv src/components/ui/LegalPill.tsx src/components/ui-custom/
mv src/components/ui/GlassCard.tsx src/components/ui-custom/
mv src/components/ui/GlassBackground.tsx src/components/ui-custom/
mv src/components/ui/PermitUploadModal.tsx src/components/ui-custom/
```

**Delete Old Custom Components:**
```bash
rm src/components/ui/Button.tsx
rm src/components/ui/Card.tsx
rm src/components/ui/Badge.tsx
rm src/components/ui/Skeleton.tsx
```

**Update `src/components/ui/index.ts`:**
```typescript
// shadcn/ui components
export * from './button';
export * from './card';
export * from './badge';
export * from './skeleton';

// Re-export custom components
export { ComplianceGauge } from '../ui-custom/ComplianceGauge';
export { ProgressRing } from '../ui-custom/ProgressRing';
export { ProgressBar } from '../ui-custom/ProgressBar';
export { RiskIndicator } from '../ui-custom/RiskIndicator';
export { StatusDot } from '../ui-custom/StatusDot';
export { LegalPill } from '../ui-custom/LegalPill';
export { GlassCard } from '../ui-custom/GlassCard';
export { GlassBackground } from '../ui-custom/GlassBackground';
```

### Component Customization

**Customize Button variants to match current functionality:**

Edit `src/components/ui/button.tsx`:

```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

**Customize Badge for risk/status variants:**

Edit `src/components/ui/badge.tsx`:

```typescript
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Custom risk variants
        "risk-critico": "border-transparent bg-red-100 text-red-800",
        "risk-alto": "border-transparent bg-orange-100 text-orange-800",
        "risk-medio": "border-transparent bg-amber-100 text-amber-800",
        "risk-bajo": "border-transparent bg-emerald-100 text-emerald-800",
        // Custom status variants
        "status-vigente": "border-transparent bg-emerald-100 text-emerald-800",
        "status-por-vencer": "border-transparent bg-amber-100 text-amber-800",
        "status-vencido": "border-transparent bg-red-100 text-red-800",
        "status-no-registrado": "border-transparent bg-slate-100 text-slate-600",
        "status-en-tramite": "border-transparent bg-blue-100 text-blue-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);
```

### Import Updates

**Pattern to find and replace:**

```bash
# Find all files with old imports
grep -r "from '@/components/ui'" src/features src/components

# Replace pattern (manual or with sed):
# BEFORE:
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

# AFTER:
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
```

**Files to update (~80 files estimated):**
- All feature components (dashboard, permits, locations, onboarding, publicLinks)
- All modals
- All forms
- Layout components

**Note:** Import names change from PascalCase filename to camelCase:
- `Button.tsx` → `button.tsx`
- `Card.tsx` → `card.tsx`

### Testing Session 1

**Manual Testing Checklist:**

Dashboard View:
- [ ] All buttons render correctly
- [ ] Cards display with proper styling
- [ ] Badges show correct colors for risk/status
- [ ] Skeleton loaders animate during data fetch
- [ ] Hover states work on interactive elements
- [ ] Click handlers fire correctly

Location Detail View:
- [ ] Location cards render
- [ ] Permits table displays
- [ ] Action buttons (Generar Link, Renovar) work
- [ ] Risk badges show correct colors

Permit Detail View:
- [ ] Permit info cards render
- [ ] Status badges display correctly
- [ ] Version history renders
- [ ] Documents list displays

**Acceptance Criteria:**
- ✅ All views render without errors
- ✅ No TypeScript errors
- ✅ Buttons, cards, badges visually match or improve on original
- ✅ No regressions in functionality
- ✅ Responsive design maintained (mobile, tablet, desktop)

---

## Session 2: Forms

**Branch:** `feat/shadcn-session-2-forms`  
**Duration:** 2-3 hours  
**Goal:** Replace all raw HTML form inputs with shadcn/ui form components

### Install Form Components

```bash
npx shadcn@latest add input label select checkbox textarea radio-group switch
```

This installs:
- `src/components/ui/input.tsx`
- `src/components/ui/label.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/checkbox.tsx`
- `src/components/ui/textarea.tsx`
- `src/components/ui/radio-group.tsx`
- `src/components/ui/switch.tsx`

Optional (recommended for advanced form handling):
```bash
npx shadcn@latest add form
```

This installs React Hook Form integration with Zod validation.

### Form Component Updates

**Files with raw HTML forms to migrate:**

1. **RenewPermitModal** (`src/features/permits/RenewPermitModal.tsx`)
   - Replace `<input>` with `<Input>`
   - Replace `<input type="file">` with custom file input wrapper
   - Add `<Label>` for each field
   - Add error states with form validation

2. **GeneratePublicLinkModal** (`src/features/publicLinks/GeneratePublicLinkModal.tsx`)
   - Replace `<input>` with `<Input>`
   - Replace radio buttons with `<RadioGroup>`
   - Add `<Label>` components

3. **OnboardingWizard Steps** (4 files)
   - Step 1 (`Step1Company.tsx`): Company name, business type (Select), city (Input)
   - Step 2 (`Step2Regulatory.tsx`): Checkboxes for regulatory factors
   - Step 3 (`Step3Locations.tsx`): Location inputs (name, address) repeated
   - Step 4 (`Step4Review.tsx`): Review only, no inputs

4. **DocumentUpload** (`src/components/documents/DocumentUpload.tsx`)
   - File input wrapper (keep custom for drag-drop)
   - Add better file input styling

5. **Login Form** (`src/components/Auth/LoginForm.tsx`)
   - Email input → `<Input type="email">`
   - Password input → `<Input type="password">`
   - Add proper labels

### Migration Pattern Example

**BEFORE (raw HTML):**
```tsx
<div className="space-y-2">
  <label className="text-sm font-medium">Número de Permiso</label>
  <input
    type="text"
    value={formData.permit_number}
    onChange={(e) => setFormData({ ...formData, permit_number: e.target.value })}
    className="w-full px-3 py-2 border rounded-md"
  />
  {errors.permit_number && (
    <p className="text-sm text-red-600">{errors.permit_number}</p>
  )}
</div>
```

**AFTER (shadcn/ui):**
```tsx
<div className="space-y-2">
  <Label htmlFor="permit_number">Número de Permiso</Label>
  <Input
    id="permit_number"
    value={formData.permit_number}
    onChange={(e) => setFormData({ ...formData, permit_number: e.target.value })}
    className={errors.permit_number ? "border-red-500" : ""}
  />
  {errors.permit_number && (
    <p className="text-sm text-destructive">{errors.permit_number}</p>
  )}
</div>
```

**EVEN BETTER (with Form component + React Hook Form):**
```tsx
<Form {...form}>
  <FormField
    control={form.control}
    name="permit_number"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Número de Permiso</FormLabel>
        <FormControl>
          <Input {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
</Form>
```

### Select Component Updates

**BEFORE (raw HTML select):**
```tsx
<select
  value={formData.business_type}
  onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
  className="w-full px-3 py-2 border rounded-md"
>
  <option value="">Selecciona...</option>
  <option value="retail">Retail</option>
  <option value="manufactura">Manufactura</option>
</select>
```

**AFTER (shadcn Select):**
```tsx
<Select value={formData.business_type} onValueChange={(value) => setFormData({ ...formData, business_type: value })}>
  <SelectTrigger>
    <SelectValue placeholder="Selecciona..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="retail">Retail</SelectItem>
    <SelectItem value="manufactura">Manufactura</SelectItem>
  </SelectContent>
</Select>
```

### Checkbox Updates

**BEFORE (raw HTML checkbox):**
```tsx
<label className="flex items-center gap-2">
  <input
    type="checkbox"
    checked={formData.alimentos}
    onChange={(e) => setFormData({ ...formData, alimentos: e.target.checked })}
  />
  <span>Alimentos</span>
</label>
```

**AFTER (shadcn Checkbox):**
```tsx
<div className="flex items-center gap-2">
  <Checkbox
    id="alimentos"
    checked={formData.alimentos}
    onCheckedChange={(checked) => setFormData({ ...formData, alimentos: checked })}
  />
  <Label htmlFor="alimentos">Alimentos</Label>
</div>
```

### Testing Session 2

**Manual Testing Checklist:**

Onboarding Wizard:
- [ ] Step 1: Company info inputs work
- [ ] Step 2: Checkboxes toggle correctly
- [ ] Step 3: Location inputs accept text
- [ ] Step 4: Review displays entered data
- [ ] Navigation (Next/Back) works
- [ ] Form validation shows errors

Renew Permit Modal:
- [ ] All inputs editable
- [ ] File upload works
- [ ] Date pickers function (if using)
- [ ] Validation prevents invalid submissions
- [ ] Form submits correctly

Login Form:
- [ ] Email/password inputs work
- [ ] Validation shows for invalid emails
- [ ] Submit button triggers login

**Acceptance Criteria:**
- ✅ All forms functional
- ✅ Validation works consistently
- ✅ Better keyboard navigation (Tab through inputs)
- ✅ Labels associated with inputs (accessibility)
- ✅ Error states visible and clear
- ✅ No TypeScript errors

---

## Session 3: Overlays & Interactions

**Branch:** `feat/shadcn-session-3-overlays`  
**Duration:** 1.5-2 hours  
**Goal:** Replace custom modals and notifications with shadcn/ui components

### Install Overlay Components

```bash
npx shadcn@latest add dialog sheet popover dropdown-menu
npm install sonner
```

This installs:
- `src/components/ui/dialog.tsx`
- `src/components/ui/sheet.tsx`
- `src/components/ui/popover.tsx`
- `src/components/ui/dropdown-menu.tsx`
- `sonner` package (toast notifications)

### Modal Migration (GlassModal → Dialog)

**Files with GlassModal:**
1. `RenewPermitModal.tsx`
2. `GeneratePublicLinkModal.tsx`
3. `PublicLinkSuccessModal.tsx`
4. Any other modal wrappers

**BEFORE (GlassModal):**
```tsx
<GlassModal isOpen={isOpen} onClose={onClose} title="Renovar Permiso">
  <div className="p-6">
    {/* content */}
  </div>
</GlassModal>
```

**AFTER (Dialog):**
```tsx
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Renovar Permiso</DialogTitle>
      <DialogDescription>
        Actualiza los datos del permiso y sube el nuevo documento.
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-4">
      {/* content */}
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={onClose}>Cancelar</Button>
      <Button onClick={handleSubmit}>Renovar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Key Improvements:**
- Auto-focus management
- ESC key to close
- Click outside to close
- Keyboard trap (Tab cycles through modal only)
- Better ARIA labels
- DialogDescription for screen readers

### Toast Notifications (GlassNotification → Sonner)

**Setup Sonner Provider:**

In `src/App.tsx`:
```tsx
import { Toaster } from 'sonner';

function App() {
  return (
    <>
      <Toaster position="top-right" richColors />
      {/* ... rest of app */}
    </>
  );
}
```

**BEFORE (GlassNotification):**
```tsx
{showNotification && (
  <div className="fixed top-4 right-4 z-50">
    <GlassNotification
      type="success"
      title="Éxito"
      message="Permiso renovado exitosamente"
      onClose={() => setShowNotification(false)}
    />
  </div>
)}
```

**AFTER (Sonner toast):**
```tsx
import { toast } from 'sonner';

// Trigger toast
toast.success('Permiso renovado exitosamente');

// With description
toast.success('Permiso renovado', {
  description: 'El permiso ha sido actualizado correctamente',
});

// Error toast
toast.error('Error al renovar permiso', {
  description: error.message,
});

// With action button
toast.success('Link generado', {
  description: 'El link público ha sido creado',
  action: {
    label: 'Ver',
    onClick: () => navigate(`/p/${token}`),
  },
});
```

**Key Improvements:**
- Auto-dismiss after 4 seconds
- Stack multiple toasts
- Queue management
- Swipe to dismiss
- Rich actions (buttons, links)
- Position control

### Remove Old Notification Components

```bash
rm src/components/ui/GlassNotification.tsx
rm src/components/ui/GlassModal.tsx
```

Update all references to use Dialog and toast instead.

### Dropdown Menu (Optional Enhancement)

Add dropdown menus for action buttons:

**Example: Permit row actions**

**BEFORE (inline buttons):**
```tsx
<div className="flex gap-2">
  <button onClick={handleRenew}>Renovar</button>
  <button onClick={handleView}>Ver</button>
  <button onClick={handleDelete}>Eliminar</button>
</div>
```

**AFTER (DropdownMenu):**
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreVertical className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={handleRenew}>
      <RefreshCw className="mr-2 h-4 w-4" />
      Renovar
    </DropdownMenuItem>
    <DropdownMenuItem onClick={handleView}>
      <Eye className="mr-2 h-4 w-4" />
      Ver Detalles
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={handleDelete} className="text-destructive">
      <Trash2 className="mr-2 h-4 w-4" />
      Eliminar
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**Benefits:**
- Less visual clutter
- More actions without taking space
- Better mobile experience

### Testing Session 3

**Manual Testing Checklist:**

Modals:
- [ ] All modals open/close correctly
- [ ] ESC key closes modal
- [ ] Click outside closes modal
- [ ] Tab navigation stays within modal
- [ ] Focus returns to trigger after close
- [ ] Modal content scrolls if too tall

Notifications:
- [ ] Success toasts appear
- [ ] Error toasts appear
- [ ] Multiple toasts stack correctly
- [ ] Toasts auto-dismiss after 4s
- [ ] Swipe to dismiss works (mobile)
- [ ] Action buttons in toasts work

Dropdown Menus (if implemented):
- [ ] Dropdown opens on click
- [ ] Items trigger correct actions
- [ ] Keyboard navigation (arrows, Enter)
- [ ] Closes on selection
- [ ] Closes on outside click

**Acceptance Criteria:**
- ✅ All modals functional and accessible
- ✅ Toast system working for all notifications
- ✅ Better keyboard navigation
- ✅ Improved mobile experience
- ✅ No console errors
- ✅ TypeScript compiles

---

## Session 4: Cleanup + Theme Final + Optimizations

**Branch:** `feat/shadcn-session-4-cleanup`  
**Duration:** 1-2 hours  
**Goal:** Final cleanup, optimization, and polish

### Cleanup Tasks

1. **Delete unused custom components:**
   ```bash
   # Verify no references first
   grep -r "GlassNotification" src/
   grep -r "GlassModal" src/
   grep -r "from '@/components/ui/Button'" src/
   
   # If no references, delete
   rm src/components/ui-custom/GlassCard.tsx # if not used
   ```

2. **Consolidate `ui-custom/` directory:**
   - Keep only truly custom components
   - Update `src/components/ui/index.ts` to remove deleted components

3. **Clean up CSS:**
   - Remove unused custom animations from `src/index.css`
   - Keep only:
     - `animate-pulse-risk` (for critical alerts)
     - `animate-gauge-fill` (for ComplianceGauge)
     - Any animations used by custom components
   - Remove:
     - `login-float` animations (if login redesigned)
     - `glow-emerald`, `glow-red` (if not used)
     - `animate-blob` (if not used)

### Theme Refinement

**Adjust shadcn theme colors if needed:**

Edit `src/index.css` CSS variables:

```css
:root {
  /* Primary: Blue (adjust if needed) */
  --primary: 221.2 83.2% 53.3%;
  
  /* Destructive: Red (keep for errors) */
  --destructive: 0 84.2% 60.2%;
  
  /* Border: Subtle gray (adjust contrast) */
  --border: 214.3 31.8% 91.4%;
  
  /* Radius: Rounded corners (adjust to taste) */
  --radius: 0.5rem; /* or 0.75rem for more rounded */
}
```

**Test theme in light mode:**
- Check contrast ratios (WCAG AA: 4.5:1 for text)
- Verify all badges are readable
- Test on different monitors/brightness

### TypeScript Strict Mode

**Enable strict checks:**

In `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

Fix any TypeScript errors that surface.

### Accessibility Audit

**Manual checks:**

1. **Keyboard Navigation:**
   - [ ] Tab through all interactive elements
   - [ ] Visible focus indicators
   - [ ] No keyboard traps (except modals)
   - [ ] Shortcuts work (ESC closes modals)

2. **Screen Reader (NVDA/JAWS):**
   - [ ] Buttons announce correctly
   - [ ] Form labels read properly
   - [ ] Modal titles announced
   - [ ] Error messages announced

3. **Color Contrast:**
   - [ ] Text meets WCAG AA (4.5:1)
   - [ ] Badges readable on backgrounds
   - [ ] Links distinguishable from text

4. **Focus Management:**
   - [ ] Focus moves to modal on open
   - [ ] Focus returns to trigger on close
   - [ ] Skip links present (if needed)

### Performance Optimization

**Bundle Size Check:**
```bash
npm run build
npx vite-bundle-visualizer
```

**Verify:**
- [ ] Radix UI components tree-shaken (only used components bundled)
- [ ] No duplicate dependencies (clsx vs classnames)
- [ ] Framer Motion still optimized

**Expected bundle size:**
- Before migration: ~XXX KB
- After migration: Similar or smaller (shadcn is lightweight)
- If larger: investigate duplicate dependencies

### Documentation

**Update component documentation:**

Create `docs/COMPONENT_GUIDE.md`:
```markdown
# Component Guide

## UI Components (shadcn/ui)

### Button
Import: `import { Button } from '@/components/ui/button'`
Variants: `default`, `secondary`, `outline`, `ghost`, `destructive`
Sizes: `default`, `sm`, `lg`, `icon`

### Card
Import: `import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'`
Usage: Wraps content with consistent styling

### Dialog
Import: `import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'`
Usage: Replace all modal usages

### Input
Import: `import { Input } from '@/components/ui/input'`
Usage: All text inputs

## Custom Components (ui-custom/)

### ComplianceGauge
Usage: Circular progress chart for compliance percentage
Props: `value: number (0-100), size: 'sm' | 'md' | 'lg'`

### RiskIndicator
Usage: Visual risk level indicator
Props: `level: 'critico' | 'alto' | 'medio' | 'bajo'`
```

### Final Testing

**Regression Testing - Full App Flows:**

1. **Onboarding Flow:**
   - [ ] Start onboarding
   - [ ] Fill all 4 steps
   - [ ] Submit and see dashboard
   - [ ] Verify data saved correctly

2. **Permit Management:**
   - [ ] View permit list
   - [ ] Click permit details
   - [ ] Renew permit
   - [ ] Upload document
   - [ ] View version history

3. **Location Management:**
   - [ ] View location detail
   - [ ] See permits table
   - [ ] Generate public link
   - [ ] View QR code modal
   - [ ] Deactivate link

4. **Public Verification:**
   - [ ] Open public link (no auth)
   - [ ] Verify vigentes display
   - [ ] Check mobile view

5. **Notifications:**
   - [ ] Success toast on actions
   - [ ] Error toast on failures
   - [ ] Multiple toasts stack

**Browser Testing:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

**Acceptance Criteria:**
- ✅ All features work identically to pre-migration
- ✅ No console errors or warnings
- ✅ TypeScript compiles with no errors
- ✅ Bundle size acceptable
- ✅ Performance metrics maintained
- ✅ Accessibility improved
- ✅ Documentation updated

---

## UI Redesign Opportunities

During migration, consider these visual improvements:

### 1. Dashboard Hero Cards

**Current:** Flat cards with metrics  
**Opportunity:** Add depth with Card composition

```tsx
<Card>
  <CardHeader>
    <CardTitle>Compliance</CardTitle>
    <CardDescription>Estado actual de permisos</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="text-4xl font-bold">83%</div>
    <p className="text-sm text-muted-foreground">10 de 12 vigentes</p>
  </CardContent>
  <CardFooter>
    <Button variant="outline" size="sm">Ver detalles</Button>
  </CardFooter>
</Card>
```

### 2. Table Actions with Dropdown

**Current:** Multiple inline buttons  
**Opportunity:** Consolidate with DropdownMenu

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreVertical />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Ver detalles</DropdownMenuItem>
    <DropdownMenuItem>Renovar</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-destructive">
      Eliminar
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### 3. Empty States with Illustrations

**Current:** Simple text  
**Opportunity:** Add visual appeal

```tsx
<Card className="flex flex-col items-center justify-center p-12">
  <FileQuestion className="h-16 w-16 text-muted-foreground mb-4" />
  <CardTitle>No hay permisos registrados</CardTitle>
  <CardDescription className="text-center mt-2">
    Agrega tu primer permiso para comenzar el seguimiento
  </CardDescription>
  <Button className="mt-6">
    <Plus className="mr-2 h-4 w-4" />
    Agregar Permiso
  </Button>
</Card>
```

### 4. Form Layout Improvements

**Current:** Stacked inputs  
**Opportunity:** Grid layout for better space usage

```tsx
<div className="grid grid-cols-2 gap-4">
  <div className="space-y-2">
    <Label>Fecha Emisión</Label>
    <Input type="date" />
  </div>
  <div className="space-y-2">
    <Label>Fecha Vencimiento</Label>
    <Input type="date" />
  </div>
</div>
```

### 5. Badge Consistency

**Current:** Various custom colors  
**Opportunity:** Standardize with variants

Risk levels:
- `variant="risk-critico"` → Red
- `variant="risk-alto"` → Orange
- `variant="risk-medio"` → Amber
- `variant="risk-bajo"` → Green

Status:
- `variant="status-vigente"` → Green
- `variant="status-por-vencer"` → Amber
- `variant="status-vencido"` → Red

### 6. Hover States & Micro-interactions

**Opportunity:** Add subtle interactions

```tsx
<Card className="hover:shadow-lg transition-shadow cursor-pointer">
  {/* content */}
</Card>
```

Button loading states:
```tsx
<Button disabled={isLoading}>
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  Guardar
</Button>
```

---

## Quality Assurance Strategy

### Testing After Each Session

**Functional Testing:**
1. Click all buttons → verify they trigger correct actions
2. Fill all forms → verify submissions work
3. Open all modals → verify they display correctly
4. Trigger notifications → verify they appear and dismiss

**Visual Testing:**
1. Responsive breakpoints (mobile: 375px, tablet: 768px, desktop: 1440px)
2. Hover states on interactive elements
3. Focus states (Tab through page)
4. Loading states (spinners, skeletons)

**Accessibility Testing:**
1. Keyboard-only navigation (no mouse)
2. Screen reader testing (NVDA on Windows, VoiceOver on Mac)
3. Color contrast checker (WebAIM)
4. Focus order logical

**Performance Testing:**
1. Lighthouse audit (target: 90+ performance score)
2. Bundle size (should not increase significantly)
3. First Contentful Paint (FCP) < 1.8s
4. Time to Interactive (TTI) < 3.8s

### Rollback Strategy

Each session = 1 feature branch:
- `feat/shadcn-session-1-ui-basics`
- `feat/shadcn-session-2-forms`
- `feat/shadcn-session-3-overlays`
- `feat/shadcn-session-4-cleanup`

**If Session N fails:**
1. Do NOT merge the branch
2. Create a fix branch: `fix/shadcn-session-N-fixes`
3. Fix issues
4. Re-test
5. Merge when stable

**If critical bug post-merge:**
1. Revert the merge commit: `git revert <commit-hash>`
2. Create hotfix branch
3. Fix and re-deploy

### Success Criteria

**Functional:**
- ✅ All existing features work identically
- ✅ No regressions in user flows
- ✅ Forms validate correctly
- ✅ Modals open/close properly
- ✅ Notifications appear correctly

**Visual:**
- ✅ Modern, consistent design
- ✅ Proper spacing and alignment
- ✅ Responsive on all devices
- ✅ Smooth animations and transitions
- ✅ Professional appearance

**Technical:**
- ✅ TypeScript compiles without errors
- ✅ No console errors or warnings
- ✅ Bundle size reasonable (<500KB increase)
- ✅ Lighthouse score maintained (90+)
- ✅ All dependencies up to date

**Accessibility:**
- ✅ WCAG AA compliant (color contrast 4.5:1)
- ✅ Keyboard navigation works
- ✅ Screen reader friendly
- ✅ Focus indicators visible
- ✅ ARIA labels present

**Developer Experience:**
- ✅ Components easy to use
- ✅ Good TypeScript types
- ✅ Consistent patterns
- ✅ Well documented
- ✅ Easy to extend

---

## Risk Assessment & Mitigation

### High Risk Items

**1. Breaking Changes in Component APIs**

**Risk:** shadcn components have different props than custom components  
**Impact:** High - could break many views  
**Mitigation:**
- Map old props to new props in a compatibility layer temporarily
- Update one component type at a time
- Test thoroughly before moving to next component

**2. CSS Variable Conflicts**

**Risk:** shadcn CSS variables conflict with existing custom variables  
**Impact:** Medium - visual bugs, inconsistent theming  
**Mitigation:**
- Namespace custom variables: `--enregla-*`
- Remove custom variables gradually
- Test theme in light/dark mode

**3. Bundle Size Increase**

**Risk:** Adding Radix UI increases bundle size  
**Impact:** Medium - slower load times  
**Mitigation:**
- Use tree-shaking (Vite already does this)
- Lazy load modals and overlays
- Monitor bundle size with each session
- Remove unused dependencies

**4. Accessibility Regressions**

**Risk:** New components have different keyboard behavior  
**Impact:** High - breaks accessibility  
**Mitigation:**
- Test keyboard navigation after each session
- Use screen reader to test
- Follow Radix UI accessibility docs
- Don't override default Radix behaviors

### Medium Risk Items

**1. Form Validation Breaking**

**Risk:** New form components handle validation differently  
**Impact:** Medium - forms don't submit or show errors  
**Mitigation:**
- Keep existing validation logic
- Map validation to new component error states
- Test all forms thoroughly

**2. Modal Focus Management**

**Risk:** Dialog component changes focus behavior  
**Impact:** Medium - keyboard traps, focus loss  
**Mitigation:**
- Let Radix handle focus (don't override)
- Test ESC key, Tab cycling
- Verify focus returns after close

**3. Mobile Responsiveness**

**Risk:** New components have different mobile behavior  
**Impact:** Medium - mobile UX degraded  
**Mitigation:**
- Test on real mobile devices
- Use responsive variants where available
- Adjust spacing for mobile

### Low Risk Items

**1. TypeScript Errors**

**Risk:** Type mismatches with new components  
**Impact:** Low - compilation errors catch issues early  
**Mitigation:**
- Fix TypeScript errors as they appear
- Use `any` sparingly and temporarily
- Update types incrementally

**2. Animation Conflicts**

**Risk:** Framer Motion conflicts with Radix animations  
**Impact:** Low - visual jank  
**Mitigation:**
- Let Radix handle its own animations
- Keep Framer Motion for page transitions only
- Don't double-animate components

---

## Timeline & Resources

### Estimated Timeline

| Session | Duration | Dependencies | Parallelizable? |
|---------|----------|--------------|-----------------|
| Session 1: UI Basics | 2-3 hours | None | No |
| Session 2: Forms | 2-3 hours | Session 1 complete | No |
| Session 3: Overlays | 1.5-2 hours | Session 1, 2 complete | No |
| Session 4: Cleanup | 1-2 hours | Session 1, 2, 3 complete | No |
| **Total** | **7-10 hours** | Sequential | No |

**Why sequential?**
- Each session builds on the previous
- Testing must happen between sessions
- Risk of conflicts if done in parallel

### Team Resources

**Required:**
- 1 Frontend Developer (full-time for each session)
- 1 QA Tester (part-time after each session)

**Optional:**
- 1 Designer (for UI redesign opportunities)
- 1 Accessibility Expert (for WCAG audit)

### Dependencies

**External:**
- shadcn/ui CLI availability
- npm registry access
- Radix UI package availability

**Internal:**
- No other feature work during migration (code freeze)
- Staging environment for testing
- Design approval for visual changes

---

## Maintenance & Future Considerations

### Component Update Strategy

**shadcn/ui updates:**
- Components are copied into codebase (not npm packages)
- Updates are manual: re-run `npx shadcn@latest add <component>`
- Review diffs before accepting updates
- Test after updating any component

**Custom components:**
- Keep in `ui-custom/` directory
- Document why they're custom (no shadcn equivalent)
- Refactor to shadcn if equivalent becomes available

### Adding New Components

**When adding new shadcn components:**
```bash
# Install component
npx shadcn@latest add <component-name>

# Update exports
# Add to src/components/ui/index.ts
export * from './<component-name>';

# Test in isolation first
# Then integrate into feature
```

**When creating new custom components:**
```bash
# Create in ui-custom/
touch src/components/ui-custom/NewComponent.tsx

# Export from ui/index.ts
export { NewComponent } from '../ui-custom/NewComponent';

# Document in COMPONENT_GUIDE.md
```

### Dark Mode (Future Enhancement)

shadcn/ui supports dark mode out of the box:

1. Add theme provider:
```tsx
import { ThemeProvider } from '@/components/theme-provider';

<ThemeProvider defaultTheme="light" storageKey="enregla-theme">
  <App />
</ThemeProvider>
```

2. Toggle theme:
```tsx
<Button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
  Toggle Theme
</Button>
```

3. CSS variables automatically switch (already defined in `src/index.css`)

### Accessibility Ongoing

**Regular audits:**
- Run Lighthouse accessibility audit monthly
- Test with screen reader quarterly
- Review WCAG compliance annually

**Checklist for new features:**
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] ARIA labels present
- [ ] Color contrast meets WCAG AA
- [ ] Forms have associated labels

---

## Appendix

### Component Mapping Table (Complete)

| Current Custom | shadcn/ui | Migration Complexity | Notes |
|----------------|-----------|---------------------|-------|
| Button.tsx | button.tsx | Low | Direct replacement, map variants |
| Card.tsx | card.tsx | Low | Simpler API, refactor usage |
| Badge.tsx | badge.tsx | Medium | Add custom variants for risk/status |
| Skeleton.tsx | skeleton.tsx | Low | Direct replacement |
| EmptyState.tsx | Custom hybrid | Medium | Build on Card, keep custom logic |
| GlassModal.tsx | dialog.tsx | Medium | Refactor all modal usages |
| GlassNotification.tsx | sonner (toast) | Medium | Refactor all notification calls |
| GlassCard.tsx | Keep custom | N/A | No shadcn equivalent |
| GlassBackground.tsx | Keep custom | N/A | Decorative component |
| StatusDot.tsx | Keep custom | N/A | Micro-component |
| LegalPill.tsx | Keep custom | N/A | Branding component |
| ProgressBar.tsx | Keep custom | N/A | Custom logic, could use progress.tsx |
| ProgressRing.tsx | Keep custom | N/A | SVG animation custom |
| ComplianceGauge.tsx | Keep custom | N/A | Chart component |
| RiskIndicator.tsx | Keep custom | N/A | Custom visualization |
| PermitUploadModal.tsx | Keep custom | N/A | Specialized drag-drop |
| N/A | input.tsx | Low | New component |
| N/A | label.tsx | Low | New component |
| N/A | select.tsx | Medium | New component, complex API |
| N/A | checkbox.tsx | Low | New component |
| N/A | textarea.tsx | Low | New component |
| N/A | radio-group.tsx | Low | New component |
| N/A | switch.tsx | Low | New component |
| N/A | dropdown-menu.tsx | Medium | New component, enhancement |
| N/A | popover.tsx | Medium | New component, enhancement |
| N/A | sheet.tsx | Low | New component, future use |
| N/A | table.tsx | Medium | New component, enhance tables |

### shadcn/ui CLI Commands Reference

```bash
# Initialize shadcn/ui in project
npx shadcn@latest init

# Add individual component
npx shadcn@latest add button

# Add multiple components
npx shadcn@latest add button card badge

# Add all form components
npx shadcn@latest add input label select checkbox textarea radio-group switch form

# Add all overlay components
npx shadcn@latest add dialog sheet popover dropdown-menu

# Update component (re-download)
npx shadcn@latest add button --overwrite

# List available components
npx shadcn@latest add

# Show component diff before adding
npx shadcn@latest diff button
```

### Useful Links

- shadcn/ui Documentation: https://ui.shadcn.com/docs
- Radix UI Documentation: https://www.radix-ui.com/docs/primitives
- Class Variance Authority: https://cva.style/docs
- Sonner (Toast): https://sonner.emilkowal.ski/
- Tailwind CSS Variables: https://tailwindcss.com/docs/customizing-colors#using-css-variables

---

## Approval & Sign-off

**Design Approved By:** [User]  
**Date:** 2026-04-13  
**Next Step:** Invoke `writing-plans` skill to create implementation plan

---

**End of Specification**
