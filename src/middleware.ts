import { type NextRequest, NextResponse } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { createServerClient } from '@supabase/ssr'
import { routing } from './i18n/routing'

// ─────────────────────────────────────────────────────────────────────────────
// Rate Limiting — in-memory, janela deslizante 60s
// ─────────────────────────────────────────────────────────────────────────────

type RateLimitEntry = { count: number; windowStart: number }
const rateLimitStore = new Map<string, RateLimitEntry>()

const RATE_LIMIT_WINDOW_MS = 60_000 // 60s
const LIMITS: Record<string, number> = {
  api: 50,    // /api/v1/* geral
  auth: 10,   // /api/v1/admin/* e /api/auth/*
  leads: 10,  // /api/v1/leads
}

function getRateLimit(pathname: string): number {
  if (pathname.startsWith('/api/v1/leads')) return LIMITS.leads
  if (pathname.startsWith('/api/v1/admin') || pathname.startsWith('/api/auth')) return LIMITS.auth
  return LIMITS.api
}

function checkRateLimit(ip: string, pathname: string): boolean {
  const now = Date.now()
  const key = `${ip}:${pathname.split('/').slice(0, 4).join('/')}`
  const limit = getRateLimit(pathname)
  const entry = rateLimitStore.get(key)

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(key, { count: 1, windowStart: now })
    return true // permitido
  }

  if (entry.count >= limit) return false // bloqueado

  entry.count++
  return true // permitido
}

// ─────────────────────────────────────────────────────────────────────────────
// Intl middleware
// ─────────────────────────────────────────────────────────────────────────────

const handleI18n = createIntlMiddleware(routing)

// ─────────────────────────────────────────────────────────────────────────────
// Middleware principal
// ─────────────────────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1'

  // Rate limiting para rotas de API
  if (pathname.startsWith('/api/')) {
    const allowed = checkRateLimit(ip, pathname)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Try again later.', retry_after: 60 },
        { status: 429 }
      )
    }

    // Refresh sessão Supabase em API routes de admin
    if (pathname.startsWith('/api/v1/admin')) {
      let response = NextResponse.next({ request })

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
              response = NextResponse.next({ request })
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options)
              )
            },
          },
        }
      )

      await supabase.auth.getUser()
      return response
    }

    // Outras rotas de API passam direto
    return NextResponse.next({ request })
  }

  // i18n para rotas de página
  return handleI18n(request)
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next|_vercel|.*\\..*).*)',
  ],
}
