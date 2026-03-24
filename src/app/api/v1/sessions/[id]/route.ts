import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sessionService } from '@/services/session.service'
import { buildError, ERROR_CODES } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { COOKIE_NAMES } from '@/lib/constants'

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/sessions/[id] — buscar sessão por ID
//
// IDOR Prevention (SEC-007):
// Verificar que cookie.session_id === path.[id] antes de retornar dados.
// Retornar 403 em mismatch — nunca revelar existência do recurso com 404.
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!id) {
    return NextResponse.json(
      buildError(ERROR_CODES.VALIDATION_FAILED, 'ID da sessão é obrigatório.'),
      { status: 422 }
    )
  }

  // ── IDOR guard ──────────────────────────────────────────────────────────────
  const cookieStore = await cookies()
  const cookieSessionId = cookieStore.get(COOKIE_NAMES.SESSION_ID)?.value

  if (!cookieSessionId) {
    return NextResponse.json(
      buildError(ERROR_CODES.FORBIDDEN, 'Cookie de sessão ausente.'),
      { status: 403 }
    )
  }

  if (cookieSessionId !== id) {
    // Não revelar se o recurso existe — sempre 403 em mismatch
    return NextResponse.json(
      buildError(ERROR_CODES.FORBIDDEN, 'Sessão não autorizada.'),
      { status: 403 }
    )
  }
  // ── Fim IDOR guard ──────────────────────────────────────────────────────────

  try {
    const session = await sessionService.findByIdWithQuestion(id)

    if (!session) {
      return NextResponse.json(
        buildError(ERROR_CODES.SESSION_080, 'Sessão não encontrada.'),
        { status: 404 }
      )
    }

    if (sessionService.isExpired(session)) {
      return NextResponse.json(
        buildError(ERROR_CODES.SESSION_081, 'Sessão expirada. Inicie uma nova estimativa.'),
        { status: 410 }
      )
    }

    return NextResponse.json(session, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store', // Dados privados — sem cache
      },
    })
  } catch (err: unknown) {
    logger.error('session_get_error', { message: err instanceof Error ? err.message : String(err) })
    return NextResponse.json(
      buildError(ERROR_CODES.SYS_001, 'Erro interno. Tente novamente em alguns instantes.'),
      { status: 500 }
    )
  }
}
