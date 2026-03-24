import 'server-only'
import { logger } from '@/lib/logger'

export interface RetryOptions {
  maxAttempts: number
  delays: number[] // ms entre tentativas
}

export class RetryExhaustedError extends Error {
  constructor(
    public readonly attempts: number,
    public readonly lastError: unknown
  ) {
    super(`Todas as ${attempts} tentativas falharam`)
    this.name = 'RetryExhaustedError'
  }
}

/**
 * Executa fn com retry e backoff exponencial.
 * Padrão: maxAttempts=3, delays=[1000, 4000, 16000]ms
 * Erros não-retryable (4xx exceto 429) falham imediatamente.
 * SEC-008: nenhum PII nos logs.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = { maxAttempts: 3, delays: [1000, 4000, 16000] }
): Promise<T> {
  const { maxAttempts, delays } = options
  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn()

      // Log de sucesso — SEM PII (SEC-008)
      logger.info('retry_attempt', { attempt, status: 'success' })

      return result
    } catch (error) {
      lastError = error
      const isRetryable = isRetryableError(error)

      // Log de falha — SEM PII (SEC-008)
      logger.warn('retry_attempt', {
        attempt,
        status: 'failed',
        retryable: isRetryable,
        errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
      })

      if (!isRetryable) {
        throw new RetryExhaustedError(attempt, error)
      }

      if (attempt < maxAttempts) {
        const delay = delays[attempt - 1] ?? delays[delays.length - 1]
        await sleep(delay)
      }
    }
  }

  throw new RetryExhaustedError(maxAttempts, lastError)
}

/**
 * Determina se o erro é retryable.
 * Retryable: timeout, 429, 5xx, erros de rede.
 * Não-retryable: 4xx (exceto 429), erros de validação.
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const resendError = error as Error & { statusCode?: number }

    if (resendError.statusCode !== undefined) {
      if (resendError.statusCode === 429) return true
      if (resendError.statusCode >= 500) return true
      if (resendError.statusCode >= 400) return false
    }

    // Erros de rede
    if (
      error.constructor.name === 'FetchError' ||
      error.message?.includes('ECONNRESET') ||
      error.message?.includes('fetch failed')
    ) {
      return true
    }
  }

  return true
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
