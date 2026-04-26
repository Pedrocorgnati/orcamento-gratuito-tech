'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Clock } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface SessionExpiredMessageProps {
  locale: string
}

export function SessionExpiredMessage({ locale }: SessionExpiredMessageProps) {
  const t = useTranslations('session.expired')
  const router = useRouter()

  return (
    <div
      data-testid="session-expired-message"
      className="flex min-h-screen items-center justify-center bg-(--color-background) px-4 py-8"
    >
      <Card variant="elevated" padding="lg" className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-900">
          <Clock className="h-8 w-8 text-yellow-500" aria-hidden={true} />
        </div>

        <h1 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
          {t('title')}
        </h1>

        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          {t('description')}
        </p>

        <Button
          variant="primary"
          size="md"
          data-testid="session-expired-cta"
          className="w-full sm:w-auto"
          onClick={() => router.push(`/${locale}/flow`)}
        >
          {t('cta')}
        </Button>
      </Card>
    </div>
  )
}
