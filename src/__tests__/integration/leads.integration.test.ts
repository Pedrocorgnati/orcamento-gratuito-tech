/**
 * Testes de integracao: POST /api/v1/leads
 *
 * Cobre:
 * - Cenario 1 (Happy Path): lead criado com score calculado e banco persistido
 * - Cenario 2 (Validacao): campos obrigatorios, email invalido, consentimento ausente
 * - Cenario 3 (Negocio): sessao incompleta, sessao inexistente, lead duplicado
 * - Cenario 4 (Seguranca/THREAT-007): SQL injection, honeypot preenchido
 *
 * DB: real (nao mockado)
 * Mocks: sendLeadNotification (evitar envio real de email em testes)
 *        estimationService (precisa de PricingConfig — ou seed o banco)
 *
 * NOTA: Lead requer sessao COMPLETED com PricingConfig no banco.
 * Execute `bun run db:seed` ou use ensurePricingConfig() antes dos testes.
 */

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import { postRequest } from './helpers/request'
import {
  createTestSession,
  createCompletedSession,
  buildLeadPayload,
  ensurePricingConfig,
  ensureExchangeRate,
} from './helpers/db'
import { ProjectType } from '@/lib/enums'

// Mock notificacao de email — nao enviar emails reais em testes
vi.mock('@/lib/notifications/sendLeadNotification', () => ({
  sendLeadNotification: vi.fn().mockResolvedValue(undefined),
}))

// ─────────────────────────────────────────────────────────────────────────────
// Dados de referencia minimos para calculo de estimativa
// ─────────────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  await ensurePricingConfig(ProjectType.WEB_APP)
  await ensureExchangeRate('BRL', 'BRL', 1.0)
})

import { POST } from '@/app/api/v1/leads/route'

