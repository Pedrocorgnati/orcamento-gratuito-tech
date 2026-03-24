import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

/**
 * OPS-002: Health check endpoint.
 *
 * Usado por:
 * - Vercel health monitoring
 * - Uptime Robot / Better Uptime externos
 * - CI/CD smoke tests
 *
 * NÃO requer autenticação — endpoint público por design.
 * NÃO retorna dados sensíveis — apenas status do sistema.
 */
export async function GET() {
  const startTime = Date.now()

  // Verificar conectividade com banco de dados
  let dbStatus: 'ok' | 'error' = 'ok'
  let dbError: string | null = null

  try {
    // Query simples com timeout de 2 segundos
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('DB timeout')), 2000)
      ),
    ])
  } catch (error) {
    dbStatus = 'error'
    dbError = error instanceof Error ? error.message : 'Unknown DB error'
    logger.error('health_check_db_fail', { error: dbError })
  }

  const duration = Date.now() - startTime
  const overallStatus = dbStatus === 'ok' ? 'ok' : 'degraded'
  const httpStatus = overallStatus === 'ok' ? 200 : 503

  const response: Record<string, unknown> = {
    status: overallStatus,
    db: dbStatus,
    timestamp: new Date().toISOString(),
    duration_ms: duration,
    version: process.env.npm_package_version ?? '1.0.0',
  }

  if (dbError) {
    // Inclui motivo de degradação sem expor detalhes internos
    response.db_error = 'Connection failed'
  }

  logger.info('health_check', {
    status: overallStatus,
    db: dbStatus,
    duration_ms: duration,
  })

  return NextResponse.json(response, { status: httpStatus })
}
