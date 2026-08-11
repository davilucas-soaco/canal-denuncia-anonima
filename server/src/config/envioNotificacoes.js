/**
 * Guard de envio real de notificações por e-mail.
 *
 * Por padrão o envio real fica DESABILITADO. Apenas produção deve definir
 * `NOTIFICACOES_ENVIO_HABILITADO=true` no `.env`.
 */

let statusLogado = false

/** True somente se NOTIFICACOES_ENVIO_HABILITADO=true (produção). */
export function envioNotificacoesHabilitado() {
  return process.env.NOTIFICACOES_ENVIO_HABILITADO?.trim().toLowerCase() === 'true'
}

/** Loga que um envio foi suprimido (modo dry-run). */
export function logEnvioSuprimido(canal, destino, assunto) {
  const alvo = assunto ? `${destino} — ${assunto}` : destino
  console.warn(
    `[envio-desabilitado] ${canal.toUpperCase()} NÃO enviado (dry-run): ${alvo}. ` +
      'Defina NOTIFICACOES_ENVIO_HABILITADO=true no .env para habilitar (apenas em produção).',
  )
}

/** Loga uma única vez, na subida, se o envio real está ligado ou não. */
export function logStatusEnvioNotificacoes() {
  if (statusLogado) return
  statusLogado = true
  if (envioNotificacoesHabilitado()) {
    console.log(
      '[envio-notificacoes] Envio real de e-mail HABILITADO (NOTIFICACOES_ENVIO_HABILITADO=true).',
    )
  } else {
    console.warn(
      '[envio-notificacoes] Envio real de e-mail DESABILITADO (dry-run). ' +
        'Em produção, defina NOTIFICACOES_ENVIO_HABILITADO=true no .env.',
    )
  }
}
