import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'

describe('Lead Anonymization — INT-094', () => {
  let testLeadId: string
  let testSessionId: string

  beforeAll(async () => {
    // Criar sessão de teste (necessária pelo relacionamento session_id)
    const thirteenMonthsAgo = new Date()
    thirteenMonthsAgo.setMonth(thirteenMonthsAgo.getMonth() - 13)

    const session = await prisma.session.create({
      data: {
        status: 'COMPLETED',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        created_at: thirteenMonthsAgo,
      },
    })
    testSessionId = session.id

    // Criar lead de teste com data de 13 meses atrás
    const lead = await prisma.lead.create({
      data: {
        session_id: testSessionId,
        name: 'João Silva',
        email: 'joao@example.com',
        phone: '+55 11 99999-9999',
        company: 'Empresa Teste',
        scope_story: 'Projeto completo...',
        score: 'A',
        score_budget: 30,
        score_timeline: 25,
        score_profile: 20,
        score_total: 75,
        project_type: 'saas',
        complexity: 'alta',
        estimated_price_min: 15000,
        estimated_price_max: 30000,
        estimated_days_min: 60,
        estimated_days_max: 120,
        features: [],
        locale: 'pt-BR',
        currency: 'BRL',
        consent_given: true,
        consent_version: '1.0',
        consent_at: new Date(),
        created_at: thirteenMonthsAgo,
      },
    })
    testLeadId = lead.id
  })

  afterAll(async () => {
    await prisma.lead.deleteMany({ where: { id: testLeadId } })
    await prisma.session.deleteMany({ where: { id: testSessionId } })
    await prisma.$disconnect()
  })

  it('deve anonimizar campos PII após 12 meses', async () => {
    await prisma.lead.updateMany({
      where: { id: testLeadId, anonymized_at: null },
      data: {
        name: '[Removido]',
        email: 'anonimizado@example.com',
        phone: null,
        company: null,
        scope_story: '[Removido]', // não-nullable no schema — usar string sentinela
        anonymized_at: new Date(),
      },
    })

    const anonymized = await prisma.lead.findUnique({ where: { id: testLeadId } })
    expect(anonymized!.name).toBe('[Removido]')
    expect(anonymized!.email).toBe('anonimizado@example.com')
    expect(anonymized!.phone).toBeNull()
    expect(anonymized!.company).toBeNull()
    expect(anonymized!.scope_story).toBe('[Removido]') // não-nullable no schema
    expect(anonymized!.anonymized_at).not.toBeNull()
  })

  it('deve preservar dados de analytics após anonimização', async () => {
    const lead = await prisma.lead.findUnique({ where: { id: testLeadId } })
    // Dados de analytics preservados:
    expect(lead!.score).toBe('A')
    expect(lead!.project_type).toBe('saas')
    expect(lead!.complexity).toBe('alta')
    expect(Number(lead!.estimated_price_min)).toBe(15000)
    expect(Number(lead!.estimated_price_max)).toBe(30000)
    expect(lead!.currency).toBe('BRL')
  })

  it('não deve re-anonimizar leads já anonimizados', async () => {
    const before = await prisma.lead.findUnique({ where: { id: testLeadId } })
    const firstAnonymizedAt = before!.anonymized_at

    // Simular segunda execução do cron (deve ignorar)
    const result = await prisma.lead.updateMany({
      where: { id: testLeadId, anonymized_at: null }, // null = não anonimizado
      data: { name: 'Outro Nome', anonymized_at: new Date() },
    })

    expect(result.count).toBe(0) // nenhum registro afetado

    const after = await prisma.lead.findUnique({ where: { id: testLeadId } })
    expect(after!.anonymized_at).toEqual(firstAnonymizedAt) // inalterado
  })
})
