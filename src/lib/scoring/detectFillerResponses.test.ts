// src/lib/scoring/detectFillerResponses.test.ts
import { detectFillerResponses } from './detectFillerResponses'

const baseInput = {
  answerTimestampsMs: [0, 2000, 5000, 8000, 12000, 16000],
  selectedOptionIndexes: [0, 2, 1, 3, 0, 2],
  userBudget: 8000,
  priceMin: 10000,
  userDeadlineDays: 40,
  daysMin: 30,
}

describe('detectFillerResponses', () => {
  it('retorna isSuspicious=false para respostas normais', () => {
    const result = detectFillerResponses(baseInput)
    expect(result.isSuspicious).toBe(false)
    expect(result.pattern).toBeNull()
    expect(result.confidenceAdjustment).toBe(0)
  })

  it('detecta TOO_FAST quando todas as respostas em < 5s', () => {
    const result = detectFillerResponses({
      ...baseInput,
      answerTimestampsMs: [0, 500, 1000, 1500, 2000, 2500], // 2.5s total
    })
    expect(result.isSuspicious).toBe(true)
    expect(result.pattern).toBe('TOO_FAST')
    expect(result.confidenceAdjustment).toBe(-10)
  })

  it('detecta TOO_UNIFORM quando mesma opção em todas as perguntas', () => {
    const result = detectFillerResponses({
      ...baseInput,
      selectedOptionIndexes: [0, 0, 0, 0, 0, 0],
    })
    expect(result.isSuspicious).toBe(true)
    expect(result.pattern).toBe('TOO_UNIFORM')
    expect(result.confidenceAdjustment).toBe(-5)
  })

  it('detecta BUDGET_MISMATCH quando budget muito baixo E deadline muito longo', () => {
    const result = detectFillerResponses({
      ...baseInput,
      userBudget: 2000, // 20% de priceMin (< 30%)
      userDeadlineDays: 90, // 300% de daysMin (> 200%)
    })
    expect(result.isSuspicious).toBe(true)
    expect(result.pattern).toBe('BUDGET_MISMATCH')
    expect(result.confidenceAdjustment).toBe(-5)
  })

  it('não detecta TOO_UNIFORM com menos de 5 respostas', () => {
    const result = detectFillerResponses({
      ...baseInput,
      selectedOptionIndexes: [0, 0, 0, 0], // apenas 4 respostas
    })
    expect(result.pattern).not.toBe('TOO_UNIFORM')
  })

  it('não lança erro com arrays vazios (proteção defensiva)', () => {
    expect(() =>
      detectFillerResponses({
        ...baseInput,
        answerTimestampsMs: [],
        selectedOptionIndexes: [],
      })
    ).not.toThrow()
  })
})
