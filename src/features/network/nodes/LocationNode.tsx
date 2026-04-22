import { Handle, Position, type NodeProps } from '@xyflow/react';
import { FileCheck, AlertTriangle, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import type { PermitStatus, RiskLevel } from '@/types/database';
import { PERMIT_TYPE_LABELS } from '@/types/database';

interface PermitInfo {
  id: string;
  type: string;
  status: PermitStatus;
}

type LocationData = {
  name: string;
  isMain: boolean;
  riskLevel: RiskLevel;
  totalPermits: number;
  expiringSoon: number;
  expired: number;
  permits: PermitInfo[];
};

// Status config for permit pills
const statusConfig: Record<PermitStatus, {
  label: string;
  bg: string;
  text: string;
  border: string;
}> = {
  vigente: {
    label: 'VIGENTE',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  por_vencer: {
    label: 'POR VENCER',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  vencido: {
    label: 'VENCIDO',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
  no_registrado: {
    label: 'SIN REGISTRO',
    bg: 'bg-gray-50',
    text: 'text-gray-600',
    border: 'border-gray-200',
  },
};

// Header styling based on risk level
function getHeaderStyle(riskLevel: RiskLevel, isMain: boolean) {
  if (isMain) {
    return {
      headerBg: 'bg-[#1E3A8A]',
      headerText: 'text-white',
      subtitleText: 'text-blue-200',
      borderColor: 'border-blue-200',
      tagBg: 'bg-blue-100',
      tagText: 'text-blue-800',
      tagLabel: 'PRINCIPAL',
    };
  }

  switch (riskLevel) {
    case 'critico':
      return {
        headerBg: 'bg-red-50',
        headerText: 'text-red-900',
        subtitleText: 'text-red-600',
        borderColor: 'border-red-200',
        tagBg: 'bg-red-100',
        tagText: 'text-red-700',
        tagLabel: 'ALERTA',
      };
    case 'alto':
      return {
        headerBg: 'bg-orange-50',
        headerText: 'text-orange-900',
        subtitleText: 'text-orange-600',
        borderColor: 'border-orange-200',
        tagBg: 'bg-orange-100',
        tagText: 'text-orange-700',
        tagLabel: 'ALERTA',
      };
    case 'medio':
      return {
        headerBg: 'bg-amber-50',
        headerText: 'text-amber-900',
        subtitleText: 'text-amber-600',
        borderColor: 'border-amber-200',
        tagBg: 'bg-amber-100',
        tagText: 'text-amber-700',
        tagLabel: 'MEDIO',
      };
    default:
      return {
        headerBg: 'bg-white',
        headerText: 'text-gray-900',
        subtitleText: 'text-gray-500',
        borderColor: 'border-gray-200',
        tagBg: 'bg-gray-100',
        tagText: 'text-gray-600',
        tagLabel: 'NORMAL',
      };
  }
}

export function LocationNode({ data }: NodeProps) {
  const {
    name,
    isMain,
    riskLevel,
    totalPermits,
    expiringSoon,
    expired,
    permits,
  } = data as LocationData;

  const style = getHeaderStyle(riskLevel, isMain);
  const displayPermits = permits.slice(0, 3);

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!opacity-0 !w-3 !h-3"
      />

      <div
        className={`w-[280px] rounded-xl border ${style.borderColor} bg-white shadow-md overflow-hidden`}
      >
        {/* Header */}
        <div className={`${style.headerBg} px-4 py-3`}>
          <div className="flex items-center justify-between">
            <h4 className={`text-sm font-bold ${style.headerText} leading-tight`}>
              {name}
            </h4>
            <span
              className={`${style.tagBg} ${style.tagText} text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide`}
            >
              {style.tagLabel}
            </span>
          </div>
        </div>

        {/* Metrics row */}
        <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-100">
          {/* Total permits */}
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center">
              <ShieldCheck size={14} className="text-emerald-600" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-bold text-gray-900">{totalPermits}</span>
          </div>

          {/* Expiring soon */}
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-md bg-amber-50 flex items-center justify-center">
              <Clock size={14} className="text-amber-600" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-bold text-gray-900">{expiringSoon}</span>
          </div>

          {/* Expired */}
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-md bg-red-50 flex items-center justify-center">
              <AlertCircle size={14} className="text-red-600" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-bold text-gray-900">{expired}</span>
          </div>
        </div>

        {/* Permit list */}
        <div className="px-4 py-2">
          {displayPermits.length === 0 ? (
            <p className="text-xs text-gray-400 py-1">Sin permisos registrados</p>
          ) : (
            <div className="space-y-1.5">
              {displayPermits.map((permit) => {
                const config = statusConfig[permit.status];
                const StatusIcon = permit.status === 'vigente'
                  ? FileCheck
                  : permit.status === 'por_vencer'
                    ? Clock
                    : permit.status === 'vencido'
                      ? AlertTriangle
                      : AlertCircle;

                return (
                  <div
                    key={permit.id}
                    className="flex items-center justify-between py-1"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <StatusIcon
                        size={12}
                        className={config.text}
                        strokeWidth={2.5}
                      />
                      <span className="text-xs text-gray-700 truncate">
                        {PERMIT_TYPE_LABELS[permit.type] || permit.type}
                      </span>
                    </div>
                    <span
                      className={`${config.bg} ${config.text} ${config.border} border text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ml-2`}
                    >
                      {config.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {permits.length > 3 && (
            <p className="text-[10px] text-gray-400 mt-1 text-center">
              +{permits.length - 3} permisos mas
            </p>
          )}
        </div>
      </div>
    </>
  );
}
