'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import {
  getConsentStatus,
  acceptAllCookies,
  dismissConsentBanner,
} from '@/lib/cookies/consent'
import { trackConsentBannerAccepted } from '@/lib/analytics/events'

export function CookieConsentBanner() {
  const t = useTranslations('cookies')
  const locale = useLocale()
  const [visible, setVisible] = useState<boolean | null>(null)
  const acceptButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const status = getConsentStatus()
    setVisible(status === null)
  }, [])

  useEffect(() => {
    if (visible === true) {
      const timer = setTimeout(() => {
        acceptButtonRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [visible])

  useEffect(() => {
    if (!visible) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [visible])

  function handleAccept() {
    acceptAllCookies()
    trackConsentBannerAccepted()
    setVisible(false)
  }

  function handleDismiss() {
    dismissConsentBanner()
    setVisible(false)
  }

  if (visible === null || visible === false) return null

  return (
    <div
      data-testid="cookie-consent-banner"
      role="dialog"
      aria-label={t('banner.ariaLabel')}
      aria-modal="true"
      aria-describedby="cookie-banner-description"
      className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 text-white shadow-2xl p-4 md:p-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div id="cookie-banner-description" data-testid="cookie-consent-description" className="flex-1">
        <p className="text-sm text-gray-200">
          {t('banner.message')}{' '}
          <Link
            href={`/${locale}/privacy`}
            data-testid="cookie-consent-privacy-link"
            className="underline hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('banner.privacyLink')}
          </Link>
          .
        </p>
      </div>

      <div data-testid="cookie-consent-actions" className="flex flex-shrink-0 items-center gap-3">
        <button
          ref={acceptButtonRef}
          onClick={handleAccept}
          type="button"
          data-testid="cookie-consent-accept-button"
          className="rounded-md bg-white px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors active:scale-[0.98]"
          aria-label={t('banner.acceptAllAriaLabel')}
        >
          {t('banner.acceptAll')}
        </button>

        <Link
          href={`/${locale}/privacy`}
          data-testid="cookie-consent-view-policy-link"
          className="rounded-md border border-gray-500 px-4 py-3 text-sm font-medium text-gray-300 hover:border-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors"
        >
          {t('banner.viewPolicy')}
        </Link>
      </div>
    </div>
  )
}
