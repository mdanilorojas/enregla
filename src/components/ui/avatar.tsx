import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const avatarVariants = cva(
  "inline-flex items-center justify-center rounded-full font-semibold uppercase shrink-0",
  {
    variants: {
      size: {
        sm: "w-6 h-6 text-[10px]",
        default: "w-8 h-8 text-[var(--ds-font-size-075)]",
        lg: "w-12 h-12 text-[var(--ds-font-size-200)]",
        xl: "w-16 h-16 text-[var(--ds-font-size-300)]",
      },
      color: {
        default: "bg-[var(--ds-neutral-200)] text-[var(--ds-neutral-700)]",
        blue: "bg-[var(--ds-blue-100)] text-[var(--ds-blue-700)]",
        orange: "bg-[var(--ds-orange-100)] text-[var(--ds-orange-700)]",
        green: "bg-[var(--ds-green-100)] text-[var(--ds-green-700)]",
        red: "bg-[var(--ds-red-100)] text-[var(--ds-red-600)]",
      },
    },
    defaultVariants: {
      size: "default",
      color: "default",
    },
  }
)

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof avatarVariants> {
  name?: string
  src?: string
}

export function Avatar({ name, src, size, color, className, ...props }: AvatarProps) {
  const initials = React.useMemo(() => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }, [name])

  const autoColor = React.useMemo<'default' | 'blue' | 'orange' | 'green' | 'red'>(() => {
    if (color) return color as 'default' | 'blue' | 'orange' | 'green' | 'red'
    if (!name) return 'default'
    const colors: Array<'blue' | 'orange' | 'green' | 'red'> = ['blue', 'orange', 'green', 'red']
    const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }, [name, color])

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={cn(avatarVariants({ size, color: autoColor }), 'object-cover', className)}
      />
    )
  }

  return (
    <div className={cn(avatarVariants({ size, color: autoColor }), className)} {...props}>
      {initials}
    </div>
  )
}
