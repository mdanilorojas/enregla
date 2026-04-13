import { Plus, Trash2 } from 'lucide-react';

interface LocationInput {
  name: string;
  address: string;
  status: 'operando' | 'en_preparacion' | 'cerrado';
}

interface Props {
  locations: LocationInput[];
  onUpdate: (locations: LocationInput[]) => void;
}

const STATUS_OPTIONS = [
  { value: 'operando' as const, label: 'Operando' },
  { value: 'en_preparacion' as const, label: 'En preparación' },
  { value: 'cerrado' as const, label: 'Cerrado' },
];

export function Step3Locations({ locations, onUpdate }: Props) {
  const addLocation = () => {
    onUpdate([
      ...locations,
      { name: '', address: '', status: 'operando' },
    ]);
  };

  const removeLocation = (index: number) => {
    if (locations.length > 1) {
      onUpdate(locations.filter((_, i) => i !== index));
    }
  };

  const updateLocation = (index: number, partial: Partial<LocationInput>) => {
    const newLocations = [...locations];
    newLocations[index] = { ...newLocations[index], ...partial };
    onUpdate(newLocations);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-1 tracking-tight">
        Locales / Sedes
      </h2>
      <p className="text-[13px] text-gray-500 mb-8">
        Agrega todos los locales de tu empresa. Paso 3 de 4
      </p>

      <div className="space-y-4">
        {locations.map((location, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-xl bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-[14px] font-semibold text-gray-900">
                Local {index + 1}
              </h3>
              {locations.length > 1 && (
                <button
                  onClick={() => removeLocation(index)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
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
                  className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                  Dirección
                </label>
                <input
                  type="text"
                  value={location.address}
                  onChange={(e) =>
                    updateLocation(index, { address: e.target.value })
                  }
                  placeholder="Dirección completa"
                  className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
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
                      onClick={() => updateLocation(index, { status: value })}
                      className={`px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all ${
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
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addLocation}
        className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-dashed border-gray-300 rounded-xl text-[13px] font-medium text-gray-600 hover:border-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all"
      >
        <Plus size={16} />
        Agregar otra sede
      </button>

      {locations.length === 0 && (
        <p className="mt-2 text-[12px] text-red-600">
          Debes agregar al menos un local
        </p>
      )}
    </div>
  );
}
