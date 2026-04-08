import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import type { OnboardingInput, OnboardingLocationInput, IndustryType, ClassificationResult } from '@/types';
import { classifyAllLocations } from '@/data/classification-rules';
import { StepEmpresa } from './steps/StepEmpresa';
import { StepLocales } from './steps/StepLocales';
import { StepClasificacion } from './steps/StepClasificacion';
import { StepResultado } from './steps/StepResultado';
import { Building2, MapPin, Shield, CheckCircle2 } from 'lucide-react';

const STEPS = [
  { id: 'empresa', label: 'Empresa', icon: Building2 },
  { id: 'locales', label: 'Locales', icon: MapPin },
  { id: 'clasificacion', label: 'Clasificación', icon: Shield },
  { id: 'resultado', label: 'Resultado', icon: CheckCircle2 },
];

const emptyLocation: OnboardingLocationInput = {
  name: '',
  address: '',
  city: 'Quito',
  stage: 'operando',
  handlesFood: true,
  sellsAlcohol: false,
  hasSignage: false,
  hasWarehouse: false,
};

export function OnboardingWizard() {
  const navigate = useNavigate();
  const { loadMockData, setOnboarded } = useAppStore();
  const [step, setStep] = useState(0);
  const [input, setInput] = useState<OnboardingInput>({
    companyName: '',
    ruc: '',
    industry: 'restaurante',
    locationCount: 1,
    locations: [{ ...emptyLocation }],
  });
  const [classifications, setClassifications] = useState<ClassificationResult[]>([]);

  const updateInput = (partial: Partial<OnboardingInput>) => {
    setInput((prev) => {
      const next = { ...prev, ...partial };
      if (partial.locationCount !== undefined && partial.locationCount !== prev.locations.length) {
        const count = partial.locationCount;
        if (count > prev.locations.length) {
          const additional = Array.from(
            { length: count - prev.locations.length },
            () => ({ ...emptyLocation })
          );
          next.locations = [...prev.locations, ...additional];
        } else {
          next.locations = prev.locations.slice(0, count);
        }
      }
      return next;
    });
  };

  const updateLocation = (index: number, partial: Partial<OnboardingLocationInput>) => {
    setInput((prev) => {
      const locations = [...prev.locations];
      locations[index] = { ...locations[index], ...partial };
      return { ...prev, locations };
    });
  };

  const cloneFirstLocation = () => {
    if (input.locations.length < 2) return;
    const first = input.locations[0];
    setInput((prev) => ({
      ...prev,
      locations: prev.locations.map((loc, i) =>
        i === 0
          ? loc
          : {
              ...loc,
              city: first.city,
              stage: first.stage,
              handlesFood: first.handlesFood,
              sellsAlcohol: first.sellsAlcohol,
              hasSignage: first.hasSignage,
              hasWarehouse: first.hasWarehouse,
            }
      ),
    }));
  };

  const handleNext = () => {
    if (step === 1) {
      const results = classifyAllLocations(input.locations, input.industry as IndustryType);
      setClassifications(results);
    }
    setStep((s) => Math.min(s + 1, 3));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleComplete = () => {
    loadMockData();
    setOnboarded(true);
    navigate('/');
  };

  const canProceed = (): boolean => {
    if (step === 0) return input.companyName.trim().length > 0 && input.ruc.trim().length > 0;
    if (step === 1) return input.locations.every((l) => l.name.trim().length > 0);
    return true;
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex">
      <div className="w-[280px] bg-white border-r border-gray-200/80 p-6 flex flex-col shrink-0">
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <span className="text-white font-bold text-[11px]">ER</span>
          </div>
          <span className="text-[15px] font-semibold text-gray-900 tracking-tight">EnRegla</span>
        </div>

        <div className="space-y-1">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <div
                key={s.id}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
                  isActive
                    ? 'bg-gray-900 text-white'
                    : isDone
                    ? 'text-gray-500'
                    : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                    isActive
                      ? 'bg-white text-gray-900'
                      : isDone
                      ? 'bg-gray-100 text-gray-500'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {isDone ? <CheckCircle2 size={14} /> : <Icon size={14} />}
                </div>
                <span className="text-[13px] font-medium">{s.label}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-auto pt-6">
          <p className="text-[12px] text-gray-400 leading-relaxed">
            Los datos ingresados determinan las obligaciones regulatorias aplicables a tu negocio.
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-start justify-center overflow-y-auto py-12 px-8">
          <div className="w-full max-w-2xl">
            {step === 0 && (
              <StepEmpresa input={input} onUpdate={updateInput} />
            )}
            {step === 1 && (
              <StepLocales
                locations={input.locations}
                onUpdateLocation={updateLocation}
                onClone={cloneFirstLocation}
              />
            )}
            {step === 2 && (
              <StepClasificacion classifications={classifications} />
            )}
            {step === 3 && (
              <StepResultado classifications={classifications} input={input} />
            )}
          </div>
        </div>

        <div className="border-t border-gray-200/80 px-8 py-4 flex items-center justify-between bg-white/80 backdrop-blur-xl">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className="text-[13px] text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Atrás
          </button>
          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="px-5 py-2.5 bg-gray-900 text-white text-[13px] font-medium rounded-lg hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              Continuar
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="px-5 py-2.5 bg-gray-900 text-white text-[13px] font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
            >
              Iniciar sistema
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
