import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePermits } from '@/hooks/usePermits';
import { useLocations } from '@/hooks/useLocations';
import { getPermitDocuments, getDocumentUrl } from '@/lib/api/documents';
import { resolveCompanyId } from '@/lib/demo';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Banner } from '@/components/ui/banner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PermitTimeline, type TimelineEvent } from './PermitTimeline';
import { PermitUploadForm } from './PermitUploadForm';
import { formatDate } from '@/lib/dates';
import {
  Trash2,
  Upload,
  FileText,
  Eye,
  MapPin,
} from '@/lib/lucide-icons';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { deleteDocument } from '@/lib/api/documents';
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
  const companyId = resolveCompanyId(profile?.company_id) ?? undefined;

  const { permits, loading: loadingPermits, updatePermit } = usePermits({ companyId });
  const { locations, loading: loadingLocations } = useLocations(companyId);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  // Modal de upload: cuando arrastras/seleccionas archivo, se guarda aqui
  // y se abre el modal con PermitUploadForm (que pide fechas + actualiza permit).
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const headerFileInputRef = useRef<HTMLInputElement>(null);

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

  // En vez de subir directo, abre el modal de PermitUploadForm con el archivo
  // pre-cargado. El modal pide fechas, calcula vencimiento y actualiza el permit
  // a status='vigente'. Asi el drop/click devuelve permits listos en un solo paso.
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0];
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setPendingFile(file);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setPendingFile(file);
    // reset input para que pueda re-seleccionarse el mismo archivo despues
    e.target.value = '';
  }, []);

  const handleUploadSuccess = useCallback(() => {
    setPendingFile(null);
    toast.success('Permiso actualizado');
    fetchDocuments();
  }, [fetchDocuments]);

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
            <input
              ref={headerFileInputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              className="hidden"
              onChange={handleFileInput}
            />
            <Button
              variant="default"
              onClick={() => headerFileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4" />
              Subir documento
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--ds-space-300)]">
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

          <Card className="p-[var(--ds-space-300)]">
            <h2 className="text-[var(--ds-font-size-300)] font-semibold mb-[var(--ds-space-200)]">
              Documento
            </h2>
            <DocumentPanel
              loading={loadingDocs}
              documents={documents}
              dragOver={dragOver}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onFileInput={handleFileInput}
              onRefresh={fetchDocuments}
              acceptedTypes={ACCEPTED_TYPES}
            />
          </Card>
        </div>
      </div>

      {/* Modal con PermitUploadForm cuando hay archivo pendiente */}
      <Dialog open={!!pendingFile} onOpenChange={(open) => { if (!open) setPendingFile(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirmar datos del permiso</DialogTitle>
          </DialogHeader>
          {pendingFile && permit && (
            <PermitUploadForm
              permit={permit}
              preloadedFile={pendingFile}
              updatePermit={updatePermit}
              onSuccess={handleUploadSuccess}
              onCancel={() => setPendingFile(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface DocumentPanelProps {
  loading: boolean;
  documents: Document[];
  dragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRefresh: () => void;
  acceptedTypes: string[];
}

function DocumentPanel({
  loading,
  documents,
  dragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileInput,
  onRefresh,
  acceptedTypes,
}: DocumentPanelProps) {
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-4 border-[var(--ds-neutral-200)] border-t-[var(--ds-text)] rounded-full animate-spin mx-auto mb-2" />
        <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">
          Cargando...
        </p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          'relative border-2 border-dashed rounded-[var(--ds-radius-100)] p-[var(--ds-space-300)] transition-all',
          dragOver
            ? 'border-[var(--ds-background-brand)] bg-[var(--ds-blue-50)]'
            : 'border-[var(--ds-border)] hover:border-[var(--ds-text-subtle)]'
        )}
      >
        <label className="flex flex-col items-center justify-center text-center cursor-pointer">
          <input
            type="file"
            accept={acceptedTypes.join(',')}
            className="hidden"
            onChange={onFileInput}
          />
          <Upload className="w-6 h-6 text-[var(--ds-text-subtle)] mb-[var(--ds-space-150)]" />
          <p className="text-[var(--ds-font-size-100)] font-medium text-[var(--ds-text)]">
            Subí el permiso
          </p>
          <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] mt-[var(--ds-space-050)]">
            Arrastrá el archivo aquí o hacé clic
          </p>
          <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtlest)] mt-[var(--ds-space-150)]">
            PDF, PNG, JPG · máx. 5MB
          </p>
        </label>
      </div>
    );
  }

  const doc = documents[0];
  return <DocumentPanelWithDoc doc={doc} onRefresh={onRefresh} />;
}

function DocumentPanelWithDoc({ doc, onRefresh }: { doc: Document; onRefresh: () => void }) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const isImage = /\.(png|jpg|jpeg)$/i.test(doc.file_name);
  const isPdf = /\.pdf$/i.test(doc.file_name);

  useEffect(() => {
    let cancelled = false;
    if (!doc.file_path) return;
    getDocumentUrl(doc.file_path).then(url => {
      if (!cancelled) setSignedUrl(url);
    });
    return () => { cancelled = true; };
  }, [doc.file_path]);

  if (!doc.file_path) {
    return (
      <div className="text-center py-8 text-[var(--ds-text-subtle)]">
        Documento no disponible
      </div>
    );
  }

  if (!signedUrl) {
    return (
      <div className="text-center py-8">
        <div className="w-6 h-6 border-2 border-[var(--ds-neutral-200)] border-t-[var(--ds-text)] rounded-full animate-spin mx-auto mb-2" />
        <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">Cargando documento...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[var(--ds-space-200)]">
      <a
        href={signedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-[var(--ds-neutral-50)] border border-[var(--ds-border)] rounded-[var(--ds-radius-100)] overflow-hidden hover:border-[var(--ds-border-bold)] transition-colors group"
        aria-label="Abrir documento"
      >
        <div className="aspect-[4/3] w-full bg-white flex items-center justify-center overflow-hidden">
          {isImage ? (
            <img
              src={signedUrl}
              alt={doc.file_name}
              className="w-full h-full object-contain"
            />
          ) : isPdf ? (
            <iframe
              src={`${signedUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
              title={doc.file_name}
              className="w-full h-full pointer-events-none"
            />
          ) : (
            <FileText className="w-12 h-12 text-[var(--ds-text-subtle)]" />
          )}
        </div>
      </a>

      <div className="min-w-0">
        <p className="text-[var(--ds-font-size-100)] font-medium text-[var(--ds-text)] truncate" title={doc.file_name}>
          {doc.file_name}
        </p>
        <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">
          {doc.uploaded_at ? `Subido el ${formatDate(doc.uploaded_at)}` : 'Sin fecha'}
        </p>
      </div>

      <div className="flex gap-[var(--ds-space-100)]">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(signedUrl, '_blank')}
          className="flex-1"
        >
          <Eye className="w-4 h-4" />
          Ver
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={deleting}
          onClick={async () => {
            if (!confirm('¿Eliminar este documento?')) return;
            setDeleting(true);
            try {
              await deleteDocument(doc.id, doc.file_path);
              toast.success('Documento eliminado');
              onRefresh();
            } catch {
              toast.error('Error al eliminar');
            } finally {
              setDeleting(false);
            }
          }}
          className="text-[var(--ds-text-danger)] hover:text-[var(--ds-text-danger)]"
          aria-label="Eliminar documento"
        >
          {deleting ? (
            <span className="text-xs">Eliminando...</span>
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
