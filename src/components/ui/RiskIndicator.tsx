import type { RiskLevel } from '@/types';
import { RISK_LABELS } from '@/types';

interface RiskIndicatorProps {
  level: RiskLevel;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const dotColors: Record<RiskLevel, string> = {
  critico: 'bg-red-500',
  alto: 'bg-orange-500',
  medio: 'bg-amber-500',
  bajo: 'bg-emerald-500',
};

const bgColors: Record<RiskLevel, string> = {
  critico: 'bg-red-50 border-red-200/60',
  alto: 'bg-orange-50 border-orange-200/60',
  medio: 'bg-amber-50 border-amber-200/60',
  bajo: 'bg-emerald-50 border-emerald-200/60',
};

const textColors: Record<RiskLevel, string> = {
  critico: 'text-red-600',
  alto: 'text-orange-600',
  medio: 'text-amber-700',
  bajo: 'text-emerald-600',
};

const dotSizes = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
};

export function RiskIndicator({ level, showLabel = true, size = 'md' }: RiskIndicatorProps) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-1 border ${bgColors[level]}`}>
      <span className="relative inline-flex">
        <span className={`rounded-full ${dotColors[level]} ${dotSizes[size]}`} />
        {level === 'critico' && (
          <span className={`absolute inset-0 rounded-full ${dotColors[level]} animate-ping opacity-30`} />
        )}
      </span>
      {showLabel && (
        <span className={`text-[12px] font-semibold ${textColors[level]}`}>
          {RISK_LABELS[level]}
        </span>
      )}
    </span>
  );
}
