import { useState } from 'react'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Banner } from '@/components/ui/banner'
import { LogOut, Shield } from '@/lib/lucide-icons'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

function describeAuthMethod(providers: string[] | undefined): string {
  if (!providers || providers.length === 0) {
    return 'Tu cuenta está protegida con autenticación de EnRegla'
  }
  const labels: Record<string, string> = {
    google: 'Google',
    email: 'email y contraseña',
  }
  const pretty = providers.map((p) => labels[p] ?? p).join(' y ')
  return `Tu cuenta está protegida con ${pretty}`
}

export function SecurityTab() {
  const { user } = useAuth()
  // casting due to stale generated types — see audit follow-up
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const providers: string[] | undefined = (user as any)?.app_metadata?.providers
  const [busy, setBusy] = useState(false)

  const handleGlobalSignOut = async () => {
    if (!confirm('¿Cerrar sesión en todos tus dispositivos? Tendrás que volver a iniciar sesión.')) {
      return
    }
    setBusy(true)
    const { error } = await supabase.auth.signOut({ scope: 'global' })
    setBusy(false)
    if (error) {
      console.error('[SecurityTab] signOut global error:', error)
      toast.error('No se pudo cerrar todas las sesiones')
      return
    }
    toast.success('Sesiones cerradas')
  }

  return (
    <Card className="p-[var(--ds-space-400)]">
      <h2 className="text-[var(--ds-font-size-300)] font-semibold mb-[var(--ds-space-300)]">Seguridad</h2>
      <div className="space-y-[var(--ds-space-300)]">
        <Banner variant="info">
          <div className="flex items-center gap-[var(--ds-space-100)]">
            <Shield className="w-5 h-5" />
            <span>{describeAuthMethod(providers)}</span>
          </div>
        </Banner>

        <div>
          <h3 className="font-semibold text-[var(--ds-font-size-200)] mb-[var(--ds-space-100)]">Sesiones activas</h3>
          <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mb-[var(--ds-space-200)]">
            Al cerrar todas las sesiones, se revocan todos los dispositivos donde iniciaste sesión con esta cuenta.
          </p>
          <Button variant="destructive" onClick={handleGlobalSignOut} disabled={busy}>
            <LogOut className="w-4 h-4" />
            {busy ? 'Cerrando...' : 'Cerrar todas las sesiones'}
          </Button>
        </div>
      </div>
    </Card>
  )
}
