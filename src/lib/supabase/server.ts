import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

/**
 * Cria um cliente Supabase para uso no contexto de servidor.
 * Deve ser chamado dentro de Server Components, Route Handlers e Server Actions.
 * NUNCA usar em Client Components.
 *
 * Cookies configurados com httpOnly, secure (prod) e sameSite: lax
 * para protecao contra XSS e CSRF.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
              })
            )
          } catch {
            // Chamado de Server Component — cookies de resposta gerenciados pelo middleware
          }
        },
      },
    }
  )
}

/**
 * Cria um cliente Supabase com service role (acesso admin irrestrito).
 * Usar APENAS em operacoes administrativas server-side.
 * NUNCA expor no cliente.
 */
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

export async function getSession() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}

export async function getUser() {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error) return null
    return user
  } catch {
    // Supabase Auth indisponível (503/502) — tratar como sessão ausente
    return null
  }
}

type AdminUser = NonNullable<Awaited<ReturnType<typeof getUser>>>
export type RequireAdminResult =
  | { ok: true; user: AdminUser }
  | { ok: false; status: 401; code: 'AUTH_001'; message: string }
  | { ok: false; status: 403; code: 'AUTH_002'; message: string }

/**
 * Guard de defesa em profundidade para rotas admin server-side.
 *  - sem sessão → 401 AUTH_001
 *  - sessão válida mas email != ADMIN_EMAIL → 403 AUTH_002
 *  - ADMIN_EMAIL não definido (dev/tests) → qualquer user autenticado é admin
 *    (mantém paridade com o guard das páginas em (dashboard)/layout.tsx)
 */
export async function requireAdmin(): Promise<RequireAdminResult> {
  const user = await getUser()
  if (!user) {
    return { ok: false, status: 401, code: 'AUTH_001', message: 'Autenticação necessária.' }
  }
  const adminEmail = process.env.ADMIN_EMAIL
  if (adminEmail && user.email?.toLowerCase() !== adminEmail.toLowerCase()) {
    return { ok: false, status: 403, code: 'AUTH_002', message: 'Acesso negado.' }
  }
  return { ok: true, user }
}
