import type { ReactNode } from 'react';

type GlassIntensity = 'subtle' | 'medium' | 'strong';

interface GlassCardProps {
  children: ReactNode;
  intensity?: GlassIntensity;
  className?: string;
  onClick?: () => void;
}

const intensityClasses: Record<GlassIntensity, string> = {
  subtle: 'backdrop-blur-sm bg-white/30 border-white/20',
  medium: 'backdrop-blur-md bg-white/20 border-white/30',
  strong: 'backdrop-blur-xl bg-white/10 border-white/40',
};

export function GlassCard({ children, intensity = 'medium', className = '', onClick }: GlassCardProps) {
  return (
    <div
      className={`rounded-2xl border shadow-2xl ${intensityClasses[intensity]} ${onClick ? 'cursor-pointer hover:bg-white/25 transition-all duration-200' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
