import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { anonymizeLeads } from '@/lib/security/erasure'
import { assertCronAuth } from '@/lib/security/cronAuth'

/**
 * COMP-004: Cron job para anonimização de leads (LGPD/GDPR).
 *
 * Política de retenção: 12 meses após criação → anonimizar PII.
 *
 * Segurança: endpoint protegido por CRON_SECRET.
 * O Vercel injeta automaticamente o header Authorization: Bearer {CRON_SECRET}
 *
 * Schedule: 0 4 1 * * (1º dia de cada mês às 4h UTC)
 *
 * IMPORTANTE:
 * - Dados PRESERVADOS (para analytics): score, project_type, complexity,
 *   estimated_price_min, estimated_price_max, currency, created_at
 * - Dados REMOVIDOS (PII): name, email, phone, company, scope_story
 * - Campo anonymized_at é setado para registrar quando ocorreu
 */
export async function GET(request: NextRequest) {
  // ============================================================
  // STEP 1: Validação de CRON_SECRET (tempo constante — P2-6)
  // ============================================================
  const auth = assertCronAuth(request, 'anonymize_leads')
  if (!auth.ok) return auth.response

  const startTime = Date.now()

  // ============================================================
  // STEP 2: Encontrar leads para anonimizar
  // Critério: created_at < 12 meses atrás E anonymized_at IS NULL
  // ============================================================
  const retentionDate = new Date()
  retentionDate.setMonth(retentionDate.getMonth() - 12)

  try {
    // Contar primeiro para log
    const countToAnonymize = await prisma.lead.count({
      where: {
        created_at: { lt: retentionDate },
        anonymized_at: null,
      },
    })

    if (countToAnonymize === 0) {
      const duration = Date.now() - startTime
      logger.info('anonymize_leads', { anonymized_count: 0, duration_ms: duration })
      return NextResponse.json({ anonymized: 0, duration_ms: duration })
    }

    // ============================================================
    // STEP 3: Anonimização canônica (P1-2) — Lead + Session + respostas
    // narrativas, em batches transacionais. Mesmo helper do erasure a pedido,
    // evitando divergência de sentinela/escopo e vazamento de PII (whatsapp,
    // visitor_ip, intermediate_email, texto livre).
    // ============================================================
    const totalAnonymized = await anonymizeLeads({ created_at: { lt: retentionDate } })

    const duration = Date.now() - startTime

    logger.info('anonymize_leads', {
      anonymized_count: totalAnonymized,
      retention_months: 12,
      duration_ms: duration,
    })

    return NextResponse.json({
      anonymized: totalAnonymized,
      duration_ms: duration,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('anonymize_leads_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration_ms: duration,
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
