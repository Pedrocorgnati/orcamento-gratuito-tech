/**
 * Utilitário de logging estruturado com proteção de PII.
 *
 * SEC-008: Nenhum campo PII deve aparecer em logs.
 * Campos PII bloqueados: email, phone, name, company, ip,
 *                        scope_story, password, token, secret, key
 *
 * Formato de saída: JSON para fácil ingestão por ferramentas de observabilidade
 * (Vercel Logs, Datadog, etc.)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

// Campos que nunca devem aparecer em logs
const PII_FIELDS = new Set([
  'email',
  'phone',
  'name',
  'first_name',
  'last_name',
  'company',
  'ip',
  'ip_address',
  'user_ip',
  'scope_story',
  'password',
  'token',
  'secret',
  'key',
  'api_key',
  'access_token',
  'refresh_token',
  'authorization',
])

// Substitui valores de campos PII por placeholder
function sanitizePII(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase()
    if (PII_FIELDS.has(lowerKey)) {
      sanitized[key] = '[REDACTED]'
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // Recursivo para objetos aninhados
      sanitized[key] = sanitizePII(value as Record<string, unknown>)
    } else {
      sanitized[key] = value
    }
  }
  return sanitized
}

// Gera um requestId simples para correlação de logs
function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 10)
}

let _requestId: string | null = null

export function setRequestId(id: string) {
  _requestId = id
}

/**
 * Função principal de logging.
 *
 * @param level - Nível do log
 * @param event - Identificador do evento (ex: 'cleanup_sessions', 'lead_created')
 * @param data - Dados adicionais (serão sanitizados de PII)
 *
 * @example
 * log('info', 'lead_created', { session_id: 'abc', score: 'A', project_type: 'saas' })
 * // Gera: {"level":"info","event":"lead_created","session_id":"abc","score":"A",...}
 */
export function log(
  level: LogLevel,
  event: string,
  data: Record<string, unknown> = {}
): void {
  const sanitizedData = sanitizePII(data)

  const entry = JSON.stringify({
    level,
    event,
    timestamp: new Date().toISOString(),
    request_id: _requestId ?? generateRequestId(),
    environment: process.env.NODE_ENV ?? 'development',
    ...sanitizedData,
  })

  switch (level) {
    case 'debug':
      console.debug(entry)
      break
    case 'info':
      console.log(entry)
      break
    case 'warn':
      console.warn(entry)
      break
    case 'error':
      console.error(entry)
      break
  }
}

// Shortcuts
export const logger = {
  debug: (event: string, data?: Record<string, unknown>) => log('debug', event, data),
  info: (event: string, data?: Record<string, unknown>) => log('info', event, data),
  warn: (event: string, data?: Record<string, unknown>) => log('warn', event, data),
  error: (event: string, data?: Record<string, unknown>) => log('error', event, data),
}
