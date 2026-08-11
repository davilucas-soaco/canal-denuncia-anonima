import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPool, sql } from '../db.js'
import {
  envioNotificacoesHabilitado,
  logEnvioSuprimido,
} from '../config/envioNotificacoes.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

function getEncryptionKey() {
  const secret = process.env.EMAIL_SETTINGS_ENCRYPTION_KEY?.trim()
  if (!secret) {
    throw new Error(
      'EMAIL_SETTINGS_ENCRYPTION_KEY não configurado no .env do backend.',
    )
  }
  return createHash('sha256').update(secret).digest()
}

export function encryptSecret(value) {
  const key = getEncryptionKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  const payload = Buffer.concat([encrypted, tag])
  return `v1:${iv.toString('base64url')}:${payload.toString('base64url')}`
}

export function decryptSecret(payload) {
  const [version, ivRaw, encryptedRaw] = String(payload || '').split(':')
  if (version !== 'v1' || !ivRaw || !encryptedRaw) {
    throw new Error('Segredo criptografado inválido.')
  }
  const key = getEncryptionKey()
  const data = Buffer.from(encryptedRaw, 'base64url')
  const tag = data.subarray(data.length - 16)
  const ciphertext = data.subarray(0, data.length - 16)
  const decipher = createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(ivRaw, 'base64url'),
  )
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString(
    'utf8',
  )
}

