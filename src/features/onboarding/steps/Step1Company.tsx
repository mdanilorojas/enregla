interface CompanyData {
  name: string;
  ruc: string;
  city: string;
  business_type: string;
}

interface Props {
  data: CompanyData;
  onUpdate: (partial: Partial<CompanyData>) => void;
}

const CITIES = [
  { value: 'Quito', label: 'Quito' },
  { value: 'Guayaquil', label: 'Guayaquil' },
  { value: 'Cuenca', label: 'Cuenca' },
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

export function Step1Company({ data, onUpdate }: Props) {
  // RUC validation (13 digits)
  const isRucValid = data.ruc.length === 13 && /^\d+$/.test(data.ruc);
  const showRucError = data.ruc.length > 0 && !isRucValid;

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-1 tracking-tight">
        Datos de la empresa
      </h2>
      <p className="text-[13px] text-gray-500 mb-8">
        Información básica de tu empresa. Paso 1 de 4
      </p>

      <div className="space-y-5">
        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
            Nombre de la empresa
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Ej: Supermaxi S.A."
            className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
          />
        </div>

        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
            RUC
          </label>
          <input
            type="text"
            value={data.ruc}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 13);
              onUpdate({ ruc: value });
            }}
            placeholder="13 dígitos"
            maxLength={13}
            className={`w-full bg-white border rounded-lg px-3.5 py-2.5 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all ${
              showRucError
                ? 'border-red-300 focus:ring-red-900/10 focus:border-red-400'
                : 'border-gray-200 focus:ring-gray-900/10 focus:border-gray-300'
            }`}
          />
          {showRucError && (
            <p className="mt-1.5 text-[12px] text-red-600">
              El RUC debe tener exactamente 13 dígitos
            </p>
          )}
        </div>

        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
            Ciudad principal
          </label>
          <select
            value={data.city}
            onChange={(e) => onUpdate({ city: e.target.value })}
            className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
          >
            {CITIES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
            Tipo de negocio
          </label>
          <select
            value={data.business_type}
            onChange={(e) => onUpdate({ business_type: e.target.value })}
            className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
          >
            {BUSINESS_TYPES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
