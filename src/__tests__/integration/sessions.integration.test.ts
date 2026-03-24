/**
 * Testes de integracao: POST /api/v1/sessions | GET /api/v1/sessions/[id]
 *
 * Cobre:
 * - Cenario 1 (Happy Path): criacao e leitura com banco real
 * - Cenario 2 (Validacao): locale invalido → SESSION_020
 * - Cenario 3 (Autenticacao/IDOR): GET sem cookie, cookie errado
 * - Cenario 4 (Seguranca): IDOR — nunca revelar sessao de outro usuario
 *
 * DB: real (nao mockado)
 * Mocks: next/headers (cookies) para GET /sessions/[id]
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SessionStatus } from '@/lib/enums'
import { postRequest, getRequest } from './helpers/request'
import { createTestSession, createExpiredSession } from './helpers/db'

// Mock next/headers — cookies nao existem fora do Next.js runtime
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

import { cookies } from 'next/headers'
import { POST } from '@/app/api/v1/sessions/route'
import { GET } from '@/app/api/v1/sessions/[id]/route'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de cookie mock
// ─────────────────────────────────────────────────────────────────────────────

function mockCookieSessionId(sessionId: string | undefined) {
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) =>
      name === 'session_id' && sessionId ? { value: sessionId } : undefined,
  } as ReturnType<typeof cookies> extends Promise<infer T> ? T : never)
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/sessions
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/v1/sessions', () => {
  it('[C1] cria sessao com locale pt-BR e retorna 201 com id e current_question_id', async () => {
    const req = postRequest('/api/v1/sessions', { locale: 'pt-BR' })
    const res = await POST(req)

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBeTruthy()
    expect(body.status).toBeDefined()
    expect(body.current_question_id).toBeDefined()
    expect(body.expires_at).toBeDefined()

    // Verificar que sessao foi persistida no banco
    const dbSession = await prisma.session.findUnique({ where: { id: body.id } })
    expect(dbSession).not.toBeNull()
    expect(dbSession!.status).toBe(SessionStatus.IN_PROGRESS)
  })

  it('[C1] cria sessao sem body (locale default pt-BR)', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/sessions', {
      method: 'POST',
    })
    const res = await POST(req)

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBeTruthy()
  })

  it('[C1] define cookie session_id na resposta', async () => {
    const req = postRequest('/api/v1/sessions', { locale: 'en-US' })
    const res = await POST(req)

    expect(res.status).toBe(201)
    // Cookie deve estar presente na resposta
    const setCookieHeader = res.headers.get('set-cookie')
    expect(setCookieHeader).toContain('session_id=')
  })

  it('[C2] retorna 422 para locale invalido (SESSION_020)', async () => {
    const req = postRequest('/api/v1/sessions', { locale: 'xx-XX' })
    const res = await POST(req)

    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.error.code).toBe('VALIDATION_FAILED')
  })

  it('[C1] cria sessoes independentes — IDs distintos por requisicao', async () => {
    const res1 = await POST(postRequest('/api/v1/sessions', { locale: 'pt-BR' }))
    const res2 = await POST(postRequest('/api/v1/sessions', { locale: 'pt-BR' }))

    const body1 = await res1.json()
    const body2 = await res2.json()
    expect(body1.id).not.toBe(body2.id)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/sessions/[id]
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/v1/sessions/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('[C1] retorna 200 com dados da sessao quando cookie coincide com path param', async () => {
    const session = await createTestSession()
    mockCookieSessionId(session.id)

    const req = getRequest(`/api/v1/sessions/${session.id}`, session.id)
    const res = await GET(req, { params: Promise.resolve({ id: session.id }) })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe(session.id)
  })

  it('[C3] retorna 403 quando cookie session_id esta ausente', async () => {
    const session = await createTestSession()
    mockCookieSessionId(undefined)

    const req = getRequest(`/api/v1/sessions/${session.id}`)
    const res = await GET(req, { params: Promise.resolve({ id: session.id }) })

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error.code).toBe('FORBIDDEN')
  })

  it('[C4] retorna 403 (nunca 404) quando cookie diverge do path (IDOR guard)', async () => {
    const session = await createTestSession()
    mockCookieSessionId('outro-session-id')

    const req = getRequest(`/api/v1/sessions/${session.id}`, 'outro-session-id')
    const res = await GET(req, { params: Promise.resolve({ id: session.id }) })

    expect(res.status).toBe(403)
    const body = await res.json()
    // Nao revelar existencia do recurso — sempre FORBIDDEN
    expect(body.error.code).toBe('FORBIDDEN')
  })

  it('[C2] retorna 404 para sessao inexistente (cookie correto, id inexistente)', async () => {
    const fakeId = 'inexistente-session-id'
    mockCookieSessionId(fakeId)

    const req = getRequest(`/api/v1/sessions/${fakeId}`, fakeId)
    const res = await GET(req, { params: Promise.resolve({ id: fakeId }) })

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error.code).toBe('SESSION_NOT_FOUND')
  })

  it('[C2] retorna 410 para sessao expirada', async () => {
    const session = await createExpiredSession()
    mockCookieSessionId(session.id)

    const req = getRequest(`/api/v1/sessions/${session.id}`, session.id)
    const res = await GET(req, { params: Promise.resolve({ id: session.id }) })

    expect(res.status).toBe(410)
    const body = await res.json()
    expect(body.error.code).toBe('SESSION_EXPIRED')
  })

  it('[C4] SQL injection no path param nao afeta banco', async () => {
    const maliciousId = "'; DROP TABLE sessions; --"
    mockCookieSessionId(maliciousId)

    const req = getRequest(`/api/v1/sessions/${encodeURIComponent(maliciousId)}`, maliciousId)
    const res = await GET(req, { params: Promise.resolve({ id: maliciousId }) })

    // Deve retornar erro (403 ou 404), nunca 500 por injecao
    expect(res.status).toBeGreaterThanOrEqual(400)
    expect(res.status).toBeLessThan(500)

    // Tabela ainda existe
    const count = await prisma.session.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })
})
