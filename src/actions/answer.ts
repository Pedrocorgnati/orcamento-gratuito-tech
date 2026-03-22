'use server'

import { SubmitAnswerSchema, type SubmitAnswerResult } from '@/schemas/answer.schema'
import { buildError, ERROR_CODES } from '@/lib/errors'
import { SessionStatus } from '@/types/enums'

export type AnswerActionResult =
  | { success: true; data: SubmitAnswerResult }
  | { success: false; error: { code: string; message: string } }

export async function submitAnswer(
  input: unknown
): Promise<AnswerActionResult> {
  const parsed = SubmitAnswerSchema.safeParse(input)

  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_FAILED,
        message: parsed.error.issues.map((e) => e.message).join(', '),
      },
    }
  }

  // TODO: Implementar via /auto-flow execute
  // Fluxo em transação Prisma:
  // 1. Buscar sessão e verificar existência + expiração
  // 2. Buscar question e verificar existência
  // 3. Se optionId fornecido: buscar option e verificar que pertence à question
  // 4. Calcular snapshots: option.price_impact, option.time_impact, option.complexity_impact
  // 5. Upsert answer (unique: session_id + question_id) com snapshots
  // 6. Determinar next_question_id:
  //    - Se single_choice: option.next_question_id
  //    - Se skip_logic na question: avaliar regras
  //    - Se null: fluxo concluído
  // 7. Atualizar session: accumulated_* += snapshots, questions_answered++, progress_percentage, current_question_id
  // 8. Se isComplete (nextQuestionId === null): atualizar session.status = 'completed'
  // 9. Retornar { nextQuestionId, progress: 0..1, isComplete }

  console.warn('[submitAnswer] Backend não implementado. Execute /auto-flow execute.')
  return {
    success: false,
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: 'Backend não implementado ainda. Execute /auto-flow execute.',
    },
  }
}
