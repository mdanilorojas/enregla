import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLocations } from '@/hooks/useLocations';
import { usePermits } from '@/hooks/usePermits';
import { Building2 as BuildingIcon, Plus as PlusIcon } from '@/lib/lucide-icons';
import { LocationCardV2 } from './LocationCardV2';
import { Button } from '@/components/ui';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonList, Skeleton } from '@/components/ui/skeleton';
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
      <div className="min-h-screen bg-[var(--ds-neutral-50)] p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
          <div className="flex items-start justify-between mb-8">
            <div className="space-y-2">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-64" />
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
            <p className="text-[var(--ds-red-600)] mb-4">Error al cargar sedes</p>
            <p className="text-sm text-[var(--ds-text-subtle)] mb-4">{error}</p>
            <Button
              onClick={() => window.location.reload()}
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
      <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-400)]">
        <div className="max-w-7xl mx-auto">
          <EmptyState
            icon={BuildingIcon}
            title="No hay sedes registradas"
            description="Comienza creando tu primera sede para gestionar permisos y cumplimiento normativo"
            action={
              <Button
                onClick={() => setCreateModalOpen(true)}
                disabled={!companyId}
                variant="default"
                size="lg"
              >
                <PlusIcon className="w-4 h-4" />
                Crear Primera Sede
              </Button>
            }
          />
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

  // Success state - filter permits for each location
  const getLocationPermits = (locationId: string) => {
    return permits.filter(p => p.location_id === locationId && p.is_active);
  };

  return (
    <div className="min-h-screen bg-[var(--ds-neutral-50)] p-6 md:p-8">
      <div className="max-w-7xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="space-y-1">
            <h1 id="sedes-heading" className="text-[var(--ds-font-size-600)] font-bold text-[var(--ds-text)] leading-tight">Sedes</h1>
            <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)]">
              {locations.length} {locations.length === 1 ? 'sede registrada' : 'sedes registradas'}
            </p>
          </div>
          <Button
            onClick={() => setCreateModalOpen(true)}
            size="lg"
          >
            <PlusIcon className="w-4 h-4" />
            Crear Sede
          </Button>
        </div>

        {/* Grid of location cards */}
        <div
          role="region"
          aria-labelledby="sedes-heading"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
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
