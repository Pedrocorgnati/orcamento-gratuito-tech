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
        logger.warn('admin_api_forbidden', { path: '/api/v1/admin/kpi/resume-rate' })
      }
      return NextResponse.json(
        buildError(ERROR_CODES[guard.code], guard.message),
        { status: guard.status }
      )
    }
    const { searchParams } = new URL(request.url)
    const days = Math.min(365, Math.max(1, parseInt(searchParams.get('days') ?? '30', 10)))
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const [intermediateCaptured, resumed] = await Promise.all([
      prisma.flowEvent.count({
        where: { event_type: 'session_started', created_at: { gte: since } },
      }),
      prisma.flowEvent.count({
        where: { event_type: 'session_resumed', created_at: { gte: since } },
      }),
    ])

    return NextResponse.json({
      days,
      intermediate_captured: intermediateCaptured,
      resumed,
      rate: intermediateCaptured > 0 ? resumed / intermediateCaptured : 0,
    })
  } catch (err) {
    logger.error('admin_kpi_resume_rate_error', { error: (err as Error).message })
    return NextResponse.json(buildError(ERROR_CODES.INTERNAL_ERROR, 'Erro'), { status: 500 })
  }
}
