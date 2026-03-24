import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { AppLocale } from '@/i18n/routing'
import { SessionStatus } from '@/lib/enums'
import { COOKIE_NAMES } from '@/lib/constants'

type FlowEntryPageProps = {
  params: Promise<{ locale: string }>
}

/**
 * Entry point do fluxo de orçamento.
 * - Se cookie session_id existe e sessão está ativa: retoma no ponto atual
 * - Se sessão está COMPLETED: redireciona para /result
 * - Sem sessão: cria nova via POST /api/v1/sessions e redireciona para /flow/Q001
 */
export default async function FlowEntryPage({ params }: FlowEntryPageProps) {
  const { locale } = await params
  const safeLocale = locale as AppLocale

  const cookieStore = await cookies()
  const sessionId = cookieStore.get(COOKIE_NAMES.SESSION_ID)?.value

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  if (sessionId) {
    // Sessão existente: verificar status
    try {
      const res = await fetch(`${baseUrl}/api/v1/sessions/${sessionId}`, {
        headers: { Cookie: `${COOKIE_NAMES.SESSION_ID}=${sessionId}` },
        cache: 'no-store',
        signal: AbortSignal.timeout(5_000),
      })

      if (res.ok) {
        const session = await res.json()
        if (session.status === SessionStatus.COMPLETED) {
          redirect(`/${safeLocale}/result`)
        }
        if (session.current_question_id) {
          redirect(`/${safeLocale}/flow/${session.current_question_id}`)
        }
      }
    } catch {
      // Sessão inválida ou expirada — criar nova abaixo
    }
  }

  // Sem sessão válida: criar nova
  const res = await fetch(`${baseUrl}/api/v1/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ locale: safeLocale, currency: 'BRL' }),
    cache: 'no-store',
    signal: AbortSignal.timeout(5_000),
  })

  if (!res.ok) {
    // Lança erro que será capturado pelo error.tsx
    throw new Error('Falha ao criar sessão de orçamento')
  }

  const session = await res.json()
  const firstQuestionId = session.current_question_id ?? 'Q001'
  redirect(`/${safeLocale}/flow/${firstQuestionId}`)
}
