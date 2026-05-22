# Mobile Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the entire authenticated EnRegla app fully responsive at 360px+ viewports with a bottom-tab navigation pattern, eliminating horizontal scroll and properly stacking action buttons, while preserving the existing desktop UX (≥1024px).

**Architecture:** Mobile-first refactor of `AppLayout` to introduce a fixed bottom-tab navigation (Dashboard / Sedes / Permisos / Renovaciones / Más) on viewports `<lg`, with a sheet drawer for the "Más" overflow menu. Existing pages get responsive layout fixes — stacked CTAs, single-column grids, card lists replacing wide tables, and a few fixed-width components (NotificationBell popover, NetworkMap legend, Dashboard hero grid) made fluid. No new tokens, no new dependencies.

**Tech Stack:** React 18 + TypeScript + Vite, Tailwind CSS (defaults: sm=640, md=768, lg=1024, xl=1280), custom `--ds-*` tokens, Lucide icons via `@/lib/lucide-icons`, `react-router-dom`.

---

## File Structure

**New files:**
- `src/components/layout/MobileBottomNav.tsx` — fixed bottom tab bar (5 items, visible `<lg`)
- `src/components/layout/MoreSheet.tsx` — bottom sheet for overflow menu items (Mapa, Marco Legal, Configuración, perfil, logout)
- `src/components/ui/sheet.tsx` — generic bottom sheet primitive (used by MoreSheet, NotificationBell mobile, NetworkMap legend)
- `src/features/permits/PermitCardList.tsx` — mobile alternative to PermitTable (card per permit)
- `src/features/legal/LegalMatrixAccordion.tsx` — mobile alternative to LegalMatrixView table
- `tests/components/MobileBottomNav.test.tsx`
- `tests/components/MoreSheet.test.tsx`
- `tests/components/Sheet.test.tsx`

**Modified files:**
- `src/components/layout/AppLayout.tsx` — hide sidebar+hamburger on `<lg`, add MobileBottomNav, add bottom padding to main, simplify mobile header
- `src/features/dashboard/DashboardView.tsx` — stack header CTAs, fluid hero grid, responsive gauge
- `src/features/permits/PermitListView.tsx` — switch to PermitCardList on `<md`
- `src/features/permits/PermitTableFilters.tsx` — collapsible filters, stack on mobile
- `src/features/permits/PermitDetailView.tsx` — stack action buttons
- `src/features/permits/PermitCreateView.tsx` — `grid-cols-1 sm:grid-cols-2`
- `src/features/renewals/RenewalGridView.tsx` — `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- `src/features/locations/LocationDetailView.tsx` — stack action buttons, KPI grid `grid-cols-1 sm:grid-cols-3`
- `src/features/legal/LegalMatrixView.tsx` — render LegalMatrixAccordion on `<md`
- `src/features/legal/LegalIndexView.tsx` — `grid-cols-1 sm:grid-cols-2`
- `src/features/network/NetworkMapPage.tsx` — legend as bottom sheet on mobile, `100dvh` height
- `src/features/settings/SettingsView.tsx` — verify tabs scroll/stack
- `src/components/NotificationBell.tsx` — full-width sheet on `<sm`
- `src/components/layout/TrialBanner.tsx` — remove `whitespace-nowrap`
- `src/components/ui/empty-state.tsx` — responsive padding (verify)

---

## Task 1: Create generic Sheet primitive

**Files:**
- Create: `src/components/ui/sheet.tsx`
- Test: `tests/components/Sheet.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// tests/components/Sheet.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Sheet } from '@/components/ui/sheet'

describe('Sheet', () => {
  it('renders content when open', () => {
    render(<Sheet open={true} onOpenChange={() => {}} side="bottom"><p>hello</p></Sheet>)
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<Sheet open={false} onOpenChange={() => {}} side="bottom"><p>hello</p></Sheet>)
    expect(screen.queryByText('hello')).not.toBeInTheDocument()
  })

  it('calls onOpenChange(false) when overlay clicked', () => {
    const onChange = vi.fn()
    render(<Sheet open={true} onOpenChange={onChange} side="bottom"><p>x</p></Sheet>)
    fireEvent.click(screen.getByTestId('sheet-overlay'))
    expect(onChange).toHaveBeenCalledWith(false)
  })

  it('calls onOpenChange(false) on Escape', () => {
    const onChange = vi.fn()
    render(<Sheet open={true} onOpenChange={onChange} side="bottom"><p>x</p></Sheet>)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onChange).toHaveBeenCalledWith(false)
  })
})
```

- [ ] **Step 2: Run test, verify fail**

Run: `npx vitest run tests/components/Sheet.test.tsx`
Expected: FAIL — module `@/components/ui/sheet` not found

- [ ] **Step 3: Implement Sheet**

```tsx
// src/components/ui/sheet.tsx
import { useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  side?: 'bottom' | 'top' | 'left' | 'right'
  children: ReactNode
  className?: string
  ariaLabel?: string
}

export function Sheet({ open, onOpenChange, side = 'bottom', children, className, ariaLabel }: SheetProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onOpenChange])

  if (!open) return null

  const sideClasses: Record<string, string> = {
    bottom: 'bottom-0 left-0 right-0 rounded-t-[var(--ds-radius-300)] max-h-[85dvh]',
    top: 'top-0 left-0 right-0 rounded-b-[var(--ds-radius-300)] max-h-[85dvh]',
    left: 'top-0 bottom-0 left-0 w-[85vw] max-w-sm',
    right: 'top-0 bottom-0 right-0 w-[85vw] max-w-sm',
  }

  const animClasses: Record<string, string> = {
    bottom: 'animate-[slideUp_220ms_ease-out]',
    top: 'animate-[slideDown_220ms_ease-out]',
    left: 'animate-[slideRight_220ms_ease-out]',
    right: 'animate-[slideLeft_220ms_ease-out]',
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={ariaLabel}>
      <div
        data-testid="sheet-overlay"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm motion-reduce:transition-none"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div
        className={cn(
          'absolute bg-[var(--ds-neutral-0)] shadow-[var(--ds-shadow-overlay)] flex flex-col overflow-hidden motion-reduce:animate-none',
          sideClasses[side],
          animClasses[side],
          className,
        )}
        style={{ paddingBottom: side === 'bottom' ? 'env(safe-area-inset-bottom, 0px)' : undefined }}
      >
        {children}
      </div>
    </div>
  )
}
```

Add keyframes to `src/index.css` if missing:

```css
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
@keyframes slideDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }
@keyframes slideLeft { from { transform: translateX(100%); } to { transform: translateX(0); } }
@keyframes slideRight { from { transform: translateX(-100%); } to { transform: translateX(0); } }
```

- [ ] **Step 4: Run test, verify pass**

Run: `npx vitest run tests/components/Sheet.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/sheet.tsx tests/components/Sheet.test.tsx src/index.css
git commit -m "feat(ui): add Sheet primitive for mobile sheets"
```

---

## Task 2: Create MobileBottomNav component

**Files:**
- Create: `src/components/layout/MobileBottomNav.tsx`
- Test: `tests/components/MobileBottomNav.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// tests/components/MobileBottomNav.test.tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'

