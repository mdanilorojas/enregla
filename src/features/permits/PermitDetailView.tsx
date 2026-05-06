import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePermits } from '@/hooks/usePermits';
import { useLocations } from '@/hooks/useLocations';
import { getPermitDocuments } from '@/lib/api/documents';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Banner } from '@/components/ui/banner';
import { PermitTimeline, type TimelineEvent } from './PermitTimeline';
import { formatDate } from '@/lib/dates';
import {
  Edit,
  Trash2,
  Upload,
  FileText,
  Eye,
  MapPin,
} from '@/lib/lucide-icons';
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
  en_tramite: 'En Trámite',
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

  const timeline = useMemo<TimelineEvent[]>(() => {
    if (!permit) return [];
    const events: TimelineEvent[] = [];

    if (permit.issue_date) {
      events.push({
        id: 'issued',
        type: 'issued',
        date: permit.issue_date,
        description: 'Permiso emitido',
      });
    }

    if (permit.expiry_date) {
      const isExpired = new Date(permit.expiry_date) < new Date();
      events.push({
        id: 'expires',
        type: isExpired ? 'expired' : 'expires',
        date: permit.expiry_date,
        description: isExpired ? 'Permiso vencido' : 'Fecha de vencimiento',
      });
    }

    return events;
  }, [permit]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-400)]">
        <div className="max-w-7xl mx-auto space-y-[var(--ds-space-300)]">
          <div className="h-10 bg-[var(--ds-neutral-100)] rounded animate-pulse w-40" />
          <div className="h-16 bg-[var(--ds-neutral-100)] rounded animate-pulse" />
          <div className="grid grid-cols-2 gap-6">
            <div className="h-64 bg-[var(--ds-neutral-100)] rounded animate-pulse" />
            <div className="h-64 bg-[var(--ds-neutral-100)] rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!permit) {
    return (
      <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-400)]">
        <div className="max-w-7xl mx-auto space-y-[var(--ds-space-300)]">
          <Breadcrumb
            items={[
              { label: 'Inicio', href: '/' },
              { label: 'Permisos', href: '/permisos' },
              { label: 'No encontrado' },
            ]}
          />
          <Card className="p-[var(--ds-space-400)]">
            <div className="text-center py-8">
              <p className="text-[var(--ds-text-subtle)] mb-2">Permiso no encontrado</p>
              <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtlest)]">
                El permiso que buscas no existe o fue eliminado
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const statusVariant =
    ({
      vigente: 'status-vigente' as const,
      por_vencer: 'status-por-vencer' as const,
      vencido: 'status-vencido' as const,
      en_tramite: 'status-en-tramite' as const,
      no_registrado: 'status-no-registrado' as const,
    }[permit.status as string]) ?? ('status-no-registrado' as const);

  const isExpired = permit.status === 'vencido';
  const isExpiring = permit.status === 'por_vencer';

  const permitType = permit.type ?? 'Permiso';
  const permitNumber = permit.permit_number ?? '-';
  const authority = permit.issuer ?? '-';
  const statusLabel = PERMIT_STATUS_LABELS[permit.status] ?? (permit.status as string).replace('_', ' ');

  return (
    <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-400)]">
      <div className="max-w-7xl mx-auto space-y-[var(--ds-space-300)]">
        <Breadcrumb
          items={[
            { label: 'Inicio', href: '/' },
            { label: 'Permisos', href: '/permisos' },
            { label: permitType },
          ]}
        />

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-[var(--ds-font-size-500)] font-bold text-[var(--ds-text)]">
              {permitType}
            </h1>
            <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] font-mono mt-[var(--ds-space-050)]">
              {permitNumber}
            </p>
          </div>
          <div className="flex gap-[var(--ds-space-100)]">
            <Button variant="outline">
              <Edit className="w-4 h-4" />
              Editar
            </Button>
            <Button variant="destructive">
              <Trash2 className="w-4 h-4" />
              Eliminar
            </Button>
          </div>
        </div>

        {isExpired && (
          <Banner variant="error" title="Permiso vencido">
            Este permiso ha caducado. Es necesario renovarlo inmediatamente.
          </Banner>
        )}
        {isExpiring && (
          <Banner variant="warning" title="Próximo a vencer">
            Este permiso vence pronto. Planifica la renovación.
          </Banner>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--ds-space-300)]">
          <Card className="p-[var(--ds-space-300)]">
            <h2 className="text-[var(--ds-font-size-300)] font-semibold mb-[var(--ds-space-200)]">
              Información
            </h2>
            <dl className="space-y-[var(--ds-space-200)]">
              <div>
                <dt className="text-[var(--ds-font-size-075)] uppercase text-[var(--ds-text-subtle)]">
                  Estado
                </dt>
                <dd className="mt-[var(--ds-space-050)]">
                  <Badge variant={statusVariant}>{statusLabel}</Badge>
                </dd>
              </div>
              <div>
                <dt className="text-[var(--ds-font-size-075)] uppercase text-[var(--ds-text-subtle)]">
                  Autoridad
                </dt>
                <dd className="mt-[var(--ds-space-050)] text-[var(--ds-font-size-100)]">
                  {authority}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--ds-font-size-075)] uppercase text-[var(--ds-text-subtle)]">
                  Sede
                </dt>
                <dd className="mt-[var(--ds-space-050)] text-[var(--ds-font-size-100)]">
                  {location ? (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => navigate(`/sedes/${location.id}`)}
                      className="h-auto p-0"
                    >
                      <MapPin className="w-4 h-4" />
                      {location.name}
                    </Button>
                  ) : (
                    '-'
                  )}
                </dd>
              </div>
              {permit.issue_date && (
                <div>
                  <dt className="text-[var(--ds-font-size-075)] uppercase text-[var(--ds-text-subtle)]">
                    Fecha de Emisión
                  </dt>
                  <dd className="mt-[var(--ds-space-050)] text-[var(--ds-font-size-100)]">
                    {formatDate(permit.issue_date)}
                  </dd>
                </div>
              )}
              {permit.expiry_date && (
                <div>
                  <dt className="text-[var(--ds-font-size-075)] uppercase text-[var(--ds-text-subtle)]">
                    Vencimiento
                  </dt>
                  <dd className="mt-[var(--ds-space-050)] text-[var(--ds-font-size-100)]">
                    {formatDate(permit.expiry_date)}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          <Card className="p-[var(--ds-space-300)]">
            <h2 className="text-[var(--ds-font-size-300)] font-semibold mb-[var(--ds-space-200)]">
              Timeline
            </h2>
            <PermitTimeline events={timeline} />
          </Card>
        </div>

        <Card className="p-[var(--ds-space-300)]">
          <h2 className="text-[var(--ds-font-size-300)] font-semibold mb-[var(--ds-space-200)]">
            Documentos
          </h2>
          {loadingDocs ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-[var(--ds-neutral-200)] border-t-[var(--ds-text)] rounded-full animate-spin mx-auto mb-2" />
              <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)]">
                Cargando documentos...
              </p>
            </div>
          ) : (
            <div className="space-y-[var(--ds-space-200)]">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  'relative border-2 border-dashed rounded-[var(--ds-radius-100)] p-[var(--ds-space-300)] transition-all',
                  dragOver
                    ? 'border-[var(--ds-background-brand)] bg-[var(--ds-blue-50)]'
                    : 'border-[var(--ds-border)] hover:border-[var(--ds-text-subtle)]',
                  uploading && 'opacity-50 pointer-events-none'
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
                      <div className="w-8 h-8 border-4 border-[var(--ds-blue-100)] border-t-[var(--ds-background-brand)] rounded-full animate-spin mb-2" />
                      <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)]">
                        Subiendo...
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-[var(--ds-text-subtle)] mb-2" />
                      <p className="text-[var(--ds-font-size-100)] font-medium text-[var(--ds-text)]">
                        Arrastra documento aquí
                      </p>
                      <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] mt-1">
                        o haz clic para seleccionar
                      </p>
                      <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtlest)] mt-2">
                        PDF, PNG, JPG (máx. 5MB)
                      </p>
                    </>
                  )}
                </label>
              </div>

              {documents.length > 0 && (
                <div className="space-y-[var(--ds-space-100)]">
                  <p className="text-[var(--ds-font-size-075)] font-medium text-[var(--ds-text-subtle)] uppercase tracking-wider">
                    Documentos subidos ({documents.length})
                  </p>
                  <div className="space-y-[var(--ds-space-100)]">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-[var(--ds-space-150)] p-[var(--ds-space-150)] bg-[var(--ds-neutral-50)] rounded-[var(--ds-radius-100)] border border-[var(--ds-border)]"
                      >
                        <div className="w-10 h-10 rounded-[var(--ds-radius-100)] bg-white border border-[var(--ds-border)] flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-[var(--ds-text-subtle)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[var(--ds-font-size-100)] font-medium text-[var(--ds-text)] truncate">
                            {doc.file_name}
                          </p>
                          <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">
                            {formatDate(doc.uploaded_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-[var(--ds-space-050)]">
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
                            <Eye className="w-4 h-4" />
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
                            className="text-[var(--ds-text-danger)] hover:text-[var(--ds-text-danger)]"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
