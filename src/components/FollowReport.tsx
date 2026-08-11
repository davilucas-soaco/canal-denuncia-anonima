import {
  MagnifyingGlass,
  Paperclip,
  ShieldCheck,
  Clock,
  Tag,
  UserFocus,
  NotePencil,
  WarningCircle,
} from '@phosphor-icons/react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import {
  addProtocolAttachments,
  lookupProtocol,
  submitProtocolComplement,
  type ProtocolLookupResponse,
} from '../services/reportApi'
import { REPORT_TYPES } from '../types/report'
import { ATTACHMENT_LIMITS } from '../utils/validation'
import { AttachmentSlots } from './form/AttachmentSlots'
import { cn } from '../utils/cn'

const PROTOCOL_PATTERN = /^SA-\d{4}-[A-Z0-9]{6}$/i
const MAX_ATTACHMENTS_TOTAL = 10

const STATUS_LABELS: Record<string, string> = {
  recebida: 'Recebida',
  em_analise: 'Em análise',
  aguardando_complemento: 'Aguardando complemento',
  concluida: 'Concluída',
  arquivada: 'Arquivada',
  descartada: 'Encerrada',
}

const STATUS_STYLES: Record<string, string> = {
  recebida: 'bg-sky-50 text-sky-800 ring-sky-200',
  em_analise: 'bg-amber-50 text-amber-900 ring-amber-200',
  aguardando_complemento: 'bg-orange-50 text-orange-900 ring-orange-200',
  concluida: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  arquivada: 'bg-brand-mist text-brand-gray ring-brand-navy/10',
  descartada: 'bg-slate-100 text-slate-600 ring-slate-200',
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function typeLabel(typeId: string) {
  return REPORT_TYPES.find((t) => t.id === typeId)?.label ?? typeId
}

function canAddAttachments(status: string) {
  return (
    status !== 'arquivada' &&
    status !== 'concluida' &&
    status !== 'descartada' &&
    status !== 'aguardando_complemento'
  )
}

export function FollowReport() {
  const [protocol, setProtocol] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [result, setResult] = useState<ProtocolLookupResponse | null>(null)
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [complementMessage, setComplementMessage] = useState('')
  const [complementFiles, setComplementFiles] = useState<File[]>([])
  const [complementError, setComplementError] = useState<string | null>(null)
  const [sendingComplement, setSendingComplement] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const fromQuery = (params.get('protocolo') || params.get('protocol') || '')
      .trim()
      .toUpperCase()
    if (PROTOCOL_PATTERN.test(fromQuery)) {
      setProtocol(fromQuery)
    }
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const value = protocol.trim().toUpperCase()

    if (!value) {
      setError('Informe o número de protocolo.')
      setResult(null)
      return
    }

    if (!PROTOCOL_PATTERN.test(value)) {
      setError('Protocolo inválido. Use o formato SA-AAAA-XXXXXX recebido no envio.')
      setResult(null)
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)
    setUploadError(null)
    setComplementError(null)
    setNewFiles([])
    setComplementFiles([])
    setComplementMessage('')
    try {
      const data = await lookupProtocol(value)
      setResult(data)
      setProtocol(data.protocol)
    } catch (err) {
      setResult(null)
      setError(
        err instanceof Error ? err.message : 'Não foi possível consultar o protocolo.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleUploadAttachments() {
    if (!result) return

    if (!newFiles.length) {
      setUploadError('Selecione ao menos um arquivo para enviar.')
      return
    }

    const remaining = MAX_ATTACHMENTS_TOTAL - result.attachmentCount
    if (newFiles.length > remaining) {
      setUploadError(
        `Você pode adicionar no máximo mais ${remaining} arquivo(s) neste protocolo.`,
      )
      return
    }

    for (const file of newFiles) {
      if (file.size > ATTACHMENT_LIMITS.maxFileSize) {
        setUploadError(`"${file.name}" excede 10 MB.`)
        return
      }
    }

    setUploading(true)
    setUploadError(null)
    setSuccess(null)
    try {
      const updated = await addProtocolAttachments(result.protocol, newFiles)
      setResult({
        ...result,
        attachmentCount: updated.attachmentCount,
        updatedAt: updated.updatedAt,
        attachments: updated.attachments,
      })
      setNewFiles([])
      setSuccess('Anexos enviados com sucesso. A equipe poderá usá-los na apuração.')
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Não foi possível adicionar os anexos.',
      )
    } finally {
      setUploading(false)
    }
  }

  async function handleSendComplement() {
    if (!result) return

    const text = complementMessage.trim()
    if (text.length > 0 && text.length < 10) {
      setComplementError('O texto do complemento precisa ter ao menos 10 caracteres.')
      return
    }
    if (!text && complementFiles.length === 0) {
      setComplementError('Escreva uma resposta e/ou anexe arquivos para enviar o complemento.')
      return
    }

    const remaining = MAX_ATTACHMENTS_TOTAL - result.attachmentCount
    if (complementFiles.length > remaining) {
      setComplementError(
        `Você pode adicionar no máximo mais ${remaining} arquivo(s) neste protocolo.`,
      )
      return
    }

    for (const file of complementFiles) {
      if (file.size > ATTACHMENT_LIMITS.maxFileSize) {
        setComplementError(`"${file.name}" excede 10 MB.`)
        return
      }
    }

    setSendingComplement(true)
    setComplementError(null)
    setSuccess(null)
    try {
      const updated = await submitProtocolComplement(result.protocol, {
        message: text,
        files: complementFiles,
      })
      setResult({
        ...result,
        ...updated,
        type: updated.type || result.type,
        description: updated.description || result.description,
        isAnonymous: updated.isAnonymous ?? result.isAnonymous,
        submittedAt: updated.submittedAt || result.submittedAt,
        complementRequest: null,
      })
      setComplementMessage('')
      setComplementFiles([])
      setSuccess(
        'Complemento enviado. O protocolo voltou para análise da equipe responsável.',
      )
    } catch (err) {
      setComplementError(
        err instanceof Error ? err.message : 'Não foi possível enviar o complemento.',
      )
    } finally {
      setSendingComplement(false)
    }
  }

  const remainingSlots = result
    ? Math.max(0, MAX_ATTACHMENTS_TOTAL - result.attachmentCount)
    : 0
  const awaitingComplement = result?.status === 'aguardando_complemento'
  const allowUpload = result
    ? canAddAttachments(result.status) && remainingSlots > 0
    : false

  return (
    <section id="acompanhar" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl md:text-4xl">
            Acompanhe <span className="text-brand-blue">sua denúncia</span>
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-brand-gray sm:mt-4 sm:text-base">
            Consulte o status do protocolo. Se a equipe responsável pela análise dos protocolos pedir complemento, você verá a
            mensagem aqui e poderá responder mantendo o anonimato.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:mt-10 sm:flex-row"
        >
          <label className="sr-only" htmlFor="protocolo">
            Número de protocolo
          </label>
          <div className="relative flex-1">
            <MagnifyingGlass
              weight="duotone"
              className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-brand-gray"
              aria-hidden
            />
            <input
              id="protocolo"
              name="protocolo"
              type="text"
              autoComplete="off"
              inputMode="text"
              placeholder="Digite o número de protocolo"
              value={protocol}
              onChange={(e) => {
                setProtocol(e.target.value)
                setError(null)
                setSuccess(null)
              }}
              className="w-full rounded-xl border border-brand-navy/10 bg-brand-mist py-3.5 pr-4 pl-11 text-sm text-brand-navy outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="min-h-12 rounded-xl bg-brand-navy px-6 py-3.5 text-sm font-bold text-white transition hover:bg-brand-blue disabled:opacity-60"
          >
            {loading ? 'Consultando...' : 'Consultar'}
          </button>
        </form>

        {error && (
          <p className="mx-auto mt-4 max-w-xl text-center text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {result && (
          <div className="mx-auto mt-8 max-w-2xl animate-fade-up text-left">
            <div className="overflow-hidden rounded-2xl border border-brand-navy/10 bg-brand-mist/40 shadow-sm">
              <div className="border-b border-brand-navy/10 bg-white px-5 py-5 sm:px-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-brand-gray">
                      Protocolo
                    </p>
                    <p className="mt-1 font-mono text-xl font-bold tracking-wider text-brand-navy sm:text-2xl">
                      {result.protocol}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1',
                      STATUS_STYLES[result.status] ?? STATUS_STYLES.recebida,
                    )}
                  >
                    {STATUS_LABELS[result.status] || result.status}
                  </span>
                </div>
              </div>

              {awaitingComplement && result.complementRequest && (
                <div className="border-b border-orange-200 bg-orange-50 px-5 py-5 sm:px-6">
                  <div className="flex items-start gap-2.5">
                    <WarningCircle
                      weight="duotone"
                      className="mt-0.5 h-5 w-5 shrink-0 text-orange-600"
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-orange-950">
                        Complemento solicitado
                      </h3>
                      <p className="mt-1 text-xs text-orange-900/70">
                        Pedido em{' '}
                        {new Date(result.complementRequest.requestedAt).toLocaleString(
                          'pt-BR',
                        )}
                      </p>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-orange-950">
                        {result.complementRequest.message}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div>
                      <label
                        htmlFor="complemento-texto"
                        className="mb-1 block text-xs font-bold text-orange-950"
                      >
                        Sua resposta
                      </label>
                      <textarea
                        id="complemento-texto"
                        rows={4}
                        value={complementMessage}
                        onChange={(e) => {
                          setComplementMessage(e.target.value)
                          setComplementError(null)
                          setSuccess(null)
                        }}
                        placeholder="Descreva as informações solicitadas..."
                        className="w-full rounded-xl border border-orange-200 bg-white px-3.5 py-3 text-sm text-brand-navy outline-none focus:border-brand-amber focus:ring-2 focus:ring-brand-amber/25"
                      />
                    </div>

                    {remainingSlots > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-bold text-orange-950">
                          Anexos (opcional) — até {remainingSlots} arquivo(s)
                        </p>
                        <AttachmentSlots
                          files={complementFiles}
                          onChange={(files) => {
                            setComplementFiles(files.slice(0, remainingSlots))
                            setComplementError(null)
                            setSuccess(null)
                          }}
                        />
                      </div>
                    )}

                    {complementError && (
                      <p className="text-sm text-red-600" role="alert">
                        {complementError}
                      </p>
                    )}

                    {success && (
                      <p className="text-sm font-medium text-emerald-700" role="status">
                        {success}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => void handleSendComplement()}
                      disabled={sendingComplement}
                      className="btn-amber inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-50"
                    >
                      {sendingComplement ? 'Enviando...' : 'Enviar complemento'}
                    </button>
                  </div>
                </div>
              )}

              {success && !awaitingComplement && (
                <div className="border-b border-emerald-200 bg-emerald-50 px-5 py-3 sm:px-6">
                  <p className="text-sm font-medium text-emerald-800" role="status">
                    {success}
                  </p>
                </div>
              )}

              <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-6">
                <DetailItem
                  icon={<Tag weight="duotone" className="h-4 w-4" />}
                  label="Categoria"
                  value={typeLabel(result.type)}
                />
                <DetailItem
                  icon={<UserFocus weight="duotone" className="h-4 w-4" />}
                  label="Modalidade"
                  value={result.isAnonymous ? 'Anônima' : 'Identificada'}
                />
                <DetailItem
                  icon={<Clock weight="duotone" className="h-4 w-4" />}
                  label="Registrado em"
                  value={new Date(result.submittedAt).toLocaleString('pt-BR')}
                />
                <DetailItem
                  icon={<ShieldCheck weight="duotone" className="h-4 w-4" />}
                  label="Última atualização"
                  value={new Date(result.updatedAt).toLocaleString('pt-BR')}
                />
              </div>

              <div className="border-t border-brand-navy/10 bg-white px-5 py-5 sm:px-6">
                <div className="flex items-center gap-2">
                  <NotePencil weight="duotone" className="h-4 w-4 text-brand-blue" aria-hidden />
                  <h3 className="text-sm font-bold text-brand-navy">Assunto do relato</h3>
                </div>
                {result.description?.trim() ? (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-brand-navy/85">
                    {result.description}
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-brand-gray">
                    Nenhum texto de relato disponível para este protocolo.
                  </p>
                )}
              </div>

              <div className="border-t border-brand-navy/10 bg-white px-5 py-5 sm:px-6">
                <div className="flex items-center gap-2">
                  <Paperclip weight="duotone" className="h-4 w-4 text-brand-blue" aria-hidden />
                  <h3 className="text-sm font-bold text-brand-navy">
                    Anexos ({result.attachmentCount})
                  </h3>
                </div>

                {result.attachments.length === 0 ? (
                  <p className="mt-3 text-sm text-brand-gray">
                    Nenhum anexo enviado até o momento.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {result.attachments.map((file) => (
                      <li
                        key={`${file.name}-${file.uploadedAt}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-brand-navy/10 bg-brand-mist/50 px-3.5 py-2.5"
                      >
                        <span className="min-w-0 truncate text-sm font-medium text-brand-navy">
                          {file.name}
                        </span>
                        <span className="shrink-0 text-xs text-brand-gray">
                          {formatSize(file.sizeBytes)} ·{' '}
                          {new Date(file.uploadedAt).toLocaleDateString('pt-BR')}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {allowUpload && (
                <div className="border-t border-brand-navy/10 px-5 py-5 sm:px-6">
                  <h3 className="text-sm font-bold text-brand-navy">Adicionar mais provas</h3>
                  <p className="mt-1 text-xs leading-relaxed text-brand-gray">
                    Se surgirem novos documentos ou evidências, anexe aqui. Você ainda pode
                    enviar até {remainingSlots} arquivo(s) neste protocolo.
                  </p>

                  <div className="mt-4">
                    <AttachmentSlots
                      files={newFiles}
                      onChange={(files) => {
                        setNewFiles(files.slice(0, remainingSlots))
                        setUploadError(null)
                        setSuccess(null)
                      }}
                      error={uploadError ?? undefined}
                    />
                  </div>

                  {success && (
                    <p className="mt-3 text-sm font-medium text-emerald-700" role="status">
                      {success}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleUploadAttachments}
                    disabled={uploading || newFiles.length === 0}
                    className="btn-amber mt-4 inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-50"
                  >
                    {uploading ? 'Enviando...' : 'Enviar anexos'}
                  </button>
                </div>
              )}

              {result && !allowUpload && !awaitingComplement && (
                <div className="border-t border-brand-navy/10 px-5 py-4 sm:px-6">
                  <p className="text-sm text-brand-gray">
                    {remainingSlots === 0
                      ? 'Este protocolo já atingiu o limite de anexos.'
                      : 'Este protocolo não aceita novos anexos no status atual.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl bg-white px-3.5 py-3 ring-1 ring-brand-navy/10">
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand-gray">
        <span className="text-brand-amber">{icon}</span>
        {label}
      </p>
      <p className="mt-1.5 text-sm font-medium leading-snug text-brand-navy">{value}</p>
    </div>
  )
}
