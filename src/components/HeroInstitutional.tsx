import { EyeSlash, ShieldCheck } from '@phosphor-icons/react'
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type TouchEvent } from 'react'
import { cn } from '../utils/cn'
import { SlidingAmberGroup } from './SlidingAmberGroup'

const guarantees = [
  {
    icon: ShieldCheck,
    label: 'Suas informações estão protegidas',
  },
  {
    icon: EyeSlash,
    label: 'Garantia de anonimato',
  },
]

export function HeroInstitutional() {
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
    el.style.setProperty('--spot-x', '30%')
    el.style.setProperty('--spot-y', '20%')
  }

  function handleTouchMove(event: TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0]
    if (!touch) return
    updateSpot(touch.clientX, touch.clientY)
  }

  return (
    <section id="topo" className="relative overflow-hidden bg-brand-navy text-white">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 10% 0%, rgba(255,173,0,0.16), transparent 50%), radial-gradient(ellipse 60% 50% at 95% 80%, rgba(30,34,170,0.35), transparent 55%)',
        }}
      />
      <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-10 sm:gap-8 sm:px-6 sm:py-14 lg:grid-cols-[1.1fr_0.9fr] lg:grid-rows-[auto_auto] lg:items-stretch lg:gap-x-10 lg:gap-y-3 lg:py-16">
        <span className="animate-fade-up inline-flex w-fit rounded-full border border-white/80 bg-transparent px-3.5 py-1.5 text-xs text-white lg:col-start-1 lg:row-start-1">
          Canal de Denúncia Só Aço
        </span>

        <div className="flex flex-col justify-between gap-5 lg:col-start-1 lg:row-start-2 lg:gap-6">
          <div>
            <h1 className="animate-fade-up max-w-xl text-[1.65rem] font-bold leading-[1.2] tracking-tight sm:text-3xl md:text-[2.35rem] lg:text-[2.5rem]">
              Respeito às pessoas, à ética e ao ambiente de trabalho.
            </h1>
            <p
              className="animate-fade-up mt-3 max-w-md text-sm leading-relaxed text-white/70 sm:text-[0.95rem]"
              style={{ animationDelay: '80ms' }}
            >
              Espaço seguro para reportar condutas irregulares — sem login e com opção de
              total anonimato.
            </p>

            <ul
              className="animate-fade-up mt-5 space-y-2.5"
              style={{ animationDelay: '120ms' }}
            >
              {guarantees.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center gap-2.5 text-sm"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-amber/15">
                    <item.icon
                      weight="duotone"
                      className="h-4 w-4 text-brand-amber"
                      aria-hidden
                    />
                  </span>
                  <span className="font-bold text-white/90">{item.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="animate-fade-up" style={{ animationDelay: '160ms' }}>
            <SlidingAmberGroup
              className="w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:items-center"
              itemClassName="min-h-11 w-full px-4 py-2.5 text-sm sm:w-auto sm:px-6"
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

        <div
          ref={cardRef}
          onMouseMove={handleCardMove}
          onMouseLeave={handleCardLeave}
          onTouchMove={handleTouchMove}
          className={cn(
            'light-card animate-fade-up group relative aspect-[4/3] overflow-hidden rounded-xl ring-1 ring-white/10 transition duration-500 sm:aspect-[5/4] lg:col-start-2 lg:row-start-2 lg:aspect-auto lg:h-full lg:min-h-0',
            !canHover && 'light-card-ambient is-lit',
          )}
          style={
            {
              animationDelay: '100ms',
              '--spot-x': '30%',
              '--spot-y': '20%',
            } as CSSProperties
          }
        >
          <div
            className={cn(
              'light-card-glow pointer-events-none absolute inset-0 z-10 transition-opacity duration-500',
              canHover ? 'opacity-50 group-hover:opacity-80' : 'opacity-60',
            )}
          />
          <img
            src="/illustrations/hero-hands-phone.webp"
            alt="Colaborador usando o celular no ambiente industrial para acessar o canal de denúncia"
            className="absolute inset-0 h-full w-full object-cover"
            width={1200}
            height={800}
            decoding="async"
            fetchPriority="high"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/40 to-transparent"
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 z-20 p-4 sm:p-5">
            <p className="text-[0.7rem] font-bold uppercase tracking-widest text-brand-amber">
              Após o envio
            </p>
            <p className="mt-1.5 text-base font-bold leading-snug sm:text-lg">
              Você recebe um protocolo único para acompanhar o caso.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
