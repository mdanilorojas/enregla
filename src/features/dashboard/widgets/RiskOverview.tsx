import type { RiskLevel } from '@/types';
import { RISK_LABELS } from '@/types';
import { ProgressRing, Card } from '@/components/ui';
import { AlertTriangle, MapPin, FileCheck, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  risk: RiskLevel;
  compliance: number;
  criticalCount: number;
  totalLocations: number;
  totalPermits: number;
}

const riskConfig: Record<RiskLevel, { text: string; icon: string; glow: string }> = {
  critico: { text: 'text-red-600', icon: 'bg-red-100 text-red-600', glow: 'shadow-red-500/10' },
  alto: { text: 'text-orange-600', icon: 'bg-orange-100 text-orange-600', glow: 'shadow-orange-500/10' },
  medio: { text: 'text-amber-700', icon: 'bg-amber-100 text-amber-700', glow: 'shadow-amber-500/10' },
  bajo: { text: 'text-emerald-600', icon: 'bg-emerald-100 text-emerald-600', glow: 'shadow-emerald-500/10' },
};

export function RiskOverview({ risk, compliance, criticalCount, totalLocations, totalPermits }: Props) {
  const rc = riskConfig[risk];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Compliance Ring */}
      <Card className="flex flex-col items-center justify-center !py-8 opacity-0 animate-slide-up animate-slide-up-1 group hover:shadow-xl transition-shadow duration-300" glow>
        <ProgressRing percentage={compliance} size={120} strokeWidth={8} />
        <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold mt-3 group-hover:text-gray-700 transition-colors">
          Cumplimiento general
        </span>
      </Card>

      {/* Risk Level */}
      <Card
        padding="lg"
        className="opacity-0 animate-slide-up animate-slide-up-2"
        accent={risk === 'critico' ? 'red' : risk === 'alto' ? 'amber' : 'none'}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl ${rc.icon} flex items-center justify-center shadow-sm ${rc.glow}`}>
            <AlertTriangle size={18} strokeWidth={2} />
          </div>
          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Riesgo operativo</p>
        </div>
        <div className="mb-3">
          <span className={`text-4xl font-bold tracking-tight ${rc.text}`}>
            {RISK_LABELS[risk]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {risk === 'bajo' ? (
            <TrendingDown size={14} className="text-emerald-500" />
          ) : risk === 'critico' ? (
            <TrendingUp size={14} className="text-red-500" />
          ) : (
            <Minus size={14} className="text-gray-400" />
          )}
          <span className={`text-xs font-medium ${
            risk === 'bajo' ? 'text-emerald-600' : risk === 'critico' ? 'text-red-600' : 'text-gray-500'
          }`}>
            {risk === 'bajo' ? 'Bien controlado' : risk === 'critico' ? 'Acción inmediata' : 'Bajo control'}
          </span>
        </div>
      </Card>

      {/* Critical Issues */}
      <Card
        padding="lg"
        className="opacity-0 animate-slide-up animate-slide-up-3"
        accent={criticalCount > 0 ? 'red' : 'none'}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
            criticalCount > 0 ? 'bg-red-100 text-red-600 shadow-red-500/10' : 'bg-emerald-100 text-emerald-600 shadow-emerald-500/10'
          }`}>
            <AlertTriangle size={18} strokeWidth={2} />
          </div>
          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Problemas críticos</p>
        </div>
        <div className="mb-3">
          <span className={`text-6xl font-bold tracking-tight ${
            criticalCount > 0 ? 'text-red-600' : 'text-emerald-600'
          }`}>
            {criticalCount}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {criticalCount > 0 ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-red-600 font-medium">Permisos vencidos o faltantes</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-emerald-600 font-medium">Todo en orden</span>
            </>
          )}
        </div>
      </Card>

      {/* Totals */}
      <Card padding="lg" className="opacity-0 animate-slide-up animate-slide-up-4">
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center">
                <MapPin size={16} strokeWidth={2} />
              </div>
              <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Sedes</span>
            </div>
            <div className="flex items-baseline gap-2 ml-11">
              <span className="text-5xl font-bold text-gray-900 tracking-tight">{totalLocations}</span>
              <span className="text-xs text-gray-500 font-medium">activas</span>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-5">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <FileCheck size={16} strokeWidth={2} />
              </div>
              <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Permisos</span>
            </div>
            <div className="flex items-baseline gap-2 ml-11">
              <span className="text-5xl font-bold text-gray-900 tracking-tight">{totalPermits}</span>
              <span className="text-xs text-gray-500 font-medium">registrados</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
