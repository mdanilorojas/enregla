import { EmptyState } from '@/components/ui/empty-state'
import { FolderOpen } from '@/lib/lucide-icons'

export interface LocationDocumentsTabProps {
  locationId: string
}

// locationId reserved for future per-location document filter (currently a placeholder)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function LocationDocumentsTab(_props: LocationDocumentsTabProps) {
  return (
    <EmptyState
      icon={FolderOpen}
      title="Documentos de la sede"
      description="Los documentos se gestionan desde los permisos individuales de esta sede"
    />
  )
}
