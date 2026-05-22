import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Bell, BellOff, Check, Mail, AlertCircle, CheckCircle2 } from '@/lib/lucide-icons'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications, type NotificationItem } from '@/hooks/useNotifications'
import { permitTypeLabel } from '@/lib/domain/permit-types'
import { cn } from '@/lib/utils'

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-background-brand)] focus-visible:ring-offset-2'

function notifIcon(type: string, status: string) {
  if (status === 'failed') return <AlertCircle size={16} className="text-[var(--ds-red-500)]" />
  if (type.startsWith('expiry_')) {
    const cls = type === 'expiry_7d'
      ? 'text-[var(--ds-red-500)]'
      : type === 'expiry_15d'
      ? 'text-[var(--ds-orange-500)]'
      : 'text-[var(--ds-text-brand)]'
    return <AlertCircle size={16} className={cls} />
  }
  if (type === 'digest') return <Mail size={16} className="text-[var(--ds-text-brand)]" />
  return <CheckCircle2 size={16} className="text-[var(--ds-green-500)]" />
}

function expiryLeadDays(type: string): number | null {
  if (type === 'expiry_7d') return 7
  if (type === 'expiry_15d') return 15
  if (type === 'expiry_30d') return 30
  return null
}

function notifLabel(item: NotificationItem) {
  const locName = item.permit?.location?.name ?? 'Sede'
  const permitType = permitTypeLabel(item.permit?.type)
  const expiry = item.permit?.expiry_date
  const expiryStr = expiry ? new Date(expiry).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }) : null

  const lead = expiryLeadDays(item.notification_type)
  if (lead !== null) {
    return {
      title: `${permitType} vence en ${lead} días`,
      body: `${locName}${expiryStr ? ` · ${expiryStr}` : ''}`,
    }
  }
  if (item.notification_type === 'digest') {
    return { title: 'Resumen semanal', body: `${locName} · ${permitType}` }
  }
  return { title: permitType, body: locName }
}

function NotifRow({ item, onClick }: { item: NotificationItem; onClick: () => void }) {
  const { title, body } = notifLabel(item)
  const ts = item.created_at ?? item.sent_at
  const ago = ts ? formatDistanceToNow(new Date(ts), { addSuffix: true, locale: es }) : ''
  const unread = !item.read_at

  return (
    <Link
      to="/renovaciones"
      onClick={onClick}
      className={cn(
        'flex items-start gap-[var(--ds-space-150)] px-[var(--ds-space-200)] py-[var(--ds-space-150)] border-b border-[var(--ds-border)] hover:bg-[var(--ds-neutral-50)] transition-colors',
        unread && 'bg-[var(--ds-blue-50)]/40',
      )}
    >
      <div className="shrink-0 mt-0.5">{notifIcon(item.notification_type, item.email_status)}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('text-[var(--ds-font-size-100)] truncate', unread ? 'font-semibold text-[var(--ds-text)]' : 'text-[var(--ds-text-subtle)]')}>
            {title}
          </p>
          {unread && <span className="shrink-0 mt-1.5 w-2 h-2 rounded-full bg-[var(--ds-blue-500)]" aria-hidden="true" />}
        </div>
        <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] truncate">{body}</p>
        <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtlest)] mt-0.5">{ago}</p>
      </div>
    </Link>
  )
}

export function NotificationBell() {
  const { user } = useAuth()
  const { items, loading, unreadCount, markAsRead, markAllAsRead } = useNotifications(user?.id)
  const [open, setOpen] = useState(false)

  const badgeCount = unreadCount > 9 ? '9+' : String(unreadCount)

  const handleOpen = (next: boolean) => {
    setOpen(next)
  }

  const handleRowClick = (id: string) => {
    void markAsRead([id])
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'relative p-[var(--ds-space-100)] rounded-[var(--ds-radius-200)] text-[var(--ds-text-subtle)] hover:text-[var(--ds-text)] hover:bg-[var(--ds-neutral-50)] transition-all',
            focusRing,
          )}
          aria-label={`Notificaciones${unreadCount > 0 ? `, ${unreadCount} sin leer` : ''}`}
        >
          <Bell size={20} strokeWidth={2} aria-hidden="true" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--ds-red-500)] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-[var(--ds-neutral-0)]"
              aria-hidden="true"
            >
              {badgeCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[calc(100vw-16px)] sm:w-[380px] max-w-[380px] p-0 max-h-[80dvh] sm:max-h-[520px] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between px-[var(--ds-space-200)] py-[var(--ds-space-150)] border-b border-[var(--ds-border)]">
          <div>
            <h3 className="text-[var(--ds-font-size-200)] font-semibold text-[var(--ds-text)]">Notificaciones</h3>
            <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">
              {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => void markAllAsRead()}
              className={cn(
                'flex items-center gap-1 text-[var(--ds-font-size-075)] text-[var(--ds-text-brand)] hover:underline px-2 py-1 rounded',
                focusRing,
              )}
            >
              <Check size={14} aria-hidden="true" />
              Marcar todo
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-[var(--ds-space-300)] text-center text-[var(--ds-text-subtle)] text-[var(--ds-font-size-100)]">
              Cargando…
            </div>
          ) : items.length === 0 ? (
            <div className="p-[var(--ds-space-300)] text-center">
              <BellOff size={28} className="mx-auto mb-2 text-[var(--ds-text-subtlest)]" aria-hidden="true" />
              <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)]">Sin notificaciones</p>
              <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtlest)] mt-1">
                Te avisaremos cuando un permiso esté por vencer
              </p>
            </div>
          ) : (
            items.map(item => <NotifRow key={item.id} item={item} onClick={() => handleRowClick(item.id)} />)
          )}
        </div>

        <div className="border-t border-[var(--ds-border)] px-[var(--ds-space-200)] py-[var(--ds-space-100)] bg-[var(--ds-neutral-50)]">
          <Link
            to="/settings/notifications"
            onClick={() => setOpen(false)}
            className={cn(
              'block text-center text-[var(--ds-font-size-075)] text-[var(--ds-text-brand)] hover:underline py-1 rounded',
              focusRing,
            )}
          >
            Preferencias de notificaciones
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
