import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  side?: 'bottom' | 'top' | 'left' | 'right'
  children: ReactNode
  className?: string
  ariaLabel?: string
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Sheet({ open, onOpenChange, side = 'bottom', children, className, ariaLabel }: SheetProps) {
  const contentRef = useRef<HTMLDivElement | null>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return

    previouslyFocused.current = document.activeElement as HTMLElement | null
    const node = contentRef.current
    if (node) {
      const first = node.querySelector<HTMLElement>(FOCUSABLE)
      ;(first ?? node).focus()
    }

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false)
        return
      }
      if (e.key !== 'Tab' || !contentRef.current) return
      const focusables = contentRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      if (focusables.length === 0) {
        e.preventDefault()
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement
      if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handleKeydown)
    return () => {
      window.removeEventListener('keydown', handleKeydown)
      previouslyFocused.current?.focus?.()
    }
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
        ref={contentRef}
        tabIndex={-1}
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
