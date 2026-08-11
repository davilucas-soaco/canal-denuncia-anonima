import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(email.trim(), password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no login.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-navy px-4 py-10">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 10% 0%, rgba(255,173,0,0.16), transparent 50%), radial-gradient(ellipse 60% 50% at 95% 80%, rgba(30,34,170,0.35), transparent 55%)',
        }}
        aria-hidden
      />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <img
            src="/logo-soaco.png"
            alt="Só Aço — Produzindo com excelência"
            className="h-12 w-auto max-w-[200px] object-contain sm:h-14"
          />
          <span className="mt-5 inline-flex rounded-full border border-white/25 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white/80">
            Acesso interno
          </span>
          <h1 className="mt-3 text-2xl font-bold text-white">Canal de Denúncias</h1>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/60">
         
          </p>
        </div>

        <div className="rounded-2xl bg-white p-7 shadow-xl ring-1 ring-white/10 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-bold text-brand-navy">
                Usuário
              </label>
              <input
                id="email"
                type="text"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu usuário"
                className="w-full rounded-xl border border-brand-navy/10 bg-brand-mist px-3.5 py-3 text-sm text-brand-navy outline-none transition focus:border-brand-amber focus:ring-2 focus:ring-brand-amber/25"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-bold text-brand-navy">
                Senha
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-brand-navy/10 bg-brand-mist px-3.5 py-3 text-sm text-brand-navy outline-none transition focus:border-brand-amber focus:ring-2 focus:ring-brand-amber/25"
                required
              />
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="btn-amber w-full rounded-xl py-3 text-sm font-bold disabled:opacity-60"
            >
              {busy ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-white/45">
          Só Aço · Canal de Denúncias · uso interno
        </p>
      </div>
    </div>
  )
}
