import { ArrowRight, Prohibit } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { REPORT_TYPES, type ReportTypeId } from '../types/report'
import { cn } from '../utils/cn'

const OUT_OF_SCOPE = [
  {
    id: 'comercial',
    label: 'Reclamações comerciais',
    shortDescription: 'Pedidos, suporte ou atendimento ao cliente.',
    description:
      'Reclamações, pedidos, sugestões comerciais ou atendimento ao cliente devem seguir os canais oficiais de relacionamento da Só Aço — não este Canal de Denúncias.',
    examples: [
      'Atraso, divergência ou cancelamento de pedidos',
      'Dúvida sobre cotação, prazo de entrega ou frete',
      'Reclamação de qualidade do material entregue ao cliente',
      'Segunda via de nota fiscal, boleto ou status de faturamento',
    ],
  },
  {
    id: 'rh_rotina',
    label: 'Dúvidas rotineiras de RH',
    shortDescription: 'Férias, ponto, benefícios sem irregularidade.',
    description:
      'Questões operacionais de RH (férias, ponto, benefícios, etc.) sem indício de irregularidade ética devem ser tratadas pessoalmente junto ao setor.',
    examples: [
      'Saldo de férias, banco de horas ou escala de turnos na fábrica',
      'Ajuste de ponto, adicional noturno ou horas extras',
      'Dúvida sobre VR, VT, ou outros benefícios',
      'Pedido de declaração, holerite ou atualização cadastral',
    ],
  },
  {
    id: 'sugestoes',
    label: 'Sugestões operacionais',
    shortDescription: 'Ideias sem indício de conduta indevida.',
    description:
      'Sugestões de melhoria operacional sem relação com ética, integridade ou irregularidade não são objeto deste Canal.',
    examples: [
      'Ideia de rearranjo de layout na produção, estoque ou expedição',
      'Sugestão de ferramenta, máquina ou EPI sem indício de risco omitido',
      'Proposta de melhoria em fluxo administrativo (compras, PCP, financeiro)',
      'Sugestão de horário, reunião ou comunicação interna sem irregularidade',
    ],
  },
  {
    id: 'boatos',
    label: 'Ofensas ou boatos',
    shortDescription: 'Conteúdo sem relação com irregularidade ética.',
    description:
      'Ofensas, boatos ou relatos sem vínculo com ética e integridade não são o propósito deste Canal. Use-o para irregularidades reais, com o máximo de detalhes possível.',
    examples: [
      'Fofoca sobre transferência de setor, demissão ou promoção',
      'Comentário ofensivo sobre colega da fábrica ou do escritório, sem fato irregular',
      'Boato sobre mudança de turno, meta ou gestão sem evidência de conduta indevida',
      'Desabafo pessoal sem descrição de irregularidade ética ou legal',
    ],
  },
  {
    id: 'pessoal',
    label: 'Assuntos pessoais',
    shortDescription: 'Sem relação com a Só Aço ou o trabalho.',
    description:
      'Assuntos estritamente pessoais, sem vínculo com a empresa, o ambiente de trabalho ou prestadores relacionados à Só Aço, não devem ser enviados por aqui.',
    examples: [
      'Conflito familiar ou de amizade fora do ambiente de trabalho',
      'Dívida, empréstimo ou disputa particular entre pessoas',
      'Assunto médico ou financeiro pessoal sem relação com a empresa',
      'Questão de vizinho, condomínio ou comunidade sem vínculo com a Só Aço',
    ],
  },
] as const

type OutOfScopeId = (typeof OUT_OF_SCOPE)[number]['id']

type ReportTypesProps = {
  selectedType?: ReportTypeId | ''
  onSelect: (typeId: ReportTypeId) => void
}

