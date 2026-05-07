import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { FileText, Plus, ArrowRight } from '@/lib/lucide-icons'

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
}

export function LocationPermitsTab({ permits }: LocationPermitsTabProps) {
  const active = permits.filter(p => p.is_active)

  if (active.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No hay permisos registrados"
        description="Registra el primer permiso para esta sede"
        action={
          <Link to="/permisos">
            <Button variant="default"><Plus className="w-4 h-4" />Nuevo Permiso</Button>
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-[var(--ds-space-200)]">
      <div className="flex justify-between items-center">
        <h3 className="text-[var(--ds-font-size-300)] font-semibold">Permisos ({active.length})</h3>
        <Link to="/permisos">
          <Button variant="link">Ver todos<ArrowRight className="w-4 h-4" /></Button>
        </Link>
      </div>

      <div className="space-y-[var(--ds-space-100)]">
        {active.slice(0, 5).map(permit => {
          const statusMap: Record<string, 'status-vigente' | 'status-por-vencer' | 'status-vencido' | 'status-en-tramite' | 'status-no-registrado'> = {
            vigente: 'status-vigente',
            por_vencer: 'status-por-vencer',
            vencido: 'status-vencido',
            en_tramite: 'status-en-tramite',
          }
          const statusVariant = statusMap[permit.status] ?? 'status-no-registrado'

          return (
            <Link
              key={permit.id}
              to={`/permisos/${permit.id}`}
              className="flex items-center justify-between p-[var(--ds-space-200)] bg-white rounded-[var(--ds-radius-200)] border border-[var(--ds-border)] hover:border-[var(--ds-border-bold)] transition-colors"
            >
              <div>
                <div className="font-medium text-[var(--ds-font-size-100)]">{permit.type}</div>
                {permit.expires_at && (
                  <div className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">
                    Vence: {new Date(permit.expires_at).toLocaleDateString('es-EC')}
                  </div>
                )}
              </div>
              <Badge variant={statusVariant}>{permit.status.replace('_', ' ')}</Badge>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
