import { PublicLayout } from '@/components/layout'
import { Link } from '@/i18n/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import type { AppLocale } from '@/i18n/routing'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/metadata'

type PageProps = {
  params: Promise<{ locale: string; token: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'unsubscribe' }).catch(
    () => null
  )
  return generatePageMetadata({
    title: t?.('title') ?? 'Unsubscribe',
    description: t?.('description') ?? 'Unsubscribe from communications',
    locale,
    path: '/unsubscribe',
  })
}

type Outcome = 'lead' | 'session' | 'already' | 'not_found' | 'error'

async function applyUnsubscribe(token: string): Promise<Outcome> {
  if (!token || token.length < 10) return 'not_found'
  try {
    const lead = await prisma.lead.findUnique({
      where: { unsubscribe_token: token },
      select: { id: true, unsubscribed_at: true },
    })
    if (lead) {
      if (lead.unsubscribed_at) return 'already'
      await prisma.lead.update({
        where: { id: lead.id },
        data: { unsubscribed_at: new Date() },
      })
      return 'lead'
    }
    const session = await prisma.session.findUnique({
      where: { id: token },
      select: { id: true, intermediate_email: true },
    })
    if (session) {
      if (!session.intermediate_email) return 'already'
      await prisma.session.update({
        where: { id: session.id },
        data: { intermediate_email: null, resume_email_sent_at: new Date() },
      })
      return 'session'
    }
    return 'not_found'
  } catch (error) {
    logger.error('unsubscribe_page_failed', {
      error: error instanceof Error ? error.message : 'unknown',
    })
    return 'error'
  }
}

export default async function UnsubscribePage({ params }: PageProps) {
  const { locale, token } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'unsubscribe' })
  const outcome = await applyUnsubscribe(token)
  const isSuccess = outcome === 'lead' || outcome === 'session' || outcome === 'already'

  return (
    <PublicLayout locale={locale as AppLocale}>
      <main className="mx-auto max-w-xl px-4 py-16">
        <h1 className="text-3xl font-semibold text-slate-900">
          {isSuccess ? t('successTitle') : t('errorTitle')}
        </h1>
        <p className="mt-4 text-slate-600">
          {isSuccess ? t('successMessage') : t('errorMessage')}
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            {t('backHome')}
          </Link>
        </div>
      </main>
    </PublicLayout>
  )
}

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale, token: '_' }))
}

export const dynamic = 'force-dynamic'
