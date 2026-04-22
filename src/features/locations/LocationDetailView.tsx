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

  const handleRenewPermit = (permit: Permit) => {
    setSelectedPermit(permit);
    setRenewModalOpen(true);
  };

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

  const handleDocumentUpdated = () => {
    // Refetch permits to get updated document info
    refetch();
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
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl mb-1">{location.name}</CardTitle>
                  <p className="text-text-secondary">{location.address}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge color={stats.compliance >= 80 ? 'green' : stats.compliance >= 60 ? 'yellow' : 'red'}>
                  {stats.compliance}% Cumplimiento
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShareModalOpen(true)}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Compartir
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              <div>
                <p className="text-sm text-text-secondary">Estado</p>
                <p className="text-lg font-semibold capitalize">{location.status}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Nivel de Riesgo</p>
                <p className="text-lg font-semibold capitalize">{location.risk_level}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Permisos Vigentes</p>
                <p className="text-lg font-semibold">{stats.vigentes} de {stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Public link banner */}
        <PublicLinkBanner
          locationId={location.id}
          hasPublicLink={false}
          onGenerateLink={handleGeneratePublicLink}
          onViewLink={handleViewPublicLink}
        />

        {/* Permits cards grid */}
        <Card>
          <CardHeader>
            <CardTitle>Permisos de la Sede</CardTitle>
          </CardHeader>
          <CardContent>
            <PermitCardsGrid
              permits={locationPermits}
              onDocumentUpdated={handleDocumentUpdated}
              onViewDetails={handleViewPermitDetails}
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
