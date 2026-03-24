// src/lib/scoring/calculateLeadScore.test.ts
import { calculateLeadScore } from './calculateLeadScore'

const baseEstimation = {
  priceMin: 10000,
  daysMin: 30,
  complexity: 'HIGH' as const,
}

const fullLead = { email: 'test@test.com', phone: '11999999999', company: 'Empresa LTDA' }
const minimalLead = { email: 'test@test.com' }

describe('calculateLeadScore — Dimensão Budget (0-40 pts)', () => {
  it('score_budget = 35-40 quando budget >= priceMin', () => {
    const result = calculateLeadScore({
      userBudget: 12000,
      userDeadlineDays: 30,
      estimation: baseEstimation,
      lead: minimalLead,
    })
    expect(result.score_budget).toBeGreaterThanOrEqual(35)
    expect(result.score_budget).toBeLessThanOrEqual(40)
  })

  it('score_budget = 20-34 quando budget está em 70-99% de priceMin', () => {
    const result = calculateLeadScore({
      userBudget: 7500, // 75% de 10000
      userDeadlineDays: 30,
      estimation: baseEstimation,
      lead: minimalLead,
    })
    expect(result.score_budget).toBeGreaterThanOrEqual(20)
    expect(result.score_budget).toBeLessThanOrEqual(34)
  })

  it('score_budget = 10-19 quando budget está em 50-69% de priceMin', () => {
    const result = calculateLeadScore({
      userBudget: 6000, // 60% de 10000
      userDeadlineDays: 30,
      estimation: baseEstimation,
      lead: minimalLead,
    })
    expect(result.score_budget).toBeGreaterThanOrEqual(10)
    expect(result.score_budget).toBeLessThanOrEqual(19)
  })

  it('score_budget = 0-9 quando budget < 50% de priceMin', () => {
    const result = calculateLeadScore({
      userBudget: 3000, // 30% de 10000
      userDeadlineDays: 30,
      estimation: baseEstimation,
      lead: minimalLead,
    })
    expect(result.score_budget).toBeGreaterThanOrEqual(0)
    expect(result.score_budget).toBeLessThanOrEqual(9)
  })

  it('score_budget = 0 quando priceMin <= 0 (proteção divisão por zero)', () => {
    const result = calculateLeadScore({
      userBudget: 5000,
      userDeadlineDays: 30,
      estimation: { ...baseEstimation, priceMin: 0 },
      lead: minimalLead,
    })
    expect(result.score_budget).toBe(0)
  })
})

describe('calculateLeadScore — Dimensão Timeline (0-30 pts)', () => {
  it('score_timeline = 25-30 quando deadline >= daysMin', () => {
    const result = calculateLeadScore({
      userBudget: 15000,
      userDeadlineDays: 35,
      estimation: baseEstimation,
      lead: minimalLead,
    })
    expect(result.score_timeline).toBeGreaterThanOrEqual(25)
    expect(result.score_timeline).toBeLessThanOrEqual(30)
  })

  it('score_timeline = 0-4 quando deadline < 60% de daysMin', () => {
    const result = calculateLeadScore({
      userBudget: 15000,
      userDeadlineDays: 10, // 33% de 30
      estimation: baseEstimation,
      lead: minimalLead,
    })
    expect(result.score_timeline).toBeGreaterThanOrEqual(0)
    expect(result.score_timeline).toBeLessThanOrEqual(4)
  })
})

describe('calculateLeadScore — Dimensão Perfil (0-30 pts)', () => {
  it('score_profile = 30 com email + phone + company + HIGH complexity', () => {
    const result = calculateLeadScore({
      userBudget: 10000,
      userDeadlineDays: 30,
      estimation: baseEstimation,
      lead: fullLead,
    })
    expect(result.score_profile).toBe(30) // 15+5+5+5
  })

  it('score_profile = 15 com apenas email (sem phone/company, LOW complexity)', () => {
    const result = calculateLeadScore({
      userBudget: 10000,
      userDeadlineDays: 30,
      estimation: { ...baseEstimation, complexity: 'LOW' as const },
      lead: minimalLead,
    })
    expect(result.score_profile).toBe(15)
  })

  it('score_profile = 20 com email + company (sem phone, LOW complexity)', () => {
    const result = calculateLeadScore({
      userBudget: 10000,
      userDeadlineDays: 30,
      estimation: { ...baseEstimation, complexity: 'LOW' as const },
      lead: { email: 'x@x.com', company: 'ACME' },
    })
    expect(result.score_profile).toBe(20) // 15+5
  })
})

describe('calculateLeadScore — Classificação Final', () => {
  it('classifica como A quando score_total >= 70', () => {
    const result = calculateLeadScore({
      userBudget: 15000,
      userDeadlineDays: 45,
      estimation: baseEstimation,
      lead: fullLead,
    })
    // score_budget ~40 + score_timeline ~30 + score_profile 30 = 100
    expect(result.score).toBe('A')
    expect(result.score_total).toBeGreaterThanOrEqual(70)
  })

  it('classifica como C quando score_total < 40', () => {
    const result = calculateLeadScore({
      userBudget: 2000, // muito baixo
      userDeadlineDays: 5, // muito curto
      estimation: baseEstimation,
      lead: minimalLead,
    })
    expect(result.score).toBe('C')
    expect(result.score_total).toBeLessThan(40)
  })

  it('classifica como B quando score_total >= 40 e < 70', () => {
    const result = calculateLeadScore({
      userBudget: 7000, // 70% de priceMin → ~20 pts budget
      userDeadlineDays: 20, // ~67% de daysMin → ~8 pts timeline
      estimation: { ...baseEstimation, complexity: 'LOW' as const },
      lead: minimalLead, // 15 pts perfil (só email, LOW complexity)
    })
    // ~20 budget + ~8 timeline + 15 perfil = ~43 → B
    expect(result.score).toBe('B')
    expect(result.score_total).toBeGreaterThanOrEqual(40)
    expect(result.score_total).toBeLessThan(70)
  })

  it('score_total nunca excede 100 e dimensões respeitam caps', () => {
    const result = calculateLeadScore({
      userBudget: 50000,
      userDeadlineDays: 365,
      estimation: baseEstimation,
      lead: fullLead,
    })
    expect(result.score_total).toBeLessThanOrEqual(100)
    expect(result.score_budget).toBeLessThanOrEqual(40)
    expect(result.score_timeline).toBeLessThanOrEqual(30)
    expect(result.score_profile).toBeLessThanOrEqual(30)
  })
})
