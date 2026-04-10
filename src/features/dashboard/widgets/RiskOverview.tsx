import type { RiskLevel } from '@/types';
import { RISK_LABELS } from '@/types';
import { Card } from '@/components/ui';
import { AlertTriangle, MapPin, TrendingDown } from 'lucide-react';

interface Props {
  risk: RiskLevel;
  compliance: number;
  criticalCount: number;
  totalLocations: number;
  totalPermits: number;
}

export function RiskOverview({ risk, compliance, criticalCount, totalLocations, totalPermits }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      {/* Compliance */}
      <Card padding="sm" className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-1">Cumplimiento</p>
          <p className="text-2xl font-bold text-gray-900">{compliance}%</p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
          compliance >= 80 ? 'bg-emerald-50 text-emerald-600' :
          compliance >= 50 ? 'bg-amber-50 text-amber-600' :
          'bg-red-50 text-red-600'
        }`}>
          <TrendingDown size={20} />
        </div>
      </Card>

      {/* Risk */}
      <Card padding="sm" className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-1">Riesgo</p>
          <p className={`text-lg font-bold ${
            risk === 'critico' ? 'text-red-600' :
            risk === 'alto' ? 'text-orange-600' :
            risk === 'medio' ? 'text-amber-600' :
            'text-emerald-600'
          }`}>
            {RISK_LABELS[risk]}
          </p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
          risk === 'critico' ? 'bg-red-50 text-red-600' :
          risk === 'alto' ? 'bg-orange-50 text-orange-600' :
          risk === 'medio' ? 'bg-amber-50 text-amber-600' :
          'bg-emerald-50 text-emerald-600'
        }`}>
          <AlertTriangle size={20} />
        </div>
      </Card>

      {/* Critical */}
      <Card padding="sm" className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-1">Críticos</p>
          <p className={`text-2xl font-bold ${criticalCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {criticalCount}
          </p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
          criticalCount > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
        }`}>
          <AlertTriangle size={20} />
        </div>
      </Card>

      {/* Locations */}
      <Card padding="sm" className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-1">Sedes</p>
          <p className="text-2xl font-bold text-gray-900">{totalLocations}</p>
          <p className="text-[10px] text-gray-500">{totalPermits} permisos</p>
        </div>
        <div className="w-12 h-12 rounded-lg bg-gray-50 text-gray-600 flex items-center justify-center">
          <MapPin size={20} />
        </div>
      </Card>
    </div>
  );
}
