import { Badge } from './badge';

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

const statusConfig: Record<PermitStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  vigente: { label: 'Vigente', variant: 'default' },
  por_vencer: { label: 'Por vencer', variant: 'secondary' },
  vencido: { label: 'Vencido', variant: 'destructive' },
  no_registrado: { label: 'No registrado', variant: 'outline' },
  en_tramite: { label: 'En trámite', variant: 'secondary' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
