// ---------------------------------------------------------------------------
// Middleware helper functions — extracted for testability
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Rate Limiting — in-memory, janela deslizante 60s
// ---------------------------------------------------------------------------

export type RateLimitEntry = { count: number; windowStart: number }

export const rateLimitStore = new Map<string, RateLimitEntry>()

export const RATE_LIMIT_WINDOW_MS = 60_000 // 60s

/**
 * Hard cap para evitar OOM em produção (standalone Node.js).
 * Entradas expiradas são limpas a cada 60s; se ainda acima do cap,
 * os registros mais antigos são descartados primeiro.
 */
const RATE_LIMIT_MAX_ENTRIES = 10_000

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore) {
      if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
        rateLimitStore.delete(key)
      }
    }
    // Hard cap — evicta os registros mais antigos se ainda acima do limite
    if (rateLimitStore.size > RATE_LIMIT_MAX_ENTRIES) {
      const sorted = [...rateLimitStore.entries()].sort(
        (a, b) => a[1].windowStart - b[1].windowStart
      )
      const excess = sorted.length - RATE_LIMIT_MAX_ENTRIES
      for (let i = 0; i < excess; i++) {
        rateLimitStore.delete(sorted[i]![0])
      }
    }
  }, 60_000).unref?.()
}

export const LIMITS: Record<string, number> = {
  api: 50, // /api/v1/* geral
  auth: 10, // /api/v1/admin/* e /api/auth/* (RATE_001)
  leads: 10, // /api/v1/leads
  admin_page: 10, // /[locale]/admin page (RATE_001)
}

// Matches /xx-XX/admin (any admin route)
export const ADMIN_ROUTE_PATTERN = /^\/[a-z]{2}-[A-Z]{2}\/admin/

export function getRateLimit(pathname: string): number {
  if (pathname.startsWith('/api/v1/leads')) return LIMITS.leads
  if (
    pathname.startsWith('/api/v1/admin') ||
    pathname.startsWith('/api/auth')
  )
    return LIMITS.auth
  if (pathname.startsWith('/api/')) return LIMITS.api
  // Rate limit para paginas admin e auth callback
  if (
    pathname.includes('/auth/callback') ||
    ADMIN_ROUTE_PATTERN.test(pathname)
  )
    return LIMITS.admin_page
  return 0 // sem rate limit para paginas normais
}

export function checkRateLimit(ip: string, pathname: string): boolean {
  const limit = getRateLimit(pathname)
  if (limit === 0) return true // sem rate limit

  const now = Date.now()
  const key = `${ip}:${pathname.split('/').slice(0, 4).join('/')}`
  const entry = rateLimitStore.get(key)

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(key, { count: 1, windowStart: now })
    return true // permitido
  }

  if (entry.count >= limit) return false // bloqueado

  entry.count++
  return true // permitido
}

// ---------------------------------------------------------------------------
// Locale Detection — cookie > Accept-Language > fallback (INT-030)
// ---------------------------------------------------------------------------

export function detectLocale(
  cookieLocale: string | undefined,
  acceptLanguage: string | null,
  supportedLocales: readonly string[],
  defaultLocale: string,
): string {
  // Prioridade 1: Cookie NEXT_LOCALE
  if (cookieLocale && supportedLocales.includes(cookieLocale)) {
    return cookieLocale
  }

  // Prioridade 2: Accept-Language header
  if (acceptLanguage) {
    const langs = acceptLanguage
      .split(',')
      .map((l) => {
        const [lang, q] = l.trim().split(';q=')
        return { lang: lang.trim(), q: parseFloat(q ?? '1') }
      })
      .sort((a, b) => b.q - a.q)

    for (const { lang } of langs) {
      // Correspondencia exata (pt-BR)
      if (supportedLocales.includes(lang)) return lang
      // Correspondencia de idioma base (pt -> pt-BR)
      const base = lang.split('-')[0]
      const match = supportedLocales.find((l) => l.startsWith(base))
      if (match) return match
    }
  }

  // Prioridade 3: Fallback
  return defaultLocale
}
