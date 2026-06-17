import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, X } from '@/lib/lucide-icons'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'

interface Props {
  companyId: string | null | undefined
  locationsCount: number
  permitsCount: number
}

const DISMISS_KEY = 'enregla.onboarding.dismissed'

export function OnboardingChecklist({
  companyId,
  locationsCount,
  permitsCount,
}: Props) {
  const [docsCount, setDocsCount] = useState<number | null>(null)
  const [membersCount, setMembersCount] = useState<number | null>(null)
  const [dismissed, setDismissed] = useState<boolean>(() =>
    typeof window !== 'undefined' && localStorage.getItem(DISMISS_KEY) === '1',
  )

  useEffect(() => {
    if (!companyId) return
    let cancelled = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(supabase as any)
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .then((res: { count: number | null }) => {
        if (!cancelled) setDocsCount(res.count ?? 0)
      })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(supabase as any)
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .then((res: { count: number | null }) => {
        if (!cancelled) setMembersCount(res.count ?? 0)
      })
    return () => {
      cancelled = true
    }
  }, [companyId])

  if (dismissed) return null

  const items = [
    {
      done: locationsCount > 0,
      title: 'Creá tu primera sede',
      desc: 'Agregá al menos una ubicación para que se generen tus permisos.',
      to: '/sedes',
      cta: 'Ir a sedes',
    },
    {
      done: permitsCount > 0,
      title: 'Revisá tus permisos',
      desc: 'Confirmá qué permisos están vigentes, vencidos o por tramitar.',
      to: '/permisos',
      cta: 'Ver permisos',
    },
    {
      done: (docsCount ?? 0) > 0,
      title: 'Subí tu primer documento',
      desc: 'Adjuntá el PDF de un permiso vigente para que quede de respaldo.',
      to: '/permisos',
      cta: 'Ir a permisos',
    },
    {
      done: (membersCount ?? 1) > 1,
      title: 'Invitá a tu equipo',
      desc: 'Sumá a quienes te ayudan con compliance para que vean lo mismo que vos.',
      to: '/settings',
      cta: 'Ir a configuración',
    },
  ]

  const completed = items.filter((i) => i.done).length
  const total = items.length

  if (completed === total) return null

  const handleDismiss = () => {
    setDismissed(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem(DISMISS_KEY, '1')
    }
  }

  return (
    <Card className="p-[var(--ds-space-300)]">
      <div className="flex items-start justify-between gap-[var(--ds-space-200)] mb-[var(--ds-space-200)]">
        <div>
          <h2 className="text-[var(--ds-font-size-300)] font-semibold text-[var(--ds-text)]">
            Configurá tu cuenta ({completed}/{total})
          </h2>
          <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mt-[var(--ds-space-050)]">
            Pocos pasos para tener todo listo y aprovechar EnRegla al máximo.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-[var(--ds-text-subtle)] hover:text-[var(--ds-text)] transition-colors"
          aria-label="Ocultar guía"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--ds-space-200)]">
        {items.map((item) => (
          <Link
            key={item.title}
            to={item.to}
            className={`flex items-start gap-[var(--ds-space-150)] p-[var(--ds-space-200)] rounded-[var(--ds-radius-200)] border transition-colors ${
              item.done
                ? 'border-[var(--ds-status-vigente,#16a34a)] bg-[var(--ds-status-vigente-bg,#f0fdf4)]'
                : 'border-[var(--ds-border)] hover:border-[var(--ds-border-bold)] hover:bg-[var(--ds-neutral-50)]'
            }`}
          >
            {item.done ? (
              <CheckCircle2 className="w-5 h-5 text-[var(--ds-status-vigente-text,#15803d)] flex-shrink-0 mt-0.5" />
            ) : (
              <Circle className="w-5 h-5 text-[var(--ds-text-subtle)] flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <div
                className={`text-[var(--ds-font-size-100)] font-semibold ${
                  item.done ? 'text-[var(--ds-status-vigente-text,#15803d)]' : 'text-[var(--ds-text)]'
                }`}
              >
                {item.title}
              </div>
              <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] mt-0.5">
                {item.desc}
              </p>
              {!item.done && (
                <span className="text-[var(--ds-font-size-075)] font-semibold text-[var(--ds-text-brand)] mt-[var(--ds-space-100)] inline-block">
                  {item.cta} →
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </Card>
  )
}
