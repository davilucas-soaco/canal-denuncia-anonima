/** Monta o texto consolidado enviado à API / banco. */
export function composeReportDescription(parts: {
  whatHappened: string
  contextDetails?: string
  freeReport: string
}): string {
  const blocks = [
    `O quê:\n${parts.whatHappened.trim()}`,
    parts.contextDetails?.trim()
      ? `Por quê / Quanto / Provas:\n${parts.contextDetails.trim()}`
      : null,
    `Relato livre:\n${parts.freeReport.trim()}`,
  ].filter(Boolean)

  return blocks.join('\n\n')
}
