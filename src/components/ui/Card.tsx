interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
  accent?: 'blue' | 'emerald' | 'amber' | 'red' | 'violet' | 'none';
  glow?: boolean;
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

const accentColors = {
  none: '',
  blue: 'border-l-2 border-l-blue-500',
  emerald: 'border-l-2 border-l-emerald-500',
  amber: 'border-l-2 border-l-amber-500',
  red: 'border-l-2 border-l-red-500',
  violet: 'border-l-2 border-l-violet-500',
};

export function Card({ children, className = '', padding = 'md', hover, onClick, accent = 'none', glow }: CardProps) {
  const glowClass = glow ? 'shadow-lg shadow-blue-500/5' : '';

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-200/60 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] ${paddings[padding]} ${accentColors[accent]} ${hover ? 'hover:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.08)] hover:border-gray-200 transition-all duration-200 cursor-pointer hover:-translate-y-[1px]' : ''} ${glowClass} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}
