import { Card } from '@/components/ui/card'
import { DashboardMap, type SedeMapData } from './DashboardMap'
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
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <div className="text-[var(--ds-font-size-500)] font-bold" style={{ color }}>
        {value}
      </div>
    </div>
  )
}

export interface DashboardWidgetProps {
  empresaName: string
  totalSedes: number
  vigentes: number
  porVencer: number
  vencidos: number
  sedes: SedeMapData[]
}

export function DashboardWidget({ empresaName, totalSedes, vigentes, porVencer, vencidos, sedes }: DashboardWidgetProps) {
  return (
    <Card className="p-[var(--ds-space-400)]">
      <h2 className="text-[var(--ds-font-size-400)] font-semibold mb-[var(--ds-space-300)]">Resumen General</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-[var(--ds-space-300)] mb-[var(--ds-space-400)]">
        <Metric icon={Building2} label="Total Sedes" value={totalSedes} color="var(--ds-text)" />
        <Metric icon={CheckCircle2} label="Vigentes" value={vigentes} color="var(--ds-green-500)" />
        <Metric icon={AlertTriangle} label="Por Vencer" value={porVencer} color="var(--ds-orange-500)" />
        <Metric icon={XCircle} label="Vencidos" value={vencidos} color="var(--ds-red-500)" />
      </div>

      <h3 className="text-[var(--ds-font-size-300)] font-semibold mb-[var(--ds-space-150)]">Mapa Interactivo de Red</h3>
      <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] mb-[var(--ds-space-200)]">
        Empresa en el centro conectada a todas las sedes. Los colores indican estado de cumplimiento.
      </p>
      <DashboardMap empresaName={empresaName} sedes={sedes} />
    </Card>
  )
}
