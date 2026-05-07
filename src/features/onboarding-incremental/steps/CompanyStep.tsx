import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Banner } from '@/components/ui/banner';

interface CompanyData {
  name: string;
  ruc: string;
  city: string;
  business_type: string;
}

interface CompanyStepProps {
  initialData?: Partial<CompanyData>;
  onNext: (data: CompanyData) => Promise<void>;
  loading: boolean;
}

const CITIES = [
  { value: 'Quito', label: 'Quito' },
  { value: 'Guayaquil', label: 'Guayaquil' },
  { value: 'Cuenca', label: 'Cuenca' },
  { value: 'Ambato', label: 'Ambato' },
  { value: 'Manta', label: 'Manta' },
  { value: 'Santo Domingo', label: 'Santo Domingo' },
];

const BUSINESS_TYPES = [
  { value: 'Supermercado', label: 'Supermercado' },
  { value: 'Minimarket', label: 'Minimarket' },
  { value: 'Restaurante', label: 'Restaurante' },
  { value: 'Farmacia', label: 'Farmacia' },
  { value: 'Tienda de conveniencia', label: 'Tienda de conveniencia' },
  { value: 'Cafetería', label: 'Cafetería' },
  { value: 'Panadería', label: 'Panadería' },
  { value: 'Otro', label: 'Otro' },
];

export function CompanyStep({ initialData, onNext, loading }: CompanyStepProps) {
  const [data, setData] = useState<CompanyData>({
    name: initialData?.name || '',
    ruc: initialData?.ruc || '',
    city: initialData?.city || 'Quito',
    business_type: initialData?.business_type || 'Supermercado',
  });

  const updateField = (field: keyof CompanyData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canProceed) return;
    await onNext(data);
  };

  // Validation
  const isRucValid = data.ruc.length === 13 && /^\d+$/.test(data.ruc);
  const showRucError = data.ruc.length > 0 && !isRucValid;
  const canProceed = data.name.trim().length > 0 && isRucValid;

  const baseInputClass =
    'w-full bg-white border rounded-[var(--ds-radius-200)] px-[var(--ds-space-150)] py-[var(--ds-space-100)] text-[var(--ds-font-size-100)] text-[var(--ds-text)] placeholder:text-[var(--ds-text-subtlest)] focus:outline-none focus:ring-2 transition-all disabled:opacity-50';

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-[var(--ds-font-size-400)] font-semibold text-[var(--ds-text)] mb-[var(--ds-space-050)] tracking-tight">
        Datos de la empresa
      </h2>
      <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] mb-[var(--ds-space-400)]">
        Información básica de tu empresa. Paso 2 de 3
      </p>

      <div className="space-y-[var(--ds-space-250)]">
        <div>
          <label className="block text-[var(--ds-font-size-075)] font-medium text-[var(--ds-text)] mb-[var(--ds-space-075)]">
            Nombre de la empresa
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Ej: Supermaxi S.A."
            disabled={loading}
            autoFocus
            className={`${baseInputClass} border-[var(--ds-border)] focus:ring-[var(--ds-background-brand)]/20 focus:border-[var(--ds-border-bold)]`}
          />
        </div>

        <div>
          <label className="block text-[var(--ds-font-size-075)] font-medium text-[var(--ds-text)] mb-[var(--ds-space-075)]">
            RUC
          </label>
          <input
            type="text"
            value={data.ruc}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 13);
              updateField('ruc', value);
            }}
            placeholder="13 dígitos"
            maxLength={13}
            disabled={loading}
            className={`${baseInputClass} ${
              showRucError
                ? 'border-[var(--ds-red-300)] focus:ring-[var(--ds-red-500)]/20 focus:border-[var(--ds-red-400)]'
                : 'border-[var(--ds-border)] focus:ring-[var(--ds-background-brand)]/20 focus:border-[var(--ds-border-bold)]'
            }`}
          />
          {showRucError && (
            <div className="mt-[var(--ds-space-075)]">
              <Banner variant="error">
                El RUC debe tener exactamente 13 dígitos
              </Banner>
            </div>
          )}
        </div>

        <div>
          <label className="block text-[var(--ds-font-size-075)] font-medium text-[var(--ds-text)] mb-[var(--ds-space-075)]">
            Ciudad principal
          </label>
          <select
            value={data.city}
            onChange={(e) => updateField('city', e.target.value)}
            disabled={loading}
            className={`${baseInputClass} border-[var(--ds-border)] focus:ring-[var(--ds-background-brand)]/20 focus:border-[var(--ds-border-bold)]`}
          >
            {CITIES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[var(--ds-font-size-075)] font-medium text-[var(--ds-text)] mb-[var(--ds-space-075)]">
            Tipo de negocio
          </label>
          <select
            value={data.business_type}
            onChange={(e) => updateField('business_type', e.target.value)}
            disabled={loading}
            className={`${baseInputClass} border-[var(--ds-border)] focus:ring-[var(--ds-background-brand)]/20 focus:border-[var(--ds-border-bold)]`}
          >
            {BUSINESS_TYPES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Button type="submit" disabled={!canProceed || loading} className="hidden">
        Siguiente
      </Button>
    </form>
  );
}
