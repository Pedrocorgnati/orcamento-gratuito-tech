import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { buildError, ERROR_CODES } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { COOKIE_NAMES } from '@/lib/constants'

const emailSchema = z.object({
  email: z.string().email(),
})

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/sessions/[id]/email — salvar email intermediario na sessao
// IDOR Prevention (SEC-007): cookie.session_id deve coincidir com path.[id]
// ─────────────────────────────────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!id) {
    return NextResponse.json(
      buildError(ERROR_CODES.VALIDATION_FAILED, 'ID da sessao e obrigatorio.'),
      { status: 422 }
    )
  }

  // ── IDOR guard ──────────────────────────────────────────────────────────────
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(COOKIE_NAMES.SESSION_ID)?.value

  if (!sessionCookie || sessionCookie !== id) {
    return NextResponse.json(
      buildError(ERROR_CODES.FORBIDDEN, 'Acesso negado.'),
      { status: 403 }
    )
  }
  // ── Fim IDOR guard ──────────────────────────────────────────────────────────

  try {
    const body = await request.json()
    const parsed = emailSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        buildError(
          ERROR_CODES.VALIDATION_FAILED,
          'Email invalido.',
          parsed.error.issues[0]?.message ?? null
        ),
        { status: 422 }
      )
    }

    const session = await prisma.session.findUnique({
      where: { id },
      select: { id: true, status: true, expires_at: true },
    })

    if (!session) {
      return NextResponse.json(
        buildError(ERROR_CODES.SESSION_080, 'Sessao nao encontrada.'),
        { status: 404 }
      )
    }

    if (session.status !== 'active' || session.expires_at < new Date()) {
      return NextResponse.json(
        buildError(ERROR_CODES.SESSION_081, 'Sessao expirada. Inicie uma nova estimativa.'),
        { status: 410 }
      )
    }

    const updated = await prisma.session.update({
      where: { id },
      data: { intermediate_email: parsed.data.email },
      select: { id: true, intermediate_email: true },
    })

    return NextResponse.json(updated, { status: 200 })
  } catch (err: unknown) {
    logger.error('email_patch_error', { message: err instanceof Error ? err.message : String(err) })
    return NextResponse.json(
      buildError(ERROR_CODES.SYS_001, 'Erro interno. Tente novamente em alguns instantes.'),
      { status: 500 }
    )
  }
}
