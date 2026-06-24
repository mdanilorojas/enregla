import { useState } from 'react';
import { Building2, MapPin, FileCheck } from '@/lib/lucide-icons';
import { Button } from '@/components/ui/button';

export interface WelcomeStepProps {
  initialName?: string;
  onNext: (fullName: string) => Promise<void>;
  loading: boolean;
}

const MILESTONES = [
  { icon: Building2, label: 'Creá tu empresa' },
  { icon: MapPin, label: 'Agregá tu primera sede' },
  { icon: FileCheck, label: 'Poné tus permisos en regla' },
];

export function WelcomeStep({ initialName = '', onNext, loading }: WelcomeStepProps) {
  const [fullName, setFullName] = useState(initialName);
  const firstName = (initialName || '').trim().split(' ')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim().length === 0) return;
    await onNext(fullName.trim());
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-[var(--ds-font-size-400)] font-semibold text-[var(--ds-text)] mb-[var(--ds-space-050)] tracking-tight">
        {firstName ? `Hola ${firstName} 👋` : 'Hola 👋'} Bienvenido a EnRegla
      </h2>
      <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mb-[var(--ds-space-400)]">
        Vamos a dejar tu negocio en regla en 3 pasos rápidos. Lo primero: creá tu empresa.
      </p>

      <div className="space-y-[var(--ds-space-150)] mb-[var(--ds-space-400)]">
        {MILESTONES.map(({ icon: Icon, label }, i) => (
          <div key={label} className="flex items-center gap-[var(--ds-space-150)]">
            <div className="w-8 h-8 rounded-full bg-[var(--ds-neutral-100)] flex items-center justify-center text-[var(--ds-font-size-075)] font-semibold text-[var(--ds-text-subtle)] shrink-0">
              {i + 1}
            </div>
            <Icon className="w-4 h-4 text-[var(--ds-text-subtle)]" />
            <span className="text-[var(--ds-font-size-100)] text-[var(--ds-text)]">{label}</span>
          </div>
        ))}
      </div>

      <div>
        <label className="block text-[var(--ds-font-size-075)] font-medium text-[var(--ds-text)] mb-[var(--ds-space-075)]">
          Confirmá tu nombre
        </label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Nombre completo"
          disabled={loading}
          autoFocus
          className="w-full bg-white border border-[var(--ds-border)] rounded-[var(--ds-radius-200)] px-[var(--ds-space-150)] py-[var(--ds-space-100)] text-[var(--ds-font-size-100)] text-[var(--ds-text)] placeholder:text-[var(--ds-text-subtlest)] focus:outline-none focus:ring-2 focus:ring-[var(--ds-background-brand)]/20 focus:border-[var(--ds-border-bold)] transition-all disabled:opacity-50"
        />
      </div>

      <Button type="submit" disabled={fullName.trim().length === 0 || loading} className="hidden">
        Crear mi empresa
      </Button>
    </form>
  );
}
