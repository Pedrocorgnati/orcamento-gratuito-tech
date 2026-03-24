import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import type { AppLocale } from '@/i18n/routing'
import { SessionStatus } from '@/lib/enums'
import { COOKIE_NAMES } from '@/lib/constants'
import { ResumePageContent, type ResumeState } from './ResumePageContent'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ResumePageProps = {
  params: Promise<{ locale: AppLocale; sessionId: string }>
}

// ─────────────────────────────────────────────────────────────────────────────
// Metadata — noindex (rota privada, não indexar)
// ─────────────────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: ResumePageProps): Promise<Metadata> {
  const { locale } = await params
  return {
    title: 'Retomar orçamento — Budget Free Engine',
    description: 'Retome seu orçamento de projeto de software do ponto onde parou.',
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: `/${locale}/flow`,
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Page — RSC com lógica de estado e redirecionamento
//
// Estados possíveis:
//   NO_COOKIE        — sem cookie session_id no browser
//   COOKIE_MISMATCH  — cookie existe mas não corresponde ao sessionId da URL
//   NOT_FOUND        — sessão não existe no banco (404)
//   EXPIRED          — sessão expirada (410)
//   ERROR            — erro 5xx da API
//   NETWORK_ERROR    — falha de rede ao chamar a API
//   UNKNOWN          — status não mapeado
//
// Redirecionamentos automáticos:
//   COMPLETED → /${locale}/result
//   IN_PROGRESS → /${locale}/flow/${current_question_id}
// ─────────────────────────────────────────────────────────────────────────────

export default async function ResumePage({ params }: ResumePageProps) {
  const { locale, sessionId } = await params

  const cookieStore = await cookies()
  const cookieSessionId = cookieStore.get(COOKIE_NAMES.SESSION_ID)?.value

  // Cenário 1: Sem cookie — sessão não pertence a este browser
  if (!cookieSessionId) {
    return (
      <ResumePageContent locale={locale} sessionId={sessionId} state="NO_COOKIE" />
    )
  }

  // Cenário 2: Cookie não corresponde ao sessionId da URL
  if (cookieSessionId !== sessionId) {
    return (
      <ResumePageContent locale={locale} sessionId={sessionId} state="COOKIE_MISMATCH" />
    )
  }

  // Cenário 3: Cookie corresponde — buscar sessão via API
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  let fetchError: ResumeState | null = null
  let session: { status: string; current_question_id?: string | null } | null = null

  try {
    const res = await fetch(`${baseUrl}/api/v1/sessions/${sessionId}`, {
      headers: { Cookie: `${COOKIE_NAMES.SESSION_ID}=${sessionId}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(5_000),
    })

    if (res.status === 404) {
      fetchError = 'NOT_FOUND'
    } else if (res.status === 410) {
      fetchError = 'EXPIRED'
    } else if (res.ok) {
      session = await res.json()
    } else {
      fetchError = 'ERROR'
    }
  } catch {
    fetchError = 'NETWORK_ERROR'
  }

  // Exibir página de estado para erros
  if (fetchError) {
    return (
      <ResumePageContent locale={locale} sessionId={sessionId} state={fetchError} />
    )
  }

  // Cenário 4: Sessão COMPLETED — redirecionar para resultado
  if (session?.status === SessionStatus.COMPLETED) {
    redirect(`/${locale}/result`)
  }

  // Cenário 5: Sessão IN_PROGRESS — redirecionar para pergunta atual
  if (session?.status === SessionStatus.IN_PROGRESS && session?.current_question_id) {
    redirect(`/${locale}/flow/${session.current_question_id}`)
  }

  // Cenário 6: Status desconhecido ou sem current_question_id
  return (
    <ResumePageContent locale={locale} sessionId={sessionId} state="UNKNOWN" />
  )
}
