import { type NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { detectLocaleFromRequest } from '@/lib/auth/detectLocaleFromRequest' // RESOLVED: G018
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const locale = detectLocaleFromRequest(request)

  // Validacao basica do parametro code
  if (!code || code.length < 6) {
    logger.warn('auth_callback_invalid_code', {})
    return NextResponse.redirect(
      `${origin}/${locale}/admin?error=invalid_code`
    )
  }

  try {
    const supabase = await createSupabaseServerClient()

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      logger.error('auth_callback_exchange_failed', { error: error.message })
      return NextResponse.redirect(
        `${origin}/${locale}/admin?error=auth_callback_failed`
      )
    }

    // Redirecionar para o admin com locale detectado
    return NextResponse.redirect(`${origin}/${locale}/admin`)
  } catch (err: unknown) {
    logger.error('auth_callback_unexpected_error', { error: err instanceof Error ? err.message : String(err) })
    return NextResponse.redirect(
      `${origin}/${locale}/admin?error=server_error`
    )
  }
}
