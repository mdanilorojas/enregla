import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-[var(--ds-radius-200)] border border-[var(--ds-border)] bg-[var(--ds-neutral-0)] px-[var(--ds-space-150)] py-[var(--ds-space-100)] text-[var(--ds-font-size-100)] text-[var(--ds-text)] font-normal transition-colors file:border-0 file:bg-transparent file:text-[var(--ds-font-size-100)] file:font-medium file:text-[var(--ds-text)] placeholder:text-[var(--ds-text-subtlest)] hover:border-[var(--ds-border-bold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-background-brand)] focus-visible:ring-offset-2 focus-visible:border-[var(--ds-background-brand)] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
