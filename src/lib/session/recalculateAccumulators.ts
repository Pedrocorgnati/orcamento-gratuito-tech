// RESOLVED: extraída lógica duplicada de recálculo de acumuladores (G011)
// Compartilhada entre src/actions/answer.ts e src/app/api/v1/sessions/[id]/answers/route.ts

import { prisma } from '@/lib/prisma'
import { ESTIMATED_TOTAL_QUESTIONS } from '@/lib/enums'

export type AccumulatorResult = {
  newQuestionsAnswered: number
  newPath: string[]
  newAccumPrice: number
  newAccumTime: number
  newAccumComplexity: number
  isComplete: boolean
  progressPercentage: number
}

/**
 * Busca todas as respostas da sessão e recalcula os acumuladores.
 * O caller é responsável por persistir o resultado via prisma.session.update.
 */
export async function recalculateAccumulators(
  sessionId: string,
  nextQuestionId: string | null,
  hasAnswers: boolean
): Promise<AccumulatorResult> {
  const allAnswers = await prisma.answer.findMany({
    where: { session_id: sessionId },
    select: {
      question_id: true,
      price_impact_snapshot: true,
      time_impact_snapshot: true,
      complexity_impact_snapshot: true,
      step_number: true,
    },
    orderBy: { step_number: 'asc' },
  })

  const newQuestionsAnswered = allAnswers.length
  const newPath = allAnswers.map((a) => a.question_id)
  const newAccumPrice = allAnswers.reduce((sum, a) => sum + a.price_impact_snapshot, 0)
  const newAccumTime = allAnswers.reduce((sum, a) => sum + a.time_impact_snapshot, 0)
  const newAccumComplexity = allAnswers.reduce((sum, a) => sum + a.complexity_impact_snapshot, 0)

  const isComplete = nextQuestionId === null && hasAnswers
  const progressPercentage = isComplete
    ? 100
    : Math.min(99, Math.round((newQuestionsAnswered / ESTIMATED_TOTAL_QUESTIONS) * 100))

  return {
    newQuestionsAnswered,
    newPath,
    newAccumPrice,
    newAccumTime,
    newAccumComplexity,
    isComplete,
    progressPercentage,
  }
}
