import { Search } from '@/lib/lucide-icons'

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
  const update = (partial: Partial<FilterState>) => onFiltersChange({ ...filters, ...partial })

  return (
    <div className="flex flex-wrap gap-[var(--ds-space-150)] items-center">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="w-4 h-4 absolute left-[var(--ds-space-100)] top-1/2 -translate-y-1/2 text-[var(--ds-text-subtlest)]" />
        <input
          type="text"
          placeholder="Buscar..."
          value={filters.search}
          onChange={e => update({ search: e.target.value })}
          className="w-full pl-8 pr-[var(--ds-space-150)] py-[var(--ds-space-100)] border-2 border-[var(--ds-border)] rounded-[var(--ds-radius-100)] text-[var(--ds-font-size-100)] focus:border-[var(--ds-background-brand)] focus:outline-none"
        />
      </div>

      <select
        value={filters.status}
        onChange={e => update({ status: e.target.value })}
        className="px-[var(--ds-space-150)] py-[var(--ds-space-100)] border-2 border-[var(--ds-border)] rounded-[var(--ds-radius-100)] text-[var(--ds-font-size-100)] bg-white"
      >
        <option value="">Todos los estados</option>
        {availableStatuses.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      <select
        value={filters.type}
        onChange={e => update({ type: e.target.value })}
        className="px-[var(--ds-space-150)] py-[var(--ds-space-100)] border-2 border-[var(--ds-border)] rounded-[var(--ds-radius-100)] text-[var(--ds-font-size-100)] bg-white"
      >
        <option value="">Todos los tipos</option>
        {availableTypes.map(t => <option key={t} value={t}>{t}</option>)}
      </select>

      <select
        value={filters.location}
        onChange={e => update({ location: e.target.value })}
        className="px-[var(--ds-space-150)] py-[var(--ds-space-100)] border-2 border-[var(--ds-border)] rounded-[var(--ds-radius-100)] text-[var(--ds-font-size-100)] bg-white"
      >
        <option value="">Todas las sedes</option>
        {availableLocations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
      </select>
    </div>
  )
}
