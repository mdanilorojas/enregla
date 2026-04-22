import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]",
        secondary: "border border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info)]",
        destructive: "border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger)]",
        success: "border border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success)]",
        warning: "border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning)]",
        danger: "border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger)]",
        info: "border border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info)]",
        outline: "border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text-secondary)]",

        // Risk-specific variants using design tokens
        "risk-critico": "bg-[var(--color-risk-critico)]/10 text-[var(--color-danger)] border border-[var(--color-risk-critico)]/20",
        "risk-alto": "bg-[var(--color-risk-alto)]/10 text-[var(--color-warning)] border border-[var(--color-risk-alto)]/20",
        "risk-medio": "bg-[var(--color-risk-medio)]/10 text-[var(--color-warning)] border border-[var(--color-risk-medio)]/20",
        "risk-bajo": "bg-[var(--color-risk-bajo)]/10 text-[var(--color-success)] border border-[var(--color-risk-bajo)]/20",

        // Status-specific variants using design tokens
        "status-vigente": "bg-[var(--color-status-vigente)]/10 text-[var(--color-success)] border border-[var(--color-status-vigente)]/20",
        "status-por-vencer": "bg-[var(--color-status-por-vencer)]/10 text-[var(--color-warning)] border border-[var(--color-status-por-vencer)]/20",
        "status-vencido": "bg-[var(--color-status-vencido)]/10 text-[var(--color-danger)] border border-[var(--color-status-vencido)]/20",
        "status-no-registrado": "bg-[var(--color-status-no-registrado)]/10 text-[var(--color-text-muted)] border border-[var(--color-status-no-registrado)]/20",
        "status-en-tramite": "bg-[var(--color-status-en-tramite)]/10 text-[var(--color-info)] border border-[var(--color-status-en-tramite)]/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
