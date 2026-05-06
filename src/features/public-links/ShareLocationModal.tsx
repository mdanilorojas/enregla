import { useState, useEffect, useMemo } from 'react';
import {
  X,
  Copy,
  ExternalLink,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  QrCode,
} from '@/lib/lucide-icons';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Banner } from '@/components/ui/banner';
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
    <div
      className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-[var(--ds-space-200)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-location-title"
    >
      <div className="bg-[var(--ds-neutral-0)] rounded-[var(--ds-radius-400)] shadow-[var(--ds-shadow-overlay)] w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-[var(--ds-border)] p-[var(--ds-space-300)]">
          <div className="flex items-start justify-between">
            <div>
              <button
                onClick={onClose}
                className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] hover:text-[var(--ds-text)] mb-[var(--ds-space-100)] flex items-center gap-[var(--ds-space-050)] rounded-[var(--ds-radius-100)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-background-brand)] focus-visible:ring-offset-2 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Volver a Sedes
              </button>
              <h2
                id="share-location-title"
                className="text-[var(--ds-font-size-400)] font-bold text-[var(--ds-text)]"
              >
                Compartir Estado Documental
              </h2>
              <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mt-[var(--ds-space-050)]">
                Genera enlaces públicos y códigos QR para compartir el estado de tus sedes
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="text-[var(--ds-text-subtlest)] hover:text-[var(--ds-text-subtle)] transition-colors rounded-[var(--ds-radius-100)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-background-brand)] focus-visible:ring-offset-2"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-[var(--ds-space-300)] space-y-[var(--ds-space-300)]">
          {/* Loading State */}
          {loading && (
            <div
              className="text-center py-[var(--ds-space-400)]"
              role="status"
              aria-live="polite"
            >
              <div
                className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[var(--ds-background-brand)] border-r-transparent"
                aria-hidden="true"
              ></div>
              <p className="mt-[var(--ds-space-200)] text-[var(--ds-text-subtle)]">
                Generando link...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Banner variant="error" title="No se pudo generar el link">
              <div className="flex items-start justify-between gap-[var(--ds-space-150)]">
                <span>{error}</span>
                <button
                  onClick={() => window.location.reload()}
                  className="text-[var(--ds-font-size-100)] text-[var(--ds-red-700)] hover:text-[var(--ds-red-800)] underline rounded-[var(--ds-radius-100)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-background-brand)] focus-visible:ring-offset-2"
                >
                  Reintentar
                </button>
              </div>
            </Banner>
          )}

          {/* Content when link is loaded */}
          {!loading && !error && link && (
            <>
              {/* Configuration */}
              <div>
                <label
                  htmlFor="share-location-name"
                  className="block text-[var(--ds-font-size-100)] font-medium text-[var(--ds-text-subtle)] mb-[var(--ds-space-100)]"
                >
                  Sede a Compartir
                </label>
                <div
                  id="share-location-name"
                  className="border border-[var(--ds-border)] rounded-[var(--ds-radius-200)] px-[var(--ds-space-200)] py-[var(--ds-space-100)] bg-[var(--ds-neutral-50)]"
                >
                  <p className="font-medium text-[var(--ds-text)]">{locationName}</p>
                </div>
              </div>

              {/* Public Link */}
              <div>
                <label
                  htmlFor="share-location-url"
                  className="block text-[var(--ds-font-size-100)] font-medium text-[var(--ds-text-subtle)] mb-[var(--ds-space-100)]"
                >
                  Enlace Público
                </label>
                <div className="flex gap-[var(--ds-space-100)]">
                  <input
                    id="share-location-url"
                    type="text"
                    value={getPublicUrl(link.token)}
                    readOnly
                    className="flex-1 border border-[var(--ds-border)] rounded-[var(--ds-radius-200)] px-[var(--ds-space-200)] py-[var(--ds-space-100)] bg-[var(--ds-neutral-50)] font-mono text-[var(--ds-font-size-100)] text-[var(--ds-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-background-brand)] focus-visible:ring-offset-2"
                  />
                  <Button
                    onClick={handleCopy}
                    variant={copied ? 'default' : 'outline'}
                    className="flex items-center gap-[var(--ds-space-100)]"
                    aria-label={copied ? 'Enlace copiado' : 'Copiar enlace'}
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" aria-hidden="true" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Preview + QR Code Grid */}
              <div className="grid md:grid-cols-2 gap-[var(--ds-space-300)]">
                {/* Preview */}
                <div className="border border-[var(--ds-border)] rounded-[var(--ds-radius-300)] p-[var(--ds-space-200)] bg-[var(--ds-neutral-50)]">
                  <h3 className="font-semibold text-[var(--ds-text)] mb-[var(--ds-space-150)]">
                    Vista Previa Compacta
                  </h3>
                  <div className="space-y-[var(--ds-space-100)]">
                    <p className="font-medium text-[var(--ds-text)]">{locationName}</p>
                    <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] flex items-center gap-[var(--ds-space-100)]">
                      <MapPin className="h-4 w-4" aria-hidden="true" />
                      {locationAddress}
                    </p>
                    <div className="mt-[var(--ds-space-150)] space-y-[var(--ds-space-050)]">
                      {metrics.vigentes > 0 && (
                        <p className="text-[var(--ds-font-size-100)] text-[var(--ds-status-vigente-text)] flex items-center gap-[var(--ds-space-100)]">
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          {metrics.vigentes} vigentes
                        </p>
                      )}
                      {metrics.porVencer > 0 && (
                        <p className="text-[var(--ds-font-size-100)] text-[var(--ds-status-por-vencer-text)] flex items-center gap-[var(--ds-space-100)]">
                          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                          {metrics.porVencer} por vencer
                        </p>
                      )}
                      {metrics.vencidos > 0 && (
                        <p className="text-[var(--ds-font-size-100)] text-[var(--ds-status-vencido-text)] flex items-center gap-[var(--ds-space-100)]">
                          <XCircle className="h-4 w-4" aria-hidden="true" />
                          {metrics.vencidos} vencidos
                        </p>
                      )}
                      {locationPermits.length === 0 && (
                        <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtlest)]">
                          Sin documentos públicos
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="border border-[var(--ds-border)] rounded-[var(--ds-radius-300)] p-[var(--ds-space-200)] flex items-center justify-center bg-[var(--ds-neutral-0)]">
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
              <Banner variant="info" title="Nota de Privacidad">
                Los permisos mostrados, vigencias, y documentos adjuntos son visibles por quien acceda a este enlace.
              </Banner>

              {/* Actions */}
              <div className="flex gap-[var(--ds-space-150)]">
                <Button
                  onClick={handleDownloadQR}
                  variant="outline"
                  className="flex-1 flex items-center justify-center gap-[var(--ds-space-100)]"
                >
                  <QrCode className="h-4 w-4" aria-hidden="true" />
                  Generar Código QR
                </Button>
                <Button
                  onClick={handleViewComplete}
                  className="flex-1 flex items-center justify-center gap-[var(--ds-space-100)]"
                >
                  Vista Completa
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
