import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Upload, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui-v2/button';
import { Calendar } from '@/components/ui-v2/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui-v2/popover';
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

export function PermitUploadForm({
  permit,
  onSuccess,
  onCancel,
  updatePermit,
}: PermitUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [issueDate, setIssueDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expiryDate = useMemo(() => {
    return calculateExpiryDate(permit.type, issueDate);
  }, [permit.type, issueDate]);

  // File handling
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

    // Validate file extension (security - prevent spoofed MIME types)
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!VALID_FILE_EXTENSIONS.includes(fileExtension || '')) {
      setError('Extensión de archivo no válida');
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Upload logic will be implemented in next task
    console.log('Uploading file:', file?.name);
    console.log('Issue date:', issueDate);
    console.log('Expiry date:', expiryDate);
  };

  return (
    <div className="bg-gray-50 border-t border-gray-200 p-6 space-y-4">
      {/* File upload zone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Documento del permiso
        </label>
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            file
              ? 'border-green-300 bg-green-50'
              : 'border-gray-300 hover:border-gray-400 bg-white'
          }`}
        >
          {file ? (
            <div className="space-y-2">
              <Upload className="h-8 w-8 text-green-600 mx-auto" />
              <div>
                <p className="font-medium text-gray-900 truncate" title={file.name}>{file.name}</p>
                <p className="text-sm text-gray-500 font-mono">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-sm text-gray-600 hover:text-gray-900 underline"
              >
                Cambiar archivo
              </button>
            </div>
          ) : (
            <div>
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

      {/* Expiry display - placeholder for next step */}
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
