'use client'

import { Analytics } from '@vercel/analytics/react'

/**
 * Wrapper client para <Analytics> da Vercel com gate de consentimento LGPD/GDPR.
 * Deve ser usado em layouts Server Component — isola a função `beforeSend` no
 * cliente, evitando passar closures (não-serializáveis) via RSC protocol.
 *
 * FEAT-UX-005 (module-17)
 */
export function AnalyticsWithConsent() {
  return (
    <Analytics
      beforeSend={(event) => {
        const hasConsent = document.cookie
          .split('; ')
          .some((row) => row === 'COOKIE_CONSENT=true')
        if (!hasConsent) return null
        return event
      }}
    />
  )
}
