import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useLocations } from '@/hooks/useLocations'
import { usePermits } from '@/hooks/usePermits'
import { DashboardWidget } from './DashboardWidget'
import type { SedeMapData } from './DashboardMap'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Building2, Plus } from '@/lib/lucide-icons'
import { SkeletonList } from '@/components/ui/skeleton'

export function DashboardView() {
  const { profile, companyId: authCompanyId } = useAuth()
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'
  const companyId = isDemoMode ? '50707999-f033-41c4-91c9-989966311972' : authCompanyId

  const { locations, loading: loadingLocs } = useLocations(companyId)
  const { permits, loading: loadingPermits } = usePermits({ companyId })

  const loading = loadingLocs || loadingPermits

  const metrics = useMemo(() => {
    const vigentes = permits.filter(p => p.is_active && p.status === 'vigente').length
    const porVencer = permits.filter(p => p.is_active && p.status === 'por_vencer').length
    const vencidos = permits.filter(p => p.is_active && p.status === 'vencido').length

    const sedesWithPermits: SedeMapData[] = locations.map(loc => {
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
        code: loc.id.slice(0, 8).toUpperCase(),
        permits: active,
        total,
        status,
        risk,
      }
    })

    return { vigentes, porVencer, vencidos, sedesWithPermits }
  }, [locations, permits])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-400)]">
        <div className="max-w-7xl mx-auto">
          <SkeletonList count={1} />
        </div>
      </div>
    )
  }

  if (locations.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-400)]">
        <div className="max-w-7xl mx-auto">
          <EmptyState
            icon={Building2}
            title="No hay sedes registradas"
            description="Crea tu primera sede para comenzar a gestionar permisos"
            action={
              <Link to="/sedes">
                <Button variant="default">
                  <Plus className="w-4 h-4" />
                  Crear Primera Sede
                </Button>
              </Link>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-400)]">
      <div className="max-w-7xl mx-auto space-y-[var(--ds-space-400)]">
        <h1 className="text-[var(--ds-font-size-500)] font-bold text-[var(--ds-text)]">Dashboard</h1>
        <DashboardWidget
          empresaName={(profile as { company_name?: string } | null)?.company_name || 'EnRegla Corp'}
          totalSedes={locations.length}
          vigentes={metrics.vigentes}
          porVencer={metrics.porVencer}
          vencidos={metrics.vencidos}
          sedes={metrics.sedesWithPermits}
        />
      </div>
    </div>
  )
}
