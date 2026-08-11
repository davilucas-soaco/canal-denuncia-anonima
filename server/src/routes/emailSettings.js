import express from 'express'
import {
  encryptSecret,
  fetchEmailProviderSettings,
  markEmailCredentialError,
  markEmailCredentialSuccess,
  sanitizeEmailProviderSettings,
  saveEmailProviderSettings,
  sendSystemEmail,
} from '../services/systemEmail.js'
import { buildEmailTestHtml } from '../services/emailHtmlTemplate.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValidEmail(value) {
  return EMAIL_RE.test(String(value || '').trim())
}

function validateNotifyTo(raw) {
  const text = String(raw ?? '').trim()
  if (!text) return { ok: true, value: '' }
  const parts = text
    .split(/[,;\s]+/)
    .map((e) => e.trim())
    .filter(Boolean)
  const invalid = parts.filter((e) => !isValidEmail(e))
  if (invalid.length) {
    return {
      ok: false,
      error: `E-mail(s) de notificação inválido(s): ${invalid.join(', ')}`,
    }
  }
  return { ok: true, value: parts.join(', ') }
}

export const emailSettingsRouter = express.Router()

emailSettingsRouter.get('/', async (_req, res) => {
  try {
    const settings = await fetchEmailProviderSettings()
    return res.json(sanitizeEmailProviderSettings(settings))
  } catch (error) {
    console.error('[GET /api/admin/email-settings]', error)
    return res
      .status(503)
      .json({ message: 'Erro ao carregar credencial de e-mail.' })
  }
})

emailSettingsRouter.post('/', async (req, res) => {
  try {
    const fromEmail = String(req.body.fromEmail || '').trim()
    const fromName = String(req.body.fromName || '').trim()
    const clientId = String(req.body.clientId || '').trim()
    const clientSecretPlain = String(req.body.clientSecret || '').trim()
    const refreshTokenPlain = String(req.body.refreshToken || '').trim()
    const notifyParsed = validateNotifyTo(req.body.notifyTo)

    if (!isValidEmail(fromEmail)) {
      return res.status(400).json({ message: 'E-mail remetente inválido.' })
    }
    if (!fromName) {
      return res.status(400).json({ message: 'Nome remetente é obrigatório.' })
    }
    if (!clientId) {
      return res.status(400).json({ message: 'Client ID é obrigatório.' })
    }
    if (!notifyParsed.ok) {
      return res.status(400).json({ message: notifyParsed.error })
    }

    const existing = await fetchEmailProviderSettings()

    if (!existing && (!clientSecretPlain || !refreshTokenPlain)) {
      return res.status(400).json({
        message:
          'Na primeira configuração, Client Secret e Refresh Token são obrigatórios.',
      })
    }

    let clientSecretEncrypted = existing?.clientSecretEncrypted ?? ''
    let refreshTokenEncrypted = existing?.refreshTokenEncrypted ?? ''

    if (clientSecretPlain) {
      clientSecretEncrypted = encryptSecret(clientSecretPlain)
    }
    if (refreshTokenPlain) {
      refreshTokenEncrypted = encryptSecret(refreshTokenPlain)
    }

    const saved = await saveEmailProviderSettings({
      fromEmail,
      fromName,
      clientId,
      clientSecretEncrypted,
      refreshTokenEncrypted,
      notifyTo: notifyParsed.value,
    })

    return res.json({
      ok: true,
      settings: sanitizeEmailProviderSettings(saved),
    })
  } catch (error) {
    console.error('[POST /api/admin/email-settings]', error)
    const msg =
      error instanceof Error ? error.message : 'Erro ao salvar credencial.'
    if (msg.includes('EMAIL_SETTINGS_ENCRYPTION_KEY')) {
      return res.status(503).json({ message: msg })
    }
    return res.status(500).json({ message: msg })
  }
})

emailSettingsRouter.post('/test', async (req, res) => {
  try {
    const to = String(req.body.to || '').trim()
    if (!isValidEmail(to)) {
      return res
        .status(400)
        .json({ message: 'Informe um e-mail de destino válido.' })
    }

    const settings = await fetchEmailProviderSettings()
    if (!settings) {
      return res.status(400).json({
        message: 'Credencial não configurada. Salve a credencial antes de testar.',
      })
    }

    const sentAtLabel = new Date().toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
    })

    // force: teste de credencial sempre tenta envio real (não dry-run)
    const result = await sendSystemEmail(
      {
        to,
        subject: 'Teste de credencial Gmail — Canal de Denúncias Só Aço',
        html: buildEmailTestHtml(settings.fromEmail, sentAtLabel),
      },
      { force: true },
    )

    if (!result.sent) {
      return res.status(400).json({
        message:
          'Envio real desabilitado (NOTIFICACOES_ENVIO_HABILITADO≠true). Nenhum e-mail foi enviado.',
        settings: sanitizeEmailProviderSettings(settings),
      })
    }

    await markEmailCredentialSuccess(settings.id)
    const refreshed = await fetchEmailProviderSettings()

    return res.json({
      ok: true,
      message: `E-mail de teste enviado para ${to}.`,
      sentAt: new Date().toISOString(),
      to,
      from: settings.fromEmail,
      settings: sanitizeEmailProviderSettings(refreshed),
    })
  } catch (error) {
    console.error('[POST /api/admin/email-settings/test]', error)
    const settings = await fetchEmailProviderSettings()
    if (settings) await markEmailCredentialError(settings.id, error)
    const refreshed = await fetchEmailProviderSettings()
    return res.status(400).json({
      message:
        error instanceof Error ? error.message : 'Falha no envio de teste.',
      settings: sanitizeEmailProviderSettings(refreshed),
    })
  }
})
