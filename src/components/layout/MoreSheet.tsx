import { Link } from 'react-router-dom'
import { Network, Scale, Settings, LogOut, Building2 } from '@/lib/lucide-icons'
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
          type="button"
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