function mapSettingsRow(row) {
  if (!row) return null
  return {
    id: row.id,
    provider: row.provider,
    fromEmail: row.from_email,
    fromName: row.from_name,
    clientId: row.client_id,
    clientSecretEncrypted: row.client_secret_encrypted,
    refreshTokenEncrypted: row.refresh_token_encrypted,
    notifyTo: row.notify_to || '',
    lastTestedAt: row.last_tested_at,
    lastError: row.last_error,
    credentialBlockedAt: row.credential_blocked_at,
    credentialBlockCode: row.credential_block_code,
    credentialBlockSummary: row.credential_block_summary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function fetchEmailProviderSettings() {
  const pool = await getPool()
  const result = await pool.request().query(`
    SELECT TOP 1
      id, provider, from_email, from_name, client_id,
      client_secret_encrypted, refresh_token_encrypted, notify_to,
      last_tested_at, last_error, credential_blocked_at,
      credential_block_code, credential_block_summary,
      created_at, updated_at
    FROM dbo.email_provider_settings
    ORDER BY updated_at DESC
  `)
  return mapSettingsRow(result.recordset[0] || null)
}

export function sanitizeEmailProviderSettings(settings) {
  return {
    configured: Boolean(settings),
    provider: 'gmail_api',
    fromEmail: settings?.fromEmail ?? '',
    fromName: settings?.fromName ?? '',
    clientId: settings?.clientId ?? '',
    notifyTo: settings?.notifyTo ?? '',
    hasClientSecret: Boolean(settings?.clientSecretEncrypted),
    hasRefreshToken: Boolean(settings?.refreshTokenEncrypted),
    lastTestedAt: settings?.lastTestedAt
      ? new Date(settings.lastTestedAt).toISOString()
      : null,
    lastError: settings?.lastError ?? null,
    credentialBlockedAt: settings?.credentialBlockedAt
      ? new Date(settings.credentialBlockedAt).toISOString()
      : null,
    credentialBlockCode: settings?.credentialBlockCode ?? null,
    credentialBlockSummary: settings?.credentialBlockSummary ?? null,
    updatedAt: settings?.updatedAt
      ? new Date(settings.updatedAt).toISOString()
      : null,
  }
}

export function parseNotifyTo(value) {
  if (!value) return []
  return [
    ...new Set(
      String(value)
        .split(/[,;\s]+/)
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    ),
  ]
}

function normalizeRecipients(value) {
  if (!value) return []
  const list = Array.isArray(value) ? value : [value]
  return [
    ...new Set(list.map((e) => String(e).trim().toLowerCase()).filter(Boolean)),
  ]
}

function encodeHeaderUtf8(value) {
  if (/^[\x20-\x7E]*$/.test(value)) return value
  return `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`
}

function toBase64Url(data) {
  const buf = typeof data === 'string' ? Buffer.from(data, 'utf8') : data
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function buildRawMimeMessage(input) {
  const boundaryMixed = `mixed_${randomBytes(8).toString('hex')}`
  const boundaryAlt = `alt_${randomBytes(8).toString('hex')}`
  const from = `"${encodeHeaderUtf8(input.fromName)}" <${input.fromEmail}>`
  const lines = [`From: ${from}`, `To: ${input.to.join(', ')}`]
  if (input.cc.length > 0) lines.push(`Cc: ${input.cc.join(', ')}`)
  if (input.bcc.length > 0) lines.push(`Bcc: ${input.bcc.join(', ')}`)
  lines.push(`Subject: ${encodeHeaderUtf8(input.subject)}`, 'MIME-Version: 1.0')

  const attachments = input.attachments ?? []
  if (attachments.length === 0) {
    lines.push(
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from(input.html, 'utf8').toString('base64'),
    )
    return lines.join('\r\n')
  }

  lines.push(
    `Content-Type: multipart/mixed; boundary="${boundaryMixed}"`,
    '',
    `--${boundaryMixed}`,
  )
  lines.push(
    `Content-Type: multipart/alternative; boundary="${boundaryAlt}"`,
    '',
    `--${boundaryAlt}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(input.html, 'utf8').toString('base64'),
    `--${boundaryAlt}--`,
  )

  for (const att of attachments) {
    const disposition =
      att.disposition ?? (att.contentId ? 'inline' : 'attachment')
    lines.push(
      `--${boundaryMixed}`,
      `Content-Type: ${att.mimeType}; name="${att.filename}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: ${disposition}; filename="${att.filename}"`,
      ...(att.contentId
        ? [`Content-ID: <${att.contentId}>`, `X-Attachment-Id: ${att.contentId}`]
        : []),
      '',
      att.contentBase64,
    )
  }
  lines.push(`--${boundaryMixed}--`)
  return lines.join('\r\n')
}

const LOGO_EMAIL_CID = 'soaco-email-logo'
let logoEmailBase64Cache = null

function carregarLogoEmailBase64() {
  if (logoEmailBase64Cache) return logoEmailBase64Cache

  const candidatos = [
    resolve(__dirname, '..', '..', 'public', 'logo-soaco-email.png'),
    resolve(process.cwd(), 'public', 'logo-soaco-email.png'),
    resolve(process.cwd(), '..', 'admin', 'public', 'logo-soaco.png'),
    resolve(process.cwd(), '..', 'public', 'logo-soaco.png'),
  ]
  let ultimoErro
  for (const caminho of candidatos) {
    try {
      logoEmailBase64Cache = readFileSync(caminho).toString('base64')
      return logoEmailBase64Cache
    } catch (error) {
      ultimoErro = error
    }
  }
  throw new Error(
    `Logo padrão de e-mail não encontrada: ${
      ultimoErro instanceof Error ? ultimoErro.message : String(ultimoErro)
    }`,
  )
}

function incluirLogoPadraoInline(input) {
  if (!input.html.includes(`cid:${LOGO_EMAIL_CID}`)) return input
  if (input.attachments?.some((att) => att.contentId === LOGO_EMAIL_CID)) {
    return input
  }

  return {
    ...input,
    attachments: [
      ...(input.attachments ?? []),
      {
        filename: 'logo-soaco-email.png',
        mimeType: 'image/png',
        contentBase64: carregarLogoEmailBase64(),
        contentId: LOGO_EMAIL_CID,
        disposition: 'inline',
      },
    ],
  }
}

function oauthErrorHint(error) {
  switch (error) {
    case 'invalid_client':
      return 'Client ID ou Client Secret incorretos. Gere nova chave no Google Cloud e novo refresh token no OAuth Playground.'
    case 'unauthorized_client':
      return 'Tipo OAuth incorreto ou redirect ausente. Use Aplicativo da Web com redirect https://developers.google.com/oauthplayground.'
    case 'invalid_grant':
      return 'Refresh token revogado ou de outro Client ID. Gere novo refresh no Playground com as mesmas credenciais.'
    default:
      return 'Verifique credenciais Gmail e escopo https://mail.google.com/'
  }
}

async function refreshGmailAccessToken(settings) {
  const clientSecret = decryptSecret(settings.clientSecretEncrypted)
  const refreshToken = decryptSecret(settings.refreshTokenEncrypted)

  const body = new URLSearchParams({
    client_id: settings.clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  })

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  const json = await response.json()
  if (!response.ok || !json.access_token) {
    const hint = oauthErrorHint(json.error)
    throw new Error(
      `Falha ao renovar token do Gmail: ${response.status} — ${json.error ?? 'erro'} — ${json.error_description ?? hint}`,
    )
  }
  return json.access_token
}

async function sendEmailViaGmailApi(settings, input) {
  const accessToken = await refreshGmailAccessToken(settings)
  const to = normalizeRecipients(input.to)
  if (to.length === 0) throw new Error('Nenhum destinatário informado.')

  const raw = buildRawMimeMessage({
    fromEmail: settings.fromEmail,
    fromName: settings.fromName,
    to,
    cc: normalizeRecipients(input.cc),
    bcc: normalizeRecipients(input.bcc),
    subject: input.subject,
    html: input.html,
    attachments: input.attachments,
  })

  const response = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: toBase64Url(raw) }),
    },
  )

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(
      `Gmail API rejeitou o envio (${response.status}): ${errText.slice(0, 500)}`,
    )
  }
}

/**
 * @param {object} input
 * @param {{ force?: boolean }} [options] - force=true ignora o gate (uso no teste de credencial)
 * @returns {Promise<{ sent: boolean, dryRun: boolean }>}
 */
