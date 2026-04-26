import { NextRequest, NextResponse } from 'next/server'
import { sessionService } from '@/services/session.service'
import { SessionStatus, SESSION_TTL_HOURS } from '@/lib/enums'
import { COOKIE_NAMES } from '@/lib/constants'
import { sessionRateLimiter } from '@/lib/rate-limiter'
import { buildError, ERROR_CODES } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { captureAttribution } from '@/lib/analytics/captureAttribution'

const APP_LOCALES = ['pt-BR', 'en-US', 'es-ES', 'it-IT'] as const
type AppLocale = (typeof APP_LOCALES)[number]

function coerceLocale(raw: string | null): AppLocale {
  return APP_LOCALES.includes(raw as AppLocale) ? (raw as AppLocale) : 'pt-BR'
}

function sanitizePreselect(raw: string | null): string | null {
  if (!raw) return null
  const n = Number.parseInt(raw, 10)
  if (!Number.isInteger(n) || n < 1 || n > 11) return null
  return String(n)
}

function appendPreselect(url: URL, preselect: string | null): URL {
  if (preselect) url.searchParams.set('preselect', preselect)
  return url
}

export async function GET(request: NextRequest) {
  const locale = coerceLocale(request.nextUrl.searchParams.get('locale'))
  const preselect = sanitizePreselect(request.nextUrl.searchParams.get('preselect'))
  const existingId = request.cookies.get(COOKIE_NAMES.SESSION_ID)?.value
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  // Reaproveita sessão existente só se válida e não expirada
  if (existingId) {
    const existing = await sessionService.findById(existingId).catch(() => null)
    if (existing) {
      const expired = sessionService.isExpired({
        expires_at: existing.expires_at,
        status: existing.status,
      })

      if (!expired) {
        if (existing.status === SessionStatus.COMPLETED) {
          return NextResponse.redirect(new URL(`/${locale}/result`, request.url))
        }
        if (existing.current_question_id) {
          return NextResponse.redirect(
            appendPreselect(
              new URL(`/${locale}/flow/${existing.current_question_id}`, request.url),
              existing.current_question_id === 'Q001' ? preselect : null,
            ),
          )
        }
      } else if (existing.status !== SessionStatus.EXPIRED) {
        // Marca como EXPIRED (fire-and-forget) para higiene do DB
        sessionService.markExpired(existing.id).catch((err) =>
          logger.warn('bootstrap_mark_expired_failed', {
            id: existing.id,
            error: err instanceof Error ? err.message : String(err),
          })
        )
      }
    }
  }

  // Rate limit só na criação de sessão nova
  if (!sessionRateLimiter.check(ip)) {
    return NextResponse.json(
      buildError(ERROR_CODES.RATE_001, 'Muitas requisições. Tente novamente em alguns instantes.'),
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  const userAgent = request.headers.get('user-agent') ?? undefined
  const referer = request.headers.get('referer')
  const attribution = captureAttribution(request.nextUrl, referer)

  const session = await sessionService.create(
    { locale, currency: 'BRL' },
    { ip: ip === 'unknown' ? undefined : ip, userAgent, attribution }
  )

  const response = NextResponse.redirect(
    appendPreselect(
      new URL(`/${locale}/flow/${session.current_question_id ?? 'Q001'}`, request.url),
      preselect,
    ),
  )

  response.cookies.set(COOKIE_NAMES.SESSION_ID, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_TTL_HOURS * 60 * 60,
  })

  return response
}
