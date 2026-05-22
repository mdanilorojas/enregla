import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useCompany, getDaysLeftInTrial, getEffectiveStatus } from '@/hooks/useCompany'
import { AlertTriangle } from '@/lib/lucide-icons'
import { isDemoCompanyId } from '@/lib/demo'

export function TrialBanner() {
  const { profile } = useAuth()
  const companyId = profile?.company_id ?? null
  const { data: company } = useCompany(companyId ?? undefined)

  if (!company) return null
  if (isDemoCompanyId(company.id)) return null

  const status = getEffectiveStatus(company)
  if (status !== 'trial') return null

  const days = getDaysLeftInTrial(company)
  if (days === null) return null
  if (days > 7) return null

  const urgent = days <= 3
  const cls = urgent
    ? 'bg-[var(--ds-risk-alto-bg,#fef2f2)] text-[var(--ds-risk-alto-text,#991b1b)] border-[var(--ds-risk-alto-border,#fecaca)]'
    : 'bg-[var(--ds-risk-medio-bg,#fffbeb)] text-[var(--ds-risk-medio-text,#92400e)] border-[var(--ds-risk-medio-border,#fde68a)]'

  const message =
    days === 0
      ? 'Tu prueba gratis termina hoy.'
      : days === 1
        ? 'Tu prueba gratis termina mañana.'
        : `Quedan ${days} días de prueba gratis.`

  return (
    <div
      role="status"
      className={`border-b ${cls} px-[var(--ds-space-300)] py-[var(--ds-space-150)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2`}
    >
      <div className="flex items-center gap-[var(--ds-space-150)]">
        <AlertTriangle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
        <p className="text-[var(--ds-font-size-100)] font-medium">
          {message}{' '}
          <span className="font-normal opacity-80">
            Después de esto necesitás un plan activo para seguir usando EnRegla.
          </span>
        </p>
      </div>
      <Link
        to="/pago"
        className="text-[var(--ds-font-size-100)] font-semibold underline w-full sm:w-auto text-center sm:text-left"
      >
        Activar plan →
      </Link>
    </div>
  )
}
