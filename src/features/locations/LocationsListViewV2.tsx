import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLocations } from '@/hooks/useLocations';
import { usePermits } from '@/hooks/usePermits';
import { Building2, Plus } from 'lucide-react';
import { LocationCardV2 } from './LocationCardV2';
import { Card, CardContent, Button } from '@/components/ui';
import { SkeletonList, SkeletonCard } from '@/components/ui/skeleton';
import { CreateLocationModal } from './CreateLocationModal';

export function LocationsListViewV2() {
  const { profile } = useAuth();
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

  // In demo mode, hardcode the demo company ID
  const companyId = isDemoMode
    ? '50707999-f033-41c4-91c9-989966311972'
    : profile?.company_id;

  // console.log('[LocationsListViewV2] Profile:', profile);
  // console.log('[LocationsListViewV2] CompanyId:', companyId);
  // console.log('[LocationsListViewV2] Demo mode:', isDemoMode);

  const { locations, loading: loadingLocations, error: locationsError } = useLocations(companyId);
  const { permits, loading: loadingPermits, error: permitsError } = usePermits({ companyId });

  const loading = loadingLocations || loadingPermits;
  const navigate = useNavigate();

  // Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Handle successful location creation
  const handleLocationCreated = (locationId: string) => {
    navigate(`/sedes/${locationId}`);
  };
  const error = locationsError || permitsError;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
          <div className="flex items-start justify-between mb-8">
            <div className="space-y-2">
              <SkeletonCard lines={1} className="h-8 w-32" />
              <SkeletonCard lines={1} className="h-4 w-64" />
            </div>
          </div>
          <SkeletonList count={6} />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">Error al cargar sedes</p>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-gray-900 hover:bg-gray-800"
            >
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (locations.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-xl border-2 border-dashed border-[var(--color-border)] bg-white py-20 text-center transition-all hover:border-[var(--color-text-muted)]">
            <div className="flex flex-col items-center gap-5 max-w-md mx-auto px-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-border)] flex items-center justify-center shadow-[var(--shadow-sm)]">
                <Building2 className="w-8 h-8 text-[var(--color-primary)]" />
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
                onClick={() => setCreateModalOpen(true)}
                className="mt-2"
                size="lg"
                disabled={!companyId}
              >
                <Plus className="w-4 h-4" />
                Crear Primera Sede
              </Button>
              {!companyId && (
                <p className="text-[var(--font-size-xs)] text-[var(--color-danger)] mt-2">
                  Error: No se pudo cargar la información de la empresa
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state - filter permits for each location
  const getLocationPermits = (locationId: string) => {
    return permits.filter(p => p.location_id === locationId && p.is_active);
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface)] p-6 md:p-8">
      <div className="max-w-7xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="space-y-1">
            <h1 className="text-[var(--font-size-3xl)] font-bold text-[var(--color-text)] leading-tight">Sedes</h1>
            <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)]">
              {locations.length} {locations.length === 1 ? 'sede registrada' : 'sedes registradas'}
            </p>
          </div>
          <Button
            onClick={() => setCreateModalOpen(true)}
            size="lg"
          >
            <Plus className="w-4 h-4" />
            Crear Sede
          </Button>
        </div>

        {/* Grid of location cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {locations.map((location) => (
            <LocationCardV2
              key={location.id}
              location={location}
              permits={getLocationPermits(location.id)}
            />
          ))}
        </div>

        {/* Create location modal */}
        <CreateLocationModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={handleLocationCreated}
          companyId={companyId || ''}
        />
      </div>
    </div>
  );
}
