import { useState } from 'react'
import { ChevronDown } from '@/lib/lucide-icons'
import { cn } from '@/lib/utils'
import { RoleBadge } from '@/components/ui/RoleBadge'
import { CostRangeLabel } from '@/components/ui/CostRangeLabel'
import type { RequiredRole } from '@/lib/domain/permit-roles'

export interface LegalMatrixAccordionRow {
  permitType: string
  permitLabel: string
  issuer: string | null
  role: RequiredRole | null
  costMin: number | null
  costMax: number | null
  applicableBusinessTypes: { type: string; label: string; status: 'R' | 'O' | 'T' }[]
}

interface LegalMatrixAccordionProps {
  rows: LegalMatrixAccordionRow[]
}

const STATUS_STYLES: Record<'R' | 'O' | 'T', string> = {
  R: 'bg-green-600 text-white',
  O: 'bg-amber-500 text-white',
  T: 'bg-blue-400 text-white',
}

const STATUS_LABELS: Record<'R' | 'O' | 'T', string> = {
  R: 'Obligatorio',
  O: 'Opcional',
  T: 'Condicional',
}

export function LegalMatrixAccordion({ rows }: LegalMatrixAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <ul className="list-none m-0 p-0 space-y-[var(--ds-space-100)]">
      {rows.map((row) => {
        const isOpen = openId === row.permitType
        return (
          <li
            key={row.permitType}
            className="rounded-[var(--ds-radius-200)] border border-[var(--ds-border)] bg-white"
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : row.permitType)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-[var(--ds-space-150)] px-[var(--ds-space-200)] py-[var(--ds-space-150)] min-h-[44px] text-left"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[var(--ds-text)] break-words">
                  {row.permitLabel}
                </p>
                <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] truncate">
                  {row.issuer ?? '—'}
                </p>
              </div>
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-[var(--ds-text-subtle)] transition-transform motion-reduce:transition-none flex-shrink-0',
                  isOpen && 'rotate-180'
                )}
                aria-hidden="true"
              />
            </button>
            {isOpen && (
              <div className="border-t border-[var(--ds-border)] px-[var(--ds-space-200)] py-[var(--ds-space-150)] space-y-[var(--ds-space-150)]">
                <div className="grid grid-cols-2 gap-[var(--ds-space-150)] text-[var(--ds-font-size-075)]">
                  <div>
                    <dt className="text-[var(--ds-text-subtle)]">Rol</dt>
                    <dd className="mt-1">
                      {row.role ? <RoleBadge role={row.role} /> : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--ds-text-subtle)]">Costo</dt>
                    <dd className="mt-1">
                      <CostRangeLabel min={row.costMin} max={row.costMax} />
                    </dd>
                  </div>
                </div>
                <div>
                  <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] mb-[var(--ds-space-100)]">
                    Aplica a giros
                  </p>
                  {row.applicableBusinessTypes.length === 0 ? (
                    <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">
                      No aplica a ningún tipo de negocio.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-[var(--ds-space-050)]">
                      {row.applicableBusinessTypes.map((bt) => (
                        <span
                          key={bt.type}
                          title={STATUS_LABELS[bt.status]}
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-1 rounded-[var(--ds-radius-100)] text-[var(--ds-font-size-075)] font-medium',
                            STATUS_STYLES[bt.status]
                          )}
                        >
                          <span className="font-bold">{bt.status}</span>
                          {bt.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
