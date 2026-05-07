import { BaseEdge, getBezierPath, type Edge, type EdgeProps } from '@xyflow/react'

export type CustomEdgeData = {
  status: 'success' | 'warning' | 'danger'
  startDate?: string
}

type CustomEdgeType = Edge<CustomEdgeData, 'custom'>

export function CustomEdge({
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  data, markerEnd, style,
}: EdgeProps<CustomEdgeType>) {
  const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })

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
