import { NextRequest, NextResponse } from 'next/server'
import { leadSchema } from '@/lib/validations/schemas'
import { leadService } from '@/services/lead.service'
import { buildError, ERROR_CODES } from '@/lib/errors'
import { leadRateLimiter } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'

// POST /api/v1/leads — capturar lead ao final do fluxo
export async function POST(request: NextRequest) {
  // ── Rate limit (INT-096) ──────────────────────────────────────────────────
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1'

  if (!leadRateLimiter.check(`lead:${ip}`)) {
    return NextResponse.json(
      buildError(ERROR_CODES.RATE_001, 'Muitas tentativas. Tente novamente mais tarde.'),
      { status: 429, headers: { 'Retry-After': '3600' } }
    )
  }
  // ── Fim Rate limit ────────────────────────────────────────────────────────

  try {
    const body = await request.json().catch(() => null)

    if (!body) {
      return NextResponse.json(
        buildError(ERROR_CODES.VALIDATION_FAILED, 'Dados inválidos.'),
        { status: 422 }
      )
    }

    const parsed = leadSchema.safeParse(body)

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
        buildError(ERROR_CODES.SESSION_080, 'Sessão não encontrada.'),
        { status: 404 }
      )
    }
    if (message === 'SESSION_NOT_COMPLETE') {
      return NextResponse.json(
        buildError(ERROR_CODES.LEAD_050, 'Complete o fluxo de estimativa antes de enviar o formulário.'),
        { status: 400 }
      )
    }
    if (message === 'CONSENT_REQUIRED') {
      return NextResponse.json(
        buildError(ERROR_CODES.LEAD_051, 'Consentimento obrigatório para captura de lead.'),
        { status: 400 }
      )
    }
    if (message === 'LEAD_ALREADY_EXISTS') {
      return NextResponse.json(
        buildError(ERROR_CODES.LEAD_081, 'Lead já enviado para esta sessão.'),
        { status: 409 }
      )
    }

    logger.error('lead_create_error', { message: err instanceof Error ? err.message : String(err) })
    return NextResponse.json(
      buildError(ERROR_CODES.SYS_001, 'Erro interno. Tente novamente em alguns instantes.'),
      { status: 500 }
    )
  }
}
