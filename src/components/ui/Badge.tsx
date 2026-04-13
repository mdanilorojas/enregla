import type { RiskLevel, PermitStatus, TaskPriority } from '@/types';

type BadgeVariant = 'risk' | 'status' | 'priority' | 'neutral';

const riskColors: Record<RiskLevel, string> = {
  critico: 'bg-red-50 text-red-900 border-red-600 border-2',
  alto: 'bg-orange-50 text-orange-900 border-orange-600 border-2',
  medio: 'bg-amber-50 text-amber-900 border-amber-500 border-2',
  bajo: 'bg-emerald-50 text-emerald-900 border-emerald-600 border-2',
};

const statusColors: Record<PermitStatus, string> = {
  vigente: 'bg-emerald-50 text-emerald-900 border-emerald-600 border-2',
  por_vencer: 'bg-amber-50 text-amber-900 border-amber-500 border-2',
  vencido: 'bg-red-50 text-red-900 border-red-600 border-2',
  no_registrado: 'bg-slate-50 text-slate-900 border-slate-500 border-2',
  en_tramite: 'bg-blue-50 text-blue-900 border-blue-600 border-2',
};

const priorityColors: Record<TaskPriority, string> = {
  critica: 'bg-red-50 text-red-900 border-red-600 border-2',
  alta: 'bg-orange-50 text-orange-900 border-orange-600 border-2',
  media: 'bg-amber-50 text-amber-900 border-amber-500 border-2',
  baja: 'bg-slate-50 text-slate-900 border-slate-500 border-2',
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
  let colorClass = 'bg-slate-50 text-slate-900 border-slate-500 border-2';

  if (variant === 'risk' && risk) colorClass = riskColors[risk];
  if (variant === 'status' && status) colorClass = statusColors[status];
  if (variant === 'priority' && priority) colorClass = priorityColors[priority];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-widest ${colorClass} ${pulse ? 'animate-pulse-risk' : ''} ${className}`}
    >
      {children}
    </span>
  );
}
