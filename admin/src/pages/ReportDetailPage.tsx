import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, DownloadSimple, Paperclip } from '@phosphor-icons/react'
import {
  attachmentDownloadUrl,
  getReport,
  getToken,
  updateReportStatus,
  uploadReportAttachments,
  type ReportDetail,
} from '../api'
import { AdminShell } from '../components/AdminShell'
import { AttachmentSlots } from '../components/AttachmentSlots'
import {
  formatDate,
  formatSize,
  STATUS_LABELS,
  STATUS_STYLES,
  WORKFLOW_STATUS_OPTIONS,
} from '../labels'

export function ReportDetailPage() {
  const { protocol = '' } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState<ReportDetail | null>(null)
  const [status, setStatus] = useState('')
  const [note, setNote] = useState('')
  const [statusFiles, setStatusFiles] = useState<File[]>([])
  const [fileInputKey, setFileInputKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await getReport(protocol)
      setReport(data)
      setStatus('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar.')
      setReport(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [protocol])

  async function handleStatus(event: FormEvent) {
    event.preventDefault()
    if (!report) return
    if (!status) {
      setError('Selecione um novo status.')
      return
    }
    if (status === 'aguardando_complemento' && !note.trim()) {
      setError(
        'Ao pedir complemento, escreva a mensagem que o denunciante verá ao consultar o protocolo.',
      )
      return
    }
    const statusChanged = status !== report.status
    if (!statusChanged && !note.trim() && statusFiles.length === 0) {
      setError('Altere o status, adicione uma nota ou anexe um arquivo.')
      return
    }
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      if (statusChanged || note.trim()) {
        await updateReportStatus(report.protocol, status, note.trim() || undefined)
      }
      if (statusFiles.length > 0) {
        await uploadReportAttachments(
          report.protocol,
          statusFiles,
          statusChanged || note.trim() ? undefined : note.trim() || undefined,
        )
      }
      setNote('')
      setStatusFiles([])
      setFileInputKey((k) => k + 1)
      if (status === 'descartada' && statusChanged) {
        navigate('/', { replace: true, state: { discarded: report.protocol } })
        return
      }
      if (status === 'aguardando_complemento' && statusChanged) {
        navigate('/', {
          replace: true,
          state: { complementRequested: report.protocol },
        })
        return
      }
      setSuccess(
        statusFiles.length > 0
          ? 'Status e anexos salvos.'
          : 'Status atualizado.',
      )
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar.')
    } finally {
      setSaving(false)
    }
  }

  async function downloadAttachment(id: string, name: string) {
    const token = getToken()
    const response = await fetch(attachmentDownloadUrl(id), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!response.ok) {
      setError('Não foi possível baixar o anexo.')
      return
    }
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    URL.revokeObjectURL(url)
  }

  async function triage(nextStatus: 'em_analise' | 'descartada', noteText: string) {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      await updateReportStatus(protocol, nextStatus, noteText)
      setNote('')
      if (nextStatus === 'descartada') {
        navigate('/', { replace: true, state: { discarded: protocol } })
        return
      }
      setSuccess('Denúncia encaminhada para apuração.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminShell title="Detalhe da denúncia">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-blue no-underline hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar à lista
      </Link>

      {loading && <p className="text-sm text-brand-gray">Carregando…</p>}
      {error && (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {report && (
        <div className="space-y-5">
          {report.status === 'recebida' && (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-800">
                Triagem de pendência
              </p>
              <h2 className="mt-1 text-lg font-bold text-brand-navy">
                Identifique e categorize esta denúncia
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-brand-navy/80">
                Toda denúncia nova fica pendente até a equipe decidir: seguir com a apuração ou
                descartar por má-fé.
              </p>
              <div className="mt-4">
                <label htmlFor="triage-note" className="mb-1 block text-xs font-bold text-brand-gray">
                  Nota da triagem (opcional)
                </label>
                <textarea
                  id="triage-note"
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ex.: relato coerente — encaminhar para apuração"
                  className="w-full rounded-xl border border-brand-navy/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-amber focus:ring-2 focus:ring-brand-amber/25"
                />
              </div>
              {success && <p className="mt-3 text-sm font-medium text-emerald-700">{success}</p>}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    void triage(
                      'em_analise',
                      note.trim() || 'Triagem: seguir em frente para apuração.',
                    )
                  }
                  className="btn-amber rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-60"
                >
                  Seguir em frente
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    void triage(
                      'descartada',
                      note.trim() || 'Triagem: descartada por má-fé.',
                    )
                  }
                  className="rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                >
                  Má-fé / Descartar
                </button>
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-brand-navy/10 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-brand-gray">
                  Protocolo
                </p>
                <p className="mt-1 font-mono text-2xl font-bold text-brand-navy">
                  {report.protocol}
                </p>
              </div>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${STATUS_STYLES[report.status] || STATUS_STYLES.recebida}`}
              >
                {STATUS_LABELS[report.status] || report.status}
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Meta label="Categoria" value={report.typeLabel} />
              <Meta
                label="Modalidade"
                value={report.isAnonymous ? 'Anônima' : 'Identificada'}
              />
              <Meta label="Quando" value={report.occurredAt} />
              <Meta label="Onde" value={report.location} />
              <Meta label="Registrado em" value={formatDate(report.submittedAt)} />
              <Meta label="Atualizado em" value={formatDate(report.updatedAt)} />
            </div>

            {!report.isAnonymous && report.contact && (
              <div className="mt-5 rounded-xl bg-brand-mist/70 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-brand-gray">
                  Contato informado
                </p>
                <p className="mt-1 text-sm text-brand-navy">
                  {[report.contact.name, report.contact.email, report.contact.phone]
                    .filter(Boolean)
                    .join(' · ') || '—'}
                </p>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-brand-navy/10 bg-white p-5 sm:p-6">
            <h2 className="text-sm font-bold text-brand-navy">Assunto do relato</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-brand-navy/85">
              {report.description}
            </p>
            {report.involved && (
              <>
                <h3 className="mt-5 text-sm font-bold text-brand-navy">Envolvidos</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-brand-navy/85">
                  {report.involved}
                </p>
              </>
            )}
          </section>

          <section className="rounded-2xl border border-brand-navy/10 bg-white p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-brand-blue" />
              <h2 className="text-sm font-bold text-brand-navy">
                Anexos ({report.attachments.length})
              </h2>
            </div>
            {report.attachments.length === 0 ? (
              <p className="mt-3 text-sm text-brand-gray">Nenhum anexo.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {report.attachments.map((file) => (
                  <li
                    key={file.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-brand-navy/10 bg-brand-mist/50 px-3.5 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-brand-navy">
                        {file.name}
                        {file.isInternal && (
                          <span className="ml-2 inline-flex rounded-full bg-brand-navy/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-navy">
                            Interno
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-brand-gray">
                        {formatSize(file.sizeBytes)} · {formatDate(file.uploadedAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void downloadAttachment(file.id, file.name)}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-brand-navy px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-blue"
                    >
                      <DownloadSimple className="h-3.5 w-3.5" />
                      Baixar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {report.status !== 'recebida' && (
            <section className="rounded-2xl border border-brand-navy/10 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-sm font-bold text-brand-navy">Atualizar status</h2>
              <form onSubmit={handleStatus} className="mt-4 space-y-3">
                <div>
                  <label htmlFor="new-status" className="mb-1 block text-xs font-bold text-brand-gray">
                    Novo status
                  </label>
                  <select
                    id="new-status"
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value)
                      setNote('')
                      setStatusFiles([])
                      setFileInputKey((k) => k + 1)
                      setSuccess(null)
                      setError(null)
                    }}
                    className="w-full max-w-sm rounded-xl border border-brand-navy/10 bg-brand-mist px-3 py-2.5 text-sm outline-none focus:border-brand-amber focus:ring-2 focus:ring-brand-amber/25"
                  >
                    <option value="">Selecione um status…</option>
                    {WORKFLOW_STATUS_OPTIONS.map((key) => (
                      <option key={key} value={key}>
                        {STATUS_LABELS[key]}
                      </option>
                    ))}
                  </select>
                </div>
                {status ? (
                  <>
                    <div>
                      <label htmlFor="note" className="mb-1 block text-xs font-bold text-brand-gray">
                        {status === 'aguardando_complemento'
                          ? 'Mensagem ao denunciante'
                          : 'Nota interna (opcional)'}
                      </label>
                      <textarea
                        id="note"
                        rows={3}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder={
                          status === 'aguardando_complemento'
                            ? 'Ex.: Informe o setor e a data aproximada do fato — esta mensagem será exibida na consulta pública do protocolo'
                            : 'Ex.: encaminhado para apuração com o gestor da área'
                        }
                        className="w-full rounded-xl border border-brand-navy/10 bg-brand-mist px-3 py-2.5 text-sm outline-none focus:border-brand-amber focus:ring-2 focus:ring-brand-amber/25"
                      />
                      {status === 'aguardando_complemento' && (
                        <p className="mt-1.5 text-xs leading-relaxed text-amber-800">
                          A nota digitada aqui aparece na consulta pública do protocolo.
                          {report.contact?.email
                            ? ` Também enviaremos um e-mail para ${report.contact.email} avisando sobre o pedido.`
                            : ' Se a denúncia for anônima (sem e-mail), o aviso fica só na consulta do protocolo.'}
                        </p>
                      )}
                    </div>
                    <div>
                      <AttachmentSlots
                        key={fileInputKey}
                        files={statusFiles}
                        onChange={(files) => {
                          setStatusFiles(files)
                          setSuccess(null)
                        }}
                        title="Anexos da apuração"
                        hint="Documentos da solução ou evidências internas. Só no painel — não aparecem na consulta pública. Até 5 arquivos, 10 MB cada."
                      />
                    </div>
                  </>
                ) : null}
                {success && <p className="text-sm font-medium text-emerald-700">{success}</p>}
                <button
                  type="submit"
                  disabled={saving || !status}
                  className="btn-amber rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-60"
                >
                  {saving ? 'Salvando…' : 'Salvar status'}
                </button>
              </form>
            </section>
          )}

          <section className="rounded-2xl border border-brand-navy/10 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-sm font-bold text-brand-navy">Histórico</h2>
            {report.events.length === 0 ? (
              <p className="mt-3 text-sm text-brand-gray">Nenhum evento registrado ainda.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {report.events.map((event) => (
                  <li
                    key={event.id}
                    className="rounded-xl border border-brand-navy/10 bg-brand-mist/40 px-3.5 py-3 text-sm"
                  >
                    <p className="font-medium text-brand-navy">
                      {event.eventType === 'complement_received'
                        ? 'Complemento recebido do canal público'
                        : event.eventType === 'admin_attachment'
                          ? 'Anexos internos adicionados'
                          : event.fromStatus
                            ? `${STATUS_LABELS[event.fromStatus] || event.fromStatus} → ${STATUS_LABELS[event.toStatus || ''] || event.toStatus}`
                            : event.eventType}
                    </p>
                    <p className="mt-0.5 text-xs text-brand-gray">
                      {formatDate(event.createdAt)}
                      {event.actorEmail ? ` · ${event.actorEmail}` : ''}
                    </p>
                    {event.note && (
                      <p className="mt-2 text-sm text-brand-navy/80">{event.note}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </AdminShell>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-brand-mist/70 px-3.5 py-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-brand-gray">{label}</p>
      <p className="mt-1 text-sm font-medium text-brand-navy">{value || '—'}</p>
    </div>
  )
}
