import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function CompanyTab() {
  return (
    <Card className="p-[var(--ds-space-400)]">
      <h2 className="text-[var(--ds-font-size-300)] font-semibold mb-[var(--ds-space-300)]">Empresa</h2>
      <div className="space-y-[var(--ds-space-300)]">
        <div>
          <label className="block text-[var(--ds-font-size-075)] font-semibold mb-[var(--ds-space-050)]">Razón Social</label>
          <Input placeholder="Empresa S.A." />
        </div>
        <div>
          <label className="block text-[var(--ds-font-size-075)] font-semibold mb-[var(--ds-space-050)]">RUC</label>
          <Input placeholder="1234567890001" />
        </div>
        <Button variant="default">Guardar cambios</Button>
      </div>
    </Card>
  )
}
