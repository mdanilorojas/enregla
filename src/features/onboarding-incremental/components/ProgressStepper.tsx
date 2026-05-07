import { CheckCircle2, Building2, MapPin, User } from '@/lib/lucide-icons';

interface Step {
  id: string;
  label: string;
  icon: typeof User;
}

interface ProgressStepperProps {
  currentStep: 'profile' | 'company' | 'locations';
  completedSteps: ('profile' | 'company' | 'locations')[];
}

const STEPS: Step[] = [
  { id: 'profile', label: 'Tu perfil', icon: User },
  { id: 'company', label: 'Tu empresa', icon: Building2 },
  { id: 'locations', label: 'Sedes', icon: MapPin },
];

export function ProgressStepper({ currentStep, completedSteps }: ProgressStepperProps) {
  return (
    <div className="space-y-[var(--ds-space-050)]">
      {STEPS.map((step) => {
        const Icon = step.icon;
        const isActive = step.id === currentStep;
        const isCompleted = completedSteps.includes(step.id as any);

        return (
          <div
            key={step.id}
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
                isActive
                  ? 'bg-white text-[var(--ds-text)]'
                  : isCompleted
                  ? 'bg-[var(--ds-neutral-100)] text-[var(--ds-text-subtle)]'
                  : 'bg-[var(--ds-neutral-100)] text-[var(--ds-text-subtlest)]'
              }`}
            >
              {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
            </div>
            <span className="text-[var(--ds-font-size-075)] font-medium">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}
