'use client'

/**
 * @deprecated (Gap G1, intake-review 2026-04-23): use `@/lib/cookies/consentState`
 * instead. The new CookieBanner (CL-244) writes a JSON cookie `consent_state`;
 * this legacy helper still reads the old `COOKIE_CONSENT=true` cookie which is
 * no longer set by any UI. Kept only for backward compat with `onConsentGranted`
 * listener — will be removed once consumers migrate.
 */
export function hasAnalyticsConsent(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie
    .split('; ')
    .some((row) => row === 'COOKIE_CONSENT=true')
}

/**
 * Escuta o evento 'cookie-consent-granted' disparado pelo CookieConsentBanner.
 * Útil para ativar analytics retroativamente na mesma sessão.
 * Retorna função de cleanup (remover listener).
 */
export function onConsentGranted(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = () => callback()
  window.addEventListener('cookie-consent-granted', handler)
  return () => window.removeEventListener('cookie-consent-granted', handler)
}
