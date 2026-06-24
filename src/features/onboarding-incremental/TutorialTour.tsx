import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from '@/lib/lucide-icons';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { AppLoader } from '@/components/ui/app-loader';
import { Button } from '@/components/ui/button';
import { ProgressStepper, type WizardStep } from './components/ProgressStepper';
import { StepInterlude } from './components/StepInterlude';
import { WelcomeStep } from './steps/WelcomeStep';
import { CompanyStep } from './steps/CompanyStep';
import { PermitPreviewStep } from './steps/PermitPreviewStep';

// Read-only replay of the onboarding coach flow. Reuses the setup steps but
// never writes: handlers only advance. Stops before the transactional
// locations/handoff steps (those create real data, not tutorial content).
// ponytail: replay solo de pantallas instructivas; no incluye crear sede/handoff.
type TourStep = 'welcome' | 'company' | 'interlude' | 'preview';
const ORDER: TourStep[] = ['welcome', 'company', 'interlude', 'preview'];

export function TutorialTour() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const { data: company, isLoading: companyLoading } = useCompany(profile?.company_id);

  const [idx, setIdx] = useState(0);

  if (loading || companyLoading) return <AppLoader />;

  const step = ORDER[idx];
  const exit = () => navigate('/');
  const next = () => (idx < ORDER.length - 1 ? setIdx((i) => i + 1) : exit());
  const back = () => idx > 0 && setIdx((i) => i - 1);

  const name = profile?.full_name ?? user?.user_metadata?.full_name ?? '';
  const companyData = company
    ? {
        name: company.name,
        ruc: company.ruc ?? '',
        city: company.city ?? 'Quito',
        business_type: company.business_type,
      }
    : undefined;

  // ProgressStepper maps the transient interlude to the 'company' milestone.
  const stepperStep: WizardStep = step === 'interlude' ? 'company' : step;
  const completed: WizardStep[] = (
    ['welcome', 'company', 'preview'] as WizardStep[]
  ).filter((s) => ORDER.indexOf(s as TourStep) < idx);

  const showFooter = step !== 'interlude';

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
        <ProgressStepper currentStep={stepperStep} completedSteps={completed} />
        <div className="mt-auto pt-[var(--ds-space-300)]">
          <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtlest)] leading-relaxed">
            Estás viendo el tutorial de bienvenida. No se modifica ningún dato.
          </p>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <div className="flex justify-end px-[var(--ds-space-400)] pt-[var(--ds-space-200)]">
          <Button variant="ghost" onClick={exit}>
            <X className="w-4 h-4" /> Salir del tutorial
          </Button>
        </div>
        <div className="flex-1 flex items-start justify-center overflow-y-auto py-[var(--ds-space-500)] px-[var(--ds-space-400)]">
          <div className="w-full max-w-2xl">
            {step === 'welcome' && (
              <WelcomeStep initialName={name} onNext={async () => next()} loading={false} readOnly />
            )}
            {step === 'company' && (
              <CompanyStep initialData={companyData} onNext={async () => next()} loading={false} readOnly />
            )}
            {step === 'interlude' && (
              <StepInterlude
                title={`Así funciona EnRegla${company?.name ? `, ${company.name}` : ''} 🎉`}
                subtitle="Con tu empresa registrada, te mostramos qué permisos vas a necesitar."
                ctaLabel="Ver mis permisos →"
                onContinue={next}
              />
            )}
            {step === 'preview' && (
              <PermitPreviewStep businessType={company?.business_type ?? 'otro'} />
            )}
          </div>
        </div>

        {showFooter && (
          <div className="border-t border-[var(--ds-border)] px-[var(--ds-space-400)] py-[var(--ds-space-200)] flex items-center justify-between bg-white/80 backdrop-blur-xl">
            {idx > 0 ? (
              <Button variant="ghost" onClick={back}>Atrás</Button>
            ) : (
              <span />
            )}
            <Button onClick={next}>
              {step === 'preview' ? 'Listo, ir a la app' : 'Siguiente'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
