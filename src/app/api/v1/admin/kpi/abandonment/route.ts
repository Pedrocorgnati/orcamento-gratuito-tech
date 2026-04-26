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
        logger.warn('admin_api_forbidden', { path: '/api/v1/admin/kpi/abandonment' })
      }
      return NextResponse.json(
        buildError(ERROR_CODES[guard.code], guard.message),
        { status: guard.status }
      )
    }
    const { searchParams } = new URL(request.url)
    const days = Math.min(365, Math.max(1, parseInt(searchParams.get('days') ?? '30', 10)))
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const grouped = await prisma.flowEvent.groupBy({
      by: ['block', 'event_type'],
      where: { created_at: { gte: since }, block: { not: null } },
      _count: { _all: true },
    })

    const map = new Map<string, { started: number; abandoned: number }>()
    for (const row of grouped) {
      const key = row.block ?? 'unknown'
      if (!map.has(key)) map.set(key, { started: 0, abandoned: 0 })
      const bucket = map.get(key)!
      if (row.event_type === 'session_started' || row.event_type === 'question_answered') {
        bucket.started += row._count._all
      } else if (row.event_type === 'session_abandoned') {
        bucket.abandoned += row._count._all
      }
    }

    const by_block = [...map.entries()].map(([block, v]) => ({
      block,
      started: v.started,
      abandoned: v.abandoned,
      rate: v.started > 0 ? v.abandoned / v.started : 0,
    }))

    return NextResponse.json({ days, by_block })
  } catch (err) {
    logger.error('admin_kpi_abandonment_error', { error: (err as Error).message })
    return NextResponse.json(buildError(ERROR_CODES.INTERNAL_ERROR, 'Erro'), { status: 500 })
  }
}
