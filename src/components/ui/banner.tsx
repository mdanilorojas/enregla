import * as React from "react"
import { Info, CheckCircle2, AlertTriangle, XCircle } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const bannerVariants = cva(
  "flex gap-[var(--ds-space-150)] p-[var(--ds-space-200)] rounded-[var(--ds-radius-100)]",
  {
    variants: {
      variant: {
        info: "bg-[var(--ds-blue-50)] text-[var(--ds-blue-700)]",
        success: "bg-[var(--ds-green-50)] text-[var(--ds-green-700)]",
        warning: "bg-[var(--ds-orange-50)] text-[var(--ds-orange-700)]",
        error: "bg-[var(--ds-red-50)] text-[var(--ds-red-700)]",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
)

const icons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
}

export interface BannerProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof bannerVariants> {
  title?: string
}

export function Banner({ variant = 'info', title, children, className, ...props }: BannerProps) {
  const Icon = icons[variant || 'info']
  return (
    <div className={cn(bannerVariants({ variant }), className)} role="alert" {...props}>
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="flex-1">
        {title && <div className="font-semibold mb-0.5">{title}</div>}
        <div className="text-[var(--ds-font-size-100)]">{children}</div>
      </div>
    </div>
  )
}
