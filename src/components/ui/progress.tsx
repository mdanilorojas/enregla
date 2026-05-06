import * as React from "react"
import { cn } from "@/lib/utils"

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'auto'
  showLabel?: boolean
}

export function Progress({ value, variant = 'auto', showLabel = false, className, ...props }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value))

  const effectiveVariant = variant === 'auto'
    ? clamped >= 90 ? 'success'
    : clamped >= 50 ? 'warning'
    : 'danger'
    : variant

  const fillColor = {
    default: 'var(--ds-background-brand)',
    success: 'var(--ds-background-success)',
    warning: 'var(--ds-background-accent)',
    danger: 'var(--ds-background-danger)',
  }[effectiveVariant]

  return (
    <div className={cn('w-full', className)} {...props}>
      {showLabel && (
        <div className="flex justify-between mb-[var(--ds-space-050)] text-[var(--ds-font-size-075)]">
          <span className="text-[var(--ds-text-subtle)]">{clamped.toFixed(0)}%</span>
        </div>
      )}
      <div
        className="w-full h-1.5 bg-[var(--ds-neutral-100)] rounded-[var(--ds-radius-100)] overflow-hidden"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-[var(--ds-radius-100)] transition-[width] duration-300 ease-[var(--ds-ease-out)]"
          style={{
            width: `${clamped}%`,
            backgroundColor: fillColor,
          }}
        />
      </div>
    </div>
  )
}
