import { useMemo, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { resolveCompanyId } from '@/lib/demo'
import { useLocations } from '@/hooks/useLocations'
import { usePermits } from '@/hooks/usePermits'
import { useCompany } from '@/hooks/useCompany'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, Plus, ChevronRight, ArrowRight, Check } from '@/lib/lucide-icons'
import { permitTypeLabel } from '@/lib/domain/permit-types'
import { businessTypeLabel } from '@/lib/domain/business-types'
import { SkeletonList } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/ui/error-state'
import { EmptyState } from '@/components/ui/empty-state'
import { OnboardingChecklist } from './OnboardingChecklist'
import { daysUntil } from '@/lib/dates'
import type { Permit, Location } from '@/types/database'
import { ComplianceWeatherCard } from '@/components/ui/ComplianceWeatherCard'
import { computeComplianceWeather } from './compliance-weather'

const STATUS_ORDER = {
  vencido: 0,
  por_vencer: 1,
  no_registrado: 2,
  en_tramite: 3,
  vigente: 4,
} as const

interface CriticalAction {
  id: string
  type: string
  locationId: string | null
  locationName: string
  status: 'vigente' | 'por_vencer' | 'vencido' | 'no_registrado' | 'en_tramite'
  days: number | null
}

export function DashboardView() {
  const navigate = useNavigate()
  const { companyId: authCompanyId } = useAuth()
  const companyId = resolveCompanyId(authCompanyId) ?? undefined

  const [isEntranceAnimating, setIsEntranceAnimating] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsEntranceAnimating(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])



  const { locations, loading: loadingLocs, error: locationsError, refetch: refetchLocations } = useLocations(companyId)
  const { permits, loading: loadingPermits, error: permitsError, refetch: refetchPermits } = usePermits({ companyId })
  const { data: company } = useCompany(companyId)

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

    // Filter permits that require attention (not active/vigente)
    const pendingActions = activePermits
      .filter((p) => p.status !== 'vigente')
      .map((p): CriticalAction => {
        const locName = p.location_id
          ? locationsById.get(p.location_id)?.name ?? 'Sin Sede'
          : 'Sin Sede'
        const days = p.expiry_date ? daysUntil(p.expiry_date) : null
        return {
          id: p.id,
          type: p.type,
          locationId: p.location_id,
          locationName: locName,
          status: p.status as CriticalAction['status'],
          days,
        }
      })
      // Sort: Expired first, then approaching expiry, then not registered
      .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])

    // Find the single most urgent notification
    const expired = activePermits
      .filter((p): p is Permit & { expiry_date: string } => p.status === 'vencido' && !!p.expiry_date)
      .map((p) => ({ permit: p, days: daysUntil(p.expiry_date) }))
      .filter((x) => x.days != null && x.days < 0)
      .sort((a, b) => (a.days as number) - (b.days as number))

    const mostUrgent = expired.length > 0
      ? { permit: expired[0].permit, days: expired[0].days as number }
      : (() => {
          const upcoming = activePermits
            .filter((p): p is Permit & { expiry_date: string } => p.status === 'por_vencer' && !!p.expiry_date)
            .map((p) => ({ permit: p, days: daysUntil(p.expiry_date) }))
            .filter((x) => x.days != null)
            .sort((a, b) => (a.days as number) - (b.days as number))
          return upcoming.length > 0
            ? { permit: upcoming[0].permit, days: upcoming[0].days as number }
            : null
        })()

    const weather = computeComplianceWeather({
      vencidos,
      porVencer,
      noRegistrado,
      enTramite,
      total,
    })

    const riskLevel: 'low' | 'medium' | 'high' | 'critical' =
      total === 0 ? 'low'
      : weather.state === 'err' ? 'critical'
      : weather.state === 'warn' ? 'medium'
      : 'low'

    return {
      vigentes,
      porVencer,
      vencidos,
      noRegistrado,
      enTramite,
      total,
      percentage,
      riskLevel,
      pendingActions,
      mostUrgent,
      weather,
    }
  }, [permits, locationsById])

  const handleResolveAlerts = () => {
    if (metrics.weather.state === 'sunny') {
      navigate('/permisos')
    } else {
      const el = document.getElementById('action-hub')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }

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
                <Button variant="default" className="h-8 px-[var(--ds-space-150)] text-[var(--ds-font-size-100)] font-semibold rounded-[var(--ds-radius-100)]">
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
  const riskBadgeVariant =
    metrics.riskLevel === 'critical' ? 'risk-critico'
    : metrics.riskLevel === 'medium' ? 'risk-medio'
    : 'risk-bajo'

  const riskLabel =
    metrics.riskLevel === 'critical' ? 'Crítico'
    : metrics.riskLevel === 'medium' ? 'Medio'
    : 'Bajo'


  return (
    <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-200)] sm:p-[var(--ds-space-300)] lg:p-[var(--ds-space-400)]">
      <div className="max-w-7xl mx-auto space-y-[var(--ds-space-400)]">
        <OnboardingChecklist
          companyId={companyId}
          locationsCount={locations.length}
          permitsCount={permits.filter((p) => p.is_active).length}
        />

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-[var(--ds-space-200)] lg:gap-[var(--ds-space-300)] pb-[var(--ds-space-200)] border-b border-[var(--ds-border)]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-[var(--ds-space-150)]">
              <h1 className="text-[var(--ds-font-size-500)] sm:text-[var(--ds-font-size-600)] font-extrabold text-[var(--ds-text)] break-words tracking-tight">
                {brandName}
              </h1>
              {company?.business_type && (
                company.business_type === 'restaurante' ? (
                  <div 
                    title="Giro Comercial: Restaurante · Control de ARCSA y Bomberos Activo"
                    className="group shrink-0 inline-flex items-center gap-2 bg-[var(--ds-blue-50)] hover:bg-[#e1e7f5] hover:border-[var(--ds-blue-500)] text-[var(--ds-blue-600)] px-3 py-1.5 rounded-full text-xs font-bold border border-transparent transition-all duration-200 cursor-pointer shadow-sm select-none animate-fade-in"
                  >
                    <div className="relative w-[18px] h-[18px]">
                      <svg viewBox="0 0 24 24" className="w-full h-full fill-none stroke-current stroke-[2.2]">
                        {/* Steam Trails */}
                        <path 
                          className={isEntranceAnimating ? "animate-steam-rise" : "hidden group-hover:block animate-steam-rise"} 
                          d="M10 5 C10 3, 11 2, 10.5 1" 
                        />
                        <path 
                          className={isEntranceAnimating ? "animate-steam-rise [animation-delay:0.2s]" : "hidden group-hover:block animate-steam-rise [animation-delay:0.2s]"} 
                          d="M12 5 C12 3, 13 2, 12.5 1" 
                        />
                        <path 
                          className={isEntranceAnimating ? "animate-steam-rise [animation-delay:0.4s]" : "hidden group-hover:block animate-steam-rise [animation-delay:0.4s]"} 
                          d="M14 5 C14 3, 15 2, 14.5 1" 
                        />
                        {/* Cloche dome */}
                        <path 
                          className={isEntranceAnimating ? "animate-cloche-entrance" : "transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:-rotate-3 origin-bottom"} 
                          d="M4 16 A8 8 0 0 1 20 16 Z M12 8 a 1 1 0 1 1 0-2" 
                        />
                        {/* Tray Base */}
                        <path d="M2 17h20v2H2z" />
                      </svg>
                    </div>
                    <span>Restaurante</span>
                  </div>
                ) : (
                  <Badge variant="info" size="sm" className="shrink-0">
                    {businessTypeLabel(company.business_type)}
                  </Badge>
                )
              )}
            </div>
            <div className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mt-1 font-medium flex flex-wrap items-center gap-2">
              <span>{metrics.vigentes} de {metrics.total} permisos vigentes</span>
              <span>·</span>
              <span>{locations.length} {locations.length === 1 ? 'sede' : 'sedes'}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                Riesgo operativo
                <Badge variant={riskBadgeVariant} size="sm">
                  {riskLabel}
                </Badge>
              </span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row-reverse gap-[var(--ds-space-100)] w-full lg:w-auto">
            <Link to="/permisos" className="w-full sm:w-auto">
              <Button className="w-full h-8 px-[var(--ds-space-150)] text-[var(--ds-font-size-100)] font-bold rounded-[var(--ds-radius-100)]">
                <Plus className="w-4 h-4" />
                Nuevo permiso
              </Button>
            </Link>
          </div>
        </div>

        {/* Compliance Weather Card at full width */}
        <ComplianceWeatherCard
          state={metrics.weather.state}
          chipLabel={metrics.weather.chipLabel}
          headline={metrics.weather.headline}
          percentage={metrics.percentage}
          permitsDone={metrics.vigentes}
          permitsTotal={metrics.total}
          locations={locations.length}
          onActionClick={handleResolveAlerts}
        />

        {/* Core Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-[var(--ds-space-200)] lg:gap-[var(--ds-space-300)] items-start">
          
          {/* Left Column: Locations */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-[var(--ds-space-150)]">
            <h3 className="text-[var(--ds-font-size-075)] font-extrabold text-[var(--ds-text-subtle)] uppercase tracking-[0.1em] px-[var(--ds-space-100)]">
              Tus Locales y Estado por Sede
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--ds-space-200)] lg:gap-[var(--ds-space-300)]">
              {locations.map((location) => {
                const locationPermits = permits.filter(
                  (p) => p.location_id === location.id && p.is_active
                )
                return (
                  <DashboardLocationCard
                    key={location.id}
                    location={location}
                    permits={locationPermits}
                  />
                )
              })}
            </div>
          </div>

          {/* Right Column: Action Hub (Acciones Críticas y Tareas) */}
          <div className="lg:col-span-5 xl:col-span-4">
            <Card id="action-hub" className="p-[var(--ds-space-300)] flex flex-col justify-between gap-[var(--ds-space-300)]">
              <div>
                <div className="flex justify-between items-center pb-[var(--ds-space-150)] border-b border-[var(--ds-border)] mb-[var(--ds-space-150)]">
                  <h3 className="text-[var(--ds-font-size-075)] font-extrabold text-[var(--ds-text-subtle)] uppercase tracking-[0.1em]">
                    Acciones Requeridas
                  </h3>
                  <span className="text-[var(--ds-font-size-075)] font-bold bg-[var(--ds-risk-critico-bg)] text-[var(--ds-risk-critico-text)] px-2 py-0.5 rounded-full border border-[var(--ds-risk-critico-border)]">
                    {metrics.pendingActions.length} alertas
                  </span>
                </div>

                {metrics.pendingActions.length === 0 ? (
                  <div className="py-[var(--ds-space-400)] text-center flex flex-col items-center justify-center gap-2.5">
                    <div className="w-12 h-12 rounded-full bg-[var(--ds-green-50)] flex items-center justify-center text-[var(--ds-status-vigente)] border border-[var(--ds-green-200)] shadow-sm">
                      <Check className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-[var(--ds-font-size-100)] font-extrabold text-[var(--ds-text)]">¡Todo seguro!</h4>
                      <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] mt-0.5 max-w-[200px]">No tienes alertas operativas ni permisos que requieran acción inmediata.</p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--ds-neutral-100)]">
                    {metrics.pendingActions.slice(0, 4).map((action) => (
                      <ActionItemRow key={action.id} action={action} />
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Actions Footer */}
              <div className="border-t border-[var(--ds-border)] pt-[var(--ds-space-200)]">
                <Link to="/permisos" className="w-full">
                  <Button variant="secondary" className="w-full h-8 text-[var(--ds-font-size-075)] font-bold rounded-[var(--ds-radius-100)] flex justify-center items-center gap-1">
                    Ver Todos los Permisos
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

        </div>
      </div>
    </div>
  )
}

function ActionItemRow({ action }: { action: CriticalAction }) {
  // Determine color coding for action status badge
  const badgeVariant = (() => {
    switch (action.status) {
      case 'vencido':
        return 'risk-critico'
      case 'por_vencer':
        return 'risk-alto'
      case 'no_registrado':
        return 'risk-medio'
      default:
        return 'secondary'
    }
  })()

  const badgeBorderClass = (() => {
    switch (action.status) {
      case 'vencido':
        return 'border-[var(--ds-risk-critico-border)] shadow-sm'
      case 'por_vencer':
        return 'border-[var(--ds-risk-alto-border)]'
      case 'no_registrado':
        return 'border-[var(--ds-risk-medio-border)]'
      default:
        return 'border-transparent'
    }
  })()

  const labelText = (() => {
    switch (action.status) {
      case 'vencido':
        return 'Vencido'
      case 'por_vencer':
        return 'Por Vencer'
      case 'no_registrado':
        return 'Falta Registrar'
      default:
        return 'Pendiente'
    }
  })()

  const urgencyText = (() => {
    if (action.days === null) return 'Sin fecha límite'
    if (action.days < 0) {
      const abs = Math.abs(action.days)
      return `Expiró hace ${abs} día${abs === 1 ? '' : 's'}`
    }
    return `Expira en ${action.days} día${action.days === 1 ? '' : 's'}`
  })()

  return (
    <Link
      to={`/permisos/${action.id}`}
      className="flex justify-between items-center py-[var(--ds-space-150)] px-[var(--ds-space-150)] gap-[var(--ds-space-150)] hover:bg-[var(--ds-neutral-50)] rounded-[var(--ds-radius-100)] transition-all duration-200 cursor-pointer"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[var(--ds-font-size-100)] font-semibold text-[var(--ds-text)] truncate">
            {permitTypeLabel(action.type)}
          </span>
          <Badge variant={badgeVariant} size="lg" className={`border ${badgeBorderClass}`}>
            {labelText}
          </Badge>
        </div>
        <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] font-medium mt-1 flex flex-wrap gap-1.5 items-center">
          <span>{action.locationName}</span>
          <span>·</span>
          <span className={action.status === 'vencido' ? 'text-[var(--ds-status-vencido-text)] font-semibold' : action.status === 'por_vencer' ? 'text-[var(--ds-status-por-vencer-text)] font-semibold' : ''}>
            {urgencyText}
          </span>
        </p>
      </div>

      <Button asChild variant="subtle" size="sm" className="font-bold flex items-center gap-1 flex-shrink-0">
        <span>
          Resolver
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </Button>
    </Link>
  )
}

