import { CheckCircle2 } from '@/lib/lucide-icons';
import { Button } from '@/components/ui/button';

export interface StepInterludeProps {
  title: string;
  subtitle?: string;
  ctaLabel: string;
  onContinue: () => void;
}

export function StepInterlude({ title, subtitle, ctaLabel, onContinue }: StepInterludeProps) {
  return (
    <div className="flex flex-col items-center text-center py-[var(--ds-space-600)]">
      <div className="w-16 h-16 rounded-full bg-[var(--ds-status-vigente-bg,#f0fdf4)] flex items-center justify-center mb-[var(--ds-space-300)]">
        <CheckCircle2 className="w-8 h-8 text-[var(--ds-status-vigente-text,#15803d)]" />
      </div>
      <h2 className="text-[var(--ds-font-size-400)] font-semibold text-[var(--ds-text)] tracking-tight mb-[var(--ds-space-100)]">
        {title}
      </h2>
      {subtitle && (
        <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] max-w-md mb-[var(--ds-space-400)]">
          {subtitle}
        </p>
      )}
      <Button onClick={onContinue}>{ctaLabel}</Button>
    </div>
  );
}
