import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { SessionStatus } from '@/lib/enums'

/**
 * OPS-003: Cron job para limpeza de sessões expiradas.
 *
 * Segurança: endpoint protegido por CRON_SECRET.
 * O Vercel injeta automaticamente o header Authorization: Bearer {CRON_SECRET}
 * quando o cron job é acionado pelo agendador.
 *
 * Schedule: 0 3 * * * (diariamente às 3h UTC)
 *
 * IMPORTANTE: Nunca remover a validação do CRON_SECRET.
 * Sem ela, qualquer pessoa pode disparar a limpeza manualmente.
 */
export async function GET(request: NextRequest) {
  // ============================================================
  // STEP 1: Validação de CRON_SECRET
  // ============================================================
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    logger.error('cleanup_sessions_misconfigured', { detail: 'CRON_SECRET não configurado' })
    return NextResponse.json(
      { error: 'Server misconfiguration' },
      { status: 500 }
    )
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    // Log sem revelar o segredo ou IP do chamador
    logger.warn('cleanup_sessions_unauthorized', {})
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const startTime = Date.now()

  // ============================================================
  // STEP 2: OPS-003 Mutex — prevenir double-run
  // Verifica se o último cleanup foi há < 23 horas
  // ============================================================
  const SESSION_TTL_DAYS = parseInt(process.env.SESSION_TTL_DAYS ?? '7', 10)

  // Verificação simples: contagem de sessões já expiradas
  // (um lock distribuído real exigiria Redis — para V1, toleramos eventual double-run)
  const lastRecentCleanup = await prisma.session.findFirst({
    where: {
      // Sessões marcadas como EXPIRED nas últimas 23 horas
      // (indica que um cleanup já rodou recentemente)
      status: SessionStatus.EXPIRED,
      updated_at: { gte: new Date(Date.now() - 23 * 60 * 60 * 1000) },
    },
    select: { updated_at: true },
  })

  if (lastRecentCleanup) {
    logger.info('cleanup_sessions_skipped', { reason: 'Recent cleanup already ran (OPS-003 mutex)' })
    return NextResponse.json({
      skipped: true,
      reason: 'Recent cleanup already ran',
      last_cleanup: lastRecentCleanup.updated_at,
    })
  }

  // ============================================================
  // STEP 3: Executar limpeza
  // Deleta sessões com expires_at < NOW() e status != 'COMPLETED'
  // ============================================================
  try {
    const result = await prisma.session.deleteMany({
      where: {
        AND: [
          { expires_at: { lt: new Date() } },
          { status: { not: SessionStatus.COMPLETED } },
        ],
      },
    })

    const duration = Date.now() - startTime

    // Log estruturado — sem PII
    logger.info('cleanup_sessions', {
      deleted_count: result.count,
      duration_ms: duration,
      ttl_days: SESSION_TTL_DAYS,
    })

    return NextResponse.json({
      deleted: result.count,
      duration_ms: duration,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('cleanup_sessions_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration_ms: duration,
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
