'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { SessionStatus, ESTIMATED_TOTAL_QUESTIONS } from '@/lib/enums'
import { COOKIE_NAMES } from '@/lib/constants'
import { sessionService } from '@/services/session.service'
import type { SessionGetResult } from '@/services/session.service'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

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
// ALGORITMO (soma completa — garantia de precisão absoluta):
// 1. IDOR guard: cookie.session_id === sessionId
// 2. Buscar todas as respostas ordenadas por step_number
// 3. Identificar a última (= resposta a remover)
// 4. Calcular acumuladores a partir das RESTANTES (não subtração)
// 5. Transação atômica: delete Answer + update Session
// 6. Redirecionar para pergunta anterior
//
// NOTE: redirect() lança exceção interna do Next.js.
// NUNCA envolvê-lo em try/catch — chamar FORA de qualquer bloco try.
// ─────────────────────────────────────────────────────────────────────────────

export async function goBack({ sessionId, locale }: GoBackArgs): Promise<void> {
  // IDOR guard
  const cookieStore = await cookies()
  const cookieSessionId = cookieStore.get(COOKIE_NAMES.SESSION_ID)?.value

  if (!cookieSessionId || cookieSessionId !== sessionId) {
    throw new Error('Sessão inválida ou não autorizada.')
  }

  // Buscar todas as respostas ordenadas
  const allAnswers = await prisma.answer.findMany({
    where: { session_id: sessionId },
    orderBy: { step_number: 'asc' },
    select: {
      id: true,
      question_id: true,
      price_impact_snapshot: true,
      time_impact_snapshot: true,
      complexity_impact_snapshot: true,
    },
  })

  if (allAnswers.length === 0) {
    throw new Error('Não há respostas para voltar.')
  }

  // Identificar última resposta (= pergunta que o usuário estava respondendo)
  const lastAnswer = allAnswers[allAnswers.length - 1]!
  const previousQuestionId = lastAnswer.question_id
  const remainingAnswers = allAnswers.slice(0, -1)

  // Recalcular acumuladores a partir das respostas RESTANTES
  const newAccumPrice = remainingAnswers.reduce((sum, a) => sum + a.price_impact_snapshot, 0)
  const newAccumTime = remainingAnswers.reduce((sum, a) => sum + a.time_impact_snapshot, 0)
  const newAccumComplexity = remainingAnswers.reduce((sum, a) => sum + a.complexity_impact_snapshot, 0)
  const newPath = remainingAnswers.map((a) => a.question_id)
  const newQuestionsAnswered = remainingAnswers.length
  const newProgress = Math.max(
    0,
    Math.round((newQuestionsAnswered / ESTIMATED_TOTAL_QUESTIONS) * 100)
  )

  // Transação atômica: deletar última Answer + atualizar Session
  await prisma.$transaction([
    prisma.answer.delete({ where: { id: lastAnswer.id } }),
    prisma.session.update({
      where: { id: sessionId },
      data: {
        current_question_id: previousQuestionId,
        accumulated_price: newAccumPrice,
        accumulated_time: newAccumTime,
        accumulated_complexity: newAccumComplexity,
        path_taken: newPath,
        questions_answered: newQuestionsAnswered,
        progress_percentage: newProgress,
        // Garantir que status volta para IN_PROGRESS se estava COMPLETED
        status: SessionStatus.IN_PROGRESS,
      },
    }),
  ])

  // Revalidar cache das páginas do fluxo
  revalidatePath(`/${locale}/flow`)

  // Redirecionar FORA do try/catch — redirect() lança exceção interna do Next.js
  redirect(`/${locale}/flow/${previousQuestionId}`)
}
