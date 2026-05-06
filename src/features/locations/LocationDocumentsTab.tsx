import { EmptyState } from '@/components/ui/empty-state'
import { FolderOpen } from '@/lib/lucide-icons'

export interface LocationDocumentsTabProps {
  locationId: string
}

export function LocationDocumentsTab({ locationId: _locationId }: LocationDocumentsTabProps) {
  return (
    <EmptyState
      icon={FolderOpen}
      title="Documentos de la sede"
      description="Los documentos se gestionan desde los permisos individuales de esta sede"
    />
  )
}
