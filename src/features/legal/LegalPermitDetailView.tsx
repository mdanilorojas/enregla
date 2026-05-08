import { useParams, Link } from 'react-router-dom';
import {
  Building2,
  FileText,
  Shield,
  Users,
  AlertTriangle,
  ArrowLeft,
} from '@/lib/lucide-icons';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { PERMIT_TYPE_LABELS } from '@/types';
import { CATEGORY_META, PERMIT_TO_CATEGORY } from '@/data/legal-references';
import { getPermitByType, getIssuerShort } from './selectors';
import { LegalDisclaimer } from './LegalDisclaimer';
import { PermitDetailTabs } from './PermitDetailTabs';

const ICONS = {
  Building2,
  FileText,
  Shield,
  Users,
  AlertTriangle,
} as const;

export function LegalPermitDetailView() {
  const { permitType } = useParams<{ permitType: string }>();
  const reference = permitType ? getPermitByType(permitType) : null;

  if (!reference) {
    return <PermitNotFound permitType={permitType} />;
  }

  const category = PERMIT_TO_CATEGORY[reference.permitType];
  const meta = CATEGORY_META[category];
  const Icon = ICONS[meta.iconName];
  const label = PERMIT_TYPE_LABELS[reference.permitType];

  return (
    <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-400)]">
      <div className="max-w-4xl mx-auto space-y-[var(--ds-space-300)]">
        <Breadcrumb
          items={[
            { label: 'Marco Legal', href: '/marco-legal' },
            { label },
          ]}
        />

        <header className="bg-white border border-[var(--ds-border)] rounded-[var(--ds-radius-200)] p-[var(--ds-space-400)]">
          <div className="flex gap-[var(--ds-space-250)] items-start">
            <div className="shrink-0 w-12 h-12 rounded-[var(--ds-radius-100)] bg-[var(--ds-blue-50)] text-[var(--ds-blue-700)] flex items-center justify-center">
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-[var(--ds-font-size-400)] font-bold text-[var(--ds-text)] tracking-tight leading-tight">
                {label}
              </h1>
              <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mt-[var(--ds-space-050)]">
                {getIssuerShort(reference)}
              </p>
              <div className="flex gap-[var(--ds-space-075)] mt-[var(--ds-space-200)] flex-wrap">
                <span className="text-[var(--ds-font-size-050)] px-[var(--ds-space-100)] py-[var(--ds-space-025)] rounded-[var(--ds-radius-050)] bg-[var(--ds-blue-50)] text-[var(--ds-blue-700)] font-medium">
                  {meta.label}
                </span>
                {reference.sources[0]?.scope && (
                  <span className="text-[var(--ds-font-size-050)] px-[var(--ds-space-100)] py-[var(--ds-space-025)] rounded-[var(--ds-radius-050)] bg-[var(--ds-neutral-50)] text-[var(--ds-text-subtle)] border border-[var(--ds-border)] font-medium">
                    {reference.sources[0].scope === 'nacional'
                      ? 'Nacional'
                      : reference.sources[0].scope === 'municipal'
                      ? 'Municipal'
                      : 'Institucional'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        <LegalDisclaimer />

        <PermitDetailTabs reference={reference} />
      </div>
    </div>
  );
}

function PermitNotFound({ permitType }: { permitType: string | undefined }) {
  return (
    <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-400)]">
      <div className="max-w-2xl mx-auto space-y-[var(--ds-space-300)]">
        <Breadcrumb
          items={[
            { label: 'Marco Legal', href: '/marco-legal' },
            { label: 'No encontrado' },
          ]}
        />
        <div className="bg-white border border-[var(--ds-border)] rounded-[var(--ds-radius-200)] p-[var(--ds-space-500)] text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-[var(--ds-red-50)] text-[var(--ds-red-700)] flex items-center justify-center mb-[var(--ds-space-250)]">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h1 className="text-[var(--ds-font-size-300)] font-bold text-[var(--ds-text)] mb-[var(--ds-space-100)]">
            Este permiso no está en nuestro registro
          </h1>
          <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mb-[var(--ds-space-300)]">
            {permitType ? (
              <>
                No encontramos información legal sobre <code className="px-[var(--ds-space-075)] py-[var(--ds-space-025)] bg-[var(--ds-neutral-100)] rounded-[var(--ds-radius-050)] text-[var(--ds-font-size-075)]">{permitType}</code>.
              </>
            ) : (
              'Probablemente seguiste un enlace roto.'
            )}{' '}
            Volvé al Marco Legal para ver los permisos disponibles.
          </p>
          <Button asChild variant="default">
            <Link to="/marco-legal">
              <ArrowLeft className="w-4 h-4" />
              Volver al Marco Legal
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
