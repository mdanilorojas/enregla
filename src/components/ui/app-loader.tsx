import { Loader2, Shield } from '@/lib/lucide-icons'

export interface AppLoaderProps {
  message?: string
}

export function AppLoader({ message = 'Cargando...' }: AppLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--ds-blue-50)] to-[var(--ds-neutral-50)]"
    >
      <div className="flex flex-col items-center gap-[var(--ds-space-200)]">
        <div className="w-16 h-16 rounded-[var(--ds-radius-300)] bg-[var(--ds-background-brand)] flex items-center justify-center">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-[var(--ds-background-brand)]" />
        <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)]">{message}</p>
      </div>
    </div>
  )
}
