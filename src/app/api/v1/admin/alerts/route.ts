import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { buildError, ERROR_CODES } from '@/lib/errors'
import { requireAdmin } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export async function GET(request: Request) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) {
      if (guard.status === 403) {
        logger.warn('admin_api_forbidden', { path: '/api/v1/admin/alerts' })
      }
      return NextResponse.json(
        buildError(ERROR_CODES[guard.code], guard.message),
        { status: guard.status }
      )
    }
    const { searchParams } = new URL(request.url)
    const days = Math.min(365, Math.max(1, parseInt(searchParams.get('days') ?? '30', 10)))
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const grouped = await prisma.consistencyAlertLog.groupBy({
      by: ['alert_type'],
      where: { created_at: { gte: since } },
      _count: { _all: true },
    })

    const by_type = grouped.map((g) => ({
      alert_type: g.alert_type,
      count: g._count._all,
    }))

    return NextResponse.json({ days, by_type })
  } catch (err) {
    logger.error('admin_alerts_error', { error: (err as Error).message })
    return NextResponse.json(buildError(ERROR_CODES.INTERNAL_ERROR, 'Erro'), { status: 500 })
  }
}
