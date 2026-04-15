import { useParams, useNavigate } from 'react-router-dom';
import { usePermit } from '@/hooks/usePermit';
import { useLocation } from '@/hooks/useLocations';
import { useDocuments } from '@/hooks/useDocuments';
import { useAuth } from '@/hooks/useAuth';
import { Card, Badge, EmptyState } from '@/components/ui';
import { PERMIT_TYPE_LABELS } from '@/types/database';
import { formatDate, formatDateRelative, daysUntil } from '@/lib/dates';
import { PermitHistory } from './PermitHistory';
import { DocumentUpload } from '@/components/documents/DocumentUpload';
import { DocumentList } from '@/components/documents/DocumentList';
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  MapPin,
  History,
  FileText,
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
  const { role } = useAuth();
  const { permit, history, loading, error } = usePermit(id);
  const { documents, loading: docsLoading, refetch: refetchDocuments } = useDocuments(id);

  const canUpload = role === 'admin' || role === 'operator';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !permit) {
    return (
      <EmptyState
        message={error || 'Permiso no encontrado.'}
        action="Volver a permisos"
        onAction={() => navigate('/permisos')}
      />
    );
  }

  const { location: locationData } = useLocation(permit.location_id);
  const isRisk = permit.status === 'vencido' || permit.status === 'no_registrado';

  return (
    <div className="space-y-6 max-w-3xl">
      <button
        onClick={() => navigate('/permisos')}
        className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-900 transition-colors font-medium"
      >
        <ArrowLeft size={14} />
        Permisos
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200/60 flex items-center justify-center shadow-sm">
            <Shield size={18} className="text-emerald-600" strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 tracking-tight">
              {PERMIT_TYPE_LABELS[permit.type] || permit.type}
            </h2>
            <p className="text-[12px] text-gray-400 mt-0.5">{permit.issuer || 'Sin emisor'}</p>
          </div>
        </div>
        <Badge variant="status" status={permit.status} pulse={permit.status === 'vencido'}>
          {PERMIT_STATUS_LABELS[permit.status] || permit.status}
        </Badge>
      </div>

      {/* Risk alert */}
      {isRisk && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
          <AlertTriangle size={14} className="text-red-500 shrink-0" />
          <span className="text-[13px] text-red-600 font-medium">
            {permit.status === 'vencido'
              ? 'Permiso vencido — actividad regulada sin autorización vigente'
              : 'Permiso requerido no registrado — riesgo operativo activo'}
          </span>
        </div>
      )}

      {/* Details grid */}
      <Card>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          <div>
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">Sede</span>
            {locationData ? (
              <button
                onClick={() => navigate(`/sedes/${locationData.id}`)}
                className="flex items-center gap-1.5 text-[13px] text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                <MapPin size={12} />
                {locationData.name}
              </button>
            ) : (
              <p className="text-[13px] text-gray-500">—</p>
            )}
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">Número</span>
            <p className="text-[13px] text-gray-700 font-medium">{permit.permit_number || '—'}</p>
          </div>
          {permit.issue_date && (
            <div>
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">Emitido</span>
              <p className="text-[13px] text-gray-700">{formatDate(permit.issue_date)}</p>
            </div>
          )}
          {permit.expiry_date && (
            <div>
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">Vencimiento</span>
              <p className={`text-[13px] font-semibold ${
                daysUntil(permit.expiry_date) < 0 ? 'text-red-500' :
                daysUntil(permit.expiry_date) <= 30 ? 'text-amber-600' :
                'text-gray-700'
              }`}>
                {formatDate(permit.expiry_date)}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">{formatDateRelative(permit.expiry_date)}</p>
            </div>
          )}
        </div>

        {/* Additional details row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mt-5 pt-5 border-t border-gray-100">
          <div>
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">Versión</span>
            <p className="text-[13px] text-gray-700 font-medium">v{permit.version}</p>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">Estado</span>
            <p className="text-[13px] text-gray-700 font-medium">
              {permit.is_active ? 'Activa' : 'Archivada'}
            </p>
          </div>
        </div>

        {permit.notes && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-2">Notas</span>
            <p className="text-[13px] text-gray-600 leading-relaxed">{permit.notes}</p>
          </div>
        )}
      </Card>

      {/* Documents */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shadow-sm shadow-sky-500/10">
            <FileText size={14} strokeWidth={1.8} />
          </div>
          <span className="text-[14px] font-semibold text-gray-900">Documentos</span>
        </div>

        {/* Upload section (admin/operator only) */}
        {canUpload && (
          <div className="mb-4">
            <DocumentUpload
              permitId={permit.id}
              onUploadSuccess={refetchDocuments}
            />
          </div>
        )}

        {/* Documents list */}
        {docsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
          </div>
        ) : (
          <DocumentList
            documents={documents}
            onDocumentDeleted={refetchDocuments}
          />
        )}
      </div>

      {/* Version History */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-sm shadow-purple-500/10">
            <History size={14} strokeWidth={1.8} />
          </div>
          <span className="text-[14px] font-semibold text-gray-900">Historial de versiones</span>
        </div>

        <PermitHistory history={history} currentPermitId={permit.id} />
      </div>

      {/* Navigate to sede */}
      {locationData && (
        <div className="pt-2">
          <button
            onClick={() => navigate(`/sedes/${locationData.id}`)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200/80 text-[13px] font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <MapPin size={14} />
            Ver sede {locationData.name}
          </button>
        </div>
      )}
    </div>
  );
}
