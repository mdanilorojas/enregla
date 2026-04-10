import type { RiskLevel, PermitStatus, TaskPriority } from '@/types';

type BadgeVariant = 'risk' | 'status' | 'priority' | 'neutral';

const riskColors: Record<RiskLevel, string> = {
  critico: 'bg-red-100 text-red-800 ring-red-600/30',
  alto: 'bg-orange-100 text-orange-800 ring-orange-600/30',
  medio: 'bg-amber-100 text-amber-800 ring-amber-600/30',
  bajo: 'bg-emerald-100 text-emerald-800 ring-emerald-600/30',
};

const statusColors: Record<PermitStatus, string> = {
  vigente: 'bg-emerald-100 text-emerald-800 ring-emerald-600/30',
  por_vencer: 'bg-amber-100 text-amber-800 ring-amber-600/30',
  vencido: 'bg-red-100 text-red-800 ring-red-600/30',
  no_registrado: 'bg-slate-100 text-slate-700 ring-slate-500/30',
  en_tramite: 'bg-blue-100 text-blue-800 ring-blue-600/30',
};

const priorityColors: Record<TaskPriority, string> = {
  critica: 'bg-red-100 text-red-800 ring-red-600/30',
  alta: 'bg-orange-100 text-orange-800 ring-orange-600/30',
  media: 'bg-amber-100 text-amber-800 ring-amber-600/30',
  baja: 'bg-slate-100 text-slate-700 ring-slate-500/30',
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  risk?: RiskLevel;
  status?: PermitStatus;
  priority?: TaskPriority;
  pulse?: boolean;
  className?: string;
}

export function Badge({ children, variant = 'neutral', risk, status, priority, pulse, className = '' }: BadgeProps) {
  let colorClass = 'bg-slate-100 text-slate-700 ring-slate-500/30';

  if (variant === 'risk' && risk) colorClass = riskColors[risk];
  if (variant === 'status' && status) colorClass = statusColors[status];
  if (variant === 'priority' && priority) colorClass = priorityColors[priority];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${colorClass} ${pulse ? 'animate-pulse-risk' : ''} ${className}`}
    >
      {children}
    </span>
  );
}
