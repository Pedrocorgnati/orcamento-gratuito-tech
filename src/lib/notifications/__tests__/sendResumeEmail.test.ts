import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SessionStatus } from '@/lib/enums'

// Mock Resend
const mockSend = vi.fn()
vi.mock('@/lib/resend/client', () => ({
  resendClient: {
    emails: { send: (...args: unknown[]) => mockSend(...args) },
  },
}))

// Mock Prisma
const mockFindUnique = vi.fn()
const mockUpdate = vi.fn().mockResolvedValue({})
vi.mock('@/lib/prisma', () => ({
  prisma: {
    session: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}))

// Mock env
vi.mock('@/lib/env', () => ({
  env: () => ({
    RESEND_API_KEY: 're_test',
    RESEND_FROM_EMAIL: 'noreply@budgetfree.tech',
    ADMIN_EMAIL: 'admin@budgetfree.tech',
    NEXT_PUBLIC_APP_URL: 'https://budgetfree.tech',
    CRON_SECRET: 'test-cron-secret-16chars',
  }),
}))

// Mock logger — silencia saida e evita require cycle
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

import { sendResumeEmail } from '@/lib/notifications/sendResumeEmail'

beforeEach(() => {
  vi.clearAllMocks()
})

function fakeSession(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sess-1',
    status: SessionStatus.IN_PROGRESS,
    locale: 'pt-BR',
    progress_percentage: 42,
    intermediate_email: 'user@example.com',
    resume_email_sent_at: null,
    expires_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    ...overrides,
  }
}

describe('sendResumeEmail', () => {
  it('marks resume_email_sent_at on success', async () => {
    mockFindUnique.mockResolvedValue(fakeSession())
    mockSend.mockResolvedValue({ id: 'email-abc' })

    const result = await sendResumeEmail({ sessionId: 'sess-1' })

    expect(result.status).toBe('SENT')
    expect(mockSend).toHaveBeenCalledTimes(1)
    const callArgs = mockSend.mock.calls[0][0]
    expect(callArgs.to).toEqual(['user@example.com'])
    expect(callArgs.subject).toMatch(/orcamento|progresso|progress|finalize/i)
    expect(callArgs.text).toContain('/resume/sess-1')
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'sess-1' },
        data: expect.objectContaining({ resume_email_sent_at: expect.any(Date) }),
      })
    )
  })

  it('skips when session not found', async () => {
    mockFindUnique.mockResolvedValue(null)
    const result = await sendResumeEmail({ sessionId: 'nope' })
    expect(result.status).toBe('SKIPPED')
    expect(result.reason).toBe('session_not_found')
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('skips when intermediate_email is null', async () => {
    mockFindUnique.mockResolvedValue(fakeSession({ intermediate_email: null }))
    const result = await sendResumeEmail({ sessionId: 'sess-1' })
    expect(result.status).toBe('SKIPPED')
    expect(result.reason).toBe('no_intermediate_email')
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('skips when already sent (idempotent)', async () => {
    mockFindUnique.mockResolvedValue(
      fakeSession({ resume_email_sent_at: new Date() })
    )
    const result = await sendResumeEmail({ sessionId: 'sess-1' })
    expect(result.status).toBe('SKIPPED')
    expect(result.reason).toBe('already_sent')
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('skips when session is completed', async () => {
    mockFindUnique.mockResolvedValue(
      fakeSession({ status: SessionStatus.COMPLETED })
    )
    const result = await sendResumeEmail({ sessionId: 'sess-1' })
    expect(result.status).toBe('SKIPPED')
    expect(result.reason).toBe('session_completed')
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('skips when session already expired', async () => {
    mockFindUnique.mockResolvedValue(
      fakeSession({ expires_at: new Date(Date.now() - 60_000) })
    )
    const result = await sendResumeEmail({ sessionId: 'sess-1' })
    expect(result.status).toBe('SKIPPED')
    expect(result.reason).toBe('session_expired')
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('returns FAILED and does not mark sent when retries exhausted', async () => {
    vi.useFakeTimers()
    try {
      mockFindUnique.mockResolvedValue(fakeSession())
      mockSend.mockRejectedValue(
        Object.assign(new Error('Resend 500'), { statusCode: 500 })
      )

      const promise = sendResumeEmail({ sessionId: 'sess-1' })
      // retryEmail usa delays [1000, 4000, 16000] — avancar timers para destravar
      await vi.advanceTimersByTimeAsync(1000)
      await vi.advanceTimersByTimeAsync(4000)
      await vi.advanceTimersByTimeAsync(16000)
      const result = await promise

      expect(result.status).toBe('FAILED')
      // nao deve atualizar resume_email_sent_at em falha (idempotencia negativa)
      const sentAtUpdates = mockUpdate.mock.calls.filter((c) =>
        'resume_email_sent_at' in (c[0] as { data: Record<string, unknown> }).data
      )
      expect(sentAtUpdates).toHaveLength(0)
    } finally {
      vi.useRealTimers()
    }
  })

  it.each(['pt-BR', 'en-US', 'es-ES', 'it-IT'])(
    'renders resume email CTA link for locale %s',
    async (locale) => {
      mockFindUnique.mockResolvedValue(fakeSession({ locale }))
      mockSend.mockResolvedValue({ id: 'x' })

      await sendResumeEmail({ sessionId: 'sess-1' })

      const callArgs = mockSend.mock.calls[0][0]
      expect(callArgs.text).toContain(`/${locale}/resume/sess-1`)
    }
  )
})
