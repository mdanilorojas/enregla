import { Background, BackgroundVariant } from '@xyflow/react';

/**
 * CleanGridBackground
 * Simple but polished grid. Corporate default.
 */
export function CleanGridBackground() {
  return (
    <>
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white via-gray-50 to-blue-50/30" />
      <Background
        variant={BackgroundVariant.Lines}
        color="#E2E8F0"
        gap={40}
        className="opacity-60"
      />
    </>
  );
}
