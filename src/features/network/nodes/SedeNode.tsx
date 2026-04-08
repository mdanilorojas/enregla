import { Handle, Position, type NodeProps } from '@xyflow/react';
import { MapPin, AlertTriangle } from 'lucide-react';
import type { RiskLevel } from '@/types';

type SedeData = {
  name: string;
  address: string;
  riskLevel: RiskLevel;
  compliance: number;
  critical: number;
  permitCount: number;
};

const riskBorder: Record<RiskLevel, string> = {
  critico: 'border-red-300 shadow-red-500/15',
  alto: 'border-orange-300 shadow-orange-500/15',
  medio: 'border-amber-300 shadow-amber-400/10',
  bajo: 'border-emerald-300 shadow-emerald-500/10',
};

const riskDot: Record<RiskLevel, string> = {
  critico: 'bg-red-500',
  alto: 'bg-orange-500',
  medio: 'bg-amber-400',
  bajo: 'bg-emerald-500',
};

const complianceColor = (pct: number) =>
  pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500';

export function SedeNode({ data }: NodeProps) {
  const { name, address, riskLevel, compliance, critical, permitCount } = data as SedeData;

  return (
    <>
      <Handle type="target" position={Position.Top} className="!opacity-0 !w-3 !h-3" />
      <Handle type="target" position={Position.Bottom} className="!opacity-0 !w-3 !h-3" />
      <Handle type="target" position={Position.Left} className="!opacity-0 !w-3 !h-3" />
      <Handle type="target" position={Position.Right} className="!opacity-0 !w-3 !h-3" />
      <Handle type="source" position={Position.Top} className="!opacity-0 !w-3 !h-3" id="s-top" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0 !w-3 !h-3" id="s-bottom" />
      <Handle type="source" position={Position.Left} className="!opacity-0 !w-3 !h-3" id="s-left" />
      <Handle type="source" position={Position.Right} className="!opacity-0 !w-3 !h-3" id="s-right" />

      <div className={`bg-white rounded-2xl border-2 ${riskBorder[riskLevel]} shadow-lg min-w-[160px] max-w-[200px] cursor-pointer hover:scale-[1.03] transition-transform active:cursor-grabbing`}>
        <div className="px-4 pt-3.5 pb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${riskDot[riskLevel]}`} />
            <p className="text-[13px] font-bold text-gray-900 truncate leading-tight">{name}</p>
          </div>
          <div className="flex items-center gap-1 pl-[18px]">
            <MapPin size={10} className="text-gray-300 shrink-0" />
            <p className="text-[10px] text-gray-400 truncate">{address}</p>
          </div>
        </div>

        <div className="border-t border-gray-100 px-4 py-2 flex items-center gap-2">
          <span className={`text-[13px] font-bold tabular-nums ${complianceColor(compliance)}`}>
            {compliance}%
          </span>
          <span className="text-[10px] text-gray-400">{permitCount} permisos</span>
          <div className="flex-1" />
          {critical > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] font-semibold text-red-500">
              <AlertTriangle size={10} />
              {critical}
            </span>
          )}
        </div>
      </div>
    </>
  );
}
