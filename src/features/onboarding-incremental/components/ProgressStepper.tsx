import { CheckCircle2, Building2, MapPin, FileCheck } from '@/lib/lucide-icons';

export type WizardStep = 'welcome' | 'company' | 'preview' | 'locations' | 'handoff';

interface Milestone {
  id: 'empresa' | 'sede' | 'permisos';
  label: string;
  icon: typeof Building2;
  steps: WizardStep[];
}

interface ProgressStepperProps {
  currentStep: WizardStep;
  completedSteps: WizardStep[];
}

const MILESTONES: Milestone[] = [
  { id: 'empresa', label: 'Tu empresa', icon: Building2, steps: ['welcome', 'company'] },
  { id: 'sede', label: 'Tu sede', icon: MapPin, steps: ['preview', 'locations'] },
  { id: 'permisos', label: 'Permisos', icon: FileCheck, steps: ['handoff'] },
];

const ORDER: WizardStep[] = ['welcome', 'company', 'preview', 'locations', 'handoff'];

export function ProgressStepper({ currentStep, completedSteps }: ProgressStepperProps) {
  const currentIdx = ORDER.indexOf(currentStep);

  return (
    <div className="space-y-[var(--ds-space-050)]">
      {MILESTONES.map((m) => {
        const Icon = m.icon;
        const isActive = m.steps.includes(currentStep);
        const lastStepIdx = Math.max(...m.steps.map((s) => ORDER.indexOf(s)));
        const isCompleted =
          !isActive &&
          (lastStepIdx < currentIdx || m.steps.every((s) => completedSteps.includes(s)));

        return (
          <div
            key={m.id}
            className={`flex items-center gap-[var(--ds-space-150)] rounded-[var(--ds-radius-200)] px-[var(--ds-space-150)] py-[var(--ds-space-100)] transition-all ${
              isActive
                ? 'bg-[var(--ds-text)] text-white'
                : isCompleted
                ? 'text-[var(--ds-text-subtle)]'
                : 'text-[var(--ds-text-subtlest)]'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[var(--ds-font-size-075)] font-medium shrink-0 ${
                isActive ? 'bg-white text-[var(--ds-text)]' : 'bg-[var(--ds-neutral-100)] text-[var(--ds-text-subtle)]'
              }`}
            >
              {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
            </div>
            <span className="text-[var(--ds-font-size-075)] font-medium">{m.label}</span>
          </div>
        );
      })}
    </div>
  );
}
