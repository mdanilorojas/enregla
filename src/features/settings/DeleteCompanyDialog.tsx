import { useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
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
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyId: string
  companyName: string
}

export function DeleteCompanyDialog({ open, onOpenChange, companyId, companyName }: Props) {
  const [confirmName, setConfirmName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

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

  const canSubmit = confirmName === companyName && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: rpcError } = await (supabase as any).rpc('delete_company', {
      p_company_id: companyId,
      p_confirmation_name: confirmName,
    })

    if (rpcError) {
      setError(rpcError.message ?? 'Error al eliminar la empresa')
      setSubmitting(false)
      return
    }

    const counts = data?.counts ?? {}
    const total =
      (counts.permits ?? 0) +
      (counts.locations ?? 0) +
      (counts.documents ?? 0) +
      (counts.audit_logs ?? 0)

    await queryClient.invalidateQueries()
    toast.success(`Empresa eliminada (${total} registros borrados).`)
    reset()
    onOpenChange(false)
    navigate('/setup', { replace: true })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-[var(--ds-color-danger-text,#b91c1c)]">
            Eliminar empresa permanentemente
          </DialogTitle>
          <DialogDescription>
            Esta acción es <strong>destructiva e irreversible</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-[var(--ds-space-300)] mt-[var(--ds-space-200)]">
          <Banner variant="error">
            <div className="space-y-[var(--ds-space-100)]">
              <div className="font-semibold">Se eliminará TODA la información de la empresa.</div>
              <ul className="list-disc pl-[var(--ds-space-300)] text-[var(--ds-font-size-075)]">
                <li>Todas las sedes, permisos y documentos.</li>
                <li>Miembros, invitaciones y registros de auditoría.</li>
                <li>No queda copia de seguridad accesible desde la app.</li>
                <li>Tu cuenta de usuario quedará sin empresa asociada.</li>
              </ul>
              <div className="text-[var(--ds-font-size-075)] mt-[var(--ds-space-100)]">
                Si solo querés cambiar el tipo de negocio o limpiar permisos puntuales, cancelá y
                usa la sección Empresa.
              </div>
            </div>
          </Banner>

          <div>
            <label className="block text-[var(--ds-font-size-075)] font-semibold mb-[var(--ds-space-050)]">
              Para confirmar, escribe el nombre exacto de la empresa:
            </label>
            <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] mb-[var(--ds-space-100)]">
              <code className="bg-[var(--ds-background-subtle)] px-[var(--ds-space-100)] py-[var(--ds-space-025)] rounded">
                {companyName}
              </code>
            </p>
            <Input
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={companyName}
              disabled={submitting}
              autoComplete="off"
            />
          </div>

          {error && <Banner variant="error">{error}</Banner>}
        </div>

        <DialogFooter className="mt-[var(--ds-space-300)]">
          <Button variant="outline" onClick={() => handleClose(false)} disabled={submitting} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={!canSubmit} className="w-full sm:w-auto">
            {submitting ? 'Eliminando...' : 'Eliminar empresa permanentemente'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
