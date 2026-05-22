import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Banner } from '@/components/ui/banner'
import { useAuth } from '@/hooks/useAuth'
import { useLocations } from '@/hooks/useLocations'
import { useCompany } from '@/hooks/useCompany'
import { resolveCompanyId } from '@/lib/demo'
import { usePermitRequirements } from '@/lib/domain/permit-requirements'
import { permitTypeLabel } from '@/lib/domain/permit-types'
import { supabase } from '@/lib/supabase'
import { ArrowLeft } from '@/lib/lucide-icons'

export function PermitCreateView() {
  const { profile } = useAuth()
  const companyId = resolveCompanyId(profile?.company_id) ?? undefined
  const { data: company } = useCompany(companyId)
  const { locations, loading: loadingLocations } = useLocations(companyId)
  const { data: requirements, isLoading: loadingReqs } = usePermitRequirements(
    company?.business_type ?? undefined
  )
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const initialLocation = params.get('location') ?? ''

  const [locationId, setLocationId] = useState<string>(initialLocation)
  const [permitType, setPermitType] = useState<string>('')
  const [permitNumber, setPermitNumber] = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [issuer, setIssuer] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const typeOptions = useMemo(() => {
    if (!requirements) return []
    return requirements.map((r) => ({
      value: r.permit_type,
      label: permitTypeLabel(r.permit_type),
    }))
  }, [requirements])

  const canSubmit =
    companyId &&
    locationId.length > 0 &&
    permitType.length > 0 &&
    !saving

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSaving(true)
    setError(null)

    const payload = {
      company_id: companyId,
      location_id: locationId,
      type: permitType,
      status: issueDate && expiryDate ? ('vigente' as const) : ('no_registrado' as const),
      permit_number: permitNumber.trim() || null,
      issue_date: issueDate || null,
      expiry_date: expiryDate || null,
      issuer: issuer.trim() || null,
      notes: notes.trim() || null,
      is_active: true,
      version: 1,
    }

    // casting due to stale generated types — see audit follow-up
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query = supabase.from('permits') as any
    const { data, error: insertError } = await query.insert(payload).select().single()
    setSaving(false)

    if (insertError) {
      console.error('[PermitCreateView] insert error:', insertError)
      setError(insertError.message)
      return
    }

    toast.success('Permiso creado')
    navigate(`/permisos/${data.id}`)
  }

  if (!companyId) {
    return (
      <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-200)] sm:p-[var(--ds-space-300)] lg:p-[var(--ds-space-400)]">
        <Card className="p-[var(--ds-space-300)] sm:p-[var(--ds-space-400)] max-w-2xl mx-auto">
          <Banner variant="warning">No tienes una empresa configurada.</Banner>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-200)] sm:p-[var(--ds-space-300)] lg:p-[var(--ds-space-400)]">
      <div className="max-w-2xl mx-auto space-y-[var(--ds-space-300)]">
        <Link to="/permisos" className="inline-flex items-center gap-[var(--ds-space-100)] text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] hover:text-[var(--ds-text)]">
          <ArrowLeft className="w-4 h-4" />Volver a permisos
        </Link>

        <div>
          <h1 className="text-[var(--ds-font-size-500)] font-bold text-[var(--ds-text)]">Nuevo permiso</h1>
          <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mt-[var(--ds-space-050)]">
            Registra un permiso para una de tus sedes. Si aún no tienes el documento, lo puedes subir después.
          </p>
        </div>

        <Card className="p-[var(--ds-space-300)] sm:p-[var(--ds-space-400)]">
          {error && (
            <div className="mb-[var(--ds-space-300)]">
              <Banner variant="error">{error}</Banner>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-[var(--ds-space-300)]">
            <div>
              <label className="block text-[var(--ds-font-size-075)] font-semibold mb-[var(--ds-space-050)]">Sede *</label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                disabled={loadingLocations || saving}
                className="w-full bg-white border border-[var(--ds-border)] rounded-[var(--ds-radius-200)] px-[var(--ds-space-150)] py-[var(--ds-space-100)] text-[var(--ds-font-size-100)]"
              >
                <option value="">Selecciona una sede</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[var(--ds-font-size-075)] font-semibold mb-[var(--ds-space-050)]">Tipo de permiso *</label>
              <select
                value={permitType}
                onChange={(e) => setPermitType(e.target.value)}
                disabled={loadingReqs || saving}
                className="w-full bg-white border border-[var(--ds-border)] rounded-[var(--ds-radius-200)] px-[var(--ds-space-150)] py-[var(--ds-space-100)] text-[var(--ds-font-size-100)]"
              >
                <option value="">
                  {loadingReqs ? 'Cargando catálogo...' : 'Selecciona un tipo'}
                </option>
                {typeOptions.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] mt-[var(--ds-space-050)]">
                Catálogo filtrado por el giro de tu empresa
              </p>
            </div>

            <div>
              <label className="block text-[var(--ds-font-size-075)] font-semibold mb-[var(--ds-space-050)]">Número de permiso</label>
              <Input value={permitNumber} onChange={(e) => setPermitNumber(e.target.value)} disabled={saving} placeholder="Opcional" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--ds-space-200)]">
              <div>
                <label className="block text-[var(--ds-font-size-075)] font-semibold mb-[var(--ds-space-050)]">Fecha de emisión</label>
                <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} disabled={saving} />
              </div>
              <div>
                <label className="block text-[var(--ds-font-size-075)] font-semibold mb-[var(--ds-space-050)]">Fecha de vencimiento</label>
                <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} disabled={saving} />
              </div>
            </div>

            <div>
              <label className="block text-[var(--ds-font-size-075)] font-semibold mb-[var(--ds-space-050)]">Autoridad emisora</label>
              <Input value={issuer} onChange={(e) => setIssuer(e.target.value)} disabled={saving} placeholder="Opcional — se llenará por defecto del catálogo" />
            </div>

            <div>
              <label className="block text-[var(--ds-font-size-075)] font-semibold mb-[var(--ds-space-050)]">Notas</label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} disabled={saving} placeholder="Opcional" />
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-[var(--ds-space-100)]">
              <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={saving} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button type="submit" variant="default" disabled={!canSubmit} className="w-full sm:w-auto">
                {saving ? 'Creando...' : 'Crear permiso'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
