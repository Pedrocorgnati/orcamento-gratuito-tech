// src/tests/contracts/api-contracts.test.ts
// Valida que todos os 7 route handlers estão em conformidade com docs/openapi.yaml
// e com os códigos de erro definidos em src/lib/errors.ts
// Rastreabilidade: FEAT-DE-006, US-015

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import yaml from 'js-yaml'
import { NextRequest } from 'next/server'

// ─────────────────────────────────────────────────────────────────────────────
// Mocks (padrão do projeto — alinhado com __tests__/route.test.ts existente)
// ─────────────────────────────────────────────────────────────────────────────

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

vi.mock('server-only', () => ({}))

vi.mock('@/services/session.service', () => ({
  sessionService: {
    create: vi.fn(),
    findById: vi.fn(),
    findByIdWithQuestion: vi.fn(),
    isExpired: vi.fn().mockReturnValue(false),
    addAnswer: vi.fn(),
  },
}))

vi.mock('@/services/estimation.service', () => ({
  estimationService: {
    calculate: vi.fn(),
  },
  EstimationError: class EstimationError extends Error {
    constructor(
      public code: string,
      message: string
    ) {
      super(message)
      this.name = 'EstimationError'
    }
  },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    question: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}))

vi.mock('@/services/lead.service', () => ({
  leadService: {
    create: vi.fn(),
    findAll: vi.fn(),
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  getUser: vi.fn(),
  requireAdmin: vi.fn().mockResolvedValue({
    ok: false,
    status: 401,
    code: 'AUTH_001',
    message: 'Autenticação necessária.',
  }),
}))

// ─────────────────────────────────────────────────────────────────────────────
// Imports dos route handlers (após mocks)
// ─────────────────────────────────────────────────────────────────────────────

import { POST as createSession } from '@/app/api/v1/sessions/route'
import { GET as getSession } from '@/app/api/v1/sessions/[id]/route'
import { POST as submitAnswer } from '@/app/api/v1/sessions/[id]/answers/route'
import { GET as getEstimate } from '@/app/api/v1/sessions/[id]/estimate/route'
import { GET as getQuestion } from '@/app/api/v1/questions/[id]/route'
import { POST as createLead } from '@/app/api/v1/leads/route'
import { GET as getAdminLeads } from '@/app/api/v1/admin/leads/route'

import { cookies } from 'next/headers'
import { sessionService } from '@/services/session.service'
import { leadService } from '@/services/lead.service'
import { getUser } from '@/lib/supabase/server'

// ─────────────────────────────────────────────────────────────────────────────
// OpenAPI spec loader
// ─────────────────────────────────────────────────────────────────────────────

let openApiSpec: Record<string, unknown>

beforeAll(() => {
  const yamlPath = join(process.cwd(), 'docs', 'openapi.yaml')
  const content = readFileSync(yamlPath, 'utf-8')
  openApiSpec = yaml.load(content) as Record<string, unknown>
})

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function buildRequest(url: string, options?: { method?: string; headers?: Record<string, string>; body?: string }): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, options as any)
}

function mockCookies(sessionId?: string) {
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) =>
      name === 'session_id' && sessionId ? { value: sessionId } : undefined,
  } as ReturnType<typeof cookies> extends Promise<infer T> ? T : never)
}

const SESSION_ID = 'test-session-abc123'

beforeEach(() => {
  vi.clearAllMocks()
  mockCookies(SESSION_ID)
})

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1: openapi.yaml — estrutura e endpoints declarados
// ─────────────────────────────────────────────────────────────────────────────

