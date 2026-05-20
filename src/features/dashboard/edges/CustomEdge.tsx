import { BaseEdge, Position, getBezierPath, useInternalNode, type Edge, type EdgeProps, type InternalNode, type Node } from '@xyflow/react'

export type CustomEdgeData = {
  status: 'success' | 'warning' | 'danger'
  startDate?: string
}

type CustomEdgeType = Edge<CustomEdgeData, 'custom'>

type Point = { x: number; y: number; pos: Position }

function getNodeCenter(node: InternalNode<Node>) {
  const pos = node.internals.positionAbsolute
  return {
    x: pos.x + (node.measured.width ?? 0) / 2,
    y: pos.y + (node.measured.height ?? 0) / 2,
  }
}

function getEdgeIntersection(node: InternalNode<Node>, target: InternalNode<Node>): Point {
  const w = (node.measured.width ?? 0) / 2
  const h = (node.measured.height ?? 0) / 2
  const c = getNodeCenter(node)
  const t = getNodeCenter(target)

  const dx = t.x - c.x
  const dy = t.y - c.y

  if (dx === 0 && dy === 0) return { x: c.x, y: c.y, pos: Position.Top }

  const tx = dx === 0 ? Infinity : Math.abs(w / dx)
  const ty = dy === 0 ? Infinity : Math.abs(h / dy)
  const k = Math.min(tx, ty)

  const x = c.x + dx * k
  const y = c.y + dy * k

  let pos: Position
  if (tx < ty) pos = dx > 0 ? Position.Right : Position.Left
  else pos = dy > 0 ? Position.Bottom : Position.Top

  return { x, y, pos }
}

export function CustomEdge({ source, target, data, markerEnd, style }: EdgeProps<CustomEdgeType>) {
  const sourceNode = useInternalNode(source)
  const targetNode = useInternalNode(target)

  if (!sourceNode || !targetNode) return null

  const s = getEdgeIntersection(sourceNode, targetNode)
  const t = getEdgeIntersection(targetNode, sourceNode)

  const [edgePath] = getBezierPath({
    sourceX: s.x, sourceY: s.y, sourcePosition: s.pos,
    targetX: t.x, targetY: t.y, targetPosition: t.pos,
  })

  const status = data?.status ?? 'success'

  if (status === 'warning') {
    return (
      <g>
        <path d={edgePath} fill="none" stroke="var(--ds-neutral-300)" strokeWidth={2} />
        <path
          d={edgePath}
          fill="none"
          stroke="var(--ds-orange-500)"
          strokeWidth={2}
          strokeDasharray="25 75"
          style={{ animation: 'dashPulse 1.5s linear infinite' }}
        />
      </g>
    )
  }

  if (status === 'danger') {
    return (
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: 'var(--ds-red-500)',
          strokeWidth: 2,
          strokeDasharray: '5 5',
          animation: 'dashRed 1s linear infinite',
          ...style,
        }}
      />
    )
  }

  return (
    <BaseEdge
      path={edgePath}
      markerEnd={markerEnd}
      style={{ stroke: 'var(--ds-green-500)', strokeWidth: 2, ...style }}
    />
  )
}
