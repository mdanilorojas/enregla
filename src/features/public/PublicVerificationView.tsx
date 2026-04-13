import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicPermits, type PublicPermitData } from '@/lib/api/publicLinks';
import { formatDate } from '@/lib/dates';
import { Shield, CheckCircle2, MapPin, Building2, FileText, Calendar, ExternalLink } from 'lucide-react';

export function PublicVerificationView() {
  const { token } = useParams<{ token: string }>();
  const [permits, setPermits] = useState<PublicPermitData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Token inválido');
      setLoading(false);
      return;
    }

    setLoading(true);
    getPublicPermits(token)
      .then((data) => {
        setPermits(data);
        setError(null);
      })
      .catch((err) => {
        console.error('Error fetching public permits:', err);
        setError('Link inválido o expirado');
        setPermits([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-600 font-medium">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || permits.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Link Inválido
          </h1>
          <p className="text-gray-600 mb-6">
            {error || 'No se encontraron permisos para este link'}
          </p>
          <div className="text-sm text-gray-500">
            <p>Este link puede haber expirado o sido desactivado.</p>
            <p className="mt-2">Contacta con la empresa para obtener un nuevo link.</p>
          </div>
        </div>
      </div>
    );
  }

  // Extract location info from first permit (all permits share same location)
  const locationName = permits[0]?.location_name || 'Sede';
  const locationAddress = permits[0]?.location_address || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-white font-bold text-xl">ER</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                EnRegla Compliance
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Verificación Pública de Permisos
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Location Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-100 to-violet-200 flex items-center justify-center shrink-0">
              <Building2 size={24} className="text-violet-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                {locationName}
              </h2>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin size={16} className="shrink-0" />
                <span className="text-sm">{locationAddress}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Success Banner */}
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl shadow-lg p-6 sm:p-8 mb-8 text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <CheckCircle2 size={28} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">
                ✓ Permisos Vigentes Verificados
              </h3>
              <p className="text-emerald-50 text-sm leading-relaxed">
                Esta sede mantiene todos sus permisos al día y en regla. Los permisos mostrados a continuación han sido verificados y están vigentes.
              </p>
            </div>
          </div>
        </div>

        {/* Permits Grid */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Shield size={20} className="text-blue-600" />
            Permisos Vigentes ({permits.length})
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            {permits.map((permit, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-md border border-gray-200 p-5 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <FileText size={16} className="text-blue-600" />
                    </div>
                    <h4 className="text-sm font-bold text-gray-900">
                      {permit.permit_type}
                    </h4>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                    <CheckCircle2 size={12} />
                    Vigente
                  </span>
                </div>

                <div className="space-y-2">
                  {permit.permit_number && (
                    <div>
                      <span className="text-xs text-gray-500 font-medium block mb-0.5">
                        Número de Permiso
                      </span>
                      <p className="text-sm text-gray-900 font-medium">
                        {permit.permit_number}
                      </p>
                    </div>
                  )}

                  <div>
                    <span className="text-xs text-gray-500 font-medium block mb-0.5">
                      Emisor
                    </span>
                    <p className="text-sm text-gray-700">
                      {permit.issuer}
                    </p>
                  </div>

                  {permit.issue_date && (
                    <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
                      <div>
                        <span className="text-xs text-gray-500 font-medium block mb-0.5">
                          Emitido
                        </span>
                        <p className="text-xs text-gray-700 flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(permit.issue_date)}
                        </p>
                      </div>
                      {permit.expiry_date && (
                        <div>
                          <span className="text-xs text-gray-500 font-medium block mb-0.5">
                            Vence
                          </span>
                          <p className="text-xs text-gray-700 flex items-center gap-1">
                            <Calendar size={12} />
                            {formatDate(permit.expiry_date)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-6 mb-8">
          <div className="flex items-start gap-3">
            <Shield size={20} className="text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-blue-900 mb-2">
                Sobre esta verificación
              </h4>
              <p className="text-sm text-blue-800 leading-relaxed">
                Esta página muestra únicamente los permisos vigentes y en regla de esta sede.
                La información se actualiza en tiempo real y es verificable en cualquier momento
                escaneando el código QR proporcionado por la empresa.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <span className="text-white font-bold text-sm">ER</span>
              </div>
              <div>
                <p className="text-sm font-semibold">EnRegla Compliance</p>
                <p className="text-xs text-gray-400">Sistema de Gestión de Permisos</p>
              </div>
            </div>
            <a
              href="https://enregla.ec"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
            >
              <span>enregla.ec</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
