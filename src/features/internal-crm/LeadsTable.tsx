import { useState } from 'react'
import { useLeads } from '@/hooks/useLeads'
import { Badge } from '@/components/ui/badge'
import type { LeadStatus } from '@/types/crm'

const STATUS_LABELS: Record<LeadStatus, string> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  demo_agendada: 'Demo agendada',
  demo_completada: 'Demo completada',
  convertido: 'Convertido',
  rechazado: 'Rechazado',
  nurture: 'Nurture',
}

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary'

const STATUS_VARIANTS: Record<LeadStatus, BadgeVariant> = {
  nuevo: 'warning',
  contactado: 'info',
  demo_agendada: 'info',
  demo_completada: 'info',
  convertido: 'success',
  rechazado: 'danger',
  nurture: 'secondary',
}

const SOURCE_LABELS: Record<string, string> = {
  diagnostico: 'Diagnóstico',
  partners: 'Partners',
  home: 'Home',
  sobre: 'Sobre',
  otro: 'Otro',
}

export function LeadsTable() {
  const { leads, loading, error, setStatus } = useLeads()
  const [filterStatus, setFilterStatus] = useState<LeadStatus | 'all'>('all')

  if (loading) return <div className="p-6 text-ds-neutral-600">Cargando...</div>
  if (error) return <div className="p-6 text-ds-red-600">Error: {error}</div>

  const filtered = filterStatus === 'all' ? leads : leads.filter(l => l.status === filterStatus)

  return (
    <div className="bg-white border border-ds-neutral-200 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-ds-neutral-200 flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-ds-blue-500">Leads ({filtered.length})</h2>
          <p className="text-sm text-ds-neutral-600">Capturados desde la landing pública</p>
        </div>
        <select
          className="border border-ds-neutral-300 rounded px-3 py-1.5 text-sm"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as LeadStatus | 'all')}
        >
          <option value="all">Todos los estados</option>
          {(Object.keys(STATUS_LABELS) as LeadStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-ds-neutral-50 border-b border-ds-neutral-200">
            <tr>
              <th className="text-left p-3 font-semibold text-ds-neutral-600">Nombre / Negocio</th>
              <th className="text-left p-3 font-semibold text-ds-neutral-600">Contacto</th>
              <th className="text-left p-3 font-semibold text-ds-neutral-600">Origen</th>
              <th className="text-left p-3 font-semibold text-ds-neutral-600">Estado</th>
              <th className="text-left p-3 font-semibold text-ds-neutral-600">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(lead => (
              <tr key={lead.id} className="border-b border-ds-neutral-100 hover:bg-ds-neutral-50">
                <td className="p-3">
                  <div className="font-semibold text-ds-blue-500">{lead.nombre}</div>
                  <div className="text-xs text-ds-neutral-500">{lead.negocio}</div>
                </td>
                <td className="p-3">
                  <div className="text-ds-neutral-700">{lead.email}</div>
                  {lead.telefono && <div className="text-xs text-ds-neutral-500">{lead.telefono}</div>}
                </td>
                <td className="p-3">
                  <Badge variant="secondary" size="sm">{SOURCE_LABELS[lead.source] ?? lead.source}</Badge>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={STATUS_VARIANTS[lead.status]} size="sm">
                      {STATUS_LABELS[lead.status]}
                    </Badge>
                    <select
                      className="border border-ds-neutral-300 rounded px-2 py-1 text-xs"
                      value={lead.status}
                      onChange={e => setStatus(lead.id, e.target.value as LeadStatus)}
                    >
                      {(Object.keys(STATUS_LABELS) as LeadStatus[]).map(s => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="p-3 text-ds-neutral-600 text-xs whitespace-nowrap">
                  {new Date(lead.created_at).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-ds-neutral-500">No hay leads en este filtro.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
