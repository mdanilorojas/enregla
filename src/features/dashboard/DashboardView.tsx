import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { resolveCompanyId } from '@/lib/demo'
import { useLocations } from '@/hooks/useLocations'
import { usePermits } from '@/hooks/usePermits'
import { useCompany } from '@/hooks/useCompany'
import { usePermitRequirements } from '@/lib/domain/permit-requirements'
import { LocationsGrid } from '@/features/locations/LocationsGrid'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Building2, Plus } from '@/lib/lucide-icons'
import { SkeletonList } from '@/components/ui/skeleton'
import { ComplianceWeatherCard, type WeatherState } from '@/components/ui/ComplianceWeatherCard'
import { ComplianceInvoiceCard, type InvoiceLine, type InvoiceAmount } from '@/components/ui/ComplianceInvoiceCard'

const PENDING_STATUSES = ['no_registrado','vencido','por_vencer','en_tramite'] as const

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
  const { companyId: authCompanyId } = useAuth()
  const companyId = resolveCompanyId(authCompanyId) ?? undefined

  const { locations, loading: loadingLocs } = useLocations(companyId)
  const { permits, loading: loadingPermits } = usePermits({ companyId })
  const { data: company } = useCompany(companyId)
  const { data: requirements } = usePermitRequirements(company?.business_type ?? null)

  const loading = loadingLocs || loadingPermits

  const metrics = useMemo(() => {
    const activePermits = permits.filter(p => p.is_active)
    const pending = activePermits.filter(p => (PENDING_STATUSES as readonly string[]).includes(p.status))
    const vigentes = activePermits.filter(p => p.status === 'vigente').length
    const porVencer = activePermits.filter(p => p.status === 'por_vencer').length
    const vencidos = activePermits.filter(p => p.status === 'vencido').length
    const noRegistrado = activePermits.filter(p => p.status === 'no_registrado').length
    const enTramite = activePermits.filter(p => p.status === 'en_tramite').length
    const total = activePermits.length
    const percentage = total > 0 ? Math.round((vigentes / total) * 100) : 0

    const reqByPermitType = new Map(
      (requirements ?? []).map(r => [r.permit_type, r])
    )
    let costMin = 0
    let costMax = 0
    let fineMin = 0
    let fineMax = 0
    let pendingWithoutCost = 0
    for (const p of pending) {
      const req = reqByPermitType.get(p.type)
      if (!req || req.cost_min == null) {
        pendingWithoutCost++
        continue
      }
      costMin += Number(req.cost_min ?? 0)
      costMax += Number(req.cost_max ?? 0)
      if (req.fine_min != null) fineMin += Number(req.fine_min ?? 0)
      if (req.fine_max != null) fineMax += Number(req.fine_max ?? 0)
    }

    const state: WeatherState = vencidos > 0 && percentage < 50
      ? 'err'
      : percentage < 80 || vencidos > 0
        ? 'warn'
        : 'sunny'

    return {
      pending: pending.length,
      vigentes, porVencer, vencidos, noRegistrado, enTramite, total,
      percentage, state,
      costMin, costMax, fineMin, fineMax, pendingWithoutCost,
    }
  }, [permits, requirements])

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

  const brandName = company?.name ?? 'tu negocio'

  const { chipLabel, headline } = buildComplianceCopy(metrics.state, brandName)

  const invoiceLines: InvoiceLine[] =
    metrics.pending === 0
      ? [{ label: 'Todo al día', detail: `${metrics.total} permisos vigentes`, amount: 0 }]
      : [
          ...(metrics.vencidos > 0
            ? [{ label: 'Vencidos', detail: `${metrics.vencidos} trámite${metrics.vencidos>1?'s':''}`, amount: 0 as InvoiceAmount }]
            : []),
          ...(metrics.porVencer > 0
            ? [{ label: 'Por vencer', detail: `${metrics.porVencer} próximos 30 días`, amount: 0 as InvoiceAmount }]
            : []),
          ...(metrics.noRegistrado > 0
            ? [{ label: 'No registrados', detail: `${metrics.noRegistrado} permisos`, amount: 0 as InvoiceAmount }]
            : []),
          ...(metrics.enTramite > 0
            ? [{ label: 'En trámite', detail: `${metrics.enTramite} en proceso`, amount: 0 as InvoiceAmount }]
            : []),
        ]

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
            total={metrics.pending > 0 ? { min: metrics.costMin, max: metrics.costMax } : 0}
            warningAmount={metrics.pending > 0 ? { min: metrics.fineMin, max: metrics.fineMax } : undefined}
            warningText={metrics.pending > 0 ? buildWarningText(metrics.state) : undefined}
          />
        </div>

        <LocationsGrid standalone={false} />
      </div>
    </div>
  )
}
