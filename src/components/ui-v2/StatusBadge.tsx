import { Badge, badgeVariants } from './badge';
import type { VariantProps } from 'class-variance-authority';

export type PermitStatus =
  | 'vigente'
  | 'por_vencer'
  | 'vencido'
  | 'no_registrado'
  | 'en_tramite';

interface StatusBadgeProps {
  status: PermitStatus;
  className?: string;
}

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

const statusConfig: Record<PermitStatus, { label: string; variant: BadgeVariant }> = {
  vigente: { label: 'Vigente', variant: 'default' },
  por_vencer: { label: 'Por vencer', variant: 'secondary' },
  vencido: { label: 'Vencido', variant: 'destructive' },
  no_registrado: { label: 'No registrado', variant: 'outline' },
  en_tramite: { label: 'En trámite', variant: 'secondary' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  if (!config) {
    console.warn(`Unknown permit status: ${status}`);
    return (
      <Badge variant="outline" className={className}>
        {status}
      </Badge>
    );
  }

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
