import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePermits } from '@/hooks/usePermits';
import { useLocations } from '@/hooks/useLocations';
import { getPermitDocuments } from '@/lib/api/documents';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Upload,
  Eye,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { uploadPermitDocument, deleteDocument } from '@/lib/api/documents';
import toast from 'react-hot-toast';
import type { Document } from '@/types/database';

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

  const companyId = isDemoMode
    ? '50707999-f033-41c4-91c9-989966311972'
    : profile?.company_id;

  const { permits, loading: loadingPermits } = usePermits({ companyId });
  const { locations, loading: loadingLocations } = useLocations(companyId);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const permit = useMemo(() => permits.find((p) => p.id === id), [permits, id]);
  const location = useMemo(
    () => (permit ? locations.find((l) => l.id === permit.location_id) : null),
    [permit, locations]
  );

  const fetchDocuments = useCallback(() => {
    if (id) {
      setLoadingDocs(true);
      getPermitDocuments(id)
        .then(setDocuments)
        .catch(console.error)
        .finally(() => setLoadingDocs(false));
    }
  }, [id]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ACCEPTED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Tipo no permitido. Solo PDF, PNG, JPG';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Archivo muy grande. Máximo 5MB';
    }
    return null;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    if (!id) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0];
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setUploading(true);
    try {
      await uploadPermitDocument(id, file);
      toast.success('Documento subido exitosamente');
      fetchDocuments();
    } catch (err) {
      console.error('Upload error:', err);
      toast.error(err instanceof Error ? err.message : 'Error al subir');
    } finally {
      setUploading(false);
    }
  }, [id, fetchDocuments]);

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!id) return;

    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setUploading(true);
    try {
      await uploadPermitDocument(id, file);
      toast.success('Documento subido exitosamente');
      fetchDocuments();
    } catch (err) {
      console.error('Upload error:', err);
      toast.error(err instanceof Error ? err.message : 'Error al subir');
    } finally {
      setUploading(false);
    }
  }, [id, fetchDocuments]);

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

            {permit.issue_date && (
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <Calendar size={12} />
                  <span className="uppercase tracking-wider font-medium">Fecha de Emisión</span>
                </div>
                <p className="text-sm text-gray-700">{formatDate(permit.issue_date)}</p>
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
            {loadingDocs ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-500">Cargando documentos...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Upload zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "relative border-2 border-dashed rounded-lg p-6 transition-all",
                    dragOver ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300",
                    uploading && "opacity-50 pointer-events-none"
                  )}
                >
                  <label className="flex flex-col items-center justify-center cursor-pointer">
                    <input
                      type="file"
                      accept={ACCEPTED_TYPES.join(',')}
                      className="hidden"
                      onChange={handleFileInput}
                      disabled={uploading}
                    />
                    {uploading ? (
                      <>
                        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-2" />
                        <p className="text-sm text-gray-600">Subiendo...</p>
                      </>
                    ) : (
                      <>
                        <Upload size={24} className="text-gray-400 mb-2" />
                        <p className="text-sm font-medium text-gray-700">Arrastra documento aquí</p>
                        <p className="text-xs text-gray-500 mt-1">o haz clic para seleccionar</p>
                        <p className="text-xs text-gray-400 mt-2">PDF, PNG, JPG (máx. 5MB)</p>
                      </>
                    )}
                  </label>
                  {dragOver && (
                    <div className="absolute inset-0 border-4 border-dashed border-primary bg-primary/10 rounded-lg flex items-center justify-center pointer-events-none">
                      <div className="text-primary font-semibold">Suelta aquí</div>
                    </div>
                  )}
                </div>

                {/* Documents list */}
                {documents.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Documentos subidos ({documents.length})
                    </p>
                    <div className="space-y-2">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
                        >
                          <div className="w-10 h-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0">
                            <FileText size={16} className="text-gray-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {doc.file_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(doc.uploaded_at)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                const { data } = supabase.storage
                                  .from('permit-documents')
                                  .getPublicUrl(doc.file_path);
                                window.open(data.publicUrl, '_blank');
                              }}
                              title="Ver documento"
                            >
                              <Eye size={16} />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={async () => {
                                if (!confirm('¿Eliminar este documento?')) return;
                                try {
                                  await deleteDocument(doc.id, doc.file_path);
                                  toast.success('Documento eliminado');
                                  fetchDocuments();
                                } catch (error) {
                                  toast.error('Error al eliminar');
                                }
                              }}
                              title="Eliminar"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
