'use server'

import { prisma } from '@/lib/prisma'
import { anonymizeLeadsByEmail, ERASURE_TOKEN_TTL_MS } from '@/lib/security/erasure'
import { logger } from '@/lib/logger'

export interface ConfirmErasureResult {
  success: boolean
  anonymizedCount?: number
  error?: 'not_found' | 'expired' | 'already_processed' | 'internal'
}

export async function confirmErasure(token: string): Promise<ConfirmErasureResult> {
  try {
    const req = await prisma.erasureRequest.findUnique({ where: { token } })
    if (!req) return { success: false, error: 'not_found' }
    if (req.processed_at) return { success: false, error: 'already_processed' }
    if (Date.now() - req.created_at.getTime() > ERASURE_TOKEN_TTL_MS) {
      return { success: false, error: 'expired' }
    }

    const count = await anonymizeLeadsByEmail(req.email)
    await prisma.erasureRequest.update({
      where: { id: req.id },
      data: { verified_at: new Date(), processed_at: new Date() },
    })
    return { success: true, anonymizedCount: count }
  } catch (err) {
    logger.error('confirm_erasure_failed', { error: (err as Error).message })
    return { success: false, error: 'internal' }
  }
}
