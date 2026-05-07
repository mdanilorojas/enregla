import { Calendar, CheckCircle2, Clock, AlertTriangle, type LucideIcon } from '@/lib/lucide-icons'

export interface TimelineEvent {
  id: string
  type: 'issued' | 'renewed' | 'expires' | 'expired'
  date: string
  description: string
}

export interface PermitTimelineProps {
  events: TimelineEvent[]
}

const iconMap: Record<TimelineEvent['type'], { icon: LucideIcon; color: string }> = {
  issued: { icon: CheckCircle2, color: 'var(--ds-green-500)' },
  renewed: { icon: Clock, color: 'var(--ds-blue-500)' },
  expires: { icon: Calendar, color: 'var(--ds-orange-500)' },
  expired: { icon: AlertTriangle, color: 'var(--ds-red-500)' },
}

export function PermitTimeline({ events }: PermitTimelineProps) {
  if (events.length === 0) {
    return <p className="text-[var(--ds-text-subtle)] text-[var(--ds-font-size-075)]">Sin eventos registrados</p>
  }

  return (
    <div className="space-y-[var(--ds-space-300)]">
      {events.map((event, i) => {
        const { icon: Icon, color } = iconMap[event.type]
        const isLast = i === events.length - 1
        return (
          <div key={event.id} className="flex gap-[var(--ds-space-200)] relative">
            {!isLast && <div className="absolute left-4 top-8 bottom-0 w-px bg-[var(--ds-border)]" />}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 relative"
              style={{ backgroundColor: `${color}20` }}
            >
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div className="pb-[var(--ds-space-200)]">
              <div className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">
                {new Date(event.date).toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div className="text-[var(--ds-font-size-100)] font-medium">{event.description}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
