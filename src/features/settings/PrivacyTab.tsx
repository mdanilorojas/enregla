import { useState } from 'react'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Banner } from '@/components/ui/banner'
import { Download, Trash2 } from '@/lib/lucide-icons'
import { useAuth } from '@/hooks/useAuth'
import { useCompany } from '@/hooks/useCompany'
import { supabase } from '@/lib/supabase'
import { DeleteCompanyDialog } from './DeleteCompanyDialog'

export function PrivacyTab() {
  const { profile } = useAuth()
  const companyId = profile?.company_id ?? null
  const { data: company } = useCompany(companyId ?? undefined)
  const [exporting, setExporting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  // El creador de la empresa tiene rol 'admin' (no existe 'owner' en el modelo).
  const isOwner = profile?.role === 'admin'

  async function handleExport() {
    if (!companyId) return
    setExporting(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc('export_company_data', {
        p_company_id: companyId,
      })
      if (error) throw error

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const today = new Date().toISOString().slice(0, 10)
      const safeName = (company?.name ?? 'enregla')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      a.download = `${safeName}-export-${today}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Exportación lista')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al exportar'
      toast.error(message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-[var(--ds-space-300)]">
      <Card className="p-[var(--ds-space-300)] space-y-[var(--ds-space-200)]">
        <div>
          <h2 className="text-[var(--ds-font-size-300)] font-semibold text-[var(--ds-text)]">
            Exportar mis datos
          </h2>
          <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mt-[var(--ds-space-050)]">
            Descarga un archivo JSON con la información de tu empresa: sedes, permisos,
            documentos, miembros y los últimos 1.000 eventos de auditoría. Cumple con el derecho
            a la portabilidad (Ley Orgánica de Protección de Datos Personales, Art. 9).
          </p>
        </div>
        <div>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={!companyId || exporting}
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Generando archivo...' : 'Descargar mis datos (JSON)'}
          </Button>
        </div>
      </Card>

      <Card className="p-[var(--ds-space-300)] space-y-[var(--ds-space-200)] border-[var(--ds-color-danger-border,#fca5a5)]">
        <div>
          <h2 className="text-[var(--ds-font-size-300)] font-semibold text-[var(--ds-color-danger-text,#b91c1c)]">
            Eliminar empresa
          </h2>
          <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mt-[var(--ds-space-050)]">
            Borra toda la información de tu empresa de forma <strong>permanente e
            irreversible</strong>: sedes, permisos, documentos, miembros, invitaciones y
            registros de auditoría.
          </p>
        </div>

        {!isOwner && (
          <Banner variant="info">
            Solo un <strong>administrador</strong> de la empresa puede eliminarla. Pide a un
            administrador que ejecute esta acción si es necesario.
          </Banner>
        )}

        <div>
          <Button
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
            disabled={!companyId || !isOwner}
          >
            <Trash2 className="w-4 h-4" />
            Eliminar empresa permanentemente
          </Button>
        </div>
      </Card>

      {companyId && company && (
        <DeleteCompanyDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          companyId={companyId}
          companyName={company.name}
        />
      )}
    </div>
  )
}