const wrapper = (path: string) => ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
)

describe('MobileBottomNav', () => {
  it('renders 5 tab items', () => {
    render(<MobileBottomNav onMoreClick={() => {}} />, { wrapper: wrapper('/') })
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sedes/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /permisos/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /renovaciones/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /más/i })).toBeInTheDocument()
  })

  it('marks current route with aria-current', () => {
    render(<MobileBottomNav onMoreClick={() => {}} />, { wrapper: wrapper('/permisos') })
    const link = screen.getByRole('link', { name: /permisos/i })
    expect(link).toHaveAttribute('aria-current', 'page')
  })

  it('calls onMoreClick when more button clicked', () => {
    const onMore = vi.fn()
    render(<MobileBottomNav onMoreClick={onMore} />, { wrapper: wrapper('/') })
    screen.getByRole('button', { name: /más/i }).click()
    expect(onMore).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test, verify fail**

Run: `npx vitest run tests/components/MobileBottomNav.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement MobileBottomNav**

```tsx
// src/components/layout/MobileBottomNav.tsx
import { Link, useLocation } from 'react-router-dom'
import { Home, MapPin, FileText, CalendarClock, MoreHorizontal } from '@/lib/lucide-icons'
import { cn } from '@/lib/utils'

interface TabItem {
  to: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean }>
}

const TABS: TabItem[] = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/sedes', label: 'Sedes', icon: MapPin },
  { to: '/permisos', label: 'Permisos', icon: FileText },
  { to: '/renovaciones', label: 'Renovaciones', icon: CalendarClock },
]

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-background-brand)] focus-visible:ring-offset-1'

export interface MobileBottomNavProps {
  onMoreClick: () => void
}

export function MobileBottomNav({ onMoreClick }: MobileBottomNavProps) {
  const location = useLocation()
  const basePath = '/' + location.pathname.split('/').filter(Boolean).slice(0, 1).join('/')

  return (
    <nav
      role="navigation"
      aria-label="Navegación principal"
      className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-[var(--ds-neutral-0)] border-t border-[var(--ds-border)] shadow-[var(--ds-shadow-raised)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <ul className="grid grid-cols-5 list-none m-0 p-0">
        {TABS.map(tab => {
          const active = basePath === tab.to
          const Icon = tab.icon
          return (
            <li key={tab.to}>
              <Link
                to={tab.to}
                aria-current={active ? 'page' : undefined}
                aria-label={tab.label}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 h-16 transition-colors motion-reduce:transition-none',
                  focusRing,
                  active
                    ? 'text-[var(--ds-text-brand)]'
                    : 'text-[var(--ds-text-subtle)] hover:text-[var(--ds-text)]',
                )}
              >
                <Icon size={22} aria-hidden={true} />
                <span className="text-[11px] font-medium leading-none">{tab.label}</span>
              </Link>
            </li>
          )
        })}
        <li>
          <button
            onClick={onMoreClick}
            aria-label="Más opciones"
            className={cn(
              'w-full flex flex-col items-center justify-center gap-0.5 h-16 text-[var(--ds-text-subtle)] hover:text-[var(--ds-text)] transition-colors motion-reduce:transition-none',
              focusRing,
            )}
          >
            <MoreHorizontal size={22} aria-hidden={true} />
            <span className="text-[11px] font-medium leading-none">Más</span>
          </button>
        </li>
      </ul>
    </nav>
  )
}
```

- [ ] **Step 4: Run test, verify pass**

Run: `npx vitest run tests/components/MobileBottomNav.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/MobileBottomNav.tsx tests/components/MobileBottomNav.test.tsx
git commit -m "feat(layout): add MobileBottomNav for mobile-first navigation"
```

---

## Task 3: Create MoreSheet (overflow menu)

**Files:**
- Create: `src/components/layout/MoreSheet.tsx`
- Test: `tests/components/MoreSheet.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// tests/components/MoreSheet.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import { MoreSheet } from '@/components/layout/MoreSheet'

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: { full_name: 'Ada Lovelace', role: 'admin' },
    signOut: vi.fn(),
  }),
}))

describe('MoreSheet', () => {
  it('renders overflow nav items when open', () => {
    render(<MoreSheet open={true} onOpenChange={() => {}} />, { wrapper: MemoryRouter })
    expect(screen.getByRole('link', { name: /mapa interactivo/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /marco legal/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /configuración/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cerrar sesión/i })).toBeInTheDocument()
  })

  it('does not render content when closed', () => {
    render(<MoreSheet open={false} onOpenChange={() => {}} />, { wrapper: MemoryRouter })
    expect(screen.queryByRole('link', { name: /mapa interactivo/i })).not.toBeInTheDocument()
  })

  it('closes when a link is clicked', () => {
    const onChange = vi.fn()
    render(<MoreSheet open={true} onOpenChange={onChange} />, { wrapper: MemoryRouter })
    fireEvent.click(screen.getByRole('link', { name: /marco legal/i }))
    expect(onChange).toHaveBeenCalledWith(false)
  })
})
```

- [ ] **Step 2: Run test, verify fail**

Run: `npx vitest run tests/components/MoreSheet.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement MoreSheet**

```tsx
// src/components/layout/MoreSheet.tsx
import { Link } from 'react-router-dom'
import { Network, Scale, Settings, LogOut, User, Building2 } from '@/lib/lucide-icons'
import { Sheet } from '@/components/ui/sheet'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-background-brand)] focus-visible:ring-offset-2'

const ITEMS = [
  { to: '/mapa-red', label: 'Mapa Interactivo', icon: Network },
  { to: '/marco-legal', label: 'Marco Legal', icon: Scale },
  { to: '/settings', label: 'Configuración', icon: Settings },
] as const

interface MoreSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MoreSheet({ open, onOpenChange }: MoreSheetProps) {
  const { profile, signOut } = useAuth()

  const handleClose = () => onOpenChange(false)

  return (
    <Sheet open={open} onOpenChange={onOpenChange} side="bottom" ariaLabel="Más opciones">
      <div className="flex items-center justify-center pt-3 pb-1" aria-hidden="true">
        <div className="w-10 h-1 rounded-full bg-[var(--ds-neutral-200)]" />
      </div>

      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--ds-border)]">
        <div className="w-10 h-10 rounded-[var(--ds-radius-200)] bg-gradient-to-br from-blue-900 to-blue-800 flex items-center justify-center flex-shrink-0">
          <Building2 size={20} className="text-white" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-[var(--ds-font-size-100)] font-semibold text-[var(--ds-text)] truncate">
            {profile?.full_name || 'Usuario'}
          </p>
          <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] truncate capitalize">
            {profile?.role || 'viewer'}
          </p>
        </div>
      </div>

      <nav aria-label="Más secciones" className="flex-1 overflow-y-auto p-2">
        <ul className="list-none m-0 p-0 space-y-1">
          {ITEMS.map(item => (
            <li key={item.to}>
              <Link
                to={item.to}
                onClick={handleClose}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 min-h-[44px] rounded-[var(--ds-radius-200)] text-[var(--ds-text)] hover:bg-[var(--ds-neutral-50)] transition-colors',
                  focusRing,
                )}
              >
                <item.icon size={20} className="text-[var(--ds-text-subtle)]" aria-hidden="true" />
                <span className="text-[var(--ds-font-size-100)]">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-[var(--ds-border)] p-2">
        <button
          onClick={() => {
            handleClose()
            void signOut()
          }}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-3 min-h-[44px] rounded-[var(--ds-radius-200)] text-[var(--ds-text)] hover:bg-[var(--ds-neutral-50)] transition-colors',
            focusRing,
          )}
        >
          <LogOut size={20} className="text-[var(--ds-text-subtle)]" aria-hidden="true" />
          <span className="text-[var(--ds-font-size-100)]">Cerrar sesión</span>
        </button>
      </div>
    </Sheet>
  )
}
```

