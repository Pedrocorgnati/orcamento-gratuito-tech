// src/lib/estimation/calculate.ts
// =============================================================================
// INVARIANTES DE NEGÓCIO — NÃO REMOVER
// =============================================================================
//
// INV-001 (INT-055): calculateEstimation() NUNCA retorna valor único de preço.
//   priceMin = finalPrice * 0.85  |  priceMax = finalPrice * 1.15
//   Violar este invariante quebra a promessa UX de "faixa de investimento".
//
// INV-002 (INT-054): complexity DEVE ser um dos 4 valores de ComplexityLevel.
//   Scores fora de todos os thresholds mapeiam para VERY_HIGH (fallback seguro).
//   Nunca retornar string arbitrária ou null.
//
// INV-003 (INT-051): O cálculo DEVE percorrer as 3 camadas em ordem:
//   Camada 1 (base) → Camada 2 (impactos acumulados) → Camada 3 (multiplicador).
//   Pular qualquer camada resulta em estimativa incorreta.
//
// INV-004: Este arquivo é SERVER-ONLY. Nunca importar em Client Components.
// =============================================================================

import 'server-only'
import { ComplexityLevel, Currency, Locale, ProjectType } from '@/lib/enums'

// ─────────────────────────────────────────────────────────────────────────────
// Tipos de entrada
// ─────────────────────────────────────────────────────────────────────────────

export interface PricingConfigData {
  base_price: number
  base_days: number
  complexity_multiplier_low: number
  complexity_multiplier_medium: number
  complexity_multiplier_high: number
  complexity_multiplier_very_high: number
  /** CL-281: versão semântica dos pesos/preços (snapshot no Lead) */
  version?: string
}

export interface CalculationInput {
  /** Valores já acumulados nas respostas da sessão */
  accumulatedPrice: number
  accumulatedTime: number
  accumulatedComplexity: number
  /** Configuração de precificação para o project_type da sessão */
  pricingConfig: PricingConfigData
  /** Tipo de projeto da sessão */
  projectType: ProjectType
  /** Lista de funcionalidades selecionadas (labels das opções) */
  features: string[]
  /** Locale da sessão */
  locale: Locale
  /** Moeda da sessão */
  currency: Currency
}

export interface EstimationCalculated {
  priceMin: number
  priceMax: number
  daysMin: number
  daysMax: number
  complexity: ComplexityLevel
  complexityScore: number
  features: string[]
  locale: Locale
  currency: Currency
  projectType: ProjectType
  /** CL-281: versão dos pesos utilizada neste cálculo */
  pricingVersion: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

/** Fatores de faixa — INT-055: NUNCA valor único */
export const PRICE_RANGE_FACTOR = { min: 0.85, max: 1.15 } as const
export const DAYS_RANGE_FACTOR  = { min: 0.90, max: 1.10 } as const

/** Thresholds de complexidade — INT-054 */
const COMPLEXITY_THRESHOLDS: Array<[ComplexityLevel, number, number]> = [
  [ComplexityLevel.LOW,       0,  30],
  [ComplexityLevel.MEDIUM,   31,  50],
  [ComplexityLevel.HIGH,     51,  70],
  [ComplexityLevel.VERY_HIGH, 71, Infinity],
]

// ─────────────────────────────────────────────────────────────────────────────
// Helpers internos
// ─────────────────────────────────────────────────────────────────────────────

/** Mapeia score numérico para ComplexityLevel enum (INV-002) */
function scoreToComplexityLevel(score: number): ComplexityLevel {
  for (const [level, min, max] of COMPLEXITY_THRESHOLDS) {
    if (score >= min && score <= max) return level
  }
  return ComplexityLevel.VERY_HIGH // fallback seguro
}

/** Camada 1: Extrai preço e prazo base do PricingConfig */
function layer1Base(config: PricingConfigData): { basePrice: number; baseDays: number } {
  return {
    basePrice: config.base_price,
    baseDays:  config.base_days,
  }
}

/** Camada 3: Aplica multiplicador de complexidade */
function layer3Multiplier(
  config: PricingConfigData,
  complexityLevel: ComplexityLevel
): number {
  const multiplierMap: Record<ComplexityLevel, number> = {
    [ComplexityLevel.LOW]:       config.complexity_multiplier_low,
    [ComplexityLevel.MEDIUM]:    config.complexity_multiplier_medium,
    [ComplexityLevel.HIGH]:      config.complexity_multiplier_high,
    [ComplexityLevel.VERY_HIGH]: config.complexity_multiplier_very_high,
  }
  return multiplierMap[complexityLevel]
}

// ─────────────────────────────────────────────────────────────────────────────
// Função principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula estimativa de preço e prazo para um projeto.
 *
 * Algoritmo 3 camadas (INT-051):
 *   1. Preço base (PricingConfig)
 *   2. Impactos acumulados das respostas (accumulated_price, accumulated_time)
 *   3. Multiplicador de complexidade (complexity_multiplier_{level})
 *
 * REGRA INT-055: priceMin e priceMax NUNCA podem ser iguais.
 */
export function calculateEstimation(input: CalculationInput): EstimationCalculated {
  // Camada 1
  const { basePrice, baseDays } = layer1Base(input.pricingConfig)

  // Camada 2 — impactos já acumulados pela rota de respostas
  const complexityScore = input.accumulatedComplexity
  const accumulatedPrice = basePrice + input.accumulatedPrice
  const accumulatedDays  = baseDays  + input.accumulatedTime

  // Determina nível de complexidade (INV-002)
  const complexity = scoreToComplexityLevel(complexityScore)

  // Camada 3
  const multiplier   = layer3Multiplier(input.pricingConfig, complexity)
  const finalPrice   = accumulatedPrice * multiplier
  const finalDays    = accumulatedDays  * multiplier

  // Faixa ±15% preço / ±10% prazo — INT-055
  const priceMin = Math.round(finalPrice * PRICE_RANGE_FACTOR.min)
  const priceMax = Math.round(finalPrice * PRICE_RANGE_FACTOR.max)
  const daysMin  = Math.ceil(finalDays   * DAYS_RANGE_FACTOR.min)
  const daysMax  = Math.ceil(finalDays   * DAYS_RANGE_FACTOR.max)

  // Invariante de segurança — INV-001
  if (priceMin >= priceMax) {
    throw new Error(`INV-001: priceMin (${priceMin}) deve ser menor que priceMax (${priceMax})`)
  }
  if (daysMin >= daysMax) {
    throw new Error(`INV-002: daysMin (${daysMin}) deve ser menor que daysMax (${daysMax})`)
  }

  return {
    priceMin,
    priceMax,
    daysMin,
    daysMax,
    complexity,
    complexityScore,
    features: input.features,
    locale:      input.locale,
    currency:    input.currency,
    projectType: input.projectType,
    pricingVersion: input.pricingConfig.version ?? 'v1',
  }
}
