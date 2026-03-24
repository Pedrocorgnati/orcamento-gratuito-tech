import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sessionService } from '@/services/session.service'
import { estimationService, EstimationError } from '@/services/estimation.service'
import { buildError, ERROR_CODES } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { SessionStatus } from '@/lib/enums'
import { COOKIE_NAMES } from '@/lib/constants'

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/sessions/[id]/estimate — calcular estimativa
//
// IDOR Prevention (SEC-007): cookie.session_id deve coincidir com path.[id]
// ESTIMATE_050: project_type ausente → 422
// ESTIMATE_051: PricingConfig ausente → 500
// ESTIMATE_052: ExchangeRate indisponível → 503 com fallback BRL
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // ── IDOR guard ──────────────────────────────────────────────────────────────
  const cookieStore = await cookies()
  const cookieSessionId = cookieStore.get(COOKIE_NAMES.SESSION_ID)?.value

  if (!cookieSessionId) {
    return NextResponse.json(
      buildError(ERROR_CODES.UNAUTHORIZED, 'Sessão não encontrada.'),
      { status: 401 }
    )
  }

  if (cookieSessionId !== id) {
    return NextResponse.json(
      buildError(ERROR_CODES.FORBIDDEN, 'Acesso não autorizado a esta sessão.'),
      { status: 403 }
    )
  }
  // ── Fim IDOR guard ──────────────────────────────────────────────────────────

  try {
    const session = await sessionService.findById(id)

    if (!session) {
      return NextResponse.json(
        buildError(ERROR_CODES.SESSION_NOT_FOUND, 'Sessão não encontrada.'),
        { status: 404 }
      )
    }

    if (sessionService.isExpired(session)) {
      return NextResponse.json(
        buildError(ERROR_CODES.SESSION_EXPIRED, 'Sessão expirada. Inicie uma nova estimativa.'),
        { status: 410 }
      )
    }

    if (session.status !== SessionStatus.COMPLETED) {
      return NextResponse.json(
        buildError(ERROR_CODES.SESSION_NOT_COMPLETE, 'Complete o fluxo de estimativa antes de calcular.'),
        { status: 409 }
      )
    }

    const estimation = await estimationService.calculate(id)
    return NextResponse.json(estimation)
  } catch (err: unknown) {
    if (err instanceof EstimationError) {
      switch (err.code) {
        case 'ESTIMATE_050':
          return NextResponse.json(
            buildError(
              ERROR_CODES.ESTIMATE_050,
              'Responda as primeiras perguntas do fluxo antes de gerar a estimativa.'
            ),
            { status: 422 }
          )

        case 'ESTIMATE_051':
          logger.error('estimate_051_error', { session_id: id, error: err.message })
          return NextResponse.json(
            buildError(
              ERROR_CODES.ESTIMATE_051,
              'Erro ao calcular a estimativa. Nossa equipe foi notificada.'
            ),
            { status: 500 }
          )

        case 'ESTIMATE_052':
          // Recalcular com fallback BRL
          logger.warn('estimate_052_fallback_brl', { session_id: id })
          try {
            const fallbackEstimation = await estimationService.calculateWithFallbackBrl(id)
            return NextResponse.json(
              { ...fallbackEstimation, warning: 'ESTIMATE_052' },
              { status: 503 }
            )
          } catch (fallbackErr) {
            logger.error('estimate_052_fallback_failed', { session_id: id, error: fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr) })
            return NextResponse.json(
              buildError(
                ERROR_CODES.ESTIMATE_051,
                'Erro ao calcular a estimativa. Nossa equipe foi notificada.'
              ),
              { status: 500 }
            )
          }
      }
    }

    logger.error('estimate_internal_error', { session_id: id, error: err instanceof Error ? err.message : String(err) })
    return NextResponse.json(
      buildError(ERROR_CODES.INTERNAL_ERROR, 'Erro interno. Tente novamente em alguns instantes.'),
      { status: 500 }
    )
  }
}
