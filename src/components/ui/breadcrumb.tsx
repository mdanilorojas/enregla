import * as React from "react"
import { ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items, className, ...props }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-[var(--ds-space-100)] text-[var(--ds-font-size-100)]", className)}
      {...props}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <React.Fragment key={i}>
            {item.href && !isLast ? (
              <Link
                to={item.href}
                className="text-[var(--ds-text-subtle)] hover:text-[var(--ds-text)] hover:underline"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "text-[var(--ds-text)] font-medium" : "text-[var(--ds-text-subtle)]"}>
                {item.label}
              </span>
            )}
            {!isLast && <ChevronRight className="w-3.5 h-3.5 text-[var(--ds-text-subtlest)]" />}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
