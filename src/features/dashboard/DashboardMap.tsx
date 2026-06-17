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
  businessType?: string
  sedes: SedeMapData[]
  fillParent?: boolean
  onSedeClick?: (sedeId: string) => void
}

const HUB_W = 200
const HUB_H = 100
const SEDE_W = 220
const SEDE_H = 110

function radiusFor(n: number) {
  if (n <= 1) return 260
  if (n <= 4) return 320
  if (n <= 8) return 380
  return 380 + (n - 8) * 28
}

export function DashboardMap({ empresaName, businessType, sedes, fillParent = false, onSedeClick }: DashboardMapProps) {
  const { nodes, edges } = useMemo(() => {
    const centerX = 0
    const centerY = 0
    const radius = radiusFor(sedes.length)

    const nodes: Node[] = [
      {
        id: 'empresa',
        type: 'empresa',
        position: { x: centerX - HUB_W / 2, y: centerY - HUB_H / 2 },
        data: { label: empresaName, businessType },
        draggable: true,
      },
    ]
    const edges: Edge[] = []

    sedes.forEach((sede, i) => {
      const angle = (i / Math.max(sedes.length, 1)) * 2 * Math.PI - Math.PI / 2
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius

      const percentage = sede.total > 0 ? (sede.permits / sede.total) * 100 : 0

      nodes.push({
        id: sede.id,
        type: 'sede',
        position: { x: x - SEDE_W / 2, y: y - SEDE_H / 2 },
        data: { ...sede, percentage } satisfies SedeNodeData,
        draggable: true,
      })

      edges.push({
        id: `e-${sede.id}`,
        source: 'empresa',
        target: sede.id,
        type: 'custom',
        data: { status: sede.status } satisfies CustomEdgeData,
      })
    })

    return { nodes, edges }
  }, [empresaName, businessType, sedes])

  const containerStyle = fillParent
    ? { width: '100%', height: '100%' }
    : { width: '100%', height: 600 }

  return (
    <div style={containerStyle}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.15, minZoom: 0.4, maxZoom: 1 }}
        minZoom={0.3}
        maxZoom={1.5}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        onNodeClick={(_, node) => {
          if (node.type === 'sede') onSedeClick?.(node.id)
        }}
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
