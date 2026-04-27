import { Background, BackgroundVariant } from '@xyflow/react';

/**
 * GradientMeshBackground
 * Soft radial gradients layered with a fine dotted grid.
 */
export function GradientMeshBackground() {
  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59, 130, 246, 0.12), transparent), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(99, 102, 241, 0.08), transparent), radial-gradient(ellipse 50% 40% at 10% 80%, rgba(14, 165, 233, 0.06), transparent), linear-gradient(180deg, #F8FAFC 0%, #EFF6FF 100%)',
        }}
      />
      <Background
        variant={BackgroundVariant.Dots}
        color="#94A3B8"
        gap={28}
        size={1.2}
        className="opacity-30"
      />
    </>
  );
}
