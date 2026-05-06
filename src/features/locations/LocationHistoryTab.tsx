import { Clock } from '@/lib/lucide-icons'
import { EmptyState } from '@/components/ui/empty-state'

export interface LocationHistoryEvent {
  id: string
  date: string
  description: string
}

export interface LocationHistoryTabProps {
  locationId: string
  events?: LocationHistoryEvent[]
}

export function LocationHistoryTab({ events = [] }: LocationHistoryTabProps) {
  if (events.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="Sin historial"
        description="Aquí aparecerán los eventos importantes de esta sede"
      />
    )
  }

  return (
    <div className="space-y-[var(--ds-space-200)]">
      {events.map(event => (
        <div key={event.id} className="flex gap-[var(--ds-space-200)]">
          <div className="w-2 h-2 rounded-full bg-[var(--ds-background-brand)] mt-2 shrink-0" />
          <div>
            <div className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">
              {new Date(event.date).toLocaleDateString('es-EC')}
            </div>
            <div className="text-[var(--ds-font-size-100)]">{event.description}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
