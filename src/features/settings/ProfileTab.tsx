import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Banner } from '@/components/ui/banner'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

export function ProfileTab() {
  const navigate = useNavigate()
  const { profile, user } = useAuth()
  const typedProfile = profile as { id?: string; full_name?: string; email?: string } | null

  const [fullName, setFullName] = useState(typedProfile?.full_name ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastLoadedName, setLastLoadedName] = useState(typedProfile?.full_name ?? '')

  // Sincroniza el input cuando el profile del auth store cambia (ej: login inicial)
  // sin caer en setState-in-effect: solo aplica cuando detecta un cambio real upstream.
  if ((typedProfile?.full_name ?? '') !== lastLoadedName) {
    setLastLoadedName(typedProfile?.full_name ?? '')
    setFullName(typedProfile?.full_name ?? '')
  }

  const email = typedProfile?.email ?? user?.email ?? ''
  const isDirty = fullName.trim() !== (typedProfile?.full_name ?? '').trim()

  const handleSave = async () => {
    if (!typedProfile?.id) return
    if (fullName.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres')
      return
    }
    setSaving(true)
    setError(null)
    // casting due to stale generated types — see audit follow-up
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query = supabase.from('profiles') as any
    const { error: updateError } = await query
      .update({ full_name: fullName.trim() })
      .eq('id', typedProfile.id)

    setSaving(false)
    if (updateError) {
      console.error('[ProfileTab] update error:', updateError)
      setError(updateError.message)
      return
    }
    toast.success('Perfil actualizado')
  }

  return (
    <Card className="p-[var(--ds-space-400)]">
      <h2 className="text-[var(--ds-font-size-300)] font-semibold mb-[var(--ds-space-300)]">Perfil</h2>

      {error && (
        <div className="mb-[var(--ds-space-300)]">
          <Banner variant="error">{error}</Banner>
        </div>
      )}

      <div className="space-y-[var(--ds-space-300)]">
        <div className="flex items-center gap-[var(--ds-space-200)]">
          <Avatar name={fullName || 'User'} size="xl" />
          <div className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">
            La foto se toma de tu cuenta de Google
          </div>
        </div>

        <div>
          <label className="block text-[var(--ds-font-size-075)] font-semibold mb-[var(--ds-space-050)]">Nombre completo</label>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={saving}
          />
        </div>

        <div>
          <label className="block text-[var(--ds-font-size-075)] font-semibold mb-[var(--ds-space-050)]">Email</label>
          <Input value={email} disabled />
          <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] mt-[var(--ds-space-050)]">
            El email está ligado a tu método de inicio de sesión y no se puede editar
          </p>
        </div>

        <Button variant="default" onClick={handleSave} disabled={!isDirty || saving}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>

        <div className="pt-[var(--ds-space-300)] border-t border-[var(--ds-border)]">
          <label className="block text-[var(--ds-font-size-075)] font-semibold mb-[var(--ds-space-050)]">Tutorial de bienvenida</label>
          <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] mb-[var(--ds-space-150)]">
            Repasá dónde se hace cada cosa en la plataforma. No modifica ningún dato.
          </p>
          <Button variant="outline" onClick={() => navigate('/?tour=1&force=1')}>
            Ver tutorial
          </Button>
        </div>
      </div>
    </Card>
  )
}
