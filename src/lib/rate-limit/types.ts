import {
  RATE_LIMIT_SESSIONS_PER_IP,
  RATE_LIMIT_LEADS_PER_IP,
  RATE_LIMIT_AUTH_PER_IP,
} from '@/lib/enums'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  limit: number
  resetAt: Date
}

export interface RateLimitContext {
  ip: string
  action: RateLimitAction
  windowSeconds?: number
}

export type RateLimitAction = 'session' | 'lead' | 'auth' | 'submit_answer'

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

export const RATE_LIMIT_CONFIG: Record<
  RateLimitAction,
  { maxRequests: number; windowSeconds: number }
> = {
  session: {
    maxRequests: RATE_LIMIT_SESSIONS_PER_IP,
    windowSeconds: 3600, // 1 hora
  },
  lead: {
    maxRequests: RATE_LIMIT_LEADS_PER_IP,
    windowSeconds: 3600,
  },
  auth: {
    maxRequests: RATE_LIMIT_AUTH_PER_IP,
    windowSeconds: 3600,
  },
  submit_answer: {
    maxRequests: 60,
    windowSeconds: 60, // 1 minuto
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Constroi headers de rate limit para a resposta HTTP.
 */
export function buildRateLimitHeaders(
  result: RateLimitResult
): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': result.resetAt.toISOString(),
  }
}

/**
 * Cria resposta de erro 429 padronizada.
 */
export function createRateLimitError(result: RateLimitResult) {
  return {
    error: {
      code: 'RATE_LIMITED',
      message: `Limite excedido. Tente novamente apos ${result.resetAt.toISOString()}.`,
      details: null,
    },
    retryAfter: Math.ceil((result.resetAt.getTime() - Date.now()) / 1000),
  }
}
