import { Card } from '@/components/ui/card'
import { DashboardSedeCard } from './DashboardSedeCard'
import type { SedeMapData } from './DashboardMap'
import { Building2, CheckCircle2, AlertTriangle, XCircle, type LucideIcon } from '@/lib/lucide-icons'

interface MetricProps {
  icon: LucideIcon
  label: string
  value: number
  color: string
}

function Metric({ icon: Icon, label, value, color }: MetricProps) {
  return (
    <div>
      <div className="flex items-center gap-[var(--ds-space-100)] text-[var(--ds-text-subtle)] text-[var(--ds-font-size-075)] uppercase tracking-wide mb-[var(--ds-space-050)]">
        <Icon className="w-4 h-4" aria-hidden="true" />
        {label}
      </div>
      <div className="text-[var(--ds-font-size-500)] font-bold" style={{ color }}>
        {value}
      </div>
    </div>
  )
}

export interface DashboardWidgetProps {
  totalSedes: number
  vigentes: number
  porVencer: number
  vencidos: number
  sedes: SedeMapData[]
}

export function DashboardWidget({ totalSedes, vigentes, porVencer, vencidos, sedes }: DashboardWidgetProps) {
  return (
    <div className="space-y-[var(--ds-space-400)]">
      <Card className="p-[var(--ds-space-400)]">
        <h2 className="text-[var(--ds-font-size-400)] font-semibold mb-[var(--ds-space-300)]">Resumen General</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-[var(--ds-space-300)]">
          <Metric icon={Building2} label="Total Sedes" value={totalSedes} color="var(--ds-text)" />
          <Metric icon={CheckCircle2} label="Vigentes" value={vigentes} color="var(--ds-green-500)" />
          <Metric icon={AlertTriangle} label="Por Vencer" value={porVencer} color="var(--ds-orange-500)" />
          <Metric icon={XCircle} label="Vencidos" value={vencidos} color="var(--ds-red-500)" />
        </div>
      </Card>

      <section aria-labelledby="sedes-resumen-heading">
        <h2 id="sedes-resumen-heading" className="text-[var(--ds-font-size-400)] font-semibold mb-[var(--ds-space-200)]">
          Resumen por Sede
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[var(--ds-space-200)]">
          {sedes.map(sede => (
            <DashboardSedeCard key={sede.id} sede={sede} />
          ))}
        </div>
      </section>
    </div>
  )
}
