import { ExternalLink } from '@/lib/lucide-icons';
import type { LegalSource } from '@/types';

const TYPE_LABELS: Record<LegalSource['type'], string> = {
  ley_organica: 'Ley orgánica',
  reglamento: 'Reglamento',
  ordenanza: 'Ordenanza',
  resolucion: 'Resolución',
  decreto: 'Decreto',
  normativa: 'Normativa',
};

const SCOPE_LABELS: Record<LegalSource['scope'], string> = {
  nacional: 'Nacional',
  municipal: 'Municipal',
  institucional: 'Institucional',
};

interface LegalSourceCardProps {
  source: LegalSource;
}

export function LegalSourceCard({ source }: LegalSourceCardProps) {
  return (
    <div className="p-[var(--ds-space-250)] border border-[var(--ds-border)] rounded-[var(--ds-radius-100)] bg-[var(--ds-neutral-50)]">
      <div className="flex items-start justify-between gap-[var(--ds-space-200)]">
        <div className="min-w-0 flex-1">
          <h4 className="text-[var(--ds-font-size-100)] font-semibold text-[var(--ds-text)] leading-snug">
            {source.name}
          </h4>
          {source.shortName && source.shortName !== source.name && (
            <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] mt-[var(--ds-space-025)]">
              {source.shortName}
            </p>
          )}
          {source.articles && (
            <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text)] mt-[var(--ds-space-100)]">
              <span className="text-[var(--ds-text-muted)]">Artículos: </span>
              {source.articles}
            </p>
          )}
          <div className="flex gap-[var(--ds-space-075)] mt-[var(--ds-space-150)] flex-wrap">
            <span className="text-[var(--ds-font-size-050)] px-[var(--ds-space-100)] py-[var(--ds-space-025)] rounded-[var(--ds-radius-050)] bg-[var(--ds-blue-50)] text-[var(--ds-blue-700)] font-medium">
              {TYPE_LABELS[source.type]}
            </span>
            <span className="text-[var(--ds-font-size-050)] px-[var(--ds-space-100)] py-[var(--ds-space-025)] rounded-[var(--ds-radius-050)] bg-white text-[var(--ds-text-subtle)] border border-[var(--ds-border)]">
              {SCOPE_LABELS[source.scope]}
            </span>
            <span className="text-[var(--ds-font-size-050)] px-[var(--ds-space-100)] py-[var(--ds-space-025)] rounded-[var(--ds-radius-050)] bg-white text-[var(--ds-text-subtle)] border border-[var(--ds-border)]">
              {source.entity}
            </span>
          </div>
        </div>
        {source.url && (
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-[var(--ds-space-050)] text-[var(--ds-font-size-075)] text-[var(--ds-blue-700)] hover:text-[var(--ds-blue-800)] hover:underline font-medium"
          >
            Portal oficial
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}
