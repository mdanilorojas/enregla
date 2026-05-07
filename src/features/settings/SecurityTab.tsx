import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Banner } from '@/components/ui/banner'
import { LogOut, Shield } from '@/lib/lucide-icons'

export function SecurityTab() {
  return (
    <Card className="p-[var(--ds-space-400)]">
      <h2 className="text-[var(--ds-font-size-300)] font-semibold mb-[var(--ds-space-300)]">Seguridad</h2>
      <div className="space-y-[var(--ds-space-300)]">
        <Banner variant="info">
          <div className="flex items-center gap-[var(--ds-space-100)]">
            <Shield className="w-5 h-5" />
            <span>Tu cuenta está protegida con autenticación de Google</span>
          </div>
        </Banner>

        <div>
          <h3 className="font-semibold text-[var(--ds-font-size-200)] mb-[var(--ds-space-100)]">Sesiones activas</h3>
          <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mb-[var(--ds-space-200)]">
            Actualmente estás conectado desde este dispositivo
          </p>
          <Button variant="destructive"><LogOut className="w-4 h-4" />Cerrar todas las sesiones</Button>
        </div>
      </div>
    </Card>
  )
}
