import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action, className, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center text-center py-[var(--ds-space-600)] px-[var(--ds-space-400)]",
        className
      )}
      {...props}
    >
      <div className="w-16 h-16 rounded-[var(--ds-radius-300)] bg-[var(--ds-neutral-100)] flex items-center justify-center mb-[var(--ds-space-300)]">
        <Icon className="w-8 h-8 text-[var(--ds-text-subtlest)]" />
      </div>
      <h3 className="text-[var(--ds-font-size-300)] font-semibold text-[var(--ds-text)] mb-[var(--ds-space-100)]">
        {title}
      </h3>
      {description && (
        <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] max-w-md mb-[var(--ds-space-300)]">
          {description}
        </p>
      )}
      {action}
    </div>
  )
}
