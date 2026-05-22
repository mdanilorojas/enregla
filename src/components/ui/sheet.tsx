import { useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  side?: 'bottom' | 'top' | 'left' | 'right'
  children: ReactNode
  className?: string
  ariaLabel?: string
}

export function Sheet({ open, onOpenChange, side = 'bottom', children, className, ariaLabel }: SheetProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onOpenChange])

  if (!open) return null

  const sideClasses: Record<string, string> = {
    bottom: 'bottom-0 left-0 right-0 rounded-t-[var(--ds-radius-300)] max-h-[85dvh]',
    top: 'top-0 left-0 right-0 rounded-b-[var(--ds-radius-300)] max-h-[85dvh]',
    left: 'top-0 bottom-0 left-0 w-[85vw] max-w-sm',
    right: 'top-0 bottom-0 right-0 w-[85vw] max-w-sm',
  }

  const animClasses: Record<string, string> = {
    bottom: 'animate-[sheetSlideUp_220ms_ease-out]',
    top: 'animate-[sheetSlideDown_220ms_ease-out]',
    left: 'animate-[sheetSlideRight_220ms_ease-out]',
    right: 'animate-[sheetSlideLeft_220ms_ease-out]',
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={ariaLabel}>
      <div
        data-testid="sheet-overlay"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm motion-reduce:transition-none"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div
        className={cn(
          'absolute bg-[var(--ds-neutral-0)] shadow-[var(--ds-shadow-overlay)] flex flex-col overflow-hidden motion-reduce:animate-none',
          sideClasses[side],
          animClasses[side],
          className,
        )}
        style={{ paddingBottom: side === 'bottom' ? 'env(safe-area-inset-bottom, 0px)' : undefined }}
      >
        {children}
      </div>
    </div>
  )
}
