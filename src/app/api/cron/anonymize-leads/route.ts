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
    // STEP 3: Anonimizar em transação Prisma
    // ============================================================
    const result = await prisma.$transaction(async (tx) => {
      return await tx.lead.updateMany({
        where: {
          created_at: { lt: retentionDate },
          anonymized_at: null,
        },
        data: {
          // REMOVENDO PII:
          name: '[Removido]',
          email: 'anonimizado@example.com',
          phone: null,
          company: null,
          scope_story: '[Removido]', // não-nullable no schema — usar string sentinela

          // PRESERVANDO para analytics (não PII):
          // score, project_type, complexity,
          // estimated_price_min, estimated_price_max, currency
          // created_at (para análises temporais)

          // Marcar como anonimizado
          anonymized_at: new Date(),
        },
      })
    })

    const duration = Date.now() - startTime

    // Log estruturado — sem PII (count only, não IDs)
    logger.info('anonymize_leads', {
      anonymized_count: result.count,
      retention_months: 12,
      duration_ms: duration,
    })

    return NextResponse.json({
      anonymized: result.count,
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
