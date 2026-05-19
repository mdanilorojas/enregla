import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Banner } from '@/components/ui/banner'
import { resetPassword } from '@/lib/auth'

export function ForgotPasswordView() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError(null)
    try {
      await resetPassword(email.trim())
      setSent(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo enviar el email'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-[var(--ds-space-400)] bg-[var(--ds-neutral-50)]">
      <div className="w-full max-w-md space-y-[var(--ds-space-300)]">
        <div className="space-y-[var(--ds-space-100)]">
          <h1 className="text-[var(--ds-font-size-500)] font-bold text-[var(--ds-text)]">Recuperar contraseña</h1>
          <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)]">
            Te enviamos un enlace para restablecer tu contraseña al correo que nos indiques.
          </p>
        </div>

        {sent ? (
          <Banner variant="info" title="Revisa tu correo">
            Si existe una cuenta con <strong>{email}</strong>, recibirás un enlace de recuperación en los próximos minutos.
          </Banner>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-[var(--ds-space-200)]">
            {error && <Banner variant="error">{error}</Banner>}
            <div className="space-y-[var(--ds-space-075)]">
              <label htmlFor="email" className="block text-[var(--ds-font-size-100)] font-medium">Correo electrónico</label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@empresa.com"
                autoComplete="email"
                required
              />
            </div>
            <Button type="submit" variant="default" size="lg" className="w-full" disabled={loading} loading={loading}>
              Enviar enlace de recuperación
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