function DashboardLocationCard({ location, permits }: { location: Location; permits: Permit[] }) {
  const activePermits = permits.filter((p) => p.is_active)
  const vigentes = activePermits.filter((p) => p.status === 'vigente').length
  const total = activePermits.length
  const percentage = total > 0 ? (vigentes / total) * 100 : 0

  const locationVencidos = activePermits.filter((p) => p.status === 'vencido').length

  const riskLevel: 'Bajo' | 'Medio' | 'Alto' | 'Crítico' | 'Sin Permisos' =
    total === 0 ? 'Sin Permisos'
    : locationVencidos > 0 ? 'Crítico'
    : percentage >= 90 ? 'Bajo'
    : percentage >= 70 ? 'Medio'
    : 'Alto'

  const riskBadgeVariant =
    riskLevel === 'Sin Permisos' ? 'secondary'
    : riskLevel === 'Bajo' ? 'risk-bajo'
    : riskLevel === 'Medio' ? 'risk-medio'
    : riskLevel === 'Alto' ? 'risk-alto'
    : 'risk-critico'

  const locationCode = `SEDE-${location.id.substring(0, 8).toUpperCase()}`
  
  const statusLabel =
    location.status === 'operando'
      ? 'Operativa'
      : location.status === 'en_preparacion'
        ? 'En preparación'
        : 'Inactiva'

  return (
    <Link
      to={`/sedes/${location.id}`}
      className="block focus-visible:outline-none"
      aria-label={`Ver detalles de ${location.name}`}
    >
      <Card className="p-[var(--ds-space-300)] flex flex-col justify-between gap-[var(--ds-space-200)] hover:bg-[var(--ds-neutral-50)] border border-transparent hover:border-[var(--ds-border-bold)] transition-all duration-200 cursor-pointer h-full">
        {/* Header: icon + name + code */}
        <div className="flex items-start gap-[var(--ds-space-200)] mb-1">
          <div className="w-10 h-10 bg-[var(--ds-neutral-100)] rounded-[var(--ds-radius-200)] flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-[var(--ds-text-subtle)]" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[var(--ds-font-size-200)] text-[var(--ds-text)] truncate">
              {location.name}
            </h3>
            <p className="text-[var(--ds-font-size-075)] font-mono text-[var(--ds-text-subtlest)] mt-0.5">
              {locationCode}
            </p>
          </div>
        </div>

        {/* Meta row: Estado | Riesgo */}
        <div className="flex items-center gap-[var(--ds-space-150)] text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] font-medium mb-1">
          <span>{statusLabel}</span>
          <span className="text-[var(--ds-border)]">|</span>
          <Badge variant={riskBadgeVariant} size="sm">
            {riskLevel}
          </Badge>
        </div>

        {/* Permits progress */}
        <div className="mt-1">
          <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] mb-1.5 font-medium">
            {vigentes}/{total || 0} permisos vigentes
          </p>
          <div className="h-[6px] bg-[var(--ds-neutral-100)] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500 bg-[var(--ds-status-vigente)]" style={{ width: `${percentage}%` }} />
          </div>
        </div>
      </Card>
    </Link>
  )
}
