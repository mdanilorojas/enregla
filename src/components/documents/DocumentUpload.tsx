import { useState, useCallback } from 'react';
import { uploadPermitDocument } from '@/lib/api/documents';
import { Upload, File, X, CheckCircle2, AlertCircle } from '@/lib/lucide-icons';

interface DocumentUploadProps {
  permitId: string;
  onUploadSuccess?: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
const ACCEPTED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg'];

export function DocumentUpload({ permitId, onUploadSuccess }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Tipo de archivo no permitido. Solo PDF, PNG, JPG';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Archivo muy grande. Máximo 5MB';
    }
    return null;
  };

  const handleFileSelect = useCallback((selectedFile: File) => {
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setError(null);
    setSuccess(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      await uploadPermitDocument(permitId, file);
      clearInterval(progressInterval);
      setUploadProgress(100);
      setSuccess(true);
      setFile(null);

      // Call success callback after a short delay
      setTimeout(() => {
        onUploadSuccess?.();
        setSuccess(false);
        setUploadProgress(0);
      }, 2000);
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : 'Error al subir el documento');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError(null);
    setSuccess(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : error
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
      >
        <input
          id="file-upload"
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(',')}
          onChange={handleFileInput}
          className="hidden"
          disabled={uploading}
        />

        <div className="flex flex-col items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            error ? 'bg-red-100' : 'bg-blue-100'
          }`}>
            <Upload size={24} className={error ? 'text-red-600' : 'text-blue-600'} />
          </div>

          <div>
            <p className="text-[14px] font-semibold text-gray-900 mb-1">
              Arrastra un documento o{' '}
              <label
                htmlFor="file-upload"
                className="text-blue-600 hover:text-blue-700 cursor-pointer underline"
              >
                busca en tu equipo
              </label>
            </p>
            <p className="text-[12px] text-gray-500">
              PDF, PNG, JPG · Máximo 5MB
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
          <AlertCircle size={14} className="text-red-500 shrink-0" />
          <span className="text-[12px] text-red-600 font-medium">{error}</span>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100">
          <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
          <span className="text-[12px] text-emerald-600 font-medium">
            Documento subido exitosamente
          </span>
        </div>
      )}

      {/* Selected File Preview */}
      {file && !success && (
        <div className="border border-gray-100 rounded-xl p-4 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <File size={18} className="text-blue-600" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-gray-900 truncate">
                {file.name}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {formatFileSize(file.size)}
              </p>
            </div>

            {!uploading && (
              <button
                onClick={handleRemoveFile}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0"
              >
                <X size={16} className="text-gray-600" />
              </button>
            )}
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="mt-3">
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1 text-center">
                Subiendo... {uploadProgress}%
              </p>
            </div>
          )}

          {/* Upload Button */}
          {!uploading && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full mt-3 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-[13px] font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Subir documento
            </button>
          )}
        </div>
      )}
    </div>
  );
}
