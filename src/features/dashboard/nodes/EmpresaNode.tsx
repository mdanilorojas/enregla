import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { Landmark } from '@/lib/lucide-icons'

export type EmpresaNodeData = {
  label: string
}

type EmpresaNodeType = Node<EmpresaNodeData, 'empresa'>

export function EmpresaNode({ data }: NodeProps<EmpresaNodeType>) {
  return (
    <div className="bg-[var(--ds-background-brand)] text-white rounded-[var(--ds-radius-100)] px-[var(--ds-space-300)] py-[var(--ds-space-200)] shadow-[var(--ds-shadow-overlay)] min-w-[160px]">
      <Handle type="source" position={Position.Top} id="top" className="!bg-transparent !border-0" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-transparent !border-0" />
      <Handle type="source" position={Position.Left} id="left" className="!bg-transparent !border-0" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-transparent !border-0" />
      <div className="flex justify-center mb-[var(--ds-space-100)]">
        <Landmark className="w-6 h-6" />
      </div>
      <div className="text-center font-semibold text-[var(--ds-font-size-100)]">{data.label}</div>
    </div>
  )
}
