import { prisma } from '@/lib/prisma'
import { ComplexityLevel, Currency, Locale, ProjectType } from '@/lib/enums'
import {
  calculateEstimation,
  generateScopeStory,
  fetchExchangeRates,
  getEstimationCurrency,
  convertEstimationPrices,
  formatEstimationRange,
  formatDaysRange,
} from '@/lib/estimation'

// ─────────────────────────────────────────────────────────────────────────────
// Tipos públicos
// ─────────────────────────────────────────────────────────────────────────────

export type EstimationResult = {
  price_min: number
  price_max: number
  price_min_formatted: string
  price_max_formatted: string
  price_range_formatted: string
  days_min: number
  days_max: number
  days_range_formatted: string
  currency: string
  locale: string
  complexity: ComplexityLevel
  complexity_score: number
  features: string[]
  project_type: string
  scope_story: string
}

export class EstimationError extends Error {
  constructor(
    public readonly code: 'ESTIMATE_050' | 'ESTIMATE_051' | 'ESTIMATE_052',
    message: string,
    public readonly fallbackCurrency?: Currency
  ) {
    super(message)
    this.name = 'EstimationError'
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers internos
// ─────────────────────────────────────────────────────────────────────────────

// RESOLVED: extraída query Prisma duplicada entre calculate() e calculateWithFallbackBrl() (G013)
async function _fetchSessionWithAnswers(sessionId: string) {
  return prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      answers: {
        orderBy: { step_number: 'asc' },
        include: {
          option: {
            include: {
              translations: { select: { locale: true, label: true } },
            },
          },
        },
      },
    },
  })
}

// RESOLVED: extraído loop de features duplicado entre calculate() e calculateWithFallbackBrl() (G010)
function _extractFeatures(
  answers: Array<{ option: { translations: Array<{ locale: string; label: string }> } | null }>,
  locale: string
): string[] {
  const features: string[] = []
  for (const answer of answers) {
    if (!answer.option) continue
    const tr = answer.option.translations
    const found =
      tr.find((t) => t.locale === locale) ??
      tr.find((t) => t.locale === Locale.PT_BR) ??
      tr[0]
    if (found?.label) features.push(found.label)
  }
  return features
}

