import { useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useLocations } from '@/hooks/useLocations'
import { usePermits } from '@/hooks/usePermits'
import { NetworkMapCanvas } from './NetworkMapCanvas'
import { MapLegend } from './MapLegend'
import type { SedeMapData } from '@/features/dashboard/DashboardMap'

export function NetworkMapPage() {
  const { profile } = useAuth()
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'
  const companyId = isDemoMode ? '50707999-f033-41c4-91c9-989966311972' : profile?.company_id

  const { locations } = useLocations(companyId)
  const { permits } = usePermits({ companyId })

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
    <div
      className="relative w-full rounded-[var(--ds-radius-200)] overflow-hidden bg-[var(--ds-neutral-0)] shadow-[var(--ds-shadow-raised)] border border-[var(--ds-border)]"
      style={{ height: 'calc(100vh - 140px)', minHeight: 600 }}
    >
      <NetworkMapCanvas
        empresaName={(profile as { company_name?: string } | null)?.company_name || 'EnRegla Corp'}
        sedes={sedes}
      />
      <div className="absolute top-[var(--ds-space-300)] right-[var(--ds-space-300)] w-[220px] z-10">
        <MapLegend />
      </div>
    </div>
  )
}
