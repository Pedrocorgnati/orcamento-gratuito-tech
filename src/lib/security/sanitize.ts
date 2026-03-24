/**
 * Sanitizacao de input — Node.js + browser agnostico (sem DOMParser).
 */

/** Remove tags HTML e atributos de evento */
function stripHtml(input: string): string {
  // Remove tags HTML completas
  let result = input.replace(/<[^>]*>/g, '')
  // Remove event attributes residuais (onerror, onclick, etc.)
  result = result.replace(/\bon\w+\s*=/gi, '')
  return result
}

/** Normaliza whitespace: trim + colapsa espacos multiplos */
function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, ' ').trim()
}

/**
 * Sanitiza input generico: remove HTML, event attrs, normaliza whitespace.
 */
export function sanitizeInput(input: string): string {
  if (!input) return ''
  return normalizeWhitespace(stripHtml(input))
}

/**
 * Sanitiza nome de pessoa: remove HTML, limita a letras/espacos/hifens/apostrofos.
 */
export function sanitizeName(input: string): string {
  if (!input) return ''
  const stripped = stripHtml(input)
  // Permite letras unicode, espacos, hifens, apostrofos e pontos
  const cleaned = stripped.replace(/[^\p{L}\p{M}\s'.'-]/gu, '')
  return normalizeWhitespace(cleaned)
}

/**
 * Sanitiza texto livre: remove HTML, preserva pontuacao comum, trunca em maxLength.
 */
export function sanitizeText(input: string, maxLength = 500): string {
  if (!input) return ''
  const sanitized = normalizeWhitespace(stripHtml(input))
  return sanitized.length > maxLength ? sanitized.slice(0, maxLength) : sanitized
}

/**
 * Normaliza email: trim, lowercase, remove espacos internos.
 */
export function normalizeEmail(email: string): string {
  if (!email) return ''
  return email.replace(/\s/g, '').toLowerCase().trim()
}

/**
 * Normaliza telefone: mantem apenas digitos e + inicial.
 */
export function normalizePhone(phone: string): string {
  if (!phone) return ''
  const trimmed = phone.trim()
  const hasPlus = trimmed.startsWith('+')
  const digits = trimmed.replace(/\D/g, '')
  return hasPlus ? `+${digits}` : digits
}
