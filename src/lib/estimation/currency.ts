// src/lib/estimation/currency.ts
import 'server-only'
import { prisma } from '@/lib/prisma'
import { Currency, Locale, LOCALE_CURRENCY_MAP } from '@/lib/enums'
import { buildExchangeRates, convertCurrency, formatCurrency, formatDaysRange } from '@/lib/utils'
import type { ExchangeRates } from '@/lib/types'

// ─────────────────────────────────────────────────────────────────────────────
// Busca de taxas de câmbio
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Busca taxas de câmbio do banco e constrói o objeto ExchangeRates.
 * Sempre usa BRL como moeda base (INT-053).
 * Retorna null se não houver nenhuma taxa cadastrada (fallback BRL).
 */
export async function fetchExchangeRates(): Promise<ExchangeRates | null> {
  const records = await prisma.exchangeRate.findMany({
    where: { from_currency: Currency.BRL },
    select: { to_currency: true, rate: true },
    orderBy: { updated_at: 'desc' },
  })

  if (records.length === 0) return null

  const rateEntries = records.map((r) => ({
    currency: r.to_currency as Currency,
    rate:     r.rate,
  }))

  return buildExchangeRates(Currency.BRL, rateEntries)
}

// ─────────────────────────────────────────────────────────────────────────────
// Determinação de moeda por locale
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Determina a moeda do visitante com base no locale.
 * Mapeamento: PT_BR→BRL, EN_US→USD, ES_ES→EUR, IT_IT→EUR
 * INT-109: locale determina moeda
 */
export function getEstimationCurrency(locale: Locale): Currency {
  return LOCALE_CURRENCY_MAP[locale] ?? Currency.BRL
}

// ─────────────────────────────────────────────────────────────────────────────
// Conversão e formatação
// ─────────────────────────────────────────────────────────────────────────────

interface ConvertedPrices {
  priceMin: number
  priceMax: number
  currency: Currency
}

/**
 * Converte faixa de preços de BRL para a moeda alvo.
 * Reutiliza convertCurrency() de module-2 — NÃO redefinir.
 * Se rates for null ou moeda for BRL, retorna valores sem conversão.
 *
 * ESTIMATE_052: lança erro com code se taxa indisponível para moeda não-BRL.
 */
export function convertEstimationPrices(
  priceMinBrl: number,
  priceMaxBrl: number,
  targetCurrency: Currency,
  rates: ExchangeRates | null
): ConvertedPrices {
  if (targetCurrency === Currency.BRL || rates === null) {
    return { priceMin: priceMinBrl, priceMax: priceMaxBrl, currency: Currency.BRL }
  }

  const convertedMin = convertCurrency(priceMinBrl, Currency.BRL, targetCurrency, rates)
  const convertedMax = convertCurrency(priceMaxBrl, Currency.BRL, targetCurrency, rates)

  // Verificação de fallback: se convertCurrency retornou o valor original (taxa ausente ou default 1.0)
  if (convertedMin === priceMinBrl && convertedMax === priceMaxBrl) {
    const err = Object.assign(
      new Error(`ESTIMATE_052: taxa BRL→${targetCurrency} indisponível`),
      { code: 'ESTIMATE_052', fallbackCurrency: Currency.BRL }
    )
    throw err
  }

  const priceMin = Math.round(convertedMin)
  const priceMax = Math.round(convertedMax)

  // Invariante: após conversão, priceMin ainda deve ser < priceMax
  if (priceMin >= priceMax) {
    throw new Error('INV-003: conversão de moeda produziu priceMin >= priceMax')
  }

  return { priceMin, priceMax, currency: targetCurrency }
}

/**
 * Formata faixa de preço como string localizada.
 * Reutiliza formatCurrency() de module-2 — NÃO redefinir.
 * Exemplo pt-BR: "R$ 15.000 – R$ 21.000"
 */
export function formatEstimationRange(
  priceMin: number,
  priceMax: number,
  currency: Currency,
  locale: Locale
): string {
  const formattedMin = formatCurrency(priceMin, currency, locale)
  const formattedMax = formatCurrency(priceMax, currency, locale)
  return `${formattedMin} – ${formattedMax}`
}

/**
 * Formata faixa de prazo como string localizada.
 * Reutiliza formatDaysRange() de module-2 — NÃO redefinir.
 */
export { formatDaysRange }
