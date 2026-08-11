import { ArrowLeft } from '@phosphor-icons/react'
import { LEGAL_DOCS, type LegalDocId } from '../content/legal'

type LegalPageProps = {
  docId: LegalDocId
  onBack: () => void
  onOpenLegal: (docId: LegalDocId) => void
}

export function LegalPage({ docId, onBack, onOpenLegal }: LegalPageProps) {
  const doc = LEGAL_DOCS[docId]
  const otherId: LegalDocId = docId === 'privacidade' ? 'termos' : 'privacidade'
  const otherTitle =
    docId === 'privacidade' ? 'Termos do Canal' : 'Política de Privacidade'

  return (
    <section className="bg-brand-mist">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-bold text-brand-navy transition hover:text-brand-blue"
        >
          <ArrowLeft weight="bold" className="h-4 w-4" aria-hidden />
          Voltar ao canal
        </button>

        <article className="mt-8 rounded-2xl bg-white px-5 py-8 shadow-sm ring-1 ring-brand-navy/5 sm:px-10 sm:py-12">
          <span className="inline-flex rounded-full bg-brand-amber/15 px-3.5 py-1 text-sm text-brand-navy">
            Documento legal
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">
            {doc.title}
          </h1>
          <p className="mt-3 text-sm text-brand-gray">
            Última atualização: {doc.updatedAt}
          </p>
          <p className="mt-4 rounded-xl bg-brand-mist px-4 py-3 text-xs leading-relaxed text-brand-gray">
            Texto modelo para o Canal de Denúncias da Só Aço. Deve ser revisado e
            aprovado pela área jurídica / encarregado de dados (DPO) antes da
            publicação em produção. Substitua o e-mail do encarregado pelo contato
            oficial.
          </p>

          <div className="mt-10 space-y-8">
            {doc.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-lg font-bold text-brand-navy">{section.heading}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph.slice(0, 64)}
                    className="mt-3 text-sm leading-relaxed text-brand-charcoal/85"
                  >
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}
          </div>

          <p className="mt-10 border-t border-brand-navy/10 pt-6 text-sm text-brand-gray">
            Veja também:{' '}
            <button
              type="button"
              onClick={() => onOpenLegal(otherId)}
              className="font-bold text-brand-blue underline-offset-2 hover:underline"
            >
              {otherTitle}
            </button>
          </p>
        </article>
      </div>
    </section>
  )
}
