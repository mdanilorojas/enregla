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
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { BUSINESS_TYPES, businessTypeLabel } from '@/lib/domain/business-types'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyId: string
  companyName: string
  currentBusinessType: string
  onChanged: (newBusinessType: string) => void
}

export function ChangeBusinessTypeDialog({
  open,
  onOpenChange,
  companyId,
  companyName,
  currentBusinessType,
  onChanged,
}: Props) {
  const [newType, setNewType] = useState<string>('')
  const [confirmName, setConfirmName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const reset = () => {
    setNewType('')
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
    newType !== '' &&
    newType !== currentBusinessType &&
    confirmName === companyName &&
    !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: rpcError } = await (supabase as any).rpc(
      'change_company_business_type',
      {
        p_company_id: companyId,
        p_new_business_type: newType,
        p_confirmation_name: confirmName,
      }
    )

    if (rpcError) {
      setError(rpcError.message ?? 'Error desconocido')
      setSubmitting(false)
      return
    }

    const deleted = data?.permits_deleted ?? 0
    const created = data?.permits_created ?? 0

    await queryClient.invalidateQueries({ queryKey: ['company', companyId] })
    await queryClient.invalidateQueries({ queryKey: ['permits'] })
    await queryClient.invalidateQueries({ queryKey: ['locations'] })
    await queryClient.invalidateQueries({ queryKey: ['permit_requirements'] })

    toast.success(
      `Tipo cambiado a ${businessTypeLabel(newType)}. ${deleted} permisos eliminados, ${created} regenerados.`
    )
    onChanged(newType)
    reset()
    onOpenChange(false)
  }

  const options = BUSINESS_TYPES.filter((t) => t !== currentBusinessType)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-[var(--ds-color-danger-text,#b91c1c)]">
            Cambiar tipo de negocio
          </DialogTitle>
          <DialogDescription>
            Esta acción es <strong>destructiva e irreversible</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-[var(--ds-space-300)] mt-[var(--ds-space-200)]">
          <Banner variant="error">
            <div className="space-y-[var(--ds-space-100)]">
              <div className="font-semibold">
                Todos los permisos actuales de la empresa se eliminarán.
              </div>
              <ul className="list-disc pl-[var(--ds-space-300)] text-[var(--ds-font-size-075)]">
                <li>Se borrarán todos los permits con sus documentos asociados.</li>
                <li>
                  Se generarán nuevos permits según los requisitos del nuevo tipo de negocio.
                </li>
                <li>El historial de eventos de los permits anteriores se perderá.</li>
                <li>No hay forma de deshacer esta operación.</li>
              </ul>
            </div>
          </Banner>

          <div>
            <label className="block text-[var(--ds-font-size-075)] font-semibold mb-[var(--ds-space-050)]">
              Nuevo tipo de negocio
            </label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              disabled={submitting}
              className="w-full bg-white border border-[var(--ds-border)] rounded-[var(--ds-radius-200)] px-[var(--ds-space-150)] py-[var(--ds-space-100)] text-[var(--ds-font-size-100)] text-[var(--ds-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ds-background-brand)]/20 focus:border-[var(--ds-border-bold)] transition-all disabled:opacity-50"
            >
              <option value="">— Selecciona un tipo —</option>
              {options.map((t) => (
                <option key={t} value={t}>
                  {businessTypeLabel(t)}
                </option>
              ))}
            </select>
            <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] mt-[var(--ds-space-050)]">
              Tipo actual: <strong>{businessTypeLabel(currentBusinessType)}</strong>
            </p>
          </div>

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
            className="w-full sm:w-auto"
          >
            {submitting ? 'Cambiando...' : 'Eliminar permisos y cambiar tipo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
