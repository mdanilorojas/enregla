import { Background, BackgroundVariant } from '@xyflow/react';

/**
 * AuroraBackground
 * Moving colored blobs behind a subtle grid. More modern/editorial.
 */
export function AuroraBackground() {
  return (
    <>
      <div className="absolute inset-0 overflow-hidden pointer-events-none bg-[#F8FAFC]">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-blue-400/20 blur-[120px] animate-aurora-1" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full bg-indigo-400/15 blur-[120px] animate-aurora-2" />
        <div className="absolute bottom-0 left-1/3 w-[450px] h-[450px] rounded-full bg-cyan-400/15 blur-[120px] animate-aurora-3" />
      </div>
      <Background
        variant={BackgroundVariant.Dots}
        color="#64748B"
        gap={32}
        size={1}
        className="opacity-20"
      />
      <style>{`
        @keyframes aurora-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(60px, 40px) scale(1.1); }
        }
        @keyframes aurora-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-40px, 30px) scale(1.15); }
        }
        @keyframes aurora-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -50px) scale(0.95); }
        }
        .animate-aurora-1 { animation: aurora-1 20s ease-in-out infinite; }
        .animate-aurora-2 { animation: aurora-2 25s ease-in-out infinite; }
        .animate-aurora-3 { animation: aurora-3 22s ease-in-out infinite; }
      `}</style>
    </>
  );
}
