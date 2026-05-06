import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "@/lib/lucide-icons"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 ease-[var(--ds-ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-background-brand)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-[var(--state-disabled-opacity)] [&_svg]:pointer-events-none [&_svg]:shrink-0 active:scale-[var(--state-active-scale)] rounded-[var(--ds-radius-100)]",
  {
    variants: {
      variant: {
        default: "bg-[var(--ds-background-brand)] text-white hover:bg-[var(--ds-background-brand-hovered)] active:bg-[var(--ds-background-brand-pressed)]",
        destructive: "bg-[var(--ds-background-danger)] text-white hover:opacity-90",
        outline: "bg-white text-[var(--ds-text)] shadow-[0_0_0_1px_var(--ds-border)] hover:bg-[var(--ds-neutral-100)]",
        secondary: "bg-[var(--ds-neutral-100)] text-[var(--ds-text)] hover:bg-[var(--ds-neutral-200)]",
        subtle: "bg-transparent text-[var(--ds-text-subtle)] hover:bg-[var(--ds-neutral-100)] hover:text-[var(--ds-text)]",
        ghost: "bg-transparent text-[var(--ds-text-subtle)] hover:bg-[var(--ds-neutral-100)] hover:text-[var(--ds-text)]",
        link: "bg-transparent text-[var(--ds-text-brand)] p-0 h-auto underline underline-offset-[3px] hover:text-[var(--ds-background-brand-hovered)]",
        warning: "bg-[var(--ds-background-accent)] text-white hover:bg-[var(--ds-background-accent-hovered)]",
      },
      size: {
        sm: "h-7 px-[var(--ds-space-100)] text-[var(--ds-font-size-075)] [&_svg]:size-3.5",
        default: "h-8 px-[var(--ds-space-150)] text-[var(--ds-font-size-100)] [&_svg]:size-4",
        lg: "h-10 px-[var(--ds-space-200)] text-[var(--ds-font-size-200)] [&_svg]:size-5",
        icon: "h-8 w-8 p-0 [&_svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="animate-spin" />}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
