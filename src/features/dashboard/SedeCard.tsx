import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { RiskBadge, type RiskLevel } from '@/components/ui/RiskBadge';
import { MapPin, ChevronRight, FileText } from '@/lib/lucide-icons';

interface SedeCardProps {
  sede: {
    id: string;
    name: string;
    address?: string;
  };
  permitCounts: {
    vigentes: number;
    total: number;
  };
  onClick?: () => void;
}

function SedeCardComponent({ sede, permitCounts, onClick }: SedeCardProps) {
  const compliancePercent = permitCounts.total > 0
    ? Math.round((permitCounts.vigentes / permitCounts.total) * 100)
    : 0;

  // Risk level based on compliance
  const getRiskLevel = (): RiskLevel => {
    if (permitCounts.total === 0) return 'critico';
    if (compliancePercent >= 90) return 'bajo';
    if (compliancePercent >= 75) return 'medio';
    if (compliancePercent >= 60) return 'alto';
    return 'critico';
  };

  const riskLevel = getRiskLevel();

  // Progress bar color (uses current DS tokens)
  const progressColors: Record<RiskLevel, string> = {
    bajo: 'var(--ds-risk-bajo)',
    medio: 'var(--ds-risk-medio)',
    alto: 'var(--ds-risk-alto)',
    critico: 'var(--ds-risk-critico)',
  };

  return (
    <Card
      interactive
      className="group"
      onClick={onClick}
    >
      <CardContent className="p-5">
        {/* Header: Icon + Name + Chevron */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-lg bg-[var(--ds-neutral-100)] flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--ds-background-brand)] transition-colors duration-200">
              <MapPin
                size={18}
                className="text-[var(--ds-text-brand)] group-hover:text-white transition-colors duration-200"
                strokeWidth={2}
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-[var(--ds-text)] text-[var(--ds-font-size-200)] leading-tight truncate group-hover:text-[var(--ds-text-brand)] transition-colors duration-200">
                {sede.name}
              </h3>
              <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtlest)] mt-0.5 truncate">
                {sede.address || 'Sin dirección'}
              </p>
            </div>
          </div>
          <ChevronRight
            size={18}
            className="text-[var(--ds-text-subtlest)] group-hover:text-[var(--ds-text-brand)] transition-all duration-200 group-hover:translate-x-1 flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
        </div>

        {/* Compliance section */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">
              <FileText size={12} strokeWidth={2} aria-hidden="true" />
              <span>
                <strong className="text-[var(--ds-text)] font-semibold">
                  {permitCounts.vigentes}
                </strong>
                <span className="text-[var(--ds-text-subtlest)]"> / {permitCounts.total}</span>
                <span className="ml-1">permisos</span>
              </span>
            </div>
            <RiskBadge level={riskLevel} />
          </div>

          {/* Progress bar */}
          <div
            className="h-2 w-full rounded-full bg-[var(--ds-neutral-100)] overflow-hidden"
            role="progressbar"
            aria-valuenow={compliancePercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Cumplimiento: ${compliancePercent}%`}
          >
            <div
              className="h-full rounded-full transition-all duration-500 ease-[var(--ds-ease-out)]"
              style={{
                width: `${compliancePercent}%`,
                backgroundColor: progressColors[riskLevel],
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const SedeCard = memo(SedeCardComponent);
