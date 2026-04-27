import { type EdgeProps, getBezierPath, BaseEdge } from '@xyflow/react';

/**
 * AnimatedFlowEdge
 * Bezier curve with flowing dots (like packet flow).
 * Color and speed reflect risk level.
 */
export function AnimatedFlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
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
  const riskLevel = (data as { riskLevel?: string } | undefined)?.riskLevel || 'bajo';

  const particleCount = riskLevel === 'critico' ? 4 : riskLevel === 'alto' ? 3 : 2;
  const duration = riskLevel === 'critico' ? '1.5s' : riskLevel === 'alto' ? '2s' : '3s';

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          stroke,
          strokeWidth: 2,
          opacity: 0.4,
        }}
      />
      {Array.from({ length: particleCount }).map((_, i) => (
        <circle key={i} r="3" fill={stroke} opacity="0.9">
          <animateMotion
            dur={duration}
            repeatCount="indefinite"
            begin={`${(i * parseFloat(duration)) / particleCount}s`}
            path={edgePath}
          />
        </circle>
      ))}
    </>
  );
}
