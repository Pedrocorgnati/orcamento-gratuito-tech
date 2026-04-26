// RESOLVED: extraída lógica duplicada de recálculo de acumuladores (G011)
// Compartilhada entre src/actions/answer.ts e src/app/api/v1/sessions/[id]/answers/route.ts

import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { ESTIMATED_TOTAL_QUESTIONS, QuestionType } from '@/lib/enums'
import { estimateQuestionCountForProjectTypes, normalizeProjectTypes } from '@/lib/project-config'

export type AccumulatorResult = {
  newQuestionsAnswered: number
  newPath: string[]
  newAccumPrice: number
  newAccumTime: number
  newAccumComplexity: number
  isComplete: boolean
  progressPercentage: number
}

export type PrismaLike = Prisma.TransactionClient | typeof prisma

/**
 * Busca todas as respostas da sessão e recalcula os acumuladores.
 * Aceita cliente transacional opcional para garantir atomicidade quando
 * chamado dentro de prisma.$transaction(async (tx) => { ... }).
 */
export async function recalculateAccumulators(
  sessionId: string,
  nextQuestionId: string | null,
  hasAnswers: boolean,
  client: PrismaLike = prisma
): Promise<AccumulatorResult> {
  const [session, allAnswers] = await Promise.all([
    client.session.findUnique({
      where: { id: sessionId },
      select: {
        project_type: true,
        project_types: true,
      },
    }),
    client.answer.findMany({
      where: { session_id: sessionId },
      select: {
        question_id: true,
        question: {
          select: { type: true },
        },
        price_impact_snapshot: true,
        time_impact_snapshot: true,
        complexity_impact_snapshot: true,
        step_number: true,
      },
      orderBy: { step_number: 'asc' },
    }),
  ])

  const newQuestionsAnswered = allAnswers.length
  const newPath = allAnswers.map((a) => a.question_id)
  const scopedAnswers = allAnswers.filter(
    (answer) =>
      answer.question.type !== QuestionType.BUDGET_SELECT &&
      answer.question.type !== QuestionType.DEADLINE_SELECT
  )
  const newAccumPrice = scopedAnswers.reduce((sum, a) => sum + a.price_impact_snapshot, 0)
  const newAccumTime = scopedAnswers.reduce((sum, a) => sum + a.time_impact_snapshot, 0)
  const newAccumComplexity = scopedAnswers.reduce((sum, a) => sum + a.complexity_impact_snapshot, 0)

  const isComplete = nextQuestionId === null && hasAnswers
  const estimatedTotalQuestions =
    session
      ? estimateQuestionCountForProjectTypes(
          normalizeProjectTypes(session.project_types, session.project_type)
        )
      : ESTIMATED_TOTAL_QUESTIONS
  const progressPercentage = isComplete
    ? 100
    : Math.min(99, Math.round((newQuestionsAnswered / estimatedTotalQuestions) * 100))

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
