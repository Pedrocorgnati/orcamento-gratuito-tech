import * as Sentry from '@sentry/nextjs'
import { redactPII } from '@/lib/security/redactPII'

/**
 * Captura excecao via Sentry aplicando redacao de PII no contexto.
 * Seguro para chamar em ambiente sem SENTRY_DSN configurado (no-op silencioso).
 */
export function reportError(err: unknown, context?: Record<string, unknown>): void {
  try {
    Sentry.captureException(err, {
      extra: context ? redactPII(context) : undefined,
    })
  } catch {
    // Nunca propagar falha do reporter
    if (process.env.NODE_ENV === 'development') {
      console.error('[reportError]', err)
    }
  }
}

// Constantes de erro padronizadas — sincronizadas com ERROR-CATALOG.md e openapi.yaml

export const ERROR_CODES = {
  // Sessions (códigos canônicos ERROR-CATALOG)
  SESSION_020: 'SESSION_020',   // locale inválido
  SESSION_021: 'SESSION_021',   // currency inválida
  SESSION_080: 'SESSION_080',   // sessão não encontrada
  SESSION_081: 'SESSION_081',   // sessão expirada

  // Leads (códigos canônicos ERROR-CATALOG)
  LEAD_050: 'LEAD_050',         // sessão incompleta
  LEAD_051: 'LEAD_051',         // consentimento não fornecido
  LEAD_080: 'LEAD_080',         // lead não encontrado
  LEAD_081: 'LEAD_081',         // lead duplicado (sessão já enviou)

  // Auth
  AUTH_001: 'AUTH_001',         // sessão admin inválida / não autenticado
  AUTH_002: 'AUTH_002',         // autenticado mas sem permissão (não é ADMIN_EMAIL)

  // Validation
  VAL_001: 'VAL_001',           // campo obrigatório ausente
  VAL_002: 'VAL_002',           // formato inválido
  VAL_003: 'VAL_003',           // valor fora do range
  VAL_004: 'VAL_004',           // tamanho inválido

  // System
  SYS_001: 'SYS_001',           // erro interno
  SYS_002: 'SYS_002',           // serviço externo indisponível
  SYS_003: 'SYS_003',           // timeout

  // Rate Limiting
  RATE_001: 'RATE_001',         // rate limit global
  RATE_002: 'RATE_002',         // rate limit auth

  // Estimation
  ESTIMATE_050: 'ESTIMATE_050', // project_type ausente na sessão
  ESTIMATE_051: 'ESTIMATE_051', // PricingConfig não encontrada
  ESTIMATE_052: 'ESTIMATE_052', // ExchangeRate indisponível (fallback BRL)

  // Notify
  NOTIFY_050: 'NOTIFY_050',     // falha ao enviar notificação

  // ── Aliases legados (mantidos para não quebrar código existente) ──────────
  /** @deprecated Use SESSION_080 */
  SESSION_NOT_FOUND: 'SESSION_080',
  /** @deprecated Use SESSION_081 */
  SESSION_EXPIRED: 'SESSION_081',
  /** @deprecated Use LEAD_050 */
  SESSION_NOT_COMPLETE: 'LEAD_050',
  /** @deprecated Use LEAD_081 */
  LEAD_ALREADY_EXISTS: 'LEAD_081',
  /** @deprecated Use LEAD_051 */
  CONSENT_REQUIRED: 'LEAD_051',
  /** @deprecated Use AUTH_001 */
  UNAUTHORIZED: 'AUTH_001',
  /** @deprecated Use SYS_001 */
  INTERNAL_ERROR: 'SYS_001',
  /** @deprecated Use RATE_001 */
  RATE_LIMITED: 'RATE_001',

  // Outros ainda sem código canônico definido
  FORBIDDEN: 'FORBIDDEN',
  VALIDATION_FAILED: 'VAL_002',
  NOT_FOUND: 'SESSION_080',
  CONFLICT: 'LEAD_081',
} as const

/** Mapa canônico de constantes — use este em código novo */
export const ErrorCodes = ERROR_CODES

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
