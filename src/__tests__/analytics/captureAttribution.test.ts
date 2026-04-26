import { describe, it, expect } from 'vitest'
import { captureAttribution, hasAttribution } from '@/lib/analytics/captureAttribution'

describe('captureAttribution', () => {
  it('extracts utm params from url', () => {
    const url = new URL(
      'https://x.com/?utm_source=linkedin&utm_medium=cpc&utm_campaign=abr2026&utm_term=saas&utm_content=hero'
    )
    const a = captureAttribution(url, 'https://linkedin.com/')
    expect(a.utmSource).toBe('linkedin')
    expect(a.utmMedium).toBe('cpc')
    expect(a.utmCampaign).toBe('abr2026')
    expect(a.utmTerm).toBe('saas')
    expect(a.utmContent).toBe('hero')
    expect(a.referrer).toBe('https://linkedin.com/')
  })

  it('returns null when params absent', () => {
    const a = captureAttribution(new URL('https://x.com/'), null)
    expect(a.utmSource).toBeNull()
    expect(a.referrer).toBeNull()
  })

  it('truncates values to 128 chars', () => {
    const long = 'a'.repeat(200)
    const a = captureAttribution(new URL(`https://x.com/?utm_source=${long}`), null)
    expect(a.utmSource).toHaveLength(128)
  })

  it('strips non-printable characters', () => {
    const a = captureAttribution(
      new URL('https://x.com/?utm_source=linked%00in'),
      null
    )
    expect(a.utmSource).toBe('linkedin')
  })

  it('hasAttribution returns false on empty payload', () => {
    const a = captureAttribution(new URL('https://x.com/'), null)
    expect(hasAttribution(a)).toBe(false)
  })
})
