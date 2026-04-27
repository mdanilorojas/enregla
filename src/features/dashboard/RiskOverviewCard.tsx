import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RiskBadge, type RiskLevel } from '@/components/ui/RiskBadge';
import { ShieldCheck, ShieldAlert, AlertTriangle, ShieldX } from 'lucide-react';

interface RiskOverviewCardProps {
  metrics: {
    vigentes: number;
    porVencer: number;
    faltantes: number;
    compliance: number;
  };
}

export function RiskOverviewCard({ metrics }: RiskOverviewCardProps) {
  const getRiskLevel = (): RiskLevel => {
    if (metrics.compliance >= 90) return 'bajo';
    if (metrics.compliance >= 75) return 'medio';
    if (metrics.compliance >= 60) return 'alto';
    return 'critico';
  };

  const riskLevel = getRiskLevel();

  // Progress bar color based on risk level
  const progressColors: Record<RiskLevel, string> = {
    bajo: 'var(--color-risk-bajo)',
    medio: 'var(--color-risk-medio)',
    alto: 'var(--color-risk-alto)',
    critico: 'var(--color-risk-critico)',
  };

  const riskIcons: Record<RiskLevel, React.ReactNode> = {
    bajo: <ShieldCheck size={20} style={{ color: 'var(--color-risk-bajo)' }} />,
    medio: <ShieldAlert size={20} style={{ color: 'var(--color-risk-medio)' }} />,
    alto: <AlertTriangle size={20} style={{ color: 'var(--color-risk-alto)' }} />,
    critico: <ShieldX size={20} style={{ color: 'var(--color-risk-critico)' }} />,
  };

  const progressColor = progressColors[riskLevel];
  const compliancePct = Math.round(metrics.compliance);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-4">
        <div className="flex items-center gap-2">
          {riskIcons[riskLevel]}
          <CardTitle className="text-base font-semibold">Estado General de Cumplimiento</CardTitle>
        </div>
        <RiskBadge level={riskLevel} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-3">
          <span
            className="text-5xl font-bold leading-none tracking-tight"
            style={{ color: progressColor }}
          >
            {compliancePct}%
          </span>
          <span className="text-sm text-[var(--color-text-secondary)] pb-1">
            de permisos al día
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full rounded-full bg-[var(--color-surface)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${compliancePct}%`,
              backgroundColor: progressColor,
            }}
          />
        </div>

        <div className="flex flex-wrap gap-6 pt-2">
          <span className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: 'var(--color-status-vigente)' }}
            />
            <span className="text-sm">
              <strong className="text-[var(--color-text)] font-bold text-base">{metrics.vigentes}</strong>
              <span className="text-[var(--color-text-secondary)] ml-1">vigentes</span>
            </span>
          </span>
          <span className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: 'var(--color-status-por-vencer)' }}
            />
            <span className="text-sm">
              <strong className="text-[var(--color-text)] font-bold text-base">{metrics.porVencer}</strong>
              <span className="text-[var(--color-text-secondary)] ml-1">por vencer</span>
            </span>
          </span>
          <span className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: 'var(--color-status-vencido)' }}
            />
            <span className="text-sm">
              <strong className="text-[var(--color-text)] font-bold text-base">{metrics.faltantes}</strong>
              <span className="text-[var(--color-text-secondary)] ml-1">faltantes</span>
            </span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
