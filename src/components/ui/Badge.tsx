import type { RiskLevel, PermitStatus, TaskPriority } from '@/types';

type BadgeVariant = 'risk' | 'status' | 'priority' | 'neutral';

const riskColors: Record<RiskLevel, string> = {
  critico: 'bg-red-50 text-red-600',
  alto: 'bg-orange-50 text-[#FF5A1F]',
  medio: 'bg-amber-50 text-amber-600',
  bajo: 'bg-emerald-50 text-emerald-600',
};

const statusColors: Record<PermitStatus, string> = {
  vigente: 'bg-[#10B981]/10 text-[#059669]',
  por_vencer: 'bg-amber-100/50 text-amber-700',
  vencido: 'bg-red-100/50 text-red-700',
  no_registrado: 'bg-slate-100 text-slate-500',
};

const priorityColors: Record<TaskPriority, string> = {
  critica: 'bg-red-50 text-red-600',
  alta: 'bg-orange-50 text-[#FF5A1F]',
  media: 'bg-amber-50 text-amber-600',
  baja: 'bg-slate-50 text-slate-500',
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
  let colorClass = 'bg-slate-100/50 text-slate-600';

  if (variant === 'risk' && risk) colorClass = riskColors[risk];
  if (variant === 'status' && status) colorClass = statusColors[status];
  if (variant === 'priority' && priority) colorClass = priorityColors[priority];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold tracking-normal ${colorClass} ${pulse ? 'animate-pulse-risk' : ''} ${className}`}
    >
      {children}
    </span>
  );
}
