import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
  FileCheck,
  AlertTriangle,
  Clock,
  ShieldCheck,
  AlertCircle,
  Building2,
  ChevronRight,
} from 'lucide-react';
import type { PermitStatus, RiskLevel } from '@/types/database';
import { useState } from 'react';

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

const statusConfig: Record<PermitStatus, {
  label: string;
  dot: string;
  text: string;
  bg: string;
}> = {
  vigente: {
    label: 'Vigente',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
  },
  por_vencer: {
    label: 'Por vencer',
    dot: 'bg-amber-500',
    text: 'text-amber-700',
    bg: 'bg-amber-50',
  },
  vencido: {
    label: 'Vencido',
    dot: 'bg-red-500',
    text: 'text-red-700',
    bg: 'bg-red-50',
  },
  no_registrado: {
    label: 'Sin registro',
    dot: 'bg-gray-400',
    text: 'text-gray-600',
    bg: 'bg-gray-50',
  },
};

function riskStyle(riskLevel: RiskLevel) {
  switch (riskLevel) {
    case 'critico':
      return {
        accent: 'border-l-red-500',
        badge: 'bg-red-100 text-red-700 border-red-200',
        badgeLabel: 'CRÍTICO',
        glow: 'shadow-red-200/60',
        Icon: AlertCircle,
        iconColor: 'text-red-500',
      };
    case 'alto':
      return {
        accent: 'border-l-orange-500',
        badge: 'bg-orange-100 text-orange-700 border-orange-200',
        badgeLabel: 'ALTO',
        glow: 'shadow-orange-200/50',
        Icon: AlertTriangle,
        iconColor: 'text-orange-500',
      };
    case 'medio':
      return {
        accent: 'border-l-amber-500',
        badge: 'bg-amber-100 text-amber-700 border-amber-200',
        badgeLabel: 'MEDIO',
        glow: 'shadow-amber-200/40',
        Icon: Clock,
        iconColor: 'text-amber-500',
      };
    default:
      return {
        accent: 'border-l-emerald-500',
        badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        badgeLabel: 'ESTABLE',
        glow: 'shadow-emerald-200/30',
        Icon: ShieldCheck,
        iconColor: 'text-emerald-500',
      };
  }
}

export function PremiumLocationNode({ data }: NodeProps) {
  const { name, riskLevel, totalPermits, expiringSoon, expired, permits } = data as LocationData;
  const style = riskStyle(riskLevel);
  const [hovered, setHovered] = useState(false);
  const displayPermits = hovered ? permits : permits.slice(0, 3);

  const hasAlerts = riskLevel === 'critico' || riskLevel === 'alto';

  return (
    <>
      <Handle type="target" position={Position.Top} id="top" className="!opacity-0" />
      <Handle type="target" position={Position.Left} id="left" className="!opacity-0" />
      <Handle type="target" position={Position.Right} id="right" className="!opacity-0" />
      <Handle type="target" position={Position.Bottom} id="bottom" className="!opacity-0" />

      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`group relative w-[280px] rounded-2xl bg-white border border-gray-200 border-l-4 ${style.accent} shadow-lg ${style.glow} overflow-hidden transition-all duration-300 ${
          hovered ? 'scale-105 shadow-xl z-10' : ''
        }`}
      >
        {/* Critical pulse ring */}
        {hasAlerts && (
          <div className="absolute -inset-0.5 rounded-2xl pointer-events-none">
            <div
              className={`absolute inset-0 rounded-2xl ${
                riskLevel === 'critico' ? 'bg-red-400' : 'bg-orange-400'
              } opacity-20 blur-md animate-pulse-slow`}
            />
          </div>
        )}

        {/* Header */}
        <div className="relative px-4 py-3 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0 flex-1">
              <Building2 size={14} className="text-gray-400 mt-0.5 shrink-0" />
              <h4 className="text-sm font-bold text-gray-900 leading-tight truncate">{name}</h4>
            </div>
            <span
              className={`${style.badge} border text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0`}
            >
              {style.badgeLabel}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="relative px-4 py-3 flex items-center justify-between bg-white border-b border-gray-50">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-emerald-500" strokeWidth={2.5} />
            <span className="text-xs font-bold text-gray-900">{totalPermits - expired - expiringSoon}</span>
            <span className="text-[10px] text-gray-500">vigentes</span>
          </div>
          {expiringSoon > 0 && (
            <div className="flex items-center gap-1.5">
              <Clock size={13} className="text-amber-500" strokeWidth={2.5} />
              <span className="text-xs font-bold text-gray-900">{expiringSoon}</span>
            </div>
          )}
          {expired > 0 && (
            <div className="flex items-center gap-1.5">
              <AlertCircle size={13} className="text-red-500" strokeWidth={2.5} />
              <span className="text-xs font-bold text-red-700">{expired}</span>
            </div>
          )}
        </div>

        {/* Permit list */}
        <div className="relative px-3 py-2 bg-white">
          {displayPermits.length === 0 ? (
            <p className="text-xs text-gray-400 py-2 text-center italic">Sin permisos registrados</p>
          ) : (
            <div className="space-y-1">
              {displayPermits.map((permit) => {
                const cfg = statusConfig[permit.status];
                return (
                  <div
                    key={permit.id}
                    className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg ${cfg.bg} transition-colors`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} shrink-0`} />
                      <span className="text-[11px] text-gray-700 truncate font-medium">
                        {permit.type}
                      </span>
                    </div>
                    <span className={`text-[9px] font-bold ${cfg.text} uppercase tracking-wider shrink-0`}>
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {!hovered && permits.length > 3 && (
            <div className="flex items-center justify-center gap-1 mt-2 pt-2 border-t border-gray-100">
              <span className="text-[10px] text-gray-400 font-medium">
                +{permits.length - 3} más
              </span>
              <ChevronRight size={10} className="text-gray-400" />
            </div>
          )}
        </div>

        {/* Hover action hint */}
        <div className="relative px-4 py-2 bg-gradient-to-r from-gray-50 to-white border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Click para detalles
            </span>
            <ChevronRight size={12} className="text-gray-400" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.05; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2.5s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
