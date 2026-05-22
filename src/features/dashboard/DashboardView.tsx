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
import { Building2, Plus, Download, AlertTriangle } from '@/lib/lucide-icons'
import { SkeletonList } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/ui/error-state'
import { OnboardingChecklist } from './OnboardingChecklist'
import { daysUntil } from '@/lib/dates'
import type { Permit } from '@/types/database'

const PENDING_STATUSES = ['no_registrado', 'vencido', 'por_vencer', 'en_tramite'] as const

function formatUSD(n: number): string {
  return n.toLocaleString('es-EC', { maximumFractionDigits: 0 })
}

interface PendingLine {
  permitId: string
  type: string
  locationName: string
  costMin: number
  costMax: number
  fineMin: number
  fineMax: number
  hasCost: boolean
}

export function DashboardView() {
  const { companyId: authCompanyId } = useAuth()
  const companyId = resolveCompanyId(authCompanyId) ?? undefined

  const { locations, loading: loadingLocs, error: locationsError, refetch: refetchLocations } = useLocations(companyId)
  const { permits, loading: loadingPermits, error: permitsError, refetch: refetchPermits } = usePermits({ companyId })
  const { data: company } = useCompany(companyId)
  const { data: requirements } = usePermitRequirements(company?.business_type ?? null)

  const loading = loadingLocs || loadingPermits

  const locationsById = useMemo(
    () => new Map(locations.map((l) => [l.id, l])),
    [locations]
  )

  const metrics = useMemo(() => {
    const activePermits = permits.filter((p) => p.is_active)
    const vigentes = activePermits.filter((p) => p.status === 'vigente').length
    const porVencer = activePermits.filter((p) => p.status === 'por_vencer').length
    const vencidos = activePermits.filter((p) => p.status === 'vencido').length
    const noRegistrado = activePermits.filter((p) => p.status === 'no_registrado').length
    const enTramite = activePermits.filter((p) => p.status === 'en_tramite').length
    const total = activePermits.length
    const percentage = total > 0 ? Math.round((vigentes / total) * 100) : 0

    const pending = activePermits.filter((p) =>
      (PENDING_STATUSES as readonly string[]).includes(p.status)
    )

    const reqByPermitType = new Map(
      (requirements ?? []).map((r) => [r.permit_type, r])
    )

    const pendingLines: PendingLine[] = pending.map((p) => {
      const req = reqByPermitType.get(p.type)
      const locName = p.location_id
        ? locationsById.get(p.location_id)?.name ?? 'Sin sede'
        : 'Sin sede'
      const costMin = req?.cost_min != null ? Number(req.cost_min) : 0
      const costMax = req?.cost_max != null ? Number(req.cost_max) : 0
      const fineMin = req?.fine_min != null ? Number(req.fine_min) : 0
      const fineMax = req?.fine_max != null ? Number(req.fine_max) : 0
      return {
        permitId: p.id,
        type: p.type,
        locationName: locName,
        costMin,
        costMax,
        fineMin,
        fineMax,
        hasCost: costMin > 0 || costMax > 0,
      }
    })

    const topPending = [...pendingLines].sort((a, b) => b.costMax - a.costMax).slice(0, 3)
    const topIds = new Set(topPending.map((l) => l.permitId))
    const rest = pendingLines.filter((l) => !topIds.has(l.permitId))
    const restCostMin = rest.reduce((s, l) => s + l.costMin, 0)
    const restCostMax = rest.reduce((s, l) => s + l.costMax, 0)
    const totalCostMin = pendingLines.reduce((s, l) => s + l.costMin, 0)
    const totalCostMax = pendingLines.reduce((s, l) => s + l.costMax, 0)
    const totalFineMin = pendingLines.reduce((s, l) => s + l.fineMin, 0)
    const totalFineMax = pendingLines.reduce((s, l) => s + l.fineMax, 0)

    const expired = activePermits
      .filter((p): p is Permit & { expiry_date: string } => p.status === 'vencido' && !!p.expiry_date)
      .map((p) => ({ permit: p, days: daysUntil(p.expiry_date) }))
      .filter((x) => x.days != null && x.days < 0)
      .sort((a, b) => (a.days as number) - (b.days as number))

    const mostUrgent: { permit: Permit; days: number } | null =
      expired.length > 0
        ? { permit: expired[0].permit, days: expired[0].days as number }
        : (() => {
            const upcoming = activePermits
              .filter(
                (p): p is Permit & { expiry_date: string } =>
                  p.status === 'por_vencer' && !!p.expiry_date
              )
              .map((p) => ({ permit: p, days: daysUntil(p.expiry_date) }))
              .filter((x) => x.days != null)
              .sort((a, b) => (a.days as number) - (b.days as number))
            return upcoming.length > 0
              ? { permit: upcoming[0].permit, days: upcoming[0].days as number }
              : null
          })()

    const riskLevel: 'low' | 'medium' | 'high' =
      vencidos > 0 && percentage < 50 ? 'high' : percentage < 80 || vencidos > 0 ? 'medium' : 'low'

    return {
      vigentes,
      porVencer,
      vencidos,
      noRegistrado,
      enTramite,
      total,
      percentage,
      riskLevel,
      pending: pending.length,
      topPending,
      restCount: rest.length,
      restCostMin,
      restCostMax,
      totalCostMin,
      totalCostMax,
      totalFineMin,
      totalFineMax,
      mostUrgent,
    }
  }, [permits, requirements, locationsById])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-200)] sm:p-[var(--ds-space-300)] lg:p-[var(--ds-space-400)]">
        <div className="max-w-7xl mx-auto">
          <SkeletonList count={1} />
        </div>
      </div>
    )
  }

  if (permitsError || locationsError) {
    return (
      <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-200)] sm:p-[var(--ds-space-300)] lg:p-[var(--ds-space-400)]">
        <div className="max-w-7xl mx-auto">
          <ErrorState
            title="No pudimos cargar el dashboard"
            error={permitsError ?? locationsError}
            onRetry={() => {
              void refetchPermits()
              refetchLocations()
            }}
          />
        </div>
      </div>
    )
  }

  if (locations.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-200)] sm:p-[var(--ds-space-300)] lg:p-[var(--ds-space-400)]">
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
    metrics.riskLevel === 'high' ? 'Alto' : metrics.riskLevel === 'medium' ? 'Medio' : 'Bajo'
  const riskBadgeClass =
    metrics.riskLevel === 'high'
      ? 'bg-[var(--ds-risk-alto-bg)] text-[var(--ds-risk-alto-text)] border-[var(--ds-risk-alto-border)]'
      : metrics.riskLevel === 'medium'
        ? 'bg-[var(--ds-risk-medio-bg)] text-[var(--ds-risk-medio-text)] border-[var(--ds-risk-medio-border)]'
        : 'bg-[var(--ds-risk-bajo-bg)] text-[var(--ds-risk-bajo-text)] border-[var(--ds-risk-bajo-border)]'

  const dasharrayCircumference = 263.9
  const dashOffset = dasharrayCircumference * (1 - metrics.percentage / 100)

  const percentVigente = metrics.total > 0 ? (metrics.vigentes / metrics.total) * 100 : 0
  const percentPorVencer = metrics.total > 0 ? (metrics.porVencer / metrics.total) * 100 : 0
  const percentVencido = metrics.total > 0 ? (metrics.vencidos / metrics.total) * 100 : 0
  const percentNoReg = metrics.total > 0 ? (metrics.noRegistrado / metrics.total) * 100 : 0

  const urgentSubtitle = (() => {
    if (!metrics.mostUrgent) return null
    const { permit, days } = metrics.mostUrgent
    const locName = permit.location_id
      ? locationsById.get(permit.location_id)?.name ?? 'Sin sede'
      : 'Sin sede'
    if (days < 0) {
      const abs = Math.abs(days)
      return {
        title: `${permit.type} · ${locName}`,
        tail: `venció hace ${abs} día${abs === 1 ? '' : 's'}`,
        isOverdue: true,
      }
    }
    return {
      title: `${permit.type} · ${locName}`,
      tail: `vence en ${days} día${days === 1 ? '' : 's'}`,
      isOverdue: false,
    }
  })()

  return (
    <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-200)] sm:p-[var(--ds-space-300)] lg:p-[var(--ds-space-400)]">
      <div className="max-w-7xl mx-auto space-y-[var(--ds-space-400)]">
        <OnboardingChecklist
          companyId={companyId}
          locationsCount={locations.length}
          permitsCount={permits.filter((p) => p.is_active).length}
        />

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-[var(--ds-space-200)] lg:gap-[var(--ds-space-300)]">
          <div className="min-w-0">
            <h1 className="text-[var(--ds-font-size-400)] sm:text-[var(--ds-font-size-500)] font-bold text-[var(--ds-text)] break-words">
              {brandName}
            </h1>
            <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mt-1">
              {metrics.vigentes} de {metrics.total} permisos vigentes · {locations.length}{' '}
              {locations.length === 1 ? 'sede' : 'sedes'} · Riesgo operativo{' '}
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[var(--ds-font-size-075)] font-semibold border ml-1 ${riskBadgeClass}`}
              >
                {riskLabel}
              </span>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row-reverse gap-[var(--ds-space-100)] w-full lg:w-auto">
            <Link to="/permisos" className="w-full sm:w-auto">
              <Button className="w-full">
                <Plus className="w-4 h-4" />
                Nuevo permiso
              </Button>
            </Link>
            <Button variant="secondary" className="w-full sm:w-auto">
              <Download className="w-4 h-4" />
              Exportar reporte
            </Button>
          </div>
        </div>

        {/* Hero grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,380px)] gap-[var(--ds-space-200)] lg:gap-[var(--ds-space-300)] items-stretch">
          {/* Gauge + KPIs card */}
          <div className="bg-white border border-[var(--ds-border)] rounded-[var(--ds-radius-300)] flex flex-col overflow-hidden">
            <div className="p-[var(--ds-space-200)] sm:p-[var(--ds-space-300)] grid grid-cols-1 md:grid-cols-[240px_1fr] gap-[var(--ds-space-300)] items-center flex-1">
              <div className="relative w-[200px] h-[200px] sm:w-[240px] sm:h-[240px] mx-auto">
                <svg
                  viewBox="0 0 100 100"
                  className="w-full h-full"
                  style={{ transform: 'rotate(-90deg)' }}
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="var(--ds-neutral-100)"
                    strokeWidth="6"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="var(--ds-status-vigente)"
                    strokeWidth="6"
                    strokeDasharray={dasharrayCircumference}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="34"
                    fill="none"
                    stroke="var(--ds-neutral-100)"
                    strokeWidth="2"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-[11px] uppercase tracking-[0.1em] font-semibold text-[var(--ds-text-subtle)]">
                    Cumplimiento
                  </div>
                  <div
                    className="font-light text-[var(--ds-text)] leading-none mt-1"
                    style={{
                      fontSize: 'clamp(48px, 12vw, 64px)',
                      letterSpacing: '-0.04em',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {metrics.percentage}
                    <span style={{ fontSize: 'clamp(20px, 4.5vw, 24px)', opacity: 0.6 }}>%</span>
                  </div>
                  <div className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] mt-[6px]">
                    {metrics.vigentes} / {metrics.total} vigentes
                  </div>
                </div>
              </div>

              <div className="grid gap-[var(--ds-space-100)]" style={{ gridTemplateRows: 'repeat(4, 1fr)' }}>
                <KpiBar
                  label="Vigentes"
                  value={metrics.vigentes}
                  percent={percentVigente}
                  color="var(--ds-status-vigente)"
                  textColor="var(--ds-status-vigente-text)"
                />
                <KpiBar
                  label="Por vencer"
                  value={metrics.porVencer}
                  percent={percentPorVencer}
                  color="var(--ds-status-por-vencer)"
                  textColor="var(--ds-status-por-vencer-text)"
                />
                <KpiBar
                  label="Vencidos"
                  value={metrics.vencidos}
                  percent={percentVencido}
                  color="var(--ds-status-vencido)"
                  textColor="var(--ds-status-vencido-text)"
                />
                <KpiBar
                  label="No registrados"
                  value={metrics.noRegistrado}
                  percent={percentNoReg}
                  color="var(--ds-status-no-registrado)"
                  textColor="var(--ds-status-no-registrado-text)"
                />
              </div>
            </div>

            {/* Bottom strip */}
            <div className="bg-[var(--ds-neutral-50)] border-t border-[var(--ds-border)] px-[var(--ds-space-200)] sm:px-[var(--ds-space-300)] py-[var(--ds-space-200)] grid grid-cols-1 md:grid-cols-[1fr_auto] gap-[var(--ds-space-200)] items-center">
              <div className="flex items-center gap-[var(--ds-space-150)]">
                <div className="w-9 h-9 rounded-[var(--ds-radius-200)] bg-[var(--ds-risk-critico-bg)] text-[var(--ds-risk-critico-text)] inline-flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-[18px] h-[18px]" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.05em] text-[var(--ds-text-subtle)] font-semibold">
                    Vencimiento más urgente
                  </div>
                  {urgentSubtitle ? (
                    <div className="text-[var(--ds-font-size-100)] font-semibold text-[var(--ds-text)] leading-snug mt-0.5">
                      {urgentSubtitle.title}{' '}
                      <span
                        className={
                          urgentSubtitle.isOverdue
                            ? 'text-[var(--ds-status-vencido-text)] font-bold'
                            : 'text-[var(--ds-status-por-vencer-text)] font-bold'
                        }
                      >
                        {urgentSubtitle.tail}
                      </span>
                    </div>
                  ) : (
                    <div className="text-[var(--ds-font-size-100)] font-semibold text-[var(--ds-text)] leading-snug mt-0.5">
                      Sin permisos urgentes
                    </div>
                  )}
                </div>
              </div>
              {metrics.pending > 0 && (
                <Link to="/permisos" className="w-full md:w-auto">
                  <Button className="w-full md:w-auto">
                    Ver {metrics.pending} acciones pendientes →
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Invoice card */}
          <InvoiceCard
            topPending={metrics.topPending}
            restCount={metrics.restCount}
            restCostMin={metrics.restCostMin}
            restCostMax={metrics.restCostMax}
            totalCostMin={metrics.totalCostMin}
            totalCostMax={metrics.totalCostMax}
            totalFineMin={metrics.totalFineMin}
            totalFineMax={metrics.totalFineMax}
          />
        </div>

        <LocationsGrid standalone={false} />
      </div>
    </div>
  )
}

function KpiBar({
  label,
  value,
  percent,
  color,
  textColor,
}: {
  label: string
  value: number
  percent: number
  color: string
  textColor: string
}) {
  return (
    <div>
      <div className="flex justify-between text-[12px] mb-1">
        <span className="text-[var(--ds-text-subtle)] font-medium">{label}</span>
        <span className="font-bold tabular-nums" style={{ color: textColor }}>
          {value}
        </span>
      </div>
      <div className="h-[6px] bg-[var(--ds-neutral-100)] rounded-[var(--ds-radius-100)] overflow-hidden">
        <div className="h-full" style={{ background: color, width: `${percent}%` }} />
      </div>
    </div>
  )
}

interface InvoiceCardProps {
  topPending: PendingLine[]
  restCount: number
  restCostMin: number
  restCostMax: number
  totalCostMin: number
  totalCostMax: number
  totalFineMin: number
  totalFineMax: number
}

function InvoiceCard({
  topPending,
  restCount,
  restCostMin,
  restCostMax,
  totalCostMin,
  totalCostMax,
  totalFineMin,
  totalFineMax,
}: InvoiceCardProps) {
  const hasItems = topPending.length > 0 || restCount > 0
  const hasFines = totalFineMin > 0 || totalFineMax > 0

  return (
    <div className="bg-white border border-[var(--ds-border)] rounded-[var(--ds-radius-300)] p-[var(--ds-space-200)] sm:p-[var(--ds-space-300)] flex flex-col gap-[var(--ds-space-200)]">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-[var(--ds-space-100)]">
          <div className="w-7 h-7 rounded-[var(--ds-radius-100)] bg-[var(--ds-neutral-100)] text-[var(--ds-text)] inline-flex items-center justify-center font-bold">
            $
          </div>
          <span className="font-semibold text-[var(--ds-text)] text-[var(--ds-font-size-200)]">
            Lo que te falta pagar
          </span>
        </div>
        <span className="text-[11px] uppercase tracking-[0.05em] text-[var(--ds-text-subtle)] font-semibold bg-[var(--ds-neutral-100)] px-2 py-0.5 rounded-[var(--ds-radius-100)]">
          aprox.
        </span>
      </div>

      {!hasItems && (
        <div className="py-[var(--ds-space-300)] text-center text-[var(--ds-text-subtle)] text-[var(--ds-font-size-100)]">
          Sin trámites pendientes
        </div>
      )}

      {hasItems && (
        <div className="flex flex-col">
          {topPending.map((line) => (
            <ReceiptLine
              key={line.permitId}
              title={line.type}
              subtitle={line.locationName}
              priceLabel={
                line.hasCost
                  ? `$${formatUSD(line.costMin)} – $${formatUSD(line.costMax)}`
                  : 's/d'
              }
            />
          ))}
          {restCount > 0 && (
            <RestSummaryLine
              count={restCount}
              priceLabel={
                restCostMin > 0 || restCostMax > 0
                  ? `$${formatUSD(restCostMin)} – $${formatUSD(restCostMax)}`
                  : 's/d'
              }
            />
          )}
        </div>
      )}

      {hasItems && (
        <div className="border-t border-[var(--ds-border)] pt-[var(--ds-space-200)] flex justify-between items-baseline">
          <span className="font-semibold text-[var(--ds-text)]">Total pendiente</span>
          <span className="font-bold tabular-nums text-[var(--ds-text)]">
            ${formatUSD(totalCostMin)} – ${formatUSD(totalCostMax)}
            <span className="text-[var(--ds-font-size-075)] font-normal text-[var(--ds-text-subtle)] ml-1">
              USD
            </span>
          </span>
        </div>
      )}

      {hasFines && (
        <div className="bg-[var(--ds-risk-alto-bg)] text-[var(--ds-risk-alto-text)] border border-[var(--ds-risk-alto-border)] rounded-[var(--ds-radius-200)] px-[var(--ds-space-200)] py-[var(--ds-space-150)] text-[var(--ds-font-size-075)]">
          Si no actuás, multas potenciales por{' '}
          <strong>
            ${formatUSD(totalFineMin)} – ${formatUSD(totalFineMax)}
          </strong>
          .
        </div>
      )}

      <div className="text-[11px] text-[var(--ds-text-subtle)] leading-snug">
        Valores aproximados según ARCSA, GAD y Bomberos.
      </div>
    </div>
  )
}

function ReceiptLine({
  title,
  subtitle,
  priceLabel,
}: {
  title: string
  subtitle: string | null
  priceLabel: string
}) {
  return (
    <div className="flex justify-between items-baseline py-[var(--ds-space-100)] border-b border-[var(--ds-border)] last:border-b-0 gap-[var(--ds-space-200)]">
      <div className="text-[var(--ds-font-size-100)] text-[var(--ds-text)] min-w-0">
        <span className="truncate inline-block max-w-full align-bottom">{title}</span>
        {subtitle && (
          <span className="text-[var(--ds-text-subtle)] text-[var(--ds-font-size-075)] block">
            {subtitle}
          </span>
        )}
      </div>
      <div className="font-semibold tabular-nums text-[var(--ds-text)] text-[var(--ds-font-size-100)] flex-shrink-0">
        {priceLabel}
      </div>
    </div>
  )
}

function RestSummaryLine({ count, priceLabel }: { count: number; priceLabel: string }) {
  return (
    <div className="mt-[var(--ds-space-100)] flex justify-between items-center gap-[var(--ds-space-200)] bg-[var(--ds-neutral-50)] border border-dashed border-[var(--ds-border)] rounded-[var(--ds-radius-200)] px-[var(--ds-space-200)] py-[var(--ds-space-100)]">
      <div className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] uppercase tracking-[0.05em] font-semibold">
        + {count} {count === 1 ? 'trámite más' : 'trámites más'}
      </div>
      <div className="text-[var(--ds-font-size-075)] tabular-nums text-[var(--ds-text-subtle)] font-medium">
        {priceLabel}
      </div>
    </div>
  )
}
