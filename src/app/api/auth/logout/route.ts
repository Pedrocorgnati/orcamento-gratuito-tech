import { type NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { detectLocaleFromRequest } from '@/lib/auth/detectLocaleFromRequest' // RESOLVED: G018

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()

  const { origin } = new URL(request.url)
  const locale = detectLocaleFromRequest(request)
  return NextResponse.redirect(`${origin}/${locale}/admin`, {
    status: 302,
  })
}
