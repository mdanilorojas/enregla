import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Banner } from '@/components/ui/banner'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import type { Company } from '@/types/database'

const BUSINESS_TYPES = [
  { value: 'restaurante', label: 'Restaurante' },
  { value: 'retail', label: 'Retail / Comercio' },
  { value: 'food_truck', label: 'Food Truck' },
  { value: 'consultorio', label: 'Consultorio' },
] as const

type Draft = {
  name: string
  ruc: string
  business_type: string
  city: string
}

export function CompanyTab() {
  const { profile } = useAuth()
  const companyId = profile?.company_id

  const [company, setCompany] = useState<Company | null>(null)
  const [draft, setDraft] = useState<Draft>({
    name: '',
    ruc: '',
    business_type: 'retail',
    city: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!companyId) {
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
            business_type: data.business_type ?? 'retail',
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

    const query = supabase.from('companies') as any
    const { error: updateError } = await query
      .update({
        name: draft.name.trim(),
        ruc: draft.ruc.trim(),
        business_type: draft.business_type,
        city: draft.city.trim(),
      })
      .eq('id', companyId)

    if (updateError) {
      console.error('[CompanyTab] Error updating company:', updateError)
      setError(updateError.message)
      setSaving(false)
      return
    }

    setCompany(
      (prev) =>
        prev && {
          ...prev,
          name: draft.name.trim(),
          ruc: draft.ruc.trim(),
          business_type: draft.business_type,
          city: draft.city.trim(),
        }
    )
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
      draft.business_type !== (company.business_type ?? '') ||
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
          <select
            value={draft.business_type}
            onChange={(e) => setDraft((d) => ({ ...d, business_type: e.target.value }))}
            disabled={saving}
            className="w-full bg-white border border-[var(--ds-border)] rounded-[var(--ds-radius-200)] px-[var(--ds-space-150)] py-[var(--ds-space-100)] text-[var(--ds-font-size-100)] text-[var(--ds-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ds-background-brand)]/20 focus:border-[var(--ds-border-bold)] transition-all disabled:opacity-50"
          >
            {BUSINESS_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] mt-[var(--ds-space-050)]">
            Define qué permisos se crean automáticamente para nuevas sedes
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
    </Card>
  )
}
