import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Building2 } from 'lucide-react';

type CompanyData = { name: string; locationCount: number };

export function CompanyNode({ data }: NodeProps) {
  const { name, locationCount } = data as CompanyData;

  return (
    <>
      <Handle type="source" position={Position.Top} className="!opacity-0 !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0 !w-3 !h-3" />
      <Handle type="source" position={Position.Left} className="!opacity-0 !w-3 !h-3" />
      <Handle type="source" position={Position.Right} className="!opacity-0 !w-3 !h-3" />

      <div className="px-5 py-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-xl shadow-blue-500/20 border border-blue-500/30 min-w-[180px] text-center cursor-grab active:cursor-grabbing">
        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-2.5">
          <Building2 size={18} className="text-white" strokeWidth={1.8} />
        </div>
        <p className="text-[14px] font-bold text-white tracking-tight">{name}</p>
        <p className="text-[11px] text-blue-200/70 font-medium mt-0.5">{locationCount} sedes</p>
      </div>
    </>
  );
}
