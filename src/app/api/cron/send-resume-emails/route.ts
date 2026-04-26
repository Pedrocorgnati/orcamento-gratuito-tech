import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { SessionStatus } from '@/lib/enums'
import { sendResumeEmail } from '@/lib/notifications/sendResumeEmail'

/**
 * CL-110 / CL-111 / CL-141 — Cron job hourly que envia emails de retomada.
 *
 * Seleciona sessoes onde:
 *   - resume_email_scheduled_for <= NOW()
 *   - resume_email_sent_at IS NULL
 *   - expires_at > NOW() (TTL ainda valido)
 *   - status != 'COMPLETED'
 *   - intermediate_email IS NOT NULL
 *
 * Seguranca: endpoint protegido por CRON_SECRET.
 * Vercel injeta automaticamente o header Authorization: Bearer {CRON_SECRET}.
 *
 * Schedule: 0 * * * * (de hora em hora, UTC)
 *
 * IMPORTANTE: nao lanca excecao por falha individual — cada envio e tentado
 * de forma independente. Idempotente: `resume_email_sent_at` impede reenvio.
 */
const BATCH_LIMIT = 100

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    logger.error('resume_emails_misconfigured', {
      detail: 'CRON_SECRET nao configurado',
    })
    return NextResponse.json(
      { error: 'Server misconfiguration' },
      { status: 500 }
    )
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    logger.warn('resume_emails_unauthorized', {})
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()

  try {
    const now = new Date()
    const eligible = await prisma.session.findMany({
      where: {
        resume_email_scheduled_for: { lte: now, not: null },
        resume_email_sent_at: null,
        expires_at: { gt: now },
        status: { not: SessionStatus.COMPLETED },
        intermediate_email: { not: null },
        // CL-232: respeitar unsubscribe do Lead vinculado
        OR: [
          { lead: null },
          { lead: { unsubscribed_at: null } },
        ],
      },
      select: { id: true },
      orderBy: { resume_email_scheduled_for: 'asc' },
      take: BATCH_LIMIT,
    })

    let succeeded = 0
    let skipped = 0
    let failed = 0

    for (const { id } of eligible) {
      try {
        const result = await sendResumeEmail({ sessionId: id })
        if (result.status === 'SENT') succeeded++
        else if (result.status === 'SKIPPED') skipped++
        else failed++
      } catch (innerErr) {
        // defensivo: sendResumeEmail ja captura erros; so entra aqui em caso
        // de excecao inesperada (ex: prisma.session.update falhou fora do try)
        failed++
        logger.error('resume_emails_inner_error', {
          sessionId: id,
          error:
            innerErr instanceof Error ? innerErr.constructor.name : 'Unknown',
        })
      }
    }

    const duration = Date.now() - startTime
    logger.info('resume_emails_run', {
      processed: eligible.length,
      succeeded,
      skipped,
      failed,
      duration_ms: duration,
      batch_limit: BATCH_LIMIT,
    })

    return NextResponse.json({
      processed: eligible.length,
      succeeded,
      skipped,
      failed,
      duration_ms: duration,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('resume_emails_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration_ms: duration,
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
