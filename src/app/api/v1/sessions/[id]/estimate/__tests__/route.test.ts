// src/app/api/v1/sessions/[id]/estimate/__tests__/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { ComplexityLevel, Currency, Locale, ProjectType } from '@/lib/enums'

// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

vi.mock('@/services/session.service', () => ({
  sessionService: {
    findById: vi.fn(),
    isExpired: vi.fn().mockReturnValue(false),
  },
}))

vi.mock('@/services/estimation.service', () => ({
  estimationService: {
    calculate: vi.fn(),
    calculateWithFallbackBrl: vi.fn(),
  },
  EstimationError: class EstimationError extends Error {
    constructor(
      public code: 'ESTIMATE_050' | 'ESTIMATE_051' | 'ESTIMATE_052',
      message: string,
      public fallbackCurrency?: string
    ) {
      super(message)
      this.name = 'EstimationError'
    }
  },
}))

import { cookies } from 'next/headers'
import { sessionService } from '@/services/session.service'
import { estimationService, EstimationError } from '@/services/estimation.service'
import { GET } from '../route'

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const SESSION_ID = 'session-abc123'

const mockCompletedSession = {
  id:               SESSION_ID,
  status:           'COMPLETED',
  locale:           'pt_BR',
  currency:         'BRL',
  project_type:     'WEB_APP',
  expires_at:       new Date(Date.now() + 86400000),
  accumulated_price:      5000,
  accumulated_time:       20,
  accumulated_complexity: 25,
  questions_answered:     5,
  progress_percentage:    100,
  current_question_id:    null,
  path_taken:             [],
  created_at:             new Date(),
  updated_at:             new Date(),
}

const mockEstimationResult = {
  price_min:            12750,
  price_max:            17250,
  price_min_formatted:  'R$ 12.750',
  price_max_formatted:  'R$ 17.250',
  price_range_formatted: 'R$ 12.750 – R$ 17.250',
  days_min:             54,
  days_max:             88,
  days_range_formatted: '54 – 88 dias',
  currency:             Currency.BRL,
  locale:               Locale.PT_BR,
  complexity:           ComplexityLevel.MEDIUM,
  complexity_score:     25,
  features:             ['autenticação'],
  project_type:         ProjectType.WEB_APP,
  scope_story:          'Seu projeto é um Sistema Web...',
}

function buildRequest(cookieSessionId?: string): NextRequest {
  const headers: HeadersInit = cookieSessionId
    ? { cookie: `session_id=${cookieSessionId}` }
    : {}
  return new NextRequest(
    `http://localhost:3000/api/v1/sessions/${SESSION_ID}/estimate`,
    { headers }
  )
}

function mockCookies(sessionId?: string) {
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) =>
      name === 'session_id' && sessionId ? { value: sessionId } : undefined,
  } as any)
}

