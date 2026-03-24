import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { withRetry, RetryExhaustedError } from './retryEmail'

// Helper: função que falha N vezes e depois retorna successValue
function failNTimes(n: number, successValue = 'ok') {
  let calls = 0
  return vi.fn(async () => {
    calls++
    if (calls <= n) {
      throw Object.assign(new Error('Resend 429'), { statusCode: 429 })
    }
    return successValue
  })
}

describe('withRetry', () => {
  it('retorna resultado na primeira tentativa se sucesso', async () => {
    const fn = vi.fn(async () => 'sucesso')
    const result = await withRetry(fn, { maxAttempts: 3, delays: [0, 0, 0] })
    expect(result).toBe('sucesso')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('tenta novamente após falha 429 e sucede na segunda tentativa', async () => {
    const fn = failNTimes(1, 'sucesso')
    const result = await withRetry(fn, { maxAttempts: 3, delays: [0, 0, 0] })
    expect(result).toBe('sucesso')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('lança RetryExhaustedError após 3 falhas com 429', async () => {
    const fn = failNTimes(10)
    await expect(
      withRetry(fn, { maxAttempts: 3, delays: [0, 0, 0] })
    ).rejects.toThrow(RetryExhaustedError)
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('aguarda delays corretos entre tentativas', async () => {
    vi.useFakeTimers()
    try {
      const fn = failNTimes(2, 'ok')
      const delays = [1000, 4000, 16000]
      const promise = withRetry(fn, { maxAttempts: 3, delays })
      await vi.advanceTimersByTimeAsync(1000)
      await vi.advanceTimersByTimeAsync(4000)
      const result = await promise
      expect(result).toBe('ok')
      expect(fn).toHaveBeenCalledTimes(3)
    } finally {
      vi.useRealTimers()
    }
  })

  it('não retenta para erros 400 (não-retryable) — falha imediata', async () => {
    const fn = vi.fn(async () => {
      throw Object.assign(new Error('Bad Request'), { statusCode: 400 })
    })
    await expect(
      withRetry(fn, { maxAttempts: 3, delays: [0, 0, 0] })
    ).rejects.toThrow(RetryExhaustedError)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('RetryExhaustedError contém número de tentativas', async () => {
    const fn = failNTimes(10)
    await expect(
      withRetry(fn, { maxAttempts: 3, delays: [0, 0, 0] })
    ).rejects.toMatchObject({ attempts: 3 })
  })
})

describe('PII guard no log (SEC-008)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('não loga email address durante retry', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const fn = failNTimes(1, 'ok')

    const promise = withRetry(fn, { maxAttempts: 3, delays: [0, 0, 0] })
    await vi.runAllTimersAsync()
    await promise

    // Verificar que nenhuma chamada de log contém padrão de email
    consoleSpy.mock.calls.forEach(([msg]) => {
      const logStr = typeof msg === 'string' ? msg : JSON.stringify(msg)
      expect(logStr).not.toMatch(
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
      )
    })

    consoleSpy.mockRestore()
  })
})
