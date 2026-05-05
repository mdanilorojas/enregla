import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLocations } from '@/hooks/useLocations';
import { usePermits } from '@/hooks/usePermits';
import { RiskOverviewCard } from './RiskOverviewCard';
import { MetricsGrid } from './MetricsGrid';
import { SedeCard } from './SedeCard';
import { CreateLocationModal } from '@/features/locations/CreateLocationModal';
import { SkeletonList, SkeletonCard } from '@/components/ui/skeleton';
import { MapPin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DashboardView() {
  const navigate = useNavigate();
  const { companyId } = useAuth();
  const { locations, loading: loadingLocations, error: locationsError, refetch } = useLocations(companyId);
  const { permits, loading: loadingPermits, error: permitsError } = usePermits({ companyId });
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Calculate dashboard metrics
  const metrics = useMemo(() => {
    if (!companyId || !permits.length) return { vigentes: 0, porVencer: 0, faltantes: 0, compliance: 0 };
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

    if (!locations.length || !permits.length) return counts;

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
      <div className="min-h-screen bg-[var(--color-surface)] p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
          <SkeletonCard lines={1} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
          </div>
          <SkeletonList count={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)] p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Risk Overview */}
        <RiskOverviewCard metrics={metrics} />

        {/* Metrics Grid */}
        <MetricsGrid metrics={metrics} />

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
            <div className="rounded-xl border-2 border-dashed border-[var(--color-border)] bg-white py-20 text-center transition-all hover:border-[var(--color-text-muted)]">
              <div className="flex flex-col items-center gap-5 max-w-md mx-auto px-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-border)] flex items-center justify-center shadow-[var(--shadow-sm)]">
                  <MapPin className="w-8 h-8 text-[var(--color-primary)]" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-[var(--color-text)]">
                    No hay sedes registradas
                  </h3>
                  <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)] leading-relaxed">
                    Comienza creando tu primera sede para gestionar permisos y cumplimiento normativo
                  </p>
                </div>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-2"
                  size="lg"
                >
                  <Plus className="w-4 h-4" />
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