// ─────────────────────────────────────────────────────────────────────────────
// Testes
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/v1/sessions/[id]/estimate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCookies(SESSION_ID)
    vi.mocked(sessionService.findById).mockResolvedValue(mockCompletedSession as any)
    vi.mocked(sessionService.isExpired).mockReturnValue(false)
    vi.mocked(estimationService.calculate).mockResolvedValue(mockEstimationResult as any)
  })

  it('retorna 200 com EstimationResult para sessão COMPLETED', async () => {
    const res = await GET(buildRequest(SESSION_ID), { params: Promise.resolve({ id: SESSION_ID }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.price_min).toBeLessThan(body.price_max)
    expect(body.days_min).toBeLessThan(body.days_max)
  })

  it('retorna 401 quando cookie session_id ausente', async () => {
    mockCookies(undefined)
    const res = await GET(buildRequest(), { params: Promise.resolve({ id: SESSION_ID }) })
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error.code).toBe('AUTH_001') // RESOLVED: canonical code for UNAUTHORIZED
  })

  it('retorna 403 quando session_id do cookie diverge do path param (IDOR)', async () => {
    mockCookies('other-session-id')
    const res = await GET(buildRequest('other-session-id'), { params: Promise.resolve({ id: SESSION_ID }) })
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error.code).toBe('FORBIDDEN')
  })

  it('retorna 404 quando sessão não existe', async () => {
    vi.mocked(sessionService.findById).mockResolvedValue(null)
    const res = await GET(buildRequest(SESSION_ID), { params: Promise.resolve({ id: SESSION_ID }) })
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error.code).toBe('SESSION_080') // RESOLVED: canonical code for SESSION_NOT_FOUND
  })

  it('retorna 409 quando sessão não está COMPLETED', async () => {
    vi.mocked(sessionService.findById).mockResolvedValue({
      ...mockCompletedSession,
      status: 'IN_PROGRESS',
    } as any)
    const res = await GET(buildRequest(SESSION_ID), { params: Promise.resolve({ id: SESSION_ID }) })
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error.code).toBe('LEAD_050') // RESOLVED: canonical code for SESSION_NOT_COMPLETE
  })

  it('retorna 422 ESTIMATE_050 quando project_type ausente', async () => {
    vi.mocked(estimationService.calculate).mockRejectedValue(
      new EstimationError('ESTIMATE_050', 'project_type ausente')
    )
    const res = await GET(buildRequest(SESSION_ID), { params: Promise.resolve({ id: SESSION_ID }) })
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.error.code).toBe('ESTIMATE_050')
  })

  it('retorna 500 ESTIMATE_051 quando PricingConfig não encontrada', async () => {
    vi.mocked(estimationService.calculate).mockRejectedValue(
      new EstimationError('ESTIMATE_051', 'PricingConfig não encontrada')
    )
    const res = await GET(buildRequest(SESSION_ID), { params: Promise.resolve({ id: SESSION_ID }) })
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error.code).toBe('ESTIMATE_051')
  })

  it('retorna 503 ESTIMATE_052 com fallback BRL quando taxa de câmbio indisponível', async () => {
    vi.mocked(estimationService.calculate).mockRejectedValue(
      new EstimationError('ESTIMATE_052', 'taxa BRL→USD indisponível', Currency.BRL)
    )
    vi.mocked(estimationService.calculateWithFallbackBrl).mockResolvedValue({
      ...mockEstimationResult,
      currency: Currency.BRL,
    } as any)
    const res = await GET(buildRequest(SESSION_ID), { params: Promise.resolve({ id: SESSION_ID }) })
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.warning).toBe('ESTIMATE_052')
    expect(body.currency).toBe(Currency.BRL)
  })

  // ── Cenários adicionais (GAP-004) ──────────────────────────────────────────

  it('retorna 410 quando sessão está expirada', async () => {
    vi.mocked(sessionService.isExpired).mockReturnValue(true)
    const res = await GET(buildRequest(SESSION_ID), { params: Promise.resolve({ id: SESSION_ID }) })
    expect(res.status).toBe(410)
    const body = await res.json()
    expect(body.error.code).toBe('SESSION_081') // RESOLVED: canonical code for SESSION_EXPIRED
  })

  it('retorna 500 catch-all quando erro genérico (não EstimationError)', async () => {
    vi.mocked(estimationService.calculate).mockRejectedValue(
      new Error('unexpected')
    )
    const res = await GET(buildRequest(SESSION_ID), { params: Promise.resolve({ id: SESSION_ID }) })
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error.code).toBe('SYS_001') // RESOLVED: canonical code for INTERNAL_ERROR
  })

  it('retorna 500 quando ESTIMATE_052 e fallback BRL também falha', async () => {
    vi.mocked(estimationService.calculate).mockRejectedValue(
      new EstimationError('ESTIMATE_052', 'taxa BRL→USD indisponível', Currency.BRL)
    )
    vi.mocked(estimationService.calculateWithFallbackBrl).mockRejectedValue(
      new Error('fallback também falhou')
    )
    const res = await GET(buildRequest(SESSION_ID), { params: Promise.resolve({ id: SESSION_ID }) })
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error.code).toBe('ESTIMATE_051')
  })
})
