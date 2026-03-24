/**
 * Testes de integracao: GET /api/v1/admin/leads
 *
 * Cobre:
 * - Cenario 1 (Happy Path): listagem paginada de leads com filtros
 * - Cenario 2 (Validacao): parametros de query invalidos
 * - Cenario 3 (Autenticacao): sem token, token invalido → AUTH_001
 * - Cenario 4 (Seguranca): paginacao, filtros de score e project_type
 *
 * DB: real (nao mockado)
 * Mocks: @/lib/supabase/server (getUser) — autenticacao Supabase nao disponivel em testes
 *        sendLeadNotification — evitar emails nos setups
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import { getRequest } from './helpers/request'
import { createCompletedSession, buildLeadPayload } from './helpers/db'

// Mock Supabase Auth — nao temos sessao real em testes
vi.mock('@/lib/supabase/server', () => ({
  getUser: vi.fn(),
  createSupabaseServerClient: vi.fn(),
}))

// Mock notificacao de email — evitar side effects nos helpers de setup
vi.mock('@/lib/notifications/sendLeadNotification', () => ({
  sendLeadNotification: vi.fn().mockResolvedValue(undefined),
}))

import { getUser } from '@/lib/supabase/server'
import { GET } from '@/app/api/v1/admin/leads/route'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de mock de autenticacao
// ─────────────────────────────────────────────────────────────────────────────

function mockAuthenticatedAdmin() {
  vi.mocked(getUser).mockResolvedValue({
    id: 'admin-user-id',
    email: 'admin@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  } as ReturnType<typeof getUser> extends Promise<infer T> ? NonNullable<T> : never)
}

function mockUnauthenticated() {
  vi.mocked(getUser).mockResolvedValue(null)
}

// ─────────────────────────────────────────────────────────────────────────────
// Setup de dados de teste
// ─────────────────────────────────────────────────────────────────────────────

async function seedTestLeads(count: number = 3) {
  const leads = []
  for (let i = 0; i < count; i++) {
    const session = await createCompletedSession()
    const lead = await prisma.lead.create({
      data: {
        session_id: session.id,
        name: `Lead Test ${i + 1}`,
        email: `lead${i + 1}-${Date.now()}@test.com`,
        score: i === 0 ? 'A' : i === 1 ? 'B' : 'C',
        score_budget: 30,
        score_timeline: 20,
        score_profile: 15,
        score_total: i === 0 ? 75 : i === 1 ? 55 : 30,
        project_type: 'WEB_APP',
        complexity: 'MEDIUM',
        estimated_price_min: 10000,
        estimated_price_max: 20000,
        estimated_days_min: 30,
        estimated_days_max: 60,
        features: [],
        scope_story: 'Projeto de teste',
        locale: 'pt_BR',
        currency: 'BRL',
        consent_given: true,
        consent_version: '1.0',
        consent_at: new Date(),
        email_status: 'SENT',
        email_retry_count: 0,
      },
    })
    leads.push(lead)
  }
  return leads
}

// ─────────────────────────────────────────────────────────────────────────────
// Testes
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/v1/admin/leads', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Cenario 1: Happy Path ─────────────────────────────────────────────────

  it('[C1] retorna 200 com lista paginada de leads para admin autenticado', async () => {
    mockAuthenticatedAdmin()
    await seedTestLeads(3)

    const req = getRequest('/api/v1/admin/leads')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toBeDefined()
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.total).toBeGreaterThanOrEqual(3)
    expect(body.page).toBeDefined()
    expect(body.per_page).toBeDefined()
  })

  it('[C1] retorna leads com campos corretos (LeadSummary shape)', async () => {
    mockAuthenticatedAdmin()
    await seedTestLeads(1)

    const req = getRequest('/api/v1/admin/leads')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    const lead = body.data[0]

    expect(lead.id).toBeDefined()
    expect(lead.name).toBeDefined()
    expect(lead.email).toBeDefined()
    expect(lead.project_type).toBeDefined()
    expect(lead.score).toBeDefined()
    expect(lead.complexity).toBeDefined()
    expect(lead.estimated_price_min).toBeDefined()
    expect(lead.estimated_price_max).toBeDefined()
    expect(lead.created_at).toBeDefined()
  })

  it('[C1] Cache-Control no-store presente na resposta (dados privados)', async () => {
    mockAuthenticatedAdmin()

    const req = getRequest('/api/v1/admin/leads')
    const res = await GET(req)

    expect(res.headers.get('cache-control')).toContain('no-store')
  })

  it('[C4] filtra por score=A e retorna apenas leads A', async () => {
    mockAuthenticatedAdmin()
    await seedTestLeads(3)

    const req = getRequest('/api/v1/admin/leads?score=A')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    body.data.forEach((lead: { score: string }) => {
      expect(lead.score).toBe('A')
    })
  })

  it('[C4] paginacao funciona: per_page=1 retorna apenas 1 lead', async () => {
    mockAuthenticatedAdmin()
    await seedTestLeads(3)

    const req = getRequest('/api/v1/admin/leads?per_page=1&page=1')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.length).toBeLessThanOrEqual(1)
    expect(body.per_page).toBe(1)
  })

  it('[C4] segunda pagina retorna leads diferentes da primeira', async () => {
    mockAuthenticatedAdmin()
    await seedTestLeads(4)

    const reqPage1 = getRequest('/api/v1/admin/leads?per_page=2&page=1')
    const reqPage2 = getRequest('/api/v1/admin/leads?per_page=2&page=2')

    const res1 = await GET(reqPage1)
    const res2 = await GET(reqPage2)

    const body1 = await res1.json()
    const body2 = await res2.json()

    const ids1 = body1.data.map((l: { id: string }) => l.id)
    const ids2 = body2.data.map((l: { id: string }) => l.id)

    // Nenhum ID deve se repetir entre paginas
    const overlap = ids1.filter((id: string) => ids2.includes(id))
    expect(overlap.length).toBe(0)
  })

  // ── Cenario 2: Validacao ──────────────────────────────────────────────────

  it('[C2] retorna 422 para score invalido (VALIDATION_FAILED)', async () => {
    mockAuthenticatedAdmin()

    const req = getRequest('/api/v1/admin/leads?score=INVALIDO')
    const res = await GET(req)

    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.error.code).toBe('VALIDATION_FAILED')
  })

  it('[C2] retorna 422 para page=0 (min 1)', async () => {
    mockAuthenticatedAdmin()

    const req = getRequest('/api/v1/admin/leads?page=0')
    const res = await GET(req)

    expect(res.status).toBe(422)
  })

  it('[C2] retorna 422 para per_page acima do maximo (100)', async () => {
    mockAuthenticatedAdmin()

    const req = getRequest('/api/v1/admin/leads?per_page=9999')
    const res = await GET(req)

    expect(res.status).toBe(422)
  })

  // ── Cenario 3: Autenticacao ───────────────────────────────────────────────

  it('[C3] retorna 401 sem autenticacao (AUTH_001)', async () => {
    mockUnauthenticated()

    const req = getRequest('/api/v1/admin/leads')
    const res = await GET(req)

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error.code).toBe('UNAUTHORIZED')
  })

  it('[C3] retorna 401 com getUser retornando null (sessao invalida)', async () => {
    vi.mocked(getUser).mockResolvedValue(null)

    const req = getRequest('/api/v1/admin/leads', undefined, 'token-invalido')
    const res = await GET(req)

    expect(res.status).toBe(401)
  })

  it('[C3] nao retorna dados de leads sem autenticacao', async () => {
    mockUnauthenticated()
    await seedTestLeads(2)

    const req = getRequest('/api/v1/admin/leads')
    const res = await GET(req)

    expect(res.status).toBe(401)
    const body = await res.json()
    // Body de erro nao deve conter dados de leads
    expect(body.data).toBeUndefined()
  })
})