function buildResultOutput(
  calculated: ReturnType<typeof calculateEstimation>,
  finalPriceMin: number,
  finalPriceMax: number,
  finalCurrency: Currency,
  locale: Locale,
  projectType: string,
  scopeStory: string
): EstimationResult {
  const priceRangeFormatted = formatEstimationRange(finalPriceMin, finalPriceMax, finalCurrency, locale)
  const daysRangeFormatted  = formatDaysRange(calculated.daysMin, calculated.daysMax, locale)
  const parts = priceRangeFormatted.split(' – ')

  return {
    price_min:            finalPriceMin,
    price_max:            finalPriceMax,
    price_min_formatted:  parts[0] ?? String(finalPriceMin),
    price_max_formatted:  parts[1] ?? String(finalPriceMax),
    price_range_formatted: priceRangeFormatted,
    days_min:             calculated.daysMin,
    days_max:             calculated.daysMax,
    days_range_formatted: daysRangeFormatted,
    currency:             finalCurrency,
    locale,
    complexity:           calculated.complexity,
    complexity_score:     calculated.complexityScore,
    features:             calculated.features,
    project_type:         projectType,
    scope_story:          scopeStory,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

export class EstimationService {
  /**
   * Calcula estimativa completa para uma sessão COMPLETED.
   * Lança EstimationError para erros de domínio.
   */
  async calculate(sessionId: string): Promise<EstimationResult> {
    const session = await _fetchSessionWithAnswers(sessionId)

    if (!session) {
      throw new EstimationError('ESTIMATE_051', `Sessão não encontrada: ${sessionId}`)
    }

    // ESTIMATE_050: project_type ausente
    if (!session.project_type) {
      throw new EstimationError(
        'ESTIMATE_050',
        'project_type ausente — responda as perguntas iniciais.'
      )
    }

    // ESTIMATE_051: PricingConfig ausente
    const pricingConfig = await prisma.pricingConfig.findFirst({
      where: { project_type: session.project_type },
    })
    if (!pricingConfig) {
      throw new EstimationError(
        'ESTIMATE_051',
        `PricingConfig não encontrada para project_type=${session.project_type}`
      )
    }

    const locale   = (session.locale as Locale) ?? Locale.PT_BR
    const currency = getEstimationCurrency(locale)
    const features = _extractFeatures(session.answers, session.locale ?? locale)

    const calculated = calculateEstimation({
      accumulatedPrice:      session.accumulated_price,
      accumulatedTime:       session.accumulated_time,
      accumulatedComplexity: session.accumulated_complexity,
      pricingConfig: {
        base_price:                      pricingConfig.base_price,
        base_days:                       pricingConfig.base_days,
        complexity_multiplier_low:       pricingConfig.complexity_multiplier_low,
        complexity_multiplier_medium:    pricingConfig.complexity_multiplier_medium,
        complexity_multiplier_high:      pricingConfig.complexity_multiplier_high,
        complexity_multiplier_very_high: pricingConfig.complexity_multiplier_very_high,
      },
      projectType: session.project_type as ProjectType,
      features,
      locale,
      currency,
    })

    // Converter moeda — ESTIMATE_052 se taxa indisponível
    let finalPriceMin = calculated.priceMin
    let finalPriceMax = calculated.priceMax
    let finalCurrency = currency

    if (currency !== Currency.BRL) {
      const exchangeRates = await fetchExchangeRates()
      try {
        const converted = convertEstimationPrices(
          calculated.priceMin,
          calculated.priceMax,
          currency,
          exchangeRates
        )
        finalPriceMin = converted.priceMin
        finalPriceMax = converted.priceMax
        finalCurrency = converted.currency
      } catch (err: unknown) {
        const e = err as { code?: string }
        if (e?.code === 'ESTIMATE_052') {
          throw new EstimationError(
            'ESTIMATE_052',
            `Taxa BRL→${currency} indisponível. Exibindo em BRL.`,
            Currency.BRL
          )
        }
        throw err
      }
    }

    const scopeStory = generateScopeStory(
      calculated.features,
      session.project_type as ProjectType,
      locale
    )

    return buildResultOutput(calculated, finalPriceMin, finalPriceMax, finalCurrency, locale, session.project_type, scopeStory)
  }

  /**
   * Recalcula estimativa forçando moeda BRL (fallback ESTIMATE_052).
   */
  async calculateWithFallbackBrl(sessionId: string): Promise<EstimationResult> {
    const session = await _fetchSessionWithAnswers(sessionId)

    if (!session?.project_type) {
      throw new EstimationError('ESTIMATE_051', 'Sessão inválida para fallback BRL.')
    }

    const pricingConfig = await prisma.pricingConfig.findFirst({
      where: { project_type: session.project_type },
    })
    if (!pricingConfig) {
      throw new EstimationError('ESTIMATE_051', `PricingConfig não encontrada: ${session.project_type}`)
    }

    const locale   = (session.locale as Locale) ?? Locale.PT_BR
    const currency = Currency.BRL
    const features = _extractFeatures(session.answers, session.locale ?? locale)

    const calculated = calculateEstimation({
      accumulatedPrice:      session.accumulated_price,
      accumulatedTime:       session.accumulated_time,
      accumulatedComplexity: session.accumulated_complexity,
      pricingConfig: {
        base_price:                      pricingConfig.base_price,
        base_days:                       pricingConfig.base_days,
        complexity_multiplier_low:       pricingConfig.complexity_multiplier_low,
        complexity_multiplier_medium:    pricingConfig.complexity_multiplier_medium,
        complexity_multiplier_high:      pricingConfig.complexity_multiplier_high,
        complexity_multiplier_very_high: pricingConfig.complexity_multiplier_very_high,
      },
      projectType: session.project_type as ProjectType,
      features,
      locale,
      currency,
    })

    const scopeStory = generateScopeStory(
      calculated.features,
      session.project_type as ProjectType,
      locale
    )

    return buildResultOutput(calculated, calculated.priceMin, calculated.priceMax, currency, locale, session.project_type, scopeStory)
  }

  inferComplexityLevel(score: number): ComplexityLevel {
    if (score <= 30) return ComplexityLevel.LOW
    if (score <= 50) return ComplexityLevel.MEDIUM
    if (score <= 70) return ComplexityLevel.HIGH
    return ComplexityLevel.VERY_HIGH
  }
}

export const estimationService = new EstimationService()
