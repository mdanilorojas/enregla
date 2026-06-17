import { useState } from 'react'
import toast from 'react-hot-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Banner } from '@/components/ui/banner'
import { deleteLocation } from '@/lib/api/locations'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  locationId: string
  locationName: string
  /** Nº de permisos activos en la sede (para el aviso de impacto). */
  permitCount: number
  onDeleted: () => void
}

export function DeleteLocationDialog({
  open,
  onOpenChange,
  locationId,
  locationName,
  permitCount,
  onDeleted,
}: Props) {
  const [confirmName, setConfirmName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setConfirmName('')
    setError(null)
    setSubmitting(false)
  }

  const handleClose = (next: boolean) => {
    if (submitting) return
    if (!next) reset()
    onOpenChange(next)
  }

  const canSubmit =
    confirmName.trim().toLowerCase() === locationName.trim().toLowerCase() && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      await deleteLocation(locationId)
      toast.success('Sede eliminada')
      reset()
      onOpenChange(false)
      onDeleted()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar la sede')
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[var(--ds-red-600)]">Eliminar sede</DialogTitle>
          <DialogDescription>
            Esta acción es <strong>permanente e irreversible</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-[var(--ds-space-300)] mt-[var(--ds-space-200)]">
          <Banner variant="error">
            <div className="space-y-[var(--ds-space-100)]">
              <div className="font-semibold">Se eliminará la sede y todo lo asociado:</div>
              <ul className="list-disc pl-[var(--ds-space-300)] text-[var(--ds-font-size-075)]">
                <li>
                  {permitCount} {permitCount === 1 ? 'permiso' : 'permisos'} y sus documentos.
                </li>
                <li>Enlaces públicos (QR) de la sede.</li>
                <li>Historial y notificaciones asociadas.</li>
              </ul>
            </div>
          </Banner>

          <div>
            <label className="block text-[var(--ds-font-size-075)] font-semibold mb-[var(--ds-space-050)]">
              Para confirmar, escribe el nombre exacto de la sede:
            </label>
            <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] mb-[var(--ds-space-100)]">
              <code className="bg-[var(--ds-neutral-100)] px-[var(--ds-space-100)] py-[var(--ds-space-025)] rounded">
                {locationName}
              </code>
            </p>
            <Input
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={locationName}
              disabled={submitting}
              autoComplete="off"
            />
          </div>

          {error && <Banner variant="error">{error}</Banner>}
        </div>

        <DialogFooter className="mt-[var(--ds-space-300)]">
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!canSubmit}
            loading={submitting}
            className="w-full sm:w-auto"
          >
            Eliminar sede
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
