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
            type="button"
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