export async function sendSystemEmail(input, options = {}) {
  const force = Boolean(options.force)

  if (!force && !envioNotificacoesHabilitado()) {
    logEnvioSuprimido(
      'email',
      normalizeRecipients(input.to).join(', '),
      input.subject,
    )
    return { sent: false, dryRun: true }
  }

  const settings = await fetchEmailProviderSettings()
  if (!settings) {
    throw new Error(
      'Credencial de e-mail não configurada. Acesse Configurações no painel admin.',
    )
  }
  if (settings.credentialBlockedAt) {
    throw new Error(
      settings.credentialBlockSummary ??
        settings.lastError ??
        'Credencial de e-mail bloqueada. Reconfigure em Configurações.',
    )
  }
  await sendEmailViaGmailApi(settings, incluirLogoPadraoInline(input))
  return { sent: true, dryRun: false }
}

export async function markEmailCredentialError(settingsId, error) {
  const message = error instanceof Error ? error.message : String(error)
  const codeMatch = message.match(
    /\b(invalid_client|unauthorized_client|invalid_grant)\b/,
  )
  const pool = await getPool()
  const request = pool
    .request()
    .input('id', sql.UniqueIdentifier, settingsId)
    .input('last_error', sql.NVarChar(2000), message.slice(0, 2000))
    .input('block_code', sql.NVarChar(80), codeMatch?.[1] ?? null)
    .input(
      'block_summary',
      sql.NVarChar(500),
      codeMatch ? oauthErrorHint(codeMatch[1]) : null,
    )

  if (codeMatch) {
    await request.query(`
      UPDATE dbo.email_provider_settings
      SET last_error = @last_error,
          credential_blocked_at = SYSUTCDATETIME(),
          credential_block_code = @block_code,
          credential_block_summary = @block_summary,
          updated_at = SYSUTCDATETIME()
      WHERE id = @id
    `)
  } else {
    await request.query(`
      UPDATE dbo.email_provider_settings
      SET last_error = @last_error,
          credential_block_code = NULL,
          credential_block_summary = NULL,
          updated_at = SYSUTCDATETIME()
      WHERE id = @id
    `)
  }
}

export async function markEmailCredentialSuccess(settingsId) {
  const pool = await getPool()
  await pool
    .request()
    .input('id', sql.UniqueIdentifier, settingsId)
    .query(`
      UPDATE dbo.email_provider_settings
      SET last_tested_at = SYSUTCDATETIME(),
          last_error = NULL,
          credential_blocked_at = NULL,
          credential_block_code = NULL,
          credential_block_summary = NULL,
          updated_at = SYSUTCDATETIME()
      WHERE id = @id
    `)
}

export async function saveEmailProviderSettings({
  fromEmail,
  fromName,
  clientId,
  clientSecretEncrypted,
  refreshTokenEncrypted,
  notifyTo,
}) {
  const existing = await fetchEmailProviderSettings()
  const pool = await getPool()

  if (existing) {
    await pool
      .request()
      .input('id', sql.UniqueIdentifier, existing.id)
      .input('from_email', sql.NVarChar(200), fromEmail)
      .input('from_name', sql.NVarChar(200), fromName)
      .input('client_id', sql.NVarChar(500), clientId)
      .input('client_secret_encrypted', sql.NVarChar(sql.MAX), clientSecretEncrypted)
      .input('refresh_token_encrypted', sql.NVarChar(sql.MAX), refreshTokenEncrypted)
      .input('notify_to', sql.NVarChar(1000), notifyTo || null)
      .query(`
        UPDATE dbo.email_provider_settings
        SET from_email = @from_email,
            from_name = @from_name,
            client_id = @client_id,
            client_secret_encrypted = @client_secret_encrypted,
            refresh_token_encrypted = @refresh_token_encrypted,
            notify_to = @notify_to,
            last_error = NULL,
            credential_blocked_at = NULL,
            credential_block_code = NULL,
            credential_block_summary = NULL,
            updated_at = SYSUTCDATETIME()
        WHERE id = @id
      `)
    return fetchEmailProviderSettings()
  }

  await pool
    .request()
    .input('from_email', sql.NVarChar(200), fromEmail)
    .input('from_name', sql.NVarChar(200), fromName)
    .input('client_id', sql.NVarChar(500), clientId)
    .input('client_secret_encrypted', sql.NVarChar(sql.MAX), clientSecretEncrypted)
    .input('refresh_token_encrypted', sql.NVarChar(sql.MAX), refreshTokenEncrypted)
    .input('notify_to', sql.NVarChar(1000), notifyTo || null)
    .query(`
      INSERT INTO dbo.email_provider_settings (
        from_email, from_name, client_id,
        client_secret_encrypted, refresh_token_encrypted, notify_to
      )
      VALUES (
        @from_email, @from_name, @client_id,
        @client_secret_encrypted, @refresh_token_encrypted, @notify_to
      )
    `)

  return fetchEmailProviderSettings()
}
