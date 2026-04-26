import 'server-only'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function anonymizeLeadsByEmail(email: string): Promise<number> {
  const normalized = email.toLowerCase()
  const result = await prisma.lead.updateMany({
    where: {
      email: { equals: normalized, mode: 'insensitive' },
      anonymized_at: null,
    },
    data: {
      name: 'ANONYMIZED',
      email: 'anonymized@example.invalid',
      phone: null,
      whatsapp: null,
      company: null,
      scope_story: '',
      anonymized_at: new Date(),
    },
  })
  logger.info('erasure_anonymized_leads', { count: result.count })
  return result.count
}

export function generateErasureToken(): string {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10)
  )
}

export const ERASURE_TOKEN_TTL_MS = 24 * 60 * 60 * 1000
