import { prisma } from '@/lib/prisma'
import { ComplexityLevel, Currency, Locale, ProjectType, QuestionType } from '@/lib/enums'
import {
  generateScopeStory,
  fetchExchangeRates,
  getEstimationCurrency,
  convertEstimationPrices,
  formatEstimationRange,
  formatDaysRange,
} from '@/lib/estimation'
import { extractUserNarrativeFromAnswers } from '@/lib/estimation/scope-story'
import { BLOCK_TO_PROJECT_TYPE, normalizeProjectTypes } from '@/lib/project-config'

// ─────────────────────────────────────────────────────────────────────────────
// Tipos públicos
// ─────────────────────────────────────────────────────────────────────────────

type ProjectTypeBreakdown = {
  project_type: string
  price_min: number
  price_max: number
  days_min: number
  days_max: number
  complexity: ComplexityLevel
  complexity_score: number
  features: string[]
}

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
  project_types: string[]
  scope_story: string
  breakdown: ProjectTypeBreakdown[]
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
          question: {
            select: { type: true, block: true, code: true },
          },
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

function _deriveScopedAccumulators(
  answers: Array<{
    question: { type: string; block: string }
    price_impact_snapshot: number
    time_impact_snapshot: number
    complexity_impact_snapshot: number
  }>
) {
  const scopedAnswers = answers.filter(
    (answer) =>
      answer.question.type !== QuestionType.BUDGET_SELECT &&
      answer.question.type !== QuestionType.DEADLINE_SELECT
  )

  return {
    accumulatedPrice: scopedAnswers.reduce((sum, answer) => sum + answer.price_impact_snapshot, 0),
    accumulatedTime: scopedAnswers.reduce((sum, answer) => sum + answer.time_impact_snapshot, 0),
    accumulatedComplexity: scopedAnswers.reduce((sum, answer) => sum + answer.complexity_impact_snapshot, 0),
  }
}

function _derivePerTypeAccumulators(
  projectTypes: ProjectType[],
  answers: Array<{
    question: { type: string; block: string }
    price_impact_snapshot: number
    time_impact_snapshot: number
    complexity_impact_snapshot: number
    option: { translations: Array<{ locale: string; label: string }> } | null
  }>,
  locale: string
) {
  const result = new Map<ProjectType, {
    accumulatedPrice: number
    accumulatedTime: number
    accumulatedComplexity: number
    features: string[]
  }>()

  for (const projectType of projectTypes) {
    result.set(projectType, {
      accumulatedPrice: 0,
      accumulatedTime: 0,
      accumulatedComplexity: 0,
      features: [],
    })
  }

  for (const answer of answers) {
    if (
      answer.question.type === QuestionType.BUDGET_SELECT ||
      answer.question.type === QuestionType.DEADLINE_SELECT
    ) {
      continue
    }

    const projectType = BLOCK_TO_PROJECT_TYPE[answer.question.block as keyof typeof BLOCK_TO_PROJECT_TYPE]
    if (!projectType || !result.has(projectType)) continue

    const current = result.get(projectType)!
    current.accumulatedPrice += answer.price_impact_snapshot
    current.accumulatedTime += answer.time_impact_snapshot
    current.accumulatedComplexity += answer.complexity_impact_snapshot

    if (answer.option) {
      const tr = answer.option.translations
      const found =
        tr.find((t) => t.locale === locale) ??
        tr.find((t) => t.locale === Locale.PT_BR) ??
        tr[0]
      if (found?.label) current.features.push(found.label)
    }
  }

  return result
}

function _inferComplexityLevel(score: number): ComplexityLevel {
  if (score <= 30) return ComplexityLevel.LOW
  if (score <= 50) return ComplexityLevel.MEDIUM
  if (score <= 70) return ComplexityLevel.HIGH
  return ComplexityLevel.VERY_HIGH
}

function _getComplexityMultiplier(
  pricingConfig: {
    complexity_multiplier_low: number
    complexity_multiplier_medium: number
    complexity_multiplier_high: number
    complexity_multiplier_very_high: number
  },
  complexity: ComplexityLevel
) {
  const multiplierMap: Record<ComplexityLevel, number> = {
    [ComplexityLevel.LOW]: pricingConfig.complexity_multiplier_low,
    [ComplexityLevel.MEDIUM]: pricingConfig.complexity_multiplier_medium,
    [ComplexityLevel.HIGH]: pricingConfig.complexity_multiplier_high,
    [ComplexityLevel.VERY_HIGH]: pricingConfig.complexity_multiplier_very_high,
  }

  return multiplierMap[complexity]
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
  payload: {
    priceMin: number
    priceMax: number
    daysMin: number
    daysMax: number
    complexity: ComplexityLevel
    complexityScore: number
    features: string[]
    breakdown: ProjectTypeBreakdown[]
  },
  finalPriceMin: number,
  finalPriceMax: number,
  finalCurrency: Currency,
  locale: Locale,
  projectType: string,
  projectTypes: string[],
  scopeStory: string
): EstimationResult {
  const priceRangeFormatted = formatEstimationRange(finalPriceMin, finalPriceMax, finalCurrency, locale)
  const daysRangeFormatted  = formatDaysRange(payload.daysMin, payload.daysMax, locale)
  const parts = priceRangeFormatted.split(' – ')

  return {
    price_min:            finalPriceMin,
    price_max:            finalPriceMax,
    price_min_formatted:  parts[0] ?? String(finalPriceMin),
    price_max_formatted:  parts[1] ?? String(finalPriceMax),
    price_range_formatted: priceRangeFormatted,
    days_min:             payload.daysMin,
    days_max:             payload.daysMax,
    days_range_formatted: daysRangeFormatted,
    currency:             finalCurrency,
    locale,
    complexity:           payload.complexity,
    complexity_score:     payload.complexityScore,
    features:             payload.features,
    project_type:         projectType,
    project_types:        projectTypes,
    scope_story:          scopeStory,
    breakdown:            payload.breakdown,
  }
}

