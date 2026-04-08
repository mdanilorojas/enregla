import type { RiskLevel } from '@/types';
import { RISK_LABELS } from '@/types';
import { ComplianceGauge, Card } from '@/components/ui';
import { AlertTriangle, MapPin, FileCheck, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  risk: RiskLevel;
  compliance: number;
  criticalCount: number;
  totalLocations: number;
  totalPermits: number;
}

const riskConfig: Record<RiskLevel, { bg: string; text: string; border: string; icon: string; glow: string }> = {
  critico: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200/60', icon: 'bg-red-100 text-red-600', glow: 'shadow-red-500/10' },
  alto: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200/60', icon: 'bg-orange-100 text-orange-600', glow: 'shadow-orange-500/10' },
  medio: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/60', icon: 'bg-amber-100 text-amber-700', glow: 'shadow-amber-500/10' },
  bajo: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200/60', icon: 'bg-emerald-100 text-emerald-600', glow: 'shadow-emerald-500/10' },
};

export function RiskOverview({ risk, compliance, criticalCount, totalLocations, totalPermits }: Props) {
  const rc = riskConfig[risk];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Compliance Gauge */}
      <Card className="flex flex-col items-center justify-center !py-8 opacity-0 animate-slide-up animate-slide-up-1" glow>
        <ComplianceGauge percentage={compliance} size={130} strokeWidth={8} />
        <span className="text-[13px] text-gray-500 font-medium mt-2">Cumplimiento general</span>
      </Card>

      {/* Risk Level */}
      <Card padding="lg" className={`opacity-0 animate-slide-up animate-slide-up-2 border ${rc.border} ${rc.bg}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl ${rc.icon} flex items-center justify-center shadow-sm ${rc.glow}`}>
            <AlertTriangle size={18} strokeWidth={1.8} />
          </div>
          <p className="text-[13px] text-gray-500 font-medium">Riesgo operativo</p>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className={`text-2xl font-bold tracking-tight ${rc.text}`}>
            {RISK_LABELS[risk]}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-3">
          {risk === 'bajo' ? (
            <TrendingDown size={13} className="text-emerald-500" />
          ) : risk === 'critico' ? (
            <TrendingUp size={13} className="text-red-500" />
          ) : (
            <Minus size={13} className="text-gray-400" />
          )}
          <span className={`text-[12px] font-medium ${
            risk === 'bajo' ? 'text-emerald-500' : risk === 'critico' ? 'text-red-500' : 'text-gray-400'
          }`}>
            {risk === 'bajo' ? 'Bien controlado' : risk === 'critico' ? 'Acción inmediata' : 'Bajo control'}
          </span>
        </div>
      </Card>

      {/* Critical Issues */}
      <Card padding="lg" className="opacity-0 animate-slide-up animate-slide-up-3">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
            criticalCount > 0 ? 'bg-red-100 text-red-600 shadow-red-500/10' : 'bg-emerald-100 text-emerald-600 shadow-emerald-500/10'
          }`}>
            <AlertTriangle size={18} strokeWidth={1.8} />
          </div>
          <p className="text-[13px] text-gray-500 font-medium">Problemas críticos</p>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-4xl font-bold tracking-tight ${
            criticalCount > 0 ? 'text-red-500' : 'text-emerald-500'
          }`}>
            {criticalCount}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-3">
          {criticalCount > 0 ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[12px] text-red-500 font-medium">Permisos vencidos o faltantes</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[12px] text-emerald-500 font-medium">Todo en orden</span>
            </>
          )}
        </div>
      </Card>

      {/* Totals */}
      <Card padding="lg" className="opacity-0 animate-slide-up animate-slide-up-4">
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shadow-sm shadow-violet-500/10">
                <MapPin size={18} strokeWidth={1.8} />
              </div>
              <span className="text-[13px] text-gray-500 font-medium">Sedes</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-gray-900 tracking-tight">{totalLocations}</span>
              <span className="text-[12px] text-gray-400 font-medium">activas</span>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shadow-sm shadow-sky-500/10">
                <FileCheck size={18} strokeWidth={1.8} />
              </div>
              <span className="text-[13px] text-gray-500 font-medium">Permisos</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-gray-900 tracking-tight">{totalPermits}</span>
              <span className="text-[12px] text-gray-400 font-medium">registrados</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
