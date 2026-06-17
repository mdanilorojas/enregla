import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { FileText, Plus, ArrowRight, RefreshCw } from '@/lib/lucide-icons'
import { permitTypeLabel } from '@/lib/domain/permit-types'

const STATUS_LABELS: Record<string, string> = {
  vigente: 'Vigente',
  por_vencer: 'Por vencer',
  vencido: 'Vencido',
  en_tramite: 'En trámite',
  no_registrado: 'No registrado',
}

export interface LocationPermitSummary {
  id: string
  type: string
  status: string
  expires_at: string | null
  is_active: boolean
}

export interface LocationPermitsTabProps {
  locationId: string
  permits: LocationPermitSummary[]
  onRenew?: (permitId: string) => void
}

export function LocationPermitsTab({ locationId, permits, onRenew }: LocationPermitsTabProps) {
  const active = permits.filter(p => p.is_active)
  const newPermitHref = `/permisos/nuevo?location=${encodeURIComponent(locationId)}`

  if (active.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No hay permisos registrados"
        description="Registra el primer permiso para esta sede"
        action={
          <Link to={newPermitHref}>
            <Button variant="default"><Plus className="w-4 h-4" />Nuevo permiso</Button>
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-[var(--ds-space-200)]">
      <div className="flex justify-between items-center">
        <h3 className="text-[var(--ds-font-size-300)] font-semibold">Permisos ({active.length})</h3>
        <div className="flex gap-[var(--ds-space-100)]">
          <Link to={newPermitHref}>
            <Button variant="outline"><Plus className="w-4 h-4" />Nuevo permiso</Button>
          </Link>
          <Link to="/permisos">
            <Button variant="link">Ver todos<ArrowRight className="w-4 h-4" /></Button>
          </Link>
        </div>
      </div>

      <div className="space-y-[var(--ds-space-100)]">
        {active.map(permit => {
          const statusMap: Record<string, 'status-vigente' | 'status-por-vencer' | 'status-vencido' | 'status-en-tramite' | 'status-no-registrado'> = {
            vigente: 'status-vigente',
            por_vencer: 'status-por-vencer',
            vencido: 'status-vencido',
            en_tramite: 'status-en-tramite',
          }
          const statusVariant = statusMap[permit.status] ?? 'status-no-registrado'

          const canRenew = onRenew && (permit.status === 'por_vencer' || permit.status === 'vencido' || permit.status === 'vigente')

          return (
            <div
              key={permit.id}
              className="flex items-center justify-between gap-[var(--ds-space-150)] p-[var(--ds-space-200)] bg-white rounded-[var(--ds-radius-200)] border border-[var(--ds-border)] hover:border-[var(--ds-border-bold)] transition-colors"
            >
              <Link to={`/permisos/${permit.id}`} className="flex-1 min-w-0">
                <div className="font-medium text-[var(--ds-font-size-100)]">{permitTypeLabel(permit.type)}</div>
                {permit.expires_at && (
                  <div className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">
                    Vence: {new Date(permit.expires_at).toLocaleDateString('es-EC')}
                  </div>
                )}
              </Link>
              <div className="flex items-center gap-[var(--ds-space-100)]">
                <Badge variant={statusVariant}>{STATUS_LABELS[permit.status] ?? permit.status}</Badge>
                {canRenew && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRenew(permit.id)}
                    aria-label={`Renovar ${permitTypeLabel(permit.type)}`}
                  >
                    <RefreshCw className="w-4 h-4" />Renovar
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
