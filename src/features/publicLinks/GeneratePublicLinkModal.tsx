import { useState } from 'react';
import { createPublicLink, getPublicUrl } from '@/lib/api/publicLinks';
import { X, Link2, Building2, MapPin, AlertCircle } from 'lucide-react';
import type { PublicLink } from '@/types/database';

interface GeneratePublicLinkModalProps {
  companyId: string;
  locationId?: string | null;
  locationName?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (link: PublicLink) => void;
}

type LinkScope = 'company' | 'location';

export function GeneratePublicLinkModal({
  companyId,
  locationId,
  locationName,
  isOpen,
  onClose,
  onSuccess,
}: GeneratePublicLinkModalProps) {
  const [scope, setScope] = useState<LinkScope>(locationId ? 'location' : 'company');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!label.trim()) {
      setError('Ingresa una etiqueta para el link');
      return;
    }

    setLoading(true);

    try {
      const link = await createPublicLink({
        companyId,
        locationId: scope === 'location' ? locationId || null : null,
        label: label.trim(),
      });

      onSuccess(link);
      onClose();

      // Reset form
      setLabel('');
      setScope(locationId ? 'location' : 'company');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar el link');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setLabel('');
      setError(null);
      setScope(locationId ? 'location' : 'company');
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full pointer-events-auto transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Link2 size={18} className="text-white" strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-[16px] font-bold text-gray-900">
                  Generar Link Público
                </h2>
                <p className="text-[12px] text-gray-500 mt-0.5">
                  Crea un link de verificación con QR
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              disabled={loading}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors disabled:opacity-50"
            >
              <X size={18} className="text-gray-400" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Scope selection */}
            <div>
              <label className="block text-[12px] font-semibold text-gray-600 mb-3">
                Alcance del link
              </label>

              <div className="space-y-2">
                {/* Company option */}
                <label
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    scope === 'company'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="scope"
                    value="company"
                    checked={scope === 'company'}
                    onChange={(e) => setScope(e.target.value as LinkScope)}
                    disabled={loading}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-gray-600" />
                      <span className="text-[14px] font-semibold text-gray-900">
                        Toda la empresa
                      </span>
                    </div>
                    <p className="text-[12px] text-gray-500 mt-1">
                      Muestra todos los permisos vigentes de todas las sedes
                    </p>
                  </div>
                </label>

                {/* Location option */}
                {locationId && (
                  <label
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      scope === 'location'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="scope"
                      value="location"
                      checked={scope === 'location'}
                      onChange={(e) => setScope(e.target.value as LinkScope)}
                      disabled={loading}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-gray-600" />
                        <span className="text-[14px] font-semibold text-gray-900">
                          Solo esta sede
                        </span>
                      </div>
                      <p className="text-[12px] text-gray-500 mt-1">
                        {locationName ? `Permisos de ${locationName}` : 'Permisos de esta sede únicamente'}
                      </p>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Label input */}
            <div>
              <label className="block text-[12px] font-semibold text-gray-600 mb-2">
                Etiqueta del link
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="ej: Inspector Municipal 2026"
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-[14px] text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all disabled:opacity-50"
              />
              <p className="text-[11px] text-gray-400 mt-1.5">
                Identifica el propósito de este link (ej: auditoría, inspección, cliente)
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
                <AlertCircle size={14} className="text-red-500 shrink-0" />
                <span className="text-[12px] text-red-600 font-medium">{error}</span>
              </div>
            )}

            {/* Info box */}
            <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100">
              <Link2 size={14} className="text-blue-600 shrink-0 mt-0.5" />
              <p className="text-[12px] text-blue-700 leading-relaxed">
                El link generado mostrará solo permisos vigentes. Podrás descargar un QR para imprimir y pegar en tu sede.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-xl bg-gray-100 text-gray-700 text-[14px] font-semibold hover:bg-gray-200 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !label.trim()}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-[14px] font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generando...
                  </div>
                ) : (
                  'Generar Link'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
