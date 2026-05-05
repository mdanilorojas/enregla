import { Badge, badgeVariants } from './badge';
import type { VariantProps } from 'class-variance-authority';

export type RiskLevel = 'bajo' | 'medio' | 'alto' | 'critico';

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
}

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

const riskConfig: Record<RiskLevel, { label: string; variant: BadgeVariant }> = {
  bajo: { label: 'Bajo', variant: 'risk-bajo' },
  medio: { label: 'Medio', variant: 'risk-medio' },
  alto: { label: 'Alto', variant: 'risk-alto' },
  critico: { label: 'Crítico', variant: 'risk-critico' },
};

export function RiskBadge({ level, className }: RiskBadgeProps) {
  const config = riskConfig[level];

  if (!config) {
    // console.warn(`Unknown risk level: ${level}`);
    return (
      <Badge variant="outline" className={className}>
        {level}
      </Badge>
    );
  }

  return (
    <Badge variant={config.variant} className={className}>
      <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
      {config.label}
    </Badge>
  );
}
