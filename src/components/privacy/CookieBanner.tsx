'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useConsentState } from '@/hooks/useConsentState'
import { setConsentState } from '@/lib/cookies/consentState'
import { CookiePreferencesDialog } from './CookiePreferencesDialog'

export function CookieBanner() {
  const t = useTranslations('cookies.banner')
  const { state, hydrated } = useConsentState()
  const [prefsOpen, setPrefsOpen] = useState(false)

  if (!hydrated || state !== null) return null

  function acceptAll() {
    setConsentState({ analytics: true, marketing: true })
  }
  function essentialsOnly() {
    setConsentState({ analytics: false, marketing: false })
  }

  return (
    <>
      <div
        role="region"
        aria-label={t('ariaLabel')}
        data-testid="cookie-banner"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white p-4 shadow-lg sm:p-6"
      >
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-700">
            {t('message')}{' '}
            <Link href="/privacy" className="text-blue-600 underline">
              {t('privacyLink')}
            </Link>
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={essentialsOnly}
              className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
              data-testid="cookie-banner-essentials"
            >
              {t('essentialsOnly')}
            </button>
            <button
              type="button"
              onClick={() => setPrefsOpen(true)}
              className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
              data-testid="cookie-banner-customize"
            >
              {t('customize')}
            </button>
            <button
              type="button"
              onClick={acceptAll}
              aria-label={t('acceptAllAriaLabel')}
              className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
              data-testid="cookie-banner-accept-all"
            >
              {t('acceptAll')}
            </button>
          </div>
        </div>
      </div>
      <CookiePreferencesDialog open={prefsOpen} onClose={() => setPrefsOpen(false)} />
    </>
  )
}
