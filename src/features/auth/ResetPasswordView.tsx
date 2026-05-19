import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Banner } from '@/components/ui/banner'
import { supabase } from '@/lib/supabase'
import { updatePassword } from '@/lib/auth'

export function ResetPasswordView() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  // Supabase coloca al usuario en una sesión de recuperación cuando aterriza aquí
  // desde el link del email. Si no hay sesión, el flujo no puede continuar.
  useEffect(() => {
    let alive = true
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return
      if (!data.session) {
        setError('El enlace de recuperación es inválido o expiró. Solicita uno nuevo.')
      } else {
        setReady(true)
      }
    })
    return () => { alive = false }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await updatePassword(password)
      toast.success('Contraseña actualizada')
      navigate('/')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo actualizar la contraseña'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-[var(--ds-space-400)] bg-[var(--ds-neutral-50)]">
      <div className="w-full max-w-md space-y-[var(--ds-space-300)]">
        <div className="space-y-[var(--ds-space-100)]">
          <h1 className="text-[var(--ds-font-size-500)] font-bold">Nueva contraseña</h1>
          <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)]">
            Crea una contraseña nueva. Mínimo 8 caracteres.
          </p>
        </div>

        {error && <Banner variant="error">{error}</Banner>}

        {ready && (
          <form onSubmit={handleSubmit} className="space-y-[var(--ds-space-200)]">
            <div className="space-y-[var(--ds-space-075)]">
              <label htmlFor="pwd" className="block text-[var(--ds-font-size-100)] font-medium">Nueva contraseña</label>
              <Input id="pwd" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
            </div>
            <div className="space-y-[var(--ds-space-075)]">
              <label htmlFor="confirm" className="block text-[var(--ds-font-size-100)] font-medium">Confirmar contraseña</label>
              <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
            </div>
            <Button type="submit" variant="default" size="lg" className="w-full" disabled={loading} loading={loading}>
              Actualizar contraseña
            </Button>
          </form>
        )}

        <p className="text-center text-[var(--ds-font-size-075)]">
          <Link to="/login" className="text-[var(--ds-text-brand)] hover:underline">Volver al inicio de sesión</Link>
        </p>
      </div>
    </div>
  )
}
