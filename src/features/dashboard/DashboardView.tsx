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
import { Card } from '@/components/ui/card'
import { Building2, Plus } from '@/lib/lucide-icons'
import { SkeletonList } from '@/components/ui/skeleton'
import { TodayInbox } from './TodayInbox'

const PENDING_STATUSES = ['no_registrado','vencido','por_vencer','en_tramite'] as const

function formatUSD(n: number): string {
  // Convención EC: punto como separador de miles, sin decimales para rangos amplios
  return n.toLocaleString('es-EC', { maximumFractionDigits: 0 })
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

    const riskLevel: 'low' | 'medium' | 'high' =
      vencidos > 0 && percentage < 50 ? 'high' : percentage < 80 || vencidos > 0 ? 'medium' : 'low'

    return {
      pending: pending.length,
      vigentes, porVencer, vencidos, noRegistrado, enTramite, total,
      percentage, riskLevel,
      costMin, costMax, fineMin, fineMax, pendingWithoutCost,
    }
  }, [permits, requirements])

  const locationsById = useMemo(
    () => new Map(locations.map((l) => [l.id, { id: l.id, name: l.name }])),
    [locations]
  )

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
  const riskLabel =
    metrics.riskLevel === 'high' ? 'alto' : metrics.riskLevel === 'medium' ? 'medio' : 'bajo'
  const riskColor =
    metrics.riskLevel === 'high'
      ? 'text-[var(--ds-red-700)]'
      : metrics.riskLevel === 'medium'
        ? 'text-[var(--ds-orange-700)]'
        : 'text-[var(--ds-green-700)]'

  return (
    <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-400)]">
      <div className="max-w-7xl mx-auto space-y-[var(--ds-space-400)]">
        <div>
          <h1 className="text-[var(--ds-font-size-500)] font-bold text-[var(--ds-text)]">
            {brandName}
          </h1>
          <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mt-1">
            {metrics.vigentes} de {metrics.total} permisos vigentes · {locations.length} {locations.length === 1 ? 'sede' : 'sedes'} · Riesgo operativo <span className={`font-semibold ${riskColor}`}>{riskLabel}</span>
          </p>
        </div>

        <TodayInbox permits={permits} locationsById={locationsById} />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-[var(--ds-space-200)]">
          <SummaryStat label="Vigentes" value={metrics.vigentes} color="text-[var(--ds-green-700)]" />
          <SummaryStat label="Por vencer" value={metrics.porVencer} color="text-[var(--ds-orange-700)]" />
          <SummaryStat label="Vencidos" value={metrics.vencidos} color="text-[var(--ds-red-700)]" />
          <SummaryStat label="No registrados" value={metrics.noRegistrado} color="text-[var(--ds-text-subtle)]" />
        </div>

        {metrics.pending > 0 && (metrics.fineMin > 0 || metrics.fineMax > 0) && (
          <Card className="p-[var(--ds-space-300)] border-l-4 border-l-[var(--ds-orange-600)]">
            <div className="flex items-start gap-[var(--ds-space-200)]">
              <div>
                <h3 className="text-[var(--ds-font-size-200)] font-semibold text-[var(--ds-text)]">
                  Exposición a multas
                </h3>
                <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mt-1">
                  Según la normativa ecuatoriana, los {metrics.pending} permisos pendientes exponen a tu negocio a multas entre{' '}
                  <strong className="text-[var(--ds-text)]">
                    ${formatUSD(metrics.fineMin)} – ${formatUSD(metrics.fineMax)}
                  </strong>
                  . Costos estimados de trámites: ${formatUSD(metrics.costMin)} – ${formatUSD(metrics.costMax)}.
                  {metrics.pendingWithoutCost > 0 && (
                    <> {metrics.pendingWithoutCost} sin costo registrado en catálogo.</>
                  )}
                </p>
              </div>
            </div>
          </Card>
        )}

        <LocationsGrid standalone={false} />
      </div>
    </div>
  )
}

function SummaryStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card className="p-[var(--ds-space-250)]">
      <div className="text-[var(--ds-font-size-075)] uppercase tracking-wider text-[var(--ds-text-subtle)] font-semibold">
        {label}
      </div>
      <div className={`text-[var(--ds-font-size-500)] font-bold mt-1 ${color}`}>{value}</div>
    </Card>
  )
}
