import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { buildError, ERROR_CODES } from '@/lib/errors'
import { logger } from '@/lib/logger'

// ─────────────────────────────────────────────────────────────────────────────
// Schema de validação — aceita locales BCP-47 (pt-BR, en-US, es-ES, it-IT)
// O middleware já aplica rate limit de 50 req/min por IP para /api/v1/*
// ─────────────────────────────────────────────────────────────────────────────

const SUPPORTED_LOCALES = ['pt-BR', 'en-US', 'es-ES', 'it-IT'] as const
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

const questionParamSchema = z.object({
  locale: z
    .string()
    .refine(
      (v): v is SupportedLocale => (SUPPORTED_LOCALES as readonly string[]).includes(v),
      { message: `Locale deve ser um de: ${SUPPORTED_LOCALES.join(', ')}` }
    )
    .optional()
    .default('pt-BR'),
})

// ─────────────────────────────────────────────────────────────────────────────
// Resolver tradução com fallback: locale solicitado → pt-BR
// ─────────────────────────────────────────────────────────────────────────────

function resolveTranslation<T extends { locale: string }>(
  translations: T[],
  locale: string,
  fallback = 'pt-BR'
): T | undefined {
  return (
    translations.find((t) => t.locale === locale) ??
    translations.find((t) => t.locale === fallback)
  )
}

// RESOLVED: extraído include Prisma duplicado entre findUnique e findFirst fallback (G017)
function buildQuestionInclude(locale: string) {
  const localeFilter = { where: { locale: { in: [locale, 'pt-BR'] } } }
  return {
    options: {
      orderBy: { order: 'asc' as const },
      include: { translations: localeFilter },
    },
    translations: localeFilter,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/questions/[id]
// Retorna Question com Options e Translations filtradas por locale
// Rate limit: 50 req/min por IP (aplicado pelo middleware)
// ─────────────────────────────────────────────────────────────────────────────

type RouteParams = {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  // 1. Validar query params
  const searchParams = Object.fromEntries(request.nextUrl.searchParams)
  const parseResult = questionParamSchema.safeParse(searchParams)

  if (!parseResult.success) {
    return NextResponse.json(
      buildError(
        ERROR_CODES.VALIDATION_FAILED,
        'Parâmetros inválidos.',
        parseResult.error.flatten().fieldErrors['locale']?.join(', ')
      ),
      { status: 400 }
    )
  }

  const { locale } = parseResult.data
  const { id: questionId } = await params

  try {
    // 2. Buscar question por id (UUID)
    // Se não encontrar e for um code (ex: Q001), buscar por code
    const questionInclude = buildQuestionInclude(locale)
    let question = await prisma.question.findUnique({
      where: { id: questionId },
      include: questionInclude,
    })

    // Fallback: se não encontrou por id, tenta por code
    if (!question) {
      question = await prisma.question.findFirst({
        where: { code: questionId },
        include: questionInclude,
      })
    }

    if (!question) {
      return NextResponse.json(
        buildError(ERROR_CODES.NOT_FOUND, 'Pergunta não encontrada.'),
        { status: 404 }
      )
    }

    // 3. Resolver tradução da pergunta
    const questionTranslation = resolveTranslation(question.translations, locale)

    if (!questionTranslation) {
      return NextResponse.json(
        buildError(ERROR_CODES.NOT_FOUND, 'Tradução não encontrada para esta pergunta.'),
        { status: 404 }
      )
    }

    // 4. Montar resposta tipada
    const response = {
      id: question.id,
      code: question.code,
      type: question.type,
      block: question.block,
      order: question.order,
      required: question.required,
      translation: {
        locale: questionTranslation.locale,
        title: questionTranslation.title,
        description: questionTranslation.description ?? null,
        help_text: questionTranslation.help_text ?? null,
      },
      options: question.options.map((option) => {
        const optionTranslation = resolveTranslation(option.translations, locale)
        return {
          id: option.id,
          next_question_id: option.next_question_id,
          order: option.order,
          price_impact: option.price_impact,
          time_impact: option.time_impact,
          complexity_impact: option.complexity_impact,
          weight: option.weight,
          translation: {
            label: optionTranslation?.label ?? option.id,
            description: optionTranslation?.description ?? null,
          },
        }
      }),
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    logger.error('questions_internal_error', { question_id: questionId, error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      buildError(ERROR_CODES.INTERNAL_ERROR, 'Erro interno. Tente novamente em instantes.'),
      { status: 500 }
    )
  }
}
