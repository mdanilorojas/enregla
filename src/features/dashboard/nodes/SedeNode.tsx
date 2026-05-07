import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { Building2 } from '@/lib/lucide-icons'
import { Badge } from '@/components/ui/badge'

export type SedeNodeData = {
  label: string
  code: string
  permits: number
  total: number
  percentage: number
  status: 'success' | 'warning' | 'danger'
  risk: 'Bajo' | 'Medio' | 'Alto' | 'Crítico'
}

type SedeNodeType = Node<SedeNodeData, 'sede'>

const statusColors: Record<SedeNodeData['status'], string> = {
  success: 'var(--ds-green-500)',
  warning: 'var(--ds-orange-500)',
  danger: 'var(--ds-red-500)',
}

const riskBadgeVariants: Record<SedeNodeData['risk'], 'risk-bajo' | 'risk-medio' | 'risk-alto' | 'risk-critico'> = {
  Bajo: 'risk-bajo',
  Medio: 'risk-medio',
  Alto: 'risk-alto',
  'Crítico': 'risk-critico',
}

export function SedeNode({ data }: NodeProps<SedeNodeType>) {
  const borderColor = statusColors[data.status]
  const fillColor = statusColors[data.status]
  const badgeVariant = riskBadgeVariants[data.risk]

  return (
    <div
      className="bg-white rounded-[var(--ds-radius-100)] p-[var(--ds-space-150)] shadow-[var(--ds-shadow-raised)] w-[200px]"
      style={{ border: `2px solid ${borderColor}` }}
    >
      <Handle type="target" position={Position.Top} id="top" className="!bg-transparent !border-0" />
      <Handle type="target" position={Position.Bottom} id="bottom" className="!bg-transparent !border-0" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-transparent !border-0" />
      <Handle type="target" position={Position.Right} id="right" className="!bg-transparent !border-0" />

      <div className="flex items-center gap-[var(--ds-space-100)] mb-[var(--ds-space-100)]">
        <div className="w-6 h-6 bg-[var(--ds-neutral-100)] rounded-[var(--ds-radius-050)] flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4 text-[var(--ds-text-subtle)]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[var(--ds-font-size-075)] text-[var(--ds-text)] truncate">{data.label}</div>
          <div className="text-[10px] font-mono text-[var(--ds-text-subtlest)]">{data.code}</div>
        </div>
      </div>

      <div className="flex items-center gap-[var(--ds-space-075)] mb-[var(--ds-space-075)]">
        <span className="text-[11px] text-[var(--ds-text-subtle)]">{data.permits}/{data.total} permisos</span>
        <Badge variant={badgeVariant} size="sm" className="ml-auto">{data.risk}</Badge>
      </div>

      <div className="w-full h-1.5 bg-[var(--ds-neutral-100)] rounded-[3px] overflow-hidden">
        <div
          className="h-full rounded-[3px] transition-[width] duration-300"
          style={{ width: `${data.percentage}%`, backgroundColor: fillColor }}
        />
      </div>
    </div>
  )
}
