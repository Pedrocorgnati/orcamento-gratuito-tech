// RESOLVED: extraída função duplicada entre auth/callback e auth/logout (G018)
import { type NextRequest } from 'next/server'

const DEFAULT_LOCALE = 'pt-BR'

export function detectLocaleFromRequest(request: NextRequest): string {
  // 1. Cookie NEXT_LOCALE
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value
  if (cookieLocale) return cookieLocale

  // 2. Referer header (extrair locale do path)
  const referer = request.headers.get('referer')
  if (referer) {
    const localeMatch = referer.match(/\/([a-z]{2}-[A-Z]{2})\//)
    if (localeMatch) return localeMatch[1]
  }

  return DEFAULT_LOCALE
}
