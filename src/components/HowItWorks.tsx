import {
  FileText,
  Key,
  MagnifyingGlass,
  ShieldCheck,
} from '@phosphor-icons/react'

const steps = [
  {
    icon: FileText,
    title: 'Registre o relato',
    text: 'Preencha o formulário em etapas. Você pode permanecer anônimo.',
  },
  {
    icon: Key,
    title: 'Receba o protocolo',
    text: 'Ao enviar, um código único é gerado para consultar o andamento.',
  },
  {
    icon: MagnifyingGlass,
    title: 'Acompanhe e complemente',
    text: 'Use o protocolo para tirar dúvidas e adicionar provas.',
  },
  {
    icon: ShieldCheck,
    title: 'Apuração responsável',
    text: 'A equipe analisa o caso e aplica ações corretivas, se necessário.',
  },
]

export function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 md:py-14">
        <div className="max-w-2xl">
          <span className="inline-flex rounded-full bg-brand-blue/10 px-3 py-1 text-xs text-brand-navy">
            Processo
          </span>
          <h2 className="mt-3 text-xl font-bold tracking-tight text-brand-navy sm:text-2xl md:text-3xl">
            Como funciona o Canal de Denúncia
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-gray">
            Denuncie por este site, sem login. O IP e dados de navegação não são usados para
            identificar o denunciante.
          </p>
        </div>

        <div className="mt-6 grid items-stretch gap-4 sm:mt-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-5">
          <figure className="relative aspect-[4/3] overflow-hidden rounded-xl bg-brand-mist shadow-sm ring-1 ring-brand-navy/5 lg:aspect-auto lg:min-h-0 lg:h-full">
            <img
              src="/illustrations/how-it-works-screen.webp"
              alt="Colaborador acessando o canal de denúncia pelo celular no ambiente industrial"
              className="absolute inset-0 h-full w-full object-cover"
              width={1400}
              height={753}
              loading="lazy"
              decoding="async"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-brand-navy/25 via-transparent to-transparent"
              aria-hidden
            />
          </figure>

          <ol className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="rounded-xl bg-brand-mist p-3.5 shadow-sm ring-1 ring-brand-navy/5 sm:p-4"
              >
                <span className="text-[0.65rem] font-bold tracking-widest text-brand-amber">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="mt-2.5 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-navy text-brand-amber">
                  <step.icon weight="duotone" className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-2.5 text-sm font-bold text-brand-navy sm:text-base">
                  {step.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-brand-gray sm:text-sm">
                  {step.text}
                </p>
              </li>
            ))}
          </ol>
        </div>

        <a
          href="#formulario"
          className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-brand-navy px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-blue sm:mt-8 sm:w-auto"
        >
          Fazer denúncia
        </a>
      </div>
    </section>
  )
}
