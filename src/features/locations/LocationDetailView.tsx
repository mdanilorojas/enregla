import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLocation } from '@/hooks/useLocations';
import { usePermits } from '@/hooks/usePermits';
import { usePublicLink } from '@/hooks/usePublicLink';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, Badge, EmptyState, GlassNotification } from '@/components/ui';
import { PermitsTable } from './PermitsTable';
import { PublicLinkBanner } from './PublicLinkBanner';
import { RenewPermitModal } from '@/features/permits/RenewPermitModal';
import { GeneratePublicLinkModal } from '@/features/publicLinks/GeneratePublicLinkModal';
import { PublicLinkSuccessModal } from '@/features/publicLinks/PublicLinkSuccessModal';
import { RISK_LABELS } from '@/types';
import { formatDate, daysUntil } from '@/lib/dates';
import { ArrowLeft, MapPin, Building2, AlertCircle, CalendarCheck, Clock, Link2 } from 'lucide-react';
import type { Permit, PublicLink } from '@/types/database';

const LOCATION_STATUS_LABELS = {
  operando: 'Operando',
  en_preparacion: 'En preparación',
  cerrado: 'Cerrado',
};

const LOCATION_STATUS_COLORS = {
  operando: 'bg-emerald-100 text-emerald-800 ring-emerald-600/30',
  en_preparacion: 'bg-blue-100 text-blue-800 ring-blue-600/30',
  cerrado: 'bg-gray-100 text-gray-700 ring-gray-500/30',
};

export function LocationDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canRenew, canGeneratePublicLink } = usePermissions();
  const { location, loading: loadingLocation } = useLocation(id);
  const { permits, loading: loadingPermits, refetch: refetchPermits } = usePermits({ locationId: id });
  const { link: publicLink, refetch: refetchPublicLink } = usePublicLink(id);
  const [renewingPermit, setRenewingPermit] = useState<Permit | null>(null);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [showGenerateLinkModal, setShowGenerateLinkModal] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<PublicLink | null>(null);

  // Calculate summary metrics
  const summary = useMemo(() => {
    const vigentes = permits.filter((p) => p.status === 'vigente' && p.is_active).length;
    const porVencer = permits.filter((p) => p.status === 'por_vencer' && p.is_active).length;

    const activePermitsWithExpiry = permits
      .filter((p) => p.is_active && p.expiry_date)
      .sort((a, b) => {
        if (!a.expiry_date || !b.expiry_date) return 0;
        return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
      });

    const nextExpiry = activePermitsWithExpiry.length > 0 ? activePermitsWithExpiry[0].expiry_date : null;

    return { vigentes, porVencer, nextExpiry };
  }, [permits]);

  const handleRenew = (permitId: string) => {
    const permit = permits.find((p) => p.id === permitId);
    if (permit) {
      setRenewingPermit(permit);
    }
  };

  const handleRenewalSuccess = () => {
    setRenewingPermit(null);
    setShowSuccessNotification(true);
    refetchPermits();

    // Hide notification after 3 seconds
    setTimeout(() => {
      setShowSuccessNotification(false);
    }, 3000);
  };

  const handleLinkGenerated = (link: PublicLink) => {
    setGeneratedLink(link);
    setShowGenerateLinkModal(false);
    refetchPublicLink(); // Refresh banner
  };

  const handleLinkDeactivated = () => {
    refetchPublicLink(); // Hide banner after deactivation
  };

  // Loading state
  if (loadingLocation || loadingPermits) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-24 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-24 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-96 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  // Location not found
  if (!location) {
    return (
      <EmptyState
        message="Sede no encontrada."
        action="Volver al Dashboard"
        onAction={() => navigate('/')}
      />
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium"
        >
          <ArrowLeft size={16} />
          Volver al Dashboard
        </button>

      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-50 to-violet-100 border border-violet-200/60 flex items-center justify-center shadow-sm">
              <Building2 size={20} className="text-violet-600" strokeWidth={1.8} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{location.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <MapPin size={14} className="text-gray-400" />
                <span className="text-sm text-gray-500">{location.address}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
              LOCATION_STATUS_COLORS[location.status]
            }`}
          >
            {LOCATION_STATUS_LABELS[location.status]}
          </span>
          <Badge variant="risk" risk={location.risk_level}>
            {RISK_LABELS[location.risk_level]}
          </Badge>

          {canGeneratePublicLink && (
            <button
              onClick={() => setShowGenerateLinkModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
            >
              <Link2 size={16} />
              Generar Link
            </button>
          )}
        </div>
      </div>

      {/* Public Link Banner */}
      {publicLink && (
        <PublicLinkBanner
          link={publicLink}
          onLinkDeactivated={handleLinkDeactivated}
        />
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
            <CalendarCheck size={20} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Permisos Vigentes</p>
            <p className="text-2xl font-bold text-gray-900">{summary.vigentes}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
            <AlertCircle size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Por Vencer</p>
            <p className="text-2xl font-bold text-gray-900">{summary.porVencer}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
            <Clock size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Próximo Vencimiento</p>
            {summary.nextExpiry ? (
              <p className={`text-lg font-bold ${
                daysUntil(summary.nextExpiry) <= 15 ? 'text-red-600' :
                daysUntil(summary.nextExpiry) <= 30 ? 'text-amber-600' :
                'text-gray-900'
              }`}>
                {formatDate(summary.nextExpiry)}
              </p>
            ) : (
              <p className="text-lg font-semibold text-gray-400">Ninguno</p>
            )}
          </div>
        </Card>
      </div>

      {/* Permits Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Permisos</h2>
          {permits.length > 0 && (
            <span className="text-sm text-gray-500">
              {permits.length} {permits.length === 1 ? 'permiso' : 'permisos'}
            </span>
          )}
        </div>
        <PermitsTable permits={permits} onRenew={canRenew ? handleRenew : undefined} />
      </div>
    </div>

    {/* Renewal Modal */}
    {renewingPermit && (
      <RenewPermitModal
        permit={renewingPermit}
        onClose={() => setRenewingPermit(null)}
        onSuccess={handleRenewalSuccess}
      />
    )}

      {/* Generate Public Link Modal */}
      {location && (
        <GeneratePublicLinkModal
          companyId={location.company_id}
          locationId={location.id}
          locationName={location.name}
          isOpen={showGenerateLinkModal}
          onClose={() => setShowGenerateLinkModal(false)}
          onSuccess={handleLinkGenerated}
        />
      )}

      {/* Public Link Success Modal */}
      <PublicLinkSuccessModal
        link={generatedLink}
        isOpen={!!generatedLink}
        onClose={() => setGeneratedLink(null)}
      />

    {/* Success Notification */}
    {showSuccessNotification && (
      <div className="fixed top-4 right-4 z-50">
        <GlassNotification
          type="success"
          title="Éxito"
          message="Permiso renovado exitosamente"
          onClose={() => setShowSuccessNotification(false)}
        />
      </div>
    )}
    </>
  );
}
