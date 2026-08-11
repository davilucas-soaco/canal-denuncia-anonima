import { Question } from '@phosphor-icons/react'

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-navy/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:gap-4 sm:px-6 sm:py-3">
        <a href="#topo" className="flex min-w-0 items-center gap-3 no-underline">
          <img
            src="/logo-soaco.png"
            alt="Só Aço — Produzindo com excelência"
            className="h-9 w-auto max-w-[150px] object-contain sm:h-12 sm:max-w-none"
          />
        </a>
        <nav className="flex shrink-0 items-center">
          <a
            href="#duvidas"
            className="btn-amber-slide inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-normal text-white/60 transition hover:text-white/90"
          >
            <Question weight="thin" className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Dúvidas
          </a>
        </nav>
      </div>
    </header>
  )
}
