import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from '@/lib/lucide-icons';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import {
  saveProfile,
  saveCompany,
  saveLocationWithPermits,
} from '@/lib/api/onboarding';
import { Button } from '@/components/ui/button';
import { Banner } from '@/components/ui/banner';
import { ProgressStepper } from './components/ProgressStepper';
import { Stepper } from './Stepper';
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
  // Pre-fill name from Google OAuth if available
  const googleName = user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || (user?.user_metadata?.given_name && user?.user_metadata?.family_name
        ? `${user.user_metadata.given_name} ${user.user_metadata.family_name}`
        : '');
  const [savedProfile, setSavedProfile] = useState(profile?.full_name || googleName);
  // casting due to stale generated types — see audit follow-up
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLocationsComplete = async (locations: any[]) => {
    if (!user || !companyId) return;

    setLoading(true);
    setError(null);

    try {
      // Save each location with its permits
      for (const location of locations) {
        await saveLocationWithPermits(companyId, location);
      }

      // Refresh profile to get updated company_id
      const { data: updatedProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Failed to refresh profile:', profileError);
      } else if (updatedProfile) {
        // Update auth store with fresh profile
        useAuthStore.getState().setProfile(updatedProfile);
      }

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

  const handleSubmitForm = () => {
    const form = document.querySelector('form');
    if (form) {
      form.requestSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-[var(--ds-neutral-50)] flex">
      {/* Sidebar */}
      <div className="w-[280px] bg-white border-r border-[var(--ds-border)] p-[var(--ds-space-300)] flex flex-col shrink-0">
        <div className="flex items-center gap-[var(--ds-space-100)] mb-[var(--ds-space-500)]">
          <div className="w-8 h-8 rounded-[var(--ds-radius-200)] bg-[var(--ds-text)] flex items-center justify-center">
            <span className="text-white font-bold text-[var(--ds-font-size-050)]">PM</span>
          </div>
          <span className="text-[var(--ds-font-size-200)] font-semibold text-[var(--ds-text)] tracking-tight">
            PermitOps
          </span>
        </div>

        <ProgressStepper currentStep={currentStep} completedSteps={completedSteps} />

        <div className="mt-auto pt-[var(--ds-space-300)]">
          <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtlest)] leading-relaxed">
            Configura tu empresa paso a paso. Cada paso se guarda automáticamente.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-start justify-center overflow-y-auto py-[var(--ds-space-600)] px-[var(--ds-space-400)]">
          <div className="w-full max-w-2xl">
            <div className="max-w-2xl mx-auto mb-[var(--ds-space-400)]">
              <Stepper
                steps={[
                  { id: 'profile', label: 'Perfil' },
                  { id: 'company', label: 'Empresa' },
                  { id: 'locations', label: 'Sedes' },
                ]}
                currentStepId={currentStep}
              />
            </div>

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
                loading={loading}
              />
            )}

            {currentStep === 'locations' && (
              <LocationsStep
                onComplete={handleLocationsComplete}
                loading={loading}
              />
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-[var(--ds-space-300)]">
                <Banner variant="error" title="Error">
                  {error}
                </Banner>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-[var(--ds-border)] px-[var(--ds-space-400)] py-[var(--ds-space-200)] flex items-center justify-between bg-white/80 backdrop-blur-xl">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={!canGoBack || loading}
          >
            Atrás
          </Button>

          {showNextButton ? (
            <Button
              onClick={handleSubmitForm}
              disabled={loading}
              loading={loading}
            >
              Siguiente
            </Button>
          ) : (
            <Button
              onClick={handleSubmitForm}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Guardando...
                </>
              ) : (
                'Ir al Dashboard'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
