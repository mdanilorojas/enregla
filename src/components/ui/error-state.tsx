import { Button } from '@/components/ui/button'
import { AlertTriangle } from '@/lib/lucide-icons'

interface ErrorStateProps {
  title?: string
  description?: string
  error?: unknown
  onRetry?: () => void
}

function describe(error: unknown): string | null {
  if (!error) return null
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const m = (error as { message?: unknown }).message
    return typeof m === 'string' ? m : null
  }
  return null
}

export function ErrorState({
  title = 'No pudimos cargar la información',
  description,
  error,
  onRetry,
}: ErrorStateProps) {
  const detail = describe(error) ?? description ?? 'Por favor intenta de nuevo en unos segundos.'

  return (
    <div
      className="flex flex-col items-center justify-center text-center gap-[var(--ds-space-200)] p-[var(--ds-space-300)] sm:p-[var(--ds-space-400)] rounded-[var(--ds-radius-200)] border border-[var(--ds-border)] bg-white"
      role="alert"
    >
      <AlertTriangle
        className="w-10 h-10 text-[var(--ds-red-700,#b91c1c)]"
        aria-hidden="true"
      />
      <div>
        <h3 className="text-[var(--ds-font-size-200)] font-semibold text-[var(--ds-text)]">
          {title}
        </h3>
        <p className="mt-[var(--ds-space-100)] text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] max-w-md">
          {detail}
        </p>
      </div>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  )
}
