import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  detectLocale,
  checkRateLimit,
  getRateLimit,
  rateLimitStore,
  RATE_LIMIT_WINDOW_MS,
} from '@/lib/middleware-helpers'

// ---------------------------------------------------------------------------
// detectLocale
// ---------------------------------------------------------------------------

describe('detectLocale', () => {
  const supportedLocales = ['pt-BR', 'en-US', 'es-ES', 'it-IT'] as const
  const defaultLocale = 'pt-BR'

  it('retorna locale do cookie NEXT_LOCALE quando valido', () => {
    const result = detectLocale('en-US', null, supportedLocales, defaultLocale)
    expect(result).toBe('en-US')
  })

  it('ignora cookie com locale invalido (zh-CN) e usa Accept-Language', () => {
    const result = detectLocale(
      'zh-CN',
      'es-ES;q=0.9, en-US;q=1.0',
      supportedLocales,
      defaultLocale,
    )
    expect(result).toBe('en-US')
  })

  it('parseia Accept-Language com quality values corretamente', () => {
    const result = detectLocale(
      undefined,
      'es-ES;q=0.9, en-US;q=1.0',
      supportedLocales,
      defaultLocale,
    )
    // en-US tem q=1.0, es-ES tem q=0.9 -> en-US primeiro
    expect(result).toBe('en-US')
  })

  it('faz match parcial (pt -> pt-BR)', () => {
    const result = detectLocale(
      undefined,
      'pt;q=1.0',
      supportedLocales,
      defaultLocale,
    )
    expect(result).toBe('pt-BR')
  })

  it('retorna pt-BR como fallback quando nenhum match', () => {
    const result = detectLocale(
      undefined,
      'zh-CN;q=1.0, ja-JP;q=0.9',
      supportedLocales,
      defaultLocale,
    )
    expect(result).toBe('pt-BR')
  })

  it('retorna fallback quando cookie e Accept-Language sao undefined/null', () => {
    const result = detectLocale(undefined, null, supportedLocales, defaultLocale)
    expect(result).toBe('pt-BR')
  })

  it('prioriza cookie sobre Accept-Language', () => {
    const result = detectLocale(
      'it-IT',
      'en-US;q=1.0',
      supportedLocales,
      defaultLocale,
    )
    expect(result).toBe('it-IT')
  })
})

// ---------------------------------------------------------------------------
// getRateLimit
// ---------------------------------------------------------------------------

describe('getRateLimit', () => {
  it('retorna 10 para /api/v1/admin/*', () => {
    expect(getRateLimit('/api/v1/admin/users')).toBe(10)
  })

  it('retorna 10 para /api/auth/*', () => {
    expect(getRateLimit('/api/auth/login')).toBe(10)
  })

  it('retorna 50 para /api/v1/* geral', () => {
    expect(getRateLimit('/api/v1/leads/list')).toBe(10) // /api/v1/leads = leads limit
    expect(getRateLimit('/api/v1/projects')).toBe(50)
  })

  it('retorna 10 para /[locale]/admin', () => {
    expect(getRateLimit('/pt-BR/admin')).toBe(10)
    expect(getRateLimit('/en-US/admin/dashboard')).toBe(10)
  })

  it('retorna 10 para /auth/callback', () => {
    expect(getRateLimit('/pt-BR/auth/callback')).toBe(10)
  })

  it('retorna 0 para rotas normais', () => {
    expect(getRateLimit('/pt-BR/about')).toBe(0)
    expect(getRateLimit('/en-US/contact')).toBe(0)
  })

  it('retorna 10 para /api/v1/leads', () => {
    expect(getRateLimit('/api/v1/leads')).toBe(10)
  })
})

// ---------------------------------------------------------------------------
// checkRateLimit
// ---------------------------------------------------------------------------

describe('checkRateLimit', () => {
  beforeEach(() => {
    rateLimitStore.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('permite requisicoes dentro do limite', () => {
    // /api/auth/* tem limite de 10
    for (let i = 0; i < 10; i++) {
      expect(checkRateLimit('1.2.3.4', '/api/auth/login')).toBe(true)
    }
  })

  it('bloqueia na requisicao N+1 (limit excedido)', () => {
    // Primeiro, preencher ate o limite (10)
    for (let i = 0; i < 10; i++) {
      checkRateLimit('1.2.3.4', '/api/auth/login')
    }
    // A 11a requisicao deve ser bloqueada
    expect(checkRateLimit('1.2.3.4', '/api/auth/login')).toBe(false)
  })

  it('reseta apos window expirar', () => {
    // Preencher ate o limite
    for (let i = 0; i < 10; i++) {
      checkRateLimit('1.2.3.4', '/api/auth/login')
    }
    // Bloqueado agora
    expect(checkRateLimit('1.2.3.4', '/api/auth/login')).toBe(false)

    // Avancar o tempo alem da janela
    vi.advanceTimersByTime(RATE_LIMIT_WINDOW_MS + 1)

    // Deve permitir novamente
    expect(checkRateLimit('1.2.3.4', '/api/auth/login')).toBe(true)
  })

  it('permite sem rate limit para rotas normais (limit=0)', () => {
    // Rotas normais retornam limit 0 = sem rate limit
    for (let i = 0; i < 100; i++) {
      expect(checkRateLimit('1.2.3.4', '/pt-BR/about')).toBe(true)
    }
  })

  it('isola rate limit por IP', () => {
    // IP 1 esgota o limite
    for (let i = 0; i < 10; i++) {
      checkRateLimit('1.1.1.1', '/api/auth/login')
    }
    expect(checkRateLimit('1.1.1.1', '/api/auth/login')).toBe(false)

    // IP 2 ainda pode acessar
    expect(checkRateLimit('2.2.2.2', '/api/auth/login')).toBe(true)
  })
})