// ─────────────────────────────────────────────────────────────────────────────
// Testes
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/v1/leads', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Cenario 1: Happy Path ─────────────────────────────────────────────────

  it('[C1] cria lead com dados validos e retorna 201 com id e score', async () => {
    const session = await createCompletedSession()
    const payload = buildLeadPayload(session.id)

    const res = await POST(postRequest('/api/v1/leads', payload))

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBeTruthy()
    expect(['A', 'B', 'C']).toContain(body.score)
    expect(body.message).toBeTruthy()

    // Verificar persitencia no banco
    const dbLead = await prisma.lead.findUnique({ where: { id: body.id } })
    expect(dbLead).not.toBeNull()
    expect(dbLead!.email).toBe(payload.email.toLowerCase())
    expect(dbLead!.consent_given).toBe(true)
    expect(dbLead!.consent_at).not.toBeNull()
  })

  it('[C1] normaliza email para lowercase antes de persistir', async () => {
    const session = await createCompletedSession()
    const payload = buildLeadPayload(session.id, { email: 'UPPERCASE@EXAMPLE.COM' })

    const res = await POST(postRequest('/api/v1/leads', payload))

    expect(res.status).toBe(201)
    const body = await res.json()
    const dbLead = await prisma.lead.findUnique({ where: { id: body.id } })
    expect(dbLead!.email).toBe('uppercase@example.com')
  })

  it('[C1] lead opcional com phone e company aumenta score_profile', async () => {
    const session = await createCompletedSession()
    const payload = buildLeadPayload(session.id, {
      phone: '+5511999999999',
      company: 'Startup X',
    })

    const res = await POST(postRequest('/api/v1/leads', payload))

    expect(res.status).toBe(201)
    const dbLead = await prisma.lead.findUnique({
      where: { session_id: session.id },
    })
    expect(dbLead!.phone).toBe('+5511999999999')
    expect(dbLead!.company).toBe('Startup X')
    expect(dbLead!.score_profile).toBeGreaterThan(0)
  })

  // ── Cenario 2: Validacao ──────────────────────────────────────────────────

  it('[C2] retorna 422 sem sessionId', async () => {
    const res = await POST(postRequest('/api/v1/leads', {
      name: 'João',
      email: 'joao@example.com',
      consentGiven: true,
      consentVersion: '1.0',
      // sessionId ausente
    }))

    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.error.code).toBe('VALIDATION_FAILED')

    // Nenhum lead criado
    const count = await prisma.lead.count()
    expect(count).toBe(0)
  })

  it('[C2] retorna 422 com email invalido', async () => {
    const session = await createCompletedSession()
    const res = await POST(postRequest('/api/v1/leads', {
      sessionId: session.id,
      name: 'João',
      email: 'nao-e-um-email',
      consentGiven: true,
      consentVersion: '1.0',
    }))

    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.error.code).toBe('VALIDATION_FAILED')

    const count = await prisma.lead.count({ where: { session_id: session.id } })
    expect(count).toBe(0)
  })

  it('[C2] retorna 422 com nome muito curto (min 2 chars)', async () => {
    const session = await createCompletedSession()
    const res = await POST(postRequest('/api/v1/leads', {
      sessionId: session.id,
      name: 'A',
      email: 'a@example.com',
      consentGiven: true,
      consentVersion: '1.0',
    }))

    expect(res.status).toBe(422)
  })

  it('[C2] retorna 422 quando consentGiven e false (LEAD_051)', async () => {
    const session = await createCompletedSession()
    const res = await POST(postRequest('/api/v1/leads', {
      ...buildLeadPayload(session.id),
      consentGiven: false,
    }))

    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.error.code).toBe('VALIDATION_FAILED')
  })

  // ── Cenario 3: Negocio ────────────────────────────────────────────────────

  it('[C3] retorna 400 para sessao em IN_PROGRESS (LEAD_050)', async () => {
    const session = await createTestSession()
    const res = await POST(postRequest('/api/v1/leads', buildLeadPayload(session.id)))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe('SESSION_NOT_COMPLETE')
  })

  it('[C3] retorna 404 para sessao inexistente (LEAD_080)', async () => {
    const res = await POST(postRequest('/api/v1/leads', {
      ...buildLeadPayload('sessao-inexistente-xyz'),
    }))

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error.code).toBe('SESSION_NOT_FOUND')
  })

  it('[C3] retorna 409 ao tentar criar segundo lead para mesma sessao (LEAD_081)', async () => {
    const session = await createCompletedSession()
    const payload = buildLeadPayload(session.id)

    // Primeiro lead
    const res1 = await POST(postRequest('/api/v1/leads', payload))
    expect(res1.status).toBe(201)

    // Segundo lead para a mesma sessao
    const res2 = await POST(postRequest('/api/v1/leads', {
      ...payload,
      email: 'outro@example.com',
    }))

    expect(res2.status).toBe(409)
    const body = await res2.json()
    expect(body.error.code).toBe('LEAD_ALREADY_EXISTS')

    // Apenas 1 lead no banco
    const count = await prisma.lead.count({ where: { session_id: session.id } })
    expect(count).toBe(1)
  })

  // ── Cenario 4: Seguranca ──────────────────────────────────────────────────

  it('[C4] honeypot preenchido nao cria lead (THREAT-007)', async () => {
    const session = await createCompletedSession()
    const res = await POST(postRequest('/api/v1/leads', {
      ...buildLeadPayload(session.id),
      _hp: 'bot-preenchio-o-honeypot',
    }))

    // Honeypot preenchido deve ser rejeitado (422) ou criar lead suspeito
    // Dependendo da implementacao: 422 ou criacao com is_suspicious=true
    expect([201, 422]).toContain(res.status)

    if (res.status === 201) {
      const body = await res.json()
      const dbLead = await prisma.lead.findUnique({ where: { id: body.id } })
      // Se criou, deve estar marcado como suspeito
      expect(dbLead?.is_suspicious).toBe(true)
    }
  })

  it('[C4] SQL injection no campo name nao afeta banco', async () => {
    const session = await createCompletedSession()
    const res = await POST(postRequest('/api/v1/leads', {
      ...buildLeadPayload(session.id),
      name: "'; DROP TABLE leads; --",
    }))

    // Deve rejeitar por validacao (regex no schema nao aceita caracteres especiais)
    // ou aceitar com escaping correto via Prisma
    expect([201, 422]).toContain(res.status)

    // Tabela leads ainda existe
    const count = await prisma.lead.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  it('[C4] XSS no campo company e sanitizado ou rejeitado', async () => {
    const session = await createCompletedSession()
    const res = await POST(postRequest('/api/v1/leads', {
      ...buildLeadPayload(session.id),
      company: '<script>alert("xss")</script>',
    }))

    if (res.status === 201) {
      const body = await res.json()
      const dbLead = await prisma.lead.findUnique({ where: { id: body.id } })
      // Dado armazenado nao deve conter tags de script executaveis
      expect(dbLead?.company).not.toContain('<script>')
    } else {
      expect(res.status).toBe(422)
    }
  })
})
