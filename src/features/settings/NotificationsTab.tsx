import { Card } from '@/components/ui/card'
import { Bell, Mail, MessageSquare, type LucideIcon } from '@/lib/lucide-icons'

interface ToggleProps {
  label: string
  description: string
  icon: LucideIcon
  defaultChecked?: boolean
}

function Toggle({ label, description, icon: Icon, defaultChecked }: ToggleProps) {
  return (
    <label className="flex items-start gap-[var(--ds-space-200)] cursor-pointer">
      <Icon className="w-5 h-5 text-[var(--ds-text-subtle)] mt-0.5 shrink-0" />
      <div className="flex-1">
        <div className="font-medium text-[var(--ds-font-size-100)]">{label}</div>
        <div className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">{description}</div>
      </div>
      <input type="checkbox" defaultChecked={defaultChecked} className="mt-1 w-4 h-4" />
    </label>
  )
}

export function NotificationsTab() {
  return (
    <Card className="p-[var(--ds-space-400)]">
      <h2 className="text-[var(--ds-font-size-300)] font-semibold mb-[var(--ds-space-300)]">Notificaciones</h2>
      <div className="space-y-[var(--ds-space-300)]">
        <Toggle icon={Mail} label="Email" description="Recibe notificaciones por email cuando un permiso esté por vencer" defaultChecked />
        <Toggle icon={Bell} label="Push" description="Notificaciones en el navegador" />
        <Toggle icon={MessageSquare} label="SMS" description="Mensajes de texto para alertas críticas" />
      </div>
    </Card>
  )
}
