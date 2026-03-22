// Constantes de erro padronizadas — sincronizadas com ERROR-CATALOG.md e openapi.yaml

export const ERROR_CODES = {
  // Sessions
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  SESSION_NOT_COMPLETE: 'SESSION_NOT_COMPLETE',

  // Leads
  LEAD_ALREADY_EXISTS: 'LEAD_ALREADY_EXISTS',
  CONSENT_REQUIRED: 'CONSENT_REQUIRED',

  // Auth
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',

  // Validation
  VALIDATION_FAILED: 'VALIDATION_FAILED',

  // General
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

export function buildError(
  code: ErrorCode,
  message: string,
  details?: string | null
) {
  return {
    error: {
      code,
      message,
      details: details ?? null,
    },
  }
}
