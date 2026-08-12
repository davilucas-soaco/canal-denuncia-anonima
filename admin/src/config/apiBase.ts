/**
 * Base da API.
 * Em produção na Vercel, HTTPS do front não pode chamar http://IP (mixed content),
 * e rewrite da Vercel para IP:porta falha. Usamos o túnel Cloudflare HTTPS.
 */
const CLOUDFLARE_TUNNEL_API =
  'https://urw-blessed-publishing-sustainable.trycloudflare.com'

function normalizeBase(url: string | undefined): string | undefined {
  const trimmed = url?.trim().replace(/\/$/, '')
  return trimmed || undefined
}

function isUnusableProductionApi(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'http:') return true
    if (parsed.hostname.endsWith('.vercel.app')) return true
    return false
  } catch {
    return true
  }
}

export function resolveApiBase(fallback?: string): string | undefined {
  const fromEnv = normalizeBase(import.meta.env.VITE_API_URL as string | undefined)
  if (import.meta.env.PROD) {
    if (!fromEnv || isUnusableProductionApi(fromEnv)) {
      return CLOUDFLARE_TUNNEL_API
    }
  }
  return fromEnv ?? normalizeBase(fallback)
}
