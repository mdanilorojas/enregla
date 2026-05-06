import * as React from "react"
import { cn } from "@/lib/utils"

interface TabsContextValue {
  active: string
  setActive: (v: string) => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue: string
  value?: string
  onValueChange?: (value: string) => void
}

export function Tabs({ defaultValue, value, onValueChange, className, children, ...props }: TabsProps) {
  const [internal, setInternal] = React.useState(defaultValue)
  const active = value ?? internal
  const setActive = (v: string) => {
    setInternal(v)
    onValueChange?.(v)
  }

  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div className={cn("w-full", className)} {...props}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex gap-[var(--ds-space-050)] border-b-2 border-[var(--ds-border)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

export function TabsTrigger({ value, className, children, ...props }: TabsTriggerProps) {
  const ctx = React.useContext(TabsContext)
  if (!ctx) throw new Error('TabsTrigger must be used inside Tabs')
  const isActive = ctx.active === value

  return (
    <button
      role="tab"
      aria-selected={isActive}
      className={cn(
        "px-[var(--ds-space-150)] py-[var(--ds-space-100)] text-[var(--ds-font-size-100)] font-medium",
        "border-b-2 -mb-0.5 transition-colors duration-200",
        isActive
          ? "text-[var(--ds-text-brand)] border-[var(--ds-background-brand)]"
          : "text-[var(--ds-text-subtle)] border-transparent hover:text-[var(--ds-text)]",
        className
      )}
      onClick={() => ctx.setActive(value)}
      {...props}
    >
      {children}
    </button>
  )
}

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

export function TabsContent({ value, className, children, ...props }: TabsContentProps) {
  const ctx = React.useContext(TabsContext)
  if (!ctx) throw new Error('TabsContent must be used inside Tabs')
  if (ctx.active !== value) return null

  return (
    <div
      role="tabpanel"
      className={cn("pt-[var(--ds-space-300)]", className)}
      {...props}
    >
      {children}
    </div>
  )
}