async function _calculateMultiProjectEstimation(
  session: Awaited<ReturnType<typeof _fetchSessionWithAnswers>>,
  currency: Currency
) {
  if (!session) {
    throw new EstimationError('ESTIMATE_051', 'Sessão inválida para estimativa.')
  }

  const locale = (session.locale as Locale) ?? Locale.PT_BR
  const projectTypes = normalizeProjectTypes(session.project_types, session.project_type)

  if (projectTypes.length === 0) {
    throw new EstimationError(
      'ESTIMATE_050',
      'project_type ausente — responda as perguntas iniciais.'
    )
  }

  const pricingConfigs = await prisma.pricingConfig.findMany({
    where: { project_type: { in: projectTypes } },
  })

  const pricingConfigMap = new Map(pricingConfigs.map((config) => [config.project_type as ProjectType, config]))

  for (const projectType of projectTypes) {
    if (!pricingConfigMap.has(projectType)) {
      throw new EstimationError(
        'ESTIMATE_051',
        `PricingConfig não encontrada para project_type=${projectType}`
      )
    }
  }

  const features = _extractFeatures(session.answers, session.locale ?? locale)
  const scopedAccumulators = _deriveScopedAccumulators(session.answers)
  const perTypeAccumulators = _derivePerTypeAccumulators(projectTypes, session.answers, session.locale ?? locale)

  const breakdown: ProjectTypeBreakdown[] = []
  let basePriceSum = 0
  let baseDaysSum = 0

  for (const projectType of projectTypes) {
    const pricingConfig = pricingConfigMap.get(projectType)!
    const accumulators = perTypeAccumulators.get(projectType) ?? {
      accumulatedPrice: 0,
      accumulatedTime: 0,
      accumulatedComplexity: 0,
      features: [],
    }

    const complexity = _inferComplexityLevel(accumulators.accumulatedComplexity)
    const multiplier = _getComplexityMultiplier(pricingConfig, complexity)
    const adjustedBasePrice = pricingConfig.base_price * multiplier
    const adjustedBaseDays = pricingConfig.base_days * multiplier

    basePriceSum += adjustedBasePrice
    baseDaysSum += adjustedBaseDays

    breakdown.push({
      project_type: projectType,
      price_min: Math.round(adjustedBasePrice * 0.85),
      price_max: Math.round(adjustedBasePrice * 1.15),
      days_min: Math.ceil(adjustedBaseDays * 0.9),
      days_max: Math.ceil(adjustedBaseDays * 1.1),
      complexity,
      complexity_score: accumulators.accumulatedComplexity,
      features: accumulators.features,
    })
  }

  const overlapFactor = projectTypes.length > 1 ? 0.7 : 1
  const finalBasePrice = basePriceSum + scopedAccumulators.accumulatedPrice
  const finalBaseDays = Math.max(
    1,
    Math.round((baseDaysSum * overlapFactor) + scopedAccumulators.accumulatedTime)
  )
  const complexityScore = scopedAccumulators.accumulatedComplexity
  const complexity = _inferComplexityLevel(complexityScore)

  return {
    locale,
    projectTypes,
    primaryProjectType: session.project_type ?? projectTypes[0],
    features,
    breakdown,
    priceMin: Math.round(finalBasePrice * 0.85),
    priceMax: Math.round(finalBasePrice * 1.15),
    daysMin: Math.ceil(finalBaseDays * 0.9),
    daysMax: Math.ceil(finalBaseDays * 1.1),
    complexity,
    complexityScore,
    currency,
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

    const locale   = (session.locale as Locale) ?? Locale.PT_BR
    const currency = getEstimationCurrency(locale)
    const calculated = await _calculateMultiProjectEstimation(session, currency)

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

    const userNarrative = extractUserNarrativeFromAnswers(session.answers)
    const scopeStory = generateScopeStory(
      calculated.features,
      calculated.projectTypes,
      locale,
      userNarrative
    )

    return buildResultOutput(
      calculated,
      finalPriceMin,
      finalPriceMax,
      finalCurrency,
      locale,
      calculated.primaryProjectType,
      calculated.projectTypes,
      scopeStory
    )
  }

  /**
   * Recalcula estimativa forçando moeda BRL (fallback ESTIMATE_052).
   */
  async calculateWithFallbackBrl(sessionId: string): Promise<EstimationResult> {
    const session = await _fetchSessionWithAnswers(sessionId)

    if (!session) {
      throw new EstimationError('ESTIMATE_051', 'Sessão inválida para fallback BRL.')
    }

    const locale   = (session.locale as Locale) ?? Locale.PT_BR
    const currency = Currency.BRL
    const calculated = await _calculateMultiProjectEstimation(session, currency)

    const userNarrative = extractUserNarrativeFromAnswers(session.answers)
    const scopeStory = generateScopeStory(
      calculated.features,
      calculated.projectTypes,
      locale,
      userNarrative
    )

    return buildResultOutput(
      calculated,
      calculated.priceMin,
      calculated.priceMax,
      currency,
      locale,
      calculated.primaryProjectType,
      calculated.projectTypes,
      scopeStory
    )
  }

  inferComplexityLevel(score: number): ComplexityLevel {
    return _inferComplexityLevel(score)
  }
}

export const estimationService = new EstimationService()
