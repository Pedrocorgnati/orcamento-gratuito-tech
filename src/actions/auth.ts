'use server'

import { z } from 'zod'
import { headers } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const adminLoginSchema = z.object({
  email: z
    .string({ error: 'Email é obrigatório' })
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
})

// ---------------------------------------------------------------------------
// Rate Limiter — in-memory, 10 req/min/IP
// ---------------------------------------------------------------------------

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 10

type RateLimitEntry = { count: number; windowStart: number }
const rateLimitStore = new Map<string, RateLimitEntry>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(ip)

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(ip, { count: 1, windowStart: now })
    return false
  }

  if (entry.count >= RATE_LIMIT_MAX) return true

  entry.count++
  return false
}

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export interface AdminLoginResult {
  success: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

// ---------------------------------------------------------------------------
// Server Action
// ---------------------------------------------------------------------------

export async function adminLogin(
  formData: FormData
): Promise<AdminLoginResult> {
  // 1. Extrair IP do usuario
  const headersList = await headers()
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'

  // 2. Verificar rate limit
  if (isRateLimited(ip)) {
    return {
      success: false,
      error: 'rate_limit_exceeded',
    }
  }

  // 3. Validar input com Zod
  const rawData = {
    email: formData.get('email') as string,
  }

  const parsed = adminLoginSchema.safeParse(rawData)
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { email } = parsed.data

  // 4. Validar que e o email admin autorizado
  // Retornar sucesso mesmo para emails nao-admin (nao revelar informacao)
  const adminEmail = process.env.ADMIN_EMAIL
  if (adminEmail && email.toLowerCase() !== adminEmail.toLowerCase()) {
    return { success: true }
  }

  // 5. Enviar magic link via Supabase
  try {
    const supabase = await createSupabaseServerClient()

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${appUrl}/api/auth/callback`,
        shouldCreateUser: false,
      },
    })

    if (error) {
      logger.error('admin_login_otp_error', { error: error.message })
      return {
        success: false,
        error: 'email_send_failed',
      }
    }

    return { success: true }
  } catch (err: unknown) {
    logger.error('admin_login_unexpected_error', { error: err instanceof Error ? err.message : String(err) })
    return {
      success: false,
      error: 'server_error',
    }
  }
}
