import type { ReportIdentification } from '../../../types/report'
import { cn } from '../../../utils/cn'

type StepIdentificationProps = {
  isAnonymous: boolean
  identification: ReportIdentification
  onChangeAnonymous: (value: boolean) => void
  onChangeIdentification: (value: ReportIdentification) => void
  error?: string
}

export function StepIdentification({
  isAnonymous,
  identification,
  onChangeAnonymous,
  onChangeIdentification,
  error,
}: StepIdentificationProps) {
  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <h3 className="text-lg font-bold text-brand-navy">Identificação</h3>
        <p className="mt-1 text-sm text-brand-gray">
          Por padrão, sua denúncia é anônima. Se preferir, deixe um contato para
          acompanhar o caso — isso é opcional.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onChangeAnonymous(true)}
          className={cn(
            'rounded-xl border bg-white px-4 py-4 text-left transition duration-300 ease-out',
            'hover:-translate-y-0.5 hover:border-brand-amber/50 hover:shadow-[0_10px_24px_rgba(4,30,66,0.08)]',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-amber',
            isAnonymous
              ? 'border-brand-amber shadow-[0_10px_24px_rgba(255,173,0,0.18)] ring-1 ring-brand-amber/30'
              : 'border-brand-navy/10',
          )}
        >
          <span className="block text-sm font-bold text-brand-navy">Modo anônimo</span>
          <span className="mt-1 block text-xs text-brand-gray">
            Não enviaremos nenhum dado pessoal.
          </span>
        </button>
        <button
          type="button"
          onClick={() => onChangeAnonymous(false)}
          className={cn(
            'rounded-xl border bg-white px-4 py-4 text-left transition duration-300 ease-out',
            'hover:-translate-y-0.5 hover:border-brand-amber/50 hover:shadow-[0_10px_24px_rgba(4,30,66,0.08)]',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-amber',
            !isAnonymous
              ? 'border-brand-amber shadow-[0_10px_24px_rgba(255,173,0,0.18)] ring-1 ring-brand-amber/30'
              : 'border-brand-navy/10',
          )}
        >
          <span className="block text-sm font-bold text-brand-navy">Identificar-me</span>
          <span className="mt-1 block text-xs text-brand-gray">
            Deixe um contato para eventuais esclarecimentos.
          </span>
        </button>
      </div>

      {!isAnonymous && (
        <div className="space-y-4 border border-brand-navy/10 bg-brand-mist p-4">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-bold text-brand-navy">
              Nome (opcional)
            </label>
            <input
              id="name"
              type="text"
              value={identification.name ?? ''}
              onChange={(e) =>
                onChangeIdentification({ ...identification, name: e.target.value })
              }
              className="w-full border border-brand-navy/15 bg-white px-4 py-3 text-sm outline-none focus:border-brand-blue"
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-bold text-brand-navy">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={identification.email ?? ''}
              onChange={(e) =>
                onChangeIdentification({ ...identification, email: e.target.value })
              }
              placeholder="seu@email.com"
              className="w-full border border-brand-navy/15 bg-white px-4 py-3 text-sm outline-none placeholder:text-brand-gray/60 focus:border-brand-blue"
            />
          </div>
          <div>
            <label htmlFor="phone" className="mb-1.5 block text-sm font-bold text-brand-navy">
              Telefone (opcional)
            </label>
            <input
              id="phone"
              type="tel"
              value={identification.phone ?? ''}
              onChange={(e) =>
                onChangeIdentification({ ...identification, phone: e.target.value })
              }
              placeholder="(00) 00000-0000"
              className="w-full border border-brand-navy/15 bg-white px-4 py-3 text-sm outline-none placeholder:text-brand-gray/60 focus:border-brand-blue"
            />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
