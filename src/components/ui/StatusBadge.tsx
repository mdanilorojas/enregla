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
  vigente: { label: 'Vigente', variant: 'status-vigente' },
  por_vencer: { label: 'Por vencer', variant: 'status-por-vencer' },
  vencido: { label: 'Vencido', variant: 'status-vencido' },
  no_registrado: { label: 'No registrado', variant: 'status-no-registrado' },
  en_tramite: { label: 'En trámite', variant: 'status-en-tramite' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  if (!config) {
    // console.warn(`Unknown permit status: ${status}`);
    return (
      <Badge variant="default" className={className}>
        {status}
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
