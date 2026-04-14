import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLocations } from '@/hooks/useLocations';
import { usePermits } from '@/hooks/usePermits';
import { RiskOverviewCard } from './RiskOverviewCard';
import { MetricsGrid } from './MetricsGrid';
import { SedeCard } from './SedeCard';

export function DashboardView() {
  const navigate = useNavigate();
  const { companyId } = useAuth();
  const { locations, loading: loadingLocations, error: locationsError } = useLocations(companyId);
  const { permits, loading: loadingPermits, error: permitsError } = usePermits({ companyId });

  // Guard: redirect or show message if no companyId
  if (!companyId) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-text mb-2">No Company Found</h2>
            <p className="text-text-secondary">Please complete your company setup to access the dashboard.</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate dashboard metrics
  const metrics = useMemo(() => {
    const vigentes = permits.filter(p => p.status === 'vigente' && p.is_active).length;
    const porVencer = permits.filter(p => p.status === 'por_vencer' && p.is_active).length;
    const faltantes = permits.filter(p => p.status === 'no_registrado' && p.is_active).length;
    const total = permits.filter(p => p.is_active).length;
    const compliance = total > 0 ? (vigentes / total) * 100 : 0;

    return { vigentes, porVencer, faltantes, compliance };
  }, [permits]);

  // Calculate permit counts per location
  const locationPermitCounts = useMemo(() => {
    const counts: Record<string, { vigentes: number; total: number }> = {};

    locations.forEach(location => {
      const locationPermits = permits.filter(p => p.location_id === location.id && p.is_active);
      const vigentes = locationPermits.filter(p => p.status === 'vigente').length;
      counts[location.id] = {
        vigentes,
        total: locationPermits.length,
      };
    });

    return counts;
  }, [locations, permits]);

  // Error state
  if (locationsError || permitsError) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-danger mb-2">Error Loading Dashboard</h2>
            <p className="text-text-secondary mb-4">
              {locationsError?.message || permitsError?.message || 'Unable to load dashboard data. Please try again.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loadingLocations || loadingPermits) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="h-48 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-3 gap-6">
            <div className="h-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold text-text">Dashboard</h1>
            <p className="text-text-secondary mt-1">Resumen general de cumplimiento</p>
          </div>

          {/* Risk Overview */}
          <RiskOverviewCard metrics={metrics} />

          {/* Metrics Grid */}
          <MetricsGrid metrics={metrics} />

          {/* Sedes Grid */}
          <div>
            <h2 className="text-2xl font-semibold text-text mb-4">Sedes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.map(location => (
                <SedeCard
                  key={location.id}
                  sede={location}
                  permitCounts={locationPermitCounts[location.id] || { vigentes: 0, total: 0 }}
                  onClick={() => navigate(`/sedes/${location.id}`)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
  );
}
