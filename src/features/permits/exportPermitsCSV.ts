export interface ExportablePermit {
  location: string
  type: string
  status: string
  expires_at: string | null
  authority: string
  responsible: string
}

export function exportPermitsCSV(permits: ExportablePermit[]): void {
  const headers = ['Sede', 'Tipo', 'Estado', 'Vencimiento', 'Autoridad', 'Responsable']

  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`

  const rows = permits.map(p => [
    escape(p.location),
    escape(p.type),
    escape(p.status),
    escape(p.expires_at ? new Date(p.expires_at).toLocaleDateString('es-EC') : '-'),
    escape(p.authority),
    escape(p.responsible),
  ].join(','))

  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `permisos-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
