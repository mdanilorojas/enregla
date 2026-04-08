interface ComplianceGaugeProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function ComplianceGauge({ percentage, size = 130, strokeWidth = 8, label }: ComplianceGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const isGood = percentage >= 80;
  const isWarning = percentage >= 50 && percentage < 80;

  const gradientId = `gauge-grad-${size}`;
  const glowId = `gauge-glow-${size}`;

  const colorStart = isGood ? '#10B981' : isWarning ? '#F59E0B' : '#EF4444';
  const colorEnd = isGood ? '#059669' : isWarning ? '#D97706' : '#DC2626';
  const glowColor = isGood ? 'rgba(16,185,129,0.35)' : isWarning ? 'rgba(245,158,11,0.35)' : 'rgba(239,68,68,0.35)';
  const ringBg = isGood ? 'rgba(16,185,129,0.08)' : isWarning ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)';
  const textColor = isGood ? 'text-emerald-600' : isWarning ? 'text-amber-600' : 'text-red-600';
  const statusText = isGood ? 'Excelente' : isWarning ? 'Atención' : 'Crítico';
  const statusBg = isGood ? 'bg-emerald-50 text-emerald-600 ring-emerald-500/20' : isWarning ? 'bg-amber-50 text-amber-700 ring-amber-500/20' : 'bg-red-50 text-red-600 ring-red-500/20';

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colorStart} />
              <stop offset="100%" stopColor={colorEnd} />
            </linearGradient>
            <filter id={glowId}>
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feFlood floodColor={glowColor} result="color" />
              <feComposite in="color" in2="blur" operator="in" result="shadow" />
              <feMerge>
                <feMergeNode in="shadow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={ringBg}
            strokeWidth={strokeWidth + 2}
          />

          {/* Subtle track line */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-100"
          />

          {/* Progress arc with gradient and glow */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            filter={`url(#${glowId})`}
            className="animate-gauge-fill"
            style={{
              '--gauge-circumference': circumference,
              '--gauge-offset': offset,
            } as React.CSSProperties}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold tracking-tight ${textColor}`}>
            {percentage}
            <span className="text-lg font-semibold opacity-60">%</span>
          </span>
        </div>
      </div>

      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${statusBg}`}>
        {statusText}
      </span>

      {label && <span className="text-[12px] text-gray-500 font-medium">{label}</span>}
    </div>
  );
}
