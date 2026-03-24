import type { ExchangeRates } from '@/lib/types'
import { Currency } from '@/lib/enums'

/**
 * Converte valor entre moedas usando tabela de taxas.
 * Retorna o valor arredondado para 2 casas decimais.
 * Se a taxa nao existir, retorna o valor original e emite warning.
 */
export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency,
  rates: ExchangeRates
): number {
  if (from === to) return amount

  const key = `${from}_${to}`
  const rate = rates.rates[to]

  // Se a moeda base da tabela == from, usa a taxa diretamente
  if (rates.baseCurrency === from && rate != null) {
    return Math.round(amount * rate * 100) / 100
  }

  // Tenta calcular via base (from -> base -> to)
  const fromRate = rates.rates[from]
  const toRate = rates.rates[to]

  if (fromRate != null && fromRate !== 0 && toRate != null) {
    const inBase = amount / fromRate
    return Math.round(inBase * toRate * 100) / 100
  }

  console.warn(
    `[convertCurrency] Taxa nao encontrada para ${key}. Retornando valor original.`
  )
  return amount
}

/**
 * Converte faixa de valores entre moedas.
 */
export function convertCurrencyRange(
  min: number,
  max: number,
  from: Currency,
  to: Currency,
  rates: ExchangeRates
): { min: number; max: number } {
  return {
    min: convertCurrency(min, from, to, rates),
    max: convertCurrency(max, from, to, rates),
  }
}

/**
 * Constroi objeto ExchangeRates a partir de pares chave-valor ou array de { currency, rate }.
 *
 * @example
 * buildExchangeRates(Currency.USD, { BRL: 5.05, EUR: 0.92, USD: 1 })
 * buildExchangeRates(Currency.USD, [{ currency: Currency.BRL, rate: 5.05 }, { currency: Currency.EUR, rate: 0.92 }])
 */
export function buildExchangeRates(
  baseCurrency: Currency,
  rates: Partial<Record<Currency, number>> | Array<{ currency: Currency; rate: number }>
): ExchangeRates {
  let ratesMap: Partial<Record<Currency, number>>

  if (Array.isArray(rates)) {
    ratesMap = {}
    for (const { currency, rate } of rates) {
      ratesMap[currency] = rate
    }
  } else {
    ratesMap = rates
  }

  const fullRates: Record<Currency, number> = {
    [Currency.BRL]: ratesMap[Currency.BRL] ?? 1,
    [Currency.USD]: ratesMap[Currency.USD] ?? 1,
    [Currency.EUR]: ratesMap[Currency.EUR] ?? 1,
  }

  // Garante que a moeda base sempre tem taxa 1
  fullRates[baseCurrency] = 1

  return {
    baseCurrency,
    rates: fullRates,
    updatedAt: new Date(),
  }
}
