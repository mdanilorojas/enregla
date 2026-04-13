import { useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocations } from '@/hooks/useLocations';
import { usePermits } from '@/hooks/usePermits';
import { calculateDashboardMetrics, getUpcomingRenewals } from '@/lib/dashboard-metrics';
import { DashboardSkeleton } from './DashboardSkeleton';
import { LiveStatusIndicator } from './widgets/LiveStatusIndicator';
import { RiskOverview } from './widgets/RiskOverview';
import { ComplianceTrend } from './widgets/ComplianceTrend';
import { ExpirationCalendar } from './widgets/ExpirationCalendar';
import { QuickActions } from './widgets/QuickActions';
import { LocationGrid } from './widgets/LocationGrid';
import { ExportDashboard } from './widgets/ExportDashboard';
import { DailyInsight } from './widgets/DailyInsight';
import { Activity, AlertTriangle } from 'lucide-react';

export function DashboardView() {
  const { companyId, profile } = useAuth();
  const { locations, loading: locationsLoading } = useLocations(companyId);
  const { permits, loading: permitsLoading } = usePermits({ companyId });
  const dashboardRef = useRef<HTMLDivElement | null>(null);

  const loading = locationsLoading || permitsLoading;

  // Calculate metrics from real data
  const metrics = calculateDashboardMetrics(permits, locations);
  const upcomingRenewals = getUpcomingRenewals(permits, locations, 5);

  const today = new Date();
  const formattedDate = today.toLocaleDateString('es-EC', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });


  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div ref={dashboardRef} className="space-y-6" id="dashboard">
      {/* Compact header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-gray-900">
            {profile?.full_name ? `Bienvenido, ${profile.full_name.split(' ')[0]}` : 'Dashboard'}
          </h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-xs text-gray-500 capitalize">{formattedDate}</p>
            <LiveStatusIndicator />
          </div>
        </div>
        <div className="flex items-center gap-2 sm:shrink-0">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#EA580C] text-white font-bold rounded-lg uppercase tracking-wide text-xs hover:bg-[#C2410C] border-2 border-transparent transition-colors shadow-sm">
            <AlertTriangle size={16} strokeWidth={2.5} />
            Auxilio en Inspección
          </button>
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white border-2 border-slate-200 text-xs shadow-sm">
            <Activity size={14} className="text-gray-400 hidden sm:block" strokeWidth={2.5} />
            <span className="text-gray-900 font-bold whitespace-nowrap">
              {permits.length} permisos · {locations.length} sedes
            </span>
          </div>
          <ExportDashboard dashboardRef={dashboardRef} />
        </div>
      </div>

      {/* Risk Overview */}
      <RiskOverview
        risk={metrics.companyRiskLevel}
        compliance={metrics.compliance}
        criticalCount={metrics.criticalCount}
        totalLocations={locations.length}
        totalPermits={permits.length}
      />

      {/* Daily Insight - Glass Effect */}
      <DailyInsight compliancePercent={metrics.compliance} criticalCount={metrics.criticalCount} />

      {/* Charts & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <ComplianceTrend currentCompliance={metrics.compliance} />
          <ExpirationCalendar renewals={upcomingRenewals} />
        </div>
        <QuickActions permits={permits} locations={locations} />
      </div>

      {/* Location Grid */}
      <LocationGrid locations={locations} permits={permits} />

    </div>
  );
}
