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

// Risk level styling - Unify style
const riskConfig: Record<RiskLevel, { border: string; iconBg: string; iconColor: string; accentRing: string }> = {
  critico: {
    border: 'border-red-500/30',
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-400',
    accentRing: 'ring-1 ring-red-500/20',
  },
  alto: {
    border: 'border-orange-500/30',
    iconBg: 'bg-orange-500/10',
    iconColor: 'text-orange-400',
    accentRing: 'ring-1 ring-orange-500/20',
  },
  medio: {
    border: 'border-yellow-500/30',
    iconBg: 'bg-yellow-500/10',
    iconColor: 'text-yellow-400',
    accentRing: 'ring-1 ring-yellow-500/20',
  },
  bajo: {
    border: 'border-green-500/30',
    iconBg: 'bg-green-500/10',
    iconColor: 'text-green-400',
    accentRing: 'ring-1 ring-green-500/20',
  },
};

export function SedeNode({ data }: NodeProps) {
  const { name, address, riskLevel, compliance, critical, permitCount } = data as SedeData;
  const config = riskConfig[riskLevel];

  return (
    <>
      {/* Target handles */}
      <Handle type="target" position={Position.Top} id="top" className="!opacity-0 !w-3 !h-3" />
      <Handle type="target" position={Position.Bottom} id="bottom" className="!opacity-0 !w-3 !h-3" />
      <Handle type="target" position={Position.Left} id="left" className="!opacity-0 !w-3 !h-3" />
      <Handle type="target" position={Position.Right} id="right" className="!opacity-0 !w-3 !h-3" />

      {/* Source handles */}
      <Handle type="source" position={Position.Top} id="s-top" className="!opacity-0 !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} id="s-bottom" className="!opacity-0 !w-3 !h-3" />
      <Handle type="source" position={Position.Left} id="s-left" className="!opacity-0 !w-3 !h-3" />
      <Handle type="source" position={Position.Right} id="s-right" className="!opacity-0 !w-3 !h-3" />

      <div className={`w-[240px] bg-[#2a2a2a] rounded-xl border ${config.border} ${config.accentRing} cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:shadow-2xl hover:shadow-white/5`}>
        {/* Main content - horizontal layout like Unify */}
        <div className="px-4 py-3 flex items-start gap-3">
          {/* Icon - large and prominent */}
          <div className={`w-10 h-10 rounded-lg ${config.iconBg} flex items-center justify-center shrink-0`}>
            <MapPin size={20} className={config.iconColor} strokeWidth={2.5} />
          </div>

          {/* Text content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-white leading-tight mb-1 truncate">
              {name}
            </h4>
            <p className="text-xs text-gray-400 leading-tight truncate">
              {address}
            </p>
          </div>
        </div>

        {/* Footer badges - Unify style */}
        <div className="px-4 py-2.5 border-t border-white/5 flex items-center gap-2">
          {/* Compliance pill */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
            <span className="text-xs font-semibold text-blue-400 tabular-nums">
              {compliance}%
            </span>
          </div>

          {/* Permit count */}
          <span className="text-xs text-gray-500 font-medium">
            {permitCount} permisos
          </span>

          {/* Critical warning */}
          {critical > 0 && (
            <div className="ml-auto flex items-center gap-1 px-2 py-0.5 bg-red-500/10 rounded-full border border-red-500/20">
              <AlertTriangle size={10} className="text-red-400" strokeWidth={3} />
              <span className="text-xs font-bold text-red-400">{critical}</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