- [ ] **Step 4: Run test, verify pass**

Run: `npx vitest run tests/components/MoreSheet.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/MoreSheet.tsx tests/components/MoreSheet.test.tsx
git commit -m "feat(layout): add MoreSheet for overflow nav items"
```

---

## Task 4: Wire MobileBottomNav + MoreSheet into AppLayout

**Files:**
- Modify: `src/components/layout/AppLayout.tsx`

- [ ] **Step 1: Edit AppLayout — add imports + state**

Add at top of file with other imports:

```tsx
import { MobileBottomNav } from './MobileBottomNav';
import { MoreSheet } from './MoreSheet';
```

Inside `AppLayout()` component, after `const [scrolled, setScrolled] = useState(false);`, add:

```tsx
const [moreOpen, setMoreOpen] = useState(false);
```

- [ ] **Step 2: Hide hamburger on mobile, simplify mobile header**

Replace the hamburger button block (the `<button>` with `onClick={() => setSidebarOpen(!sidebarOpen)}`) so it only shows on desktop:

```tsx
<button
  onClick={() => setSidebarOpen(!sidebarOpen)}
  className={`hidden lg:flex p-[var(--ds-space-100)] rounded-[var(--ds-radius-200)] text-[var(--ds-text-subtle)] hover:text-[var(--ds-text)] hover:bg-[var(--ds-neutral-50)] transition-all ${focusRing}`}
  aria-label="Alternar menú lateral"
>
  <Building2 size={20} aria-hidden="true" />
</button>
```

(remove the `<Menu size={20} className="lg:hidden" />` line — bottom nav replaces it)

- [ ] **Step 3: Add MobileBottomNav + MoreSheet + main bottom padding**

After the closing `</header>` and before `<TrialBanner />`, leave as is. Then update the `<main>` element to add bottom padding for the nav:

```tsx
<main
  id="main-content"
  tabIndex={-1}
  className="p-[var(--ds-space-200)] lg:p-[var(--ds-space-300)] xl:p-[var(--ds-space-400)] pb-24 lg:pb-[var(--ds-space-300)] focus:outline-none"
>
```

After `<AppFooter />`, before the closing `</div>` of the main content wrapper, add:

```tsx
<MobileBottomNav onMoreClick={() => setMoreOpen(true)} />
<MoreSheet open={moreOpen} onOpenChange={setMoreOpen} />
```

- [ ] **Step 4: Verify no compile errors**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 5: Run all tests**

Run: `npx vitest run`
Expected: all green

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/AppLayout.tsx
git commit -m "feat(layout): integrate MobileBottomNav and MoreSheet into AppLayout"
```

---

## Task 5: Dashboard — stack header CTAs + responsive hero

**Files:**
- Modify: `src/features/dashboard/DashboardView.tsx`

- [ ] **Step 1: Stack header (lines ~247-274)**

Replace the header `<div className="flex items-end justify-between gap-[var(--ds-space-300)]">` block with:

```tsx
<div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-[var(--ds-space-200)] lg:gap-[var(--ds-space-300)]">
  <div className="min-w-0">
    <h1 className="text-[var(--ds-font-size-400)] sm:text-[var(--ds-font-size-500)] font-bold text-[var(--ds-text)] break-words">
      {brandName}
    </h1>
    <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mt-1">
      {metrics.vigentes} de {metrics.total} permisos vigentes · {locations.length}{' '}
      {locations.length === 1 ? 'sede' : 'sedes'} · Riesgo operativo{' '}
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[var(--ds-font-size-075)] font-semibold border ml-1 ${riskBadgeClass}`}
      >
        {riskLabel}
      </span>
    </p>
  </div>
  <div className="flex flex-col sm:flex-row gap-[var(--ds-space-100)] w-full lg:w-auto">
    <Link to="/permisos" className="w-full sm:w-auto order-1 sm:order-2">
      <Button className="w-full">
        <Plus className="w-4 h-4" />
        Nuevo permiso
      </Button>
    </Link>
    <Button variant="secondary" className="w-full sm:w-auto order-2 sm:order-1">
      <Download className="w-4 h-4" />
      Exportar reporte
    </Button>
  </div>
</div>
```

- [ ] **Step 2: Make hero grid fluid (line ~277)**

Change:

```tsx
<div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-[var(--ds-space-300)] items-stretch">
```

To:

```tsx
<div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,380px)] gap-[var(--ds-space-200)] lg:gap-[var(--ds-space-300)] items-stretch">
```

- [ ] **Step 3: Make gauge responsive (lines ~280-281)**

Replace:

```tsx
<div className="p-[var(--ds-space-300)] grid grid-cols-1 md:grid-cols-[260px_1fr] gap-[var(--ds-space-300)] items-center flex-1">
  <div className="relative w-[240px] h-[240px] mx-auto">
```

With:

```tsx
<div className="p-[var(--ds-space-200)] sm:p-[var(--ds-space-300)] grid grid-cols-1 md:grid-cols-[240px_1fr] gap-[var(--ds-space-300)] items-center flex-1">
  <div className="relative w-[200px] h-[200px] sm:w-[240px] sm:h-[240px] mx-auto">
```

- [ ] **Step 4: Make percentage font fluid (line ~322)**

Change:

```tsx
fontSize: '64px',
```

To:

```tsx
fontSize: 'clamp(48px, 12vw, 64px)',
```

And the `%` span:

```tsx
<span style={{ fontSize: '24px', opacity: 0.6 }}>%</span>
```

To:

```tsx
<span style={{ fontSize: 'clamp(20px, 4.5vw, 24px)', opacity: 0.6 }}>%</span>
```

- [ ] **Step 5: Stack bottom strip on mobile (line ~369)**

Change:

```tsx
<div className="bg-[var(--ds-neutral-50)] border-t border-[var(--ds-border)] px-[var(--ds-space-300)] py-[var(--ds-space-200)] grid grid-cols-1 md:grid-cols-[1fr_auto] gap-[var(--ds-space-250)] items-center">
```

