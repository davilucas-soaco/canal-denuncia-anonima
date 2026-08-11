import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type TouchEvent } from 'react'
import { cn } from '../utils/cn'

export function EthicsCommitment() {
  const cardRef = useRef<HTMLDivElement>(null)
  const [canHover, setCanHover] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(hover: hover) and (pointer: fine)')
    const sync = () => setCanHover(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  function updateSpot(clientX: number, clientY: number) {
    const el = cardRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * 100
    const y = ((clientY - rect.top) / rect.height) * 100
    el.style.setProperty('--spot-x', `${x}%`)
    el.style.setProperty('--spot-y', `${y}%`)
  }

  function handleCardMove(event: MouseEvent<HTMLDivElement>) {
    if (!canHover) return
    updateSpot(event.clientX, event.clientY)
  }

  function handleCardLeave() {
    const el = cardRef.current
    if (!el) return
    el.style.setProperty('--spot-x', '20%')
    el.style.setProperty('--spot-y', '0%')
  }

  function handleTouchMove(event: TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0]
    if (!touch) return
    updateSpot(touch.clientX, touch.clientY)
  }

  return (
    <section id="compromisso" className="bg-brand-mist">
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 sm:gap-10 sm:px-6 sm:py-16 md:py-20 lg:grid-cols-2 lg:gap-16">
        <div
          ref={cardRef}
          onMouseMove={handleCardMove}
          onMouseLeave={handleCardLeave}
          onTouchMove={handleTouchMove}
          className={cn(
            'light-card group relative order-2 overflow-hidden rounded-2xl bg-brand-navy p-6 text-white sm:p-8 md:p-10 lg:order-1',
            !canHover && 'light-card-ambient is-lit',
          )}
          style={
            {
              '--spot-x': '20%',
              '--spot-y': '0%',
            } as CSSProperties
          }
        >
          <div
            className={cn(
              'light-card-glow pointer-events-none absolute inset-0 transition-opacity duration-500',
              canHover ? 'opacity-80 group-hover:opacity-100' : 'opacity-100',
            )}
          />
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-amber sm:text-sm">
              Proteção ao denunciante
            </p>
            <p className="mt-5 text-xl font-bold leading-snug sm:mt-6 sm:text-2xl md:text-3xl">
              Relatos de boa-fé são protegidos. Retaliação não é tolerada.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-white/65">
              Se você entender que sofreu retaliação por ter denunciado, registre uma nova
              denúncia sobre essa situação.
            </p>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <h2 className="text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl md:text-4xl">
            Comprometimento com a ética e a transparência.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-brand-gray sm:mt-5 sm:text-base">
            O Canal reforça o compromisso da Só Aço com apuração responsável e ambiente
            de trabalho íntegro. Denunciar irregularidades é valorizado — e quem
            reporta não deve sofrer ameaças, pressão ou prejuízo por isso. Sua contribuição
            é importante para construirmos um ambiente cada vez mais saudável e ético.
          </p>
          <a
            href="#formulario"
            className="btn-amber mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl px-7 py-3.5 text-sm font-bold sm:mt-8 sm:w-auto"
          >
            Fazer denúncia
          </a>
        </div>
      </div>
    </section>
  )
}
