import { NextRequest, NextResponse } from 'next/server'
import { CreateSessionSchema } from '@/schemas/session.schema'
import { sessionService } from '@/services/session.service'
import { buildError, ERROR_CODES } from '@/lib/errors'

// POST /api/v1/sessions — criar sessão anônima
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const parsed = CreateSessionSchema.safeParse(body)

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

    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined
    const userAgent = request.headers.get('user-agent') ?? undefined

    const session = await sessionService.create(parsed.data, { ip, userAgent })

    return NextResponse.json(session, { status: 201 })
  } catch (err) {
    console.error('[POST /api/v1/sessions]', err)
    return NextResponse.json(
      buildError(ERROR_CODES.INTERNAL_ERROR, 'Erro interno. Tente novamente em alguns instantes.'),
      { status: 500 }
    )
  }
}
