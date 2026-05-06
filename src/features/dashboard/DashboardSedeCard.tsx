import { memo } from 'react'
import { Link } from 'react-router-dom'
import { Building2 } from '@/lib/lucide-icons'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { SedeMapData } from './DashboardMap'

export interface DashboardSedeCardProps {
  sede: SedeMapData
}

const statusColors: Record<SedeMapData['status'], string> = {
  success: 'var(--ds-green-500)',
  warning: 'var(--ds-orange-500)',
  danger: 'var(--ds-red-500)',
}

const riskBadgeVariants: Record<SedeMapData['risk'], 'risk-bajo' | 'risk-medio' | 'risk-alto' | 'risk-critico'> = {
  Bajo: 'risk-bajo',
  Medio: 'risk-medio',
  Alto: 'risk-alto',
  'Crítico': 'risk-critico',
}

function DashboardSedeCardImpl({ sede }: DashboardSedeCardProps) {
  const fillColor = statusColors[sede.status]
  const badgeVariant = riskBadgeVariants[sede.risk]
  const percentage = sede.total > 0 ? (sede.permits / sede.total) * 100 : 0

  return (
    <Link to={`/sedes/${sede.id}`} className="block rounded-[var(--ds-radius-200)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-background-brand)] focus-visible:ring-offset-2" aria-label={`Sede ${sede.label}`}>
      <Card
        interactive
        className="p-[var(--ds-space-200)]"
        style={{ borderTop: `3px solid ${fillColor}` }}
      >
        <div className="flex items-center gap-[var(--ds-space-100)] mb-[var(--ds-space-150)]">
          <div className="w-8 h-8 bg-[var(--ds-neutral-100)] rounded-[var(--ds-radius-100)] flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-[var(--ds-text-subtle)]" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[var(--ds-font-size-100)] text-[var(--ds-text)] truncate">{sede.label}</div>
            <div className="text-[var(--ds-font-size-075)] font-mono text-[var(--ds-text-subtlest)]">{sede.code}</div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-[var(--ds-space-075)]">
          <span className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">
            {sede.permits}/{sede.total} permisos
          </span>
          <Badge variant={badgeVariant} size="sm">{sede.risk}</Badge>
        </div>

        <div
          className="w-full h-1.5 bg-[var(--ds-neutral-100)] rounded-[3px] overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(percentage)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-[3px] transition-[width] duration-300"
            style={{ width: `${percentage}%`, backgroundColor: fillColor }}
          />
        </div>
      </Card>
    </Link>
  )
}

export const DashboardSedeCard = memo(DashboardSedeCardImpl)
