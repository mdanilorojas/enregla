import type { OnboardingInput, IndustryType } from '@/types';
import { INDUSTRY_LABELS } from '@/types';

interface Props {
  input: OnboardingInput;
  onUpdate: (partial: Partial<OnboardingInput>) => void;
}

const industries = Object.entries(INDUSTRY_LABELS) as [IndustryType, string][];

export function StepEmpresa({ input, onUpdate }: Props) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-1 tracking-tight">Datos de la empresa</h2>
      <p className="text-[13px] text-gray-500 mb-8">
        Identificación legal y tipo de negocio. Esto determina qué obligaciones aplican.
      </p>

      <div className="space-y-5">
        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Nombre legal</label>
          <input
            type="text"
            value={input.companyName}
            onChange={(e) => onUpdate({ companyName: e.target.value })}
            placeholder="Razón social registrada en el RUC"
            className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
          />
        </div>

        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1.5">RUC</label>
          <input
            type="text"
            value={input.ruc}
            onChange={(e) => onUpdate({ ruc: e.target.value })}
            placeholder="13 dígitos"
            maxLength={13}
            className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
          />
        </div>

        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Tipo de negocio</label>
          <select
            value={input.industry}
            onChange={(e) => onUpdate({ industry: e.target.value as IndustryType })}
            className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
          >
            {industries.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-2">
            Número de locales
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => onUpdate({ locationCount: n })}
                className={`w-10 h-10 rounded-lg text-[13px] font-medium transition-all ${
                  input.locationCount === n
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700 border border-gray-200'
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => onUpdate({ locationCount: Math.min(input.locationCount + 1, 10) })}
              className="w-10 h-10 rounded-lg text-[13px] bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 border border-gray-200 transition-all"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
