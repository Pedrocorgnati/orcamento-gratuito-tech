import { NextRequest, NextResponse } from 'next/server'
import { sessionService } from '@/services/session.service'
import { estimationService } from '@/services/estimation.service'
import { buildError, ERROR_CODES } from '@/lib/errors'
import { SessionStatus } from '@/types/enums'

// GET /api/v1/sessions/[id]/estimate — calcular estimativa
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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
  } catch (err) {
    console.error('[GET /api/v1/sessions/[id]/estimate]', err)
    return NextResponse.json(
      buildError(ERROR_CODES.INTERNAL_ERROR, 'Erro interno. Tente novamente em alguns instantes.'),
      { status: 500 }
    )
  }
}
