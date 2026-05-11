import { useIssuer } from '@/lib/domain/issuers';
import { useRequirementFor } from '@/lib/domain/permit-requirements';
import { useCompany } from '@/hooks/useCompany';
import { Card } from '@/components/ui/card';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { CostRangeLabel } from '@/components/ui/CostRangeLabel';
import { ExternalLink } from '@/lib/lucide-icons';

interface Props {
  permit: {
    id: string;
    type: string;
    issuer_id?: string | null;
    company_id: string | null;
  };
}

export function PermitInfoCard({ permit }: Props) {
  const { data: company } = useCompany(permit.company_id ?? undefined);
  const issuer = useIssuer(permit.issuer_id ?? null);
  const req = useRequirementFor(permit.type, company?.business_type);

  return (
    <Card className="p-[var(--ds-space-300)]">
      <div className="text-[var(--ds-font-size-100)] font-semibold mb-[var(--ds-space-200)]">Información del trámite</div>
      <div className="flex flex-col gap-[var(--ds-space-150)] text-sm">
        <div className="flex justify-between items-center">
          <span className="text-[var(--ds-text-subtle)]">Emisor</span>
          {issuer ? (
            <div className="flex items-center gap-2">
              <span className="font-medium">{issuer.short_name}</span>
              {issuer.portal_url && (
                <a href={issuer.portal_url} target="_blank" rel="noopener noreferrer" className="text-[var(--ds-text-brand)]" aria-label={`Portal de ${issuer.name}`}>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          ) : (
            <span className="text-[var(--ds-text-subtlest)] italic">no definido</span>
          )}
        </div>

        <div className="flex justify-between items-center">
          <span className="text-[var(--ds-text-subtle)]">Costo estimado</span>
          <CostRangeLabel min={req?.cost_min} max={req?.cost_max} currency={req?.cost_currency ?? 'USD'} />
        </div>
        {req?.cost_notes && (
          <div className="text-xs text-[var(--ds-text-subtle)] -mt-2 pl-0 text-right">{req.cost_notes}</div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-[var(--ds-text-subtle)]">Multa si no se regulariza</span>
          <CostRangeLabel min={req?.fine_min} max={req?.fine_max} />
        </div>
        {req?.fine_source && (
          <div className="text-xs text-[var(--ds-text-subtle)] -mt-2 pl-0 text-right">{req.fine_source}</div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-[var(--ds-text-subtle)]">Rol requerido</span>
          {req ? <RoleBadge role={req.required_role} variant="full" /> : <span className="text-[var(--ds-text-subtlest)] italic">no definido</span>}
        </div>

        {req?.applies_when && (
          <div className="text-xs text-[var(--ds-text-subtle)] pt-2 border-t border-[var(--ds-border)]">
            <strong>Aplica cuando:</strong> {req.applies_when}
          </div>
        )}
      </div>
    </Card>
  );
}
