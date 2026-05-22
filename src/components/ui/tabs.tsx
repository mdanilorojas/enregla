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
    <div className="-mx-[var(--ds-space-200)] px-[var(--ds-space-200)] sm:mx-0 sm:px-0 overflow-x-auto">
      <div
        role="tablist"
        className={cn(
          "flex gap-[var(--ds-space-050)] border-b-2 border-[var(--ds-border)] whitespace-nowrap",
          className
        )}
        {...props}
      >
        {children}
      </div>
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End') {
      props.onKeyDown?.(e)
      return
    }
    const tablist = e.currentTarget.closest('[role="tablist"]')
    if (!tablist) return
    const tabs = Array.from(tablist.querySelectorAll<HTMLButtonElement>('[role="tab"]'))
    const idx = tabs.indexOf(e.currentTarget)
    if (idx === -1) return
    e.preventDefault()
    let next = idx
    if (e.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length
    else if (e.key === 'ArrowRight') next = (idx + 1) % tabs.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = tabs.length - 1
    tabs[next]?.focus()
    tabs[next]?.click()
  }

  return (
    <button
      role="tab"
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      className={cn(
        "flex-shrink-0 min-h-[44px] px-[var(--ds-space-150)] py-[var(--ds-space-100)] text-[var(--ds-font-size-100)] font-medium",
        "border-b-2 -mb-0.5 transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-background-brand)] focus-visible:ring-offset-2",
        isActive
          ? "text-[var(--ds-text-brand)] border-[var(--ds-background-brand)]"
          : "text-[var(--ds-text-subtle)] border-transparent hover:text-[var(--ds-text)]",
        className
      )}
      onClick={() => ctx.setActive(value)}
      onKeyDown={handleKeyDown}
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
