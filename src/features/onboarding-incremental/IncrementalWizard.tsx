import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { ProgressStepper, type WizardStep } from './components/ProgressStepper';
import { StepInterlude } from './components/StepInterlude';
import { WelcomeStep } from './steps/WelcomeStep';
import { CompanyStep } from './steps/CompanyStep';
import { PermitPreviewStep } from './steps/PermitPreviewStep';
import { LocationsStep } from './steps/LocationsStep';
import { PermitHandoffStep } from './steps/PermitHandoffStep';

// 'interlude' is a transient celebration shown after company save.
type Step = WizardStep | 'interlude';

interface CompanyData {
  name: string;
  ruc: string;
  city: string;
  business_type: string;
}

interface IncrementalWizardProps {
  initialStep?: WizardStep;
}

export function IncrementalWizard({ initialStep = 'welcome' }: IncrementalWizardProps) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const googleName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    (user?.user_metadata?.given_name && user?.user_metadata?.family_name
      ? `${user.user_metadata.given_name} ${user.user_metadata.family_name}`
      : '');

  const [currentStep, setCurrentStep] = useState<Step>(initialStep);
  const [completedSteps, setCompletedSteps] = useState<WizardStep[]>(() => {
    const steps: WizardStep[] = [];
    if (initialStep === 'company' || initialStep === 'preview' || initialStep === 'locations') {
      steps.push('welcome');
    }
    if (initialStep === 'preview' || initialStep === 'locations') {
      steps.push('company');
    }
    return steps;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [savedName, setSavedName] = useState(profile?.full_name || googleName);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(profile?.company_id || null);
  const [createdLocation, setCreatedLocation] = useState<{ id: string; name: string } | null>(null);

  const markDone = (step: WizardStep) =>
    setCompletedSteps((prev) => (prev.includes(step) ? prev : [...prev, step]));

  const handleWelcomeNext = async (fullName: string) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      await saveProfile(user.id, fullName);
      setSavedName(fullName);
      markDone('welcome');
      setCurrentStep('company');
    } catch (err) {
      console.error('Profile save error:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyNext = async (data: CompanyData) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const newId = await saveCompany(user.id, data);
      setCompanyId(newId);
      setCompany(data);
      markDone('company');
      setCurrentStep('interlude');
    } catch (err) {
      console.error('Company save error:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationsComplete = async (
    locations: Array<{ name: string; address: string; status: 'operando' | 'en_preparacion' | 'cerrado' }>
  ) => {
    if (!user || !companyId) return;
    setLoading(true);
    setError(null);
    try {
      let firstLocId: string | null = null;
      let firstLocName = '';
      for (const loc of locations) {
        const id = await saveLocationWithPermits(companyId, loc);
        if (!firstLocId) {
          firstLocId = id;
          firstLocName = loc.name;
        }
      }

      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (updatedProfile) useAuthStore.getState().setProfile(updatedProfile);

      markDone('locations');
      if (firstLocId) {
        setCreatedLocation({ id: firstLocId, name: firstLocName });
        setCurrentStep('handoff');
      } else {
        navigate('/?tour=1&force=1');
      }
    } catch (err) {
      console.error('Locations save error:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar locales');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 'company') setCurrentStep('welcome');
    else if (currentStep === 'preview') setCurrentStep('company');
    else if (currentStep === 'locations') setCurrentStep('preview');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const handleSubmitForm = () => {
    const form = document.querySelector('form');
    if (form) form.requestSubmit();
  };

  // Footer visibility: interlude and handoff own their own CTAs.
  const footerStep = currentStep !== 'interlude' && currentStep !== 'handoff';
  const canGoBack =
    currentStep === 'company' || currentStep === 'preview' || currentStep === 'locations';

  // 'preview' advances via its own footer "Crear mi primera sede" → go to locations (no save).
  const handleFooterNext = () => {
    if (currentStep === 'preview') {
      markDone('company');
      setCurrentStep('locations');
    } else {
      handleSubmitForm();
    }
  };

  const nextLabel =
    currentStep === 'welcome'
      ? 'Crear mi empresa'
      : currentStep === 'preview'
      ? 'Crear mi primera sede'
      : currentStep === 'locations'
      ? 'Ir a permisos'
      : 'Siguiente';

  const stepperStep: WizardStep = currentStep === 'interlude' ? 'company' : currentStep;

  return (
    <div className="min-h-screen bg-[var(--ds-neutral-50)] flex">
      {/* Sidebar */}
      <div className="w-[280px] bg-white border-r border-[var(--ds-border)] p-[var(--ds-space-300)] flex flex-col shrink-0">
        <div className="flex items-center gap-[var(--ds-space-100)] mb-[var(--ds-space-500)]">
          <div className="w-8 h-8 rounded-[var(--ds-radius-200)] bg-[var(--ds-text)] flex items-center justify-center">
            <span className="text-white font-bold text-[var(--ds-font-size-050)]">ER</span>
          </div>
          <span className="text-[var(--ds-font-size-200)] font-semibold text-[var(--ds-text)] tracking-tight">
            EnRegla
          </span>
        </div>
        <ProgressStepper
          currentStep={stepperStep}
          completedSteps={completedSteps}
          onMilestoneClick={(step) => !loading && setCurrentStep(step)}
        />
        <div className="mt-auto pt-[var(--ds-space-300)]">
          <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtlest)] leading-relaxed">
            Configura tu empresa paso a paso. Cada paso se guarda automáticamente.
          </p>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-start justify-center overflow-y-auto py-[var(--ds-space-600)] px-[var(--ds-space-400)]">
          <div className="w-full max-w-2xl">
            {currentStep === 'welcome' && (
              <WelcomeStep initialName={savedName} onNext={handleWelcomeNext} loading={loading} />
            )}
            {currentStep === 'company' && (
              <CompanyStep initialData={company ?? undefined} onNext={handleCompanyNext} loading={loading} />
            )}
            {currentStep === 'interlude' && (
              <StepInterlude
                title={`¡Genial! Bienvenido a EnRegla${company?.name ? `, ${company.name}` : ''} 🎉`}
                subtitle="Tu empresa quedó registrada. Ahora te mostramos qué permisos vas a necesitar."
                ctaLabel="Ver mis permisos →"
                onContinue={() => setCurrentStep('preview')}
              />
            )}
            {currentStep === 'preview' && (
              <PermitPreviewStep businessType={company?.business_type ?? 'otro'} />
            )}
            {currentStep === 'locations' && (
              <LocationsStep onComplete={handleLocationsComplete} loading={loading} />
            )}
            {currentStep === 'handoff' && companyId && createdLocation && (
              <PermitHandoffStep
                companyId={companyId}
                locationId={createdLocation.id}
                locationName={createdLocation.name}
                businessType={company?.business_type ?? 'otro'}
                leadInfo={{
                  nombre: savedName,
                  email: user?.email ?? '',
                  negocio: company?.name ?? '',
                  ciudad: company?.city,
                }}
                onGoToDashboard={() => navigate('/?tour=1&force=1')}
              />
            )}

            {error && (
              <div className="mt-[var(--ds-space-300)]">
                <Banner variant="error" title="Error">{error}</Banner>
              </div>
            )}
          </div>
        </div>

        {footerStep && (
          <div className="border-t border-[var(--ds-border)] px-[var(--ds-space-400)] py-[var(--ds-space-200)] flex items-center justify-between bg-white/80 backdrop-blur-xl">
            {canGoBack ? (
              <Button variant="ghost" onClick={handleBack} disabled={loading}>Atrás</Button>
            ) : (
              <Button variant="ghost" onClick={handleSignOut} disabled={loading}>Cerrar sesión</Button>
            )}
            <Button onClick={handleFooterNext} disabled={loading} loading={loading}>
              {nextLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
