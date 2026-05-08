import { Link } from 'react-router-dom';
import {
  Building2,
  FileText,
  Shield,
  Users,
  AlertTriangle,
  ChevronRight,
} from '@/lib/lucide-icons';
import { Card } from '@/components/ui/card';
import { PERMIT_TYPE_LABELS } from '@/types';
import type { LegalReference } from '@/types';
import { CATEGORY_META, PERMIT_TO_CATEGORY } from '@/data/legal-references';
import { getIssuerShort } from './selectors';

const ICONS = {
  Building2,
  FileText,
  Shield,
  Users,
  AlertTriangle,
} as const;

interface PermitCardProps {
  reference: LegalReference;
}

export function PermitCard({ reference }: PermitCardProps) {
  const category = PERMIT_TO_CATEGORY[reference.permitType];
  const meta = CATEGORY_META[category];
  const Icon = ICONS[meta.iconName];
  const scope = reference.sources[0]?.scope ?? 'nacional';
  const scopeLabel =
    scope === 'nacional' ? 'Nacional' : scope === 'municipal' ? 'Municipal' : 'Institucional';

  return (
    <Link
      to={`/marco-legal/${reference.permitType}`}
      className="block group focus-visible:outline-none"
    >
      <Card
        interactive
        className="p-[var(--ds-space-300)] flex gap-[var(--ds-space-200)] items-start"
      >
        <div className="shrink-0 w-10 h-10 rounded-[var(--ds-radius-100)] bg-[var(--ds-blue-50)] text-[var(--ds-blue-700)] flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-[var(--ds-space-100)]">
            <div className="min-w-0">
              <h3 className="text-[var(--ds-font-size-100)] font-semibold text-[var(--ds-text)] truncate">
                {PERMIT_TYPE_LABELS[reference.permitType]}
              </h3>
              <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] truncate">
                {getIssuerShort(reference)}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 shrink-0 text-[var(--ds-text-muted)] group-hover:text-[var(--ds-text-subtle)] transition-colors mt-0.5" />
          </div>
          <div className="flex gap-[var(--ds-space-075)] mt-[var(--ds-space-150)] flex-wrap">
            <span className="text-[var(--ds-font-size-050)] px-[var(--ds-space-100)] py-[var(--ds-space-025)] rounded-[var(--ds-radius-050)] bg-[var(--ds-blue-50)] text-[var(--ds-blue-700)] font-medium">
              {meta.label}
            </span>
            <span className="text-[var(--ds-font-size-050)] px-[var(--ds-space-100)] py-[var(--ds-space-025)] rounded-[var(--ds-radius-050)] bg-[var(--ds-neutral-50)] text-[var(--ds-text-subtle)] font-medium">
              {scopeLabel}
            </span>
            {reference.estimatedCost?.toLowerCase().includes('gratuit') && (
              <span className="text-[var(--ds-font-size-050)] px-[var(--ds-space-100)] py-[var(--ds-space-025)] rounded-[var(--ds-radius-050)] bg-[var(--ds-green-50)] text-[var(--ds-green-700)] font-medium">
                Gratuito
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
