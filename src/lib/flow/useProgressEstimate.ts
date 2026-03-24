'use client'
import { useMemo } from 'react'

// Estimativa de perguntas por tipo de projeto (baseado na árvore de decisão)
// Valores calculados a partir dos paths definidos no motor de decisão
const ESTIMATED_QUESTIONS_BY_TYPE: Record<string, number> = {
  WEBSITE: 12,
  ECOMMERCE: 16,
  WEB_APP: 15,
  MOBILE_APP: 18,
  AUTOMATION_AI: 14,
  default: 15, // fallback — alinhado com ESTIMATED_TOTAL_QUESTIONS do backend
}

interface UseProgressEstimateOptions {
  /** Tipo do projeto determinado pelo motor de decisão */
  projectType?: string | null
  /** Quantidade de perguntas já respondidas (questions_answered no schema) */
  questionsAnswered: number
  /** Percentual de progresso vindo do banco (0-100) */
  sessionProgress: number
}

interface ProgressEstimate {
  estimatedTotal: number
  progressPercent: number
}

/**
 * Calcula estimativa dinâmica do total de perguntas e percentual de progresso.
 * Usa sessionProgress do banco quando disponível (mais preciso);
 * fallback para estimativa por tipo de projeto.
 *
 * Nunca retorna estimatedTotal = 0 ou 42 — é sempre dinâmico (12-18).
 */
export function useProgressEstimate({
  projectType,
  questionsAnswered,
  sessionProgress,
}: UseProgressEstimateOptions): ProgressEstimate {
  return useMemo(() => {
    const typeKey = projectType ?? 'default'
    const estimatedTotal =
      ESTIMATED_QUESTIONS_BY_TYPE[typeKey] ??
      ESTIMATED_QUESTIONS_BY_TYPE['default']

    // Preferir sessionProgress do banco quando disponível e válido
    const progressPercent =
      sessionProgress > 0
        ? Math.min(100, sessionProgress)
        : Math.min(99, Math.round((questionsAnswered / estimatedTotal) * 100))

    return { estimatedTotal, progressPercent }
  }, [projectType, questionsAnswered, sessionProgress])
}
