import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { unstable_cache } from 'next/cache'
import type { Metadata } from 'next'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { ResultCard } from '@/components/result/ResultCard'
import { ResultViewTracker } from '@/components/analytics/ResultViewTracker'
import { MobileHeader } from '@/components/mobile/MobileHeader'
import { prisma } from '@/lib/prisma'
import { LeadScore, SessionStatus } from '@/lib/enums'
import { COOKIE_NAMES } from '@/lib/constants'
import type { EstimationResult, ExchangeRateItem } from '@/lib/types'
import { serverFetch } from '@/lib/server-fetch'
import { ProjectType } from '@/lib/enums'
type EstimationApiResult = {
  price_min: number
  price_max: number
  days_min: number
  days_max: number
  currency: string
  locale: string
  complexity: string
  complexity_score: number
  features: string[]
  project_type: string
  project_types?: string[]
  scope_story: string
  breakdown?: Array<{
    project_type: string
    price_min: number
    price_max: number
    days_min: number
    days_max: number
    complexity: string
    complexity_score: number
    features: string[]
  }>
}

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

type ResultPageProps = {
  params: Promise<{ locale: string }>
}

// ─────────────────────────────────────────────────────────────────────────────
// Data fetching helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Busca a estimativa da sessão via API interna.
 * Retorna null em qualquer erro (SESSION_080 / SYS_001 / VAL_001).
 */
async function fetchEstimation(sessionId: string): Promise<EstimationApiResult | null> {
  // 503 (ESTIMATE_052) devolve payload útil com fallback BRL — não descartar.
  return serverFetch<EstimationApiResult>(
    `/api/v1/sessions/${sessionId}/estimate`,
    { sessionId, acceptStatus: [503] }
  )
}

function normalizeEstimation(estimation: EstimationApiResult): EstimationResult {
  return {
    projectType: estimation.project_type as ProjectType,
    projectTypes: (estimation.project_types ?? [estimation.project_type]) as ProjectType[],
    complexity: estimation.complexity as EstimationResult['complexity'],
    priceMin: estimation.price_min,
    priceMax: estimation.price_max,
    daysMin: estimation.days_min,
    daysMax: estimation.days_max,
    currency: estimation.currency as EstimationResult['currency'],
    locale: estimation.locale as EstimationResult['locale'],
    features: estimation.features,
    scopeStory: estimation.scope_story,
    consistencyAlerts: [],
    score: LeadScore.C,
    scoreBudget: 0,
    scoreTimeline: 0,
    scoreProfile: 0,
    scoreTotal: 0,
    breakdown: estimation.breakdown?.map((item) => ({
      projectType: item.project_type as ProjectType,
      priceMin: item.price_min,
      priceMax: item.price_max,
      daysMin: item.days_min,
      daysMax: item.days_max,
      complexity: item.complexity as EstimationResult['complexity'],
      complexityScore: item.complexity_score,
      features: item.features,
    })),
  }
}

/**
 * Conta sessões COMPLETED para o social proof (FEAT-EE-008).
 * Cache de 60 segundos para evitar query a cada requisição.
 */
const fetchCompletedSessionsCount = unstable_cache(
  async (): Promise<number> => {
    try {
      return await prisma.session.count({
        where: { status: SessionStatus.COMPLETED },
      })
    } catch {
      return 0
    }
  },
  ['completed-sessions-count'],
  { revalidate: 60 }
)

// ─────────────────────────────────────────────────────────────────────────────
// ResultContent — async RSC que suspende enquanto carrega dados
// ─────────────────────────────────────────────────────────────────────────────

async function ResultContent({
  sessionId,
  locale,
}: {
  sessionId: string
  locale: string
}) {
  const [estimation, exchangeRatesRaw, completedCount] = await Promise.all([
    fetchEstimation(sessionId),
    prisma.exchangeRate.findMany(),
    fetchCompletedSessionsCount(),
  ])

  if (!estimation) {
    redirect(`/${locale}/flow`)
  }

  const normalizedEstimation = normalizeEstimation(estimation)

  const exchangeRates: ExchangeRateItem[] = exchangeRatesRaw.map((r) => ({
    from_currency: r.from_currency,
    to_currency:   r.to_currency,
    rate:          r.rate,
  }))

  return (
    <>
      <ResultViewTracker
        complexity={normalizedEstimation.complexity ?? 'unknown'}
        priceRange={`${normalizedEstimation.priceMin ?? 0}-${normalizedEstimation.priceMax ?? 0}`}
        currency={normalizedEstimation.currency ?? 'BRL'}
      />
      <ResultCard
        estimation={normalizedEstimation}
        exchangeRates={exchangeRates}
        locale={locale}
        leadCaptureHref={`/${locale}/lead-capture`}
        completedCount={completedCount}
      />
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default async function ResultPage({ params }: ResultPageProps) {
  const { locale } = await params
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(COOKIE_NAMES.SESSION_ID)

  // VAL_001 — cookie ausente → redirect imediato
  if (!sessionCookie?.value) {
    redirect(`/${locale}/flow`)
  }

  return (
    <>
      <MobileHeader title="Budget Free Engine" showBack />
      <main data-testid="page-result" className="min-h-screen bg-gray-50 py-8 px-4 md:py-16">
        <div className="max-w-2xl mx-auto">
          <Suspense fallback={<div data-testid="result-loading"><SkeletonLoader type="card" lines={8} /></div>}>
            <ResultContent sessionId={sessionCookie.value} locale={locale} />
          </Suspense>
        </div>
      </main>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: ResultPageProps): Promise<Metadata> {
  const { locale } = await params

  const TITLES: Record<string, string> = {
    'pt-BR': 'Seu Orçamento Estimado | Budget Free',
    'en-US': 'Your Estimated Budget | Budget Free',
    'es-ES': 'Tu Presupuesto Estimado | Budget Free',
    'it-IT': 'Il Tuo Preventivo Stimato | Budget Free',
  }
  const DESCRIPTIONS: Record<string, string> = {
    'pt-BR': 'Veja a estimativa personalizada para o seu projeto de software.',
    'en-US': 'View the personalized estimate for your software project.',
    'es-ES': 'Consulta la estimación personalizada para tu proyecto de software.',
    'it-IT': 'Visualizza la stima personalizzata per il tuo progetto software.',
  }

  const title = TITLES[locale] ?? TITLES['en-US']
  const description = DESCRIPTIONS[locale] ?? DESCRIPTIONS['en-US']

  // Tentar gerar OG image dinâmica a partir da sessão
  let ogImageUrl = '/images/og-image.jpg'
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get(COOKIE_NAMES.SESSION_ID)?.value
    if (sessionId) {
      const estimation = await serverFetch<Partial<EstimationApiResult>>(
        `/api/v1/sessions/${sessionId}/estimate`,
        { sessionId, acceptStatus: [503] }
      )
      if (estimation) {
        const min = estimation?.price_min ?? 0
        const max = estimation?.price_max ?? 0
        const currency = estimation?.currency ?? 'BRL'
        const projectType = estimation?.project_type ?? 'Software'
        ogImageUrl = `/api/og/result?min=${min}&max=${max}&currency=${currency}&type=${encodeURIComponent(String(projectType))}`
      }
    }
  } catch {
    // fallback para OG estática
  }

  return {
    title,
    description,
    robots: { index: false, follow: false }, // página privada por sessão
    openGraph: {
      title,
      description,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  }
}
