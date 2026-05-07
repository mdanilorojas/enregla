import { Card } from '@/components/ui/card'

export function MapLegend() {
  return (
    <Card className="p-[var(--ds-space-200)]">
      <h3 className="text-[var(--ds-font-size-075)] font-semibold uppercase text-[var(--ds-text-subtle)] mb-[var(--ds-space-150)]">Leyenda</h3>
      <div className="space-y-[var(--ds-space-100)]">
        <div className="flex items-center gap-[var(--ds-space-100)]">
          <div className="w-6 h-0.5 bg-[var(--ds-green-500)]" />
          <span className="text-[var(--ds-font-size-075)]">100% cumplimiento</span>
        </div>
        <div className="flex items-center gap-[var(--ds-space-100)]">
          <div className="w-6 h-0.5" style={{ background: 'repeating-linear-gradient(90deg, var(--ds-orange-500) 0 3px, transparent 3px 6px)' }} />
          <span className="text-[var(--ds-font-size-075)]">Requiere atención</span>
        </div>
        <div className="flex items-center gap-[var(--ds-space-100)]">
          <div className="w-6 h-0.5" style={{ background: 'repeating-linear-gradient(90deg, var(--ds-red-500) 0 3px, transparent 3px 6px)' }} />
          <span className="text-[var(--ds-font-size-075)]">Crítico / vencido</span>
        </div>
      </div>
    </Card>
  )
}
