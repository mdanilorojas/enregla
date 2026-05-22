import { useState } from 'react'
import { Search, SlidersHorizontal, X } from '@/lib/lucide-icons'
import { permitTypeLabel } from '@/lib/domain/permit-types'

const STATUS_LABELS: Record<string, string> = {
  vigente: 'Vigente',
  por_vencer: 'Por vencer',
  vencido: 'Vencido',
  en_tramite: 'En trámite',
  no_registrado: 'No registrado',
}

export interface FilterState {
  search: string
  status: string
  type: string
  location: string
}

export interface PermitTableFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  availableStatuses: string[]
  availableTypes: string[]
  availableLocations: Array<{ id: string; name: string }>
}

export function PermitTableFilters({
  filters,
  onFiltersChange,
  availableStatuses,
  availableTypes,
  availableLocations,
}: PermitTableFiltersProps) {
  const [filtersOpen, setFiltersOpen] = useState(false)

  const update = (partial: Partial<FilterState>) => onFiltersChange({ ...filters, ...partial })

  const activeCount =
    (filters.status ? 1 : 0) + (filters.type ? 1 : 0) + (filters.location ? 1 : 0)

  return (
    <div className="space-y-[var(--ds-space-150)]">
      <div className="flex flex-col sm:flex-row gap-[var(--ds-space-150)] sm:items-center">
        <div className="relative flex-1 min-w-0">
          <Search
            className="w-4 h-4 absolute left-[var(--ds-space-100)] top-1/2 -translate-y-1/2 text-[var(--ds-text-subtlest)]"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Buscar..."
            value={filters.search}
            onChange={e => update({ search: e.target.value })}
            aria-label="Buscar permisos"
            className="w-full pl-8 pr-[var(--ds-space-150)] min-h-[44px] border-2 border-[var(--ds-border)] rounded-[var(--ds-radius-100)] text-[var(--ds-font-size-100)] focus:border-[var(--ds-background-brand)] focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={() => setFiltersOpen(o => !o)}
          aria-expanded={filtersOpen}
          className="sm:hidden inline-flex items-center justify-center gap-2 min-h-[44px] px-4 border-2 border-[var(--ds-border)] rounded-[var(--ds-radius-100)] bg-white text-[var(--ds-text)] hover:bg-[var(--ds-neutral-50)] transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtros
          {activeCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[var(--ds-background-brand)] text-white text-xs font-semibold">
              {activeCount}
            </span>
          )}
        </button>

        <div className="hidden sm:flex flex-wrap gap-[var(--ds-space-100)]">
          <FilterSelect
            value={filters.status}
            onChange={v => update({ status: v })}
            options={availableStatuses.map(s => ({ value: s, label: STATUS_LABELS[s] ?? s }))}
            placeholder="Todos los estados"
          />
          <FilterSelect
            value={filters.type}
            onChange={v => update({ type: v })}
            options={availableTypes.map(t => ({ value: t, label: permitTypeLabel(t) }))}
            placeholder="Todos los tipos"
          />
          <FilterSelect
            value={filters.location}
            onChange={v => update({ location: v })}
            options={availableLocations.map(l => ({ value: l.id, label: l.name }))}
            placeholder="Todas las sedes"
          />
        </div>
      </div>

      {filtersOpen && (
        <div className="sm:hidden grid grid-cols-1 gap-[var(--ds-space-100)]">
          <FilterSelect
            value={filters.status}
            onChange={v => update({ status: v })}
            options={availableStatuses.map(s => ({ value: s, label: STATUS_LABELS[s] ?? s }))}
            placeholder="Todos los estados"
            fullWidth
          />
          <FilterSelect
            value={filters.type}
            onChange={v => update({ type: v })}
            options={availableTypes.map(t => ({ value: t, label: permitTypeLabel(t) }))}
            placeholder="Todos los tipos"
            fullWidth
          />
          <FilterSelect
            value={filters.location}
            onChange={v => update({ location: v })}
            options={availableLocations.map(l => ({ value: l.id, label: l.name }))}
            placeholder="Todas las sedes"
            fullWidth
          />
          {activeCount > 0 && (
            <button
              type="button"
              onClick={() =>
                onFiltersChange({ search: filters.search, status: '', type: '', location: '' })
              }
              className="inline-flex items-center justify-center gap-1 min-h-[44px] text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] hover:text-[var(--ds-text)]"
            >
              <X className="w-4 h-4" /> Limpiar filtros
            </button>
          )}
        </div>
      )}
    </div>
  )
}

interface FilterSelectProps {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder: string
  fullWidth?: boolean
}

function FilterSelect({ value, onChange, options, placeholder, fullWidth }: FilterSelectProps) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      aria-label={placeholder}
      className={`min-h-[44px] px-[var(--ds-space-150)] border-2 border-[var(--ds-border)] rounded-[var(--ds-radius-100)] text-[var(--ds-font-size-100)] bg-white ${fullWidth ? 'w-full' : ''}`}
    >
      <option value="">{placeholder}</option>
      {options.map(o => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
