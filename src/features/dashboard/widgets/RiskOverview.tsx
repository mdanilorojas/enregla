import type { RiskLevel } from '@/types';
import { Card } from '@/components/ui';
import { MapPin, TrendingUp, AlertCircle, ShieldCheck } from 'lucide-react';

interface Props {
  risk: RiskLevel;
  compliance: number;
  criticalCount: number;
  totalLocations: number;
  totalPermits: number;
}

export function RiskOverview({ compliance, criticalCount, totalLocations, totalPermits }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Compliance */}
      <Card padding="md" className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
          compliance >= 80 ? 'bg-[#10B981]/10 text-[#059669]' :
          compliance >= 50 ? 'bg-amber-100/50 text-amber-600' :
          'bg-red-50 text-red-500'
        }`}>
          {compliance >= 80 ? <ShieldCheck size={24} /> : <TrendingUp size={24} />}
        </div>
        <div>
          <p className="text-[12px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Cumplimiento Global</p>
          <div className="flex items-baseline gap-2">
            <p className="text-[28px] font-semibold text-[--color-legal-ink] leading-none">{compliance}%</p>
          </div>
        </div>
      </Card>

      {/* Critical */}
      <Card padding="md" className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
          criticalCount > 0 ? 'bg-[#FF5A1F]/10 text-[#FF5A1F]' : 'bg-emerald-50 text-emerald-500'
        }`}>
          <AlertCircle size={24} />
        </div>
        <div>
          <p className="text-[12px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Atención Requerida</p>
          <div className="flex items-baseline gap-2">
            <p className="text-[28px] font-semibold text-[--color-legal-ink] leading-none">{criticalCount}</p>
            <span className="text-[13px] font-medium text-slate-500 ml-1">permisos críticos</span>
          </div>
        </div>
      </Card>

      {/* Locations */}
      <Card padding="md" className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 text-slate-500 flex items-center justify-center shrink-0">
          <MapPin size={24} />
        </div>
        <div>
          <p className="text-[12px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Sedes Activas</p>
          <div className="flex items-baseline gap-2">
            <p className="text-[28px] font-semibold text-[--color-legal-ink] leading-none">{totalLocations}</p>
            <span className="text-[13px] font-medium text-slate-500 ml-1">({totalPermits} docs)</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
