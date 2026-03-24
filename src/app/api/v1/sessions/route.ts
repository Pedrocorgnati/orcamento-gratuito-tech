import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sessionService } from '@/services/session.service'
import { buildError, ERROR_CODES } from '@/lib/errors'
import { SESSION_TTL_HOURS } from '@/lib/enums'
import { COOKIE_NAMES } from '@/lib/constants'
import { sessionRateLimiter } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'

// ─────────────────────────────────────────────────────────────────────────────
// Schema — aceita locales BCP-47 (pt-BR, en-US, es-ES, it-IT)
// Rate limit: aplicado pelo middleware para /api/*
// ─────────────────────────────────────────────────────────────────────────────

const APP_LOCALES = ['pt-BR', 'en-US', 'es-ES', 'it-IT'] as const

const postSessionBodySchema = z.object({
  locale: z.enum(APP_LOCALES).optional().default('pt-BR'),
  currency: z.string().optional(), // derivado do locale no service
  visitorIp: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable(),
})

const SESSION_TTL_SECONDS = SESSION_TTL_HOURS * 60 * 60

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/sessions — criar sessão anônima
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  if (!sessionRateLimiter.check(clientIp)) {
    return NextResponse.json(
      buildError(ERROR_CODES.RATE_001, 'Muitas requisições. Tente novamente em alguns instantes.'),
      { status: 429 }
    )
  }

  try {
    const body = await request.json().catch(() => ({}))
    const parsed = postSessionBodySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        buildError(
          ERROR_CODES.SESSION_020,
          'Dados inválidos.',
          parsed.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
        ),
        { status: 422 }
      )
    }

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      undefined
    const userAgent = request.headers.get('user-agent') ?? undefined

    const session = await sessionService.create(
      {
        locale: parsed.data.locale,
        currency: parsed.data.currency,
        visitorIp: parsed.data.visitorIp,
        userAgent: parsed.data.userAgent,
      },
      { ip, userAgent }
    )

    const response = NextResponse.json(session, { status: 201 })

    // Cookie session_id — httpOnly:true (SEC-007: protege contra XSS)
    // Leitura client-side feita via server actions/server components (Next.js cookies())
    // SameSite:strict + Secure(prod) mitigam riscos de CSRF
    response.cookies.set(COOKIE_NAMES.SESSION_ID, session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: SESSION_TTL_SECONDS,
    })

    return response
  } catch (err: unknown) {
    logger.error('session_create_error', { message: err instanceof Error ? err.message : String(err) })
    return NextResponse.json(
      buildError(ERROR_CODES.SYS_001, 'Erro interno. Tente novamente em alguns instantes.'),
      { status: 500 }
    )
  }
}
