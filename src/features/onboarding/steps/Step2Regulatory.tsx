import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface RegulatoryFactors {
  alimentos: boolean;
  alcohol: boolean;
  salud: boolean;
  quimicos: boolean;
}

interface Props {
  data: RegulatoryFactors;
  onUpdate: (partial: Partial<RegulatoryFactors>) => void;
}

const FACTORS = [
  {
    key: 'alimentos' as const,
    label: 'Alimentos',
    description: 'Venta, preparación o manipulación de alimentos',
  },
  {
    key: 'alcohol' as const,
    label: 'Alcohol',
    description: 'Venta o consumo de bebidas alcohólicas',
  },
  {
    key: 'salud' as const,
    label: 'Salud',
    description: 'Productos farmacéuticos o servicios de salud',
  },
  {
    key: 'quimicos' as const,
    label: 'Químicos',
    description: 'Sustancias químicas controladas',
  },
];

export function Step2Regulatory({ data, onUpdate }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-text mb-2">
          Factores regulatorios
        </h2>
        <p className="text-sm text-text-secondary">
          Selecciona las actividades que aplican a tu negocio. Paso 2 de 4
        </p>
      </div>

      <div className="space-y-4">
        {FACTORS.map(({ key, label, description }) => {
          const isActive = data[key];
          return (
            <div
              key={key}
              className="flex items-start space-x-3 rounded-lg border border-border p-4 transition-all hover:border-primary/50 hover:bg-surface"
            >
              <Checkbox
                id={key}
                checked={isActive}
                onCheckedChange={(checked) => onUpdate({ [key]: checked === true })}
                className="mt-0.5"
              />
              <div className="space-y-1 flex-1">
                <Label
                  htmlFor={key}
                  className="text-sm font-semibold text-text cursor-pointer"
                >
                  {label}
                </Label>
                <p className="text-xs text-text-secondary">{description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-info-border bg-info-bg p-4">
        <p className="text-sm text-text">
          <strong>Nota:</strong> Estos factores determinan qué permisos se
          auto-generarán para tus locales. Puedes ajustarlos después si es
          necesario.
        </p>
      </div>
    </div>
  );
}
