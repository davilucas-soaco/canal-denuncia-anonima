import type { MouseEvent } from 'react'
import type { LegalDocId } from '../content/legal'

type FooterProps = {
  onOpenLegal?: (docId: LegalDocId) => void
}

export function Footer({ onOpenLegal }: FooterProps) {
  function openLegal(docId: LegalDocId, event: MouseEvent<HTMLAnchorElement>) {
    if (!onOpenLegal) return
    event.preventDefault()
    onOpenLegal(docId)
  }

  return (
    <footer className="bg-brand-navy text-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between lg:gap-16">
          <div className="max-w-sm">
            <img
              src="/logo-soaco.png"
              alt="Só Aço — Produzindo com excelência"
              className="h-10 w-auto opacity-90"
            />
            <p className="mt-5 text-sm leading-relaxed text-white/50">
              Canal de Denúncias Anônimas da Só Aço Industrial.
            </p>
          </div>

          <div className="grid flex-1 gap-8 sm:grid-cols-2 sm:gap-10 lg:max-w-2xl">
            <div>
              <p className="text-sm font-bold text-white">Contato do Canal</p>
              <div className="mt-4 space-y-2 text-sm text-white/60">
                <a
                  href="mailto:canal.anonimo@soacoindustrial.com.br"
                  className="block break-all no-underline transition hover:text-brand-amber"
                >
                  canal.anonimo@soacoindustrial.com.br
                </a>
                <a
                  href="tel:+558600000000"
                  className="block no-underline transition hover:text-brand-amber"
                >
                  +55 (86) 0000-0000
                </a>
                <p className="pt-1 text-xs leading-relaxed text-white/40">
                  Canal independente — não encaminha relatos a setores denunciados.
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-white">Institucional</p>
              <div className="mt-4 space-y-2 text-sm text-white/60">
                <a
                  href="https://www.soacoindustrial.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block no-underline transition hover:text-brand-amber"
                >
                  www.soacoindustrial.com.br
                </a>
                <p>
                  <a
                    href="https://www.instagram.com/gruposoaco"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="no-underline transition hover:text-brand-amber"
                  >
                    Instagram
                  </a>
                  <span className="mx-2 text-white/25">·</span>
                  <a
                    href="https://www.facebook.com/gruposoaco"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="no-underline transition hover:text-brand-amber"
                  >
                    Facebook
                  </a>
                  <span className="mx-2 text-white/25">·</span>
                  <a
                    href="https://www.linkedin.com/company/soacoindustrial"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="no-underline transition hover:text-brand-amber"
                  >
                    LinkedIn
                  </a>
                </p>
                <a
                  href="#privacidade"
                  onClick={(e) => openLegal('privacidade', e)}
                  className="block no-underline transition hover:text-brand-amber"
                >
                  Política de Privacidade
                </a>
                <a
                  href="#termos"
                  onClick={(e) => openLegal('termos', e)}
                  className="block no-underline transition hover:text-brand-amber"
                >
                  Termos do Canal
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6">
          <p className="text-xs text-white/35">
            © {new Date().getFullYear()} Só Aço Industrial. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
