import { type EdgeProps, getBezierPath, BaseEdge } from '@xyflow/react';

/**
 * GradientPulseEdge
 * Gradient line with soft pulsing opacity. Elegant and subtle.
 */
export function GradientPulseEdge({
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
  const gradientId = `gradient-${id}`;

  return (
    <>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.1" />
          <stop offset="50%" stopColor={stroke} stopOpacity="0.9" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0.3" />
          <animate
            attributeName="x1"
            values="-100%;100%"
            dur="3s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="x2"
            values="0%;200%"
            dur="3s"
            repeatCount="indefinite"
          />
        </linearGradient>
      </defs>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          stroke: `url(#${gradientId})`,
          strokeWidth: 3,
        }}
      />
    </>
  );
}
