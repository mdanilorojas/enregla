import { useState, useEffect, useMemo } from 'react';
import { X, Copy, ExternalLink, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { Button } from '@/components/ui-v2/button';
import {
  getLocationPublicLink,
  createPublicLink,
  getPublicUrl
} from '@/lib/api/publicLinks';
import type { PublicLink } from '@/types/database';
import { usePermits } from '@/hooks/usePermits';
import { useAuth } from '@/hooks/useAuth';

interface ShareLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationId: string;
  locationName: string;
  locationAddress: string;
}

export function ShareLocationModal({
  isOpen,
  onClose,
  locationId,
  locationName,
  locationAddress,
}: ShareLocationModalProps) {
  const { companyId } = useAuth();
  const { permits } = usePermits({ companyId });
  const [link, setLink] = useState<PublicLink | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter permits for this location
  const locationPermits = useMemo(() => {
    return permits.filter(p => p.location_id === locationId && p.is_active);
  }, [permits, locationId]);

  // Calculate permit metrics
  const metrics = useMemo(() => {
    const vigentes = locationPermits.filter(p => p.status === 'vigente').length;
    const porVencer = locationPermits.filter(p => p.status === 'por_vencer').length;
    const vencidos = locationPermits.filter(p => p.status === 'vencido').length;
    return { vigentes, porVencer, vencidos };
  }, [locationPermits]);

  // Initialize link when modal opens
  useEffect(() => {
    async function initializeLink() {
      if (!isOpen) return;

      setLoading(true);
      setError(null);

      try {
        // Try to get existing link
        let existingLink = await getLocationPublicLink(locationId);

        if (!existingLink && companyId) {
          // Create new link
          existingLink = await createPublicLink({
            companyId,
            locationId,
            label: `Inspector ${locationName} ${new Date().getFullYear()}`,
          });
        }

        setLink(existingLink);
      } catch (err) {
        console.error('Error initializing link:', err);
        setError('Error al generar el link público');
      } finally {
        setLoading(false);
      }
    }

    initializeLink();
  }, [isOpen, locationId, locationName, companyId]);

  // Handle copy to clipboard
  const handleCopy = async () => {
    if (!link) return;

    try {
      const url = getPublicUrl(link.token);
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  };

  // Handle QR download
  const handleDownloadQR = () => {
    const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `qr-${locationName.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = url;
    link.click();
  };

  // Handle view complete
  const handleViewComplete = () => {
    if (!link) return;
    const url = getPublicUrl(link.token);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <button
                onClick={onClose}
                className="text-sm text-gray-600 hover:text-gray-900 mb-2 flex items-center gap-1"
              >
                ← Volver a Sedes
              </button>
              <h2 className="text-2xl font-bold text-gray-900">
                Compartir Estado Documental
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Genera enlaces públicos y códigos QR para compartir el estado de tus sedes
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Generando link...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-sm text-red-600 hover:text-red-800 underline mt-1"
                >
                  Reintentar
                </button>
              </div>
            </div>
          )}

          {/* Content when link is loaded */}
          {!loading && !error && link && (
            <>
              {/* Configuration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sede a Compartir
                </label>
                <div className="border border-gray-300 rounded-md px-4 py-2 bg-gray-50">
                  <p className="font-medium text-gray-900">{locationName}</p>
                </div>
              </div>

              {/* Public Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enlace Público
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={getPublicUrl(link.token)}
                    readOnly
                    className="flex-1 border border-gray-300 rounded-md px-4 py-2 bg-gray-50 font-mono text-sm"
                  />
                  <Button
                    onClick={handleCopy}
                    variant={copied ? 'default' : 'outline'}
                    className="flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Preview + QR Code Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Preview */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Vista Previa Compacta
                  </h3>
                  <div className="space-y-2">
                    <p className="font-medium text-gray-900">{locationName}</p>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {locationAddress}
                    </p>
                    <div className="mt-3 space-y-1">
                      {metrics.vigentes > 0 && (
                        <p className="text-sm text-green-600">
                          ✅ {metrics.vigentes} vigentes
                        </p>
                      )}
                      {metrics.porVencer > 0 && (
                        <p className="text-sm text-yellow-600">
                          ⚠️ {metrics.porVencer} por vencer
                        </p>
                      )}
                      {metrics.vencidos > 0 && (
                        <p className="text-sm text-red-600">
                          ❌ {metrics.vencidos} vencidos
                        </p>
                      )}
                      {locationPermits.length === 0 && (
                        <p className="text-sm text-gray-500">
                          Sin documentos públicos
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-center bg-white">
                  <QRCodeSVG
                    value={getPublicUrl(link.token)}
                    size={256}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>

              {/* Hidden canvas for download */}
              <QRCodeCanvas
                id="qr-canvas"
                value={getPublicUrl(link.token)}
                size={512}
                level="H"
                includeMargin={true}
                style={{ display: 'none' }}
              />

              {/* Privacy Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Nota de Privacidad:</span> Los permisos mostrados, vigencias, y documentos adjuntos son visibles por quien acceda a este enlace.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={handleDownloadQR}
                  variant="outline"
                  className="flex-1"
                >
                  🔲 Generar Código QR
                </Button>
                <Button
                  onClick={handleViewComplete}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  Vista Completa
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
