import {
  fetchEmailProviderSettings,
  parseNotifyTo,
  sendSystemEmail,
} from './systemEmail.js'
import {
  buildNovaDenunciaEmailHtml,
  buildPedidoComplementoEmailHtml,
} from './emailHtmlTemplate.js'

const TYPE_LABELS = {
  fraude: 'Fraude, corrupção e lavagem de dinheiro',
  conflito_interesses: 'Conflito de interesses',
  assedio_moral: 'Assédio moral',
  assedio_sexual: 'Assédio sexual',
  discriminacao: 'Discriminação',
  seguranca_trabalho: 'Segurança, meio ambiente e saúde',
  uso_indevido: 'Uso indevido de bens, dados ou informações',
  outro: 'Outras irregularidades',
}

/** Formata data do fato (YYYY-MM-DD ou ISO) para DD/MM/AAAA. */
function formatOccurredAtLabel(value) {
  const raw = String(value || '').trim()
  if (!raw) return '—'

  const dateOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (dateOnly) {
    const [, y, m, d] = dateOnly
    return `${d}/${m}/${y}`
  }

  const parsed = new Date(raw)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  }

  return raw
}

/**
 * Notifica os e-mails configurados em notify_to sobre uma nova denúncia.
 * Fire-and-forget: erros são logados e não afetam o registro da denúncia.
 */
export async function notifyNovaDenuncia(report) {
  try {
    const settings = await fetchEmailProviderSettings()
    if (!settings) {
      console.warn(
        '[notifyNovaDenuncia] Credencial de e-mail não configurada — notificação ignorada.',
      )
      return
    }

    const recipients = parseNotifyTo(settings.notifyTo)
    if (recipients.length === 0) {
      console.warn(
        '[notifyNovaDenuncia] Nenhum destinatário em notify_to — notificação ignorada.',
      )
      return
    }

    const submittedAtLabel = report.submittedAt
      ? new Date(report.submittedAt).toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
        })
      : new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })

    const typeLabel = TYPE_LABELS[report.type] || report.type

    await sendSystemEmail({
      to: recipients,
      subject: `Nova denúncia — ${report.protocol} (${typeLabel})`,
      html: buildNovaDenunciaEmailHtml({
        ...report,
        typeLabel,
        occurredAt: formatOccurredAtLabel(report.occurredAt),
        submittedAtLabel,
      }),
    })

    console.log(
      `[notifyNovaDenuncia] Notificação enviada para ${recipients.join(', ')} — ${report.protocol}`,
    )
  } catch (error) {
    console.error(
      '[notifyNovaDenuncia] Falha ao notificar:',
      error instanceof Error ? error.message : error,
    )
  }
}

/**
 * Avisa o denunciante (se informou e-mail) que a equipe pediu complemento.
 * Fire-and-forget: não bloqueia a atualização de status.
 */
export async function notifyPedidoComplemento({
  protocol,
  contactEmail,
  contactName,
  message,
  isAnonymous,
}) {
  try {
    if (isAnonymous) {
      console.log(
        `[notifyPedidoComplemento] Protocolo ${protocol} é anônimo — e-mail ao denunciante ignorado.`,
      )
      return
    }

    const to = String(contactEmail || '')
      .trim()
      .toLowerCase()
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      console.warn(
        `[notifyPedidoComplemento] Protocolo ${protocol} sem e-mail de contato válido — notificação ignorada.`,
      )
      return
    }

    await sendSystemEmail({
      to,
      subject: `Complemento solicitado — protocolo ${protocol}`,
      html: buildPedidoComplementoEmailHtml({
        protocol,
        message,
        contactName,
      }),
    })

    console.log(
      `[notifyPedidoComplemento] E-mail enviado para ${to} — ${protocol}`,
    )
  } catch (error) {
    console.error(
      '[notifyPedidoComplemento] Falha ao notificar denunciante:',
      error instanceof Error ? error.message : error,
    )
  }
}
