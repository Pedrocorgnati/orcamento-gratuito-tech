'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function adminLogin(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar se é o email do admin configurado
    const adminEmail = process.env.ADMIN_EMAIL
    if (!adminEmail || email !== adminEmail) {
      // Resposta genérica — não revela se email existe (security)
      return { success: true }
    }

    const supabase = await createSupabaseServerClient()
    const headersList = await headers()
    const origin = headersList.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? ''

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/api/auth/callback`,
      },
    })

    if (error) {
      console.error('[adminLogin] Supabase error:', error.message)
      return { success: false, error: 'AUTH_001' }
    }

    return { success: true }
  } catch (err) {
    console.error('[adminLogin] Unexpected error:', err)
    return { success: false, error: 'AUTH_001' }
  }
}
