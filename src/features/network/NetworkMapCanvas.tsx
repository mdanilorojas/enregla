import { DashboardMap, type SedeMapData } from '@/features/dashboard/DashboardMap'

export interface NetworkMapCanvasProps {
  empresaName: string
  sedes: SedeMapData[]
  onSedeClick?: (sedeId: string) => void
}

export function NetworkMapCanvas({ empresaName, sedes, onSedeClick }: NetworkMapCanvasProps) {
  return (
    <div className="w-full h-full">
      <DashboardMap empresaName={empresaName} sedes={sedes} fillParent onSedeClick={onSedeClick} />
    </div>
  )
}
