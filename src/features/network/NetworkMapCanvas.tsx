import { DashboardMap, type SedeMapData } from '@/features/dashboard/DashboardMap'

export interface NetworkMapCanvasProps {
  empresaName: string
  sedes: SedeMapData[]
}

export function NetworkMapCanvas({ empresaName, sedes }: NetworkMapCanvasProps) {
  return (
    <div className="flex-1 relative">
      <DashboardMap empresaName={empresaName} sedes={sedes} />
    </div>
  )
}
