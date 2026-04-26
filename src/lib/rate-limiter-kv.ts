/**
 * Rate limiter distribuído via Upstash Redis — para ambientes multi-instância (Vercel).
 *
 * COMO ATIVAR:
 *   1. npm install @upstash/ratelimit @upstash/redis
 *   2. Adicionar no Vercel/env:
 *        UPSTASH_REDIS_REST_URL=https://...
 *        UPSTASH_REDIS_REST_TOKEN=AX...
 *   3. Em leads/route.ts e sessions/route.ts:
 *        import { leadRateLimiter, sessionRateLimiter } from '@/lib/rate-limiter-kv'
 *        if (!(await leadRateLimiter.check(`lead:${ip}`))) { ... }
 *
 * Rastreabilidade: G009, TASK-REFORGE-1 (module-18)
 *
 * NOTA: Este arquivo requer @upstash/ratelimit + @upstash/redis instalados.
 * Enquanto o pacote não estiver instalado, os callers continuam em rate-limiter.ts.
 */

// @ts-expect-error — instalar com: npm install @upstash/ratelimit @upstash/redis
import { Ratelimit } from '@upstash/ratelimit'
// @ts-expect-error
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

/**
 * Rate limiter para leads: 3 req/hora por IP (INT-096).
 * Sliding window mantém estado entre cold starts do Vercel.
 */
const _leadRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  prefix: '@budget/lead',
})

/**
 * Rate limiter para sessões: 50 req/min por IP.
 */
const _sessionRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, '1 m'),
  prefix: '@budget/session',
})

/**
 * Interface unificada: async check() retorna boolean.
 * Compatível com o padrão `if (!(await limiter.check(ip)))` nos callers.
 */
export const leadRateLimiter = {
  check: async (identifier: string): Promise<boolean> => {
    const { success } = await _leadRateLimiter.limit(identifier)
    return success
  },
}

export const sessionRateLimiter = {
  check: async (identifier: string): Promise<boolean> => {
    const { success } = await _sessionRateLimiter.limit(identifier)
    return success
  },
}
