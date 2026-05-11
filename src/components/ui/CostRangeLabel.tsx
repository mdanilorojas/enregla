import { cn } from '@/lib/utils';

interface CostRangeLabelProps {
  min: number | null | undefined;
  max: number | null | undefined;
  currency?: string;
  className?: string;
  emptyLabel?: string;
}

export function CostRangeLabel({ min, max, currency = 'USD', className, emptyLabel = 'sin estimar' }: CostRangeLabelProps) {
  const symbol = currency === 'USD' ? '$' : currency + ' ';
  if (min == null && max == null) {
    return <span className={cn('text-[var(--ds-text-subtlest)] italic', className)}>{emptyLabel}</span>;
  }
  if (min === 0 && max === 0) {
    return <span className={cn('text-[var(--ds-text)] font-medium', className)}>Gratuito</span>;
  }
  if (min === max) {
    return <span className={cn('text-[var(--ds-text)] font-medium tabular-nums', className)}>{symbol}{min}</span>;
  }
  return <span className={cn('text-[var(--ds-text)] font-medium tabular-nums', className)}>{symbol}{min} – {symbol}{max}</span>;
}
