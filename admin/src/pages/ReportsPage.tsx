import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { MagnifyingGlass, WarningCircle } from '@phosphor-icons/react'
import { getReportStats, listReports, type ReportListItem } from '../api'
import { AdminShell } from '../components/AdminShell'
import {
  formatDate,
  INBOX_TABS,
  STATUS_LABELS,
  STATUS_STYLES,
  type InboxTab,
} from '../labels'

export function ReportsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [tab, setTab] = useState<InboxTab>('pendencias')
  const [items, setItems] = useState<ReportListItem[]>([])
  const [q, setQ] = useState('')
  const [discardNotice, setDiscardNotice] = useState<string | null>(null)
  const [stats, setStats] = useState({
    pendencias: 0,
    andamento: 0,
    arquivo: 0,
    total: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const state = location.state as {
      discarded?: string
      complementRequested?: string
    } | null
    if (!state?.discarded && !state?.complementRequested) return

    if (state.discarded) {
      setDiscardNotice(`Protocolo ${state.discarded} descartado por má-fé.`)
    } else if (state.complementRequested) {
      setTab('andamento')
      setDiscardNotice(
        `Protocolo ${state.complementRequested}: complemento solicitado ao denunciante.`,
      )
    }
    navigate('.', { replace: true, state: null })
    const timer = window.setTimeout(() => setDiscardNotice(null), 4000)
    return () => window.clearTimeout(timer)
  }, [location.state, navigate])

  async function load(nextTab = tab, nextQ = q) {
    setLoading(true)
    setError(null)
    try {
      const [list, nextStats] = await Promise.all([
        listReports({
          inbox: nextTab === 'todas' ? undefined : nextTab,
          q: nextQ || undefined,
        }),
        getReportStats(),
      ])
      setItems(list.items)
      setStats({
        pendencias: nextStats.pendencias,
        andamento: nextStats.andamento,
        arquivo: nextStats.arquivo,
        total: nextStats.total,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  function handleFilter(event: FormEvent) {
    event.preventDefault()
    void load(tab, q)
  }

  function tabCount(id: InboxTab) {
    if (id === 'pendencias') return stats.pendencias
    if (id === 'andamento') return stats.andamento
    if (id === 'arquivo') return stats.arquivo
    return stats.total
  }

  return (
    <AdminShell title="Denúncias recebidas">
      <div className="mb-5">
        <p className="text-sm leading-relaxed text-brand-gray">
          Toda denúncia nova entra em <strong className="text-brand-navy">Pendências</strong> para
          triagem: siga para apuração ou descarte por má-fé.
        </p>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {INBOX_TABS.map((item) => {
          const active = tab === item.id
          const count = tabCount(item.id)
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                active
                  ? 'bg-brand-navy text-white shadow-sm'
                  : 'border border-brand-navy/10 bg-white text-brand-navy hover:border-brand-amber/40'
              }`}
            >
              {item.label}
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  active
                    ? 'bg-white/15 text-white'
                    : item.id === 'pendencias' && count > 0
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-brand-mist text-brand-gray'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {tab === 'pendencias' && stats.pendencias > 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <WarningCircle weight="duotone" className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p>
            Há <strong>{stats.pendencias}</strong> denúncia(s) aguardando triagem. Abra o protocolo
            para categorizar: <strong>seguir em frente</strong> ou{' '}
            <strong>má-fé / descarte</strong>.
          </p>
        </div>
      )}

      {discardNotice && (
        <p className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {discardNotice}
        </p>
      )}

      <form
        onSubmit={handleFilter}
        className="mb-6 flex flex-col gap-3 rounded-2xl border border-brand-navy/10 bg-white p-4 shadow-sm sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label htmlFor="q" className="mb-1 block text-xs font-bold text-brand-gray">
            Buscar
          </label>
          <div className="relative">
            <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-brand-gray" />
            <input
              id="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Protocolo, local ou trecho do relato"
              className="w-full rounded-xl border border-brand-navy/10 bg-brand-mist py-2.5 pr-3 pl-10 text-sm outline-none focus:border-brand-amber focus:ring-2 focus:ring-brand-amber/25"
            />
          </div>
        </div>
        <button type="submit" className="btn-amber rounded-xl px-5 py-2.5 text-sm font-bold">
          Filtrar
        </button>
      </form>

      {error && (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-brand-navy/10 bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-sm text-brand-gray">Carregando denúncias…</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-sm text-brand-gray">
            {tab === 'pendencias'
              ? 'Nenhuma pendência no momento.'
              : 'Nenhuma denúncia encontrada neste filtro.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-brand-navy/10 bg-brand-mist/70 text-xs uppercase tracking-wide text-brand-gray">
                <tr>
                  <th className="px-4 py-3 font-bold">Protocolo</th>
                  <th className="px-4 py-3 font-bold">Categoria</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold">Modalidade</th>
                  <th className="px-4 py-3 font-bold">Registrado</th>
                  <th className="px-4 py-3 font-bold">Anexos</th>
                  <th className="px-4 py-3 font-bold">Ação</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-brand-navy/5 transition hover:bg-brand-mist/40"
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/denuncias/${item.protocol}`}
                        className="font-mono font-bold text-brand-blue no-underline hover:underline"
                      >
                        {item.protocol}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-brand-navy">{item.typeLabel}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${STATUS_STYLES[item.status] || STATUS_STYLES.recebida}`}
                      >
                        {STATUS_LABELS[item.status] || item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-brand-gray">
                      {item.isAnonymous ? 'Anônima' : 'Identificada'}
                    </td>
                    <td className="px-4 py-3 text-brand-gray">{formatDate(item.submittedAt)}</td>
                    <td className="px-4 py-3 text-brand-gray">{item.attachmentCount}</td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/denuncias/${item.protocol}`}
                        className={`inline-flex rounded-lg px-3 py-1.5 text-xs font-bold no-underline ${
                          item.status === 'recebida'
                            ? 'bg-amber-100 text-amber-950 hover:bg-amber-200'
                            : 'bg-brand-mist text-brand-navy hover:bg-brand-navy/10'
                        }`}
                      >
                        {item.status === 'recebida' ? 'Triar' : 'Abrir'}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  )
}
