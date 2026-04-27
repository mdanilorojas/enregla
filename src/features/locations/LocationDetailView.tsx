import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Share2 } from 'lucide-react';
import { useLocations } from '@/hooks/useLocations';
import { usePermits } from '@/hooks/usePermits';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PermitCardsGrid } from './PermitCardsGrid';
import { PublicLinkBanner } from './PublicLinkBanner';
import { RenewPermitModal } from './RenewPermitModal';
import { ShareLocationModal } from '@/features/public-links/ShareLocationModal';
import type { Permit } from '@/types/database';

export function LocationDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { companyId } = useAuth();
  const { locations, loading: loadingLocations } = useLocations(companyId);
  const { permits, loading: loadingPermits, updatePermit, refetch } = usePermits({ companyId, locationId: id });

  const [selectedPermit, setSelectedPermit] = useState<Permit | null>(null);
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const location = useMemo(() => {
    return locations.find(loc => loc.id === id);
  }, [locations, id]);

  const locationPermits = useMemo(() => {
    return permits.filter(p => p.location_id === id && p.is_active);
  }, [permits, id]);

  const stats = useMemo(() => {
    const vigentes = locationPermits.filter(p => p.status === 'vigente').length;
    const total = locationPermits.length;
    const compliance = total > 0 ? Math.round((vigentes / total) * 100) : 0;

    return { vigentes, total, compliance };
  }, [locationPermits]);


  if (loadingLocations || loadingPermits) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-8" />
          <div className="h-48 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto text-center py-12">
          <h2 className="text-2xl font-semibold text-text mb-2">Sede no encontrada</h2>
          <Button onClick={() => navigate('/sedes')}>
            Volver a sedes
          </Button>
        </div>
      </div>
    );
  }

  const handleViewPermitDetails = (permitId: string) => {
    navigate(`/permisos/${permitId}`);
  };

  const handleConfirmRenewal = async (permitId: string, newExpiryDate: string) => {
    await updatePermit(permitId, {
      expiry_date: newExpiryDate,
      status: 'vigente',
    });
  };

  const handleGeneratePublicLink = () => {
    // TODO: Implement in Milestone 4
  };

  const handleViewPublicLink = () => {
    // TODO: Implement in Milestone 4
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al dashboard
        </Button>

        {/* Location header */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-8">
              {/* Columna izquierda: Información de la sede */}
              <div className="space-y-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{location.name}</h1>
                  <p className="text-sm text-text-secondary mb-4">{location.address}</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-text-secondary mb-1">Estado</p>
                    <p className="text-sm font-semibold capitalize">{location.status}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary mb-1">Nivel de Riesgo</p>
                    <p className="text-sm font-semibold capitalize">{location.risk_level}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary mb-1">Permisos Vigentes</p>
                    <p className="text-sm font-semibold">{stats.vigentes} de {stats.total}</p>
                  </div>
                </div>
              </div>

              {/* Columna derecha: Cumplimiento y QR */}
              <div className="space-y-6 flex flex-col items-end">
                <div className="w-full flex justify-end">
                  <Badge color={stats.compliance >= 80 ? 'green' : stats.compliance >= 60 ? 'yellow' : 'red'}>
                    {stats.compliance}% Cumplimiento
                  </Badge>
                </div>

                <div className="w-full">
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        Genera un QR público
                      </h3>
                      <p className="text-xs text-text-secondary">
                        Permite que terceros verifiquen estados de permisos
                      </p>
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setShareModalOpen(true)}
                      className="w-full"
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Generar QR
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Permits cards grid */}
        <Card>
          <CardHeader>
            <CardTitle>Permisos de la Sede</CardTitle>
          </CardHeader>
          <CardContent>
            <PermitCardsGrid
              permits={locationPermits}
              onViewDetails={handleViewPermitDetails}
              onPermitChange={refetch}
            />
          </CardContent>
        </Card>

        {/* Renew modal */}
        <RenewPermitModal
          permit={selectedPermit}
          open={renewModalOpen}
          onClose={() => {
            setRenewModalOpen(false);
            setSelectedPermit(null);
          }}
          onConfirm={handleConfirmRenewal}
        />

        {/* Share modal */}
        <ShareLocationModal
          locationId={location.id}
          locationName={location.name}
          locationAddress={location.address}
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
        />
      </div>
    </div>
  );
}
