import { Minus, Plus } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { cn } from '../utils/cn'
import type { LegalDocId } from '../content/legal'
import { SlidingAmberGroup } from './SlidingAmberGroup'

const faqs = [
  {
    q: 'O que meu relato deve conter?',
    a: 'Quanto mais completo o relato, melhor a apuração. Sempre que possível, informe: O quê aconteceu (descrição da irregularidade); Quem (denunciados, vítimas, testemunhas ou envolvidos); Quando (ou desde quando); Onde (unidade, setor, local); Por quê (motivação ou causa, se conhecida); Quanto (valores ou impactos, quando aplicável); e Provas (anexos, se existirem).',
  },
  {
    q: 'O que pode ser denunciado neste Canal?',
    a: 'Irregularidades de ética e integridade: fraude, corrupção e lavagem de dinheiro (incluindo condutas da Lei Anticorrupção nº 12.846/2013); conflito de interesses; assédio moral ou sexual; discriminação; riscos de segurança, saúde e meio ambiente; uso indevido de bens, dados ou informações; retaliação; e outras violações ao código de ética, políticas internas ou à lei. Confira os exemplos em cada tipo na seção “Você pode formular denúncias sobre”.',
  },
  {
    q: 'A denúncia pode ser anônima?',
    a: 'Sim. O modo anônimo é o padrão e não exigimos login. Se optar pelo anonimato, evite incluir no texto detalhes que possam revelar a sua identidade. Você também pode, se quiser, deixar um contato opcional apenas para esclarecimentos.',
  },
  {
    q: 'Como a denúncia será tratada?',
    a: 'Após o envio, você recebe um protocolo. O relato é registrado com sigilo e encaminhado à equipe responsável da Só Aço. Se forem necessárias informações complementares, a solicitação poderá ser feita preservando o anonimato sempre que possível. A área competente apura o caso e, havendo confirmação de irregularidade, ações corretivas podem ser aplicadas.',
  },
  {
    q: 'Posso anexar evidências?',
    a: 'Sim. É possível enviar arquivos (PDF, imagens ou documentos) de forma opcional, com limite de tamanho e quantidade. Anexe apenas materiais pertinentes ao caso.',
  },
  {
    q: 'O que acontece em denúncias de assédio ou violência?',
    a: 'Relatos que envolvem interação entre pessoas (como assédio moral, assédio sexual ou violência psicológica) tendem a exigir indicação clara de quem são as pessoas envolvidas (quem praticou e quem foi alvo). Sem esses elementos, a apuração pode ficar limitada. Se você for terceiro relatando um caso, indique a vítima e, se souber, um meio de contato — a equipe poderá buscar ratificação dos fatos com a devida confidencialidade.',
  },
  {
    q: 'Denúncias envolvendo prestadores de serviço',
    a: 'Quando a pessoa denunciada for colaborador(a) de empresa prestadora de serviços, a Só Aço poderá dar ciência dos fatos à contratada responsável, para que a apuração ocorra no âmbito adequado, sempre com o máximo de sigilo possível.',
  },
  {
    q: 'Este canal serve para reclamações comerciais?',
    a: 'Não. Este espaço é exclusivo para denúncias de irregularidades e questões de ética e integridade. Para reclamações, pedidos, sugestões ou atendimento comercial, utilize os canais oficiais de relacionamento da Só Aço. Dúvidas rotineiras de RH sem indício de irregularidade também devem seguir o canal interno de pessoas.',
  },
  {
    q: 'Haverá proteção contra retaliação?',
    a: 'A comunicação de irregularidades de boa-fé é valorizada pela Só Aço. Ameaças ou danos ao denunciante não são tolerados. Se você entender que está sofrendo retaliação, registre uma nova denúncia relatando essa situação e guarde o protocolo.',
  },
  {
    q: 'Como a LGPD se aplica ao Canal?',
    a: 'Os dados pessoais eventualmente coletados no relato (incluindo comunicações posteriores) são usados para apuração da denúncia, com acesso restrito às pessoas ligadas ao tratamento do caso. Quando necessário e na medida da lei, informações podem ser compartilhadas com autoridades ou partes relacionadas ao processo, priorizando anonimização ou pseudonimização sempre que possível.',
  },
]

type FaqAccordionProps = {
  onOpenLegal?: (docId: LegalDocId) => void
}

export function FaqAccordion({ onOpenLegal }: FaqAccordionProps) {
  const [open, setOpen] = useState<number | null>(0)
  const [hovered, setHovered] = useState<number | null>(null)
  const [canHover, setCanHover] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(hover: hover) and (pointer: fine)')
    const sync = () => setCanHover(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  const active = canHover ? (hovered ?? open) : open

  function toggle(index: number) {
    setOpen((current) => (current === index ? null : index))
    setHovered(null)
  }

  return (
    <section id="duvidas" className="bg-brand-navy text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:gap-10 sm:px-6 sm:py-16 md:py-20 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
        <div>
          <span className="inline-flex rounded-full bg-white/10 px-3.5 py-1 text-sm text-brand-amber">
            Dúvidas frequentes
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Dúvidas frequentes sobre a utilização do Canal
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/60 sm:text-base">
            Respondemos às dúvidas mais comuns para ajudar você a utilizar o Canal
            corretamente.
          </p>
          <SlidingAmberGroup
            className="mt-8 w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:flex-wrap"
            itemClassName="min-h-11 w-full px-5 py-3.5 text-sm sm:w-auto sm:px-7"
            items={[
              {
                href: '#tipos',
                label: 'Ver tipos de denúncia',
                primary: true,
                className: 'inline-flex',
              },
              {
                label: 'Política de Privacidade',
                onClick: () => onOpenLegal?.('privacidade'),
                className: 'inline-flex',
              },
            ]}
          />
        </div>

        <div className="space-y-2">
          {faqs.map((item, index) => {
            const isOpen = active === index
            const hasActive = active !== null

            return (
              <div
                key={item.q}
                onMouseEnter={canHover ? () => setHovered(index) : undefined}
                onMouseLeave={canHover ? () => setHovered(null) : undefined}
                className={cn(
                  'rounded-2xl ring-1 transition-all duration-300 ease-out',
                  isOpen
                    ? 'z-10 bg-white/12 shadow-lg shadow-black/25 ring-brand-amber/50 md:scale-[1.02]'
                    : hasActive
                      ? 'bg-white/[0.03] ring-white/5 opacity-55 md:scale-[0.985]'
                      : 'bg-white/5 ring-white/10',
                )}
              >
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span
                    className={cn(
                      'text-base font-bold transition-colors',
                      isOpen ? 'text-white' : 'text-white/85',
                    )}
                  >
                    {item.q}
                  </span>
                  <span
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                      isOpen ? 'bg-brand-amber/15' : 'bg-white/5',
                    )}
                    aria-hidden
                  >
                    {isOpen ? (
                      <Minus weight="bold" className="h-5 w-5 text-brand-amber" />
                    ) : (
                      <Plus weight="bold" className="h-5 w-5 text-white/50" />
                    )}
                  </span>
                </button>
                <div
                  className={cn(
                    'grid transition-[grid-template-rows] duration-300 ease-out',
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-relaxed text-white/65">
                      {item.a}
                      {item.q === 'Como a LGPD se aplica ao Canal?' && onOpenLegal && (
                        <>
                          {' '}
                          <button
                            type="button"
                            onClick={() => onOpenLegal('privacidade')}
                            className="font-bold text-brand-amber underline-offset-2 hover:underline"
                          >
                            Ver Política de Privacidade
                          </button>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
