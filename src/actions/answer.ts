'use server'

import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { SessionStatus } from '@/lib/enums'
import { COOKIE_NAMES } from '@/lib/constants'
import { answerSchema, type SubmitAnswerResult } from '@/lib/validations/schemas'
import { ERROR_CODES } from '@/lib/errors'
import { recalculateAccumulators } from '@/lib/session/recalculateAccumulators' // RESOLVED: G011
import { buildAnswerFlowContext } from '@/lib/session/answerFlow'
import { logger } from '@/lib/logger'

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
    const result = await prisma.$transaction(async (tx) => {
      const session = await tx.session.findUnique({
        where: { id: sessionId },
        select: {
          id: true,
          status: true,
          expires_at: true,
          questions_answered: true,
          current_question_id: true,
        },
      })

      if (!session) throw new Error('SESSION_NOT_FOUND')
      if (session.status === SessionStatus.EXPIRED || session.expires_at < new Date()) {
        throw new Error('SESSION_EXPIRED')
      }
      if (session.status === SessionStatus.COMPLETED) {
        throw new Error('SESSION_COMPLETED')
      }
      if (session.current_question_id && session.current_question_id !== questionId) {
        throw new Error('OUT_OF_SEQUENCE')
      }

      const {
        priceImpact,
        timeImpact,
        complexityImpact,
        nextQuestionId,
        sessionUpdateData,
        persistedTextValue,
      } = await buildAnswerFlowContext({
        sessionId,
        questionId,
        optionIds,
        textValue,
        client: tx,
      })

      const existingAnswer = await tx.answer.findUnique({
        where: { session_id_question_id: { session_id: sessionId, question_id: questionId } },
        select: { step_number: true },
      })
      const stepNumber = existingAnswer?.step_number ?? session.questions_answered + 1
      const singleOptionId = optionIds && optionIds.length === 1 ? optionIds[0]! : null

      await tx.answer.upsert({
        where: { session_id_question_id: { session_id: sessionId, question_id: questionId } },
        create: {
          session_id: sessionId,
          question_id: questionId,
          option_id: singleOptionId,
          text_value: persistedTextValue,
          price_impact_snapshot: priceImpact,
          time_impact_snapshot: timeImpact,
          complexity_impact_snapshot: complexityImpact,
          step_number: stepNumber,
        },
        update: {
          option_id: singleOptionId,
          text_value: persistedTextValue,
          price_impact_snapshot: priceImpact,
          time_impact_snapshot: timeImpact,
          complexity_impact_snapshot: complexityImpact,
        },
      })

      const {
        newQuestionsAnswered,
        newPath,
        newAccumPrice,
        newAccumTime,
        newAccumComplexity,
        isComplete,
        progressPercentage,
      } = await recalculateAccumulators(
        sessionId,
        nextQuestionId,
        !!(optionIds && optionIds.length > 0),
        tx
      )

      await tx.session.update({
        where: { id: sessionId },
        data: {
          ...sessionUpdateData,
          accumulated_price: newAccumPrice,
          accumulated_time: newAccumTime,
          accumulated_complexity: newAccumComplexity,
          path_taken: newPath,
          questions_answered: newQuestionsAnswered,
          progress_percentage: progressPercentage,
          current_question_id: nextQuestionId,
          status: isComplete ? SessionStatus.COMPLETED : SessionStatus.IN_PROGRESS,
          updated_at: new Date(),
        },
      })

      return { nextQuestionId, progressPercentage, isComplete }
    })

    return {
      success: true,
      data: {
        nextQuestionId: result.nextQuestionId,
        progress: result.progressPercentage / 100,
        isComplete: result.isComplete,
      },
    }
  } catch (err: unknown) {
    const code = err instanceof Error ? err.message : 'UNKNOWN'

    switch (code) {
      case 'INVALID_OPTIONS':
        return {
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_FAILED,
            message: 'Uma ou mais opções são inválidas para esta pergunta.',
          },
        }
      case 'QUESTION_NOT_FOUND':
        return {
          success: false,
          error: { code: ERROR_CODES.VALIDATION_FAILED, message: 'Pergunta inválida.' },
        }
      case 'SESSION_NOT_FOUND':
        return {
          success: false,
          error: { code: ERROR_CODES.SESSION_NOT_FOUND, message: 'Sessão não encontrada.' },
        }
      case 'SESSION_EXPIRED':
        return {
          success: false,
          error: {
            code: ERROR_CODES.SESSION_EXPIRED,
            message: 'Sessão expirada. Inicie uma nova estimativa.',
          },
        }
      case 'SESSION_COMPLETED':
        return {
          success: false,
          error: { code: ERROR_CODES.FORBIDDEN, message: 'Sessão já finalizada.' },
        }
      case 'OUT_OF_SEQUENCE':
        return {
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_FAILED,
            message: 'Pergunta fora de sequência. Atualize a página.',
          },
        }
      default:
        if (code.startsWith('INVALID_TEXT_VALUE:')) {
          return {
            success: false,
            error: {
              code: ERROR_CODES.VALIDATION_FAILED,
              message: code.slice('INVALID_TEXT_VALUE:'.length),
            },
          }
        }
    }

    logger.error('erro_interno_resposta', {
      session_id: sessionId,
      error: err instanceof Error ? err.message : String(err),
    })
    return {
      success: false,
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Erro interno. Tente novamente.' },
    }
  }
}
