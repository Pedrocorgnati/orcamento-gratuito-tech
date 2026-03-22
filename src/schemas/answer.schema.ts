import { z } from 'zod'

export const SubmitAnswerSchema = z
  .object({
    sessionId: z.string().min(1, 'sessionId é obrigatório'),
    questionId: z.string().min(1, 'questionId é obrigatório'),
    optionId: z.string().nullable().optional(),
    textValue: z.string().max(500).nullable().optional(),
  })
  .refine(
    (data) => data.optionId != null || (data.textValue != null && data.textValue.length > 0),
    { message: 'Ao menos um de optionId ou textValue deve ser fornecido' }
  )

export type SubmitAnswerInput = z.infer<typeof SubmitAnswerSchema>

export type SubmitAnswerResult = {
  nextQuestionId: string | null
  progress: number
  isComplete: boolean
}
