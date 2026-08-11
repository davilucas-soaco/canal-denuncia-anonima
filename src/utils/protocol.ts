/** Gera protocolo no formato SA-AAAA-XXXXXX (alfanumérico). */
export function generateProtocol(date = new Date()): string {
  const year = date.getFullYear()
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  const values = new Uint32Array(6)
  crypto.getRandomValues(values)
  for (let i = 0; i < 6; i++) {
    code += alphabet[values[i]! % alphabet.length]
  }
  return `SA-${year}-${code}`
}
