import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Banner } from '@/components/ui/banner'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

export function AcceptInvitationView() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const { isAuthenticated, loading } = useAuth()
  const [status, setStatus] = useState<'idle' | 'accepting' | 'ok' | 'err'>('idle')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (loading || !token || status !== 'idle' || !isAuthenticated) return
    let alive = true

    async function run() {
      // casting due to stale generated types — see audit follow-up
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: rpcErr } = await (supabase as any).rpc('accept_company_invitation', { p_token: token })
      if (!alive) return
      if (rpcErr) {
        setError(rpcErr.message)
        setStatus('err')
        return
      }
      if (!data?.ok) {
        const map: Record<string, string> = {
          invalid_token: 'El enlace de invitación no es válido',
          already_accepted: 'Esta invitación ya fue aceptada',
          revoked: 'Esta invitación fue revocada',
          expired: 'Esta invitación expiró',
          already_in_other_company: 'Ya perteneces a otra empresa',
          not_authenticated: 'Debes iniciar sesión',
        }
        setError(map[data?.error] || data?.error || 'Error desconocido')
        setStatus('err')
        return
      }
      toast.success('Bienvenido al equipo')
      setStatus('ok')
      setTimeout(() => navigate('/'), 1500)
    }

    // defer setState to evitar set-state-in-effect
    const id = setTimeout(() => {
      if (!alive) return
      setStatus('accepting')
      void run()
    }, 0)

    return () => { alive = false; clearTimeout(id) }
  }, [token, isAuthenticated, loading, status, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center p-[var(--ds-space-400)] bg-[var(--ds-neutral-50)]">
      <div className="w-full max-w-md space-y-[var(--ds-space-300)] text-center">
        <h1 className="text-[var(--ds-font-size-500)] font-bold">Aceptar invitación</h1>

        {!token && <Banner variant="error">Enlace inválido (sin token).</Banner>}

        {!isAuthenticated && !loading && token && (
          <>
            <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)]">
              Inicia sesión para aceptar la invitación.
            </p>
            <Button asChild variant="default">
              <Link to={`/login?next=${encodeURIComponent('/aceptar-invitacion?token=' + token)}`}>
                Iniciar sesión
              </Link>
            </Button>
          </>
        )}

        {isAuthenticated && status === 'accepting' && (
          <p className="text-[var(--ds-text-subtle)]">Aceptando invitación...</p>
        )}

        {status === 'ok' && (
          <Banner variant="info">¡Listo! Te redirigimos al dashboard.</Banner>
        )}

        {status === 'err' && (
          <>
            <Banner variant="error">{error}</Banner>
            <Button asChild variant="default">
              <Link to="/">Ir al inicio</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
