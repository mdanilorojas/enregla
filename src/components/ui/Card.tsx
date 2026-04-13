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
  blue: 'border-l-3 border-l-[--color-primary]',
  emerald: 'border-l-3 border-l-emerald-600',
  amber: 'border-l-3 border-l-amber-500',
  red: 'border-l-3 border-l-red-600',
  violet: 'border-l-3 border-l-violet-600',
};

export function Card({ children, className = '', padding = 'md', hover, onClick, accent = 'none', glow }: CardProps) {
  const glowClass = glow ? 'shadow-lg shadow-blue-500/5' : '';
  const baseClasses = 'bg-white rounded-2xl border border-slate-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05),0_10px_20px_-4px_rgba(0,0,0,0.02)]';
  const hoverClasses = hover ? 'hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.08),0_24px_32px_-12px_rgba(0,0,0,0.04)] hover:border-slate-200 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer hover:-translate-y-1' : '';
  const interactiveClasses = onClick ? 'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[--color-primary]' : '';

  return (
    <div
      className={`${baseClasses} ${paddings[padding]} ${accentColors[accent]} ${hoverClasses} ${interactiveClasses} ${glowClass} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {children}
    </div>
  );
}
