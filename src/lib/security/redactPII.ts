import { maskEmail, maskPhone, maskIp } from './pii'

const PII_KEYS = new Set([
  'email',
  'user_email',
  'userEmail',
  'mail',
  'phone',
  'user_phone',
  'userPhone',
  'telefone',
  'whatsapp',
  'ip',
  'ip_address',
  'ipAddress',
  'x-forwarded-for',
  'x-real-ip',
])

const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g
const PHONE_RE = /\+?\d[\d\s().-]{8,}\d/g

function redactString(value: string): string {
  return value
    .replace(EMAIL_RE, (m) => maskEmail(m))
    .replace(PHONE_RE, (m) => maskPhone(m))
}

export function redactPII<T>(input: T, depth = 0): T {
  if (depth > 6 || input == null) return input
  if (typeof input === 'string') return redactString(input) as unknown as T
  if (Array.isArray(input)) {
    return input.map((item) => redactPII(item, depth + 1)) as unknown as T
  }
  if (typeof input === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, raw] of Object.entries(input as Record<string, unknown>)) {
      if (PII_KEYS.has(key.toLowerCase()) && typeof raw === 'string') {
        if (key.toLowerCase().includes('email') || key.toLowerCase() === 'mail') {
          out[key] = maskEmail(raw)
        } else if (key.toLowerCase().includes('phone') || key.toLowerCase() === 'telefone' || key.toLowerCase() === 'whatsapp') {
          out[key] = maskPhone(raw)
        } else if (key.toLowerCase().includes('ip')) {
          out[key] = maskIp(raw)
        } else {
          out[key] = '***'
        }
        continue
      }
      out[key] = redactPII(raw, depth + 1)
    }
    return out as unknown as T
  }
  return input
}
