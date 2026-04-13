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
          <h2 className="text-[24px] font-semibold text-[--color-legal-ink] tracking-tight">
            {profile?.full_name ? `Bienvenido, ${profile.full_name.split(' ')[0]}` : 'Dashboard'}
          </h2>
          <div className="flex items-center gap-2 mt-1.5">
            <p className="text-[13px] text-slate-500 capitalize font-medium">{formattedDate}</p>
            <span className="text-slate-300">·</span>
            <LiveStatusIndicator />
          </div>
        </div>
        <div className="flex items-center gap-3 sm:shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 px-4 py-2 rounded-full bg-white border border-slate-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] text-[13px]">
            <Activity size={14} className="text-slate-400 hidden sm:block" strokeWidth={2} />
            <span className="text-slate-700 font-medium whitespace-nowrap">
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

      {/* Charts & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <ComplianceTrend locations={locations} permits={permits} />
          <ExpirationCalendar renewals={upcomingRenewals} />
        </div>
        <QuickActions permits={permits} locations={locations} />
      </div>

      {/* Location Grid */}
      <LocationGrid locations={locations} permits={permits} />

      {/* Daily Insight - Moved to bottom toast style */}
      <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm">
        <DailyInsight compliancePercent={metrics.compliance} criticalCount={metrics.criticalCount} />
      </div>

    </div>
  );
}
