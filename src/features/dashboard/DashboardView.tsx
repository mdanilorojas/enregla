import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/store';
import { calculateCompanyRisk, calculateCompliancePercentage, countCriticalIssues } from '@/lib/risk';
import { DashboardSkeleton } from './DashboardSkeleton';
import { LiveStatusIndicator } from './widgets/LiveStatusIndicator';
import { RiskOverview } from './widgets/RiskOverview';
import { ComplianceTrend } from './widgets/ComplianceTrend';
import { ExpirationCalendar } from './widgets/ExpirationCalendar';
import { QuickActions } from './widgets/QuickActions';
import { LocationGrid } from './widgets/LocationGrid';
import { ExportDashboard } from './widgets/ExportDashboard';
import { Activity } from 'lucide-react';

export function DashboardView() {
  const { locations, permits, renewals, company } = useAppStore();
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
    <div ref={dashboardRef} className="space-y-6" id="dashboard">
      {/* Compact header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-gray-900">
            {company?.name || 'Dashboard'}
          </h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-xs text-gray-500 capitalize">{formattedDate}</p>
            <LiveStatusIndicator />
          </div>
        </div>
        <div className="flex items-center gap-2 sm:shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs">
            <Activity size={14} className="text-gray-400 hidden sm:block" />
            <span className="text-gray-600 font-medium whitespace-nowrap">
              {permits.length} permisos · {locations.length} sedes
            </span>
          </div>
          <ExportDashboard dashboardRef={dashboardRef} />
        </div>
      </div>

      {/* Risk Overview */}
      <RiskOverview
        risk={companyRisk}
        compliance={compliancePct}
        criticalCount={criticalCount}
        totalLocations={locations.length}
        totalPermits={permits.length}
      />

      {/* Charts & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <ComplianceTrend currentCompliance={compliancePct} />
          <ExpirationCalendar renewals={renewals} />
        </div>
        <QuickActions permits={permits} locations={locations} renewals={renewals} />
      </div>

      {/* Location Grid */}
      <LocationGrid locations={locations} permits={permits} renewals={renewals} />
    </div>
  );
}
