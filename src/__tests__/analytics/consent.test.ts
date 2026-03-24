import { describe, it, expect, beforeEach, vi } from 'vitest'
import { hasAnalyticsConsent, onConsentGranted } from '@/lib/analytics/consent'

describe('hasAnalyticsConsent', () => {
  beforeEach(() => {
    // Limpar cookies antes de cada teste
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    })
  })

  it('retorna false quando COOKIE_CONSENT não está definido', () => {
    expect(hasAnalyticsConsent()).toBe(false)
  })

  it('retorna true quando COOKIE_CONSENT=true', () => {
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'COOKIE_CONSENT=true',
    })
    expect(hasAnalyticsConsent()).toBe(true)
  })

  it('retorna false quando COOKIE_CONSENT=false', () => {
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'COOKIE_CONSENT=false',
    })
    expect(hasAnalyticsConsent()).toBe(false)
  })

  it('retorna true mesmo com outros cookies presentes', () => {
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'session_id=abc123; COOKIE_CONSENT=true; theme=dark',
    })
    expect(hasAnalyticsConsent()).toBe(true)
  })
})

describe('onConsentGranted', () => {
  it('executa callback quando evento consent-granted é disparado', () => {
    const callback = vi.fn()
    onConsentGranted(callback)
    window.dispatchEvent(new Event('cookie-consent-granted'))
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('não executa callback antes do evento', () => {
    const callback = vi.fn()
    onConsentGranted(callback)
    expect(callback).not.toHaveBeenCalled()
  })
})
