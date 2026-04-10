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
  critica: 'bg-red-50 text-red-600 ring-red-500/20',
  alta: 'bg-orange-50 text-orange-600 ring-orange-500/20',
  media: 'bg-yellow-50 text-yellow-700 ring-yellow-500/20',
  baja: 'bg-gray-50 text-gray-500 ring-gray-400/20',
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
  let colorClass = 'bg-gray-50 text-gray-600 ring-gray-400/20';

  if (variant === 'risk' && risk) colorClass = riskColors[risk];
  if (variant === 'status' && status) colorClass = statusColors[status];
  if (variant === 'priority' && priority) colorClass = priorityColors[priority];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${colorClass} ${pulse ? 'animate-pulse-risk' : ''} ${className}`}
    >
      {children}
    </span>
  );
}
