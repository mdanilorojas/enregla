import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useLocations } from '@/hooks/useLocations'
import { usePermits } from '@/hooks/usePermits'
import { LocationsGrid } from '@/features/locations/LocationsGrid'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Building2, Plus } from '@/lib/lucide-icons'
import { SkeletonList } from '@/components/ui/skeleton'
import { ComplianceWeatherCard, type WeatherState } from '@/components/ui/ComplianceWeatherCard'
import { ComplianceInvoiceCard, type InvoiceLine } from '@/components/ui/ComplianceInvoiceCard'

const AVG_PERMIT_COST = 45
const FINE_MULTIPLIER: Record<WeatherState, number> = {
  sunny: 3.2,
  warn: 4.5,
  err: 6,
}

function buildComplianceCopy(state: WeatherState, brand: string): {
  chipLabel: string
  headline: React.ReactNode
} {
  if (state === 'sunny') {
    return {
      chipLabel: 'Casi al día',
      headline: (
        <>
          Vas bien, <span className="brand">{brand}</span>. Solo te falta ponerte al día en unos pocos permisos.
        </>
      ),
    }
  }
  if (state === 'warn') {
    return {
      chipLabel: 'Te estás atrasando',
      headline: (
        <>
          <span className="brand">{brand}</span>, se te están acumulando los papeles. <b>Ponte las pilas</b> antes que te caiga una multa.
        </>
      ),
    }
  }
  return {
    chipLabel: 'Te pueden cerrar',
    headline: (
      <>
        <span className="brand">{brand}</span>, <b>te pueden clausurar el local</b> en cualquier momento. Hay que actuar ya.
      </>
    ),
  }
}

function buildWarningText(state: WeatherState): React.ReactNode {
  if (state === 'sunny') return <>Si no los pagas, la multa puede llegar a</>
  if (state === 'warn') return <>Si no arreglas esto, la multa puede llegar a</>
  return <>Clausura + multas hasta</>
}

export function DashboardView() {
  const { companyId: authCompanyId, profile } = useAuth()
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'
  const companyId = isDemoMode ? '50707999-f033-41c4-91c9-989966311972' : authCompanyId

  const { locations, loading: loadingLocs } = useLocations(companyId)
  const { permits, loading: loadingPermits } = usePermits({ companyId })

  const loading = loadingLocs || loadingPermits

  const metrics = useMemo(() => {
    const activePermits = permits.filter(p => p.is_active)
    const vigentes = activePermits.filter(p => p.status === 'vigente').length
    const porVencer = activePermits.filter(p => p.status === 'por_vencer').length
    const vencidos = activePermits.filter(p => p.status === 'vencido').length
    const total = activePermits.length

    const percentage = total > 0 ? Math.round((vigentes / total) * 100) : 0
    const missing = porVencer + vencidos
    const state: WeatherState = vencidos > 0 && percentage < 50
      ? 'err'
      : percentage < 80 || vencidos > 0
        ? 'warn'
        : 'sunny'

    const regularizeCost = Math.round(missing * AVG_PERMIT_COST)
    const fineCost = Math.round(regularizeCost * FINE_MULTIPLIER[state])

    return {
      vigentes,
      porVencer,
      vencidos,
      total,
      percentage,
      missing,
      state,
      regularizeCost,
      fineCost,
    }
  }, [permits])

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

  const brandName = profile?.company_id
    ? locations[0]?.name?.split(' ')[0] ?? 'tu negocio'
    : 'Hamburguesas La Española'

  const { chipLabel, headline } = buildComplianceCopy(metrics.state, brandName)

  const invoiceLines: InvoiceLine[] = metrics.missing > 0
    ? [
        ...(metrics.vencidos > 0
          ? [{ label: 'Permisos vencidos', detail: `${metrics.vencidos} trámites`, amount: Math.round(metrics.vencidos * AVG_PERMIT_COST) }]
          : []),
        ...(metrics.porVencer > 0
          ? [{ label: 'Permisos por vencer', detail: 'próximos 30 días', amount: Math.round(metrics.porVencer * AVG_PERMIT_COST) }]
          : []),
      ]
    : [{ label: 'Sin trámites pendientes', detail: 'Estás al 100%', amount: 0 }]

  return (
    <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-400)]">
      <div className="max-w-7xl mx-auto space-y-[var(--ds-space-400)]">
        <h1 className="text-[var(--ds-font-size-500)] font-bold text-[var(--ds-text)]">Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_440px] gap-5 items-stretch">
          <ComplianceWeatherCard
            state={metrics.state}
            chipLabel={chipLabel}
            headline={headline}
            percentage={metrics.percentage}
            permitsDone={metrics.vigentes}
            permitsTotal={metrics.total}
            locations={locations.length}
          />
          <ComplianceInvoiceCard
            lines={invoiceLines}
            total={metrics.regularizeCost}
            warningAmount={metrics.missing > 0 ? metrics.fineCost : undefined}
            warningText={metrics.missing > 0 ? buildWarningText(metrics.state) : undefined}
          />
        </div>

        <LocationsGrid standalone={false} />
      </div>
    </div>
  )
}
