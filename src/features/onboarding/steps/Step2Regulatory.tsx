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
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-1 tracking-tight">
        Factores regulatorios
      </h2>
      <p className="text-[13px] text-gray-500 mb-8">
        Selecciona las actividades que aplican a tu negocio. Paso 2 de 4
      </p>

      <div className="space-y-3">
        {FACTORS.map(({ key, label, description }) => {
          const isActive = data[key];
          return (
            <button
              key={key}
              onClick={() => onUpdate({ [key]: !isActive })}
              className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                isActive
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
              }`}
            >
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 shrink-0 transition-all ${
                  isActive
                    ? 'bg-gray-900 border-gray-900'
                    : 'border-gray-300 bg-white'
                }`}
              >
                {isActive && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    className="text-white"
                  >
                    <path
                      d="M2 6L5 9L10 3"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <div className="text-[14px] font-semibold text-gray-900 mb-0.5">
                  {label}
                </div>
                <div className="text-[13px] text-gray-500">{description}</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
        <p className="text-[13px] text-blue-900">
          <strong>Nota:</strong> Estos factores determinan qué permisos se
          auto-generarán para tus locales. Puedes ajustarlos después si es
          necesario.
        </p>
      </div>
    </div>
  );
}
