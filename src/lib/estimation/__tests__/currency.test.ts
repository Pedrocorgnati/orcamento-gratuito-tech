// src/lib/estimation/__tests__/currency.test.ts
import { describe, it, expect, vi } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    exchangeRate: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/utils', () => ({
  buildExchangeRates: vi.fn(),
  convertCurrency: vi.fn(),
  formatCurrency: vi.fn(),
  formatDaysRange: vi.fn(),
}))

import {
  getEstimationCurrency,
  convertEstimationPrices,
  formatEstimationRange,
} from '../currency'
import { Currency, Locale } from '@/lib/enums'
import { convertCurrency, formatCurrency } from '@/lib/utils'
import type { ExchangeRates } from '@/lib/types'

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const mockRates: ExchangeRates = {
  baseCurrency: Currency.BRL,
  rates: {
    [Currency.BRL]: 1,
    [Currency.USD]: 0.2,
    [Currency.EUR]: 0.18,
  },
  updatedAt: new Date(),
}

// ─────────────────────────────────────────────────────────────────────────────
// getEstimationCurrency()
// ─────────────────────────────────────────────────────────────────────────────

describe('getEstimationCurrency()', () => {
  it('PT_BR → BRL', () => {
    expect(getEstimationCurrency(Locale.PT_BR)).toBe(Currency.BRL)
  })

  it('EN_US → USD', () => {
    expect(getEstimationCurrency(Locale.EN_US)).toBe(Currency.USD)
  })

  it('ES_ES → EUR', () => {
    expect(getEstimationCurrency(Locale.ES_ES)).toBe(Currency.EUR)
  })

  it('IT_IT → EUR', () => {
    expect(getEstimationCurrency(Locale.IT_IT)).toBe(Currency.EUR)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// convertEstimationPrices()
// ─────────────────────────────────────────────────────────────────────────────

describe('convertEstimationPrices()', () => {
  it('BRL→BRL retorna sem conversão', () => {
    const result = convertEstimationPrices(10000, 15000, Currency.BRL, mockRates)
    expect(result).toEqual({
      priceMin: 10000,
      priceMax: 15000,
      currency: Currency.BRL,
    })
    // convertCurrency NÃO deve ser chamado
    expect(convertCurrency).not.toHaveBeenCalled()
  })

  it('rates null retorna BRL', () => {
    const result = convertEstimationPrices(10000, 15000, Currency.USD, null)
    expect(result).toEqual({
      priceMin: 10000,
      priceMax: 15000,
      currency: Currency.BRL,
    })
  })

  it('conversão BRL→USD com sucesso', () => {
    vi.mocked(convertCurrency)
      .mockReturnValueOnce(2000) // priceMin convertido
      .mockReturnValueOnce(3000) // priceMax convertido

    const result = convertEstimationPrices(10000, 15000, Currency.USD, mockRates)
    expect(result).toEqual({
      priceMin: 2000,
      priceMax: 3000,
      currency: Currency.USD,
    })
  })

  it('lança ESTIMATE_052 quando convertCurrency retorna valor original (taxa ausente)', () => {
    // convertCurrency retorna o mesmo valor → indica que não houve conversão real
    vi.mocked(convertCurrency)
      .mockReturnValueOnce(10000)
      .mockReturnValueOnce(15000)

    expect(() =>
      convertEstimationPrices(10000, 15000, Currency.USD, mockRates)
    ).toThrow('ESTIMATE_052')
  })

  it('lança INV-003 quando min >= max após conversão', () => {
    // Simula arredondamento que faz min >= max
    vi.mocked(convertCurrency)
      .mockReturnValueOnce(100.6) // Math.round → 101
      .mockReturnValueOnce(100.4) // Math.round → 100

    expect(() =>
      convertEstimationPrices(10000, 15000, Currency.USD, mockRates)
    ).toThrow('INV-003')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// formatEstimationRange()
// ─────────────────────────────────────────────────────────────────────────────

describe('formatEstimationRange()', () => {
  it('formata faixa BRL/pt_BR corretamente', () => {
    vi.mocked(formatCurrency)
      .mockReturnValueOnce('R$ 12.750')
      .mockReturnValueOnce('R$ 17.250')

    const result = formatEstimationRange(12750, 17250, Currency.BRL, Locale.PT_BR)
    expect(result).toBe('R$ 12.750 – R$ 17.250')
    expect(formatCurrency).toHaveBeenCalledWith(12750, Currency.BRL, Locale.PT_BR)
    expect(formatCurrency).toHaveBeenCalledWith(17250, Currency.BRL, Locale.PT_BR)
  })
})
