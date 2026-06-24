import { AlertCircle, FileText } from '@/lib/lucide-icons';

export interface PermitRequirementCardProps {
  permitTypeLabel: string;
  issuerLabel: string | null;
  isMandatory: boolean;
  costLabel: string | null;
  fineLabel: string | null;
  appliesWhen: string | null;
}

export function PermitRequirementCard({
  permitTypeLabel, issuerLabel, isMandatory, costLabel, fineLabel, appliesWhen,
}: PermitRequirementCardProps) {
  return (
    <div className="border border-[var(--ds-border)] rounded-[var(--ds-radius-300)] bg-white p-[var(--ds-space-250)]">
      <div className="flex items-start gap-[var(--ds-space-150)]">
        <FileText className="w-5 h-5 text-[var(--ds-text-subtle)] mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-[var(--ds-space-100)] flex-wrap">
            <span className="text-[var(--ds-font-size-100)] font-semibold text-[var(--ds-text)]">
              {permitTypeLabel}
            </span>
            {isMandatory && (
              <span className="text-[var(--ds-font-size-075)] font-semibold px-[var(--ds-space-100)] py-0.5 rounded-full bg-[var(--ds-orange-100,#ffedd5)] text-[var(--ds-orange-700,#c2410c)]">
                Obligatorio
              </span>
            )}
          </div>
          {issuerLabel && (
            <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] mt-0.5">
              Emite: {issuerLabel}
            </p>
          )}
          {appliesWhen && (
            <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] mt-0.5">
              Aplica cuando: {appliesWhen}
            </p>
          )}
          <div className="flex flex-wrap gap-[var(--ds-space-200)] mt-[var(--ds-space-100)]">
            {costLabel && (
              <span className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">
                Costo estimado: <b className="text-[var(--ds-text)]">{costLabel}</b>
              </span>
            )}
            {fineLabel && (
              <span className="text-[var(--ds-font-size-075)] text-[var(--ds-red-600,#dc2626)] inline-flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Multa: {fineLabel}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
