import * as Sentry from '@sentry/nextjs'
import { redactPII } from '@/lib/security/redactPII'

const dsn = process.env.SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    sampleRate: 1.0,
    beforeSend(event) {
      if (event.extra) event.extra = redactPII(event.extra)
      if (event.contexts) event.contexts = redactPII(event.contexts)
      if (event.tags) event.tags = redactPII(event.tags) as typeof event.tags
      if (event.user) event.user = redactPII(event.user)
      return event
    },
  })
}
