import { Card, CardContent } from '@/components/ui/card';
import { RiskBadge, type RiskLevel } from '@/components/ui/RiskBadge';
import { MapPin, ChevronRight, FileText } from 'lucide-react';

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

export function SedeCard({ sede, permitCounts, onClick }: SedeCardProps) {
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

  // Progress bar color
  const progressColors: Record<RiskLevel, string> = {
    bajo: 'var(--color-risk-bajo)',
    medio: 'var(--color-risk-medio)',
    alto: 'var(--color-risk-alto)',
    critico: 'var(--color-risk-critico)',
  };

  return (
    <Card
      className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-[var(--color-primary)]/20"
      onClick={onClick}
    >
      <CardContent className="p-5">
        {/* Header: Icon + Name + Chevron */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-lg bg-[var(--color-surface)] flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--color-primary)]/5 transition-colors">
              <MapPin
                size={16}
                className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)] transition-colors"
                strokeWidth={2}
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-[var(--color-text)] text-sm leading-tight truncate">
                {sede.name}
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate">
                {sede.address || 'Sin dirección'}
              </p>
            </div>
          </div>
          <ChevronRight
            size={16}
            className="text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-all group-hover:translate-x-0.5 flex-shrink-0 mt-1"
          />
        </div>

        {/* Compliance section */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
              <FileText size={12} strokeWidth={2} />
              <span>
                <strong className="text-[var(--color-text)] font-semibold">
                  {permitCounts.vigentes}
                </strong>
                <span className="text-[var(--color-text-muted)]"> / {permitCounts.total}</span>
                <span className="ml-1">permisos</span>
              </span>
            </div>
            <RiskBadge level={riskLevel} />
          </div>

          {/* Progress bar */}
          <div className="h-1.5 w-full rounded-full bg-[var(--color-surface)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
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
