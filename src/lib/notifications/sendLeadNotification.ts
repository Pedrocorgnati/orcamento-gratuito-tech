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
import { alertOwnerEmailFailure } from '@/lib/notifications/alertOwnerEmailFailure'
import { findRecurringLeads } from '@/services/lead.service'
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

  // CL-286: calcular recorrencia (inclui o lead atual). Falha silenciosa — nunca
  // bloquear envio se a query falhar (defaults = 1 / [])
  let recurrenceCount = 1
  let previousSubmissions: Date[] = []
  try {
    const recurring = await findRecurringLeads(lead.email)
    recurrenceCount = recurring.length
    previousSubmissions = recurring
      .filter((r) => r.id !== lead.id)
      .map((r) => r.created_at)
  } catch (err) {
    logger.warn('recurrence_lookup_failed', {
      leadId: lead.id,
      err: err instanceof Error ? err.message : String(err),
    })
  }

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
        subject: `🎯 Novo Lead${recurrenceCount >= 2 ? ` [RECORRENTE ${recurrenceCount}x]` : ''}: ${lead.name} — Score ${lead.score_total} (${lead.score})`,
        react: renderOwnerEmail({ lead, estimation, recurrenceCount, previousSubmissions }),
        // CL-288: text fallback mínimo para clientes que não renderizam HTML
        text: `Novo Lead: ${lead.name} (${lead.email})\nScore: ${lead.score_total}/100 (${lead.score})\nProject: ${estimation.project_type}\nRange: ${estimation.price_range_formatted}`,
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
        // CL-288: text fallback
        text: `Olá ${lead.name},\nSua faixa estimada: ${estimation.price_range_formatted} em ${estimation.days_range_formatted}.\nObrigado por usar o Budget Free Engine.`,
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

  // CL-290: se todas as 3 tentativas falharam, transicionar para DEAD_LETTER
  const ownerExhausted =
    ownerResult.status === 'rejected' && ownerResult.reason instanceof RetryExhaustedError
  const visitorExhausted =
    visitorResult.status === 'rejected' && visitorResult.reason instanceof RetryExhaustedError
  const isDeadLetter = ownerExhausted || visitorExhausted

  const failureReason = !allSucceeded
    ? [
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
        .join(' | ')
    : null

  // Atualizar status final no banco
  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      email_status: allSucceeded
        ? EmailStatus.SENT
        : isDeadLetter
          ? EmailStatus.DEAD_LETTER
          : EmailStatus.FAILED,
      email_retry_count: Math.max(ownerRetryCount, visitorRetryCount),
      email_sent_at: allSucceeded ? new Date() : undefined,
      last_failure_reason: failureReason,
      dead_letter_at: isDeadLetter ? new Date() : undefined,
    },
  })

  // CL-290: dispara alerta proativo apenas em DEAD_LETTER (idempotente: so se transicionou agora)
  if (isDeadLetter) {
    await alertOwnerEmailFailure({
      leadId: lead.id,
      reason: failureReason ?? 'unknown',
    })
  }

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
