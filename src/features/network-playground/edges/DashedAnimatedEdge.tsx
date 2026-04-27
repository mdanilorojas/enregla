import { type EdgeProps, getBezierPath, BaseEdge } from '@xyflow/react';

/**
 * DashedAnimatedEdge
 * Dashed line that continuously flows, typical React Flow style.
 */
export function DashedAnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const stroke = (style as { stroke?: string }).stroke || '#94A3B8';

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          stroke,
          strokeWidth: 2,
          strokeDasharray: '8 4',
          opacity: 0.7,
          animation: 'dash-flow 1s linear infinite',
        }}
      />
      <style>{`
        @keyframes dash-flow {
          from {
            stroke-dashoffset: 24;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </>
  );
}
