import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Building2, ShieldAlert, CheckCircle2 } from 'lucide-react';

type CompanyData = {
  name: string;
  locationCount: number;
  criticalCount: number;
};

export function PremiumCompanyNode({ data }: NodeProps) {
  const { name, locationCount, criticalCount } = data as CompanyData;
  const hasCritical = criticalCount > 0;

  return (
    <>
      <Handle type="source" position={Position.Top} id="top" className="!opacity-0" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!opacity-0" />
      <Handle type="source" position={Position.Left} id="left" className="!opacity-0" />
      <Handle type="source" position={Position.Right} id="right" className="!opacity-0" />

      <div className="relative">
        {/* Pulse ring */}
        <div className="absolute inset-0 rounded-3xl bg-blue-500 opacity-20 animate-ping-slow" />

        <div className="relative w-[320px] rounded-3xl bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#1E40AF] shadow-2xl shadow-blue-900/30 border border-blue-400/30 overflow-hidden">
          {/* Inner glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl" />

          <div className="relative px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/20">
                <Building2 size={28} className="text-white" strokeWidth={2} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-blue-200 uppercase tracking-widest mb-0.5">
                  Empresa Matriz
                </p>
                <h3 className="text-lg font-bold text-white leading-tight truncate">
                  {name}
                </h3>
              </div>
            </div>

            {/* Stats bar */}
            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-300" strokeWidth={2.5} />
                <div>
                  <p className="text-xs font-bold text-white leading-none">{locationCount}</p>
                  <p className="text-[9px] text-blue-200 uppercase tracking-wider mt-0.5">Sedes</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ShieldAlert
                  size={14}
                  className={hasCritical ? 'text-red-300' : 'text-emerald-300'}
                  strokeWidth={2.5}
                />
                <div>
                  <p className="text-xs font-bold text-white leading-none">{criticalCount}</p>
                  <p className="text-[9px] text-blue-200 uppercase tracking-wider mt-0.5">En riesgo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ping-slow {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.05); opacity: 0.05; }
        }
        .animate-ping-slow {
          animation: ping-slow 3s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
