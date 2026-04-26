/**
 * Testes de segurança — IDOR guard em PATCH /api/v1/sessions/[id]/email
 *
 * Rastreabilidade: SEC-007, G001, TASK-REFORGE-1 (module-9)
 * Cobertura: cookie ausente, cookie divergente, cookie correto
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Mocks ANTES dos imports ──────────────────────────────────────────────────

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

vi.mock('server-only', () => ({}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    session: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock('@/lib/constants', () => ({
  COOKIE_NAMES: { SESSION_ID: 'session_id' },
}))

// ── Imports (após mocks) ─────────────────────────────────────────────────────

import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { PATCH } from '@/app/api/v1/sessions/[id]/email/route'

// ── Helpers ──────────────────────────────────────────────────────────────────

type CookieStore = Awaited<ReturnType<typeof cookies>>

function mockCookieStore(sessionId: string | undefined) {
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) =>
      name === 'session_id' && sessionId ? { name, value: sessionId } : undefined,
    getAll: () => [],
    has: () => false,
    set: vi.fn(),
    delete: vi.fn(),
  } as unknown as CookieStore)
}

function buildPatchRequest(id: string, body?: object): NextRequest {
  return new NextRequest(`http://localhost:3000/api/v1/sessions/${id}/email`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? { email: 'test@example.com' }),
  })
}

const SESSION_ID = 'cltest0000000000000000001'

// ── Suite de segurança IDOR ───────────────────────────────────────────────────

describe('IDOR guard — PATCH /api/v1/sessions/[id]/email', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('[SEC-C1] retorna 403 quando cookie session_id está ausente', async () => {
    mockCookieStore(undefined)

    const request = buildPatchRequest(SESSION_ID)
    const response = await PATCH(request, {
      params: Promise.resolve({ id: SESSION_ID }),
    })

    expect(response.status).toBe(403)
    const body = await response.json()
    expect(body).toHaveProperty('error')
    expect(body.error.code).toBeDefined()
  })

  it('[SEC-C2] retorna 403 quando cookie diverge do path id', async () => {
    mockCookieStore('clother-session-id-9999')

    const request = buildPatchRequest(SESSION_ID)
    const response = await PATCH(request, {
      params: Promise.resolve({ id: SESSION_ID }),
    })

    expect(response.status).toBe(403)
    const body = await response.json()
    expect(body).toHaveProperty('error')
    // Não deve revelar o id alvo
    expect(JSON.stringify(body)).not.toContain(SESSION_ID)
  })

  it('[SEC-C3] permite acesso quando cookie coincide com path id', async () => {
    mockCookieStore(SESSION_ID)

    vi.mocked(prisma.session.findUnique).mockResolvedValue({
      id: SESSION_ID,
      status: 'IN_PROGRESS',
      expires_at: new Date(Date.now() + 3_600_000),
      resume_email_sent_at: null,
      resume_email_scheduled_for: null,
    } as any)

    vi.mocked(prisma.session.update).mockResolvedValue({
      id: SESSION_ID,
      intermediate_email: 'test@example.com',
      resume_email_scheduled_for: null,
    } as any)

    const request = buildPatchRequest(SESSION_ID, { email: 'test@example.com' })
    const response = await PATCH(request, {
      params: Promise.resolve({ id: SESSION_ID }),
    })

    expect(response.status).not.toBe(403)
    expect(prisma.session.update).toHaveBeenCalledOnce()
  })

  it('[SEC-C4] IDOR bloqueado mesmo com body email válido', async () => {
    // Garante que body correto não bypassa o guard
    mockCookieStore('clattacker-session-id-000')

    const request = buildPatchRequest(SESSION_ID, { email: 'victim@target.com' })
    const response = await PATCH(request, {
      params: Promise.resolve({ id: SESSION_ID }),
    })

    expect(response.status).toBe(403)
    // Banco NÃO deve ser consultado — guard intercepta antes
    expect(prisma.session.findUnique).not.toHaveBeenCalled()
    expect(prisma.session.update).not.toHaveBeenCalled()
  })
})
