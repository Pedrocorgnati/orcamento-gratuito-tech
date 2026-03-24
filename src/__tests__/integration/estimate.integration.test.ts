/**
 * Testes de integracao: GET /api/v1/sessions/[id]/estimate
 *
 * Cobre:
 * - Cenario 1 (Happy Path): estimativa completa com banco real
 * - Cenario 2 (Validacao): sessao nao concluida → SESSION_NOT_COMPLETE
 * - Cenario 3 (Autenticacao/IDOR): sem cookie, cookie errado
 * - Cenario 4 (Seguranca): IDOR guard — nunca revelar sessao alheia
 *
 * DB: real (nao mockado) — testa calculo com PricingConfig e ExchangeRate reais
 * Mocks: next/headers (cookies)
 *
 * NOTA: ensurePricingConfig() e ensureExchangeRate() garantem dados minimos.
 * Se o banco ja tiver dados de seed (db:seed), estes upserts serao no-ops.
 */

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { getRequest } from './helpers/request'
import {
  createTestSession,
  createCompletedSession,
  createExpiredSession,
  ensurePricingConfig,
  ensureExchangeRate,
} from './helpers/db'
import { ProjectType } from '@/lib/enums'

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

import { cookies } from 'next/headers'
import { GET } from '@/app/api/v1/sessions/[id]/estimate/route'

// ─────────────────────────────────────────────────────────────────────────────
// Dados de referencia minimos
// ─────────────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  await ensurePricingConfig(ProjectType.WEB_APP)
  await ensureExchangeRate('BRL', 'BRL', 1.0)
  await ensureExchangeRate('BRL', 'USD', 0.19)
  await ensureExchangeRate('BRL', 'EUR', 0.17)
})

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function mockCookie(sessionId: string | undefined) {
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) =>
      name === 'session_id' && sessionId ? { value: sessionId } : undefined,
  } as ReturnType<typeof cookies> extends Promise<infer T> ? T : never)
}

// ─────────────────────────────────────────────────────────────────────────────
// Testes
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/v1/sessions/[id]/estimate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('[C1] retorna 200 com EstimationResult para sessao COMPLETED com PricingConfig no banco', async () => {
    const session = await createCompletedSession({
      project_type: ProjectType.WEB_APP,
      accumulated_price: 3000,
      accumulated_time: 15,
      accumulated_complexity: 30,
    })
    mockCookie(session.id)

    const req = getRequest(`/api/v1/sessions/${session.id}/estimate`, session.id)
    const res = await GET(req, { params: Promise.resolve({ id: session.id }) })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.price_min).toBeDefined()
    expect(body.price_max).toBeDefined()
    expect(body.price_min).toBeLessThan(body.price_max)
    expect(body.days_min).toBeLessThan(body.days_max)
    expect(body.complexity).toBeDefined()
    expect(body.project_type).toBe(ProjectType.WEB_APP)
    expect(body.scope_story).toBeTruthy()
  })

  it('[C2] retorna 409 quando sessao esta em IN_PROGRESS', async () => {
    const session = await createTestSession()
    mockCookie(session.id)

    const req = getRequest(`/api/v1/sessions/${session.id}/estimate`, session.id)
    const res = await GET(req, { params: Promise.resolve({ id: session.id }) })

    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error.code).toBe('SESSION_NOT_COMPLETE')
  })

  it('[C2] retorna 404 para sessao inexistente', async () => {
    const fakeId = 'session-inexistente-est'
    mockCookie(fakeId)

    const req = getRequest(`/api/v1/sessions/${fakeId}/estimate`, fakeId)
    const res = await GET(req, { params: Promise.resolve({ id: fakeId }) })

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error.code).toBe('SESSION_NOT_FOUND')
  })

  it('[C2] retorna 410 para sessao expirada', async () => {
    const session = await createExpiredSession()
    mockCookie(session.id)

    const req = getRequest(`/api/v1/sessions/${session.id}/estimate`, session.id)
    const res = await GET(req, { params: Promise.resolve({ id: session.id }) })

    expect(res.status).toBe(410)
    const body = await res.json()
    expect(body.error.code).toBe('SESSION_EXPIRED')
  })

  it('[C3] retorna 401 sem cookie session_id', async () => {
    const session = await createCompletedSession()
    mockCookie(undefined)

    const req = getRequest(`/api/v1/sessions/${session.id}/estimate`)
    const res = await GET(req, { params: Promise.resolve({ id: session.id }) })

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error.code).toBe('UNAUTHORIZED')
  })

  it('[C4] retorna 403 quando cookie diverge do path (IDOR guard)', async () => {
    const session = await createCompletedSession()
    mockCookie('outro-session-id')

    const req = getRequest(`/api/v1/sessions/${session.id}/estimate`, 'outro-session-id')
    const res = await GET(req, { params: Promise.resolve({ id: session.id }) })

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error.code).toBe('FORBIDDEN')
  })

  it('[C2] retorna 422 ESTIMATE_050 quando project_type e null na sessao', async () => {
    const session = await createCompletedSession({
      project_type: null,
    })
    mockCookie(session.id)

    const req = getRequest(`/api/v1/sessions/${session.id}/estimate`, session.id)
    const res = await GET(req, { params: Promise.resolve({ id: session.id }) })

    // Sessao sem project_type → ESTIMATE_050
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.error.code).toBe('ESTIMATE_050')
  })
})
