import { z } from 'zod'

import {
  Locale,
  Currency,
  QuestionBlock,
  QuestionType,
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
//
// Limites por código de pergunta — usados por validateTextValueByCode().
// O Zod faz a validação base (presença, tipo, ceiling global). O helper aplica
// os limites apertados após o backend resolver question.code.
//
// Mantemos LEAD com limites antigos para compat com sessões em produção.
// NARRATIVE (Q096-Q099) entra com limites próprios. Q105 fica de fora — chain
// removido em refactor-narrative-v4 mas seed/dados antigos podem chegar aqui.
// ─────────────────────────────────────────────────────────────────────────────

export const TEXT_INPUT_LIMITS_BY_CODE: Record<
  string,
  { min: number; max: number; required: boolean }
> = {
  Q096: { min: 10, max: 240, required: true },
  Q097: { min: 0, max: 800, required: false },
  Q098: { min: 0, max: 1500, required: false },
  Q099: { min: 0, max: 1500, required: false },
  Q100: { min: 3, max: 100, required: true },
  Q101: { min: 5, max: 200, required: true },
  Q102: { min: 0, max: 20, required: false },
  Q103: { min: 0, max: 100, required: false },
  Q105: { min: 0, max: 500, required: false },
}

const TEXT_GLOBAL_MAX = 1500

export function validateTextValueByCode(
  code: string,
  value: string | null | undefined
): { ok: true } | { ok: false; message: string } {
  const limits = TEXT_INPUT_LIMITS_BY_CODE[code]
  if (!limits) return { ok: true }

  const trimmed = (value ?? '').trim()

  if (limits.required && trimmed.length === 0) {
    return { ok: false, message: `Pergunta ${code} é obrigatória.` }
  }

  if (trimmed.length === 0) {
    return { ok: true }
  }

  if (trimmed.length < limits.min) {
    return { ok: false, message: `Mínimo ${limits.min} caracteres para ${code}.` }
  }

  if (trimmed.length > limits.max) {
    return { ok: false, message: `Máximo ${limits.max} caracteres para ${code}.` }
  }

  return { ok: true }
}

export const answerSchema = z
  .object({
    sessionId: z.string().min(1, 'sessionId e obrigatorio'),
    questionId: z.string().min(1, 'questionId e obrigatorio'),
    optionIds: z.array(z.string().min(1)).min(1).optional(),
    textValue: z
      .string()
      .max(TEXT_GLOBAL_MAX, `Maximo ${TEXT_GLOBAL_MAX} caracteres`)
      .nullable()
      .optional(),
  })
  .refine(
    (data) =>
      (data.optionIds && data.optionIds.length > 0) ||
      data.textValue != null,
    {
      message: 'optionIds ou textValue deve ser informado',
      path: ['optionIds'],
    }
  )

export type AnswerSchemaInput = z.infer<typeof answerSchema>

// REST payload (snake_case). Compartilha limites com answerSchema via
// validateTextValueByCode. Não duplica regras: o controller chama o helper
// após resolver question.code.
export const answerPayloadSchema = z
  .object({
    question_id: z.string().min(1, 'question_id é obrigatório'),
    option_ids: z.array(z.string().min(1)).min(1).optional(),
    text_value: z
      .string()
      .max(TEXT_GLOBAL_MAX, `Máximo ${TEXT_GLOBAL_MAX} caracteres`)
      .nullable()
      .optional(),
    answered_at: z.string().datetime().optional(),
  })
  .refine(
    (data) =>
      (data.option_ids && data.option_ids.length > 0) ||
      data.text_value != null,
    {
      message: 'option_ids ou text_value deve ser informado',
      path: ['option_ids'],
    }
  )

export type AnswerPayloadInput = z.infer<typeof answerPayloadSchema>

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
      .min(2, 'Minimo 2 caracteres')
      .max(100, 'Maximo 100 caracteres')
      .regex(/^[a-zA-ZÀ-ÿ\s'\-]+$/, 'Nome contem caracteres invalidos'),
    email: z
      .string()
      .email('Email invalido')
      .transform((v) => v.toLowerCase()),
    phone: z
      .string()
      .max(20)
      .regex(/^\+?[0-9\s().-]{7,20}$/, 'Telefone invalido')
      .nullable()
      .optional(),
    whatsapp: z
      .string()
      .max(20)
      .regex(/^\+?[0-9\s().-]{7,20}$/, 'WhatsApp invalido')
      .nullable()
      .optional(),
    company: z.string().max(100).nullable().optional(),
    consentGiven: z.boolean(),
    consentVersion: z.string().min(1, 'consentVersion e obrigatorio').regex(/^\d+\.\d+$/, 'Formato de versao invalido'),
    // CL-245: Privacy Policy semver (separate from consentVersion legacy schema)
    policyVersion: z
      .string()
      .regex(/^\d+\.\d+\.\d+$/, 'policyVersion must be semver')
      .optional(),
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
  status: z.enum(['PENDING', 'SENT', 'FAILED', 'DEAD_LETTER']).optional(),
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
