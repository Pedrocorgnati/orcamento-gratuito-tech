'use server'

import { cookies } from 'next/headers'
import { estimationService } from '@/services/estimation.service'
import { COOKIE_NAMES } from '@/lib/constants'

/**
 * SA-003: Server Action wrapper para estimationService.calculate().
 * IDOR guard via cookie session_id.
 */
export async function calculateEstimation(sessionId: string) {
  const cookieStore = await cookies()
  const cookieSessionId = cookieStore.get(COOKIE_NAMES.SESSION_ID)?.value

  if (!cookieSessionId || cookieSessionId !== sessionId) {
    throw new Error('Sessão inválida ou não autorizada.')
  }

  return estimationService.calculate(sessionId)
}
