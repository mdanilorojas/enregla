import { memo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronUp, Calendar } from '@/lib/lucide-icons'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export interface MonthRenewal {
  permitId: string
  permitType: string
  locationName: string
  expiresAt: string
  status: 'vigente' | 'por_vencer' | 'vencido'
}

export interface MonthCardProps {
  month: number
  year: number
  renewals: MonthRenewal[]
}

function MonthCardComponent({ month, year, renewals }: MonthCardProps) {
  const [expanded, setExpanded] = useState(false)
  const panelId = `month-panel-${year}-${month}`

  return (
    <Card className="p-[var(--ds-space-300)]">
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls={panelId}
        className="w-full flex items-center justify-between text-left rounded-[var(--ds-radius-100)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-background-brand)] focus-visible:ring-offset-2"
      >
        <div>
          <div className="flex items-center gap-[var(--ds-space-100)]">
            <Calendar className="w-4 h-4 text-[var(--ds-text-subtle)]" aria-hidden="true" />
            <h3 className="text-[var(--ds-font-size-300)] font-semibold">{MONTHS[month]}</h3>
          </div>
          <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">
            {year} • {renewals.length} {renewals.length === 1 ? 'permiso' : 'permisos'}
          </p>
        </div>
        {expanded
          ? <ChevronUp className="w-4 h-4" aria-hidden="true" />
          : <ChevronDown className="w-4 h-4" aria-hidden="true" />
        }
      </button>

      {expanded && (
        <div
          id={panelId}
          role="region"
          aria-label={`Permisos en ${MONTHS[month]} ${year}`}
          className="mt-[var(--ds-space-200)] pt-[var(--ds-space-200)] border-t border-[var(--ds-border)] space-y-[var(--ds-space-100)]"
        >
          {renewals.map(r => {
            const variant = {
              vigente: 'status-vigente' as const,
              por_vencer: 'status-por-vencer' as const,
              vencido: 'status-vencido' as const,
            }[r.status]
            return (
              <Link
                key={r.permitId}
                to={`/permisos/${r.permitId}`}
                className="block p-[var(--ds-space-150)] rounded-[var(--ds-radius-100)] hover:bg-[var(--ds-neutral-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-background-brand)] focus-visible:ring-offset-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-[var(--ds-font-size-100)]">{r.permitType}</div>
                    <div className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">{r.locationName}</div>
                  </div>
                  <Badge variant={variant} size="sm">{r.status.replace('_', ' ')}</Badge>
                </div>
                <div className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] mt-[var(--ds-space-050)]">
                  Vence: {new Date(r.expiresAt).toLocaleDateString('es-EC')}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </Card>
  )
}

export const MonthCard = memo(MonthCardComponent)
