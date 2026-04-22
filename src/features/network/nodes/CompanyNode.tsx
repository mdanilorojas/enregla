import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Building2 } from 'lucide-react';

type CompanyData = { name: string; locationCount: number };

export function CompanyNode({ data }: NodeProps) {
  const { name, locationCount } = data as CompanyData;

  return (
    <>
      <Handle type="source" position={Position.Top} id="top" className="!opacity-0 !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!opacity-0 !w-3 !h-3" />
      <Handle type="source" position={Position.Left} id="left" className="!opacity-0 !w-3 !h-3" />
      <Handle type="source" position={Position.Right} id="right" className="!opacity-0 !w-3 !h-3" />

      <div className="relative w-[280px] bg-gradient-to-br from-[#0066FF] to-[#0052CC] rounded-3xl shadow-2xl border-4 border-white cursor-grab active:cursor-grabbing transition-all duration-300 hover:scale-105 hover:shadow-[0_20px_60px_rgba(0,102,255,0.4)]">
        <div className="px-6 py-6 flex flex-col items-center gap-4">
          {/* Icon container - Grande y prominente */}
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-4 ring-white/30">
            <Building2 size={40} className="text-white drop-shadow-lg" strokeWidth={2.5} />
          </div>

          {/* Content */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-white leading-tight mb-2 drop-shadow-md">
              {name}
            </h3>

            {/* Badge - Branded */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg">
              <div className="w-2 h-2 rounded-full bg-[#0066FF] animate-pulse" />
              <span className="text-sm font-bold text-[#0052CC]">
                {locationCount} {locationCount === 1 ? 'SEDE' : 'SEDES'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
