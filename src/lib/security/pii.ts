/**
 * Mascaramento de dados sensiveis (PII) — para logs e exibicao parcial.
 */

/**
 * Mascara email: mostra primeiros 2 chars + dominio.
 * Ex: "pedro@example.com" → "pe***@example.com"
 */
export function maskEmail(email: string): string {
  if (!email) return ''
  const atIndex = email.indexOf('@')
  if (atIndex < 1) return '***'
  const visible = email.substring(0, Math.min(2, atIndex))
  const domain = email.substring(atIndex)
  return `${visible}***${domain}`
}

/**
 * Mascara telefone: mostra apenas ultimos 4 digitos.
 * Ex: "+5511999887766" → "****7766"
 */
export function maskPhone(phone: string): string {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.length <= 4) return '****'
  return `****${digits.slice(-4)}`
}

/**
 * Mascara IP: substitui ultimo octeto por ***.
 * Ex: "192.168.1.100" → "192.168.1.***"
 */
export function maskIp(ip: string): string {
  if (!ip) return ''
  const parts = ip.split('.')
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.***`
  }
  // IPv6 ou formato desconhecido — mascara metade
  if (ip.includes(':')) {
    const segments = ip.split(':')
    const half = Math.ceil(segments.length / 2)
    return segments.slice(0, half).join(':') + ':***'
  }
  return '***'
}

/**
 * Mascara nome: mostra apenas primeiro nome.
 * Ex: "Pedro Silva" → "Pedro"
 */
export function maskName(name: string): string {
  if (!name) return ''
  const parts = name.trim().split(/\s+/)
  return parts[0] ?? ''
}

/**
 * Instala interceptor de console que mascara PII em dev.
 * So ativa se `process.env.NODE_ENV === 'development'`.
 * Chame uma vez no entry point do app.
 */
export function installPiiLogGuard(): void {
  if (typeof process === 'undefined') return
  if (process.env.NODE_ENV !== 'development') return

  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
  const phoneRegex = /\+?\d{10,15}/g

  function mask(arg: unknown): unknown {
    if (typeof arg !== 'string') return arg
    return arg
      .replace(emailRegex, (match) => maskEmail(match))
      .replace(phoneRegex, (match) => maskPhone(match))
  }

  const originalLog = console.log
  const originalWarn = console.warn
  const originalError = console.error

  console.log = (...args: unknown[]) => originalLog(...args.map(mask))
  console.warn = (...args: unknown[]) => originalWarn(...args.map(mask))
  console.error = (...args: unknown[]) => originalError(...args.map(mask))
}
