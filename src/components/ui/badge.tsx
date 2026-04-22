import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-semibold transition-colors border",
  {
    variants: {
      variant: {
        default: "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]",
        secondary: "border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info)]",
        destructive: "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger)]",
        success: "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success)]",
        warning: "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning)]",
        danger: "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger)]",
        info: "border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info)]",
        outline: "border-[var(--color-border)] bg-transparent text-[var(--color-text-secondary)]",

        // Risk-specific variants with new design system colors
        "risk-critico": "bg-[var(--color-risk-critico-bg)] text-[var(--color-risk-critico-text)] border-[var(--color-risk-critico-border)]",
        "risk-alto": "bg-[var(--color-risk-alto-bg)] text-[var(--color-risk-alto-text)] border-[var(--color-risk-alto-border)]",
        "risk-medio": "bg-[var(--color-risk-medio-bg)] text-[var(--color-risk-medio-text)] border-[var(--color-risk-medio-border)]",
        "risk-bajo": "bg-[var(--color-risk-bajo-bg)] text-[var(--color-risk-bajo-text)] border-[var(--color-risk-bajo-border)]",

        // Status-specific variants with new design system colors
        "status-vigente": "bg-[var(--color-status-vigente-bg)] text-[var(--color-status-vigente-text)] border-[var(--color-status-vigente-border)]",
        "status-por-vencer": "bg-[var(--color-status-por-vencer-bg)] text-[var(--color-status-por-vencer-text)] border-[var(--color-status-por-vencer-border)]",
        "status-vencido": "bg-[var(--color-status-vencido-bg)] text-[var(--color-status-vencido-text)] border-[var(--color-status-vencido-border)]",
        "status-no-registrado": "bg-[var(--color-status-no-registrado-bg)] text-[var(--color-status-no-registrado-text)] border-[var(--color-status-no-registrado-border)]",
        "status-en-tramite": "bg-[var(--color-status-en-tramite-bg)] text-[var(--color-status-en-tramite-text)] border-[var(--color-status-en-tramite-border)]",
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
