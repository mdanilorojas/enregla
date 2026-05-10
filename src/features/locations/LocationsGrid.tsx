import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLocations } from '@/hooks/useLocations';
import { usePermits } from '@/hooks/usePermits';
import { resolveCompanyId } from '@/lib/demo';
import { Building2 as BuildingIcon, Plus as PlusIcon } from '@/lib/lucide-icons';
import { LocationCardV2 } from './LocationCardV2';
import { Button } from '@/components/ui';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonList, Skeleton } from '@/components/ui/skeleton';
import { CreateLocationModal } from './CreateLocationModal';

export interface LocationsGridProps {
  /** When true, renders the standalone page chrome (title, count, container padding). Default: true. */
  standalone?: boolean;
}

/**
 * The grid of sede cards that powers both the /sedes page and the Dashboard.
 * Passing `standalone={false}` hides the page header + outer padding so it can
 * be embedded under other content (e.g. the Dashboard hero).
 */
export function LocationsGrid({ standalone = true }: LocationsGridProps) {
  const { profile } = useAuth();
  const companyId = resolveCompanyId(profile?.company_id) ?? undefined;

  const { locations, loading: loadingLocations, error: locationsError, refetch } = useLocations(companyId);
  const { permits, loading: loadingPermits, error: permitsError } = usePermits({ companyId });

  const loading = loadingLocations || loadingPermits;
  const error = locationsError || permitsError;
  const navigate = useNavigate();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const handleLocationCreated = (locationId: string) => {
    navigate(`/sedes/${locationId}`);
  };

  const wrapperClass = standalone
    ? 'min-h-screen bg-[var(--ds-neutral-50)] p-6 md:p-8'
    : '';
  const innerClass = standalone
    ? 'max-w-7xl mx-auto animate-fade-in'
    : '';

  if (loading) {
    return (
      <div className={wrapperClass}>
        <div className={`${innerClass} space-y-6`}>
          {standalone && (
            <div className="flex items-start justify-between mb-8">
              <div className="space-y-2">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          )}
          <SkeletonList count={6} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={standalone ? 'min-h-screen bg-background p-4 md:p-8' : ''}>
        <div className={innerClass}>
          <div className="text-center py-12">
            <p className="text-[var(--ds-red-600)] mb-4">Error al cargar sedes</p>
            <p className="text-sm text-[var(--ds-text-subtle)] mb-4">{error}</p>
            <Button onClick={() => refetch()}>Reintentar</Button>
          </div>
        </div>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className={wrapperClass}>
        <div className={innerClass}>
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

  const getLocationPermits = (locationId: string) => {
    return permits.filter(p => p.location_id === locationId && p.is_active);
  };

  return (
    <div className={wrapperClass}>
      <div className={innerClass}>
        {standalone && (
          <div className="flex items-start justify-between mb-8">
            <div className="space-y-1">
              <h1 id="sedes-heading" className="text-[var(--ds-font-size-600)] font-bold text-[var(--ds-text)] leading-tight">Sedes</h1>
              <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)]">
                {locations.length} {locations.length === 1 ? 'sede registrada' : 'sedes registradas'}
              </p>
            </div>
            <Button onClick={() => setCreateModalOpen(true)} size="lg">
              <PlusIcon className="w-4 h-4" />
              Crear Sede
            </Button>
          </div>
        )}

        <div
          role="region"
          aria-labelledby={standalone ? 'sedes-heading' : undefined}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {locations.map(location => (
            <LocationCardV2
              key={location.id}
              location={location}
              permits={getLocationPermits(location.id)}
            />
          ))}
        </div>

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
