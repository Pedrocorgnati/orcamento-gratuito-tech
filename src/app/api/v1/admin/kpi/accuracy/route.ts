import { NextResponse } from 'next/server'
import { computeAccuracyKPI } from '@/lib/calibration/computeAccuracyKPI'
import { buildError, ERROR_CODES } from '@/lib/errors'
import { requireAdmin } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) {
      if (guard.status === 403) {
        logger.warn('admin_api_forbidden', { path: '/api/v1/admin/kpi/accuracy' })
      }
      return NextResponse.json(
        buildError(ERROR_CODES[guard.code], guard.message),
        { status: guard.status }
      )
    }
    const kpi = await computeAccuracyKPI()
    return NextResponse.json(kpi)
  } catch (err) {
    logger.error('admin_kpi_accuracy_error', { error: (err as Error).message })
    return NextResponse.json(
      buildError(ERROR_CODES.INTERNAL_ERROR, 'Erro ao calcular KPI.'),
      { status: 500 }
    )
  }
}
