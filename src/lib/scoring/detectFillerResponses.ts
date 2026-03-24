import 'server-only'

export type SuspiciousPattern = 'TOO_FAST' | 'TOO_UNIFORM' | 'BUDGET_MISMATCH' | null

export interface FillerDetectionInput {
  /** Timestamps de cada resposta em ms desde início da sessão */
  answerTimestampsMs: number[]
  /** Índices de ordem das opções selecionadas para detectar uniformidade */
  selectedOptionIndexes: number[]
  /** Budget selecionado pelo usuário */
  userBudget: number
  /** priceMin da estimativa */
  priceMin: number
  /** Deadline selecionado em dias */
  userDeadlineDays: number
  /** daysMin da estimativa */
  daysMin: number
}

export interface FillerDetectionResult {
  isSuspicious: boolean
  pattern: SuspiciousPattern
  /** Ajuste negativo no score_profile: 0 a -10 pontos (informacional) */
  confidenceAdjustment: number
  /** Descrição para log interno (sem PII) */
  reason: string
}

// Thresholds de detecção
const DETECTION_THRESHOLDS = {
  TOO_FAST_TOTAL_MS: 5000, // < 5s para completar todas as respostas
  TOO_UNIFORM_MIN_ANSWERS: 5, // mínimo de respostas para checar uniformidade
  BUDGET_MISMATCH_BUDGET_RATIO: 0.3, // budget < 30% do priceMin
  BUDGET_MISMATCH_TIMELINE_RATIO: 2.0, // deadline > 200% do daysMin
} as const

/**
 * Detecta padrões de respostas suspeitas ou robóticas.
 * Função pura: sem side effects.
 * NOTA: detecção é INFORMACIONAL — nunca bloqueia o lead.
 */
export function detectFillerResponses(input: FillerDetectionInput): FillerDetectionResult {
  const { answerTimestampsMs, selectedOptionIndexes, userBudget, priceMin, userDeadlineDays, daysMin } =
    input

  // Padrão 1: TOO_FAST — todas as respostas em < 5 segundos
  if (answerTimestampsMs.length > 0) {
    const totalMs = Math.max(...answerTimestampsMs) - Math.min(...answerTimestampsMs)
    if (totalMs < DETECTION_THRESHOLDS.TOO_FAST_TOTAL_MS) {
      return {
        isSuspicious: true,
        pattern: 'TOO_FAST',
        confidenceAdjustment: -10,
        reason: `Respostas completadas em ${totalMs}ms (threshold: ${DETECTION_THRESHOLDS.TOO_FAST_TOTAL_MS}ms)`,
      }
    }
  }

  // Padrão 2: TOO_UNIFORM — mesma opção para todas as perguntas multi-choice
  if (selectedOptionIndexes.length >= DETECTION_THRESHOLDS.TOO_UNIFORM_MIN_ANSWERS) {
    const uniqueIndexes = new Set(selectedOptionIndexes)
    if (uniqueIndexes.size === 1) {
      return {
        isSuspicious: true,
        pattern: 'TOO_UNIFORM',
        confidenceAdjustment: -5,
        reason: `Mesma opção (índice ${[...uniqueIndexes][0]}) selecionada em todas as ${selectedOptionIndexes.length} perguntas`,
      }
    }
  }

  // Padrão 3: BUDGET_MISMATCH — budget muito baixo E deadline muito longo
  if (priceMin > 0 && daysMin > 0) {
    const budgetRatio = userBudget / priceMin
    const timelineRatio = userDeadlineDays / daysMin
    if (
      budgetRatio < DETECTION_THRESHOLDS.BUDGET_MISMATCH_BUDGET_RATIO &&
      timelineRatio > DETECTION_THRESHOLDS.BUDGET_MISMATCH_TIMELINE_RATIO
    ) {
      return {
        isSuspicious: true,
        pattern: 'BUDGET_MISMATCH',
        confidenceAdjustment: -5,
        reason: `Budget em ${Math.round(budgetRatio * 100)}% do mínimo, deadline em ${Math.round(timelineRatio * 100)}% do mínimo`,
      }
    }
  }

  return {
    isSuspicious: false,
    pattern: null,
    confidenceAdjustment: 0,
    reason: 'Sem padrões suspeitos detectados',
  }
}
