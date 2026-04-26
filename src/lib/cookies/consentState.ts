import 'client-only'
import { PRIVACY_POLICY_VERSION } from '@/lib/privacy/policyVersion'

const COOKIE_NAME = 'consent_state'
const MAX_AGE = 180 * 24 * 60 * 60 // 180 dias

export type ConsentPreferences = {
  essential: true
  analytics: boolean
  marketing: boolean
  policyVersion: string
}

function safeParse(raw: string): ConsentPreferences | null {
  try {
    const decoded = decodeURIComponent(raw)
    const parsed = JSON.parse(decoded) as Partial<ConsentPreferences>
    if (
      typeof parsed.policyVersion === 'string' &&
      typeof parsed.analytics === 'boolean' &&
      typeof parsed.marketing === 'boolean'
    ) {
      return {
        essential: true,
        analytics: parsed.analytics,
        marketing: parsed.marketing,
        policyVersion: parsed.policyVersion,
      }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Returns current stored consent OR null if absent / policy-version outdated.
 * A bump in PRIVACY_POLICY_VERSION forces reconsent (returns null).
 */
export function getConsentState(): ConsentPreferences | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${COOKIE_NAME}=`))
  if (!match) return null
  const value = match.substring(COOKIE_NAME.length + 1)
  const parsed = safeParse(value)
  if (!parsed) return null
  if (parsed.policyVersion !== PRIVACY_POLICY_VERSION) return null
  return parsed
}

export function setConsentState(preferences: Omit<ConsentPreferences, 'essential' | 'policyVersion'>): void {
  if (typeof document === 'undefined') return
  const payload: ConsentPreferences = {
    essential: true,
    analytics: preferences.analytics,
    marketing: preferences.marketing,
    policyVersion: PRIVACY_POLICY_VERSION,
  }
  const encoded = encodeURIComponent(JSON.stringify(payload))
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:'
  document.cookie = `${COOKIE_NAME}=${encoded}; max-age=${MAX_AGE}; path=/; SameSite=Lax${secure ? '; Secure' : ''}`
  window.dispatchEvent(new CustomEvent('consent-state-changed', { detail: payload }))
}

export function clearConsentState(): void {
  if (typeof document === 'undefined') return
  document.cookie = `${COOKIE_NAME}=; max-age=0; path=/; SameSite=Lax`
}

export function hasAnalyticsConsent(): boolean {
  const state = getConsentState()
  return state?.analytics === true
}

export function hasMarketingConsent(): boolean {
  const state = getConsentState()
  return state?.marketing === true
}
