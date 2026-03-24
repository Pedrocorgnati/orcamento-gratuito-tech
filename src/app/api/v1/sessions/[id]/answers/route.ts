import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { SessionStatus } from '@/lib/enums'
import { COOKIE_NAMES } from '@/lib/constants'
import { buildError, ERROR_CODES } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { recalculateAccumulators } from '@/lib/session/recalculateAccumulators' // RESOLVED: G011

// ─────────────────────────────────────────────────────────────────────────────
// NOTA ARQUITETURAL: Esta API Route coexiste intencionalmente com o Server
// Action `submitAnswer()` em `src/actions/answer.ts`. O SA é consumido pelo
// QuestionPageClient (client component), enquanto esta rota REST é usada por
// contract tests e potenciais integrações externas. Ambos implementam a mesma
// lógica (IDOR guard + Zod + upsert atômico).
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Schema
// GAP-002: option_ids aceita array de strings (min 1 item) para MULTIPLE_CHOICE
// ─────────────────────────────────────────────────────────────────────────────

const answerPayloadSchema = z.object({
  question_id: z.string().min(1, 'question_id é obrigatório'),
  option_ids: z.array(z.string().min(1)).min(1).optional(),
  text_value: z.string().min(1).max(2000).nullable().optional(),
  answered_at: z.string().datetime().optional(),
})

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
    // 1. Buscar sessão
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
      return NextResponse.json(
        buildError(ERROR_CODES.SESSION_NOT_FOUND, 'Sessão não encontrada.'),
        { status: 404 }
      )
    }

    if (session.status === SessionStatus.EXPIRED || session.expires_at < new Date()) {
      return NextResponse.json(
        buildError(ERROR_CODES.SESSION_EXPIRED, 'Sessão expirada.'),
        { status: 410 }
      )
    }

    if (session.status === SessionStatus.COMPLETED) {
      return NextResponse.json(
        buildError(ERROR_CODES.CONFLICT, 'Sessão já concluída.'),
        { status: 409 }
      )
    }

    // 2. Buscar todas as options selecionadas e calcular impactos (SUM)
    let priceImpact = 0
    let timeImpact = 0
    let complexityImpact = 0
    let nextQuestionId: string | null = null

    if (option_ids && option_ids.length > 0) {
      const options = await prisma.option.findMany({
        where: { id: { in: option_ids }, question_id },
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

      if (options.length !== option_ids.length) {
        return NextResponse.json(
          buildError(ERROR_CODES.VALIDATION_FAILED, 'Uma ou mais opções são inválidas para esta pergunta.'),
          { status: 422 }
        )
      }

      // SUM de todos os impactos
      priceImpact = options.reduce((sum, o) => sum + o.price_impact, 0)
      timeImpact = options.reduce((sum, o) => sum + o.time_impact, 0)
      complexityImpact = options.reduce((sum, o) => sum + o.complexity_impact, 0)
      // next_question_id da última option (maior order)
      const lastOption = options[options.length - 1]!
      nextQuestionId = lastOption.next_question_id
    }

    // 3. Verificar se resposta existe (para determinar step_number correto)
    const existingAnswer = await prisma.answer.findUnique({
      where: { session_id_question_id: { session_id: sessionId, question_id } },
      select: { step_number: true },
    })

    const stepNumber = existingAnswer?.step_number ?? session.questions_answered + 1

    // Serializar option_ids como JSON string (campo option_id no DB é String?)
    const optionIdValue = option_ids && option_ids.length > 0 ? JSON.stringify(option_ids) : null

    // 4. Upsert answer + atualizar timestamp da sessão em transação atômica (GAP-004)
    await prisma.$transaction([
      prisma.answer.upsert({
        where: { session_id_question_id: { session_id: sessionId, question_id } },
        create: {
          session_id: sessionId,
          question_id,
          option_id: optionIdValue,
          text_value: text_value ?? null,
          price_impact_snapshot: priceImpact,
          time_impact_snapshot: timeImpact,
          complexity_impact_snapshot: complexityImpact,
          step_number: stepNumber,
        },
        update: {
          option_id: optionIdValue,
          text_value: text_value ?? null,
          price_impact_snapshot: priceImpact,
          time_impact_snapshot: timeImpact,
          complexity_impact_snapshot: complexityImpact,
        },
      }),
      prisma.session.update({
        where: { id: sessionId },
        data: { updated_at: new Date() },
      }),
    ])

    // 5. Recalcular acumuladores a partir de TODAS as respostas (garantia de precisão)
    const {
      newQuestionsAnswered,
      newPath,
      newAccumPrice,
      newAccumTime,
      newAccumComplexity,
      isComplete,
      progressPercentage,
    } = await recalculateAccumulators(sessionId, nextQuestionId, !!(option_ids && option_ids.length > 0))

    // 6. Atualizar sessão com acumuladores recalculados
    const updatedSession = await prisma.session.update({
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
      select: {
        status: true,
        questions_answered: true,
        progress_percentage: true,
        accumulated_price: true,
        accumulated_time: true,
        accumulated_complexity: true,
      },
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
    logger.error('answers_internal_error', { session_id: sessionId, error: err instanceof Error ? err.message : String(err) })
    return NextResponse.json(
      buildError(ERROR_CODES.INTERNAL_ERROR, 'Erro interno. Tente novamente em alguns instantes.'),
      { status: 500 }
    )
  }
}
