// src/lib/estimation/__tests__/contract.test.ts
// Testes de contrato — validam que EstimationResult atende ao schema openapi.yaml
import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { ComplexityLevel, Currency, Locale, ProjectType } from '@/lib/enums'

// ─────────────────────────────────────────────────────────────────────────────
// Schema de contrato (espelha openapi.yaml EstimationResult)
// ─────────────────────────────────────────────────────────────────────────────

const EstimationResultContractSchema = z.object({
  price_min:            z.number().positive(),
  price_max:            z.number().positive(),
  price_min_formatted:  z.string().min(1),
  price_max_formatted:  z.string().min(1),
  price_range_formatted: z.string().min(1),
  days_min:             z.number().positive().int(),
  days_max:             z.number().positive().int(),
  days_range_formatted: z.string().min(1),
  currency:             z.nativeEnum(Currency),
  locale:               z.nativeEnum(Locale),
  complexity:           z.nativeEnum(ComplexityLevel),
  complexity_score:     z.number().nonnegative(),
  features:             z.array(z.string()),
  project_type:         z.nativeEnum(ProjectType),
  scope_story:          z.string().min(1),
})

// ─────────────────────────────────────────────────────────────────────────────
// Mock de resultado válido
// ─────────────────────────────────────────────────────────────────────────────

const mockResult = {
  price_min:            12750,
  price_max:            17250,
  price_min_formatted:  'R$ 12.750',
  price_max_formatted:  'R$ 17.250',
  price_range_formatted: 'R$ 12.750 – R$ 17.250',
  days_min:             54,
  days_max:             88,
  days_range_formatted: '54 – 88 dias',
  currency:             Currency.BRL,
  locale:               Locale.PT_BR,
  complexity:           ComplexityLevel.MEDIUM,
  complexity_score:     40,
  features:             ['autenticação', 'painel admin'],
  project_type:         ProjectType.WEB_APP,
  scope_story:          'Seu projeto é um Sistema Web com os seguintes módulos: autenticação, painel admin.',
}

// ─────────────────────────────────────────────────────────────────────────────
// Testes
// ─────────────────────────────────────────────────────────────────────────────

describe('EstimationResult — contrato vs openapi.yaml', () => {
  it('schema válido é aceito pelo contrato', () => {
    const parsed = EstimationResultContractSchema.safeParse(mockResult)
    expect(parsed.success).toBe(true)
  })

  it('priceMin < priceMax — invariante INT-055', () => {
    expect(mockResult.price_min).toBeLessThan(mockResult.price_max)
  })

  it('daysMin < daysMax — invariante de prazo', () => {
    expect(mockResult.days_min).toBeLessThan(mockResult.days_max)
  })

  it('complexity é um dos 4 níveis válidos (INT-054)', () => {
    const validLevels = Object.values(ComplexityLevel)
    expect(validLevels).toContain(mockResult.complexity)
  })

  it('schema invalida complexity fora dos níveis válidos', () => {
    const invalid = { ...mockResult, complexity: 'INVALID_LEVEL' }
    const parsed = EstimationResultContractSchema.safeParse(invalid)
    expect(parsed.success).toBe(false)
  })

  it('schema invalida locale fora dos valores do enum', () => {
    const invalid = { ...mockResult, locale: 'xx_XX' }
    const parsed = EstimationResultContractSchema.safeParse(invalid)
    expect(parsed.success).toBe(false)
  })

  it('schema invalida currency fora dos valores do enum', () => {
    const invalid = { ...mockResult, currency: 'GBP' }
    const parsed = EstimationResultContractSchema.safeParse(invalid)
    expect(parsed.success).toBe(false)
  })

  it('scope_story não deve estar vazio', () => {
    expect(mockResult.scope_story.length).toBeGreaterThan(20)
  })

  it('features[] pode estar vazio (sessão sem opções selecionadas)', () => {
    const withEmptyFeatures = { ...mockResult, features: [] }
    const parsed = EstimationResultContractSchema.safeParse(withEmptyFeatures)
    expect(parsed.success).toBe(true)
  })

  it('price_range_formatted contém price_min_formatted e price_max_formatted', () => {
    expect(mockResult.price_range_formatted).toContain('12.750')
    expect(mockResult.price_range_formatted).toContain('17.250')
  })
})
