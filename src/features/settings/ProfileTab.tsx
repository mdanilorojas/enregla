import { Card } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'

export function ProfileTab() {
  const { profile } = useAuth()
  const typedProfile = profile as { full_name?: string; email?: string } | null

  return (
    <Card className="p-[var(--ds-space-400)]">
      <h2 className="text-[var(--ds-font-size-300)] font-semibold mb-[var(--ds-space-300)]">Perfil</h2>
      <div className="space-y-[var(--ds-space-300)]">
        <div className="flex items-center gap-[var(--ds-space-200)]">
          <Avatar name={typedProfile?.full_name || 'User'} size="xl" />
          <Button variant="outline" size="sm">Cambiar foto</Button>
        </div>

        <div>
          <label className="block text-[var(--ds-font-size-075)] font-semibold mb-[var(--ds-space-050)]">Nombre completo</label>
          <Input defaultValue={typedProfile?.full_name ?? ''} />
        </div>

        <div>
          <label className="block text-[var(--ds-font-size-075)] font-semibold mb-[var(--ds-space-050)]">Email</label>
          <Input defaultValue={typedProfile?.email ?? ''} disabled />
        </div>

        <Button variant="default">Guardar cambios</Button>
      </div>
    </Card>
  )
}
