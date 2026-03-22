import { z } from 'zod'

export const CreateLeadSchema = z.object({
  session_id: z.string().min(1, 'session_id é obrigatório'),
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres').max(100),
  email: z.string().email('Email inválido').max(255),
  phone: z.string().max(20).optional(),
  company: z.string().max(100).optional(),
  consent_given: z.literal(true, {
    error: () => ({ message: 'O consentimento é obrigatório para prosseguir.' }),
  }),
  consent_version: z.string().default('1.0'),
})

export type CreateLeadInput = z.infer<typeof CreateLeadSchema>

export const AdminLeadsQuerySchema = z.object({
  score: z.enum(['A', 'B', 'C']).optional(),
  type: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
})

export type AdminLeadsQuery = z.infer<typeof AdminLeadsQuerySchema>
