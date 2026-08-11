const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ||
  'http://localhost:3001'

const TOKEN_KEY = 'canal_admin_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export type AdminUser = {
  id: string
  email: string
  name: string
  role: 'rh' | 'diretoria' | string
}

export type ReportListItem = {
  id: string
  protocol: string
  status: string
  type: string
  typeLabel: string
  isAnonymous: boolean
  location: string
  submittedAt: string
  updatedAt: string
  attachmentCount: number
}

export type ReportDetail = {
  id: string
  protocol: string
  status: string
  type: string
  typeLabel: string
  description: string
  occurredAt: string
  location: string
  involved: string
  isAnonymous: boolean
  contact: { name: string | null; email: string | null; phone: string | null } | null
  submittedAt: string
  updatedAt: string
  attachments: {
    id: string
    name: string
    sizeBytes: number
    mimeType: string | null
    isInternal?: boolean
    uploadedAt: string
  }[]
  events: {
    id: string
    actorEmail: string | null
    eventType: string
    fromStatus: string | null
    toStatus: string | null
    note: string | null
    createdAt: string
  }[]
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json')
  }
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, { ...init, headers })
  } catch {
    throw new Error(
      'Não foi possível conectar à API. Verifique se o servidor está em execução (porta 3001).',
    )
  }
  if (response.status === 401) {
    setToken(null)
    throw new Error('Sessão expirada. Faça login novamente.')
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.message || body?.error || 'Falha na requisição.')
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export async function login(email: string, password: string) {
  return request<{ token: string; user: AdminUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function fetchMe() {
  return request<{ user: AdminUser }>('/api/auth/me')
}

export async function listReports(
  params: { status?: string; inbox?: string; q?: string } = {},
) {
  const query = new URLSearchParams()
  if (params.status) query.set('status', params.status)
  if (params.inbox) query.set('inbox', params.inbox)
  if (params.q) query.set('q', params.q)
  const qs = query.toString()
  return request<{ items: ReportListItem[] }>(`/api/admin/reports${qs ? `?${qs}` : ''}`)
}

export async function getReportStats() {
  return request<{
    byStatus: Record<string, number>
    pendencias: number
    andamento: number
    arquivo: number
    total: number
  }>('/api/admin/reports/stats')
}

export async function getReport(protocol: string) {
  return request<ReportDetail>(`/api/admin/reports/${encodeURIComponent(protocol)}`)
}

export async function updateReportStatus(protocol: string, status: string, note?: string) {
  return request<{ protocol: string; status: string; updatedAt: string }>(
    `/api/admin/reports/${encodeURIComponent(protocol)}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    },
  )
}

export async function uploadReportAttachments(
  protocol: string,
  files: File[],
  note?: string,
) {
  const formData = new FormData()
  for (const file of files) {
    formData.append('attachments', file)
  }
  if (note?.trim()) formData.append('note', note.trim())

  const token = getToken()
  const response = await fetch(
    `${API_BASE}/api/admin/reports/${encodeURIComponent(protocol)}/attachments`,
    {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    },
  )

  if (response.status === 401) {
    setToken(null)
    throw new Error('Sessão expirada. Faça login novamente.')
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.message || 'Falha ao enviar anexos.')
  }
  return (await response.json()) as { protocol: string; uploaded: number }
}

export function attachmentDownloadUrl(id: string) {
  return `${API_BASE}/api/admin/attachments/${encodeURIComponent(id)}/download`
}

export type EmailSettings = {
  configured: boolean
  provider: string
  fromEmail: string
  fromName: string
  clientId: string
  notifyTo: string
  hasClientSecret: boolean
  hasRefreshToken: boolean
  lastTestedAt: string | null
  lastError: string | null
  credentialBlockedAt: string | null
  credentialBlockCode: string | null
  credentialBlockSummary: string | null
  updatedAt: string | null
}

export type SaveEmailSettingsInput = {
  fromEmail: string
  fromName: string
  clientId: string
  clientSecret?: string
  refreshToken?: string
  notifyTo?: string
}

export async function fetchEmailSettings() {
  return request<EmailSettings>('/api/admin/email-settings')
}

export async function saveEmailSettings(payload: SaveEmailSettingsInput) {
  return request<{ ok: boolean; settings: EmailSettings }>('/api/admin/email-settings', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function sendTestEmail(to: string) {
  return request<{
    ok: boolean
    message: string
    sentAt?: string
    to?: string
    from?: string
    settings: EmailSettings
  }>('/api/admin/email-settings/test', {
    method: 'POST',
    body: JSON.stringify({ to: to.trim() }),
  })
}
