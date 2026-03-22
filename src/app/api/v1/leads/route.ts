import { NextRequest, NextResponse } from 'next/server'
import { CreateLeadSchema } from '@/schemas/lead.schema'
import { leadService } from '@/services/lead.service'
import { buildError, ERROR_CODES } from '@/lib/errors'

// POST /api/v1/leads — capturar lead ao final do fluxo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)

    if (!body) {
      return NextResponse.json(
        buildError(ERROR_CODES.VALIDATION_FAILED, 'Dados inválidos.'),
        { status: 422 }
      )
    }

    const parsed = CreateLeadSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        buildError(
          ERROR_CODES.VALIDATION_FAILED,
          'Dados inválidos.',
          parsed.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
        ),
        { status: 422 }
      )
    }

    const result = await leadService.create(parsed.data)

    return NextResponse.json(result, { status: 201 })
  } catch (err: unknown) {
    // Erros de negócio mapeados como strings
    const message = err instanceof Error ? err.message : 'Erro interno'

    if (message === 'SESSION_NOT_FOUND') {
      return NextResponse.json(
        buildError(ERROR_CODES.SESSION_NOT_FOUND, 'Sessão não encontrada.'),
        { status: 404 }
      )
    }
    if (message === 'SESSION_NOT_COMPLETE') {
      return NextResponse.json(
        buildError(ERROR_CODES.SESSION_NOT_COMPLETE, 'Complete o fluxo de estimativa antes de enviar o formulário.'),
        { status: 400 }
      )
    }
    if (message === 'LEAD_ALREADY_EXISTS') {
      return NextResponse.json(
        buildError(ERROR_CODES.LEAD_ALREADY_EXISTS, 'Lead já enviado para esta sessão.'),
        { status: 409 }
      )
    }

    console.error('[POST /api/v1/leads]', err)
    return NextResponse.json(
      buildError(ERROR_CODES.INTERNAL_ERROR, 'Erro interno. Tente novamente em alguns instantes.'),
      { status: 500 }
    )
  }
}
