import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface LocationInput {
  name: string;
  address: string;
  status: 'operando' | 'en_preparacion' | 'cerrado';
  regulatory: {
    alimentos: boolean;
    alcohol: boolean;
    salud: boolean;
    quimicos: boolean;
  };
}

interface LocationsStepProps {
  onComplete: (locations: LocationInput[]) => Promise<void>;
  onBack: () => void;
  loading: boolean;
}

const STATUS_OPTIONS = [
  { value: 'operando' as const, label: 'Operando' },
  { value: 'en_preparacion' as const, label: 'En preparación' },
  { value: 'cerrado' as const, label: 'Cerrado' },
];

const REGULATORY_OPTIONS = [
  { key: 'alimentos' as const, label: 'Vende alimentos', permit: 'ARCSA' },
  { key: 'alcohol' as const, label: 'Vende alcohol', permit: 'SCPM' },
  { key: 'salud' as const, label: 'Servicios de salud', permit: 'MSP' },
  { key: 'quimicos' as const, label: 'Maneja químicos', permit: 'CONSEP' },
];

export function LocationsStep({ onComplete, onBack, loading }: LocationsStepProps) {
  const [locations, setLocations] = useState<LocationInput[]>([
    {
      name: '',
      address: '',
      status: 'operando',
      regulatory: {
        alimentos: false,
        alcohol: false,
        salud: false,
        quimicos: false,
      },
    },
  ]);

  const addLocation = () => {
    setLocations([
      ...locations,
      {
        name: '',
        address: '',
        status: 'operando',
        regulatory: {
          alimentos: false,
          alcohol: false,
          salud: false,
          quimicos: false,
        },
      },
    ]);
  };

  const removeLocation = (index: number) => {
    if (locations.length > 1) {
      setLocations(locations.filter((_, i) => i !== index));
    }
  };

  const updateLocation = (index: number, partial: Partial<LocationInput>) => {
    const newLocations = [...locations];
    newLocations[index] = { ...newLocations[index], ...partial };
    setLocations(newLocations);
  };

  const updateRegulatory = (
    index: number,
    key: keyof LocationInput['regulatory'],
    value: boolean
  ) => {
    const newLocations = [...locations];
    newLocations[index] = {
      ...newLocations[index],
      regulatory: {
        ...newLocations[index].regulatory,
        [key]: value,
      },
    };
    setLocations(newLocations);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canProceed) return;
    await onComplete(locations);
  };

  // Validation
  const canProceed =
    locations.length > 0 &&
    locations.every((loc) => loc.name.trim().length > 0 && loc.address.trim().length > 0);

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-xl font-semibold text-gray-900 mb-1 tracking-tight">
        Locales / Sedes
      </h2>
      <p className="text-[13px] text-gray-500 mb-8">
        Agrega todos los locales de tu empresa. Paso 3 de 3
      </p>

      <div className="space-y-4">
        {locations.map((location, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-xl bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-[14px] font-semibold text-gray-900">Local {index + 1}</h3>
              {locations.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLocation(index)}
                  disabled={loading}
                  className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                  title="Eliminar local"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                  Nombre del local
                </label>
                <input
                  type="text"
                  value={location.name}
                  onChange={(e) => updateLocation(index, { name: e.target.value })}
                  placeholder="Ej: Sucursal La Mariscal"
                  disabled={loading}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                  Dirección
                </label>
                <input
                  type="text"
                  value={location.address}
                  onChange={(e) => updateLocation(index, { address: e.target.value })}
                  placeholder="Dirección completa"
                  disabled={loading}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <div className="flex gap-2">
                  {STATUS_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => updateLocation(index, { status: value })}
                      disabled={loading}
                      className={`px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all disabled:opacity-50 ${
                        location.status === value
                          ? 'bg-gray-900 text-white shadow-sm'
                          : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-2">
                  Factores regulatorios
                </label>
                <p className="text-[12px] text-gray-500 mb-3">
                  Selecciona las actividades de este local para generar automáticamente los
                  permisos necesarios
                </p>
                <div className="space-y-2">
                  {REGULATORY_OPTIONS.map(({ key, label, permit }) => (
                    <label
                      key={key}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={location.regulatory[key]}
                        onChange={(e) => updateRegulatory(index, key, e.target.checked)}
                        disabled={loading}
                        className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:opacity-50"
                      />
                      <div className="flex-1">
                        <span className="text-[13px] font-medium text-gray-900">{label}</span>
                        <span className="text-[12px] text-gray-500 ml-2">
                          (Genera permiso {permit})
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addLocation}
        disabled={loading}
        className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-dashed border-gray-300 rounded-xl text-[13px] font-medium text-gray-600 hover:border-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all disabled:opacity-50"
      >
        <Plus size={16} />
        Agregar otra sede
      </button>

      {locations.length === 0 && (
        <p className="mt-2 text-[12px] text-red-600">Debes agregar al menos un local</p>
      )}

      <button type="submit" disabled={!canProceed || loading} className="hidden" />
    </form>
  );
}
