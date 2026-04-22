import { useState } from 'react';
import { getDocumentUrl, deleteDocument } from '@/lib/api/documents';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/dates';
import { FileText, Download, Trash2, ExternalLink } from 'lucide-react';
import type { Document } from '@/types/database';

interface DocumentListProps {
  documents: Document[];
  onDocumentDeleted?: () => void;
}

export function DocumentList({ documents, onDocumentDeleted }: DocumentListProps) {
  const { role } = useAuth();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canDelete = role === 'admin' || role === 'operator';

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = async (doc: Document) => {
    try {
      const url = await getDocumentUrl(doc.file_path);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Error downloading document:', err);
      setError('Error al descargar el documento');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!canDelete) return;

    const confirmed = window.confirm(
      `¿Estás seguro de eliminar "${doc.file_name}"?\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    setDeletingId(doc.id);
    setError(null);

    try {
      await deleteDocument(doc.id, doc.file_path);
      onDocumentDeleted?.();
    } catch (err) {
      console.error('Error deleting document:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar el documento');
      setTimeout(() => setError(null), 3000);
    } finally {
      setDeletingId(null);
    }
  };

  if (documents.length === 0) {
    return (
      <div className="border border-gray-100 rounded-xl p-8 text-center bg-gray-50">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <FileText size={20} className="text-gray-400" />
        </div>
        <p className="text-[13px] text-gray-500 font-medium">
          No hay documentos cargados
        </p>
        <p className="text-[12px] text-gray-400 mt-1">
          Los documentos que subas aparecerán aquí
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
          <span className="text-[12px] text-red-600 font-medium">{error}</span>
        </div>
      )}

      {documents.map((doc) => {
        const isDeleting = deletingId === doc.id;
        const fileExtension = doc.file_name.split('.').pop()?.toUpperCase() || '';

        return (
          <div
            key={doc.id}
            className={`border border-gray-100 rounded-xl p-4 bg-white transition-opacity ${
              isDeleting ? 'opacity-50' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              {/* File icon */}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                fileExtension === 'PDF'
                  ? 'bg-red-100'
                  : fileExtension === 'PNG' || fileExtension === 'JPG' || fileExtension === 'JPEG'
                  ? 'bg-blue-100'
                  : 'bg-gray-100'
              }`}>
                <FileText
                  size={18}
                  className={
                    fileExtension === 'PDF'
                      ? 'text-red-600'
                      : fileExtension === 'PNG' || fileExtension === 'JPG' || fileExtension === 'JPEG'
                      ? 'text-blue-600'
                      : 'text-gray-600'
                  }
                />
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-gray-900 truncate">
                  {doc.file_name}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[11px] text-gray-500">
                    {formatFileSize(doc.file_size)}
                  </span>
                  <span className="text-[11px] text-gray-400">•</span>
                  <span className="text-[11px] text-gray-500">
                    {formatDate(doc.uploaded_at)}
                  </span>
                  {doc.file_type && (
                    <>
                      <span className="text-[11px] text-gray-400">•</span>
                      <span className="text-[11px] text-gray-500 uppercase">
                        {fileExtension}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Download button */}
                <button
                  onClick={() => handleDownload(doc)}
                  disabled={isDeleting}
                  className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors disabled:opacity-50"
                  title="Descargar documento"
                >
                  <Download size={14} className="text-blue-600" />
                </button>

                {/* View button */}
                <button
                  onClick={() => handleDownload(doc)}
                  disabled={isDeleting}
                  className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors disabled:opacity-50"
                  title="Ver documento"
                >
                  <ExternalLink size={14} className="text-gray-600" />
                </button>

                {/* Delete button (admin/operator only) */}
                {canDelete && (
                  <button
                    onClick={() => handleDelete(doc)}
                    disabled={isDeleting}
                    className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors disabled:opacity-50"
                    title="Eliminar documento"
                  >
                    {isDeleting ? (
                      <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                    ) : (
                      <Trash2 size={14} className="text-red-600" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
