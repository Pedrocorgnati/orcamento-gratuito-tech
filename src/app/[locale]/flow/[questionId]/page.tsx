import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { FlowLayout } from '@/components/flow/FlowLayout'
import { QuestionPageClient } from '@/components/flow/QuestionPageClient'
import { BackButton } from '@/components/flow/BackButton'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { goBack } from '@/actions/session'
import type { AppLocale } from '@/i18n/routing'
import { serverFetch } from '@/lib/server-fetch'
import { COOKIE_NAMES } from '@/lib/constants'

type QuestionPageProps = {
  params: Promise<{ locale: string; questionId: string }>
}

// ─────────────────────────────────────────────────────────────────────────────
// Metadata dinâmica — noindex (fluxo não deve ser indexado)
// ─────────────────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: QuestionPageProps): Promise<Metadata> {
  const { locale, questionId } = await params

  try {
    const question = await serverFetch<{ translation: { title: string; description?: string } }>(
      `/api/v1/questions/${questionId}?locale=${locale}`,
      { cache: 'force-cache' }
    )
    if (question) {
      return {
        title: `${question.translation.title} — Budget Free Engine`,
        description:
          question.translation.description ??
          'Calcule o orçamento do seu projeto de software',
        robots: { index: false, follow: false },
      }
    }
  } catch {
    // Fallback
  }

  return {
    title: 'Calculadora de Orçamento — Budget Free Engine',
    robots: { index: false, follow: false },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton de loading
// ─────────────────────────────────────────────────────────────────────────────

function QuestionPageSkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="h-14 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950" />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <SkeletonLoader className="h-48 w-full rounded-2xl" />
        <div className="mt-4 flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <SkeletonLoader key={i} className="h-[56px] w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Conteúdo principal da página (RSC)
// ─────────────────────────────────────────────────────────────────────────────

async function QuestionPageContent({
  locale,
  questionId,
}: {
  locale: string
  questionId: string
}) {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(COOKIE_NAMES.SESSION_ID)?.value

  // Buscar pergunta com tradução
  const question = await serverFetch<{
    id: string
    code?: string
    slug?: string
    type: string
    block: string
    order: number
    translation: { locale: string; title: string; description: string | null }
    options: {
      id: string
      slug?: string
      order: number
      price_impact: number
      time_impact: number
      complexity_impact: number
      next_question_id: string | null
      translation: { label: string; description: string | null }
    }[]
  }>(
    `/api/v1/questions/${questionId}?locale=${locale}`,
    { cache: 'no-store' }
  )

  if (!question) {
    notFound()
  }

  // Buscar progresso da sessão
  let progressPercentage: number | undefined
  let questionsAnswered: number | undefined
  let projectType: string | null | undefined
  let isFirstQuestion =
    question.code === 'Q001' || question.slug === 'Q001'

  if (sessionId) {
    const session = await serverFetch<{
      progress_percentage: number
      questions_answered: number
      project_type?: string | null
    }>(`/api/v1/sessions/${sessionId}`, { sessionId })

    if (session) {
      progressPercentage = session.progress_percentage
      questionsAnswered = session.questions_answered
      projectType = session.project_type ?? null
      isFirstQuestion = session.questions_answered === 0
    }
  }

  // Inline server action para goBack — closure com sessionId e locale
  const handleGoBack = sessionId
    ? async () => {
        'use server'
        await goBack({ sessionId: sessionId, locale })
      }
    : undefined

  return (
    <FlowLayout
      locale={locale}
      progressPercentage={progressPercentage}
      questionsAnswered={questionsAnswered}
      projectType={projectType}
      bottomAction={
        <BackButton
          isFirstQuestion={isFirstQuestion}
          onGoBack={handleGoBack}
        />
      }
    >
      <QuestionPageClient
        question={question}
        locale={locale}
        sessionId={sessionId}
      />
    </FlowLayout>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────────────────────

export default async function QuestionPage({ params }: QuestionPageProps) {
  const { locale, questionId } = await params
  const safeLocale = locale as AppLocale

  return (
    <Suspense fallback={<QuestionPageSkeleton />}>
      <QuestionPageContent locale={safeLocale} questionId={questionId} />
    </Suspense>
  )
}