To:

```tsx
<div className="bg-[var(--ds-neutral-50)] border-t border-[var(--ds-border)] px-[var(--ds-space-200)] sm:px-[var(--ds-space-300)] py-[var(--ds-space-200)] grid grid-cols-1 md:grid-cols-[1fr_auto] gap-[var(--ds-space-200)] items-center">
```

And wrap the action `<Button>` in a class to make it full-width on mobile:

```tsx
{metrics.pending > 0 && (
  <Link to="/permisos" className="w-full md:w-auto">
    <Button className="w-full md:w-auto">
      Ver {metrics.pending} acciones pendientes →
    </Button>
  </Link>
)}
```

- [ ] **Step 6: Reduce InvoiceCard padding on mobile (line ~480)**

Change:

```tsx
<div className="bg-white border border-[var(--ds-border)] rounded-[var(--ds-radius-300)] p-[var(--ds-space-300)] flex flex-col gap-[var(--ds-space-200)]">
```

To:

```tsx
<div className="bg-white border border-[var(--ds-border)] rounded-[var(--ds-radius-300)] p-[var(--ds-space-200)] sm:p-[var(--ds-space-300)] flex flex-col gap-[var(--ds-space-200)]">
```

- [ ] **Step 7: Reduce outer padding (line ~238)**

Change:

```tsx
<div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-400)]">
```

To:

```tsx
<div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-200)] sm:p-[var(--ds-space-300)] lg:p-[var(--ds-space-400)]">
```

(Apply the same change to all `min-h-screen ... p-[var(--ds-space-400)]` containers in this file: loading, error, empty states.)

- [ ] **Step 8: Run typecheck and tests**

Run: `npx tsc --noEmit && npx vitest run`
Expected: 0 errors, all tests pass

- [ ] **Step 9: Commit**

```bash
git add src/features/dashboard/DashboardView.tsx
git commit -m "feat(dashboard): mobile-first responsive layout"
```

---

## Task 6: Permits — switch to card list on mobile

**Files:**
- Create: `src/features/permits/PermitCardList.tsx`
- Modify: `src/features/permits/PermitListView.tsx`

- [ ] **Step 1: Create PermitCardList**

```tsx
// src/features/permits/PermitCardList.tsx
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Edit } from '@/lib/lucide-icons'
import type { PermitRow } from './PermitTable'

const STATUS_VARIANT: Record<PermitRow['status'], 'status-vigente' | 'status-por-vencer' | 'status-vencido' | 'status-en-tramite' | 'status-no-registrado'> = {
  vigente: 'status-vigente',
  por_vencer: 'status-por-vencer',
  vencido: 'status-vencido',
  en_tramite: 'status-en-tramite',
  no_registrado: 'status-no-registrado',
}

export interface PermitCardListProps {
  data: PermitRow[]
}

export function PermitCardList({ data }: PermitCardListProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-[var(--ds-radius-200)] border border-[var(--ds-border)] bg-white p-[var(--ds-space-300)] text-center text-[var(--ds-text-subtle)]">
        Sin resultados
      </div>
    )
  }

  return (
    <ul className="list-none m-0 p-0 space-y-[var(--ds-space-150)]">
      {data.map(row => (
        <li
          key={row.id}
          className="rounded-[var(--ds-radius-200)] border border-[var(--ds-border)] bg-white p-[var(--ds-space-200)] shadow-[var(--ds-shadow-raised)]"
        >
          <div className="flex items-start justify-between gap-[var(--ds-space-150)] mb-[var(--ds-space-100)]">
            <div className="min-w-0">
              <p className="text-[var(--ds-font-size-100)] font-semibold text-[var(--ds-text)] break-words">
                {row.type}
              </p>
              <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] truncate">
                {row.location}
              </p>
            </div>
            <Badge variant={STATUS_VARIANT[row.status]}>
              {row.status.replace('_', ' ')}
            </Badge>
          </div>

          <dl className="grid grid-cols-2 gap-x-[var(--ds-space-150)] gap-y-[var(--ds-space-050)] text-[var(--ds-font-size-075)] mb-[var(--ds-space-150)]">
            <div>
              <dt className="text-[var(--ds-text-subtle)]">Vencimiento</dt>
              <dd className="text-[var(--ds-text)] font-medium tabular-nums">
                {row.expires_at ? new Date(row.expires_at).toLocaleDateString('es-EC') : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--ds-text-subtle)]">Autoridad</dt>
              <dd className="text-[var(--ds-text)] font-medium truncate">{row.authority}</dd>
            </div>
          </dl>

          <div className="flex gap-[var(--ds-space-100)]">
            <Link to={`/permisos/${row.id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full min-h-[44px]">
                <Eye className="w-4 h-4" />
                Ver
              </Button>
            </Link>
            <Link to={`/permisos/${row.id}?edit=true`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full min-h-[44px]">
                <Edit className="w-4 h-4" />
                Editar
              </Button>
            </Link>
          </div>
        </li>
      ))}
    </ul>
  )
}
```

- [ ] **Step 2: Use card list on mobile in PermitListView**

In `src/features/permits/PermitListView.tsx`:

Add import:

```tsx
import { PermitCardList } from './PermitCardList';
```

Replace `<PermitTable data={filtered} />` with:

```tsx
<>
  <div className="hidden md:block">
    <PermitTable data={filtered} />
  </div>
  <div className="md:hidden">
    <PermitCardList data={filtered} />
  </div>
</>
```

- [ ] **Step 3: Stack header CTAs in PermitListView**

Replace the header `<div className="flex justify-between items-start">` block with:

```tsx
<div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-[var(--ds-space-200)]">
  <div>
    <h1 className="text-[var(--ds-font-size-400)] sm:text-[var(--ds-font-size-500)] font-bold text-[var(--ds-text)]">
      Permisos
    </h1>
    <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mt-[var(--ds-space-050)]">
      {rows.length} permisos registrados
    </p>
  </div>
  <div className="flex flex-col sm:flex-row gap-[var(--ds-space-100)] w-full lg:w-auto">
    <Link to="/permisos/nuevo" className="w-full sm:w-auto order-1 sm:order-2">
      <Button variant="default" className="w-full">
        <Plus className="w-4 h-4" />Nuevo Permiso
      </Button>
    </Link>
    <Button
      variant="outline"
      onClick={() => exportPermitsCSV(filtered)}
      className="w-full sm:w-auto order-2 sm:order-1"
    >
      <Download className="w-4 h-4" />Exportar CSV
    </Button>
  </div>
