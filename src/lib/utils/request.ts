import type { ApiResponse, ApiErrorResponse } from '@/lib/types'

/**
 * Gera ID unico de request no formato `req_{timestamp_base36}_{random_4chars}`.
 */
export function createRequestId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 6)
  return `req_${timestamp}_${random}`
}

/**
 * Cria timestamp ISO-8601 do momento atual.
 */
export function createTimestamp(): string {
  return new Date().toISOString()
}

/**
 * Cria resposta padrao de sucesso da API.
 */
export function createApiResponse<T>(
  data: T,
  meta?: Record<string, unknown>
): ApiResponse<T> {
  const base: ApiResponse<T> = {
    data,
    requestId: createRequestId(),
    timestamp: createTimestamp(),
  }
  if (meta) base.meta = meta
  return base
}

/**
 * Cria resposta padrao de erro da API.
 * `details` sera `null` quando nao informado (nunca `undefined`).
 */
export function createApiError(
  error: string,
  message: string,
  details?: string | null
): ApiErrorResponse {
  return {
    error: {
      code: error,
      message,
      details: details ?? null,
    },
  }
}
