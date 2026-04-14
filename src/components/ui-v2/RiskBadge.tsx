import { Badge } from './badge';

export type RiskLevel = 'bajo' | 'medio' | 'alto' | 'critico';

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
}

const riskConfig: Record<RiskLevel, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  bajo: { label: 'Bajo', variant: 'default' },
  medio: { label: 'Medio', variant: 'secondary' },
  alto: { label: 'Alto', variant: 'secondary' },
  critico: { label: 'Crítico', variant: 'destructive' },
};

export function RiskBadge({ level, className }: RiskBadgeProps) {
  const config = riskConfig[level];

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
