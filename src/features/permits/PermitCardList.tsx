import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Edit } from '@/lib/lucide-icons'
import type { PermitRow } from './PermitTable'

const STATUS_VARIANT: Record<
  PermitRow['status'],
  'status-vigente' | 'status-por-vencer' | 'status-vencido' | 'status-en-tramite' | 'status-no-registrado'
> = {
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
      {data.map((row) => (
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
