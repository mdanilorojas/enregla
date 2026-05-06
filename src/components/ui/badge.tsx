import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-[var(--ds-space-050)] rounded-[var(--ds-radius-100)] font-bold uppercase tracking-wide transition-all duration-150",
  {
    variants: {
      variant: {
        default: "bg-[var(--ds-neutral-200)] text-[var(--ds-neutral-700)]",
        success: "bg-[var(--ds-green-50)] text-[var(--ds-green-600)]",
        warning: "bg-[var(--ds-orange-50)] text-[var(--ds-orange-700)]",
        danger: "bg-[var(--ds-red-50)] text-[var(--ds-red-600)]",
        info: "bg-[var(--ds-blue-50)] text-[var(--ds-blue-600)]",
        secondary: "bg-[var(--ds-neutral-100)] text-[var(--ds-neutral-600)]",

        "risk-critico": "bg-[var(--ds-red-50)] text-[var(--ds-red-600)]",
        "risk-alto": "bg-[var(--ds-orange-50)] text-[var(--ds-orange-700)]",
        "risk-medio": "bg-[var(--ds-yellow-50)] text-[var(--ds-yellow-600)]",
        "risk-bajo": "bg-[var(--ds-green-50)] text-[var(--ds-green-600)]",

        "status-vigente": "bg-[var(--ds-green-50)] text-[var(--ds-green-600)]",
        "status-por-vencer": "bg-[var(--ds-orange-50)] text-[var(--ds-orange-700)]",
        "status-vencido": "bg-[var(--ds-red-50)] text-[var(--ds-red-600)]",
        "status-en-tramite": "bg-[var(--ds-blue-50)] text-[var(--ds-blue-600)]",
        "status-no-registrado": "bg-[var(--ds-neutral-100)] text-[var(--ds-neutral-600)]",
      },
      size: {
        sm: "text-[10px] px-[var(--ds-space-075)] py-[2px]",
        default: "text-[var(--ds-font-size-050)] px-[var(--ds-space-075)] py-[2px]",
        lg: "text-[var(--ds-font-size-075)] px-[var(--ds-space-100)] py-[var(--ds-space-050)]",
      }
    },
    defaultVariants: {
      variant: "default",
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
