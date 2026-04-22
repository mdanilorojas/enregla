import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PERMIT_TYPE_LABELS } from '@/types';
import { formatDate, formatDateRelative, daysUntil } from '@/lib/dates';
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  MapPin,
  Calendar,
  FileText,
  Building2,
  Clock,
} from 'lucide-react';

const PERMIT_STATUS_LABELS: Record<string, string> = {
  vigente: 'Vigente',
  por_vencer: 'Por Vencer',
  vencido: 'Vencido',
  no_registrado: 'No Registrado',
};

export function PermitDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { permits, locations, documents } = useAppStore();

  const permit = permits.find((p) => p.id === id);
  const location = permit ? locations.find((l) => l.id === permit.locationId) : null;
  const permitDocs = documents.filter((d) => d.permitId === id);

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
  const daysRemaining = permit.expiryDate ? daysUntil(permit.expiryDate) : null;

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
              {PERMIT_TYPE_LABELS[permit.type]}
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

            {permit.issuedDate && (
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <Calendar size={12} />
                  <span className="uppercase tracking-wider font-medium">Fecha de Emisión</span>
                </div>
                <p className="text-sm text-gray-700">{formatDate(permit.issuedDate)}</p>
              </div>
            )}

            {permit.expiryDate && (
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
                  {formatDate(permit.expiryDate)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDateRelative(permit.expiryDate)}
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
            {permitDocs.length > 0 ? (
              <div className="space-y-3">
                {permitDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0">
                      <FileText size={16} className="text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {doc.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(doc.uploadedAt)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        doc.status === 'vigente'
                          ? 'success'
                          : doc.status === 'vencido'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {doc.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Sin documentos adjuntos</p>
              </div>
            )}
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
