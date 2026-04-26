'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { setConsentState } from '@/lib/cookies/consentState'

export function CookiePreferencesDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const t = useTranslations('cookies.preferences')
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)

  if (!open) return null

  function save() {
    setConsentState({ analytics, marketing })
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-prefs-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 id="cookie-prefs-title" className="text-lg font-semibold text-slate-900">
          {t('title')}
        </h2>
        <p className="mt-2 text-sm text-slate-600">{t('description')}</p>

        <div className="mt-4 space-y-3">
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              checked
              disabled
              id="cookie-essential"
              className="mt-1"
            />
            <label htmlFor="cookie-essential" className="text-sm">
              <strong>{t('essentialLabel')}</strong> — {t('essentialDescription')}
            </label>
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={analytics}
              onChange={(e) => setAnalytics(e.target.checked)}
              id="cookie-analytics"
              className="mt-1"
            />
            <label htmlFor="cookie-analytics" className="text-sm">
              <strong>{t('analyticsLabel')}</strong> — {t('analyticsDescription')}
            </label>
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={marketing}
              onChange={(e) => setMarketing(e.target.checked)}
              id="cookie-marketing"
              className="mt-1"
            />
            <label htmlFor="cookie-marketing" className="text-sm">
              <strong>{t('marketingLabel')}</strong> — {t('marketingDescription')}
            </label>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-300 px-3 py-1.5 text-sm"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={save}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
          >
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  )
}
