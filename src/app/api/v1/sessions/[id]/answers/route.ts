import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { SessionStatus } from '@/lib/enums'
import { COOKIE_NAMES } from '@/lib/constants'
import { buildError, ERROR_CODES } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { recalculateAccumulators } from '@/lib/session/recalculateAccumulators' // RESOLVED: G011
import { buildAnswerFlowContext } from '@/lib/session/answerFlow'
import { answerPayloadSchema } from '@/lib/validations/schemas'

// ─────────────────────────────────────────────────────────────────────────────
// NOTA ARQUITETURAL: Esta API Route coexiste intencionalmente com o Server
// Action `submitAnswer()` em `src/actions/answer.ts`. O SA é consumido pelo
// QuestionPageClient (client component), enquanto esta rota REST é usada por
// contract tests e potenciais integrações externas. Ambos compartilham:
//   • answerPayloadSchema / answerSchema em src/lib/validations/schemas.ts
//   • validateTextValueByCode (chamado dentro de buildAnswerFlowContext)
// para garantir contrato unificado de validação.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/sessions/[id]/answers — salvar resposta e atualizar acumuladores
//
// IDOR Prevention (SEC-007): cookie.session_id deve coincidir com path.[id]
// GAP-002: option_ids (array) em vez de option_id (singular)
// GAP-004: prisma.$transaction para atomicidade
// GAP-009: ESTIMATED_TOTAL_QUESTIONS importado de @/lib/enums
// ─────────────────────────────────────────────────────────────────────────────

type RouteParams = {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: sessionId } = await params

  // ── IDOR guard ──────────────────────────────────────────────────────────────
  const cookieStore = await cookies()
  const cookieSessionId = cookieStore.get(COOKIE_NAMES.SESSION_ID)?.value

  if (!cookieSessionId || cookieSessionId !== sessionId) {
    return NextResponse.json(
      buildError(ERROR_CODES.FORBIDDEN, 'Sessão não autorizada.'),
      { status: 403 }
    )
  }
  // ── Fim IDOR guard ──────────────────────────────────────────────────────────

  // Validar body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      buildError(ERROR_CODES.VALIDATION_FAILED, 'Body JSON inválido.'),
      { status: 400 }
    )
  }

  const parseResult = answerPayloadSchema.safeParse(body)
  if (!parseResult.success) {
    return NextResponse.json(
      buildError(
        ERROR_CODES.VALIDATION_FAILED,
        'Dados inválidos.',
        parseResult.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      ),
      { status: 400 }
    )
  }

  const { question_id, option_ids, text_value } = parseResult.data

  // Validar que pelo menos option_ids ou text_value foi fornecido
  if ((!option_ids || option_ids.length === 0) && !text_value) {
    return NextResponse.json(
      buildError(ERROR_CODES.VALIDATION_FAILED, 'option_ids ou text_value é obrigatório.'),
      { status: 422 }
    )
  }

  try {
    const { nextQuestionId, updatedSession } = await prisma.$transaction(async (tx) => {
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
      if (session.current_question_id && session.current_question_id !== question_id) {
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
        questionId: question_id,
        optionIds: option_ids,
        textValue: text_value,
        client: tx,
      })

      const existingAnswer = await tx.answer.findUnique({
        where: { session_id_question_id: { session_id: sessionId, question_id } },
        select: { step_number: true },
      })
      const stepNumber = existingAnswer?.step_number ?? session.questions_answered + 1
      const singleOptionId = option_ids && option_ids.length === 1 ? option_ids[0]! : null

      await tx.answer.upsert({
        where: { session_id_question_id: { session_id: sessionId, question_id } },
        create: {
          session_id: sessionId,
          question_id,
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
        !!(option_ids && option_ids.length > 0),
        tx
      )

      const updatedSession = await tx.session.update({
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
        select: {
          status: true,
          questions_answered: true,
          progress_percentage: true,
          accumulated_price: true,
          accumulated_time: true,
          accumulated_complexity: true,
        },
      })

      return { nextQuestionId, updatedSession }
    })

    return NextResponse.json(
      {
        session_id: sessionId,
        next_question_id: nextQuestionId,
        status: updatedSession.status,
        questions_answered: updatedSession.questions_answered,
        progress_percentage: updatedSession.progress_percentage,
        accumulated_price: updatedSession.accumulated_price,
        accumulated_time: updatedSession.accumulated_time,
        accumulated_complexity: updatedSession.accumulated_complexity,
      },
      { status: 201 }
    )
  } catch (err: unknown) {
    const code = err instanceof Error ? err.message : 'UNKNOWN'
    switch (code) {
      case 'INVALID_OPTIONS':
        return NextResponse.json(
          buildError(ERROR_CODES.VALIDATION_FAILED, 'Uma ou mais opções são inválidas para esta pergunta.'),
          { status: 422 }
        )
      case 'QUESTION_NOT_FOUND':
        return NextResponse.json(
          buildError(ERROR_CODES.VALIDATION_FAILED, 'Pergunta inválida.'),
          { status: 422 }
        )
      case 'SESSION_NOT_FOUND':
        return NextResponse.json(
          buildError(ERROR_CODES.SESSION_NOT_FOUND, 'Sessão não encontrada.'),
          { status: 404 }
        )
      case 'SESSION_EXPIRED':
        return NextResponse.json(
          buildError(ERROR_CODES.SESSION_EXPIRED, 'Sessão expirada.'),
          { status: 410 }
        )
      case 'SESSION_COMPLETED':
        return NextResponse.json(
          buildError(ERROR_CODES.CONFLICT, 'Sessão já concluída.'),
          { status: 409 }
        )
      case 'OUT_OF_SEQUENCE':
        return NextResponse.json(
          buildError(ERROR_CODES.VALIDATION_FAILED, 'Pergunta fora de sequência. Atualize a página.'),
          { status: 409 }
        )
      default:
        if (code.startsWith('INVALID_TEXT_VALUE:')) {
          return NextResponse.json(
            buildError(ERROR_CODES.VALIDATION_FAILED, code.slice('INVALID_TEXT_VALUE:'.length)),
            { status: 422 }
          )
        }
    }

    logger.error('answers_internal_error', { session_id: sessionId, error: err instanceof Error ? err.message : String(err) })
    return NextResponse.json(
      buildError(ERROR_CODES.INTERNAL_ERROR, 'Erro interno. Tente novamente em alguns instantes.'),
      { status: 500 }
    )
  }
}