export function ReportTypes({ selectedType, onSelect }: ReportTypesProps) {
  const [expandedId, setExpandedId] = useState<ReportTypeId | null>(null)
  const [expandedOutId, setExpandedOutId] = useState<OutOfScopeId | null>(null)
  const [canHover, setCanHover] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(hover: hover) and (pointer: fine)')
    const sync = () => setCanHover(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  function handleCardClick(typeId: ReportTypeId) {
    if (!canHover && expandedId !== typeId) {
      setExpandedId(typeId)
      return
    }
    setExpandedId(null)
    onSelect(typeId)
  }

  function handleOutCardClick(id: OutOfScopeId) {
    setExpandedOutId((current) => (current === id ? null : id))
  }

  return (
    <section id="tipos" className="bg-brand-mist">
      <div className="mx-auto max-w-6xl space-y-14 px-4 py-12 sm:space-y-16 sm:px-6 sm:py-16 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-start lg:gap-16">
          <div>
            <span className="inline-flex rounded-full bg-brand-amber/15 px-3.5 py-1 text-xs text-brand-navy sm:text-sm">
              Escopo
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl md:text-4xl">
              Você pode formular denúncias sobre:
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-brand-gray sm:mt-4 sm:text-base">
              Selecione a categoria que melhor descreve a situação. Em cada tipo você
              encontra exemplos práticos — escolha o mais próximo e descreva os fatos no
              formulário.
            </p>
            <a
              href="#formulario"
              className="btn-amber mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl px-7 py-3.5 text-sm font-bold sm:mt-8 sm:w-auto"
            >
              Fazer denúncia
            </a>
          </div>

          <ul className="grid items-start gap-3 sm:grid-cols-2">
            {REPORT_TYPES.map((type) => {
              const selected = selectedType === type.id
              const previewOpen = expandedId === type.id
              const detailOpen = selected || previewOpen

              return (
                <li key={type.id} className="w-full">
                  <button
                    type="button"
                    onClick={() => handleCardClick(type.id)}
                    aria-expanded={detailOpen}
                    className={cn(
                      'group flex w-full items-start justify-between gap-3 rounded-xl border bg-white px-4 py-3.5 text-left transition-all duration-300 ease-out sm:px-5 sm:py-4',
                      'hover:-translate-y-0.5 hover:border-brand-amber/50 hover:shadow-[0_10px_24px_rgba(4,30,66,0.08)]',
                      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-amber',
                      'active:translate-y-0 active:scale-[0.99]',
                      selected || previewOpen
                        ? 'border-brand-amber shadow-[0_10px_24px_rgba(255,173,0,0.18)] ring-1 ring-brand-amber/30'
                        : 'border-brand-navy/10',
                    )}
                  >
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="line-clamp-2 min-h-[2.75rem] text-sm font-bold leading-snug text-brand-navy sm:text-base">
                        {type.label}
                      </span>

                      <div className="mt-1.5">
                        <div
                          className={cn(
                            'grid transition-[grid-template-rows] duration-300 ease-out',
                            detailOpen
                              ? 'grid-rows-[0fr]'
                              : canHover
                                ? 'grid-rows-[1fr] group-hover:grid-rows-[0fr] group-focus-visible:grid-rows-[0fr]'
                                : 'grid-rows-[1fr]',
                          )}
                        >
                          <div className="overflow-hidden">
                            <span className="block truncate text-sm leading-relaxed text-brand-gray">
                              {type.shortDescription}
                            </span>
                          </div>
                        </div>

                        <div
                          className={cn(
                            'grid transition-[grid-template-rows] duration-300 ease-out',
                            detailOpen
                              ? 'grid-rows-[1fr]'
                              : canHover
                                ? 'grid-rows-[0fr] group-hover:grid-rows-[1fr] group-focus-visible:grid-rows-[1fr]'
                                : 'grid-rows-[0fr]',
                          )}
                        >
                          <div className="overflow-hidden">
                            <p className="text-sm leading-relaxed text-brand-gray">
                              {type.description}
                            </p>
                            {type.examples?.length ? (
                              <ul className="mt-2.5 space-y-1.5 border-t border-brand-navy/8 pt-2.5">
                                {type.examples.map((example) => (
                                  <li
                                    key={example}
                                    className="flex gap-2 text-xs leading-snug text-brand-gray"
                                  >
                                    <span
                                      className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-amber"
                                      aria-hidden
                                    />
                                    <span>{example}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </span>
                    <ArrowRight
                      weight="bold"
                      className="group-hover-arrow mt-0.5 h-5 w-5 shrink-0 text-brand-navy/30 transition group-hover:text-brand-amber"
                      aria-hidden
                    />
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="grid gap-8 border-t border-brand-navy/10 pt-14 lg:grid-cols-[1fr_1.4fr] lg:items-start lg:gap-16">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3.5 py-1 text-xs text-red-800 sm:text-sm">
              <Prohibit weight="bold" className="h-3.5 w-3.5" aria-hidden />
              Fora do escopo
            </span>
            <h3 className="mt-4 text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">
              Não use o Canal para:
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-brand-gray sm:mt-4 sm:text-base">
              Estes assuntos devem seguir outros canais oficiais da Só Aço. O Canal de
              Denúncias é exclusivo para irregularidades de ética e integridade.
            </p>
          </div>

          <ul className="grid items-start gap-3 sm:grid-cols-2">
            {OUT_OF_SCOPE.map((item) => {
              const detailOpen = expandedOutId === item.id

              return (
                <li key={item.id} className="w-full">
                  <button
                    type="button"
                    onClick={() => handleOutCardClick(item.id)}
                    aria-expanded={detailOpen}
                    className={cn(
                      'group flex w-full items-start justify-between gap-3 rounded-xl border bg-white px-4 py-3.5 text-left transition-all duration-300 ease-out sm:px-5 sm:py-4',
                      'hover:-translate-y-0.5 hover:border-red-300/70 hover:shadow-[0_10px_24px_rgba(4,30,66,0.08)]',
                      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400',
                      'active:translate-y-0 active:scale-[0.99]',
                      detailOpen
                        ? 'border-red-300 shadow-[0_10px_24px_rgba(220,38,38,0.12)] ring-1 ring-red-200'
                        : 'border-brand-navy/10',
                    )}
                  >
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="line-clamp-2 min-h-[2.75rem] text-sm font-bold leading-snug text-brand-navy sm:text-base">
                        {item.label}
                      </span>

                      <div className="mt-1.5">
                        <div
                          className={cn(
                            'grid transition-[grid-template-rows] duration-300 ease-out',
                            detailOpen
                              ? 'grid-rows-[0fr]'
                              : canHover
                                ? 'grid-rows-[1fr] group-hover:grid-rows-[0fr] group-focus-visible:grid-rows-[0fr]'
                                : 'grid-rows-[1fr]',
                          )}
                        >
                          <div className="overflow-hidden">
                            <span className="block truncate text-sm leading-relaxed text-brand-gray">
                              {item.shortDescription}
                            </span>
                          </div>
                        </div>

                        <div
                          className={cn(
                            'grid transition-[grid-template-rows] duration-300 ease-out',
                            detailOpen
                              ? 'grid-rows-[1fr]'
                              : canHover
                                ? 'grid-rows-[0fr] group-hover:grid-rows-[1fr] group-focus-visible:grid-rows-[1fr]'
                                : 'grid-rows-[0fr]',
                          )}
                        >
                          <div className="overflow-hidden">
                            <p className="text-sm leading-relaxed text-brand-gray">
                              {item.description}
                            </p>
                            <ul className="mt-2.5 space-y-1.5 border-t border-brand-navy/8 pt-2.5">
                              {item.examples.map((example) => (
                                <li
                                  key={example}
                                  className="flex gap-2 text-xs leading-snug text-brand-gray"
                                >
                                  <span
                                    className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400"
                                    aria-hidden
                                  />
                                  <span>{example}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </span>
                    <Prohibit
                      weight="bold"
                      className="mt-0.5 h-5 w-5 shrink-0 text-red-400/80 transition group-hover:text-red-500"
                      aria-hidden
                    />
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
