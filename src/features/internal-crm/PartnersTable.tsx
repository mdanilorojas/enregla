import { useState } from 'react'
import { usePartners } from '@/hooks/usePartners'
import { Badge } from '@/components/ui/badge'
import { qualifyPartner, qualificationLabel, type PartnerStatus, type PartnerTipo, type PartnerQualification } from '@/types/crm'

const STATUS_LABELS: Record<PartnerStatus, string> = {
  identificado: 'Identificado',
  contactado: 'Contactado',
  respondio: 'Respondió',
  reunion_agendada: 'Reunión agendada',
  pilot_propuesto: 'Pilot propuesto',
  pilot_activo: 'Pilot activo',
  convertido: 'Convertido',
  rechazado: 'Rechazado',
  nurture: 'Nurture',
}

const TIPO_LABELS: Record<PartnerTipo, string> = {
  contadora: 'Contadora',
  tramitador: 'Tramitador',
  arcsa: 'ARCSA',
  bomberos: 'Bomberos',
  legal: 'Legal',
  asesor_admin: 'Asesor admin',
  pos_provider: 'POS Provider',
  gremio: 'Gremio',
  otro: 'Otro',
}

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary'

const STATUS_VARIANTS: Record<PartnerStatus, BadgeVariant> = {
  identificado: 'secondary',
  contactado: 'info',
  respondio: 'info',
  reunion_agendada: 'info',
  pilot_propuesto: 'warning',
  pilot_activo: 'warning',
  convertido: 'success',
  rechazado: 'danger',
  nurture: 'secondary',
}

const QUAL_VARIANTS: Record<PartnerQualification, BadgeVariant> = {
  priority: 'success',
  good: 'info',
  nurture: 'warning',
  ignore: 'danger',
}

export function PartnersTable() {
  const { partners, loading, error, updatePartner } = usePartners()
  const [filterStatus, setFilterStatus] = useState<PartnerStatus | 'all'>('all')
  const [filterTipo, setFilterTipo] = useState<PartnerTipo | 'all'>('all')

  if (loading) return <div className="p-6 text-ds-neutral-600">Cargando...</div>
  if (error) return <div className="p-6 text-ds-red-600">Error: {error}</div>

  const filtered = partners
    .filter(p => filterStatus === 'all' || p.status === filterStatus)
    .filter(p => filterTipo === 'all' || p.tipo === filterTipo)

  return (
    <div className="bg-white border border-ds-neutral-200 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-ds-neutral-200 flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-ds-blue-500">Partners ({filtered.length})</h2>
          <p className="text-sm text-ds-neutral-600">Enablers en pipeline · ordenados por score</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            className="border border-ds-neutral-300 rounded px-3 py-1.5 text-sm"
            value={filterTipo}
            onChange={e => setFilterTipo(e.target.value as PartnerTipo | 'all')}
          >
            <option value="all">Todos los tipos</option>
            {(Object.keys(TIPO_LABELS) as PartnerTipo[]).map(t => (
              <option key={t} value={t}>{TIPO_LABELS[t]}</option>
            ))}
          </select>
          <select
            className="border border-ds-neutral-300 rounded px-3 py-1.5 text-sm"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as PartnerStatus | 'all')}
          >
            <option value="all">Todos los estados</option>
            {(Object.keys(STATUS_LABELS) as PartnerStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-ds-neutral-50 border-b border-ds-neutral-200">
            <tr>
              <th className="text-left p-3 font-semibold text-ds-neutral-600">Negocio / Tipo</th>
              <th className="text-left p-3 font-semibold text-ds-neutral-600">Contacto</th>
              <th className="text-left p-3 font-semibold text-ds-neutral-600">Score</th>
              <th className="text-left p-3 font-semibold text-ds-neutral-600">Estado</th>
              <th className="text-left p-3 font-semibold text-ds-neutral-600">Próxima acción</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(partner => {
              const qual = qualifyPartner(partner.score_total)
              return (
                <tr key={partner.id} className="border-b border-ds-neutral-100 hover:bg-ds-neutral-50">
                  <td className="p-3">
                    <div className="font-semibold text-ds-blue-500">{partner.nombre_negocio}</div>
                    <div className="text-xs text-ds-neutral-500">{TIPO_LABELS[partner.tipo]}</div>
                  </td>
                  <td className="p-3">
                    <div className="text-ds-neutral-700">{partner.contacto_nombre ?? '—'}</div>
                    <div className="text-xs text-ds-neutral-500">{partner.email ?? partner.telefono ?? '—'}</div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-ds-blue-500">{partner.score_total}/40</span>
                      <Badge variant={QUAL_VARIANTS[qual]} size="sm">
                        {qualificationLabel(qual)}
                      </Badge>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={STATUS_VARIANTS[partner.status]} size="sm">
                        {STATUS_LABELS[partner.status]}
                      </Badge>
                      <select
                        className="border border-ds-neutral-300 rounded px-2 py-1 text-xs"
                        value={partner.status}
                        onChange={e => updatePartner(partner.id, { status: e.target.value as PartnerStatus })}
                      >
                        {(Object.keys(STATUS_LABELS) as PartnerStatus[]).map(s => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="text-ds-neutral-700 text-sm">{partner.proxima_accion ?? '—'}</div>
                    {partner.proxima_accion_fecha && (
                      <div className="text-xs text-ds-neutral-500">
                        {new Date(partner.proxima_accion_fecha).toLocaleDateString('es-EC')}
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-ds-neutral-500">No hay partners en este filtro.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