</div>
```

- [ ] **Step 4: Reduce outer container padding**

In `PermitListView.tsx`, change:

```tsx
<div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-400)]">
```

To:

```tsx
<div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-200)] sm:p-[var(--ds-space-300)] lg:p-[var(--ds-space-400)]">
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit && npx vitest run`
Expected: pass

- [ ] **Step 6: Commit**

```bash
git add src/features/permits/PermitCardList.tsx src/features/permits/PermitListView.tsx
git commit -m "feat(permits): mobile card list + stacked header CTAs"
```

---

## Task 7: PermitTableFilters — collapsible on mobile

**Files:**
- Modify: `src/features/permits/PermitTableFilters.tsx`

- [ ] **Step 1: Read current file**

Read: `src/features/permits/PermitTableFilters.tsx`

- [ ] **Step 2: Refactor to mobile-friendly layout**

Replace the file contents with mobile-first version. Keep the exposed `FilterState` and `PermitTableFilters` props identical.

The visible structure in mobile (`<sm`):
- Search input full-width
- "Filtros" toggle button below — opens/closes the 3 selects
- Selects rendered in a stacked column when open

Desktop (`≥sm`):
- All controls in one row, search grows, selects fixed widths.

```tsx
import { useState } from 'react';
import { Search, SlidersHorizontal, X } from '@/lib/lucide-icons';

export interface FilterState {
  search: string;
  status: string;
  type: string;
  location: string;
}

interface PermitTableFiltersProps {
  filters: FilterState;
  onFiltersChange: (next: FilterState) => void;
  availableStatuses: string[];
  availableTypes: string[];
  availableLocations: { id: string; name: string }[];
}

