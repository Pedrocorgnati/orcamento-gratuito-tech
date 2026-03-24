import { NextRequest, NextResponse } from 'next/server'
import { adminLeadsQuerySchema } from '@/lib/validations/schemas'
import { leadService } from '@/services/lead.service'
import { buildError, ERROR_CODES } from '@/lib/errors'
import { getUser } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// GET /api/v1/admin/leads — listar leads (requer autenticação Supabase Auth)
export async function GET(request: NextRequest) {
  try {
    // Auth guard — Supabase JWT
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        buildError(ERROR_CODES.AUTH_001, 'Autenticação necessária.'),
        { status: 401 }
      )
    }

    // Parse query params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const parsed = adminLeadsQuerySchema.safeParse(searchParams)

    if (!parsed.success) {
      return NextResponse.json(
        buildError(
          ERROR_CODES.VALIDATION_FAILED,
          'Parâmetros de consulta inválidos.',
          parsed.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
        ),
        { status: 422 }
      )
    }

    const { data, total } = await leadService.findMany(parsed.data)

    return NextResponse.json({
      data,
      total,
      page: parsed.data.page,
      per_page: parsed.data.pageSize,
    }, {
      headers: {
        'Cache-Control': 'no-store',
      },
    })
  } catch (err: unknown) {
    logger.error('admin_leads_get_error', { message: err instanceof Error ? err.message : String(err) })
    return NextResponse.json(
      buildError(ERROR_CODES.SYS_001, 'Erro interno. Tente novamente em alguns instantes.'),
      { status: 500 }
    )
  }
}
