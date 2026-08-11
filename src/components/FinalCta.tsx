import { SlidingAmberGroup } from './SlidingAmberGroup'

export function FinalCta() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 text-center sm:px-6 sm:py-16 md:py-24">
        <span className="inline-flex rounded-full bg-brand-mist px-3.5 py-1 text-xs text-brand-navy sm:text-sm">
          Pronto para denunciar
        </span>
        <h2 className="mx-auto mt-4 max-w-2xl text-2xl font-bold tracking-tight text-brand-navy sm:mt-5 sm:text-4xl md:text-5xl">
          Seu relato importa. Faça com segurança.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-brand-gray sm:mt-4 sm:text-base">
          Avance pelo formulário ou consulte um protocolo já existente.
        </p>
        <div className="mt-6 flex justify-center sm:mt-8">
          <SlidingAmberGroup
            className="w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:items-center"
            itemClassName="min-h-12 w-full px-6 py-3.5 text-sm sm:w-auto sm:px-8"
            idleClassName="text-brand-navy/70"
            items={[
              {
                href: '#formulario',
                label: 'Fazer denúncia',
                primary: true,
                className: 'inline-flex',
              },
              {
                href: '#acompanhar',
                label: 'Acompanhar protocolo',
                className: 'inline-flex',
              },
            ]}
          />
        </div>
      </div>
    </section>
  )
}