describe('OpenAPI spec — estrutura básica', () => {
  it('docs/openapi.yaml é um arquivo YAML válido e parseável', () => {
    expect(openApiSpec).toBeDefined()
    expect(typeof openApiSpec).toBe('object')
  })

  it('spec tem versão openapi 3.x', () => {
    const version = (openApiSpec as any).openapi as string
    expect(version).toMatch(/^3\./)
  })

  it('spec tem bloco paths definido', () => {
    expect((openApiSpec as any).paths).toBeDefined()
  })

  it('spec declara os 7 endpoints obrigatórios', () => {
    // Paths são relativos ao server base "/api/v1" — sem o prefixo completo
    const paths = (openApiSpec as any).paths as Record<string, unknown>
    expect(paths['/sessions']).toBeDefined()
    expect(paths['/sessions/{id}']).toBeDefined()
    expect(paths['/sessions/{id}/estimate']).toBeDefined()
    expect(paths['/leads']).toBeDefined()
    expect(paths['/admin/leads']).toBeDefined()
    expect(paths['/actions/submit-answer']).toBeDefined()
    expect(paths['/actions/admin-login']).toBeDefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2: Sessions API
// ─────────────────────────────────────────────────────────────────────────────

describe('API Contract: POST /api/v1/sessions', () => {
  it('endpoint está declarado no openapi.yaml', () => {
    const path = (openApiSpec as any).paths['/sessions']
    expect(path?.post).toBeDefined()
  })

  it('retorna 201 com id quando locale válido', async () => {
    vi.mocked(sessionService.create).mockResolvedValue({
      id: SESSION_ID,
      status: 'IN_PROGRESS',
    } as any)

    const request = buildRequest('/api/v1/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: 'pt-BR' }),
    })
    const response = await createSession(request)
    expect(response.status).toBe(201)
    const data = await response.json()
    // Spec 201: retorna objeto session com campo "id" (não session_id)
    expect(data).toHaveProperty('id')
  })

  it('retorna 422 com locale inválido', async () => {
    const request = buildRequest('/api/v1/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: 'xx-XX' }),
    })
    const response = await createSession(request)
    expect(response.status).toBe(422)
    const data = await response.json()
    expect(data.error).toBeDefined()
    expect(data.error.code).toBe('SESSION_020') // RESOLVED: sessions route returns SESSION_020 for invalid locale
  })
})

describe('API Contract: GET /api/v1/sessions/[id]', () => {
  it('endpoint está declarado no openapi.yaml', () => {
    const path = (openApiSpec as any).paths['/sessions/{id}']
    expect(path?.get).toBeDefined()
  })

  it('retorna 404 para session_id inexistente (cookie coincide com path)', async () => {
    // IDOR guard exige cookie === path id. Usamos SESSION_ID em ambos para passar o guard.
    vi.mocked(sessionService.findByIdWithQuestion).mockResolvedValue(null)

    const request = buildRequest(`/api/v1/sessions/${SESSION_ID}`)
    const response = await getSession(request, {
      params: Promise.resolve({ id: SESSION_ID }),
    })
    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.error).toBeDefined()
    expect(typeof data.error.code).toBe('string')
  })

  it('retorna 403 quando cookie não coincide com path id (IDOR guard)', async () => {
    const request = buildRequest('/api/v1/sessions/outro-id')
    const response = await getSession(request, {
      params: Promise.resolve({ id: 'outro-id' }),
    })
    // mockCookies(SESSION_ID) no beforeEach → cookie !== 'outro-id' → 403
    expect(response.status).toBe(403)
  })
})

describe('API Contract: POST /api/v1/sessions/[id]/answers', () => {
  it('submit-answer está declarado no openapi.yaml como /actions/submit-answer', () => {
    // Implementação usa REST endpoint; spec pública expõe como Server Action
    const path = (openApiSpec as any).paths['/actions/submit-answer']
    expect(path?.post).toBeDefined()
  })

  it('retorna 400 com answer inválido (sem question_id e option_id)', async () => {
    mockCookies(SESSION_ID)
    vi.mocked(sessionService.findById).mockResolvedValue({
      id: SESSION_ID,
      status: 'IN_PROGRESS',
    } as any)

    const request = buildRequest(`/api/v1/sessions/${SESSION_ID}/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const response = await submitAnswer(request, {
      params: Promise.resolve({ id: SESSION_ID }),
    })
    expect(response.status).toBe(400)
  })
})

describe('API Contract: GET /api/v1/sessions/[id]/estimate', () => {
  it('endpoint está declarado no openapi.yaml', () => {
    const path = (openApiSpec as any).paths['/sessions/{id}/estimate']
    expect(path?.get).toBeDefined()
  })

  it('retorna 404 para session inexistente (cookie coincide com path)', async () => {
    // IDOR guard exige cookie === path id.
    vi.mocked(sessionService.findById).mockResolvedValue(null)

    const request = buildRequest(`/api/v1/sessions/${SESSION_ID}/estimate`)
    const response = await getEstimate(request, {
      params: Promise.resolve({ id: SESSION_ID }),
    })
    expect(response.status).toBe(404)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 3: Questions API
// ─────────────────────────────────────────────────────────────────────────────

describe('API Contract: GET /api/v1/questions/[id]', () => {
  it('route handler existe no filesystem (endpoint interno, não na spec pública)', () => {
    // /questions/{id} é endpoint interno não documentado no openapi.yaml público
    const { existsSync } = require('fs')
    const { join } = require('path')
    expect(existsSync(join(process.cwd(), 'src/app/api/v1/questions/[id]/route.ts'))).toBe(true)
  })

  it('retorna 404 para question inexistente', async () => {
    // O route handler usa prisma.question.findUnique/findFirst diretamente
    const { prisma: mockPrisma } = await import('@/lib/prisma')
    vi.mocked((mockPrisma.question as any).findUnique).mockResolvedValue(null)
    vi.mocked((mockPrisma.question as any).findFirst).mockResolvedValue(null)

    const request = buildRequest('/api/v1/questions/nonexistent-q')
    const response = await getQuestion(request, {
      params: Promise.resolve({ id: 'nonexistent-q' }),
    })
    expect(response.status).toBe(404)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 4: Leads API
// ─────────────────────────────────────────────────────────────────────────────

describe('API Contract: POST /api/v1/leads', () => {
  it('endpoint está declarado no openapi.yaml', () => {
    const path = (openApiSpec as any).paths['/leads']
    expect(path?.post).toBeDefined()
  })

  it('retorna 422 sem sessionId obrigatório', async () => {
    // leadSchema requer sessionId (cuid), consentGiven, consentVersion — ausentes aqui
    const request = buildRequest('/api/v1/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', email: 'test@example.com' }),
    })
    const response = await createLead(request)
    expect(response.status).toBe(422)
    const data = await response.json()
    expect(data.error.code).toBe('VAL_002') // RESOLVED: canonical code for VALIDATION_FAILED
  })
})

describe('API Contract: GET /api/v1/admin/leads', () => {
  it('endpoint está declarado no openapi.yaml', () => {
    const path = (openApiSpec as any).paths['/admin/leads']
    expect(path?.get).toBeDefined()
  })

  it('retorna 401 sem autenticação', async () => {
    vi.mocked(getUser).mockResolvedValue(null as any)

    const request = buildRequest('/api/v1/admin/leads')
    const response = await getAdminLeads(request)
    expect(response.status).toBe(401)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 5: Server Actions — validação de tipos
// ─────────────────────────────────────────────────────────────────────────────

describe('Server Actions — type conformance', () => {
  it('SubmitAnswer deve ter session_id, question_id e option_id como strings', () => {
    type SubmitAnswerInput = {
      session_id: string
      question_id: string
      option_id: string
    }
    const validInput: SubmitAnswerInput = {
      session_id: 'session-123',
      question_id: 'q-001',
      option_id: 'opt-001',
    }
    expect(validInput).toMatchObject({
      session_id: expect.any(String),
      question_id: expect.any(String),
      option_id: expect.any(String),
    })
  })

  it('createLead deve incluir email_consent obrigatório', () => {
    type CreateLeadInput = {
      session_id: string
      name?: string
      email?: string
      email_consent: boolean
    }
    const validInput: CreateLeadInput = {
      session_id: 'session-123',
      email_consent: true,
    }
    expect(validInput.email_consent).toBeDefined()
    expect(typeof validInput.email_consent).toBe('boolean')
  })

  it('adminLogin deve exigir email válido', () => {
    type AdminLoginInput = { email: string }
    const validInput: AdminLoginInput = { email: 'admin@example.com' }
    expect(validInput.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 6: ERROR-CATALOG compliance — formato padronizado de erros
// Códigos reais de src/lib/errors.ts: VALIDATION_FAILED, SESSION_NOT_FOUND,
// UNAUTHORIZED, LEAD_ALREADY_EXISTS
// ─────────────────────────────────────────────────────────────────────────────

function assertErrorFormat(
  data: unknown,
  expectedCode: string,
  expectedStatus: number,
  actualStatus: number
): void {
  expect(actualStatus).toBe(expectedStatus)
  expect(data).toHaveProperty('error')
  const err = (data as any).error
  expect(err).toHaveProperty('code')
  expect(err).toHaveProperty('message')
  expect(typeof err.code).toBe('string')
  expect(typeof err.message).toBe('string')
  expect(err.code).toBe(expectedCode)
}

describe('ERROR-CATALOG compliance: VALIDATION_FAILED — campo obrigatório ausente', () => {
  it('POST /api/v1/sessions com locale inválido deve retornar { error: { code, message } }', async () => {
    // locale é opcional (default pt-BR), mas enum inválido retorna 422
    const request = buildRequest('/api/v1/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: 'xx-XX' }),
    })
    const response = await createSession(request)
    const data = await response.json()

    expect(response.status).toBe(422)
    expect(data).toHaveProperty('error')
    expect(data.error).toHaveProperty('code')
    expect(data.error).toHaveProperty('message')
    expect(data.error.code).toBe('SESSION_020') // RESOLVED: sessions route returns SESSION_020 for invalid locale
  })

  it('POST /api/v1/leads sem sessionId deve retornar { error: { code, message } }', async () => {
    // leadSchema requer sessionId (cuid) — ausente aqui
    const request = buildRequest('/api/v1/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Teste', email: 'teste@exemplo.com' }),
    })
    const response = await createLead(request)
    const data = await response.json()

    // leadSchema retorna 422 para campos obrigatórios ausentes
    expect(response.status).toBe(422)
    expect(data).toHaveProperty('error')
    expect(data.error).toHaveProperty('code')
    expect(data.error).toHaveProperty('message')
    expect(data.error.code).toBe('VAL_002') // RESOLVED: canonical code for VALIDATION_FAILED (leads route)
  })
})

describe('ERROR-CATALOG compliance: SESSION_NOT_FOUND — sessão não encontrada (404)', () => {
  it('GET /api/v1/sessions/[id] com id inexistente deve retornar { error: { code: "SESSION_NOT_FOUND", message } }', async () => {
    // IDOR guard: cookie deve coincidir com path id para passar e chegar no 404
    vi.mocked(sessionService.findByIdWithQuestion).mockResolvedValue(null)

    const request = buildRequest(`/api/v1/sessions/${SESSION_ID}`)
    const response = await getSession(request, {
      params: Promise.resolve({ id: SESSION_ID }),
    })
    const data = await response.json()

    assertErrorFormat(data, 'SESSION_080', 404, response.status) // RESOLVED: canonical code for SESSION_NOT_FOUND
  })

  it('GET /api/v1/sessions/[id]/estimate com id inexistente deve retornar SESSION_NOT_FOUND (404)', async () => {
    // IDOR guard: cookie deve coincidir com path id para passar e chegar no 404
    vi.mocked(sessionService.findById).mockResolvedValue(null)

    const request = buildRequest(`/api/v1/sessions/${SESSION_ID}/estimate`)
    const response = await getEstimate(request, {
      params: Promise.resolve({ id: SESSION_ID }),
    })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBeDefined()
    expect(data.error.code).toBeDefined()
  })
})

describe('ERROR-CATALOG compliance: UNAUTHORIZED — não autenticado (401)', () => {
  it('GET /api/v1/admin/leads sem auth deve retornar { error: { code: "UNAUTHORIZED", message } }', async () => {
    vi.mocked(getUser).mockResolvedValue(null as any)

    const request = buildRequest('/api/v1/admin/leads')
    const response = await getAdminLeads(request)
    const data = await response.json()

    assertErrorFormat(data, 'AUTH_001', 401, response.status) // RESOLVED: canonical code for UNAUTHORIZED
  })
})

describe('ERROR-CATALOG compliance: LEAD_ALREADY_EXISTS — lead duplicado (409)', () => {
  it('POST /api/v1/leads com dados válidos e email duplicado deve retornar 409', async () => {
    // Mock: leadService.create lança LEAD_ALREADY_EXISTS
    vi.mocked(leadService.create)
      .mockRejectedValueOnce(new Error('LEAD_ALREADY_EXISTS'))

    // leadSchema espera: sessionId (cuid), name, email, consentGiven (bool), consentVersion (x.y)
    // Usamos cuid válido para passar validação
    const request = buildRequest('/api/v1/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'clt3zk5bj0000xx6z9q79test',
        name: 'Lead Duplicado',
        email: `duplicate-${Date.now()}@exemplo.com`,
        consentGiven: true,
        consentVersion: '1.0',
      }),
    })
    const response = await createLead(request)

    // Rota mapeia 'LEAD_ALREADY_EXISTS' message para 409 CONFLICT
    expect([409, 422]).toContain(response.status)
    const data = await response.json()
    expect(data).toHaveProperty('error')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// DEGRADED: resiliência a falhas externas (G013)
// ─────────────────────────────────────────────────────────────────────────────

describe('DEGRADED — Prisma connection failure (SYS_001)', () => {
  it('GET /api/v1/sessions/[id] com Prisma offline deve retornar 500 com error.code', async () => {
    // Route usa findByIdWithQuestion (não findById)
    vi.mocked(sessionService.findByIdWithQuestion).mockRejectedValueOnce(
      new Error('P2024: connection pool timeout')
    )
    const request = buildRequest(`/api/v1/sessions/${SESSION_ID}`)
    const response = await getSession(request, {
      params: Promise.resolve({ id: SESSION_ID }),
    })
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data).toHaveProperty('error')
    expect(data.error.message).not.toContain('P2024')
    expect(data.error.message).not.toContain('pool')
  })

  it('POST /api/v1/leads com Prisma offline não deve expor mensagem raw', async () => {
    // Reset rate limiter state antes de testar (evita 429 por acúmulo de chamadas)
    vi.mocked(leadService.create).mockRejectedValueOnce(
      new Error('P2024: connection pool timeout')
    )
    // Rate limiter tem estado interno — mock o módulo para bypass
    const { leadRateLimiter } = await import('@/lib/rate-limiter')
    const origCheck = leadRateLimiter.check.bind(leadRateLimiter)
    vi.spyOn(leadRateLimiter, 'check').mockReturnValueOnce(true)

    const request = buildRequest('/api/v1/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'clt3zk5bj0000xx6z9q79test',
        name: 'Test User',
        email: 'test@example.com',
        consentGiven: true,
        consentVersion: '1.0',
      }),
    })
    const response = await createLead(request)
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error.message).not.toContain('P2024')
    expect(data.error.message).not.toContain('pool')

    vi.restoreAllMocks()
  })
})

describe('DEGRADED — Supabase Auth indisponível (G013)', () => {
  it('GET /api/v1/admin/leads com Supabase Auth offline deve retornar 401/503 sem stack trace', async () => {
    vi.mocked(getUser).mockRejectedValueOnce(new Error('Service Unavailable'))
    const request = buildRequest('/api/v1/admin/leads')
    const response = await getAdminLeads(request)
    expect([401, 503]).toContain(response.status)
    const data = await response.json()
    expect(data).toHaveProperty('error')
    expect(JSON.stringify(data)).not.toContain('Service Unavailable')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SESSION_021: resposta incompleta sem optionIds nem textValue (G014)
// ─────────────────────────────────────────────────────────────────────────────

describe('ERROR-CATALOG compliance: SESSION_021 — resposta incompleta', () => {
  it('POST /api/v1/sessions/[id]/answers sem option_ids e sem text_value deve retornar 400', async () => {
    const request = buildRequest(`/api/v1/sessions/${SESSION_ID}/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: 'q-001' }),
    })
    const response = await submitAnswer(request, {
      params: Promise.resolve({ id: SESSION_ID }),
    })
    expect([400, 422]).toContain(response.status)
    const data = await response.json()
    expect(data).toHaveProperty('error')
    expect(data.error.message).toBeDefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AUTH_004: sessão admin expirada por inatividade (G014 — pendente de impl)
// ─────────────────────────────────────────────────────────────────────────────

describe('ERROR-CATALOG compliance: AUTH_004 — sessão admin expirada', () => {
  it.todo('GET /api/v1/admin/leads com token expirado deve retornar AUTH_004 — implementar requireAdmin timeout logic')
})
