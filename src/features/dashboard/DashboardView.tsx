import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/store';
import { calculateCompanyRisk, calculateCompliancePercentage, countCriticalIssues } from '@/lib/risk';
import { DashboardSkeleton } from './DashboardSkeleton';
import { DashboardHero } from './widgets/DashboardHero';
import { LiveStatusIndicator } from './widgets/LiveStatusIndicator';
import { RiskOverview } from './widgets/RiskOverview';
import { ComplianceTrend } from './widgets/ComplianceTrend';
import { ExpirationCalendar } from './widgets/ExpirationCalendar';
import { QuickActions } from './widgets/QuickActions';
import { DeadlineStrip } from './widgets/DeadlineStrip';
import { CriticalAlerts } from './widgets/CriticalAlerts';
import { LocationGrid } from './widgets/LocationGrid';
import { ActionQueue } from './widgets/ActionQueue';
import { ExportDashboard } from './widgets/ExportDashboard';
import { Activity } from 'lucide-react';

export function DashboardView() {
  const { locations, permits, renewals, tasks, company } = useAppStore();
  const [loading, setLoading] = useState(true);
  const dashboardRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div ref={dashboardRef} className="space-y-12" id="dashboard">
      {/* Welcome header with export */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <LiveStatusIndicator />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
            Hola, {company?.name || 'Empresa'}
          </h2>
          <p className="text-sm text-gray-500 mt-1.5 capitalize font-medium">{formattedDate}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2.5 px-5 py-3 rounded-xl bg-white border border-slate-200 shadow-sm">
            <Activity size={18} className="text-blue-500" />
            <span className="text-sm text-gray-700 font-medium">
              {permits.length} permisos · {locations.length} sedes
            </span>
          </div>
          <ExportDashboard dashboardRef={dashboardRef} />
        </div>
      </div>

      {/* Hero Section */}
      <DashboardHero
        compliance={compliancePct}
        activeAlerts={criticalCount}
        pendingTasks={tasks.filter(t => t.status === 'pendiente' || t.status === 'en_progreso').length}
      />

      {/* Risk Overview */}
      <RiskOverview
        risk={companyRisk}
        compliance={compliancePct}
        criticalCount={criticalCount}
        totalLocations={locations.length}
        totalPermits={permits.length}
      />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ComplianceTrend currentCompliance={compliancePct} />
        <ExpirationCalendar renewals={renewals} />
      </div>

      {/* Quick Actions & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <QuickActions permits={permits} locations={locations} renewals={renewals} />
        </div>
        <div className="lg:col-span-2 grid grid-cols-1 gap-8">
          <DeadlineStrip renewals={renewals} permits={permits} locations={locations} />
          <CriticalAlerts permits={permits} locations={locations} />
        </div>
      </div>

      {/* Location Grid */}
      <LocationGrid locations={locations} permits={permits} renewals={renewals} />

      {/* Action Queue */}
      <ActionQueue tasks={tasks} locations={locations} />
    </div>
  );
}
