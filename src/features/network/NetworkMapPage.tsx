import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useLocations } from '@/hooks/useLocations'
import { usePermits } from '@/hooks/usePermits'
import { useCompany } from '@/hooks/useCompany'
import { resolveCompanyId } from '@/lib/demo'
import { NetworkMapCanvas } from './NetworkMapCanvas'
import { MapLegend } from './MapLegend'
import { Sheet } from '@/components/ui/sheet'
import { Info, X } from '@/lib/lucide-icons'
import type { SedeMapData } from '@/features/dashboard/DashboardMap'

export function NetworkMapPage() {
  const { profile } = useAuth()
  const companyId = resolveCompanyId(profile?.company_id) ?? undefined
  const navigate = useNavigate()

  const { locations } = useLocations(companyId)
  const { permits } = usePermits({ companyId })
  const { data: company } = useCompany(companyId)
  const [legendOpen, setLegendOpen] = useState(false)

  const sedes = useMemo<SedeMapData[]>(() => {
    return locations.map(loc => {
      const locPermits = permits.filter(p => p.location_id === loc.id && p.is_active)
      const active = locPermits.filter(p => p.status === 'vigente').length
      const total = locPermits.length || 1
      const percentage = (active / total) * 100

      const status: 'success' | 'warning' | 'danger' =
        percentage >= 90 ? 'success' : percentage >= 50 ? 'warning' : 'danger'

      const risk: 'Bajo' | 'Medio' | 'Alto' | 'Crítico' =
        percentage >= 90 ? 'Bajo' : percentage >= 70 ? 'Medio' : percentage >= 40 ? 'Alto' : 'Crítico'

      return {
        id: loc.id,
        label: loc.name,
        code: (loc as { code?: string }).code || loc.id.slice(0, 8),
        permits: active,
        total,
        status,
        risk,
      }
    })
  }, [locations, permits])

  return (
    <>
      <div
        className="relative w-full rounded-[var(--ds-radius-200)] overflow-hidden bg-[var(--ds-neutral-0)] shadow-[var(--ds-shadow-raised)] border border-[var(--ds-border)] lg:min-h-[600px]"
        style={{ height: 'calc(100dvh - 200px)', minHeight: 480 }}
      >
        <NetworkMapCanvas
          empresaName={company?.name ?? 'Mi empresa'}
          businessType={company?.business_type}
          sedes={sedes}
          onSedeClick={(id) => navigate(`/sedes/${id}`)}
        />
        <div className="hidden lg:block absolute top-[var(--ds-space-300)] right-[var(--ds-space-300)] w-[220px] z-10">
          <MapLegend />
        </div>
        <button
          type="button"
          onClick={() => setLegendOpen(true)}
          aria-label="Mostrar leyenda"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}
          className="lg:hidden fixed right-4 z-20 inline-flex items-center gap-2 px-3 min-h-[44px] rounded-full bg-[var(--ds-neutral-0)] border border-[var(--ds-border)] shadow-[var(--ds-shadow-overlay)] text-[var(--ds-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-background-brand)] focus-visible:ring-offset-2"
        >
          <Info className="w-4 h-4" />
          Leyenda
        </button>
      </div>

      <Sheet
        open={legendOpen}
        onOpenChange={setLegendOpen}
        side="bottom"
        ariaLabel="Leyenda del mapa"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--ds-border)]">
          <h3 className="font-semibold text-[var(--ds-text)]">Leyenda</h3>
          <button
            onClick={() => setLegendOpen(false)}
            aria-label="Cerrar"
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
          >
            <X className="w-5 h-5 text-[var(--ds-text-subtle)]" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto">
          <MapLegend />
        </div>
      </Sheet>
    </>
  )
}
