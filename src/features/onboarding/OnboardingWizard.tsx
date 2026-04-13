import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { completeOnboarding, type OnboardingData } from '@/lib/api/onboarding';
import { Step1Company } from './steps/Step1Company';
import { Step2Regulatory } from './steps/Step2Regulatory';
import { Step3Locations } from './steps/Step3Locations';
import { Step4Review } from './steps/Step4Review';
import { Building2, Shield, MapPin, CheckCircle2, Loader2 } from 'lucide-react';

const STEPS = [
  { id: 'company', label: 'Empresa', icon: Building2 },
  { id: 'regulatory', label: 'Regulatorio', icon: Shield },
  { id: 'locations', label: 'Locales', icon: MapPin },
  { id: 'review', label: 'Revisar', icon: CheckCircle2 },
];

export function OnboardingWizard() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<OnboardingData>({
    company: {
      name: '',
      ruc: '',
      city: 'Quito',
      business_type: 'Supermercado',
    },
    regulatory_factors: {
      alimentos: false,
      alcohol: false,
      salud: false,
      quimicos: false,
    },
    locations: [
      {
        name: '',
        address: '',
        status: 'operando',
      },
    ],
  });

  const updateCompany = (partial: Partial<OnboardingData['company']>) => {
    setData((prev) => ({
      ...prev,
      company: { ...prev.company, ...partial },
    }));
  };

  const updateRegulatory = (partial: Partial<OnboardingData['regulatory_factors']>) => {
    setData((prev) => ({
      ...prev,
      regulatory_factors: { ...prev.regulatory_factors, ...partial },
    }));
  };

  const updateLocations = (locations: OnboardingData['locations']) => {
    setData((prev) => ({
      ...prev,
      locations,
    }));
  };

  const handleNext = () => {
    setStep((s) => Math.min(s + 1, 3));
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleComplete = async () => {
    if (!user) {
      setError('No user found. Please login again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await completeOnboarding(user.id, data);
      // Force reload to get updated profile with company_id
      window.location.href = '/';
    } catch (err) {
      console.error('Onboarding error:', err);
      setError(err instanceof Error ? err.message : 'Failed to complete onboarding');
      setLoading(false);
    }
  };

  const canProceed = (): boolean => {
    if (step === 0) {
      return (
        data.company.name.trim().length > 0 &&
        data.company.ruc.length === 13 &&
        /^\d+$/.test(data.company.ruc)
      );
    }
    if (step === 2) {
      return (
        data.locations.length > 0 &&
        data.locations.every((l) => l.name.trim().length > 0 && l.address.trim().length > 0)
      );
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex">
      {/* Sidebar */}
      <div className="w-[280px] bg-white border-r border-gray-200/80 p-6 flex flex-col shrink-0">
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <span className="text-white font-bold text-[11px]">PM</span>
          </div>
          <span className="text-[15px] font-semibold text-gray-900 tracking-tight">
            PermitOps
          </span>
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
            Configura tu empresa y genera automáticamente los permisos necesarios para cada local.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-start justify-center overflow-y-auto py-12 px-8">
          <div className="w-full max-w-2xl">
            {step === 0 && (
              <Step1Company data={data.company} onUpdate={updateCompany} />
            )}
            {step === 1 && (
              <Step2Regulatory data={data.regulatory_factors} onUpdate={updateRegulatory} />
            )}
            {step === 2 && (
              <Step3Locations locations={data.locations} onUpdate={updateLocations} />
            )}
            {step === 3 && (
              <Step4Review
                company={data.company}
                regulatory={data.regulatory_factors}
                locations={data.locations}
              />
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-[13px] text-red-900">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200/80 px-8 py-4 flex items-center justify-between bg-white/80 backdrop-blur-xl">
          <button
            onClick={handleBack}
            disabled={step === 0 || loading}
            className="text-[13px] text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Atrás
          </button>
          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed() || loading}
              className="px-5 py-2.5 bg-gray-900 text-white text-[13px] font-medium rounded-lg hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              Siguiente
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={loading}
              className="px-5 py-2.5 bg-gray-900 text-white text-[13px] font-medium rounded-lg hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Activando...
                </>
              ) : (
                'Activar Sistema'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
