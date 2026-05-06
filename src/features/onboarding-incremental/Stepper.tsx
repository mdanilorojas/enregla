import { Check } from '@/lib/lucide-icons'

export interface StepperStep {
  id: string
  label: string
}

export interface StepperProps {
  steps: StepperStep[]
  currentStepId: string
}

export function Stepper({ steps, currentStepId }: StepperProps) {
  const currentIndex = steps.findIndex(s => s.id === currentStepId)

  return (
    <div className="flex items-center justify-between w-full">
      {steps.map((step, i) => {
        const isActive = i === currentIndex
        const isCompleted = i < currentIndex
        const isLast = i === steps.length - 1

        return (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-[var(--ds-space-075)]">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[var(--ds-font-size-075)] font-semibold transition-colors ${
                  isCompleted
                    ? 'bg-[var(--ds-green-500)] text-white'
                    : isActive
                    ? 'bg-[var(--ds-background-brand)] text-white'
                    : 'bg-[var(--ds-neutral-200)] text-[var(--ds-text-subtle)]'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-[var(--ds-font-size-075)] ${isActive ? 'font-semibold text-[var(--ds-text)]' : 'text-[var(--ds-text-subtle)]'}`}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div className={`h-0.5 flex-1 mx-[var(--ds-space-150)] ${isCompleted ? 'bg-[var(--ds-green-500)]' : 'bg-[var(--ds-border)]'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
