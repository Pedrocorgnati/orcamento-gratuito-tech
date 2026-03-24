import { z } from 'zod'

import {
  Locale,
  Currency,
  QuestionBlock,
  QuestionType,
  MAX_TEXT_LENGTH,
  MIN_TEXT_LENGTH,
  PAGE_SIZE,
  MAX_PAGE_SIZE,
} from '../enums'

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse seguro com tipagem — retorna `{ success, data, error }`.
 * Centraliza tratamento de erro para todas as validacoes.
 */
export function parseSchema<T>(
  schema: z.ZodType<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error }
}

// ─────────────────────────────────────────────────────────────────────────────
// Session
// ─────────────────────────────────────────────────────────────────────────────

export const sessionSchema = z.object({
  locale: z.nativeEnum(Locale),
  currency: z.nativeEnum(Currency),
  visitorIp: z.string().regex(/^(\d{1,3}\.){3}\d{1,3}$|^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/, 'IP invalido').nullable().optional(),
  userAgent: z.string().max(512).nullable().optional(),
})

export type SessionSchemaInput = z.infer<typeof sessionSchema>

// ─────────────────────────────────────────────────────────────────────────────
// Answer
// ─────────────────────────────────────────────────────────────────────────────

export const answerSchema = z
  .object({
    sessionId: z.string().min(1, 'sessionId e obrigatorio'),
    questionId: z.string().min(1, 'questionId e obrigatorio'),
    optionIds: z.array(z.string().min(1)).min(1).optional(),
    textValue: z
      .string()
      .min(MIN_TEXT_LENGTH, `Minimo ${MIN_TEXT_LENGTH} caracteres`)
      .max(MAX_TEXT_LENGTH, `Maximo ${MAX_TEXT_LENGTH} caracteres`)
      .nullable()
      .optional(),
  })
  .refine((data) => (data.optionIds && data.optionIds.length > 0) || data.textValue, {
    message: 'optionIds ou textValue deve ser informado',
    path: ['optionIds'],
  })

export type AnswerSchemaInput = z.infer<typeof answerSchema>

export type SubmitAnswerResult = {
  nextQuestionId: string | null
  progress: number
  isComplete: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Lead
// ─────────────────────────────────────────────────────────────────────────────

export const leadSchema = z
  .object({
    sessionId: z.string().cuid({ message: 'sessionId invalido' }),
    name: z
      .string()
      .min(MIN_TEXT_LENGTH, `Minimo ${MIN_TEXT_LENGTH} caracteres`)
      .max(100, 'Maximo 100 caracteres')
      .regex(/^[a-zA-ZÀ-ÿ\s'\-]+$/, 'Nome contem caracteres invalidos'),
    email: z
      .string()
      .email('Email invalido')
      .transform((v) => v.toLowerCase()),
    phone: z.string().max(20).nullable().optional(),
    company: z.string().max(100).nullable().optional(),
    consentGiven: z.boolean(),
    consentVersion: z.string().min(1, 'consentVersion e obrigatorio').regex(/^\d+\.\d+$/, 'Formato de versao invalido'),
    /** Honeypot — deve estar vazio */
    _hp: z.string().max(0, 'Campo invalido').optional().default(''),
  })
  .refine((data) => data.consentGiven === true, {
    message: 'Consentimento e obrigatorio',
    path: ['consentGiven'],
  })

export type LeadSchemaInput = z.infer<typeof leadSchema>
export type LeadSchemaClean = Omit<LeadSchemaInput, '_hp'>

// ─────────────────────────────────────────────────────────────────────────────
// Admin Login
// ─────────────────────────────────────────────────────────────────────────────

export const adminLoginSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
})

export type AdminLoginSchemaInput = z.infer<typeof adminLoginSchema>

// ─────────────────────────────────────────────────────────────────────────────
// Query Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const questionQuerySchema = z.object({
  block: z.nativeEnum(QuestionBlock).optional(),
  type: z.nativeEnum(QuestionType).optional(),
  locale: z.nativeEnum(Locale).optional(),
})

export type QuestionQueryInput = z.infer<typeof questionQuerySchema>

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(PAGE_SIZE),
  cursor: z.string().cuid().optional(),
})

export type PaginationInput = z.infer<typeof paginationSchema>

// ─────────────────────────────────────────────────────────────────────────────
// Admin Leads Query
// ─────────────────────────────────────────────────────────────────────────────

export const adminLeadsQuerySchema = z.object({
  score: z.enum(['A', 'B', 'C']).optional(),
  type: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(PAGE_SIZE),
})

export type AdminLeadsQuery = z.infer<typeof adminLeadsQuerySchema>

// ─────────────────────────────────────────────────────────────────────────────
// Rate Limit Headers
// ─────────────────────────────────────────────────────────────────────────────

export const rateLimitHeaderSchema = z.object({
  'x-ratelimit-limit': z.coerce.number(),
  'x-ratelimit-remaining': z.coerce.number(),
  'x-ratelimit-reset': z.coerce.number(),
})

export type RateLimitHeaderInput = z.infer<typeof rateLimitHeaderSchema>
