import { CheckCircle2, Building2, MapPin, User } from 'lucide-react';

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
    <div className="space-y-1">
      {STEPS.map((step) => {
        const Icon = step.icon;
        const isActive = step.id === currentStep;
        const isCompleted = completedSteps.includes(step.id as any);

        return (
          <div
            key={step.id}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
              isActive
                ? 'bg-gray-900 text-white'
                : isCompleted
                ? 'text-gray-500'
                : 'text-gray-400'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                isActive
                  ? 'bg-white text-gray-900'
                  : isCompleted
                  ? 'bg-gray-100 text-gray-500'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {isCompleted ? <CheckCircle2 size={14} /> : <Icon size={14} />}
            </div>
            <span className="text-[13px] font-medium">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}
