interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md';
  color?: 'auto' | 'emerald' | 'amber' | 'red' | 'blue';
  className?: string;
}

export function ProgressBar({ value, max = 100, size = 'sm', color = 'auto', className = '' }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  let barColor: string;
  let bgTint: string;
  if (color === 'auto') {
    barColor = pct >= 80 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : pct >= 50 ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-gradient-to-r from-red-500 to-red-400';
    bgTint = pct >= 80 ? 'bg-emerald-100/50' : pct >= 50 ? 'bg-amber-100/50' : 'bg-red-100/50';
  } else {
    const colorMap = {
      emerald: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
      amber: 'bg-gradient-to-r from-amber-500 to-amber-400',
      red: 'bg-gradient-to-r from-red-500 to-red-400',
      blue: 'bg-gradient-to-r from-blue-500 to-blue-400',
    };
    barColor = colorMap[color];
    bgTint = 'bg-gray-100';
  }

  return (
    <div className={`w-full ${bgTint} rounded-full overflow-hidden ${size === 'sm' ? 'h-1.5' : 'h-2.5'} ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-700 ${barColor}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
