import { ChevronDown } from '@/lib/lucide-icons'

export interface YearSelectorProps {
  year: number
  onYearChange: (year: number) => void
  availableYears: number[]
}

export function YearSelector({ year, onYearChange, availableYears }: YearSelectorProps) {
  return (
    <div className="relative inline-block">
      <select
        value={year}
        onChange={e => onYearChange(Number(e.target.value))}
        className="appearance-none pl-[var(--ds-space-200)] pr-[var(--ds-space-500)] py-[var(--ds-space-100)] border-2 border-[var(--ds-border)] rounded-[var(--ds-radius-100)] bg-white text-[var(--ds-font-size-100)] font-medium cursor-pointer hover:border-[var(--ds-border-bold)]"
      >
        {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
      <ChevronDown className="w-4 h-4 absolute right-[var(--ds-space-100)] top-1/2 -translate-y-1/2 pointer-events-none text-[var(--ds-text-subtle)]" />
    </div>
  )
}
