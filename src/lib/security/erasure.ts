import 'server-only'
import { randomUUID } from 'node:crypto'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

// P1-2: sentinela ÚNICA para todos os caminhos de anonimização (erasure a pedido
// + cron de retenção). Divergência de sentinela/escopo entre caminhos era bug.
export const ANONYMIZED_TEXT = '[anonimizado]'
const ANONYMIZED_EMAIL = 'anonymized@example.invalid'

// Respostas de texto livre que carregam PII (visão, must-haves, referências, notas).
const NARRATIVE_QUESTION_CODES = ['Q096', 'Q097', 'Q098', 'Q099']

const ANONYMIZE_BATCH_SIZE = 100

/**
 * P1-2: helper canônico de anonimização. Limpa, na MESMA transação por batch:
 *   - Lead: name/email/phone/whatsapp/company/scope_story + anonymized_at
 *   - Session vinculada: visitor_ip/user_agent/intermediate_email
 *   - Answer narrativa (Q096-Q099): text_value
 * Preserva métricas agregáveis (score_*, project_type, complexity, estimativas,
 * currency, created_at). Processa em batches para não estourar timeout/pool.
 * `where` é sempre restrito a `anonymized_at: null`. Retorna o total anonimizado.
 */
export async function anonymizeLeads(where: Prisma.LeadWhereInput): Promise<number> {
  let total = 0

  // Loop de batches: re-consulta a cada iteração (idempotente via anonymized_at).
  for (;;) {
    const batch = await prisma.lead.findMany({
      where: { ...where, anonymized_at: null },
      select: { id: true, session_id: true },
      take: ANONYMIZE_BATCH_SIZE,
    })
    if (batch.length === 0) break

    const leadIds = batch.map((l) => l.id)
    const sessionIds = batch.map((l) => l.session_id)

    await prisma.$transaction(async (tx) => {
      await tx.lead.updateMany({
        where: { id: { in: leadIds } },
        data: {
          name: ANONYMIZED_TEXT,
          email: ANONYMIZED_EMAIL,
          phone: null,
          whatsapp: null,
          company: null,
          scope_story: ANONYMIZED_TEXT,
          anonymized_at: new Date(),
        },
      })

      // Session vinculada: remover PII de rede e e-mail intermediário de retomada.
      await tx.session.updateMany({
        where: { id: { in: sessionIds } },
        data: { visitor_ip: null, user_agent: null, intermediate_email: null },
      })

      // Respostas narrativas (texto livre) — buscar ids e limpar text_value.
      const narrativeAnswers = await tx.answer.findMany({
        where: {
          session_id: { in: sessionIds },
          question: { code: { in: NARRATIVE_QUESTION_CODES } },
          text_value: { not: null },
        },
        select: { id: true },
      })
      if (narrativeAnswers.length > 0) {
        await tx.answer.updateMany({
          where: { id: { in: narrativeAnswers.map((a) => a.id) } },
          data: { text_value: ANONYMIZED_TEXT },
        })
      }
    })

    total += batch.length
    if (batch.length < ANONYMIZE_BATCH_SIZE) break
  }

  logger.info('erasure_anonymized_leads', { count: total })
  return total
}

export async function anonymizeLeadsByEmail(email: string): Promise<number> {
  return anonymizeLeads({
    email: { equals: email.toLowerCase(), mode: 'insensitive' },
  })
}

export function generateErasureToken(): string {
  // CSPRNG: token = prova de direito de apagar dados de um titular.
  // Math.random()/Date.now() eram previsíveis (forja/adivinhação). randomUUID()
  // entrega 122 bits de entropia sem prefixo temporal e sem dependência nova.
  return `${randomUUID()}${randomUUID().replace(/-/g, '')}`
}

export const ERASURE_TOKEN_TTL_MS = 24 * 60 * 60 * 1000
