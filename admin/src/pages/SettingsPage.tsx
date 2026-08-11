import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { EnvelopeSimple, FloppyDisk, PaperPlaneTilt } from '@phosphor-icons/react'
import { AdminShell } from '../components/AdminShell'
import {
  fetchEmailSettings,
  saveEmailSettings,
  sendTestEmail,
  type EmailSettings,
} from '../api'

const OAUTH_HELP = [
  'Habilite a Gmail API no Google Cloud Console.',
  'Crie credenciais OAuth tipo Aplicativo da Web.',
  'Adicione o redirect: https://developers.google.com/oauthplayground',
  'No OAuth Playground: escopo https://mail.google.com/, access type Offline.',
  'O e-mail remetente deve ser a mesma conta autorizada no Playground.',
]

const inputClass =
  'w-full rounded-xl border border-brand-navy/10 bg-brand-mist px-3.5 py-2.5 text-sm text-brand-navy outline-none transition focus:border-brand-amber focus:ring-2 focus:ring-brand-amber/25'

export function SettingsPage() {
  const [settings, setSettings] = useState<EmailSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [okMsg, setOkMsg] = useState<string | null>(null)
  const [testSuccess, setTestSuccess] = useState<{
    to: string
    at: string
    from: string
  } | null>(null)

  const [fromEmail, setFromEmail] = useState('')
  const [fromName, setFromName] = useState('Canal de Denúncias Só Aço')
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [refreshToken, setRefreshToken] = useState('')
  const [notifyTo, setNotifyTo] = useState('')
  const [testTo, setTestTo] = useState('')

  const load = useCallback(async () => {
    setError(null)
    try {
      const data = await fetchEmailSettings()
      setSettings(data)
      setFromEmail(data.fromEmail)
      setFromName(data.fromName || 'Canal de Denúncias Só Aço')
      setClientId(data.clientId)
      setNotifyTo(data.notifyTo || '')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setOkMsg(null)
    setTestSuccess(null)
    try {
      const result = await saveEmailSettings({
        fromEmail: fromEmail.trim(),
        fromName: fromName.trim(),
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim() || undefined,
        refreshToken: refreshToken.trim() || undefined,
        notifyTo: notifyTo.trim(),
      })
      setSettings(result.settings)
      setClientSecret('')
      setRefreshToken('')
      setOkMsg('Configurações de e-mail salvas com sucesso.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
      await load()
    } finally {
      setSaving(false)
    }
  }

  async function handleSendTest() {
    const dest = testTo.trim()
    if (!dest) {
      setError('Informe o e-mail de teste antes de enviar.')
      return
    }
    if (!settings?.configured) {
      setError('Salve a credencial (Client Secret e Refresh Token) antes de testar.')
      return
    }
    setTesting(true)
    setError(null)
    setOkMsg(null)
    setTestSuccess(null)
    try {
      const result = await sendTestEmail(dest)
      setSettings(result.settings)
      const at = result.sentAt ?? result.settings.lastTestedAt ?? new Date().toISOString()
      const from = result.from ?? result.settings.fromEmail ?? fromEmail
      setTestSuccess({ to: result.to ?? dest, at, from })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar teste')
      await load()
    } finally {
      setTesting(false)
    }
  }

  return (
    <AdminShell title="Configurações">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand-gray">
            Painel · Configurações
          </p>
          <h2 className="mt-1 flex items-center gap-2 text-xl font-bold text-brand-navy">
            <EnvelopeSimple className="h-6 w-6 text-brand-amber" weight="duotone" />
            E-mail (Gmail API)
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-brand-gray">
            Credenciais OAuth e destinatários das notificações quando uma nova denúncia
            é registrada.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-brand-gray">Carregando…</p>
        ) : (
          <>
            {settings?.configured && (
              <div
                className={`rounded-xl border px-4 py-3 text-sm ${
                  settings.lastError
                    ? 'border-amber-200 bg-amber-50 text-amber-900'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-900'
                }`}
              >
                {settings.lastError ? (
                  <>
                    <strong>Último erro:</strong> {settings.lastError}
                    {settings.credentialBlockSummary && (
                      <p className="mt-1 text-xs opacity-90">
                        {settings.credentialBlockSummary}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    Credencial configurada
                    {settings.lastTestedAt && (
                      <span className="ml-2 text-xs opacity-80">
                        · último teste OK em{' '}
                        {new Date(settings.lastTestedAt).toLocaleString('pt-BR')}
                      </span>
                    )}
                  </>
                )}
              </div>
            )}

            {testSuccess && (
              <div
                role="status"
                className="rounded-xl border-2 border-emerald-300 bg-emerald-50 px-5 py-4"
              >
                <p className="text-base font-semibold text-emerald-900">
                  E-mail de teste enviado com sucesso
                </p>
                <p className="mt-1 text-sm text-emerald-800">
                  Destinatário: <strong>{testSuccess.to}</strong>
                </p>
                <p className="text-sm text-emerald-700">
                  Remetente: <strong>{testSuccess.from}</strong>
                </p>
                <p className="mt-2 text-xs text-emerald-600">
                  Enviado em {new Date(testSuccess.at).toLocaleString('pt-BR')} · Confira
                  a caixa de entrada e o spam.
                </p>
              </div>
            )}

            {okMsg && !testSuccess && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
                {okMsg}
              </div>
            )}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">
                {error}
              </div>
            )}

            <form
              onSubmit={handleSave}
              className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-brand-navy/5"
            >
              <div>
                <label className="mb-1.5 block text-xs font-bold text-brand-navy">
                  E-mail remetente
                </label>
                <input
                  type="email"
                  required
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  className={inputClass}
                  placeholder="canal@empresa.com.br"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-brand-navy">
                  Nome remetente
                </label>
                <input
                  type="text"
                  required
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-brand-navy">
                  Destinatários das notificações
                </label>
                <input
                  type="text"
                  value={notifyTo}
                  onChange={(e) => setNotifyTo(e.target.value)}
                  className={inputClass}
                  placeholder="rh@empresa.com.br, diretoria@empresa.com.br"
                />
                <p className="mt-1 text-xs text-brand-gray">
                  Quem recebe alerta ao chegar uma nova denúncia. Separe vários e-mails
                  por vírgula.
                </p>
              </div>

              <div className="border-t border-brand-navy/8 pt-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-brand-gray">
                  Credenciais OAuth Google
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-brand-navy">
                      Client ID
                    </label>
                    <input
                      type="text"
                      required
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className={`${inputClass} font-mono text-[13px]`}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-brand-navy">
                      Client Secret
                    </label>
                    <input
                      type="password"
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                      placeholder={
                        settings?.hasClientSecret
                          ? 'Já configurado. Preencha apenas para substituir.'
                          : 'Obrigatório na primeira configuração'
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-brand-navy">
                      Refresh Token
                    </label>
                    <input
                      type="password"
                      value={refreshToken}
                      onChange={(e) => setRefreshToken(e.target.value)}
                      placeholder={
                        settings?.hasRefreshToken
                          ? 'Já configurado. Preencha apenas para substituir.'
                          : 'Obrigatório na primeira configuração'
                      }
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-brand-navy/8 pt-4">
                <label className="mb-1.5 block text-xs font-bold text-brand-navy">
                  E-mail de teste
                </label>
                <input
                  type="email"
                  value={testTo}
                  onChange={(e) => setTestTo(e.target.value)}
                  placeholder="destino@empresa.com.br"
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-brand-gray">
                  Usa a credencial já salva — o teste envia de verdade pela Gmail API.
                  Notificações de novas denúncias exigem{' '}
                  <code className="rounded bg-brand-mist px-1">NOTIFICACOES_ENVIO_HABILITADO=true</code>{' '}
                  no servidor.
                </p>
              </div>

              <div className="rounded-xl border border-brand-navy/8 bg-brand-mist/60 p-4 text-xs text-brand-gray space-y-1">
                <p className="font-bold text-brand-navy">Ajuda OAuth Gmail</p>
                <ul className="list-disc space-y-0.5 pl-4">
                  {OAUTH_HELP.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <p className="pt-2">
                  No servidor:{' '}
                  <code className="rounded bg-white/80 px-1">EMAIL_SETTINGS_ENCRYPTION_KEY</code>{' '}
                  (criptografia dos secrets no banco).
                </p>
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving || testing}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-navy px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-navy/90 disabled:opacity-50"
                >
                  <FloppyDisk className="h-4 w-4" weight="bold" />
                  {saving ? 'Salvando…' : 'Salvar'}
                </button>
                <button
                  type="button"
                  disabled={testing || saving || !settings?.configured}
                  onClick={() => void handleSendTest()}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-600/30 bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  <PaperPlaneTilt className="h-4 w-4" weight="bold" />
                  {testing ? 'Enviando…' : 'Enviar teste'}
                </button>
              </div>

              {!settings?.configured && (
                <p className="text-xs text-amber-800">
                  Para testar o envio, salve a credencial uma vez (com Client Secret e
                  Refresh Token). Depois use &quot;Enviar teste&quot; quantas vezes quiser.
                </p>
              )}
            </form>
          </>
        )}
      </div>
    </AdminShell>
  )
}
