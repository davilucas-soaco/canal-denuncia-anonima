import { REPORT_TYPES, type ReportTypeId } from '../../../types/report'
import { cn } from '../../../utils/cn'

type StepTypeProps = {
  value: ReportTypeId | ''
  onChange: (value: ReportTypeId) => void
  error?: string
}

export function StepType({ value, onChange, error }: StepTypeProps) {
  return (
    <div className="animate-fade-up space-y-4">
      <div>
        <h3 className="text-lg font-bold text-brand-navy">Tipo de denúncia</h3>
        <p className="mt-1 text-sm text-brand-gray">
          Escolha a categoria que melhor representa o ocorrido. Os exemplos de cada tipo
          estão na lista “Você pode formular denúncias sobre”, acima do formulário.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Tipo de denúncia">
        {REPORT_TYPES.map((type) => {
          const selected = value === type.id
          return (
            <button
              key={type.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(type.id)}
              className={cn(
                'rounded-xl border bg-white px-4 py-3.5 text-left transition duration-300 ease-out',
                'hover:-translate-y-0.5 hover:border-brand-amber/50 hover:shadow-[0_10px_24px_rgba(4,30,66,0.08)]',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-amber',
                'active:translate-y-0 active:scale-[0.99]',
                selected
                  ? 'border-brand-amber shadow-[0_10px_24px_rgba(255,173,0,0.18)] ring-1 ring-brand-amber/30'
                  : 'border-brand-navy/10',
              )}
            >
              <span className="block text-sm font-bold text-brand-navy">{type.label}</span>
              <span className="mt-1 block text-xs leading-relaxed text-brand-gray">
                {type.shortDescription}
              </span>
            </button>
          )
        })}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
