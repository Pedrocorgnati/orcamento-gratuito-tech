/**
 * Rate limiter in-memory com sliding window.
 * Para produção, substituir por Redis-based rate limiter.
 */

type RateLimitEntry = {
  timestamps: number[]
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>()
  private readonly maxRequests: number
  private readonly windowMs: number

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  /**
   * Verifica se o identificador (ex: IP) excedeu o limite.
   * Retorna true se PERMITIDO, false se BLOQUEADO.
   */
  check(identifier: string): boolean {
    const now = Date.now()
    const entry = this.store.get(identifier)

    if (!entry) {
      this.store.set(identifier, { timestamps: [now] })
      return true
    }

    // Filtrar timestamps dentro da janela
    entry.timestamps = entry.timestamps.filter((t) => now - t < this.windowMs)

    if (entry.timestamps.length >= this.maxRequests) {
      return false
    }

    entry.timestamps.push(now)
    return true
  }

  /** Limpa entradas expiradas (chamar periodicamente se necessário) */
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      entry.timestamps = entry.timestamps.filter((t) => now - t < this.windowMs)
      if (entry.timestamps.length === 0) {
        this.store.delete(key)
      }
    }
  }
}

/** Rate limiter para criação de sessões: 50 req/min por IP */
export const sessionRateLimiter = new RateLimiter(50, 60_000)

/** Rate limiter para captura de leads: 3 req/hora por IP (INT-096) */
export const leadRateLimiter = new RateLimiter(3, 60 * 60_000)

/**
 * Limpeza periódica para evitar crescimento ilimitado do store em memória.
 * Roda a cada 5 minutos; .unref?() não impede shutdown gracioso do Node.js.
 * leadRateLimiter usa janela de 1h — sem cleanup, entradas acumulariam por 1h.
 */
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    sessionRateLimiter.cleanup()
    leadRateLimiter.cleanup()
  }, 5 * 60_000).unref?.()
}
