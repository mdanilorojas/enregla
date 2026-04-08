import { useAppStore } from '@/store';
import { calculateCompanyRisk, calculateCompliancePercentage, countCriticalIssues } from '@/lib/risk';
import { RiskOverview } from './widgets/RiskOverview';
import { DeadlineStrip } from './widgets/DeadlineStrip';
import { CriticalAlerts } from './widgets/CriticalAlerts';
import { LocationGrid } from './widgets/LocationGrid';
import { ActionQueue } from './widgets/ActionQueue';
import { Activity } from 'lucide-react';

export function DashboardView() {
  const { locations, permits, renewals, tasks, company } = useAppStore();
  const companyRisk = calculateCompanyRisk(locations);
  const compliancePct = calculateCompliancePercentage(permits);
  const criticalCount = countCriticalIssues(permits);

  const today = new Date();
  const formattedDate = today.toLocaleDateString('es-EC', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] text-emerald-600 font-semibold uppercase tracking-wider">Sistema activo</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            Hola, {company?.name || 'Empresa'}
          </h2>
          <p className="text-[13px] text-gray-400 mt-1 capitalize font-medium">{formattedDate}</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200/60 shadow-sm">
          <Activity size={14} className="text-blue-500" />
          <span className="text-[12px] text-gray-600 font-medium">
            {permits.length} permisos · {locations.length} sedes
          </span>
        </div>
      </div>

      <RiskOverview
        risk={companyRisk}
        compliance={compliancePct}
        criticalCount={criticalCount}
        totalLocations={locations.length}
        totalPermits={permits.length}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DeadlineStrip renewals={renewals} permits={permits} locations={locations} />
        <CriticalAlerts permits={permits} locations={locations} />
      </div>

      <LocationGrid locations={locations} permits={permits} renewals={renewals} />

      <ActionQueue tasks={tasks} locations={locations} />
    </div>
  );
}
