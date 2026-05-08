import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { Upload, Calendar as CalendarIcon, AlertCircle, FileText } from '@/lib/lucide-icons';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { uploadPermitDocument } from '@/lib/api/documents';
import { calculateExpiryDate, formatPermitDuration } from '@/lib/permitRules';
import type { Permit } from '@/types/database';

// File validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const VALID_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const VALID_FILE_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'];

// Date validation helpers
const getTodayEndOfDay = (): Date => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return today;
};

const getTenYearsAgo = (): Date => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 10);
  date.setHours(0, 0, 0, 0);
  return date;
};

const isValidIssueDate = (date: Date): boolean => {
  const todayEOD = getTodayEndOfDay();
  if (date > todayEOD) return false;

  const tenYearsAgo = getTenYearsAgo();
  if (date < tenYearsAgo) return false;

  return true;
};

interface PermitUploadFormProps {
  permit: Permit;
  onSuccess: () => void;
  onCancel: () => void;
  /** Si se pasa, el form arranca con este archivo pre-seleccionado. Util cuando
   *  el parent ya capturo un drag&drop o file-select y abre este form como modal. */
  preloadedFile?: File | null;
  updatePermit: (
    permitId: string,
    updates: {
      issue_date?: string;
      expiry_date?: string | null;
      status?: 'vigente' | 'por_vencer' | 'vencido' | 'en_tramite' | 'no_registrado';
      permit_number?: string | null;
      notes?: string | null;
    }
  ) => Promise<void>;
}

/**
 * PermitUploadForm - Inline form for uploading permit documents
 *
 * Allows users to:
 * - Upload document file (PDF, JPG, PNG, max 10MB)
 * - Select permit issue date
 * - See automatically calculated expiry date based on permit type
 * - Submit to update permit status to 'vigente'
 *
 * Features rollback logic if file upload succeeds but permit update fails.
 */
export function PermitUploadForm({
  permit,
  onSuccess,
  onCancel,
  preloadedFile = null,
  updatePermit,
}: PermitUploadFormProps) {
  // ========== State Management ==========
  const [file, setFile] = useState<File | null>(preloadedFile);
  const [issueDate, setIssueDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ========== Computed Values ==========
  const expiryDate = useMemo(() => {
    return calculateExpiryDate(permit.type, issueDate);
  }, [permit.type, issueDate]);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const isImage = !!file && file.type.startsWith('image/');
  const isPdf = !!file && file.type === 'application/pdf';

  // ========== Event Handlers ==========
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file size (10MB max)
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('El archivo es demasiado grande (máximo 10MB)');
      return;
    }

    // Validate file type
    if (!VALID_FILE_TYPES.includes(selectedFile.type)) {
      setError('Formato no válido. Solo se aceptan PDF, JPG, PNG');
      return;
    }

    // Validate file extension
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!VALID_FILE_EXTENSIONS.includes(fileExtension || '')) {
      setError('Extensión de archivo no válida');
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validateForm = (): string | null => {
    if (!file) return 'Selecciona un documento para subir';

    if (!isValidIssueDate(issueDate)) {
      const todayEOD = getTodayEndOfDay();
      if (issueDate > todayEOD) {
        return 'La fecha de emisión no puede ser futura';
      }
      return 'Fecha inválida. Verifica la fecha de emisión';
    }

    return null;
  };

  const handleUpload = async () => {
    if (loading) return; // Guard against double-clicks

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!file) return;

    setLoading(true);
    setError(null);

    let uploadedFilePath: string | undefined;

    try {
      // 1. Upload file to Supabase Storage
      uploadedFilePath = await uploadPermitDocument(permit.id, file);

      // 2. Calculate dates in ISO format
      const issueDateISO = format(issueDate, 'yyyy-MM-dd');
      const expiryDateISO = expiryDate ? format(expiryDate, 'yyyy-MM-dd') : null;

      // 3. Update permit record with dates and status
      await updatePermit(permit.id, {
        issue_date: issueDateISO,
        expiry_date: expiryDateISO,
        status: 'vigente',
      });

      // 4. Success - call parent callback
      onSuccess();
    } catch (err) {
      console.error('Upload error:', err);

      // Rollback: if file was uploaded but permit update failed, try to delete file
      if (uploadedFilePath) {
        try {
          const { supabase } = await import('@/lib/supabase');
          // Delete file from storage
          await supabase.storage
            .from('permit-documents')
            .remove([uploadedFilePath]);
          // Delete document record from database
          await supabase
            .from('documents')
            .delete()
            .eq('file_path', uploadedFilePath);
        } catch (rollbackErr) {
          console.error('Rollback failed:', rollbackErr);
          // Continue - show original error to user
        }
      }

      setError(
        err instanceof Error
          ? err.message
          : 'Error al subir el documento. Intenta de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ========== Render ==========
  return (
    <div className="bg-gray-50 border-t border-gray-100 p-6 space-y-4">
      {/* File upload zone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Documento del permiso
        </label>
        {file && previewUrl ? (
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <div className="aspect-[4/3] w-full bg-gray-50 flex items-center justify-center overflow-hidden">
              {isImage ? (
                <img
                  src={previewUrl}
                  alt={file.name}
                  className="w-full h-full object-contain"
                />
              ) : isPdf ? (
                <iframe
                  src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                  title={file.name}
                  className="w-full h-full pointer-events-none"
                />
              ) : (
                <FileText className="h-12 w-12 text-gray-400" />
              )}
            </div>
            <div className="flex items-center gap-3 p-3 border-t border-gray-100">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate text-sm" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-gray-500 font-mono">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <label className="shrink-0 cursor-pointer text-sm text-gray-700 hover:text-gray-900 underline font-medium">
                Cambiar archivo
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={loading}
                />
              </label>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 hover:border-gray-400 bg-white rounded-lg p-6 text-center transition-colors">
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <label className="cursor-pointer">
              <span className="text-primary hover:text-primary/80 font-medium">
                Seleccionar archivo
              </span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
                disabled={loading}
              />
            </label>
            <p className="text-xs text-gray-500 mt-2">
              PDF, JPG o PNG (máximo 10MB)
            </p>
          </div>
        )}
      </div>

      {/* Issue date picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fecha de emisión del permiso
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
              disabled={loading}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(issueDate, 'dd/MM/yyyy')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={issueDate}
              onSelect={(date) => {
                if (date) {
                  setIssueDate(date);
                  setError(null);
                }
              }}
              disabled={(date) => !isValidIssueDate(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <p className="text-xs text-gray-500 mt-1.5">
          Confirma la fecha en que fue emitido el permiso
        </p>
      </div>

      {/* Expiry display */}
      {expiryDate && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm font-semibold text-gray-900">Vencimiento calculado</p>
          <p className="font-mono text-lg text-gray-900">{format(expiryDate, 'dd/MM/yyyy')}</p>
          <p className="text-xs text-gray-600 mt-1">{formatPermitDuration(permit.type)}</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2" role="alert">
          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button onClick={handleUpload} disabled={!file || loading}>
          {loading ? 'Subiendo...' : 'Guardar documento'}
        </Button>
      </div>
    </div>
  );
}
