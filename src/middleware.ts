import { type NextRequest, NextResponse } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { createServerClient } from '@supabase/ssr'
import { routing } from './i18n/routing'
import {
  checkRateLimit,
  detectLocale as detectLocaleHelper,
} from './lib/middleware-helpers'

// ---------------------------------------------------------------------------
// Locale Detection — wrapper using NextRequest (INT-030)
// ---------------------------------------------------------------------------

function detectLocale(request: NextRequest): string {
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value
  const acceptLanguage = request.headers.get('Accept-Language')
  return detectLocaleHelper(
    cookieLocale,
    acceptLanguage,
    routing.locales as readonly string[],
    routing.defaultLocale,
  )
}

// ---------------------------------------------------------------------------
// Intl middleware
// ---------------------------------------------------------------------------

const handleI18n = createIntlMiddleware(routing)

// ---------------------------------------------------------------------------
// Admin route patterns (pre-compiled regex)
// ---------------------------------------------------------------------------

// Matches /xx-XX/admin (any admin route)
const ADMIN_ROUTE_PATTERN = /^\/[a-z]{2}-[A-Z]{2}\/admin/

// Matches /xx-XX/admin/anything (sub-routes that need protection)
const ADMIN_SUBROUTE_PATTERN = /^\/[a-z]{2}-[A-Z]{2}\/admin\/.+$/

// Extract locale from pathname
const LOCALE_PREFIX_PATTERN = /^\/([a-z]{2}-[A-Z]{2})\//

// ---------------------------------------------------------------------------
// Supabase session check for Edge Runtime
// ---------------------------------------------------------------------------

async function getSupabaseSession(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {
          // Read-only no middleware — session refresh feito pelo server client na page
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}

// ---------------------------------------------------------------------------
// Middleware principal
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    '127.0.0.1'

  // 1. Rate limiting para rotas de API
  if (pathname.startsWith('/api/')) {
    const allowed = checkRateLimit(ip, pathname)
    if (!allowed) {
      return NextResponse.json(
        {
          error: {
            code: 'RATE_001',
            message: 'Too many requests. Try again later.',
          },
        },
        {
          status: 429,
          headers: { 'Retry-After': '60' },
        }
      )
    }

    // Refresh sessao Supabase + guard ADMIN_EMAIL em API routes de admin
    // (defesa em profundidade — route handlers ainda chamam requireAdmin())
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
              cookiesToSet.forEach(({ name, value }) =>
                request.cookies.set(name, value)
              )
              response = NextResponse.next({ request })
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options)
              )
            },
          },
        }
      )

      const {
        data: { user },
      } = await supabase.auth.getUser()
      const adminEmail = process.env.ADMIN_EMAIL
      if (
        user &&
        adminEmail &&
        user.email?.toLowerCase() !== adminEmail.toLowerCase()
      ) {
        return NextResponse.json(
          { error: { code: 'AUTH_002', message: 'Acesso negado.' } },
          { status: 403 }
        )
      }
      return response
    }

    // Outras rotas de API passam direto
    return NextResponse.next({ request })
  }

  // 2. Rate limiting para paginas de auth/admin (RATE_001)
  if (
    pathname.includes('/auth/callback') ||
    ADMIN_ROUTE_PATTERN.test(pathname)
  ) {
    const allowed = checkRateLimit(ip, pathname)
    if (!allowed) {
      return new NextResponse(
        JSON.stringify({
          error: {
            code: 'RATE_001',
            message: 'Too many requests.',
          },
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
          },
        }
      )
    }
  }

  // 3. Session guard para sub-rotas do admin (/xx-XX/admin/dashboard, etc.)
  if (ADMIN_SUBROUTE_PATTERN.test(pathname)) {
    const session = await getSupabaseSession(request)
    const localeMatch = pathname.match(LOCALE_PREFIX_PATTERN)
    const locale = localeMatch?.[1] ?? routing.defaultLocale

    if (!session) {
      // Nao autenticado — redirecionar para pagina de login
      return NextResponse.redirect(new URL(`/${locale}/admin`, request.url))
    }

    // Verificar se e o ADMIN_EMAIL
    const adminEmail = process.env.ADMIN_EMAIL
    if (
      adminEmail &&
      session.user?.email?.toLowerCase() !== adminEmail.toLowerCase()
    ) {
      const url = new URL(`/${locale}/admin`, request.url)
      url.searchParams.set('error', 'unauthorized')
      return NextResponse.redirect(url)
    }
  }

  // 4. Entry-point /pt-BR/flow → cria sessao via bootstrap handler
  //    next-intl faz meta-refresh em page.tsx redirect; 307 pelo middleware é determinístico
  const flowEntryMatch = pathname.match(/^\/([a-z]{2}-[A-Z]{2})\/flow\/?$/)
  if (flowEntryMatch) {
    const url = new URL(
      `/api/v1/flow/bootstrap?locale=${flowEntryMatch[1]}`,
      request.url
    )
    // Forward `preselect` deep-link (numeric 1..11) vindo de landings de solução.
    const rawPreselect = request.nextUrl.searchParams.get('preselect')
    if (rawPreselect) {
      const n = Number.parseInt(rawPreselect, 10)
      if (Number.isInteger(n) && n >= 1 && n <= 11) {
        url.searchParams.set('preselect', String(n))
      }
    }
    return NextResponse.redirect(url, 307)
  }

  // 5. Injeta locale detectado no header para fallback extra
  const detectedLocale = detectLocale(request)
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-detected-locale', detectedLocale)

  // 6. next-intl middleware para deteccao e redirecionamento de locale
  return handleI18n(request)
}

export const config = {
  matcher: [
    '/api/:path*',
    /*
     * Processa todas as rotas EXCETO:
     * - _next/static, _next/image (internos do Next.js)
     * - _vercel (internos da Vercel)
     * - Arquivos com extensao conhecida
     */
    '/((?!_next|_vercel|.*\\..*).*)',
  ],
}
