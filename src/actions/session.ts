'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { SessionStatus, QuestionBlock, ProjectType } from '@/lib/enums'
import { COOKIE_NAMES } from '@/lib/constants'
import { sessionService } from '@/services/session.service'
import type { SessionGetResult } from '@/services/session.service'
import { recalculateAccumulators } from '@/lib/session/recalculateAccumulators'
import {
  PROJECT_TYPE_BY_Q001_ORDER,
  buildPendingBlocks,
} from '@/lib/project-config'

// ─────────────────────────────────────────────────────────────────────────────
// SA-002: getSession — Server Action wrapper para sessionService.findById()
// IDOR guard via cookie session_id.
// ─────────────────────────────────────────────────────────────────────────────

export async function getSession(sessionId: string): Promise<SessionGetResult | null> {
  const cookieStore = await cookies()
  const cookieSessionId = cookieStore.get(COOKIE_NAMES.SESSION_ID)?.value

  if (!cookieSessionId || cookieSessionId !== sessionId) {
    throw new Error('Sessão inválida ou não autorizada.')
  }

  return sessionService.findById(sessionId)
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type GoBackArgs = {
  sessionId: string
  locale: string
}

// ─────────────────────────────────────────────────────────────────────────────
// goBack — Server Action
//
// INVARIANTE: após goBack(), TODO estado derivado da sessão deve ser consistente
// com as answers remanescentes — não basta deletar a última answer e mover o
// ponteiro. pending_blocks, current_block, project_type(s), acumuladores e
// questions_answered precisam ser RECONSTRUÍDOS, ou o usuário pula blocos
// inteiros ao avançar de novo (multi-projeto v3).
//
// ALGORITMO:
// 1. IDOR guard
// 2. $transaction única:
//    a. Buscar answers ordenadas + question (code, block) para identificar Q001
//    b. Deletar última answer
//    c. Reconstruir project_type(s) e pending_blocks a partir do Q001 remanescente
//    d. Resolver current_block via block do previousQuestion
//    e. Recalcular acumuladores via recalculateAccumulators(tx)
//    f. tx.session.update único com todo o estado reconstruído
// 3. revalidatePath + redirect FORA da transação (redirect lança exceção)
// ─────────────────────────────────────────────────────────────────────────────

const Q001_CODE = 'Q001'

function parseQ001OptionIds(answer: { option_id: string | null; text_value: string | null }): string[] {
  if (answer.option_id) return [answer.option_id]
  if (!answer.text_value) return []
  try {
    const parsed = JSON.parse(answer.text_value)
    if (Array.isArray(parsed) && parsed.every((id) => typeof id === 'string')) {
      return parsed
    }
  } catch {
    // text_value pode não ser JSON em legacy rows; tratar como vazio
  }
  return []
}

export async function goBack({ sessionId, locale }: GoBackArgs): Promise<void> {
  // IDOR guard
  const cookieStore = await cookies()
  const cookieSessionId = cookieStore.get(COOKIE_NAMES.SESSION_ID)?.value

  if (!cookieSessionId || cookieSessionId !== sessionId) {
    throw new Error('Sessão inválida ou não autorizada.')
  }

  const previousQuestionId = await prisma.$transaction(async (tx) => {
    const allAnswers = await tx.answer.findMany({
      where: { session_id: sessionId },
      orderBy: { step_number: 'asc' },
      select: {
        id: true,
        question_id: true,
        option_id: true,
        text_value: true,
        question: { select: { code: true, block: true } },
      },
    })

    if (allAnswers.length === 0) {
      throw new Error('Não há respostas para voltar.')
    }

    const lastAnswer = allAnswers[allAnswers.length - 1]!
    const remainingAnswers = allAnswers.slice(0, -1)
    const previousQuestionId = lastAnswer.question_id

    await tx.answer.delete({ where: { id: lastAnswer.id } })

    // ── Reconstruir project_type(s) + pending_blocks a partir do Q001 remanescente ──
    const q001Answer = remainingAnswers.find((a) => a.question.code === Q001_CODE)

    let projectTypes: ProjectType[] = []
    let pendingBlocks: QuestionBlock[] = []
    let currentBlock: QuestionBlock | null = null

    if (q001Answer) {
      const q001OptionIds = parseQ001OptionIds(q001Answer)
      if (q001OptionIds.length > 0) {
        const q001Options = await tx.option.findMany({
          where: { id: { in: q001OptionIds }, question_id: q001Answer.question_id },
          select: { order: true },
        })
        const derivedTypes = q001Options
          .map((option) => PROJECT_TYPE_BY_Q001_ORDER[option.order])
          .filter((projectType): projectType is ProjectType => Boolean(projectType))
        projectTypes = [...new Set(derivedTypes)]

        const allBlocks = buildPendingBlocks(projectTypes)
        const previousBlock = lastAnswer.question.block as QuestionBlock
        const blockIndex = allBlocks.indexOf(previousBlock)

        if (blockIndex >= 0) {
          pendingBlocks = allBlocks.slice(blockIndex)
          currentBlock = previousBlock
        } else {
          // previousQuestion fora dos blocos derivados (ex: Q001 ou PROJECT_TYPE).
          // Sem current_block — o próximo avanço repopula via Q001.
          pendingBlocks = allBlocks
          currentBlock = allBlocks[0] ?? null
        }
      }
    }

    const accumulators = await recalculateAccumulators(
      sessionId,
      previousQuestionId,
      remainingAnswers.length > 0,
      tx
    )

    await tx.session.update({
      where: { id: sessionId },
      data: {
        current_question_id: previousQuestionId,
        project_type: projectTypes[0] ?? null,
        project_types: projectTypes,
        pending_blocks: pendingBlocks,
        current_block: currentBlock,
        accumulated_price: accumulators.newAccumPrice,
        accumulated_time: accumulators.newAccumTime,
        accumulated_complexity: accumulators.newAccumComplexity,
        path_taken: accumulators.newPath,
        questions_answered: accumulators.newQuestionsAnswered,
        progress_percentage: accumulators.progressPercentage,
        status: SessionStatus.IN_PROGRESS,
        updated_at: new Date(),
      },
    })

    return previousQuestionId
  })

  // Revalidar cache das páginas do fluxo
  revalidatePath(`/${locale}/flow`)

  // redirect() lança exceção interna do Next.js — chamar FORA da $transaction
  redirect(`/${locale}/flow/${previousQuestionId}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// TASK-9 CL-294: discardSession — marca sessão como ABANDONED e limpa cookie.
// Chamada ao usuário clicar em "Recomeçar fluxo" e confirmar no modal.
// ─────────────────────────────────────────────────────────────────────────────
export async function discardSession(sessionId: string, locale: string): Promise<void> {
  const cookieStore = await cookies()
  const cookieSessionId = cookieStore.get(COOKIE_NAMES.SESSION_ID)?.value

  if (!cookieSessionId || cookieSessionId !== sessionId) {
    redirect(`/${locale}`)
  }

  await prisma.session.update({
    where: { id: sessionId },
    data: { status: SessionStatus.ABANDONED, updated_at: new Date() },
  })

  cookieStore.delete(COOKIE_NAMES.SESSION_ID)
  revalidatePath(`/${locale}`)
  redirect(`/${locale}`)
}
