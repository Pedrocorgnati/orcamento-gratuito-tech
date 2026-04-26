import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

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
  // STEP 1: Validação de CRON_SECRET
  // ============================================================
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    logger.error('anonymize_leads_misconfigured', { detail: 'CRON_SECRET não configurado' })
    return NextResponse.json(
      { error: 'Server misconfiguration' },
      { status: 500 }
    )
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    logger.warn('anonymize_leads_unauthorized', {})
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

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
    // STEP 3: Anonimizar em batches (evita timeout no Vercel/Neon)
    // Batch de 100 por iteração — seguro para connection pool padrão
    // ============================================================
    const BATCH_SIZE = 100
    let totalAnonymized = 0

    while (true) {
      const batch = await prisma.lead.findMany({
        where: { created_at: { lt: retentionDate }, anonymized_at: null },
        select: { id: true },
        take: BATCH_SIZE,
      })

      if (batch.length === 0) break

      const ids = batch.map((l) => l.id)
      const batchResult = await prisma.lead.updateMany({
        where: { id: { in: ids } },
        data: {
          name: '[Removido]',
          email: 'anonimizado@example.com',
          phone: null,
          company: null,
          scope_story: '[Removido]',
          anonymized_at: new Date(),
        },
      })

      totalAnonymized += batchResult.count

      if (batch.length < BATCH_SIZE) break
    }

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
