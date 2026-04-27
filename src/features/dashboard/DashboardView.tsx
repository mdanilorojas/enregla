import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLocations } from '@/hooks/useLocations';
import { usePermits } from '@/hooks/usePermits';
import { calculateDashboardMetrics } from '@/lib/dashboard-metrics';
import { RiskOverviewCard } from './RiskOverviewCard';
import { MetricsGrid } from './MetricsGrid';
import { SedeCard } from './SedeCard';
import { CreateLocationModal } from '@/features/locations/CreateLocationModal';
import { MapPin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DashboardView() {
  const navigate = useNavigate();
  const { companyId } = useAuth();
  const { locations, loading: loadingLocations, error: locationsError, refetch } = useLocations(companyId);
  const { permits, loading: loadingPermits, error: permitsError } = usePermits({ companyId });
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  // Calculate dashboard metrics using centralized function
  const metrics = useMemo(() => {
    return calculateDashboardMetrics(permits, locations);
  }, [permits, locations]);

  // Calculate permit counts per location
  const locationPermitCounts = useMemo(() => {
    const counts: Record<string, { vigentes: number; total: number }> = {};

    console.log('[DashboardView] Calculating permit counts. Locations:', locations.length, 'Permits:', permits.length);

    locations.forEach(location => {
      const locationPermits = permits.filter(p => p.location_id === location.id && p.is_active);
      const vigentes = locationPermits.filter(p => p.status === 'vigente').length;

      console.log(`[DashboardView] Location ${location.name}:`, {
        locationId: location.id,
        totalPermits: locationPermits.length,
        vigentes,
        permits: locationPermits.map(p => ({ type: p.type, status: p.status, is_active: p.is_active }))
      });

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
              {locationsError || permitsError || 'Unable to load dashboard data. Please try again.'}
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
    <div className="min-h-screen bg-[var(--color-surface)] p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Risk Overview */}
        <RiskOverviewCard metrics={metrics} />

        {/* Sedes Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text)]">Sedes</h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                {locations.length} {locations.length === 1 ? 'sede registrada' : 'sedes registradas'}
              </p>
            </div>
          </div>

          {locations.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-white py-16 text-center">
              <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
                <div className="w-14 h-14 rounded-full bg-[var(--color-surface)] flex items-center justify-center">
                  <MapPin className="w-7 h-7 text-[var(--color-text-muted)]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[var(--color-text)] mb-1">
                    No hay sedes
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Comienza creando tu primera sede
                  </p>
                </div>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primera Sede
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {locations.map(location => (
                <SedeCard
                  key={location.id}
                  sede={location}
                  permitCounts={locationPermitCounts[location.id] || { vigentes: 0, total: 0 }}
                  onClick={() => navigate(`/sedes/${location.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Location Modal */}
      {companyId && (
        <CreateLocationModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={(locationId) => {
            refetch();
            navigate(`/sedes/${locationId}`);
          }}
          companyId={companyId}
        />
      )}
    </div>
  );
}
