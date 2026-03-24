// src/lib/scoring/calculateLeadScore.ts
import { LeadScore, ComplexityLevel } from '@/lib/enums'

// Constantes de threshold e pontuação
const THRESHOLDS = {
  // Budget ratios (userBudget / priceMin)
  BUDGET_FULL: 1.0, // >= 100% → 35-40 pts
  BUDGET_HIGH: 0.7, // >= 70%  → 20-34 pts
  BUDGET_MED: 0.5, // >= 50%  → 10-19 pts
  //                  < 50%   → 0-9 pts

  // Timeline ratios (userDeadlineDays / daysMin)
  TIMELINE_FULL: 1.0, // >= 100% → 25-30 pts
  TIMELINE_HIGH: 0.8, // >= 80%  → 15-24 pts
  TIMELINE_MED: 0.6, // >= 60%  → 5-14 pts
  //                   < 60%   → 0-4 pts

  // Classificação total
  SCORE_A: 70, // >= 70 → A
  SCORE_B: 40, // >= 40 → B, < 40 → C
} as const

// Pontuação por campo de perfil
const PROFILE_POINTS = {
  EMAIL: 15, // email fornecido (obrigatório)
  COMPANY: 5, // empresa fornecida
  PHONE: 5, // telefone fornecido
  HIGH_COMPLEXITY: 5, // projeto HIGH ou VERY_HIGH
} as const

/** Subset da EstimationResult necessário para o cálculo de score */
export interface EstimationForScoring {
  priceMin: number
  daysMin: number
  complexity: ComplexityLevel | string
}

export interface ScoringInput {
  /** Valor monetário selecionado pelo usuário no budget_select */
  userBudget: number
  /** Prazo em dias selecionado pelo usuário no deadline_select */
  userDeadlineDays: number
  /** Dados de estimativa mínimos para cálculo */
  estimation: EstimationForScoring
  /** Dados do lead para dimensão de perfil */
  lead: {
    email: string
    phone?: string | null
    company?: string | null
  }
}

export interface LeadScoreResult {
  score_budget: number // 0-40
  score_timeline: number // 0-30
  score_profile: number // 0-30
  score_total: number // 0-100
  score: LeadScore // A | B | C
}

/**
 * Calcula a pontuação do lead em 3 dimensões.
 * Função pura: sem side effects, mesmo input → mesmo output.
 *
 * @param input - Dados de budget, timeline, estimation e perfil do lead
 * @returns LeadScoreResult com pontuações detalhadas e classificação final
 */
export function calculateLeadScore(input: ScoringInput): LeadScoreResult {
  const { userBudget, userDeadlineDays, estimation, lead } = input

  // ─── Dimensão 1: Budget (0-40 pts) ────────────────────────────────────────
  const score_budget = calculateBudgetScore(userBudget, estimation.priceMin)

  // ─── Dimensão 2: Timeline (0-30 pts) ──────────────────────────────────────
  const score_timeline = calculateTimelineScore(userDeadlineDays, estimation.daysMin)

  // ─── Dimensão 3: Perfil (0-30 pts) ────────────────────────────────────────
  const score_profile = calculateProfileScore(lead, estimation.complexity)

  // ─── Total e Classificação ─────────────────────────────────────────────────
  const score_total = score_budget + score_timeline + score_profile
  const score = classifyScore(score_total)

  return { score_budget, score_timeline, score_profile, score_total, score }
}

// ─────────────────────────────────────────────────────────────────────────────
// Funções auxiliares internas
// ─────────────────────────────────────────────────────────────────────────────

function calculateBudgetScore(userBudget: number, priceMin: number): number {
  if (priceMin <= 0) return 0

  const ratio = userBudget / priceMin

  if (ratio >= THRESHOLDS.BUDGET_FULL) {
    // >= 100% do priceMin: 35-40 pts (bônus proporcional ao excedente)
    const excess = Math.min((ratio - 1.0) * 20, 5)
    return Math.round(35 + excess)
  }

  if (ratio >= THRESHOLDS.BUDGET_HIGH) {
    // 70-99% do priceMin: 20-34 pts
    const rangeRatio =
      (ratio - THRESHOLDS.BUDGET_HIGH) / (THRESHOLDS.BUDGET_FULL - THRESHOLDS.BUDGET_HIGH)
    return Math.round(20 + rangeRatio * 14)
  }

  if (ratio >= THRESHOLDS.BUDGET_MED) {
    // 50-69% do priceMin: 10-19 pts
    const rangeRatio =
      (ratio - THRESHOLDS.BUDGET_MED) / (THRESHOLDS.BUDGET_HIGH - THRESHOLDS.BUDGET_MED)
    return Math.round(10 + rangeRatio * 9)
  }

  // < 50% do priceMin: 0-9 pts
  const rangeRatio = Math.max(0, ratio / THRESHOLDS.BUDGET_MED)
  return Math.round(rangeRatio * 9)
}

function calculateTimelineScore(userDeadlineDays: number, daysMin: number): number {
  if (daysMin <= 0) return 0

  const ratio = userDeadlineDays / daysMin

  if (ratio >= THRESHOLDS.TIMELINE_FULL) {
    // >= 100% dos daysMin: 25-30 pts
    const excess = Math.min((ratio - 1.0) * 10, 5)
    return Math.round(25 + excess)
  }

  if (ratio >= THRESHOLDS.TIMELINE_HIGH) {
    // 80-99%: 15-24 pts
    const rangeRatio =
      (ratio - THRESHOLDS.TIMELINE_HIGH) / (THRESHOLDS.TIMELINE_FULL - THRESHOLDS.TIMELINE_HIGH)
    return Math.round(15 + rangeRatio * 9)
  }

  if (ratio >= THRESHOLDS.TIMELINE_MED) {
    // 60-79%: 5-14 pts
    const rangeRatio =
      (ratio - THRESHOLDS.TIMELINE_MED) / (THRESHOLDS.TIMELINE_HIGH - THRESHOLDS.TIMELINE_MED)
    return Math.round(5 + rangeRatio * 9)
  }

  // < 60%: 0-4 pts
  const rangeRatio = Math.max(0, ratio / THRESHOLDS.TIMELINE_MED)
  return Math.round(rangeRatio * 4)
}

function calculateProfileScore(
  lead: { email: string; phone?: string | null; company?: string | null },
  complexity: ComplexityLevel | string
): number {
  let score = 0

  if (lead.email && lead.email.trim().length > 0) {
    score += PROFILE_POINTS.EMAIL
  }

  if (lead.company && lead.company.trim().length > 0) {
    score += PROFILE_POINTS.COMPANY
  }

  if (lead.phone && lead.phone.trim().length > 0) {
    score += PROFILE_POINTS.PHONE
  }

  if (complexity === ComplexityLevel.HIGH || complexity === ComplexityLevel.VERY_HIGH) {
    score += PROFILE_POINTS.HIGH_COMPLEXITY
  }

  return Math.min(score, 30)
}

function classifyScore(total: number): LeadScore {
  if (total >= THRESHOLDS.SCORE_A) return LeadScore.A
  if (total >= THRESHOLDS.SCORE_B) return LeadScore.B
  return LeadScore.C
}
