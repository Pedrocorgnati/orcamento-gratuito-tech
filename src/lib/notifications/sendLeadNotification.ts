import 'server-only'
import { prisma } from '@/lib/prisma'
import { resendClient } from '@/lib/resend/client'
import { withRetry, RetryExhaustedError } from '@/lib/notifications/retryEmail'
import { renderOwnerEmail } from '@/lib/notifications/templates/ownerEmail'
import { renderVisitorEmail } from '@/lib/notifications/templates/visitorEmail'
import {
  EmailStatus,
  Locale,
  Currency,
  ComplexityLevel,
  ProjectType,
  LeadScore,
} from '@/lib/enums'
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'
import type { EstimationResult } from '@/lib/types'
import type { Lead } from '@prisma/client'

const RETRY_OPTIONS = { maxAttempts: 3, delays: [1000, 4000, 16000] }

// Assuntos localizados para NOTIF-003
const VISITOR_SUBJECTS: Record<string, string> = {
  pt_BR: 'Seu orçamento está pronto! 🎉',
  en_US: 'Your estimate is ready! 🎉',
  es_ES: '¡Tu presupuesto está listo! 🎉',
  it_IT: 'Il tuo preventivo è pronto! 🎉',
}

/**
 * Envia NOTIF-002 (proprietário) + NOTIF-003 (visitante) em paralelo com retry 3x.
 *
 * INVARIANTE: Lead JÁ deve estar salvo no banco antes desta função ser chamada.
 * Falha de email nunca resulta em perda de dados — OPS-004.
 * SEC-008: nenhum PII (email/phone) nos logs.
 */
export async function sendLeadNotification(lead: Lead): Promise<void> {
  const { RESEND_FROM_EMAIL, ADMIN_EMAIL } = env()

  // Reconstrói EstimationResult a partir dos campos do Lead já persistido
  const estimation: EstimationResult = {
    projectType: lead.project_type as ProjectType,
    complexity: lead.complexity as ComplexityLevel,
    priceMin: lead.estimated_price_min,
    priceMax: lead.estimated_price_max,
    daysMin: lead.estimated_days_min,
    daysMax: lead.estimated_days_max,
    currency: lead.currency as Currency,
    locale: lead.locale as Locale,
    features: lead.features as string[],
    scopeStory: lead.scope_story,
    consistencyAlerts: [],
    score: lead.score as LeadScore,
    scoreBudget: lead.score_budget,
    scoreTimeline: lead.score_timeline,
    scoreProfile: lead.score_profile,
    scoreTotal: lead.score_total,
  }

  const visitorSubject =
    VISITOR_SUBJECTS[lead.locale] ?? VISITOR_SUBJECTS['pt_BR']

  let ownerRetryCount = 0
  let visitorRetryCount = 0

  const sendOwner = async () => {
    let attempt = 0
    return withRetry(async () => {
      attempt++
      ownerRetryCount = attempt - 1
      // Atualizar retry_count no banco a cada falha (fire-and-forget — não travar o retry)
      if (attempt > 1) {
        prisma.lead
          .update({
            where: { id: lead.id },
            data: { email_retry_count: attempt - 1 },
          })
          .catch(() => {})
      }
      return resendClient.emails.send({
        from: RESEND_FROM_EMAIL,
        to: [ADMIN_EMAIL],
        replyTo: ADMIN_EMAIL,
        subject: `🎯 Novo Lead: ${lead.name} — Score ${lead.score_total} (${lead.score})`,
        react: renderOwnerEmail({ lead, estimation }),
      })
    }, RETRY_OPTIONS)
  }

  const sendVisitor = async () => {
    let attempt = 0
    return withRetry(async () => {
      attempt++
      visitorRetryCount = attempt - 1
      return resendClient.emails.send({
        from: RESEND_FROM_EMAIL,
        to: [lead.email],
        replyTo: ADMIN_EMAIL,
        subject: visitorSubject,
        react: renderVisitorEmail({ lead, estimation }),
      })
    }, RETRY_OPTIONS)
  }

  // Envio paralelo — Promise.allSettled garante que ambos são tentados independentemente
  const [ownerResult, visitorResult] = await Promise.allSettled([
    sendOwner(),
    sendVisitor(),
  ])

  const allSucceeded =
    ownerResult.status === 'fulfilled' && visitorResult.status === 'fulfilled'

  // Atualizar status final no banco
  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      email_status: allSucceeded ? EmailStatus.SENT : EmailStatus.FAILED,
      email_retry_count: Math.max(ownerRetryCount, visitorRetryCount),
      email_sent_at: allSucceeded ? new Date() : undefined,
    },
  })

  // Log sem PII (SEC-008) — apenas leadId, nunca email/phone
  logger.info('email_send_complete', {
    leadId: lead.id,
    ownerStatus: ownerResult.status,
    visitorStatus: visitorResult.status,
    ownerRetries: ownerRetryCount,
    visitorRetries: visitorRetryCount,
  })

  if (!allSucceeded) {
    const errors = [
      ownerResult.status === 'rejected' ? ownerResult.reason : null,
      visitorResult.status === 'rejected' ? visitorResult.reason : null,
    ]
      .filter(Boolean)
      .map((e: unknown) =>
        e instanceof RetryExhaustedError
          ? `RetryExhausted(${e.attempts})`
          : e instanceof Error
            ? e.message
            : String(e)
      )

    // NOTIFY_050 — log sem PII (SEC-008)
    logger.error('email_send_failed', { leadId: lead.id, errors })
    // Falha de email é não-crítica: lead está salvo, não propagar para o caller
  }
}
