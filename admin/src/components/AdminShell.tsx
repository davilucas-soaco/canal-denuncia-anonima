import { Link, useLocation } from 'react-router-dom'
import { GearSix, SignOut, Tray } from '@phosphor-icons/react'
import { useAuth } from '../auth'

export function AdminShell({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const { user, logout } = useAuth()
  const location = useLocation()

  const nav = [
    { to: '/', label: 'Denúncias', icon: Tray, match: (p: string) => p === '/' || p.startsWith('/denuncias') },
    { to: '/configuracoes', label: 'Configurações', icon: GearSix, match: (p: string) => p.startsWith('/configuracoes') },
  ]

  return (
    <div className="min-h-screen bg-brand-mist">
      <header className="relative overflow-hidden border-b border-white/10 bg-brand-navy text-white">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 55% 120% at 0% 0%, rgba(255,173,0,0.14), transparent 55%), radial-gradient(ellipse 45% 100% at 100% 100%, rgba(30,34,170,0.28), transparent 50%)',
          }}
          aria-hidden
        />
        <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Link
              to="/"
              className="flex shrink-0 items-center rounded-xl bg-white px-2.5 py-1.5 shadow-sm no-underline"
            >
              <img
                src="/logo-soaco.png"
                alt="Só Aço"
                className="h-9 w-auto max-w-[148px] object-contain object-left sm:h-10 sm:max-w-[168px]"
              />
            </Link>
            <div className="min-w-0 border-l border-white/15 pl-3 sm:pl-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-amber/90 sm:text-[11px]">
                Painel interno
              </p>
              <h1 className="truncate text-base font-bold sm:text-lg">{title}</h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <nav className="mr-1 hidden items-center gap-1 sm:flex">
              {nav.map((item) => {
                const active = item.match(location.pathname)
                const Icon = item.icon
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                      active
                        ? 'bg-white/15 text-white'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" weight={active ? 'fill' : 'bold'} />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            <div className="hidden text-right md:block">
              <p className="text-sm font-bold">{user?.name}</p>
              <p className="text-xs text-white/55">
                {user?.role === 'diretoria' ? 'Diretoria' : 'RH'} · {user?.email}
              </p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-white/90 transition hover:border-brand-amber/40 hover:bg-white/10"
            >
              <SignOut className="h-4 w-4" weight="bold" />
              Sair
            </button>
          </div>
        </div>

        <nav className="relative mx-auto flex max-w-6xl gap-1 px-4 pb-3 sm:hidden sm:px-6">
          {nav.map((item) => {
            const active = item.match(location.pathname)
            const Icon = item.icon
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                  active
                    ? 'bg-white/15 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" weight={active ? 'fill' : 'bold'} />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>

      <footer className="border-t border-brand-navy/10 py-5 text-center text-xs text-brand-gray">
        <span className="font-bold text-brand-navy">Só Aço</span>
        {' · '}Canal de Denúncias · acesso restrito
      </footer>
    </div>
  )
}