export function PermitTableFilters({
  filters,
  onFiltersChange,
  availableStatuses,
  availableTypes,
  availableLocations,
}: PermitTableFiltersProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const update = (patch: Partial<FilterState>) =>
    onFiltersChange({ ...filters, ...patch });

  const activeCount =
    (filters.status ? 1 : 0) + (filters.type ? 1 : 0) + (filters.location ? 1 : 0);

  return (
    <div className="space-y-[var(--ds-space-150)]">
      <div className="flex flex-col sm:flex-row gap-[var(--ds-space-150)] sm:items-center">
        <div className="relative flex-1 min-w-0">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ds-text-subtle)]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={filters.search}
            onChange={e => update({ search: e.target.value })}
            placeholder="Buscar permisos..."
            className="w-full pl-10 pr-3 min-h-[44px] border border-[var(--ds-border)] rounded-[var(--ds-radius-200)] text-[var(--ds-font-size-100)] focus:outline-none focus:ring-2 focus:ring-[var(--ds-background-brand)]"
            aria-label="Buscar permisos"
          />
        </div>

        <button
          type="button"
          onClick={() => setFiltersOpen(o => !o)}
          className="sm:hidden inline-flex items-center justify-center gap-2 min-h-[44px] px-4 border border-[var(--ds-border)] rounded-[var(--ds-radius-200)] text-[var(--ds-text)] bg-white hover:bg-[var(--ds-neutral-50)] transition-colors"
          aria-expanded={filtersOpen}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtros
          {activeCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[var(--ds-background-brand)] text-white text-xs font-semibold">
              {activeCount}
            </span>
          )}
        </button>

        <div className="hidden sm:flex gap-[var(--ds-space-100)]">
          <FilterSelect
            value={filters.status}
            onChange={v => update({ status: v })}
            options={availableStatuses.map(s => ({ value: s, label: s.replace('_', ' ') }))}
            placeholder="Estado"
          />
          <FilterSelect
            value={filters.type}
            onChange={v => update({ type: v })}
            options={availableTypes.map(t => ({ value: t, label: t }))}
            placeholder="Tipo"
          />
          <FilterSelect
            value={filters.location}
            onChange={v => update({ location: v })}
            options={availableLocations.map(l => ({ value: l.id, label: l.name }))}
            placeholder="Sede"
          />
        </div>
      </div>

      {filtersOpen && (
        <div className="sm:hidden grid grid-cols-1 gap-[var(--ds-space-100)]">
          <FilterSelect
            value={filters.status}
            onChange={v => update({ status: v })}
            options={availableStatuses.map(s => ({ value: s, label: s.replace('_', ' ') }))}
            placeholder="Estado"
            fullWidth
          />
          <FilterSelect
            value={filters.type}
            onChange={v => update({ type: v })}
            options={availableTypes.map(t => ({ value: t, label: t }))}
            placeholder="Tipo"
            fullWidth
          />
          <FilterSelect
            value={filters.location}
            onChange={v => update({ location: v })}
            options={availableLocations.map(l => ({ value: l.id, label: l.name }))}
            placeholder="Sede"
            fullWidth
          />
          {activeCount > 0 && (
            <button
              type="button"
              onClick={() =>
                onFiltersChange({ search: filters.search, status: '', type: '', location: '' })
              }
              className="inline-flex items-center justify-center gap-1 min-h-[44px] text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] hover:text-[var(--ds-text)]"
            >
              <X className="w-4 h-4" /> Limpiar filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface FilterSelectProps {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  fullWidth?: boolean;
}

function FilterSelect({ value, onChange, options, placeholder, fullWidth }: FilterSelectProps) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`min-h-[44px] px-3 border border-[var(--ds-border)] rounded-[var(--ds-radius-200)] text-[var(--ds-font-size-100)] bg-white ${fullWidth ? 'w-full' : ''}`}
      aria-label={placeholder}
    >
      <option value="">{placeholder}</option>
      {options.map(o => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npx vitest run`
Expected: pass

- [ ] **Step 4: Commit**

```bash
git add src/features/permits/PermitTableFilters.tsx
git commit -m "feat(permits): collapsible mobile filters with active count"
```

---

## Task 8: PermitDetailView — stack action buttons + responsive grid

**Files:**
- Modify: `src/features/permits/PermitDetailView.tsx`

- [ ] **Step 1: Read current file** to identify line ranges of the header (~line 240-260) and the card grid (~line 290-310).

Read: `src/features/permits/PermitDetailView.tsx`

- [ ] **Step 2: Stack header action buttons**

Find the header row with "Renovar" + "Subir documento" buttons (typically a `<div className="flex justify-between ...">` near the top). Replace with:

```tsx
<div className="flex flex-col gap-[var(--ds-space-150)] lg:flex-row lg:justify-between lg:items-start">
  <div className="min-w-0">
    {/* keep original title + breadcrumb content */}
  </div>
  <div className="flex flex-col sm:flex-row gap-[var(--ds-space-100)] w-full lg:w-auto">
    {/* original Renovar button — add className="w-full sm:w-auto" */}
    {/* original Subir documento button — add className="w-full sm:w-auto" */}
  </div>
</div>
```

- [ ] **Step 3: Confirm card grid responsive (1/2/3)**

Verify the existing card grid is already `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`. If it lacks the `grid-cols-1`, add it. Mobile should be 1 column.

- [ ] **Step 4: Reduce outer padding**

Change any `p-[var(--ds-space-400)]` outer container to `p-[var(--ds-space-200)] sm:p-[var(--ds-space-300)] lg:p-[var(--ds-space-400)]`.

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 6: Commit**

```bash
git add src/features/permits/PermitDetailView.tsx
git commit -m "feat(permits): mobile-first detail view layout"
```

---

## Task 9: PermitCreateView — responsive form grid

**Files:**
- Modify: `src/features/permits/PermitCreateView.tsx`

- [ ] **Step 1: Read file**

Read `src/features/permits/PermitCreateView.tsx`. Find any `grid grid-cols-2` (typically date fields).

- [ ] **Step 2: Replace `grid-cols-2` with responsive variant**

Change `className="grid grid-cols-2 gap-..."` to `className="grid grid-cols-1 sm:grid-cols-2 gap-..."` for the date row(s) and any other 2-col form rows.

Reduce outer padding to `p-[var(--ds-space-200)] sm:p-[var(--ds-space-300)] lg:p-[var(--ds-space-400)]`.

- [ ] **Step 3: Ensure form CTAs stack on mobile**

Locate the bottom form action row (`Guardar` / `Cancelar`). Wrap with:

```tsx
<div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-[var(--ds-space-100)]">
  <Button variant="outline" className="w-full sm:w-auto">Cancelar</Button>
  <Button type="submit" className="w-full sm:w-auto">Guardar</Button>
</div>
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: pass

- [ ] **Step 5: Commit**

```bash
git add src/features/permits/PermitCreateView.tsx
git commit -m "feat(permits): mobile-first create form"
```

---

## Task 10: RenewalGridView — responsive grid + outer padding

**Files:**
- Modify: `src/features/renewals/RenewalGridView.tsx`

- [ ] **Step 1: Read file**

Read `src/features/renewals/RenewalGridView.tsx`. Locate month-card grid (line ~101 per audit).

- [ ] **Step 2: Adjust grid breakpoints**

Change `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3` to `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` so 2-up triggers earlier.

- [ ] **Step 3: Reduce outer padding**

Change outer `p-[var(--ds-space-400)]` to `p-[var(--ds-space-200)] sm:p-[var(--ds-space-300)] lg:p-[var(--ds-space-400)]`.

- [ ] **Step 4: Stack any header CTAs**

If header has multiple buttons, apply the same `flex flex-col sm:flex-row` + `w-full sm:w-auto` pattern from Task 5.

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit`
Expected: pass

- [ ] **Step 6: Commit**

```bash
git add src/features/renewals/RenewalGridView.tsx
git commit -m "feat(renewals): responsive grid breakpoints"
```

---

## Task 11: LegalMatrixView — accordion fallback on mobile

**Files:**
- Create: `src/features/legal/LegalMatrixAccordion.tsx`
- Modify: `src/features/legal/LegalMatrixView.tsx`

- [ ] **Step 1: Read LegalMatrixView**

Read `src/features/legal/LegalMatrixView.tsx`. Note the data shape rendered into the table (rows = permits; columns = business types).

- [ ] **Step 2: Implement LegalMatrixAccordion**

Create a card-list with collapsible items. Each item shows:
- Permit type name (header)
- Chevron toggle
- Expanded content: list of business types where this permit is required (chips)

```tsx
// src/features/legal/LegalMatrixAccordion.tsx
import { useState } from 'react'
import { ChevronDown } from '@/lib/lucide-icons'
import { cn } from '@/lib/utils'

interface MatrixRow {
  permitType: string
  businessTypes: string[] // active business types for this permit
}

interface LegalMatrixAccordionProps {
  rows: MatrixRow[]
}

export function LegalMatrixAccordion({ rows }: LegalMatrixAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <ul className="list-none m-0 p-0 space-y-[var(--ds-space-100)]">
      {rows.map(row => {
        const isOpen = openId === row.permitType
        return (
          <li
            key={row.permitType}
            className="rounded-[var(--ds-radius-200)] border border-[var(--ds-border)] bg-white"
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : row.permitType)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-[var(--ds-space-150)] px-[var(--ds-space-200)] py-[var(--ds-space-150)] min-h-[44px] text-left"
            >
              <span className="font-medium text-[var(--ds-text)] break-words">
                {row.permitType}
              </span>
              <ChevronDown
                className={cn('w-4 h-4 text-[var(--ds-text-subtle)] transition-transform motion-reduce:transition-none', isOpen && 'rotate-180')}
                aria-hidden="true"
              />
            </button>
            {isOpen && (
              <div className="border-t border-[var(--ds-border)] px-[var(--ds-space-200)] py-[var(--ds-space-150)]">
                {row.businessTypes.length === 0 ? (
                  <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">
                    No aplica a ningún tipo de negocio.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-[var(--ds-space-050)]">
                    {row.businessTypes.map(bt => (
                      <span
                        key={bt}
                        className="inline-flex items-center px-2 py-1 rounded-[var(--ds-radius-100)] bg-[var(--ds-blue-50)] text-[var(--ds-text-brand)] text-[var(--ds-font-size-075)] font-medium"
                      >
                        {bt}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
```

- [ ] **Step 3: Hook into LegalMatrixView**

In `LegalMatrixView.tsx`, after computing the table data, derive `accordionRows: MatrixRow[]` (same data different shape). Wrap the existing table rendering and render the accordion in the same place:

```tsx
<div className="hidden md:block">
  {/* existing table */}
</div>
<div className="md:hidden">
  <LegalMatrixAccordion rows={accordionRows} />
</div>
```

- [ ] **Step 4: Wrap existing table in `overflow-x-auto`** (if not already)

Wrap the `<table>` element in: `<div className="overflow-x-auto -mx-[var(--ds-space-200)] px-[var(--ds-space-200)] md:mx-0 md:px-0">…</div>`

- [ ] **Step 5: Reduce outer padding**

Change outer `p-[var(--ds-space-400)]` to `p-[var(--ds-space-200)] sm:p-[var(--ds-space-300)] lg:p-[var(--ds-space-400)]`.

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit`
Expected: pass

- [ ] **Step 7: Commit**

```bash
git add src/features/legal/LegalMatrixAccordion.tsx src/features/legal/LegalMatrixView.tsx
git commit -m "feat(legal): mobile accordion for matrix view + horizontal scroll fallback"
```

---

## Task 12: LegalIndexView — responsive grid

**Files:**
- Modify: `src/features/legal/LegalIndexView.tsx`

- [ ] **Step 1: Find the cards grid (~line 184)**

Read file, locate `grid grid-cols-1 md:grid-cols-2`.

- [ ] **Step 2: Change to `grid-cols-1 sm:grid-cols-2`**

- [ ] **Step 3: Reduce outer padding** to `p-[var(--ds-space-200)] sm:p-[var(--ds-space-300)] lg:p-[var(--ds-space-400)]`.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: pass

- [ ] **Step 5: Commit**

```bash
git add src/features/legal/LegalIndexView.tsx
git commit -m "feat(legal): responsive index grid"
```

---

## Task 13: LocationDetailView — stack header + responsive KPI grid

**Files:**
- Modify: `src/features/locations/LocationDetailView.tsx`

- [ ] **Step 1: Read file**

Read `src/features/locations/LocationDetailView.tsx`. Locate header CTAs and KPI grid (~line 123).

- [ ] **Step 2: Stack header CTAs**

Apply the `flex flex-col sm:flex-row gap-[var(--ds-space-100)] w-full lg:w-auto` pattern with `w-full` buttons on mobile.

- [ ] **Step 3: Adjust KPI grid**

Change `grid grid-cols-1 md:grid-cols-3` to `grid grid-cols-1 sm:grid-cols-3` so KPIs go side-by-side earlier (3 small KPIs fit OK at 640px).

- [ ] **Step 4: Reduce outer padding**

`p-[var(--ds-space-200)] sm:p-[var(--ds-space-300)] lg:p-[var(--ds-space-400)]`.

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit`
Expected: pass

- [ ] **Step 6: Commit**

```bash
git add src/features/locations/LocationDetailView.tsx
git commit -m "feat(locations): mobile-first detail layout"
```

---

## Task 14: NetworkMapPage — fluid height + bottom-sheet legend

**Files:**
- Modify: `src/features/network/NetworkMapPage.tsx`

- [ ] **Step 1: Read file**

Read `src/features/network/NetworkMapPage.tsx`.

- [ ] **Step 2: Use 100dvh for height**

Change the ReactFlow container `style={{ height: 'calc(100vh - 140px)', minHeight: 600 }}` to:

```tsx
style={{ height: 'calc(100dvh - 200px)', minHeight: 480 }}
className="lg:min-h-[600px]"
```

(200px accounts for header 56-64 + bottom nav 64 + safe area; tweak if needed when smoke testing.)

- [ ] **Step 3: Move legend to bottom sheet on mobile**

Replace the legend `<aside className="w-[220px] ...">` so it's a full sidebar `≥lg` and a button-triggered Sheet `<lg`:

```tsx
import { useState } from 'react'
import { Sheet } from '@/components/ui/sheet'
import { Info, X } from '@/lib/lucide-icons'

// inside component:
const [legendOpen, setLegendOpen] = useState(false)

// where the legend was:
<>
  <aside className="hidden lg:block w-[220px] /* keep existing legend classes */">
    {/* existing legend content */}
  </aside>

  <button
    type="button"
    onClick={() => setLegendOpen(true)}
    aria-label="Mostrar leyenda"
    className="lg:hidden fixed bottom-20 right-4 z-20 flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-full bg-[var(--ds-neutral-0)] border border-[var(--ds-border)] shadow-[var(--ds-shadow-overlay)] text-[var(--ds-text)]"
  >
    <Info className="w-4 h-4" />
    Leyenda
  </button>

  <Sheet open={legendOpen} onOpenChange={setLegendOpen} side="bottom" ariaLabel="Leyenda del mapa">
    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--ds-border)]">
      <h3 className="font-semibold text-[var(--ds-text)]">Leyenda</h3>
      <button onClick={() => setLegendOpen(false)} aria-label="Cerrar">
        <X className="w-5 h-5 text-[var(--ds-text-subtle)]" />
      </button>
    </div>
    <div className="p-4 overflow-y-auto">
      {/* same legend content as the aside */}
    </div>
  </Sheet>
</>
```

(extract legend content to a shared `LegendContent` component within the file to avoid duplication)

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: pass

- [ ] **Step 5: Commit**

```bash
git add src/features/network/NetworkMapPage.tsx
git commit -m "feat(network): mobile-friendly map with sheet legend"
```

---

## Task 15: NotificationBell — full-width sheet on mobile

**Files:**
- Modify: `src/components/NotificationBell.tsx`

- [ ] **Step 1: Replace PopoverContent class**

Change line 121 from:

```tsx
<PopoverContent align="end" sideOffset={8} className="w-[380px] p-0 max-h-[520px] overflow-hidden flex flex-col">
```

To:

```tsx
<PopoverContent
  align="end"
  sideOffset={8}
  className="w-[calc(100vw-16px)] sm:w-[380px] max-w-[380px] p-0 max-h-[80dvh] sm:max-h-[520px] overflow-hidden flex flex-col"
>
```

(Sheet swap was an option but Popover already supports custom width — this keeps DOM identical and simply makes width fluid.)

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit && npx vitest run`
Expected: pass

- [ ] **Step 3: Commit**

```bash
git add src/components/NotificationBell.tsx
git commit -m "fix(notifications): fluid width popover on small viewports"
```

---

## Task 16: TrialBanner — remove whitespace-nowrap

**Files:**
- Modify: `src/components/layout/TrialBanner.tsx`

- [ ] **Step 1: Read file**

- [ ] **Step 2: Remove `whitespace-nowrap` from the activate link**

Find the link with class containing `whitespace-nowrap`. Remove that class. Allow wrap.

- [ ] **Step 3: Stack message + CTA on mobile**

If the banner's outer container is `flex items-center justify-between`, change to `flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2`.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: pass

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/TrialBanner.tsx
git commit -m "fix(trial-banner): wrap on small screens, stack CTA"
```

---

## Task 17: SettingsView — responsive tabs

**Files:**
- Modify: `src/features/settings/SettingsView.tsx`

- [ ] **Step 1: Read file**

Read `src/features/settings/SettingsView.tsx`.

- [ ] **Step 2: Make tabs nav horizontally scrollable on mobile**

Wrap the tabs nav row in:

```tsx
<div className="overflow-x-auto -mx-[var(--ds-space-200)] px-[var(--ds-space-200)] sm:mx-0 sm:px-0">
  <div role="tablist" className="flex gap-2 whitespace-nowrap">
    {/* tab buttons */}
  </div>
</div>
```

Each tab button should have `min-h-[44px]` and `flex-shrink-0`.

- [ ] **Step 3: Form sections — single column on mobile**

Any `grid grid-cols-2` inside tabs becomes `grid grid-cols-1 sm:grid-cols-2`.

- [ ] **Step 4: Reduce outer padding**

`p-[var(--ds-space-200)] sm:p-[var(--ds-space-300)] lg:p-[var(--ds-space-400)]`.

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit`
Expected: pass

- [ ] **Step 6: Commit**

```bash
git add src/features/settings/SettingsView.tsx
git commit -m "feat(settings): mobile-friendly scrollable tabs"
```

---

## Task 18: Settings dialogs — fluid widths

**Files:**
- Modify: `src/features/settings/DeleteCompanyDialog.tsx`, `src/features/settings/ChangeBusinessTypeDialog.tsx`

- [ ] **Step 1: Read both files**

- [ ] **Step 2: For each dialog content wrapper**

Find any `w-[NNNpx]` or `max-w-md` and change to `w-[calc(100vw-16px)] sm:w-auto sm:max-w-md` so dialog never exceeds viewport.

Reduce internal padding to `p-4 sm:p-6`.

Stack the action buttons row with `flex flex-col-reverse sm:flex-row sm:justify-end gap-2` and add `w-full sm:w-auto` to each button.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: pass

- [ ] **Step 4: Commit**

```bash
git add src/features/settings/DeleteCompanyDialog.tsx src/features/settings/ChangeBusinessTypeDialog.tsx
git commit -m "fix(settings): fluid dialog widths on mobile"
```

---

## Task 19: LocationsGrid + Sedes list — responsive

**Files:**
- Modify: `src/features/locations/LocationsGrid.tsx` (and any sedes list view)

- [ ] **Step 1: Read file**

Identify any `grid grid-cols-2` / `grid-cols-3` without `grid-cols-1` first.

- [ ] **Step 2: Apply mobile-first grid**

`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3`.

Card padding: `p-4 sm:p-6`.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: pass

- [ ] **Step 4: Commit**

```bash
git add src/features/locations/LocationsGrid.tsx
git commit -m "feat(locations): mobile-first grid"
```

---

## Task 20: EmptyState + ErrorState — responsive padding

**Files:**
- Modify: `src/components/ui/empty-state.tsx`, `src/components/ui/error-state.tsx`

- [ ] **Step 1: Read both files**

- [ ] **Step 2: Replace large fixed paddings**

`p-12` → `p-6 sm:p-12`. `p-8` → `p-4 sm:p-8`.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: pass

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/empty-state.tsx src/components/ui/error-state.tsx
git commit -m "fix(ui): responsive padding for empty/error states"
```

---

## Task 21: AppLayout final pass — mobile header height + remove sidebar drawer

**Files:**
- Modify: `src/components/layout/AppLayout.tsx`

- [ ] **Step 1: Hide overlay+sidebar entirely on mobile**

Change the overlay `<div className="fixed inset-0 ... z-30 lg:hidden ...">` to be rendered only when `sidebarOpen && window.innerWidth >= 1024` is impossible on mobile because the toggle is desktop-only now. Simplify: only render overlay when `sidebarOpen && desktop` (since mobile has no toggle, this never fires). Confirm by setting `lg:hidden` → ensure this overlay is never visible. Acceptable to keep it; it just won't fire.

Alternative cleaner: change the sidebar's mobile-state classes from `${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}` to:

```tsx
className={`fixed left-0 top-0 h-screen ... w-64 transition-transform duration-300 -translate-x-full lg:translate-x-0`}
```

(sidebar permanently hidden on `<lg`, always visible on `≥lg` — `sidebarOpen` only controls desktop collapse if you keep it; otherwise remove the state entirely)

- [ ] **Step 2: Mobile header height**

The header is `h-16`. Acceptable. Keep at 64px (still fits the title + bell).

- [ ] **Step 3: Remove unused `Menu` import** if hamburger no longer renders

In `AppLayout.tsx` imports, remove `Menu` from the lucide-icons import if not referenced anymore.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npx vitest run`
Expected: pass

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/AppLayout.tsx
git commit -m "chore(layout): remove mobile sidebar drawer (replaced by bottom nav)"
```

---

## Task 22: Smoke test the dev server at multiple breakpoints

**Files:** none (manual verification)

- [ ] **Step 1: Start dev server**

Run: `npm run dev` (or invoke `dev` skill)

Note URL.

- [ ] **Step 2: Open Chrome DevTools mobile emulation**

Test viewports: 360×640, 375×667, 414×896, 768×1024, 1024×768, 1280×800, 1440×900.

- [ ] **Step 3: Walk every authenticated route**

Routes: `/`, `/sedes`, `/sedes/:id`, `/permisos`, `/permisos/nuevo`, `/permisos/:id`, `/renovaciones`, `/marco-legal`, `/marco-legal/:id`, `/mapa-red`, `/settings`, `/settings/notifications`.

For each: confirm
- No horizontal scroll
- All buttons reachable + tappable (min 44px)
- Bottom nav visible <1024 + functional
- Sidebar visible ≥1024 + functional
- Notification bell opens correctly
- "Más" sheet opens with all items
- No layout overflow

- [ ] **Step 4: Document findings**

Any defects → return as new fix tasks before proceeding to reviews.

---

## Task 23: Run full unit test suite + typecheck

**Files:** none

- [ ] **Step 1: Typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 2: Unit tests**

Run: `npx vitest run`
Expected: all tests pass

- [ ] **Step 3: Lint**

Run: `npm run lint` (if configured)
Expected: 0 errors. Warnings acceptable.

---

## Task 24: Lighthouse mobile a11y audit

**Files:** none

- [ ] **Step 1: Build production preview**

Run: `npm run build && npm run preview`

- [ ] **Step 2: Run Lighthouse mobile audit on key pages**

In Chrome DevTools → Lighthouse → Mobile + Accessibility category. Run on `/`, `/permisos`, `/marco-legal`.

Target: Accessibility score ≥90.

- [ ] **Step 3: Fix any critical a11y findings**

Address contrast issues, missing labels, etc. Commit fixes per page.

---

## Task 25: Code review (medium)

**Files:** none

- [ ] **Step 1: Run /code-review skill at medium effort**

Invoke `code-review` skill with default effort.

- [ ] **Step 2: Address P1/P2 findings inline**

Commit each fix separately with `fix(review): ...`.

---

## Task 26: Ultra review (high)

**Files:** none

- [ ] **Step 1: Run /code-review at high effort**

Invoke `code-review` skill with `effort=high`.

- [ ] **Step 2: Address remaining findings**

Commit fixes.

- [ ] **Step 3: Final verification**

Re-run Task 22 (smoke) + Task 23 (unit tests + typecheck) to confirm fixes did not regress.

---

## Self-Review

**Spec coverage:**
- Bottom nav ✓ (Tasks 2, 4)
- More sheet ✓ (Tasks 3, 4)
- Sidebar drawer removed mobile ✓ (Task 21)
- Dashboard responsive ✓ (Task 5)
- Permits table → cards ✓ (Task 6)
- Permits filters collapsible ✓ (Task 7)
- Permit detail/create ✓ (Tasks 8, 9)
- Renewals grid ✓ (Task 10)
- Legal matrix accordion ✓ (Task 11)
- Legal index grid ✓ (Task 12)
- Location detail ✓ (Task 13)
- Network map sheet legend ✓ (Task 14)
- NotificationBell fluid ✓ (Task 15)
- TrialBanner wrap ✓ (Task 16)
- Settings tabs scroll ✓ (Task 17)
- Settings dialogs fluid ✓ (Task 18)
- LocationsGrid responsive ✓ (Task 19)
- EmptyState/ErrorState padding ✓ (Task 20)
- Smoke + unit + Lighthouse ✓ (Tasks 22, 23, 24)
- Reviews ✓ (Tasks 25, 26)

**Placeholder scan:** No `TBD`, no `// TODO`, no "implement later", no "similar to Task N" without code.

**Type consistency:** `MobileBottomNav.onMoreClick`, `MoreSheet.{open, onOpenChange}`, `Sheet.{open, onOpenChange, side, ariaLabel}`, `LegalMatrixAccordion.rows: MatrixRow[]`, `PermitCardList.data: PermitRow[]` — all consistent across tasks.

