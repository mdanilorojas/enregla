import { useState, useCallback, useEffect } from 'react';
import { uploadPermitDocument, deleteDocument, getPermitDocuments } from '@/lib/api/documents';
import { supabase } from '@/lib/supabase';
import { Upload, FileText, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/dates';
import toast from 'react-hot-toast';
import type { Document } from '@/types/database';

interface PermitDocumentsSectionProps {
  permitId: string;
  onDocumentChange?: () => void | Promise<void>;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];

export function PermitDocumentsSection({ permitId, onDocumentChange }: PermitDocumentsSectionProps) {
  const [document, setDocument] = useState<Document | null>(null);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fetchDocuments = useCallback(() => {
    if (permitId) {
      setLoadingDocs(true);
      getPermitDocuments(permitId)
        .then(docs => setDocument(docs[0] || null))
        .catch(console.error)
        .finally(() => setLoadingDocs(false));
    }
  }, [permitId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

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
      // Delete existing document if present
      if (document) {
        await deleteDocument(document.id, document.file_path);
      }

      await uploadPermitDocument(permitId, file);
      toast.success('Documento subido exitosamente');
      fetchDocuments();
      onDocumentChange?.();
    } catch (err) {
      console.error('Upload error:', err);
      toast.error(err instanceof Error ? err.message : 'Error al subir');
    } finally {
      setUploading(false);
    }
  }, [permitId, document, fetchDocuments]);

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      // Delete existing document if present
      if (document) {
        await deleteDocument(document.id, document.file_path);
      }

      await uploadPermitDocument(permitId, file);
      toast.success('Documento subido exitosamente');
      fetchDocuments();
      onDocumentChange?.();
    } catch (err) {
      console.error('Upload error:', err);
      toast.error(err instanceof Error ? err.message : 'Error al subir');
    } finally {
      setUploading(false);
    }
  }, [permitId, document, fetchDocuments]);

  if (loadingDocs) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm text-gray-500">Cargando documentos...</p>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!document) return;
    if (!confirm('¿Eliminar este documento?')) return;

    try {
      await deleteDocument(document.id, document.file_path);
      toast.success('Documento eliminado');
      setDocument(null);
      onDocumentChange?.();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const getDocumentUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from('permit-documents')
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const isPDF = (fileName: string) => {
    return fileName.toLowerCase().endsWith('.pdf');
  };

  return (
    <div className="space-y-4">
      {document ? (
        // Document preview with actions
        <div className="space-y-3">
          {/* Preview section */}
          <div className="aspect-video bg-gray-50 rounded-lg overflow-hidden">
            {isPDF(document.file_name) ? (
              <iframe
                src={`${getDocumentUrl(document.file_path)}#page=1`}
                className="w-full h-full"
                title="Vista previa del documento"
              />
            ) : (
              <img
                src={getDocumentUrl(document.file_path)}
                alt={document.file_name}
                className="w-full h-full object-contain"
              />
            )}
          </div>

          {/* Document info and actions */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <FileText size={16} className="text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate mb-1">
                  {document.file_name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDate(document.uploaded_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => window.open(getDocumentUrl(document.file_path), '_blank')}
                title="Ver documento"
                className="flex-1"
              >
                <Eye size={14} className="mr-1.5" />
                Ver documento
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDelete}
                title="Eliminar y subir nuevo"
                className="flex-1 text-destructive hover:text-destructive"
              >
                <Trash2 size={14} className="mr-1.5" />
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // Upload zone when no document
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
      )}
    </div>
  );
}
