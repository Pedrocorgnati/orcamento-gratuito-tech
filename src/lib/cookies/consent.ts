import 'client-only'

const COOKIE_NAME = 'COOKIE_CONSENT'
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60

export function getConsentStatus(): 'true' | 'dismissed' | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${COOKIE_NAME}=`))
  if (!match) return null
  const value = match.split('=')[1]
  if (value === 'true') return 'true'
  if (value === 'dismissed') return 'dismissed'
  return null
}

export function acceptAllCookies(): void {
  document.cookie = `${COOKIE_NAME}=true; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`
  window.dispatchEvent(new CustomEvent('cookie-consent-granted'))
}

export function dismissConsentBanner(): void {
  document.cookie = `${COOKIE_NAME}=dismissed; path=/; SameSite=Lax`
}

export function hasConsent(): boolean {
  return getConsentStatus() === 'true'
}
