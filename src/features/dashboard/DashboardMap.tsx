import { useMemo } from 'react'
import { ReactFlow, Background, BackgroundVariant, Controls, type Node, type Edge, type NodeTypes, type EdgeTypes } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { EmpresaNode } from './nodes/EmpresaNode'
import { SedeNode, type SedeNodeData } from './nodes/SedeNode'
import { CustomEdge, type CustomEdgeData } from './edges/CustomEdge'

const nodeTypes: NodeTypes = { empresa: EmpresaNode as unknown as NodeTypes[string], sede: SedeNode as unknown as NodeTypes[string] }
const edgeTypes: EdgeTypes = { custom: CustomEdge as unknown as EdgeTypes[string] }

export interface SedeMapData {
  id: string
  label: string
  code: string
  permits: number
  total: number
  status: 'success' | 'warning' | 'danger'
  risk: 'Bajo' | 'Medio' | 'Alto' | 'Crítico'
}

export interface DashboardMapProps {
  empresaName: string
  sedes: SedeMapData[]
  fillParent?: boolean
}

export function DashboardMap({ empresaName, sedes, fillParent = false }: DashboardMapProps) {
  const { nodes, edges } = useMemo(() => {
    const centerX = 400
    const centerY = 250
    const radius = 300

    const nodes: Node[] = [
      {
        id: 'empresa',
        type: 'empresa',
        position: { x: centerX, y: centerY },
        data: { label: empresaName },
      },
    ]
    const edges: Edge[] = []

    sedes.forEach((sede, i) => {
      const angle = (i / Math.max(sedes.length, 1)) * 2 * Math.PI - Math.PI / 2
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius

      const isAbove = y < centerY
      const sourceHandle = isAbove ? 'top' : 'bottom'
      const targetHandle = isAbove ? 'bottom' : 'top'

      const percentage = sede.total > 0 ? (sede.permits / sede.total) * 100 : 0

      nodes.push({
        id: sede.id,
        type: 'sede',
        position: { x: x - 100, y: y - 50 },
        data: { ...sede, percentage } satisfies SedeNodeData,
      })

      edges.push({
        id: `e-${sede.id}`,
        source: 'empresa',
        sourceHandle,
        target: sede.id,
        targetHandle,
        type: 'custom',
        data: { status: sede.status } satisfies CustomEdgeData,
      })
    })

    return { nodes, edges }
  }, [empresaName, sedes])

  const containerStyle = fillParent
    ? { width: '100%', height: '100%' }
    : { width: '100%', height: 500 }

  return (
    <div style={containerStyle}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.4}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          color="var(--ds-neutral-300)"
          gap={24}
          size={1.5}
        />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
