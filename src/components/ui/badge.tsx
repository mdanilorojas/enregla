import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-semibold transition-all duration-150 ease-[var(--ease-out)] border",
  {
    variants: {
      variant: {
        // Location status
        success: "bg-[var(--color-success-bg)] text-[var(--color-success)] border-[var(--color-success-border)]",
        info: "bg-[var(--color-info-bg)] text-[var(--color-info)] border-[var(--color-info-border)]",
        secondary: "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)]",

        // Risk levels
        "risk-critico": "bg-[var(--color-risk-critico-bg)] text-[var(--color-risk-critico-text)] border-[var(--color-risk-critico-border)] font-bold shadow-[var(--shadow-xs)]",
        "risk-alto": "bg-[var(--color-risk-alto-bg)] text-[var(--color-risk-alto-text)] border-[var(--color-risk-alto-border)]",
        "risk-medio": "bg-[var(--color-risk-medio-bg)] text-[var(--color-risk-medio-text)] border-[var(--color-risk-medio-border)]",
        "risk-bajo": "bg-[var(--color-risk-bajo-bg)] text-[var(--color-risk-bajo-text)] border-[var(--color-risk-bajo-border)]",

        // Permit status
        "status-vigente": "bg-[var(--color-status-vigente-bg)] text-[var(--color-status-vigente-text)] border-[var(--color-status-vigente-border)]",
        "status-por-vencer": "bg-[var(--color-status-por-vencer-bg)] text-[var(--color-status-por-vencer-text)] border-[var(--color-status-por-vencer-border)]",
        "status-vencido": "bg-[var(--color-status-vencido-bg)] text-[var(--color-status-vencido-text)] border-[var(--color-status-vencido-border)] font-bold",
        "status-en-tramite": "bg-[var(--color-status-en-tramite-bg)] text-[var(--color-status-en-tramite-text)] border-[var(--color-status-en-tramite-border)]",
        "status-no-registrado": "bg-[var(--color-status-no-registrado-bg)] text-[var(--color-status-no-registrado-text)] border-[var(--color-status-no-registrado-border)]",
      },
      size: {
        sm: "text-[10px] px-2 py-0.5",
        default: "text-xs px-2.5 py-0.5",
        lg: "text-sm px-3 py-1",
      }
    },
    defaultVariants: {
      variant: "secondary",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
}

function Badge({ className, variant, size, dot = false, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: 'currentColor' }}
        />
      )}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
