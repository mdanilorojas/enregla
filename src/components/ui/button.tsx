import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]",
        destructive: "bg-[var(--color-danger)] text-white hover:bg-[#B91C1C]",
        outline: "border border-[var(--color-border)] bg-transparent text-[var(--color-text)] hover:bg-[var(--color-surface)]",
        secondary: "bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-border)]",
        ghost: "bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]",
        link: "bg-transparent text-[var(--color-primary)] p-0 h-auto text-[13px] underline underline-offset-[3px]",
      },
      size: {
        sm: "h-8 px-3 text-xs [&_svg]:size-3.5",
        default: "h-9 px-3.5 text-[13px] [&_svg]:size-3.5",
        lg: "h-10 px-[18px] text-sm [&_svg]:size-4",
        icon: "h-9 w-9 p-0 [&_svg]:size-3.5",
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
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
