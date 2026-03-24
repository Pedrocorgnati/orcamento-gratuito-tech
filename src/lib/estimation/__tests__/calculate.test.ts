// src/lib/estimation/__tests__/calculate.test.ts
import { describe, it, expect } from 'vitest'
import { calculateEstimation, PRICE_RANGE_FACTOR, DAYS_RANGE_FACTOR } from '../calculate'
import { ComplexityLevel, Currency, Locale, ProjectType } from '@/lib/enums'
import type { CalculationInput } from '../calculate'

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const mockPricingConfig = {
  base_price:                      10000,
  base_days:                       60,
  complexity_multiplier_low:       1.0,
  complexity_multiplier_medium:    1.3,
  complexity_multiplier_high:      1.6,
  complexity_multiplier_very_high: 2.0,
}

function buildInput(overrides?: Partial<CalculationInput>): CalculationInput {
  return {
    accumulatedPrice:      5000,
    accumulatedTime:       20,
    accumulatedComplexity: 25, // LOW (0-30)
    pricingConfig:         mockPricingConfig,
    projectType:           ProjectType.WEB_APP,
    features:              ['autenticação', 'painel admin'],
    locale:                Locale.PT_BR,
    currency:              Currency.BRL,
    ...overrides,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Testes
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateEstimation()', () => {
  it('retorna priceMin < priceMax (INT-055)', () => {
    const result = calculateEstimation(buildInput())
    expect(result.priceMin).toBeLessThan(result.priceMax)
  })

  it('retorna daysMin < daysMax', () => {
    const result = calculateEstimation(buildInput())
    expect(result.daysMin).toBeLessThan(result.daysMax)
  })

  it('retorna complexity como ComplexityLevel válido (INT-054)', () => {
    const result = calculateEstimation(buildInput())
    const validLevels = Object.values(ComplexityLevel)
    expect(validLevels).toContain(result.complexity)
  })

  it('complexity LOW para score 0-30', () => {
    const result = calculateEstimation(buildInput({ accumulatedComplexity: 25 }))
    expect(result.complexity).toBe(ComplexityLevel.LOW)
  })

  it('complexity MEDIUM para score 31-50', () => {
    const result = calculateEstimation(buildInput({ accumulatedComplexity: 40 }))
    expect(result.complexity).toBe(ComplexityLevel.MEDIUM)
  })

  it('complexity HIGH para score 51-70', () => {
    const result = calculateEstimation(buildInput({ accumulatedComplexity: 60 }))
    expect(result.complexity).toBe(ComplexityLevel.HIGH)
  })

  it('complexity VERY_HIGH para score >= 71', () => {
    const result = calculateEstimation(buildInput({ accumulatedComplexity: 80 }))
    expect(result.complexity).toBe(ComplexityLevel.VERY_HIGH)
  })

  it('aplica fator ±15% no preço (INT-055 — faixa obrigatória)', () => {
    // accumulatedComplexity=25 → LOW → multiplier=1.0
    // finalPrice = (10000 + 5000) * 1.0 = 15000
    const result = calculateEstimation(buildInput({ accumulatedComplexity: 25 }))
    const finalPrice = (10000 + 5000) * 1.0
    expect(result.priceMin).toBe(Math.round(finalPrice * PRICE_RANGE_FACTOR.min))
    expect(result.priceMax).toBe(Math.round(finalPrice * PRICE_RANGE_FACTOR.max))
  })

  it('aplica fator ±10% no prazo', () => {
    const result = calculateEstimation(buildInput({ accumulatedComplexity: 25 }))
    const finalDays = (60 + 20) * 1.0
    expect(result.daysMin).toBe(Math.ceil(finalDays * DAYS_RANGE_FACTOR.min))
    expect(result.daysMax).toBe(Math.ceil(finalDays * DAYS_RANGE_FACTOR.max))
  })

  it('retorna features[] corretamente', () => {
    const result = calculateEstimation(buildInput())
    expect(result.features).toEqual(['autenticação', 'painel admin'])
  })

  it('retorna projectType correto', () => {
    const result = calculateEstimation(buildInput())
    expect(result.projectType).toBe(ProjectType.WEB_APP)
  })

  it('retorna currency e locale da sessão', () => {
    const result = calculateEstimation(buildInput())
    expect(result.currency).toBe(Currency.BRL)
    expect(result.locale).toBe(Locale.PT_BR)
  })

  it('retorna complexityScore correto', () => {
    const result = calculateEstimation(buildInput({ accumulatedComplexity: 42 }))
    expect(result.complexityScore).toBe(42)
  })

  it('aplica multiplicador MEDIUM (1.3) para score=40', () => {
    // finalPrice = (10000 + 5000) * 1.3 = 19500
    const result = calculateEstimation(buildInput({ accumulatedComplexity: 40 }))
    const finalPrice = (10000 + 5000) * 1.3
    expect(result.priceMin).toBe(Math.round(finalPrice * PRICE_RANGE_FACTOR.min))
    expect(result.priceMax).toBe(Math.round(finalPrice * PRICE_RANGE_FACTOR.max))
  })

  it('lança INV-001 se priceMin >= priceMax por arredondamento extremo', () => {
    // Caso improvável mas protegido pelo invariante
    // Com accumulatedPrice=0 e base_price muito pequena os valores podem ser iguais
    // Usar preço minúsculo para forçar arredondamento para mesmo valor
    const tinyConfig = {
      ...mockPricingConfig,
      base_price: 0.001,
      base_days:  1,
      complexity_multiplier_low: 1.0,
    }
    // Math.round(0.001 * 0.85) = 0, Math.round(0.001 * 1.15) = 0 → INV-001
    expect(() =>
      calculateEstimation(buildInput({ pricingConfig: tinyConfig, accumulatedPrice: 0 }))
    ).toThrow('INV-001')
  })

  // ── Testes de fronteira de complexidade (GAP-005) ─────────────────────────

  it('score=30 → LOW (borda superior)', () => {
    const result = calculateEstimation(buildInput({ accumulatedComplexity: 30 }))
    expect(result.complexity).toBe(ComplexityLevel.LOW)
  })

  it('score=31 → MEDIUM (borda inferior)', () => {
    const result = calculateEstimation(buildInput({ accumulatedComplexity: 31 }))
    expect(result.complexity).toBe(ComplexityLevel.MEDIUM)
  })

  it('score=50 → MEDIUM (borda superior)', () => {
    const result = calculateEstimation(buildInput({ accumulatedComplexity: 50 }))
    expect(result.complexity).toBe(ComplexityLevel.MEDIUM)
  })

  it('score=51 → HIGH (borda inferior)', () => {
    const result = calculateEstimation(buildInput({ accumulatedComplexity: 51 }))
    expect(result.complexity).toBe(ComplexityLevel.HIGH)
  })

  it('score=70 → HIGH (borda superior)', () => {
    const result = calculateEstimation(buildInput({ accumulatedComplexity: 70 }))
    expect(result.complexity).toBe(ComplexityLevel.HIGH)
  })

  it('score=71 → VERY_HIGH (borda inferior)', () => {
    const result = calculateEstimation(buildInput({ accumulatedComplexity: 71 }))
    expect(result.complexity).toBe(ComplexityLevel.VERY_HIGH)
  })
})
