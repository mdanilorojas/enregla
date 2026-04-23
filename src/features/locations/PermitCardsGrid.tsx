import { useState, useCallback } from 'react';
import { FileText, AlertCircle, Clock, FileX, Upload, Trash2, Eye, FileCheck } from 'lucide-react';
import { uploadPermitDocument, deleteDocument } from '@/lib/api/documents';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import type { Permit, Document } from '@/types/database';
import type { PermitStatus } from '@/types';

interface PermitCardsGridProps {
  permits: Permit[];
  documentsMap: Map<string, Document[]>;
  onDocumentUpdated: () => void;
  onDocumentDeleted?: (permitId: string, documentId: string) => void;
  onViewDetails: (permitId: string) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];

// Status configuration siguiendo tu sistema
const statusConfig: Record<PermitStatus, {
  icon: typeof FileCheck;
  color: 'green' | 'yellow' | 'red' | 'gray';
  label: string;
}> = {
  vigente: {
    icon: FileCheck,
    color: 'green',
    label: 'Vigente',
  },
  por_vencer: {
    icon: Clock,
    color: 'yellow',
    label: 'Por vencer',
  },
  vencido: {
    icon: AlertCircle,
    color: 'red',
    label: 'Vencido',
  },
  no_registrado: {
    icon: FileX,
    color: 'gray',
    label: 'Sin registrar',
  },
};

