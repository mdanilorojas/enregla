import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  saveProfile,
  saveCompany,
  saveLocationWithPermits,
} from '@/lib/api/onboarding';
import { ProgressStepper } from './components/ProgressStepper';
import { ProfileStep } from './steps/ProfileStep';
import { CompanyStep } from './steps/CompanyStep';
import { LocationsStep } from './steps/LocationsStep';

type Step = 'profile' | 'company' | 'locations';

interface IncrementalWizardProps {
  initialStep?: Step;
}

export function IncrementalWizard({ initialStep = 'profile' }: IncrementalWizardProps) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(initialStep);
  const [completedSteps, setCompletedSteps] = useState<Step[]>(() => {
    const steps: Step[] = [];
    if (initialStep === 'company' || initialStep === 'locations') {
      steps.push('profile');
    }
    if (initialStep === 'locations') {
      steps.push('company');
    }
    return steps;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track saved data for "Back" navigation
  const [savedProfile, setSavedProfile] = useState(profile?.full_name || '');
  const [savedCompany, setSavedCompany] = useState<any>(null);
  const [companyId, setCompanyId] = useState<string | null>(profile?.company_id || null);

  const handleProfileNext = async (fullName: string) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      await saveProfile(user.id, fullName);
      setSavedProfile(fullName);
      setCompletedSteps((prev) => [...prev, 'profile']);
      setCurrentStep('company');
    } catch (err) {
      console.error('Profile save error:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyNext = async (companyData: any) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const newCompanyId = await saveCompany(user.id, companyData);
      setCompanyId(newCompanyId);
      setSavedCompany(companyData);
      setCompletedSteps((prev) => [...prev, 'company']);
      setCurrentStep('locations');
    } catch (err) {
      console.error('Company save error:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationsComplete = async (locations: any[]) => {
    if (!user || !companyId) return;

    setLoading(true);
    setError(null);

    try {
      // Save each location with its permits
      for (const location of locations) {
        await saveLocationWithPermits(companyId, location);
      }

      // Update company location_count
      // (Skipping this for simplicity - can be added later or use DB trigger)

      // Navigate to dashboard
      navigate('/');
    } catch (err) {
      console.error('Locations save error:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar locales');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 'company') {
      setCurrentStep('profile');
    } else if (currentStep === 'locations') {
      setCurrentStep('company');
    }
  };

  const canGoBack = currentStep !== 'profile';
  const showNextButton = currentStep !== 'locations';

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

        <ProgressStepper currentStep={currentStep} completedSteps={completedSteps} />

        <div className="mt-auto pt-6">
          <p className="text-[12px] text-gray-400 leading-relaxed">
            Configura tu empresa paso a paso. Cada paso se guarda automáticamente.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-start justify-center overflow-y-auto py-12 px-8">
          <div className="w-full max-w-2xl">
            {currentStep === 'profile' && (
              <ProfileStep
                initialName={savedProfile}
                onNext={handleProfileNext}
                loading={loading}
              />
            )}

            {currentStep === 'company' && (
              <CompanyStep
                initialData={savedCompany}
                onNext={handleCompanyNext}
                onBack={handleBack}
                loading={loading}
              />
            )}

            {currentStep === 'locations' && (
              <LocationsStep
                onComplete={handleLocationsComplete}
                onBack={handleBack}
                loading={loading}
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
            disabled={!canGoBack || loading}
            className="text-[13px] text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Atrás
          </button>

          {showNextButton ? (
            <button
              onClick={() => {
                // Trigger form submit by finding and clicking hidden submit button
                const form = document.querySelector('form');
                if (form) {
                  form.requestSubmit();
                }
              }}
              disabled={loading}
              className="px-5 py-2.5 bg-gray-900 text-white text-[13px] font-medium rounded-lg hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Siguiente
            </button>
          ) : (
            <button
              onClick={() => {
                const form = document.querySelector('form');
                if (form) {
                  form.requestSubmit();
                }
              }}
              disabled={loading}
              className="px-5 py-2.5 bg-gray-900 text-white text-[13px] font-medium rounded-lg hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                'Ir al Dashboard'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
