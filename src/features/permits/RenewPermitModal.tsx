import { useState, type FormEvent } from 'react';
import { GlassModal } from '@/components/ui';
import { renewPermit } from '@/lib/api/permits';
import type { Permit } from '@/types/database';
import { PERMIT_TYPE_LABELS } from '@/types';
import { formatDate } from '@/lib/dates';
import { Upload, AlertCircle, Loader2 } from 'lucide-react';

interface RenewPermitModalProps {
  permit: Permit;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  permit_number: string;
  issue_date: string;
  expiry_date: string;
  issuer: string;
  notes: string;
  document: File | null;
}

interface FormErrors {
  permit_number?: string;
  issue_date?: string;
  expiry_date?: string;
  document?: string;
  general?: string;
}

export function RenewPermitModal({ permit, onClose, onSuccess }: RenewPermitModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<FormData>({
    permit_number: '',
    issue_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    issuer: permit.issuer || '',
    notes: '',
    document: null,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
    if (!allowedTypes.includes(file.type)) {
      setErrors((prev) => ({ ...prev, document: 'Solo se permiten archivos PDF, PNG o JPG' }));
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrors((prev) => ({ ...prev, document: 'El archivo no debe superar los 5MB' }));
      return;
    }

    setFormData((prev) => ({ ...prev, document: file }));
    setErrors((prev) => ({ ...prev, document: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.permit_number.trim()) {
      newErrors.permit_number = 'El número de permiso es requerido';
    }

    if (!formData.issue_date) {
      newErrors.issue_date = 'La fecha de emisión es requerida';
    }

    if (!formData.expiry_date) {
      newErrors.expiry_date = 'La fecha de vencimiento es requerida';
    }

    // Validate expiry date is after issue date
    if (formData.issue_date && formData.expiry_date) {
      const issueDate = new Date(formData.issue_date);
      const expiryDate = new Date(formData.expiry_date);
      if (expiryDate <= issueDate) {
        newErrors.expiry_date = 'La fecha de vencimiento debe ser posterior a la fecha de emisión';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      await renewPermit(permit.id, {
        permit_number: formData.permit_number,
        issue_date: formData.issue_date,
        expiry_date: formData.expiry_date,
        issuer: formData.issuer || permit.issuer || '',
        notes: formData.notes || null,
        document: formData.document,
      });

      onSuccess();
    } catch (error) {
      console.error('Error renewing permit:', error);
      setErrors({
        general: error instanceof Error ? error.message : 'Error al renovar el permiso',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GlassModal isOpen={true} onClose={onClose} size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-gray-900">Renovar Permiso</h2>
          <p className="text-sm text-gray-600 mt-1">
            {PERMIT_TYPE_LABELS[permit.type as keyof typeof PERMIT_TYPE_LABELS] || permit.type}
          </p>
        </div>

        {/* Current Permit Info */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Información Actual</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Versión actual:</span>
              <span className="ml-2 font-medium text-gray-900">v{permit.version}</span>
            </div>
            <div>
              <span className="text-gray-500">Número:</span>
              <span className="ml-2 font-medium text-gray-900">
                {permit.permit_number || <span className="text-gray-400 italic">Sin asignar</span>}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Emisor:</span>
              <span className="ml-2 font-medium text-gray-900">
                {permit.issuer || <span className="text-gray-400 italic">N/A</span>}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Fecha emisión:</span>
              <span className="ml-2 font-medium text-gray-900">
                {permit.issue_date ? formatDate(permit.issue_date) : <span className="text-gray-400 italic">N/A</span>}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">Fecha vencimiento:</span>
              <span className="ml-2 font-medium text-gray-900">
                {permit.expiry_date ? formatDate(permit.expiry_date) : <span className="text-gray-400 italic">N/A</span>}
              </span>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Versionado automático</p>
            <p className="text-blue-800">
              Al renovar, se creará una nueva versión (v{permit.version + 1}) y la versión actual será archivada automáticamente.
            </p>
          </div>
        </div>

        {/* Renewal Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Permit Number */}
          <div>
            <label htmlFor="permit_number" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Nuevo número <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="permit_number"
              value={formData.permit_number}
              onChange={(e) => setFormData((prev) => ({ ...prev, permit_number: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.permit_number ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Ej: ARCSA-2024-00123"
            />
            {errors.permit_number && (
              <p className="mt-1 text-xs text-red-600">{errors.permit_number}</p>
            )}
          </div>

          {/* Date Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="issue_date" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nueva fecha emisión <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="issue_date"
                value={formData.issue_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, issue_date: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.issue_date ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors.issue_date && (
                <p className="mt-1 text-xs text-red-600">{errors.issue_date}</p>
              )}
            </div>

            <div>
              <label htmlFor="expiry_date" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nueva fecha vencimiento <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="expiry_date"
                value={formData.expiry_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, expiry_date: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.expiry_date ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors.expiry_date && (
                <p className="mt-1 text-xs text-red-600">{errors.expiry_date}</p>
              )}
            </div>
          </div>

          {/* New Issuer */}
          <div>
            <label htmlFor="issuer" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Nuevo emisor <span className="text-gray-400 text-xs">(opcional)</span>
            </label>
            <input
              type="text"
              id="issuer"
              value={formData.issuer}
              onChange={(e) => setFormData((prev) => ({ ...prev, issuer: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Ej: Municipio de Quito"
            />
          </div>

          {/* Document Upload */}
          <div>
            <label htmlFor="document" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Documento <span className="text-gray-400 text-xs">(opcional)</span>
            </label>
            <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              errors.document ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-blue-400'
            }`}>
              <input
                type="file"
                id="document"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="document"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload size={32} className="text-gray-400 mb-2" />
                {formData.document ? (
                  <div>
                    <p className="text-sm font-medium text-gray-900">{formData.document.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(formData.document.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600">Haz clic para seleccionar un archivo</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, PNG o JPG (máx. 5MB)</p>
                  </div>
                )}
              </label>
            </div>
            {errors.document && (
              <p className="mt-1 text-xs text-red-600">{errors.document}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Notas <span className="text-gray-400 text-xs">(opcional)</span>
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              placeholder="Información adicional sobre la renovación..."
            />
          </div>

          {/* General Error */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{errors.general}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Renovando...
                </>
              ) : (
                'Renovar Permiso'
              )}
            </button>
          </div>
        </form>
      </div>
    </GlassModal>
  );
}
