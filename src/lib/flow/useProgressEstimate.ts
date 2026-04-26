'use client'
import { useMemo } from 'react'
import type { ProjectType } from '@/lib/enums'
import { estimateQuestionCountForProjectTypes } from '@/lib/project-config'

interface UseProgressEstimateOptions {
  /** Tipo do projeto determinado pelo motor de decisão */
  projectType?: string | null
  projectTypes?: string[]
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
  projectTypes,
  questionsAnswered,
  sessionProgress,
}: UseProgressEstimateOptions): ProgressEstimate {
  return useMemo(() => {
    const normalizedProjectTypes =
      projectTypes && projectTypes.length > 0
        ? projectTypes
        : projectType
          ? [projectType]
          : []

    const estimatedTotal = estimateQuestionCountForProjectTypes(normalizedProjectTypes as ProjectType[])

    // Preferir sessionProgress do banco quando disponível e válido
    const progressPercent =
      sessionProgress > 0
        ? Math.min(100, sessionProgress)
        : Math.min(99, Math.round((questionsAnswered / estimatedTotal) * 100))

    return { estimatedTotal, progressPercent }
  }, [projectType, projectTypes, questionsAnswered, sessionProgress])
}