export function PermitCardsGrid({
  permits,
  documentsMap,
  onDocumentUpdated,
  onDocumentDeleted,
  onViewDetails,
}: PermitCardsGridProps) {
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Tipo no permitido. Solo PDF, PNG, JPG';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Archivo muy grande. Máximo 5MB';
    }
    return null;
  };

  const handleDragOver = useCallback((e: React.DragEvent, permitId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverId(permitId);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverId(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, permitId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverId(null);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0];
    console.log('[PermitCardsGrid] File dropped:', file.name, file.type, file.size);

    const validationError = validateFile(file);
    if (validationError) {
      console.error('[PermitCardsGrid] Validation error:', validationError);
      setErrors(prev => new Map(prev).set(permitId, validationError));
      return;
    }

    setErrors(prev => {
      const next = new Map(prev);
      next.delete(permitId);
      return next;
    });
    setUploadingIds(prev => new Set(prev).add(permitId));

    try {
      console.log('[PermitCardsGrid] Starting upload for permit:', permitId);
      const result = await uploadPermitDocument(permitId, file);
      console.log('[PermitCardsGrid] Upload successful:', result);
      onDocumentUpdated();
    } catch (err) {
      console.error('[PermitCardsGrid] Upload error:', err);
      setErrors(prev => new Map(prev).set(
        permitId,
        err instanceof Error ? err.message : 'Error al subir'
      ));
    } finally {
      setUploadingIds(prev => {
        const next = new Set(prev);
        next.delete(permitId);
        return next;
      });
    }
  }, [onDocumentUpdated]);

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, permitId: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    console.log('[PermitCardsGrid] File selected:', file.name, file.type, file.size);

    const validationError = validateFile(file);
    if (validationError) {
      console.error('[PermitCardsGrid] Validation error:', validationError);
      setErrors(prev => new Map(prev).set(permitId, validationError));
      return;
    }

    setErrors(prev => {
      const next = new Map(prev);
      next.delete(permitId);
      return next;
    });
    setUploadingIds(prev => new Set(prev).add(permitId));

    try {
      console.log('[PermitCardsGrid] Starting upload for permit:', permitId);
      const result = await uploadPermitDocument(permitId, file);
      console.log('[PermitCardsGrid] Upload successful:', result);
      onDocumentUpdated();
    } catch (err) {
      console.error('[PermitCardsGrid] Upload error:', err);
      setErrors(prev => new Map(prev).set(
        permitId,
        err instanceof Error ? err.message : 'Error al subir'
      ));
    } finally {
      setUploadingIds(prev => {
        const next = new Set(prev);
        next.delete(permitId);
        return next;
      });
    }
  }, [onDocumentUpdated]);

  const handleRemoveDocument = useCallback(async (permitId: string, documentId: string, filePath: string) => {
    if (!confirm('¿Seguro que deseas eliminar este documento? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      console.log('[PermitCardsGrid] Deleting document:', documentId, filePath);
      await deleteDocument(documentId, filePath);
      toast.success('Documento eliminado');

      // Update local state without refetching
      if (onDocumentDeleted) {
        onDocumentDeleted(permitId, documentId);
      } else {
        // Fallback to full refetch if callback not provided
        onDocumentUpdated();
      }
    } catch (error) {
      console.error('[PermitCardsGrid] Delete error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al eliminar documento');
    }
  }, [onDocumentUpdated, onDocumentDeleted]);

  const handleViewDocument = useCallback((filePath: string) => {
    // Construct Supabase public URL
    const { data } = supabase.storage
      .from('permit-documents')
      .getPublicUrl(filePath);

    window.open(data.publicUrl, '_blank');
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {permits.map(permit => {
        const config = statusConfig[permit.status];
        const Icon = config.icon;
        const isUploading = uploadingIds.has(permit.id);
        const isDragOver = dragOverId === permit.id;
        const error = errors.get(permit.id);

        // Get documents for this permit
        const permitDocuments = documentsMap.get(permit.id) || [];
        const hasDocument = permitDocuments.length > 0;
        const firstDocument = permitDocuments[0];

        return (
          <div
            key={permit.id}
            className={cn(
              "relative bg-card rounded-lg border shadow-sm overflow-hidden transition-all duration-200",
              isDragOver && "border-primary shadow-lg scale-[1.02]",
              error && "border-destructive"
            )}
          >
            {/* Status badge */}
            <div className="absolute top-3 right-3 z-10">
              <Badge color={config.color} className="flex items-center gap-1.5">
                <Icon size={12} strokeWidth={2.5} />
                {config.label}
              </Badge>
            </div>

            {/* Document preview or upload zone */}
            <div
              onDragOver={(e) => handleDragOver(e, permit.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, permit.id)}
              className="relative h-48 bg-muted"
            >
              {hasDocument ? (
                // Document preview
                <div className="relative w-full h-full group">
                  <div className="flex items-center justify-center h-full bg-muted">
                    <FileText size={48} className="text-muted-foreground" />
                  </div>

                  {/* Hover actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {firstDocument && (
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => handleViewDocument(firstDocument.file_path)}
                        title="Ver documento"
                      >
                        <Eye size={18} />
                      </Button>
                    )}
                    {firstDocument && (
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveDocument(permit.id, firstDocument.id, firstDocument.file_path);
                        }}
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                // Upload zone
                <label className={cn(
                  "flex flex-col items-center justify-center h-full cursor-pointer transition-colors",
                  isDragOver ? "bg-primary/10" : "hover:bg-muted/50"
                )}>
                  <input
                    type="file"
                    accept={ACCEPTED_TYPES.join(',')}
                    className="hidden"
                    onChange={(e) => handleFileInput(e, permit.id)}
                    disabled={isUploading}
                  />
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                      <p className="text-sm text-muted-foreground">Subiendo...</p>
                    </div>
                  ) : (
                    <>
                      <Upload size={32} className="text-muted-foreground mb-2" />
                      <p className="text-sm font-medium text-foreground">Arrastra documento</p>
                      <p className="text-xs text-muted-foreground mt-1">o haz clic para seleccionar</p>
                    </>
                  )}
                </label>
              )}

              {/* Drag over indicator */}
              {isDragOver && (
                <div className="absolute inset-0 border-4 border-dashed border-primary bg-primary/10 flex items-center justify-center pointer-events-none">
                  <div className="text-primary font-semibold">Suelta aquí</div>
                </div>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20">
                <p className="text-xs text-destructive flex items-center gap-1.5">
                  <AlertCircle size={12} />
                  {error}
                </p>
              </div>
            )}

            {/* Permit info */}
            <div className="p-4">
              <Button
                variant="ghost"
                className="w-full justify-start p-0 h-auto hover:bg-transparent"
                onClick={() => onViewDetails(permit.id)}
              >
                <div className="text-left">
                  <h3 className="text-sm font-semibold text-foreground hover:text-primary transition-colors mb-1">
                    {permit.type}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{permit.issuer || 'Sin emisor'}</span>
                    {permit.expiry_date && (
                      <>
                        <span>•</span>
                        <span>Vence: {new Date(permit.expiry_date).toLocaleDateString('es-CL')}</span>
                      </>
                    )}
                  </div>
                </div>
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
