import { NextRequest, NextResponse } from 'next/server'
import { AdminLeadsQuerySchema } from '@/schemas/lead.schema'
import { leadService } from '@/services/lead.service'
import { buildError, ERROR_CODES } from '@/lib/errors'
import { getUser } from '@/lib/supabase/server'

// GET /api/v1/admin/leads — listar leads (requer autenticação Supabase Auth)
export async function GET(request: NextRequest) {
  try {
    // Auth guard — Supabase JWT
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        buildError(ERROR_CODES.UNAUTHORIZED, 'Autenticação necessária.'),
        { status: 401 }
      )
    }

    // Parse query params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const parsed = AdminLeadsQuerySchema.safeParse(searchParams)

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
      per_page: parsed.data.per_page,
    })
  } catch (err) {
    console.error('[GET /api/v1/admin/leads]', err)
    return NextResponse.json(
      buildError(ERROR_CODES.INTERNAL_ERROR, 'Erro interno. Tente novamente em alguns instantes.'),
      { status: 500 }
    )
  }
}
