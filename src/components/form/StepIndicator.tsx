import { cn } from '../../utils/cn'

const STEPS = ['Tipo', 'Relato', 'Identificação']

type StepIndicatorProps = {
  currentStep: number
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const progress = ((currentStep + 1) / STEPS.length) * 100

  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center justify-between text-xs text-brand-gray">
        <span>
          Etapa {currentStep + 1} de {STEPS.length}
        </span>
        <span className="font-bold text-brand-navy">{STEPS[currentStep]}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-brand-navy/10">
        <div
          className="animate-progress h-full rounded-full bg-brand-amber transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <ol className="mt-4 hidden gap-1 sm:flex">
        {STEPS.map((label, index) => (
          <li
            key={label}
            className={cn(
              'flex-1 text-center text-[11px] uppercase tracking-wide',
              index <= currentStep ? 'text-brand-navy font-bold' : 'text-brand-gray/70',
            )}
          >
            {label}
          </li>
        ))}
      </ol>
    </div>
  )
}
