import { cn } from '@/lib/utils';
import {
  CATEGORY_META,
  CATEGORY_ORDER,
  type LegalCategory,
} from '@/data/legal-references';
import { getCategoryCount } from './selectors';

export type ChipValue = LegalCategory | 'all';

interface CategoryChipsProps {
  active: ChipValue;
  totalCount: number;
  onChange: (next: ChipValue) => void;
}

export function CategoryChips({ active, totalCount, onChange }: CategoryChipsProps) {
  const chips: Array<{
    value: ChipValue;
    label: string;
    count: number;
    disabled: boolean;
  }> = [
    { value: 'all', label: 'Todos', count: totalCount, disabled: false },
    ...CATEGORY_ORDER.map((cat) => {
      const count = getCategoryCount(cat);
      return {
        value: cat as ChipValue,
        label: CATEGORY_META[cat].label,
        count,
        disabled: count === 0,
      };
    }),
  ];

  return (
    <div
      className="flex gap-[var(--ds-space-100)] overflow-x-auto pb-[var(--ds-space-075)]"
      role="toolbar"
      aria-label="Filtrar por categoría"
    >
      {chips.map((chip) => {
        const isActive = chip.value === active;
        return (
          <button
            key={chip.value}
            type="button"
            disabled={chip.disabled}
            aria-pressed={isActive}
            aria-label={
              chip.disabled
                ? `${chip.label} — Próximamente`
                : `${chip.label}: ${chip.count} permiso${chip.count === 1 ? '' : 's'}`
            }
            onClick={() => !chip.disabled && onChange(chip.value)}
            className={cn(
              'shrink-0 rounded-full px-[var(--ds-space-200)] py-[var(--ds-space-075)]',
              'text-[var(--ds-font-size-075)] font-medium transition-colors',
              'border',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-background-brand)] focus-visible:ring-offset-2',
              isActive
                ? 'bg-[var(--ds-background-brand)] border-[var(--ds-background-brand)] text-white'
                : chip.disabled
                ? 'bg-[var(--ds-neutral-50)] border-[var(--ds-border)] text-[var(--ds-text-muted)] cursor-not-allowed opacity-60'
                : 'bg-white border-[var(--ds-border)] text-[var(--ds-text-subtle)] hover:border-[var(--ds-border-bold)] hover:text-[var(--ds-text)]'
            )}
          >
            {chip.label}
            {chip.disabled ? (
              <span className="ml-[var(--ds-space-075)] text-[var(--ds-font-size-050)] opacity-75">
                próximamente
              </span>
            ) : (
              <span
                className={cn(
                  'ml-[var(--ds-space-075)] text-[var(--ds-font-size-050)]',
                  isActive ? 'opacity-80' : 'opacity-60'
                )}
              >
                {chip.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
