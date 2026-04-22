import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Building2 } from 'lucide-react';

type CompanyData = {
  name: string;
  locationCount: number;
  criticalCount: number;
};

export function CompanyNode({ data }: NodeProps) {
  const { name, locationCount, criticalCount } = data as CompanyData;

  const subtitle = criticalCount > 0
    ? `Gestion consolidada de ${criticalCount} ${criticalCount === 1 ? 'sede critica' : 'sedes criticas'}`
    : `${locationCount} ${locationCount === 1 ? 'sede registrada' : 'sedes registradas'}`;

  return (
    <>
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!opacity-0 !w-3 !h-3"
      />

      <div className="w-[320px] rounded-2xl bg-[#1E3A8A] shadow-lg border border-[#1E3A8A]/20">
        <div className="px-6 py-5 flex items-center gap-4">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Building2 size={24} className="text-white" strokeWidth={2} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-white leading-tight">
              {name}
            </h3>
            <p className="text-sm text-blue-200 mt-0.5 leading-tight">
              {subtitle}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
