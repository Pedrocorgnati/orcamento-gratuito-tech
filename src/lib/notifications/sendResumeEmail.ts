import 'server-only'
import { prisma } from '@/lib/prisma'
import { resendClient } from '@/lib/resend/client'
import { withRetry, RetryExhaustedError } from '@/lib/notifications/retryEmail'
import {
  renderResumeEmail,
  renderResumeEmailText,
  getResumeEmailSubject,
} from '@/lib/notifications/templates/resumeEmail'
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'
import { SessionStatus } from '@/lib/enums'

const RETRY_OPTIONS = { maxAttempts: 3, delays: [1000, 4000, 16000] }

export interface SendResumeEmailResult {
  sessionId: string
  status: 'SENT' | 'SKIPPED' | 'FAILED'
  reason?: string
  attempts?: number
}

/**
 * CL-110 / CL-111 / CL-141 — envia email de retomada para uma sessao abandonada.
 *
 * Regras:
 * - So envia quando session.intermediate_email esta preenchido
 * - Pula sessoes ja completas ou expiradas (defesa em profundidade vs. cron query)
 * - Idempotente: marca resume_email_sent_at apos sucesso, nao reprocessa
 * - Em falha total (RetryExhausted): NAO marca resume_email_sent_at, log estruturado
 * - SEC-008: logs sem PII (email/phone nunca aparecem)
 *
 * @returns Resultado do envio para telemetria do cron handler
 */
export async function sendResumeEmail({
  sessionId,
}: {
  sessionId: string
}): Promise<SendResumeEmailResult> {
  const { RESEND_FROM_EMAIL, ADMIN_EMAIL, NEXT_PUBLIC_APP_URL } = env()

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      status: true,
      locale: true,
      progress_percentage: true,
      intermediate_email: true,
      resume_email_sent_at: true,
      expires_at: true,
      lead: { select: { unsubscribe_token: true, unsubscribed_at: true } },
    },
  })

  if (!session) {
    logger.warn('resume_email_skip', { sessionId, reason: 'session_not_found' })
    return { sessionId, status: 'SKIPPED', reason: 'session_not_found' }
  }

  if (!session.intermediate_email) {
    logger.warn('resume_email_skip', {
      sessionId,
      reason: 'no_intermediate_email',
    })
    return { sessionId, status: 'SKIPPED', reason: 'no_intermediate_email' }
  }

  if (session.resume_email_sent_at !== null) {
    logger.info('resume_email_skip', { sessionId, reason: 'already_sent' })
    return { sessionId, status: 'SKIPPED', reason: 'already_sent' }
  }

  if (session.status === SessionStatus.COMPLETED) {
    logger.info('resume_email_skip', {
      sessionId,
      reason: 'session_completed',
    })
    return { sessionId, status: 'SKIPPED', reason: 'session_completed' }
  }

  if (session.expires_at < new Date()) {
    logger.info('resume_email_skip', { sessionId, reason: 'session_expired' })
    return { sessionId, status: 'SKIPPED', reason: 'session_expired' }
  }

  // CL-232: respeitar unsubscribe do Lead vinculado a essa sessao
  if (session.lead?.unsubscribed_at) {
    logger.info('resume_email_skip', { sessionId, reason: 'lead_unsubscribed' })
    return { sessionId, status: 'SKIPPED', reason: 'lead_unsubscribed' }
  }

  const subject = getResumeEmailSubject(session.locale)
  const unsubscribeToken = session.lead?.unsubscribe_token ?? session.id
  const react = renderResumeEmail({
    sessionId: session.id,
    locale: session.locale,
    baseUrl: NEXT_PUBLIC_APP_URL,
    progress: session.progress_percentage,
    unsubscribeToken,
  })
  const text = renderResumeEmailText({
    sessionId: session.id,
    locale: session.locale,
    baseUrl: NEXT_PUBLIC_APP_URL,
    progress: session.progress_percentage,
    unsubscribeToken,
  })

  let attempts = 0
  try {
    await withRetry(async () => {
      attempts++
      return resendClient.emails.send({
        from: RESEND_FROM_EMAIL,
        to: [session.intermediate_email!],
        replyTo: ADMIN_EMAIL,
        subject,
        react,
        text,
      })
    }, RETRY_OPTIONS)

    await prisma.session.update({
      where: { id: session.id },
      data: { resume_email_sent_at: new Date() },
    })

    logger.info('resume_email_sent', {
      sessionId: session.id,
      locale: session.locale,
      attempts,
    })

    return { sessionId: session.id, status: 'SENT', attempts }
  } catch (error) {
    const errorLabel =
      error instanceof RetryExhaustedError
        ? `RetryExhausted(${error.attempts})`
        : error instanceof Error
          ? error.constructor.name
          : 'UnknownError'

    logger.error('resume_email_failed', {
      sessionId: session.id,
      attempts,
      error: errorLabel,
    })

    return {
      sessionId: session.id,
      status: 'FAILED',
      reason: errorLabel,
      attempts,
    }
  }
}
