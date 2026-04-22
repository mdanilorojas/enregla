import { format, parseISO } from 'date-fns';
import { FileText, ExternalLink } from 'lucide-react';

interface PermitCardProps {
  type: string;
  issuer: string | null;
  status: 'vigente' | 'por_vencer' | 'vencido' | 'en_tramite' | 'no_registrado';
  issueDate: string | null;
  expiryDate: string | null;
  hasDocument: boolean;
  documentUrl: string | null;
}

export function PermitCard({
  type,
  issuer,
  status,
  issueDate,
  expiryDate,
  hasDocument,
  documentUrl,
}: PermitCardProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'vigente':
        return '✅';
      case 'por_vencer':
        return '⚠️';
      case 'vencido':
        return '❌';
      case 'no_registrado':
        return '📋';
      default:
        return '📄';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'vigente':
        return 'Vigente';
      case 'por_vencer':
        return 'Por vencer';
      case 'vencido':
        return 'Vencido';
      case 'no_registrado':
        return 'No registrado';
      default:
        return 'En trámite';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'vigente':
        return 'text-green-600';
      case 'por_vencer':
        return 'text-yellow-600';
      case 'vencido':
        return 'text-red-600';
      case 'no_registrado':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const getDaysUntilExpiry = () => {
    if (!expiryDate) return null;
    try {
      const expiry = parseISO(expiryDate);
      const now = new Date();

      // Normalize to midnight
      const expiryStart = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
      const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const days = Math.ceil((expiryStart.getTime() - nowStart.getTime()) / (1000 * 60 * 60 * 24));

      if (days < 0) return 'vencido';
      if (days <= 30) return `${days} días`;
      return null;
    } catch {
      return null;
    }
  };

  return (
    <div className="border border-gray-100 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0" aria-label={`Estado: ${getStatusLabel()}`} role="img">{getStatusIcon()}</span>
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-gray-900 ${getStatusColor()}`}>
            {type}
          </h3>

          {issuer && (
            <p className="text-sm text-gray-600 mt-1">
              {issuer}
            </p>
          )}

          {status === 'no_registrado' ? (
            <p className="text-sm text-gray-500 mt-2">
              Estado: Pendiente de registro
            </p>
          ) : (
            <div className="mt-2 space-y-1">
              {issueDate && (
                <p className="text-sm text-gray-700">
                  Emisión: <span className="font-mono">
                    {(() => {
                      try {
                        return format(parseISO(issueDate), 'dd/MM/yyyy');
                      } catch {
                        return 'Fecha inválida';
                      }
                    })()}
                  </span>
                </p>
              )}
              {expiryDate && (
                <p className="text-sm text-gray-700">
                  Vencimiento: <span className="font-mono">
                    {(() => {
                      try {
                        return format(parseISO(expiryDate), 'dd/MM/yyyy');
                      } catch {
                        return 'Fecha inválida';
                      }
                    })()}
                  </span>
                  {getDaysUntilExpiry() && (
                    <span className={`ml-2 ${getStatusColor()}`}>
                      ({getDaysUntilExpiry()})
                    </span>
                  )}
                </p>
              )}
              {!expiryDate && status === 'vigente' && (
                <p className="text-sm text-gray-700">
                  Vigencia: Indefinida
                </p>
              )}
            </div>
          )}

          {hasDocument && documentUrl ? (
            <a
              href={documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-3 text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              <FileText className="h-4 w-4" />
              Ver documento
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : status !== 'no_registrado' ? (
            <p className="text-xs text-gray-500 mt-3">(sin documento)</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
