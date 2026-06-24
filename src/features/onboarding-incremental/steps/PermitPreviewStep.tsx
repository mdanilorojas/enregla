import { usePermitRequirements } from '@/lib/domain/permit-requirements';
import { permitTypeLabel } from '@/lib/domain/permit-types';
import { businessTypeLabel } from '@/lib/domain/business-types';
import { useIssuers } from '@/lib/domain/issuers';
import { Banner } from '@/components/ui/banner';
import { Loader2 } from '@/lib/lucide-icons';
import type { BusinessType } from '@/lib/domain/business-types';
import { PermitRequirementCard } from '../components/PermitRequirementCard';

export interface PermitPreviewStepProps {
  businessType: string;
}

function money(min: number | null, max: number | null, currency: string | null): string | null {
  if (min == null && max == null) return null;
  const cur = currency ?? 'USD';
  if (min != null && max != null && min !== max) return `$${min}–$${max} ${cur}`;
  const v = min ?? max;
  return `$${v} ${cur}`;
}

export function PermitPreviewStep({ businessType }: PermitPreviewStepProps) {
  const { data, isLoading, error } = usePermitRequirements(businessType as BusinessType);
  const { data: issuers } = useIssuers();

  const issuerName = (id: string | null): string | null => {
    if (!id || !issuers) return null;
    const found = issuers.find((x) => x.id === id);
    return found?.name ?? null;
  };

  return (
    <div>
      <h2 className="text-[var(--ds-font-size-400)] font-semibold text-[var(--ds-text)] mb-[var(--ds-space-050)] tracking-tight">
        Para un {businessTypeLabel(businessType)} vas a necesitar estos permisos
      </h2>
      <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mb-[var(--ds-space-400)]">
        Todavía no tenés que hacer nada — primero creemos tu sede. Después te ayudamos a sacarlos.
      </p>

      {isLoading && (
        <div className="flex items-center gap-[var(--ds-space-100)] text-[var(--ds-text-subtle)]">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando permisos…
        </div>
      )}

      {error && (
        <Banner variant="info">
          No pudimos cargar el detalle ahora. Los vas a ver en el dashboard después de crear tu sede.
        </Banner>
      )}

      {!isLoading && !error && (!data || data.length === 0) && (
        <Banner variant="info">
          Vamos a generar los permisos base de tu negocio (RUC, patente municipal y los que
          apliquen) cuando crees tu sede.
        </Banner>
      )}

      {!isLoading && !error && data && data.length > 0 && (
        <div className="space-y-[var(--ds-space-200)]">
          {data.map((req) => (
            <PermitRequirementCard
              key={req.id}
              permitTypeLabel={permitTypeLabel(req.permit_type)}
              issuerLabel={issuerName(req.issuer_id)}
              isMandatory={req.is_mandatory}
              costLabel={money(req.cost_min, req.cost_max, req.cost_currency)}
              fineLabel={money(req.fine_min, req.fine_max, null)}
              appliesWhen={req.applies_when}
            />
          ))}
        </div>
      )}
    </div>
  );
}
