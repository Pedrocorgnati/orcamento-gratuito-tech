import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EmailStatus, LeadScore, ComplexityLevel, Locale, Currency } from '@/lib/enums'
import type { Lead } from '@prisma/client'

// Mock Resend client — capturar argumentos de envio
const mockSend = vi.fn()
vi.mock('@/lib/resend/client', () => ({
  resendClient: {
    emails: {
      send: (...args: unknown[]) => mockSend(...args),
    },
  },
}))

// Mock Prisma — verificar updates de status
const mockUpdate = vi.fn().mockResolvedValue({})
vi.mock('@/lib/prisma', () => ({
  prisma: {
    lead: {
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}))

// Mock env
vi.mock('@/lib/env', () => ({
  env: () => ({
    RESEND_API_KEY: 're_test_key',
    RESEND_FROM_EMAIL: 'noreply@test.com',
    ADMIN_EMAIL: 'admin@test.com',
  }),
}))

const mockLead: Lead = {
  id: 'cuid-integration-test',
  session_id: 'session-integration',
  name: 'Integration Test User',
  email: 'user@integration.test',
  phone: '11999999999',
  company: 'Test Corp',
  score: LeadScore.A,
  score_budget: 35,
  score_timeline: 25,
  score_profile: 25,
  score_total: 85,
  project_type: 'WEB_APP',
  complexity: ComplexityLevel.HIGH,
  estimated_price_min: 15000,
  estimated_price_max: 20000,
  estimated_days_min: 45,
  estimated_days_max: 55,
  features: ['Auth', 'Dashboard'],
  scope_story: 'Test scope story.',
  locale: Locale.PT_BR,
  currency: Currency.BRL,
  consent_given: true,
  consent_version: '1.0',
  consent_at: new Date(),
  marketing_consent: false,
  honeypot_triggered: false,
  email_status: EmailStatus.PENDING,
  email_retry_count: 0,
  email_sent_at: null,
  last_failure_reason: null,
  dead_letter_at: null,
  anonymized_at: null,
  is_suspicious: false,
  suspicious_pattern: null,
  accuracy_feedback: null,
  pricing_version: 'v1',
  whatsapp: null,
  unsubscribe_token: 'unsubscribetoken0000000000',
  unsubscribed_at: null,
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
  utm_term: null,
  utm_content: null,
  referrer: null,
  consent_policy_version: '1.0.0',
  created_at: new Date(),
  updated_at: new Date(),
}

describe('sendLeadNotification integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('envia ambos os emails com sucesso e atualiza status para SENT', async () => {
    mockSend.mockResolvedValue({ id: 'email-id' })

    const { sendLeadNotification } = await import('./sendLeadNotification')
    await sendLeadNotification(mockLead)

    // Verificar que 2 emails foram enviados (owner + visitor)
    expect(mockSend).toHaveBeenCalledTimes(2)

    // Verificar update final do status
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'cuid-integration-test' },
        data: expect.objectContaining({
          email_status: EmailStatus.SENT,
        }),
      })
    )
  })

  it('Reply-To header presente em ambos os emails', async () => {
    mockSend.mockResolvedValue({ id: 'email-id' })

    const { sendLeadNotification } = await import('./sendLeadNotification')
    await sendLeadNotification(mockLead)

    // Ambas as chamadas devem ter replyTo
    mockSend.mock.calls.forEach((call) => {
      expect(call[0]).toHaveProperty('replyTo', 'admin@test.com')
    })
  })

  it('não lança exceção quando ambos os emails falham (fire-and-forget)', async () => {
    mockSend.mockRejectedValue(
      Object.assign(new Error('Service Unavailable'), { statusCode: 503 })
    )

    const { sendLeadNotification } = await import('./sendLeadNotification')

    // Deve NÃO lançar — fire-and-forget seguro
    await expect(sendLeadNotification(mockLead)).resolves.not.toThrow()

    // Status deve ser FAILED
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email_status: EmailStatus.FAILED,
        }),
      })
    )
  })

  it('PII guard — logs não contêm email ou phone patterns (SEC-008)', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    mockSend.mockResolvedValue({ id: 'email-id' })

    const { sendLeadNotification } = await import('./sendLeadNotification')
    await sendLeadNotification(mockLead)

    const allLogs = [
      ...logSpy.mock.calls,
      ...errorSpy.mock.calls,
      ...warnSpy.mock.calls,
    ]

    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
    const phonePattern = /\d{10,}/

    allLogs.forEach((args) => {
      const logStr = args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')
      // Permitir admin@test.com nos argumentos do Resend mock, mas não nos logs
      expect(logStr).not.toMatch(emailPattern)
      expect(logStr).not.toMatch(phonePattern)
    })

    logSpy.mockRestore()
    errorSpy.mockRestore()
    warnSpy.mockRestore()
  })
})
