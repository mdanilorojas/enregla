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
import { Checkbox } from '@/components/ui/checkbox'
import { Banner } from '@/components/ui/banner'
import { useAuth } from '@/hooks/useAuth'
import { useLocations } from '@/hooks/useLocations'
import { resolveCompanyId } from '@/lib/demo'
import { supabase } from '@/lib/supabase'

interface Props {
  permitType: string
  permitLabel: string
  open: boolean
  onClose: () => void
}

export function AddPermitToLocationsModal({ permitType, permitLabel, open, onClose }: Props) {
  const { profile } = useAuth()
  const companyId = resolveCompanyId(profile?.company_id) ?? undefined
  const { locations, loading: loadingLocations } = useLocations(companyId)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmit = async () => {
    if (!companyId || selected.size === 0) return
    setSaving(true)
    setError(null)

    const rows = Array.from(selected).map((locationId) => ({
      company_id: companyId,
      location_id: locationId,
      type: permitType,
      status: 'no_registrado' as const,
      is_active: true,
      version: 1,
    }))

    // casting due to stale generated types — see audit follow-up
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query = supabase.from('permits') as any
    const { error: insertError } = await query.insert(rows)
    setSaving(false)

    if (insertError) {
      console.error('[AddPermitToLocations] insert error:', insertError)
      setError(insertError.message)
      return
    }

    toast.success(`${permitLabel} agregado a ${selected.size} sede${selected.size > 1 ? 's' : ''}`)
    setSelected(new Set())
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar {permitLabel} a mis sedes</DialogTitle>
          <DialogDescription>
            Se crea un registro de permiso en estado "no registrado" por cada sede seleccionada.
            Después puedes subir el documento cuando lo tengas.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          {error && <Banner variant="error">{error}</Banner>}

          {loadingLocations ? (
            <p className="text-sm text-[var(--ds-text-subtle)]">Cargando sedes...</p>
          ) : locations.length === 0 ? (
            <Banner variant="warning">
              No tienes sedes creadas. Crea una sede antes de agregar permisos.
            </Banner>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {locations.map((loc) => (
                <label
                  key={loc.id}
                  className="flex items-center gap-3 p-3 rounded-md border border-[var(--ds-border)] cursor-pointer hover:bg-[var(--ds-neutral-50)]"
                >
                  <Checkbox
                    checked={selected.has(loc.id)}
                    onCheckedChange={() => toggle(loc.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{loc.name}</div>
                    {loc.address && (
                      <div className="text-xs text-[var(--ds-text-subtle)] truncate">
                        {loc.address}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="default"
            onClick={handleSubmit}
            disabled={selected.size === 0 || saving}
          >
            {saving ? 'Agregando...' : `Agregar a ${selected.size} sede${selected.size === 1 ? '' : 's'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
