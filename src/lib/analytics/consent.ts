'use client'

/**
 * Verifica se o usuário deu consentimento para analytics.
 * Integra com o cookie COOKIE_CONSENT definido pelo module-17.
 * FEAT-UX-005, INT-033 (LGPD/GDPR)
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
