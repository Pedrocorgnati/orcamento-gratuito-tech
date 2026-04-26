import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { buildError, ERROR_CODES } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { COOKIE_NAMES } from '@/lib/constants'
import { SessionStatus } from '@/lib/enums'

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
      select: {
        id: true,
        status: true,
        expires_at: true,
        resume_email_sent_at: true,
        resume_email_scheduled_for: true,
      },
    })

    if (!session) {
      return NextResponse.json(
        buildError(ERROR_CODES.SESSION_080, 'Sessao nao encontrada.'),
        { status: 404 }
      )
    }

    // Aceita captura intermediária em sessões ativas (IN_PROGRESS) ou finalizadas.
    // Rejeita só se explicitamente expirada ou se passou do TTL.
    const isExpired =
      session.status === SessionStatus.EXPIRED ||
      session.expires_at < new Date()
    const isActive =
      session.status === SessionStatus.IN_PROGRESS ||
      session.status === SessionStatus.COMPLETED
    if (isExpired || !isActive) {
      return NextResponse.json(
        buildError(ERROR_CODES.SESSION_081, 'Sessao expirada. Inicie uma nova estimativa.'),
        { status: 410 }
      )
    }

    // CL-111: agendar email de retomada em 24h apenas quando:
    // - nunca foi enviado
    // - sessao nao esta completa
    // Idempotente: se ja houver um scheduled_for pendente, mantem o antigo.
    const shouldScheduleResume =
      session.resume_email_sent_at === null &&
      session.status !== SessionStatus.COMPLETED

    const RESUME_EMAIL_DELAY_MS = 24 * 60 * 60 * 1000
    const nextScheduled =
      shouldScheduleResume && session.resume_email_scheduled_for === null
        ? new Date(Date.now() + RESUME_EMAIL_DELAY_MS)
        : session.resume_email_scheduled_for

    const updated = await prisma.session.update({
      where: { id },
      data: {
        intermediate_email: parsed.data.email,
        resume_email_scheduled_for: nextScheduled,
      },
      select: {
        id: true,
        intermediate_email: true,
        resume_email_scheduled_for: true,
      },
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
