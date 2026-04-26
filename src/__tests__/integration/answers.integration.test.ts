/**
 * Testes de integracao: POST /api/v1/sessions/[id]/answers
 *
 * Cobre:
 * - Cenario 1 (Happy Path): salvar resposta e verificar acumuladores no banco
 * - Cenario 2 (Validacao): payload invalido, opcao invalida para pergunta
 * - Cenario 3 (Autenticacao/IDOR): sem cookie, cookie errado
 * - Cenario 4 (Seguranca): sessao expirada, sessao ja concluida
 *
 * DB: real (nao mockado) — testa transacao atomica de upsert + update
 * Mocks: next/headers (cookies)
 *
 * NOTA: Requer perguntas e opcoes seedadas no banco de teste.
 * Execute `bun run db:seed` antes de rodar estes testes pela primeira vez.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import { SessionStatus } from '@/lib/enums'
import { postRequest } from './helpers/request'
import { createTestSession, createCompletedSession, createExpiredSession } from './helpers/db'

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

import { cookies } from 'next/headers'
import { POST } from '@/app/api/v1/sessions/[id]/answers/route'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function mockCookie(sessionId: string | undefined) {
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) =>
      name === 'session_id' && sessionId ? { value: sessionId } : undefined,
  } as ReturnType<typeof cookies> extends Promise<infer T> ? T : never)
}

async function getFirstQuestionAndOption() {
  const question = await prisma.question.findFirst({
    orderBy: { order: 'asc' },
    include: {
      options: { orderBy: { order: 'asc' }, take: 1 },
    },
  })
  return question
}

// ─────────────────────────────────────────────────────────────────────────────
// Testes
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/v1/sessions/[id]/answers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('[C1] salva resposta e retorna acumuladores atualizados', async () => {
    const session = await createTestSession()
    mockCookie(session.id)

    const question = await getFirstQuestionAndOption()
    if (!question || question.options.length === 0) {
      console.warn('Sem perguntas/opcoes no banco — execute db:seed antes')
      return
    }

    const option = question.options[0]!
    const req = postRequest(`/api/v1/sessions/${session.id}/answers`, {
      question_id: question.id,
      option_ids: [option.id],
    }, session.id)

    const res = await POST(req, { params: Promise.resolve({ id: session.id }) })

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.session_id).toBe(session.id)
    expect(body.questions_answered).toBe(1)
    expect(typeof body.progress_percentage).toBe('number')

    // Verificar que resposta foi persistida no banco
    const dbAnswer = await prisma.answer.findUnique({
      where: {
        session_id_question_id: { session_id: session.id, question_id: question.id },
      },
    })
    expect(dbAnswer).not.toBeNull()
    expect(dbAnswer!.option_id).toContain(option.id)

    // Verificar que acumuladores da sessao foram atualizados
    const dbSession = await prisma.session.findUnique({ where: { id: session.id } })
    expect(dbSession!.questions_answered).toBe(1)
    expect((dbSession!.path_taken as string[]).includes(question.id)).toBe(true)
  })

  it('[C1] permite re-responder mesma pergunta (upsert — idempotente)', async () => {
    const session = await createTestSession()
    mockCookie(session.id)

    const question = await getFirstQuestionAndOption()
    if (!question || question.options.length === 0) return

    const option = question.options[0]!

    // Primeira resposta
    await POST(
      postRequest(`/api/v1/sessions/${session.id}/answers`, {
        question_id: question.id,
        option_ids: [option.id],
      }, session.id),
      { params: Promise.resolve({ id: session.id }) }
    )

    // Segunda resposta com mesma pergunta
    const res = await POST(
      postRequest(`/api/v1/sessions/${session.id}/answers`, {
        question_id: question.id,
        option_ids: [option.id],
      }, session.id),
      { params: Promise.resolve({ id: session.id }) }
    )

    expect(res.status).toBe(201)

    // Deve existir apenas 1 answer (upsert)
    const answerCount = await prisma.answer.count({
      where: { session_id: session.id, question_id: question.id },
    })
    expect(answerCount).toBe(1)
  })

  it('[C1] persiste session.project_type ao responder Q001', async () => {
    const q001 = await prisma.question.findFirst({
      where: { code: 'Q001' },
      include: { options: { where: { order: 3 }, take: 1 } },
    })
    if (!q001 || q001.options.length === 0) return

    const session = await createTestSession({ current_question_id: q001.id })
    mockCookie(session.id)

    const res = await POST(
      postRequest(
        `/api/v1/sessions/${session.id}/answers`,
        { question_id: q001.id, option_ids: [q001.options[0]!.id] },
        session.id
      ),
      { params: Promise.resolve({ id: session.id }) }
    )

    expect(res.status).toBe(201)

    const updatedSession = await prisma.session.findUnique({
      where: { id: session.id },
      select: { project_type: true },
    })
    expect(updatedSession?.project_type).toBe('ECOMMERCE')
  })

  it('[C1] resolve dynamic_next em Q005 conforme o tipo do projeto', async () => {
    const [q005, q020, q030] = await Promise.all([
      prisma.question.findFirst({
        where: { code: 'Q005' },
        include: { options: { where: { order: 1 }, take: 1 } },
      }),
      prisma.question.findFirst({ where: { code: 'Q020' }, select: { id: true } }),
      prisma.question.findFirst({ where: { code: 'Q030' }, select: { id: true } }),
    ])
    if (!q005 || q005.options.length === 0 || !q020 || !q030) return

    const [ecommerceSession, webAppSession] = await Promise.all([
      createTestSession({ current_question_id: q005.id, project_type: 'ECOMMERCE' }),
      createTestSession({ current_question_id: q005.id, project_type: 'WEB_APP' }),
    ])

    mockCookie(ecommerceSession.id)
    const ecommerceResponse = await POST(
      postRequest(
        `/api/v1/sessions/${ecommerceSession.id}/answers`,
        { question_id: q005.id, option_ids: [q005.options[0]!.id] },
        ecommerceSession.id
      ),
      { params: Promise.resolve({ id: ecommerceSession.id }) }
    )

    expect(ecommerceResponse.status).toBe(201)
    expect((await ecommerceResponse.json()).next_question_id).toBe(q020.id)

    mockCookie(webAppSession.id)
    const webAppResponse = await POST(
      postRequest(
        `/api/v1/sessions/${webAppSession.id}/answers`,
        { question_id: q005.id, option_ids: [q005.options[0]!.id] },
        webAppSession.id
      ),
      { params: Promise.resolve({ id: webAppSession.id }) }
    )

    expect(webAppResponse.status).toBe(201)
    expect((await webAppResponse.json()).next_question_id).toBe(q030.id)
  })

  it('[C1] usa skip_logic.next_question para TEXT_INPUT em Q100', async () => {
    const [q100, q101] = await Promise.all([
      prisma.question.findFirst({ where: { code: 'Q100' }, select: { id: true } }),
      prisma.question.findFirst({ where: { code: 'Q101' }, select: { id: true } }),
    ])
    if (!q100 || !q101) return

    const session = await createTestSession({ current_question_id: q100.id })
    mockCookie(session.id)

    const res = await POST(
      postRequest(
        `/api/v1/sessions/${session.id}/answers`,
        { question_id: q100.id, text_value: 'Al' },
        session.id
      ),
      { params: Promise.resolve({ id: session.id }) }
    )

    expect(res.status).toBe(201)

    const body = await res.json()
    expect(body.next_question_id).toBe(q101.id)
  })

  it('[C2] retorna 400 quando body JSON e invalido', async () => {
    const session = await createTestSession()
    mockCookie(session.id)

    const req = postRequest(`/api/v1/sessions/${session.id}/answers`, {
      // question_id ausente
      option_ids: ['some-id'],
    }, session.id)

    const res = await POST(req, { params: Promise.resolve({ id: session.id }) })

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe('VALIDATION_FAILED')
  })

  it('[C2] retorna 422 quando option_ids e text_value ambos ausentes', async () => {
    const session = await createTestSession()
    mockCookie(session.id)

    const question = await prisma.question.findFirst()
    if (!question) return

    const req = postRequest(`/api/v1/sessions/${session.id}/answers`, {
      question_id: question.id,
      // nem option_ids nem text_value
    }, session.id)

    const res = await POST(req, { params: Promise.resolve({ id: session.id }) })

    expect(res.status).toBe(422)

    // Verificar que nenhuma resposta foi salva
    const count = await prisma.answer.count({ where: { session_id: session.id } })
    expect(count).toBe(0)
  })

  it('[C3] retorna 403 sem cookie session_id', async () => {
    const session = await createTestSession()
    mockCookie(undefined)

    const req = postRequest(`/api/v1/sessions/${session.id}/answers`, {
      question_id: 'Q001',
      option_ids: ['some-id'],
    })

    const res = await POST(req, { params: Promise.resolve({ id: session.id }) })

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error.code).toBe('FORBIDDEN')
  })

  it('[C3] retorna 403 quando cookie diverge do path param (IDOR guard)', async () => {
    const session = await createTestSession()
    mockCookie('outro-session-id')

    const req = postRequest(`/api/v1/sessions/${session.id}/answers`, {
      question_id: 'Q001',
      option_ids: ['some-id'],
    }, 'outro-session-id')

    const res = await POST(req, { params: Promise.resolve({ id: session.id }) })

    expect(res.status).toBe(403)
  })

  it('[C4] retorna 410 para sessao expirada', async () => {
    const session = await createExpiredSession()
    mockCookie(session.id)

    const question = await prisma.question.findFirst()
    if (!question) return

    const req = postRequest(`/api/v1/sessions/${session.id}/answers`, {
      question_id: question.id,
      option_ids: ['some-id'],
    }, session.id)

    const res = await POST(req, { params: Promise.resolve({ id: session.id }) })

    expect(res.status).toBe(410)
    const body = await res.json()
    expect(body.error.code).toBe('SESSION_EXPIRED')
  })

  it('[C4] retorna 409 para sessao ja COMPLETED', async () => {
    const session = await createCompletedSession()
    mockCookie(session.id)

    const question = await prisma.question.findFirst()
    if (!question) return

    const req = postRequest(`/api/v1/sessions/${session.id}/answers`, {
      question_id: question.id,
      option_ids: ['some-id'],
    }, session.id)

    const res = await POST(req, { params: Promise.resolve({ id: session.id }) })

    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error.code).toBe('CONFLICT')
  })

  it('[C4] retorna 404 para sessao inexistente', async () => {
    const fakeId = 'sessao-inexistente-xyz'
    mockCookie(fakeId)

    const question = await prisma.question.findFirst()
    if (!question) return

    const req = postRequest(`/api/v1/sessions/${fakeId}/answers`, {
      question_id: question.id,
      option_ids: ['some-id'],
    }, fakeId)

    const res = await POST(req, { params: Promise.resolve({ id: fakeId }) })

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error.code).toBe('SESSION_NOT_FOUND')
  })
})
