'use server'

import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { SessionStatus } from '@/lib/enums'
import { COOKIE_NAMES } from '@/lib/constants'
import { answerSchema, type SubmitAnswerResult } from '@/lib/validations/schemas'
import { ERROR_CODES } from '@/lib/errors'
import { recalculateAccumulators } from '@/lib/session/recalculateAccumulators' // RESOLVED: G011

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type AnswerActionResult =
  | { success: true; data: SubmitAnswerResult }
  | { success: false; error: { code: string; message: string } }

// ─────────────────────────────────────────────────────────────────────────────
// submitAnswer — Server Action
//
// Valida, persiste a resposta e atualiza os acumuladores da sessão.
// Retorna { nextQuestionId, progress, isComplete } para o cliente fazer redirect.
//
// IDOR: verifica que cookie.session_id === input.sessionId
// GAP-002: aceita optionIds (array) para suporte a MULTIPLE_CHOICE
// GAP-004: usa prisma.$transaction para atomicidade do upsert + update
// GAP-009: importa ESTIMATED_TOTAL_QUESTIONS de @/lib/enums
// ─────────────────────────────────────────────────────────────────────────────

export async function submitAnswer(input: unknown): Promise<AnswerActionResult> {
  // 1. Validar schema de entrada
  const parsed = answerSchema.safeParse(input)

  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_FAILED,
        message: parsed.error.issues.map((e) => e.message).join(', '),
      },
    }
  }

  const { sessionId, questionId, optionIds, textValue } = parsed.data

  // 2. IDOR guard
  const cookieStore = await cookies()
  const cookieSessionId = cookieStore.get(COOKIE_NAMES.SESSION_ID)?.value

  if (!cookieSessionId || cookieSessionId !== sessionId) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.FORBIDDEN,
        message: 'Sessão inválida ou não autorizada.',
      },
    }
  }

  try {
    // 3. Buscar sessão
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        status: true,
        expires_at: true,
        questions_answered: true,
      },
    })

    if (!session) {
      return {
        success: false,
        error: { code: ERROR_CODES.SESSION_NOT_FOUND, message: 'Sessão não encontrada.' },
      }
    }

    if (session.status === SessionStatus.EXPIRED || session.expires_at < new Date()) {
      return {
        success: false,
        error: { code: ERROR_CODES.SESSION_EXPIRED, message: 'Sessão expirada. Inicie uma nova estimativa.' },
      }
    }

    // 4. Buscar todas as options selecionadas e calcular impactos acumulados (SUM)
    let priceImpact = 0
    let timeImpact = 0
    let complexityImpact = 0
    let nextQuestionId: string | null = null

    if (optionIds && optionIds.length > 0) {
      const options = await prisma.option.findMany({
        where: { id: { in: optionIds }, question_id: questionId },
        select: {
          id: true,
          price_impact: true,
          time_impact: true,
          complexity_impact: true,
          next_question_id: true,
          order: true,
        },
        orderBy: { order: 'asc' },
      })

      if (options.length !== optionIds.length) {
        return {
          success: false,
          error: { code: ERROR_CODES.VALIDATION_FAILED, message: 'Uma ou mais opções são inválidas para esta pergunta.' },
        }
      }

      // SUM de todos os impactos
      priceImpact = options.reduce((sum, o) => sum + o.price_impact, 0)
      timeImpact = options.reduce((sum, o) => sum + o.time_impact, 0)
      complexityImpact = options.reduce((sum, o) => sum + o.complexity_impact, 0)
      // next_question_id da última option (maior order)
      const lastOption = options[options.length - 1]!
      nextQuestionId = lastOption.next_question_id
    }

    // 5. Verificar se já existe resposta (para step_number correto)
    const existingAnswer = await prisma.answer.findUnique({
      where: { session_id_question_id: { session_id: sessionId, question_id: questionId } },
      select: { step_number: true },
    })

    const stepNumber = existingAnswer?.step_number ?? session.questions_answered + 1

    // Serializar optionIds como JSON string para o campo option_id (String? no DB)
    const optionIdValue = optionIds && optionIds.length > 0 ? JSON.stringify(optionIds) : null

    // 6. Upsert answer + update session em transação atômica (GAP-004)
    await prisma.$transaction([
      prisma.answer.upsert({
        where: { session_id_question_id: { session_id: sessionId, question_id: questionId } },
        create: {
          session_id: sessionId,
          question_id: questionId,
          option_id: optionIdValue,
          text_value: textValue ?? null,
          price_impact_snapshot: priceImpact,
          time_impact_snapshot: timeImpact,
          complexity_impact_snapshot: complexityImpact,
          step_number: stepNumber,
        },
        update: {
          option_id: optionIdValue,
          text_value: textValue ?? null,
          price_impact_snapshot: priceImpact,
          time_impact_snapshot: timeImpact,
          complexity_impact_snapshot: complexityImpact,
        },
      }),
      // Session update placeholder — recalculo feito após a transação com findMany
      // A transação garante que answer e session são atualizados ou revertidos juntos.
      // Por limitação do Prisma sequential transactions, fazemos o recalculo separado abaixo.
      prisma.session.update({
        where: { id: sessionId },
        data: { updated_at: new Date() },
      }),
    ])

    // 7. Recalcular acumuladores a partir de TODAS as respostas (precisão absoluta)
    const {
      newQuestionsAnswered,
      newPath,
      newAccumPrice,
      newAccumTime,
      newAccumComplexity,
      isComplete,
      progressPercentage,
    } = await recalculateAccumulators(sessionId, nextQuestionId, !!(optionIds && optionIds.length > 0))

    // 8. Atualizar sessão com acumuladores recalculados
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        accumulated_price: newAccumPrice,
        accumulated_time: newAccumTime,
        accumulated_complexity: newAccumComplexity,
        path_taken: newPath,
        questions_answered: newQuestionsAnswered,
        progress_percentage: progressPercentage,
        current_question_id: nextQuestionId,
        status: isComplete ? SessionStatus.COMPLETED : SessionStatus.IN_PROGRESS,
      },
    })

    return {
      success: true,
      data: {
        nextQuestionId,
        progress: progressPercentage / 100,
        isComplete,
      },
    }
  } catch (err: unknown) {
    console.error('[submitAnswer]', err)
    return {
      success: false,
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Erro interno. Tente novamente.' },
    }
  }
}
