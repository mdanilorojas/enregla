import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Banner } from '@/components/ui/banner'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import type { Company } from '@/types/database'
import { businessTypeLabel } from '@/lib/domain/business-types'
import { ChangeBusinessTypeDialog } from './ChangeBusinessTypeDialog'

type Draft = {
  name: string
  ruc: string
  city: string
}

export function CompanyTab() {
  const { profile } = useAuth()
  const companyId = profile?.company_id

  const [company, setCompany] = useState<Company | null>(null)
  const [draft, setDraft] = useState<Draft>({
    name: '',
    ruc: '',
    city: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [changeTypeOpen, setChangeTypeOpen] = useState(false)

  useEffect(() => {
    if (!companyId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single()
      .then(({ data, error: fetchError }) => {
        if (cancelled) return
        if (fetchError) {
          console.error('[CompanyTab] Error fetching company:', fetchError)
          setError(fetchError.message)
        } else if (data) {
          setCompany(data)
          setDraft({
            name: data.name ?? '',
            ruc: data.ruc ?? '',
            city: data.city ?? '',
          })
        }
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [companyId])

  const handleSave = async () => {
    if (!companyId) return

    // Validacion basica
    if (draft.name.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres')
      return
    }
    if (!/^\d{13}$/.test(draft.ruc)) {
      setError('El RUC debe tener exactamente 13 digitos')
      return
    }
    if (draft.city.trim().length < 2) {
      setError('La ciudad es requerida')
      return
    }

    setSaving(true)
    setError(null)

    // casting due to stale generated types — see audit follow-up
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query = supabase.from('companies') as any
    const { data: updated, error: updateError } = await query
      .update({
        name: draft.name.trim(),
        ruc: draft.ruc.trim(),
        city: draft.city.trim(),
      })
      .eq('id', companyId)
      .select()

    if (updateError) {
      console.error('[CompanyTab] Error updating company:', updateError)
      setError(updateError.message)
      setSaving(false)
      return
    }

    // Si RLS filtró la fila, el update no afecta nada y no lanza error: detectarlo
    // en vez de mostrar un falso "guardado".
    if (!updated || updated.length === 0) {
      setError('No se pudo guardar el cambio. Verifica tus permisos e intenta de nuevo.')
      setSaving(false)
      return
    }

    setCompany(updated[0] as Company)
    setSaving(false)
    toast.success('Empresa actualizada')
  }

  if (!companyId) {
    return (
      <Card className="p-[var(--ds-space-400)]">
        <h2 className="text-[var(--ds-font-size-300)] font-semibold mb-[var(--ds-space-300)]">Empresa</h2>
        <Banner variant="warning">
          No tienes una empresa asignada. Completa el onboarding para crear tu empresa.
        </Banner>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="p-[var(--ds-space-400)]">
        <p className="text-[var(--ds-text-subtle)]">Cargando empresa...</p>
      </Card>
    )
  }

  const isDirty =
    company != null &&
    (draft.name.trim() !== (company.name ?? '') ||
      draft.ruc.trim() !== (company.ruc ?? '') ||
      draft.city.trim() !== (company.city ?? ''))

  return (
    <Card className="p-[var(--ds-space-400)]">
      <h2 className="text-[var(--ds-font-size-300)] font-semibold mb-[var(--ds-space-300)]">Empresa</h2>

      {error && (
        <div className="mb-[var(--ds-space-300)]">
          <Banner variant="error">{error}</Banner>
        </div>
      )}

      <div className="space-y-[var(--ds-space-300)]">
        <div>
          <label className="block text-[var(--ds-font-size-075)] font-semibold mb-[var(--ds-space-050)]">
            Razón Social
          </label>
          <Input
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="Empresa S.A."
            disabled={saving}
          />
        </div>

        <div>
          <label className="block text-[var(--ds-font-size-075)] font-semibold mb-[var(--ds-space-050)]">
            RUC
          </label>
          <Input
            value={draft.ruc}
            onChange={(e) => setDraft((d) => ({ ...d, ruc: e.target.value.replace(/\D/g, '') }))}
            placeholder="1234567890001"
            maxLength={13}
            disabled={saving}
          />
          <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] mt-[var(--ds-space-050)]">
            13 dígitos numéricos
          </p>
        </div>

        <div>
          <label className="block text-[var(--ds-font-size-075)] font-semibold mb-[var(--ds-space-050)]">
            Tipo de negocio
          </label>
          <div className="flex items-center gap-[var(--ds-space-200)] p-[var(--ds-space-200)] border border-[var(--ds-border)] rounded-[var(--ds-radius-200)] bg-[var(--ds-background-subtle,#f8fafc)]">
            <div className="flex-1">
              <div className="text-[var(--ds-font-size-100)] font-semibold text-[var(--ds-text)]">
                {businessTypeLabel(company?.business_type ?? '')}
              </div>
              <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] mt-[var(--ds-space-025)]">
                Define qué permisos se generan al crear una sede.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setChangeTypeOpen(true)}
              disabled={saving || !company}
            >
              Cambiar tipo
            </Button>
          </div>
          <p className="text-[var(--ds-font-size-075)] text-[var(--ds-color-danger-text,#b91c1c)] mt-[var(--ds-space-100)]">
            Cambiar el tipo eliminará todos los permisos actuales. Acción destructiva.
          </p>
        </div>

        <div>
          <label className="block text-[var(--ds-font-size-075)] font-semibold mb-[var(--ds-space-050)]">
            Ciudad
          </label>
          <Input
            value={draft.city}
            onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))}
            placeholder="Quito"
            disabled={saving}
          />
        </div>

        <Button variant="default" onClick={handleSave} disabled={!isDirty || saving}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>

      {company && (
        <ChangeBusinessTypeDialog
          open={changeTypeOpen}
          onOpenChange={setChangeTypeOpen}
          companyId={company.id}
          companyName={company.name}
          currentBusinessType={company.business_type ?? ''}
          onChanged={(newType) =>
            setCompany((prev) => (prev ? { ...prev, business_type: newType } : prev))
          }
        />
      )}
    </Card>
  )
}
