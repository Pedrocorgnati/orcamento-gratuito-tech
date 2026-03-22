import { z } from 'zod'
import { Locale, Currency } from '@/types/enums'

export const CreateSessionSchema = z.object({
  locale: z.nativeEnum(Locale).optional().default(Locale.PT_BR),
})

export type CreateSessionInput = z.infer<typeof CreateSessionSchema>

export const SessionIdParamSchema = z.object({
  id: z.string().min(1, 'Session ID é obrigatório'),
})
