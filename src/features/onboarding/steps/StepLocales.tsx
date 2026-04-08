import { useState } from 'react';
import type { OnboardingLocationInput, LocationStage } from '@/types';
import { STAGE_LABELS } from '@/types';
import { Copy, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  locations: OnboardingLocationInput[];
  onUpdateLocation: (index: number, partial: Partial<OnboardingLocationInput>) => void;
  onClone: () => void;
}

const stages = Object.entries(STAGE_LABELS) as [LocationStage, string][];

export function StepLocales({ locations, onUpdateLocation, onClone }: Props) {
  const [expandedIndex, setExpandedIndex] = useState(0);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Configurar locales</h2>
        {locations.length > 1 && (
          <button
            onClick={onClone}
            className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-900 transition-colors font-medium"
          >
            <Copy size={13} />
            Clonar del primero
          </button>
        )}
      </div>
      <p className="text-[13px] text-gray-500 mb-6">
        Cada local puede tener obligaciones distintas según su actividad y ubicación.
      </p>

      <div className="space-y-2">
        {locations.map((loc, i) => {
          const isExpanded = expandedIndex === i;
          return (
            <div
              key={i}
              className="border border-gray-200/80 rounded-xl bg-white overflow-hidden shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]"
            >
              <button
                onClick={() => setExpandedIndex(isExpanded ? -1 : i)}
                className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50/50 transition-colors"
              >
                <span className="text-[14px] font-medium text-gray-900">
                  {loc.name || `Local ${i + 1}`}
                </span>
                {isExpanded ? (
                  <ChevronUp size={16} className="text-gray-400" />
                ) : (
                  <ChevronDown size={16} className="text-gray-400" />
                )}
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 space-y-4 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div>
                      <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Nombre del local</label>
                      <input
                        type="text"
                        value={loc.name}
                        onChange={(e) => onUpdateLocation(i, { name: e.target.value })}
                        placeholder="Ej: Sucursal La Mariscal"
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Ciudad</label>
                      <input
                        type="text"
                        value={loc.city}
                        disabled
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[14px] text-gray-400 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Dirección</label>
                    <input
                      type="text"
                      value={loc.address}
                      onChange={(e) => onUpdateLocation(i, { address: e.target.value })}
                      placeholder="Dirección completa"
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-2">Etapa</label>
                    <div className="flex gap-2">
                      {stages.map(([value, label]) => (
                        <button
                          key={value}
                          onClick={() => onUpdateLocation(i, { stage: value })}
                          className={`px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all ${
                            loc.stage === value
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
                    <label className="block text-[13px] font-medium text-gray-700 mb-2">Factores operativos</label>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        ['handlesFood', 'Maneja alimentos'],
                        ['sellsAlcohol', 'Vende alcohol'],
                        ['hasSignage', 'Tiene rotulación'],
                        ['hasWarehouse', 'Bodega en sitio'],
                      ] as const).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => onUpdateLocation(i, { [key]: !loc[key] })}
                          className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-[13px] transition-all ${
                            loc[key]
                              ? 'bg-gray-900 text-white'
                              : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                              loc[key] ? 'bg-white border-white' : 'border-gray-300'
                            }`}
                          >
                            {loc[key] && (
                              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                <path d="M1 4L3 6L7 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={loc[key] ? 'text-gray-900' : ''} />
                              </svg>
                            )}
                          </span>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
