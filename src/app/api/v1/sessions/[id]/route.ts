import { NextRequest, NextResponse } from 'next/server'
import { sessionService } from '@/services/session.service'
import { buildError, ERROR_CODES } from '@/lib/errors'

// GET /api/v1/sessions/[id] — buscar sessão por ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        buildError(ERROR_CODES.VALIDATION_FAILED, 'ID da sessão é obrigatório.'),
        { status: 422 }
      )
    }

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

    return NextResponse.json(session)
  } catch (err) {
    console.error('[GET /api/v1/sessions/[id]]', err)
    return NextResponse.json(
      buildError(ERROR_CODES.INTERNAL_ERROR, 'Erro interno. Tente novamente em alguns instantes.'),
      { status: 500 }
    )
  }
}
