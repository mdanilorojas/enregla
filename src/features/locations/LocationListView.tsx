import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { calculateCompliancePercentage, countCriticalIssues } from '@/lib/risk';
import { STAGE_LABELS, PERMIT_TYPE_LABELS } from '@/types';
import type { RiskLevel, PermitStatus } from '@/types';
import { ArrowUpRight, AlertTriangle, Clock, ListChecks, Map, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDateRelative } from '@/lib/dates';
import { NetworkMapView } from '@/features/network/NetworkMapView';

const riskAccent: Record<RiskLevel, string> = {
  critico: 'border-t-red-500',
  alto: 'border-t-orange-500',
  medio: 'border-t-amber-400',
  bajo: 'border-t-emerald-500',
};

const riskDot: Record<RiskLevel, string> = {
  critico: 'bg-red-500 shadow-red-500/40',
  alto: 'bg-orange-500 shadow-orange-500/40',
  medio: 'bg-amber-400 shadow-amber-400/40',
  bajo: 'bg-emerald-500 shadow-emerald-500/40',
};

const permitDot: Record<PermitStatus, string> = {
  vigente: 'bg-emerald-400',
  por_vencer: 'bg-amber-400',
  vencido: 'bg-red-400',
  no_registrado: 'bg-gray-200',
};

const complianceColor = (pct: number) =>
  pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500';

export function LocationListView() {
  const navigate = useNavigate();
  const { locations, permits, renewals, tasks } = useAppStore();
  const [showMap, setShowMap] = useState(true);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Sedes</h2>
        <p className="text-[13px] text-gray-500 mt-1">
          {locations.length} {locations.length === 1 ? 'local registrado' : 'locales registrados'}
        </p>
      </div>

      {/* Network Map */}
      <div className="mb-6">
        <button
          onClick={() => setShowMap(!showMap)}
          className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <Map size={16} />
          <span>Mapa de red</span>
          {showMap ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showMap && (
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
            <div className="h-[500px] relative">
              <NetworkMapView embedded />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {locations.map((loc) => {
          const locPermits = permits.filter((p) => p.locationId === loc.id);
          const compliance = calculateCompliancePercentage(locPermits);
          const critical = countCriticalIssues(locPermits);
          const vigentes = locPermits.filter((p) => p.status === 'vigente').length;

          const nextRenewal = renewals
            .filter((r) => r.locationId === loc.id && (r.status === 'pendiente' || r.status === 'en_proceso'))
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

          const pendingTasks = tasks.filter(
            (t) => t.locationId === loc.id && t.status !== 'completada',
          ).length;

          return (
            <div
              key={loc.id}
              onClick={() => navigate(`/sedes/${loc.id}`)}
              role="button"
              tabIndex={0}
              className={`group relative bg-white rounded-2xl border border-gray-200/60 border-t-[2.5px] ${riskAccent[loc.riskLevel]} shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] cursor-pointer hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.1)] hover:border-gray-200 hover:-translate-y-0.5 transition-all duration-200`}
            >
              {/* Header */}
              <div className="px-5 pt-5 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 shadow-sm ${riskDot[loc.riskLevel]}`} />
                      <h3 className="text-[15px] font-semibold text-gray-900 truncate leading-tight">
                        {loc.name}
                      </h3>
                    </div>
                    <p className="text-[12px] text-gray-400 mt-1 pl-4 truncate">{loc.address}</p>
                  </div>
                  <ArrowUpRight
                    size={16}
                    className="text-gray-300 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>

                {/* Permit dots */}
                <div className="flex items-center gap-1.5 mt-4 pl-4">
                  {locPermits.map((p) => (
                    <div
                      key={p.id}
                      title={`${PERMIT_TYPE_LABELS[p.type]} — ${p.status}`}
                      className={`w-[10px] h-[10px] rounded-[3px] ${permitDot[p.status]} transition-transform group-hover:scale-110`}
                    />
                  ))}
                  <span className="text-[11px] text-gray-400 ml-2 tabular-nums">
                    {vigentes}/{locPermits.length}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100 mx-5" />

              {/* Footer metadata */}
              <div className="px-5 py-3 flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-50 text-[11px] font-medium text-gray-500 leading-tight">
                  {STAGE_LABELS[loc.stage]}
                </span>

                <span className={`text-[12px] font-semibold tabular-nums ${complianceColor(compliance)}`}>
                  {compliance}%
                </span>

                {critical > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-red-500">
                    <AlertTriangle size={11} />
                    {critical}
                  </span>
                )}

                <div className="flex-1" />

                {pendingTasks > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                    <ListChecks size={12} />
                    {pendingTasks}
                  </span>
                )}

                {nextRenewal && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                    <Clock size={12} />
                    {formatDateRelative(nextRenewal.dueDate)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
