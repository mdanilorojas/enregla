import { useState } from 'react';
import { PublicLinkQR } from '@/features/publicLinks/PublicLinkQR';
import { getPublicUrl, deactivatePublicLink } from '@/lib/api/publicLinks';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link2, Copy, QrCode, XCircle, CheckCircle2, Eye, Clock } from 'lucide-react';
import type { PublicLink } from '@/types/database';

interface PublicLinkBannerProps {
  link: PublicLink;
  onLinkDeactivated?: () => void;
}

export function PublicLinkBanner({ link, onLinkDeactivated }: PublicLinkBannerProps) {
  const [copied, setCopied] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const publicUrl = getPublicUrl(link.token);
  const tokenAbbr = `...${link.token.slice(-6)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  };

  const handleDeactivate = async () => {
    const confirmed = window.confirm(
      '¿Estás seguro de desactivar este link público?\n\nEl link dejará de funcionar y el QR ya no será válido.'
    );

    if (!confirmed) return;

    setDeactivating(true);
    try {
      await deactivatePublicLink(link.id);
      onLinkDeactivated?.();
    } catch (err) {
      console.error('Error deactivating link:', err);
      alert('Error al desactivar el link');
    } finally {
      setDeactivating(false);
    }
  };

  const getRelativeTime = (dateString: string | null): string => {
    if (!dateString) return 'nunca';
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: es,
      });
    } catch {
      return 'fecha inválida';
    }
  };

  return (
    <>
      <div className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 shadow-sm">
        <div className="flex items-start gap-4">
          {/* Mini QR Code */}
          <div className="shrink-0">
            <div className="bg-white p-2 rounded-lg border border-blue-200 shadow-sm">
              <PublicLinkQR url={publicUrl} size={80} />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Link2 size={16} className="text-blue-600 shrink-0" />
              <h3 className="text-[14px] font-bold text-blue-900">
                Link Público Activo
              </h3>
            </div>

            <div className="space-y-1.5">
              {/* Label */}
              <div className="flex items-start gap-2">
                <span className="text-[11px] text-blue-600 font-semibold uppercase tracking-wider min-w-[60px]">
                  Etiqueta:
                </span>
                <span className="text-[13px] text-blue-900 font-medium">
                  {link.label}
                </span>
              </div>

              {/* Token */}
              <div className="flex items-start gap-2">
                <span className="text-[11px] text-blue-600 font-semibold uppercase tracking-wider min-w-[60px]">
                  Token:
                </span>
                <span className="text-[13px] text-blue-800 font-mono">
                  {tokenAbbr}
                </span>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5">
                  <Eye size={12} className="text-blue-500" />
                  <span className="text-[12px] text-blue-700 font-medium">
                    Vistas: {link.view_count}
                  </span>
                </div>

                {link.last_viewed_at && (
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className="text-blue-500" />
                    <span className="text-[12px] text-blue-700 font-medium">
                      Último acceso: {getRelativeTime(link.last_viewed_at)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 shrink-0">
            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-blue-200 hover:bg-blue-50 transition-all text-[12px] font-semibold text-blue-700 active:scale-95"
            >
              {copied ? (
                <>
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy size={14} />
                  Copiar Link
                </>
              )}
            </button>

            {/* View QR */}
            <button
              onClick={() => setShowQRModal(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-blue-200 hover:bg-blue-50 transition-all text-[12px] font-semibold text-blue-700 active:scale-95"
            >
              <QrCode size={14} />
              Ver QR
            </button>

            {/* Deactivate */}
            <button
              onClick={handleDeactivate}
              disabled={deactivating}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 transition-all text-[12px] font-semibold text-red-700 active:scale-95 disabled:opacity-50"
            >
              <XCircle size={14} />
              {deactivating ? 'Desactivando...' : 'Desactivar'}
            </button>
          </div>
        </div>
      </div>

      {/* QR Modal */}
      {showQRModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setShowQRModal(false)}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[16px] font-bold text-gray-900">
                    Código QR
                  </h3>
                  <button
                    onClick={() => setShowQRModal(false)}
                    className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                  >
                    <XCircle size={18} className="text-gray-400" />
                  </button>
                </div>

                <div className="flex flex-col items-center">
                  <div className="bg-white p-6 rounded-2xl border-2 border-gray-200">
                    <PublicLinkQR url={publicUrl} size={256} label={link.label} />
                  </div>

                  <p className="text-[12px] text-gray-500 mt-4 text-center">
                    {link.label}
                  </p>
                </div>

                <button
                  onClick={() => setShowQRModal(false)}
                  className="w-full mt-4 px-4 py-3 rounded-xl bg-gray-900 text-white text-[14px] font-semibold hover:bg-gray-800 active:scale-[0.98] transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
