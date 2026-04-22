import { Handle, Position, type NodeProps } from '@xyflow/react';
import { FileCheck, AlertCircle, Clock, FileX } from 'lucide-react';
import type { PermitStatus } from '@/types';

type PermitData = {
  label: string;
  status: PermitStatus;
  issuer: string;
};

// Status configuration - Unify dark style
const statusConfig: Record<PermitStatus, {
  icon: typeof FileCheck;
  iconBg: string;
  iconColor: string;
  border: string;
  pillBg: string;
  pillText: string;
  pillBorder: string;
  label: string;
}> = {
  vigente: {
    icon: FileCheck,
    iconBg: 'bg-green-500/10',
    iconColor: 'text-green-400',
    border: 'border-green-500/30',
    pillBg: 'bg-green-500/10',
    pillText: 'text-green-400',
    pillBorder: 'border-green-500/30',
    label: 'Vigente',
  },
  por_vencer: {
    icon: Clock,
    iconBg: 'bg-yellow-500/10',
    iconColor: 'text-yellow-400',
    border: 'border-yellow-500/30',
    pillBg: 'bg-yellow-500/10',
    pillText: 'text-yellow-400',
    pillBorder: 'border-yellow-500/30',
    label: 'Por vencer',
  },
  vencido: {
    icon: AlertCircle,
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-400',
    border: 'border-red-500/30',
    pillBg: 'bg-red-500/10',
    pillText: 'text-red-400',
    pillBorder: 'border-red-500/30',
    label: 'Vencido',
  },
  no_registrado: {
    icon: FileX,
    iconBg: 'bg-gray-500/10',
    iconColor: 'text-gray-400',
    border: 'border-gray-500/30',
    pillBg: 'bg-gray-500/10',
    pillText: 'text-gray-400',
    pillBorder: 'border-gray-500/30',
    label: 'Sin registrar',
  },
};

export function PermitNode({ data }: NodeProps) {
  const { label, status } = data as PermitData;
  const config = statusConfig[status];
  const Icon = config.icon;

  // Pulse for expired
  const pulseClass = status === 'vencido'
    ? 'animate-[pulse_2s_ease-in-out_infinite] motion-reduce:animate-none'
    : '';

  return (
    <>
      <Handle type="target" position={Position.Top} id="top" className="!opacity-0 !w-2 !h-2" />
      <Handle type="target" position={Position.Bottom} id="bottom" className="!opacity-0 !w-2 !h-2" />
      <Handle type="target" position={Position.Left} id="left" className="!opacity-0 !w-2 !h-2" />
      <Handle type="target" position={Position.Right} id="right" className="!opacity-0 !w-2 !h-2" />

      <div className={`
        w-[180px] bg-[#2a2a2a] rounded-lg border ${config.border} ring-1 ring-white/5
        cursor-pointer transition-all duration-200
        hover:scale-105 hover:shadow-xl hover:shadow-white/5
        ${pulseClass}
      `}>
        <div className="px-3 py-2.5 flex items-center gap-2.5">
          {/* Icon */}
          <div className={`w-8 h-8 rounded-md ${config.iconBg} flex items-center justify-center shrink-0`}>
            <Icon size={16} className={config.iconColor} strokeWidth={2.5} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white leading-tight truncate mb-1.5">
              {label}
            </p>

            {/* Status pill - Unify style */}
            <div className={`inline-flex items-center px-2 py-0.5 rounded-full border ${config.pillBg} ${config.pillBorder}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${config.pillText}`}>
                {config.label}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
