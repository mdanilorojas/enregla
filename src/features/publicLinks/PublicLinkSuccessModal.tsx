import { useState, useRef } from 'react';
import { PublicLinkQR } from './PublicLinkQR';
import { getPublicUrl } from '@/lib/api/publicLinks';
import { X, Link2, Copy, Download, Printer, CheckCircle2, ExternalLink } from 'lucide-react';
import type { PublicLink } from '@/types/database';

interface PublicLinkSuccessModalProps {
  link: PublicLink | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PublicLinkSuccessModal({
  link,
  isOpen,
  onClose,
}: PublicLinkSuccessModalProps) {
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !link) return null;

  const publicUrl = getPublicUrl(link.token);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  };

  const handleDownloadQR = () => {
    const downloadButton = qrRef.current?.querySelector('[data-action="download"]') as HTMLButtonElement;
    downloadButton?.click();
  };

  const handlePrintQR = () => {
    const printButton = qrRef.current?.querySelector('[data-action="print"]') as HTMLButtonElement;
    printButton?.click();
  };

  const handleOpenLink = () => {
    window.open(publicUrl, '_blank');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-lg w-full pointer-events-auto transform transition-all max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <CheckCircle2 size={18} className="text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-[16px] font-bold text-gray-900">
                  ¡Link Generado!
                </h2>
                <p className="text-[12px] text-gray-500 mt-0.5">
                  Tu link público está listo
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <X size={18} className="text-gray-400" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* QR Code */}
            <div className="flex flex-col items-center">
              <div className="bg-white p-6 rounded-2xl border-2 border-gray-200 shadow-sm">
                <div ref={qrRef}>
                  <PublicLinkQR
                    url={publicUrl}
                    size={256}
                    label={link.label}
                  />
                </div>
              </div>

              <p className="text-[12px] text-gray-500 mt-4 text-center max-w-sm">
                Escanea este código QR para ver los permisos vigentes
              </p>
            </div>

            {/* Label */}
            {link.label && (
              <div className="bg-blue-50 rounded-xl px-4 py-3 border border-blue-100">
                <p className="text-[11px] text-blue-600 font-semibold uppercase tracking-wider mb-1">
                  Etiqueta
                </p>
                <p className="text-[14px] text-blue-900 font-medium">
                  {link.label}
                </p>
              </div>
            )}

            {/* URL Display */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Link Público
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={publicUrl}
                  readOnly
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-gray-700 font-mono"
                />
                <button
                  onClick={handleOpenLink}
                  className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0"
                  title="Abrir link"
                >
                  <ExternalLink size={16} className="text-gray-600" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={handleCopyLink}
                className="flex flex-col items-center gap-2 px-4 py-4 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-100 transition-all active:scale-95"
              >
                {copied ? (
                  <>
                    <CheckCircle2 size={20} className="text-emerald-600" strokeWidth={2.5} />
                    <span className="text-[12px] font-semibold text-emerald-700">
                      Copiado
                    </span>
                  </>
                ) : (
                  <>
                    <Copy size={20} className="text-blue-600" strokeWidth={2} />
                    <span className="text-[12px] font-semibold text-blue-700">
                      Copiar Link
                    </span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadQR}
                className="flex flex-col items-center gap-2 px-4 py-4 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-100 transition-all active:scale-95"
              >
                <Download size={20} className="text-purple-600" strokeWidth={2} />
                <span className="text-[12px] font-semibold text-purple-700">
                  Descargar QR
                </span>
              </button>

              <button
                onClick={handlePrintQR}
                className="flex flex-col items-center gap-2 px-4 py-4 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-100 transition-all active:scale-95"
              >
                <Printer size={20} className="text-amber-600" strokeWidth={2} />
                <span className="text-[12px] font-semibold text-amber-700">
                  Imprimir QR
                </span>
              </button>
            </div>

            {/* Info Box */}
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
              <Link2 size={16} className="text-blue-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-[12px] text-blue-900 font-medium leading-relaxed">
                  <strong>Tip:</strong> Descarga e imprime el QR para pegarlo en tu sede. Los inspectores podrán verificar tus permisos al instante.
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-full px-4 py-3 rounded-xl bg-gray-900 text-white text-[14px] font-semibold hover:bg-gray-800 active:scale-[0.98] transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
