import { useState, useEffect } from 'react'
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { Landmark } from '@/lib/lucide-icons'

export type EmpresaNodeData = {
  label: string
  businessType?: string
}

type EmpresaNodeType = Node<EmpresaNodeData, 'empresa'>

export function EmpresaNode({ data }: NodeProps<EmpresaNodeType>) {
  const [isEntranceAnimating, setIsEntranceAnimating] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsEntranceAnimating(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  const isRestaurante = data.businessType === 'restaurante'

  return (
    <div className="group bg-[var(--ds-background-brand)] text-white rounded-[var(--ds-radius-100)] px-[var(--ds-space-300)] py-[var(--ds-space-200)] shadow-[var(--ds-shadow-overlay)] min-w-[160px] select-none">
      <Handle type="source" position={Position.Top} id="top" className="!bg-transparent !border-0" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-transparent !border-0" />
      <Handle type="source" position={Position.Left} id="left" className="!bg-transparent !border-0" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-transparent !border-0" />
      <div className="flex justify-center mb-[var(--ds-space-100)]">
        {isRestaurante ? (
          <div className="relative w-8 h-8 flex items-center justify-center text-white">
            <svg viewBox="0 0 24 24" className="w-full h-full fill-none stroke-current stroke-[2.2]">
              {/* Steam Trails */}
              <path 
                className={isEntranceAnimating ? "animate-steam-rise" : "hidden group-hover:block animate-steam-rise"} 
                d="M10 5 C10 3, 11 2, 10.5 1" 
              />
              <path 
                className={isEntranceAnimating ? "animate-steam-rise [animation-delay:0.2s]" : "hidden group-hover:block animate-steam-rise [animation-delay:0.2s]"} 
                d="M12 5 C12 3, 13 2, 12.5 1" 
              />
              <path 
                className={isEntranceAnimating ? "animate-steam-rise [animation-delay:0.4s]" : "hidden group-hover:block animate-steam-rise [animation-delay:0.4s]"} 
                d="M14 5 C14 3, 15 2, 14.5 1" 
              />
              {/* Cloche dome */}
              <path 
                className={isEntranceAnimating ? "animate-cloche-entrance" : "transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:-rotate-3 origin-bottom"} 
                d="M4 16 A8 8 0 0 1 20 16 Z M12 8 a 1 1 0 1 1 0-2" 
              />
              {/* Tray Base */}
              <path d="M2 17h20v2H2z" />
            </svg>
          </div>
        ) : (
          <Landmark className="w-6 h-6" />
        )}
      </div>
      <div className="text-center font-semibold text-[var(--ds-font-size-100)]">{data.label}</div>
    </div>
  )
}

