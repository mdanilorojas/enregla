import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLocations } from '@/hooks/useLocations';
import { usePermits } from '@/hooks/usePermits';
import { Building2, Plus } from 'lucide-react';
import { LocationCardV2 } from './LocationCardV2';
import { Card, CardContent, Button } from '@/components/ui';
import { CreateLocationModal } from './CreateLocationModal';

export function LocationsListViewV2() {
  const { profile } = useAuth();
  const companyId = profile?.company_id;

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
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-32 mb-2" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-64" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6 space-y-4">
                  <div className="h-6 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
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
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold">No hay sedes</h3>
            <p className="mt-2 text-sm text-gray-500">
              Comienza creando tu primera sede
            </p>
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="mt-6 bg-blue-900 hover:bg-blue-800"
            >
              <Plus size={16} />
              Crear Primera Sede
            </Button>
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
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sedes</h1>
            <p className="text-sm text-gray-500 mt-1">
              Gestión de sedes y ubicaciones de tu empresa
            </p>
          </div>
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="bg-blue-900 hover:bg-blue-800"
          >
            <Plus size={16} />
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
