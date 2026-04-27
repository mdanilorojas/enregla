import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePermits } from '@/hooks/usePermits';
import { useLocations } from '@/hooks/useLocations';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatDateRelative, daysUntil } from '@/lib/dates';
import { DEMO_COMPANY_ID } from '@/lib/constants';
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  MapPin,
  Calendar,
  Building2,
  Clock,
} from 'lucide-react';
import { useMemo } from 'react';
import { PermitDocumentsSection } from './PermitDocumentsSection';

const PERMIT_STATUS_LABELS: Record<string, string> = {
  vigente: 'Vigente',
  por_vencer: 'Por Vencer',
  vencido: 'Vencido',
  no_registrado: 'No Registrado',
};

export function PermitDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

  const companyId = isDemoMode ? DEMO_COMPANY_ID : profile?.company_id;

  const { permits, loading: loadingPermits, refetch: refetchPermits } = usePermits({ companyId });
  const { locations, loading: loadingLocations } = useLocations(companyId);

  const permit = useMemo(() => permits.find((p) => p.id === id), [permits, id]);
  const location = useMemo(
    () => (permit ? locations.find((l) => l.id === permit.location_id) : null),
    [permit, locations]
  );

  const loading = loadingPermits || loadingLocations;

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="h-10 bg-gray-200 rounded animate-pulse w-40" />
        <div className="h-16 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 gap-6">
          <div className="h-64 bg-gray-200 rounded animate-pulse" />
          <div className="h-64 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!permit) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/permisos')}
        >
          <ArrowLeft size={16} className="mr-1.5" />
          Volver a permisos
        </Button>
        <div className="text-center py-12">
          <Shield size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">Permiso no encontrado</p>
          <p className="text-sm text-gray-400">
            El permiso que buscas no existe o fue eliminado
          </p>
        </div>
      </div>
    );
  }

  const isRisk = permit.status === 'vencido' || permit.status === 'no_registrado';
  const daysRemaining = permit.expiry_date ? daysUntil(permit.expiry_date) : null;

  const getStatusVariant = (status: string): 'success' | 'destructive' | 'warning' | 'secondary' => {
    if (status === 'vigente') return 'success';
    if (status === 'vencido') return 'destructive';
    if (status === 'no_registrado') return 'warning';
    return 'secondary';
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/permisos')}
      >
        <ArrowLeft size={16} className="mr-1.5" />
        Volver a permisos
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center">
            <Shield size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {permit.type}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {permit.issuer || 'Sin emisor'}
            </p>
          </div>
        </div>
        <Badge
          variant={getStatusVariant(permit.status)}
          className={permit.status === 'vencido' ? 'animate-pulse' : ''}
        >
          {PERMIT_STATUS_LABELS[permit.status]}
        </Badge>
      </div>

      {/* Risk Alert */}
      {isRisk && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertTriangle size={20} className="text-red-600 shrink-0" />
            <div className="text-sm text-red-900">
              {permit.status === 'vencido' ? (
                <>
                  <span className="font-semibold">Permiso vencido</span> — Actividad regulada sin autorización vigente
                </>
              ) : (
                <>
                  <span className="font-semibold">Permiso no registrado</span> — Riesgo operativo activo
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Main Details */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Detalles del Permiso
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <Building2 size={12} />
                <span className="uppercase tracking-wider font-medium">Sede</span>
              </div>
              {location ? (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => navigate(`/sedes/${location.id}`)}
                  className="h-auto p-0 text-blue-600 hover:text-blue-700"
                >
                  {location.name}
                </Button>
              ) : (
                <p className="text-sm text-gray-700">—</p>
              )}
            </div>

            {permit.issued_date && (
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <Calendar size={12} />
                  <span className="uppercase tracking-wider font-medium">Fecha de Emisión</span>
                </div>
                <p className="text-sm text-gray-700">{formatDate(permit.issued_date)}</p>
              </div>
            )}

            {permit.expiry_date && (
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <Clock size={12} />
                  <span className="uppercase tracking-wider font-medium">Vencimiento</span>
                </div>
                <p
                  className={`text-sm font-semibold ${
                    daysRemaining !== null && daysRemaining < 0
                      ? 'text-red-600'
                      : daysRemaining !== null && daysRemaining <= 30
                      ? 'text-amber-600'
                      : 'text-gray-900'
                  }`}
                >
                  {formatDate(permit.expiry_date)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDateRelative(permit.expiry_date)}
                </p>
              </div>
            )}

          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Documentos
            </h3>
          </CardHeader>
          <CardContent>
            {id && <PermitDocumentsSection permitId={id} onDocumentChange={refetchPermits} />}
          </CardContent>
        </Card>
      </div>


      {/* Actions */}
      {location && (
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(`/sedes/${location.id}`)}
          >
            <MapPin size={16} className="mr-1.5" />
            Ver sede {location.name}
          </Button>
        </div>
      )}
    </div>
  );
}
