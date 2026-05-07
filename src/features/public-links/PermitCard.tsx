import { format, parseISO } from 'date-fns';
import {
  FileText,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ClipboardList,
  File,
  type LucideIcon,
} from '@/lib/lucide-icons';

interface PermitCardProps {
  type: string;
  issuer: string | null;
  status: 'vigente' | 'por_vencer' | 'vencido' | 'en_tramite' | 'no_registrado';
  issueDate: string | null;
  expiryDate: string | null;
  hasDocument: boolean;
  documentUrl: string | null;
}

type StatusMeta = {
  Icon: LucideIcon;
  label: string;
  textClass: string;
  iconClass: string;
};

const STATUS_META: Record<PermitCardProps['status'], StatusMeta> = {
  vigente: {
    Icon: CheckCircle2,
    label: 'Vigente',
    textClass: 'text-[var(--ds-status-vigente-text)]',
    iconClass: 'text-[var(--ds-status-vigente-text)]',
  },
  por_vencer: {
    Icon: AlertTriangle,
    label: 'Por vencer',
    textClass: 'text-[var(--ds-status-por-vencer-text)]',
    iconClass: 'text-[var(--ds-status-por-vencer-text)]',
  },
  vencido: {
    Icon: XCircle,
    label: 'Vencido',
    textClass: 'text-[var(--ds-status-vencido-text)]',
    iconClass: 'text-[var(--ds-status-vencido-text)]',
  },
  no_registrado: {
    Icon: ClipboardList,
    label: 'No registrado',
    textClass: 'text-[var(--ds-text-subtle)]',
    iconClass: 'text-[var(--ds-text-subtle)]',
  },
  en_tramite: {
    Icon: File,
    label: 'En trámite',
    textClass: 'text-[var(--ds-status-en-tramite-text)]',
    iconClass: 'text-[var(--ds-status-en-tramite-text)]',
  },
};

export function PermitCard({
  type,
  issuer,
  status,
  issueDate,
  expiryDate,
  hasDocument,
  documentUrl,
}: PermitCardProps) {
  const meta = STATUS_META[status] ?? STATUS_META.en_tramite;
  const { Icon, label, textClass, iconClass } = meta;

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
    <div className="border border-[var(--ds-border)] rounded-[var(--ds-radius-300)] p-[var(--ds-space-200)] bg-[var(--ds-neutral-0)] hover:shadow-[var(--ds-shadow-overflow)] transition-shadow">
      <div className="flex items-start gap-[var(--ds-space-150)]">
        <span
          className={`flex-shrink-0 ${iconClass}`}
          aria-label={`Estado: ${label}`}
          role="img"
        >
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-[var(--ds-font-size-200)] ${textClass}`}>
            {type}
          </h3>

          {issuer && (
            <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mt-[var(--ds-space-050)]">
              {issuer}
            </p>
          )}

          {status === 'no_registrado' ? (
            <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtlest)] mt-[var(--ds-space-100)]">
              Estado: Pendiente de registro
            </p>
          ) : (
            <div className="mt-[var(--ds-space-100)] space-y-[var(--ds-space-050)]">
              {issueDate && (
                <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text)]">
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
                <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text)]">
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
                    <span className={`ml-[var(--ds-space-100)] ${textClass}`}>
                      ({getDaysUntilExpiry()})
                    </span>
                  )}
                </p>
              )}
              {!expiryDate && status === 'vigente' && (
                <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text)]">
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
              className="inline-flex items-center gap-[var(--ds-space-100)] mt-[var(--ds-space-150)] text-[var(--ds-font-size-100)] text-[var(--ds-text-brand)] hover:text-[var(--ds-background-brand-hovered)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-background-brand)] focus-visible:ring-offset-2 rounded-[var(--ds-radius-100)] transition-colors"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              Ver documento
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          ) : status !== 'no_registrado' ? (
            <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtlest)] mt-[var(--ds-space-150)]">
              (sin documento)
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
