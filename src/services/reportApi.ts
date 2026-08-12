import type { ReportPayload, SubmitReportResponse } from '../types/report'
import { generateProtocol } from '../utils/protocol'
import { resolveApiBase } from '../config/apiBase'

const API_BASE_URL = resolveApiBase()

export type ProtocolAttachment = {
  name: string
  sizeBytes: number
  uploadedAt: string
}

export type ProtocolLookupResponse = {
  protocol: string
  status: string
  type: string
  description: string
  isAnonymous: boolean
  submittedAt: string
  updatedAt: string
  attachmentCount: number
  attachments: ProtocolAttachment[]
  complementRequest: {
    message: string
    requestedAt: string
  } | null
}

/**
 * Envia a denúncia.
 * Com VITE_API_URL: POST multipart para /api/reports (sem auth).
 * Sem backend: simula envio e gera protocolo localmente.
 */
export async function submitReport(
  payload: ReportPayload,
): Promise<SubmitReportResponse> {
  if (API_BASE_URL) {
    const formData = new FormData()
    formData.append('type', payload.type)
    formData.append('description', payload.description)
    formData.append('occurredAt', payload.occurredAt)
    formData.append('location', payload.location)
    if (payload.involved) formData.append('involved', payload.involved)
    formData.append(
      'identification',
      payload.identification ? JSON.stringify(payload.identification) : '',
    )
    for (const file of payload.attachments) {
      formData.append('attachments', file)
    }

    const response = await fetch(`${API_BASE_URL}/api/reports`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const message = await response.text().catch(() => '')
      throw new Error(message || 'Não foi possível enviar a denúncia.')
    }

    return (await response.json()) as SubmitReportResponse
  }

  await new Promise((resolve) => setTimeout(resolve, 900))
  return {
    protocol: generateProtocol(),
    submittedAt: new Date().toISOString(),
  }
}

export async function lookupProtocol(protocol: string): Promise<ProtocolLookupResponse> {
  if (!API_BASE_URL) {
    throw new Error(
      'API não configurada. Defina VITE_API_URL no .env para consultar protocolos reais.',
    )
  }

  const response = await fetch(
    `${API_BASE_URL}/api/reports/${encodeURIComponent(protocol)}`,
  )

  if (response.status === 404) {
    throw new Error('Protocolo não encontrado.')
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.message || 'Não foi possível consultar o protocolo.')
  }

  const data = (await response.json()) as ProtocolLookupResponse
  return {
    ...data,
    description: data.description ?? '',
    attachments: data.attachments ?? [],
    complementRequest: data.complementRequest ?? null,
  }
}

export async function submitProtocolComplement(
  protocol: string,
  payload: { message: string; files: File[] },
): Promise<ProtocolLookupResponse> {
  if (!API_BASE_URL) {
    throw new Error(
      'API não configurada. Defina VITE_API_URL no .env para enviar o complemento.',
    )
  }

  const formData = new FormData()
  if (payload.message.trim()) {
    formData.append('message', payload.message.trim())
  }
  for (const file of payload.files) {
    formData.append('attachments', file)
  }

  const response = await fetch(
    `${API_BASE_URL}/api/reports/${encodeURIComponent(protocol)}/complement`,
    {
      method: 'POST',
      body: formData,
    },
  )

  if (!response.ok) {
    const raw = await response.text().catch(() => '')
    let message = raw
    try {
      const body = JSON.parse(raw) as { message?: string }
      message = body.message || raw
    } catch {
      /* keep raw text */
    }
    throw new Error(message || 'Não foi possível enviar o complemento.')
  }

  const data = (await response.json()) as Partial<ProtocolLookupResponse>
  return {
    protocol: data.protocol || protocol,
    status: data.status || 'em_analise',
    type: data.type || '',
    description: data.description || '',
    isAnonymous: data.isAnonymous ?? true,
    submittedAt: data.submittedAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
    attachmentCount: data.attachmentCount ?? 0,
    attachments: data.attachments ?? [],
    complementRequest: null,
  }
}

export async function addProtocolAttachments(
  protocol: string,
  files: File[],
): Promise<Pick<ProtocolLookupResponse, 'protocol' | 'attachmentCount' | 'updatedAt' | 'attachments'>> {
  if (!API_BASE_URL) {
    throw new Error(
      'API não configurada. Defina VITE_API_URL no .env para enviar anexos.',
    )
  }

  if (!files.length) {
    throw new Error('Selecione ao menos um arquivo.')
  }

  const formData = new FormData()
  for (const file of files) {
    formData.append('attachments', file)
  }

  const response = await fetch(
    `${API_BASE_URL}/api/reports/${encodeURIComponent(protocol)}/attachments`,
    {
      method: 'POST',
      body: formData,
    },
  )

  if (!response.ok) {
    const raw = await response.text().catch(() => '')
    let message = raw
    try {
      const body = JSON.parse(raw) as { message?: string }
      message = body.message || raw
    } catch {
      /* keep raw text */
    }
    throw new Error(message || 'Não foi possível adicionar os anexos.')
  }

  return (await response.json()) as Pick<
    ProtocolLookupResponse,
    'protocol' | 'attachmentCount' | 'updatedAt' | 'attachments'
  >
}
