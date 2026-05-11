import type { RequiredRole } from '@/lib/domain/permit-roles';
import { REQUIRED_ROLE_LABELS, REQUIRED_ROLE_SHORT } from '@/lib/domain/permit-roles';
import { cn } from '@/lib/utils';

interface RoleBadgeProps {
  role: RequiredRole;
  variant?: 'full' | 'short';
  className?: string;
}

const COLOR_BY_ROLE: Record<RequiredRole, string> = {
  anyone: 'bg-[var(--ds-neutral-100)] text-[var(--ds-text-subtle)]',
  representante_legal: 'bg-blue-100 text-blue-700',
  contador: 'bg-teal-100 text-teal-800',
  tecnico_responsable: 'bg-amber-100 text-amber-800',
};

export function RoleBadge({ role, variant = 'short', className }: RoleBadgeProps) {
  const label = variant === 'short' ? REQUIRED_ROLE_SHORT[role] : REQUIRED_ROLE_LABELS[role];
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold tracking-wide',
        COLOR_BY_ROLE[role],
        className
      )}
      title={REQUIRED_ROLE_LABELS[role]}
    >
      {label}
    </span>
  );
}
