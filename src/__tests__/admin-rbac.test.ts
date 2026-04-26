/**
 * Defesa em profundidade RBAC para rotas /api/v1/admin/*
 *
 * Cobre os 4 endpoints admin (alerts + 3 KPIs) com:
 *  - C3 → 401 AUTH_001 quando sessão ausente
 *  - C5 → 403 AUTH_002 quando user autenticado mas email != ADMIN_EMAIL
 *  - happy-path → 200 quando admin
 *
 * Unit test (sem DB): prisma e dependências de cálculo são mockadas.
 * /api/v1/admin/leads tem cobertura completa em admin-leads.integration.test.ts.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ANTES dos imports dos route handlers ──────────────────────────────

vi.mock('@/lib/supabase/server', () => ({
  getUser: vi.fn(),
  requireAdmin: vi.fn(),
  createSupabaseServerClient: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    consistencyAlertLog: {
      groupBy: vi.fn().mockResolvedValue([]),
    },
    flowEvent: {
      groupBy: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
  },
}))

vi.mock('@/lib/calibration/computeAccuracyKPI', () => ({
  computeAccuracyKPI: vi.fn().mockResolvedValue({ accuracy: 0, sample: 0 }),
}))

import { requireAdmin } from '@/lib/supabase/server'
import { GET as getAlerts } from '@/app/api/v1/admin/alerts/route'
import { GET as getAbandonment } from '@/app/api/v1/admin/kpi/abandonment/route'
import { GET as getAccuracy } from '@/app/api/v1/admin/kpi/accuracy/route'
import { GET as getResumeRate } from '@/app/api/v1/admin/kpi/resume-rate/route'

// ── Fixtures de auth ────────────────────────────────────────────────────────

type AdminUserShape = {
  id: string
  email: string
  app_metadata: Record<string, unknown>
  user_metadata: Record<string, unknown>
  aud: string
  created_at: string
}

function asAdmin(): AdminUserShape {
  return {
    id: 'admin-user-id',
    email: 'admin@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  }
}

function mockOk() {
  vi.mocked(requireAdmin).mockResolvedValue({
    ok: true,
    user: asAdmin() as never,
  })
}

function mockUnauth() {
  vi.mocked(requireAdmin).mockResolvedValue({
    ok: false,
    status: 401,
    code: 'AUTH_001',
    message: 'Autenticação necessária.',
  })
}

function mockNonAdmin() {
  vi.mocked(requireAdmin).mockResolvedValue({
    ok: false,
    status: 403,
    code: 'AUTH_002',
    message: 'Acesso negado.',
  })
}

// ── Targets ─────────────────────────────────────────────────────────────────

const TARGETS = [
  {
    name: 'GET /api/v1/admin/alerts',
    handler: () =>
      getAlerts(new Request('http://localhost/api/v1/admin/alerts')),
  },
  {
    name: 'GET /api/v1/admin/kpi/abandonment',
    handler: () =>
      getAbandonment(
        new Request('http://localhost/api/v1/admin/kpi/abandonment')
      ),
  },
  {
    name: 'GET /api/v1/admin/kpi/accuracy',
    handler: () => getAccuracy(),
  },
  {
    name: 'GET /api/v1/admin/kpi/resume-rate',
    handler: () =>
      getResumeRate(
        new Request('http://localhost/api/v1/admin/kpi/resume-rate')
      ),
  },
] as const

describe('Admin API — RBAC defesa em profundidade', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  for (const target of TARGETS) {
    describe(target.name, () => {
      it('[C3] retorna 401 (AUTH_001) sem sessao', async () => {
        mockUnauth()
        const res = await target.handler()
        expect(res.status).toBe(401)
        const body = await res.json()
        expect(body.error.code).toBe('AUTH_001')
      })

      it('[C5] retorna 403 (AUTH_002) para user autenticado mas nao admin', async () => {
        mockNonAdmin()
        const res = await target.handler()
        expect(res.status).toBe(403)
        const body = await res.json()
        expect(body.error.code).toBe('AUTH_002')
      })

      it('[C1] retorna 200 para admin autenticado', async () => {
        mockOk()
        const res = await target.handler()
        expect(res.status).toBe(200)
      })
    })
  }
})
