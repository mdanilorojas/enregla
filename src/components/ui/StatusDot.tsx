import type { RiskLevel, PermitStatus } from '@/types';

const riskDotColors: Record<RiskLevel, string> = {
  critico: 'bg-red-500',
  alto: 'bg-orange-500',
  medio: 'bg-yellow-500',
  bajo: 'bg-emerald-500',
};

const statusDotColors: Record<PermitStatus, string> = {
  vigente: 'bg-emerald-500',
  por_vencer: 'bg-yellow-500',
  vencido: 'bg-red-500',
  no_registrado: 'bg-gray-400',
  en_tramite: 'bg-blue-500',
};

interface StatusDotProps {
  risk?: RiskLevel;
  status?: PermitStatus;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

const sizes = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
};

export function StatusDot({ risk, status, size = 'md', pulse }: StatusDotProps) {
  let color = 'bg-gray-400';
  if (risk) color = riskDotColors[risk];
  if (status) color = statusDotColors[status];

  return (
    <span className="relative inline-flex shrink-0">
      <span className={`rounded-full ${color} ${sizes[size]}`} />
      {pulse && (
        <span className={`absolute inset-0 rounded-full ${color} animate-ping opacity-30`} />
      )}
    </span>
  );
}
