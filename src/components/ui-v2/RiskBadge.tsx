import { Badge, badgeVariants } from './badge';
import type { VariantProps } from 'class-variance-authority';

export type RiskLevel = 'bajo' | 'medio' | 'alto' | 'critico';

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
}

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

const riskConfig: Record<RiskLevel, { label: string; variant: BadgeVariant }> = {
  bajo: { label: 'Bajo', variant: 'default' },
  medio: { label: 'Medio', variant: 'secondary' },
  alto: { label: 'Alto', variant: 'secondary' },
  critico: { label: 'Crítico', variant: 'destructive' },
};

export function RiskBadge({ level, className }: RiskBadgeProps) {
  const config = riskConfig[level];

  if (!config) {
    console.warn(`Unknown risk level: ${level}`);
    return (
      <Badge variant="outline" className={className}>
        {level}
      </Badge>
    );
  }

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
