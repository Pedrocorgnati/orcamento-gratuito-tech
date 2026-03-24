import { prisma } from '@/lib/prisma'
import { LOCALE_CURRENCY_MAP, Locale, Currency, SessionStatus, SESSION_TTL_HOURS } from '@/lib/enums'
import { LOCALE_URL_TO_ENUM } from '@/i18n/routing'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type SessionCreateInput = {
  /** Aceita BCP-47 (pt-BR) ou enum interno (pt_BR) */
  locale: string
  currency?: string
  visitorIp?: string | null
  userAgent?: string | null
}

export type SessionCreateResult = {
  id: string
  status: string
  locale: string
  currency: string
  current_question_id: string
  expires_at: Date
}

export type SessionGetResult = {
  id: string
  status: string
  locale: string
  currency: string
  current_question_id: string | null
  project_type: string | null
  path_taken: string[]
  accumulated_price: number
  accumulated_time: number
  accumulated_complexity: number
  questions_answered: number
  progress_percentage: number
  expires_at: Date
  created_at: Date
  updated_at: Date
}

export type CurrentQuestionTranslation = {
  locale: string
  title: string
  description: string | null
}

export type CurrentQuestionOption = {
  id: string
  order: number
  price_impact: number
  time_impact: number
  complexity_impact: number
  next_question_id: string | null
  translation: { label: string; description: string | null } | null
}

export type CurrentQuestion = {
  id: string
  code: string
  type: string
  block: string
  order: number
  is_required: boolean
  translation: CurrentQuestionTranslation | null
  options: CurrentQuestionOption[]
}

export type SessionGetWithQuestionResult = SessionGetResult & {
  currentQuestion: CurrentQuestion | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Translation helpers
// ─────────────────────────────────────────────────────────────────────────────

function resolveTranslation<T extends { locale: string }>(
  translations: T[],
  preferredLocale: string,
  fallback: string = 'pt_BR'
): T | undefined {
  return (
    translations.find((t) => t.locale === preferredLocale) ??
    translations.find((t) => t.locale === fallback)
  )
}

// RESOLVED: extraído mapeamento Session→SessionGetResult duplicado (G016)
function _mapSessionToResult(session: {
  id: string; status: string; locale: string; currency: string
  current_question_id: string | null; project_type: string | null
  path_taken: unknown; accumulated_price: number; accumulated_time: number
  accumulated_complexity: number; questions_answered: number
  progress_percentage: number; expires_at: Date; created_at: Date; updated_at: Date
}): SessionGetResult {
  return {
    id: session.id,
    status: session.status,
    locale: session.locale,
    currency: session.currency,
    current_question_id: session.current_question_id,
    project_type: session.project_type,
    path_taken: (session.path_taken as string[]) ?? [],
    accumulated_price: session.accumulated_price,
    accumulated_time: session.accumulated_time,
    accumulated_complexity: session.accumulated_complexity,
    questions_answered: session.questions_answered,
    progress_percentage: session.progress_percentage,
    expires_at: session.expires_at,
    created_at: session.created_at,
    updated_at: session.updated_at,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Locale helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Converte locale BCP-47 (pt-BR) para enum interno (pt_BR).
 * Se já for enum interno, retorna sem alteração.
 */
function toEnumLocale(locale: string): string {
  return (
    LOCALE_URL_TO_ENUM[locale as keyof typeof LOCALE_URL_TO_ENUM] ?? locale
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

export class SessionService {
  /**
   * Cria uma sessão anônima no banco.
   *
   * - Aceita locale BCP-47 (pt-BR) ou enum interno (pt_BR)
   * - Busca Q001 como primeira pergunta do fluxo
   * - TTL: 7 dias
   */
  async create(
    input: SessionCreateInput,
    meta?: { ip?: string; userAgent?: string }
  ): Promise<SessionCreateResult> {
    const enumLocale = toEnumLocale(input.locale)
    const currency =
      (LOCALE_CURRENCY_MAP[enumLocale as Locale] as string) ?? Currency.BRL

    const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000)

    // Buscar primeira pergunta do fluxo (Q001)
    const firstQuestion = await prisma.question.findFirst({
      where: { code: 'Q001' },
      select: { id: true },
      orderBy: { order: 'asc' },
    })

    const session = await prisma.session.create({
      data: {
        locale: enumLocale,
        currency,
        status: SessionStatus.IN_PROGRESS,
        current_question_id: firstQuestion?.id ?? null,
        expires_at: expiresAt,
        visitor_ip: meta?.ip ?? input.visitorIp ?? null,
        user_agent: meta?.userAgent ?? input.userAgent ?? null,
      },
    })

    return {
      id: session.id,
      status: session.status,
      locale: session.locale,
      currency: session.currency,
      // Se Q001 não existe no banco ainda, retornar 'Q001' como fallback
      current_question_id: session.current_question_id ?? firstQuestion?.id ?? 'Q001',
      expires_at: session.expires_at,
    }
  }

  /**
   * Busca sessão por ID.
   * Retorna null se não encontrada.
   */
  async findById(id: string): Promise<SessionGetResult | null> {
    const session = await prisma.session.findUnique({
      where: { id },
    })

    if (!session) return null

    return _mapSessionToResult(session)
  }

  /**
   * Busca sessão por ID incluindo a pergunta atual com traduções e opções.
   * Retorna null se não encontrada.
   */
  async findByIdWithQuestion(id: string): Promise<SessionGetWithQuestionResult | null> {
    const session = await prisma.session.findUnique({
      where: { id },
    })

    if (!session) return null

    const base = _mapSessionToResult(session)

    if (!session.current_question_id) {
      return { ...base, currentQuestion: null }
    }

    const question = await prisma.question.findUnique({
      where: { id: session.current_question_id },
      include: {
        translations: true,
        options: {
          orderBy: { order: 'asc' },
          include: {
            translations: true,
          },
        },
      },
    })

    if (!question) {
      return { ...base, currentQuestion: null }
    }

    const preferredLocale = session.locale
    const qTranslation = resolveTranslation(question.translations, preferredLocale)

    const options: CurrentQuestionOption[] = question.options.map((opt) => {
      const oTranslation = resolveTranslation(opt.translations, preferredLocale)
      return {
        id: opt.id,
        order: opt.order,
        price_impact: opt.price_impact,
        time_impact: opt.time_impact,
        complexity_impact: opt.complexity_impact,
        next_question_id: opt.next_question_id,
        translation: oTranslation
          ? { label: oTranslation.label, description: oTranslation.description ?? null }
          : null,
      }
    })

    const currentQuestion: CurrentQuestion = {
      id: question.id,
      code: question.code,
      type: question.type,
      block: question.block,
      order: question.order,
      is_required: question.required,
      translation: qTranslation
        ? {
            locale: qTranslation.locale,
            title: qTranslation.title,
            description: qTranslation.description ?? null,
          }
        : null,
      options,
    }

    return { ...base, currentQuestion }
  }

  /**
   * Verifica se a sessão está expirada.
   */
  isExpired(session: { expires_at: Date; status: string }): boolean {
    return (
      session.status === SessionStatus.EXPIRED ||
      session.expires_at < new Date()
    )
  }

  /**
   * Marca a sessão como expirada no banco.
   */
  async markExpired(id: string): Promise<void> {
    await prisma.session.update({
      where: { id },
      data: { status: SessionStatus.EXPIRED },
    })
  }
}

export const sessionService = new SessionService()
