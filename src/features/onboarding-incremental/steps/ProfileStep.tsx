import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ProfileStepProps {
  initialName?: string;
  onNext: (fullName: string) => Promise<void>;
  loading: boolean;
}

export function ProfileStep({ initialName = '', onNext, loading }: ProfileStepProps) {
  const [fullName, setFullName] = useState(initialName);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim().length === 0) return;
    await onNext(fullName.trim());
  };

  const canProceed = fullName.trim().length > 0;

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-[var(--ds-font-size-400)] font-semibold text-[var(--ds-text)] mb-[var(--ds-space-050)] tracking-tight">
        Bienvenido a PermitOps
      </h2>
      <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] mb-[var(--ds-space-400)]">
        Comencemos con tu información básica. Paso 1 de 3
      </p>

      <div className="space-y-[var(--ds-space-250)]">
        <div>
          <label className="block text-[var(--ds-font-size-075)] font-medium text-[var(--ds-text)] mb-[var(--ds-space-075)]">
            ¿Cómo te llamas?
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nombre completo"
            disabled={loading}
            autoFocus
            className="w-full bg-white border border-[var(--ds-border)] rounded-[var(--ds-radius-200)] px-[var(--ds-space-150)] py-[var(--ds-space-100)] text-[var(--ds-font-size-100)] text-[var(--ds-text)] placeholder:text-[var(--ds-text-subtlest)] focus:outline-none focus:ring-2 focus:ring-[var(--ds-background-brand)]/20 focus:border-[var(--ds-border-bold)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={!canProceed || loading}
        className="hidden"
      >
        Siguiente
      </Button>
    </form>
  );
}
