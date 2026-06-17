import { DashboardMap, type SedeMapData } from '@/features/dashboard/DashboardMap'

export interface NetworkMapCanvasProps {
  empresaName: string
  businessType?: string
  sedes: SedeMapData[]
  onSedeClick?: (sedeId: string) => void
}

export function NetworkMapCanvas({ empresaName, businessType, sedes, onSedeClick }: NetworkMapCanvasProps) {
  return (
    <div className="w-full h-full">
      <DashboardMap
        empresaName={empresaName}
        businessType={businessType}
        sedes={sedes}
        fillParent
        onSedeClick={onSedeClick}
      />
    </div>
  )
}

