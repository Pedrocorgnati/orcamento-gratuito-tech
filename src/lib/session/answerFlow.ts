import { ProjectType, QuestionType } from '@/lib/enums'
import { buildPendingBlocks, PROJECT_TYPE_BY_Q001_ORDER } from '@/lib/project-config'
import { prisma } from '@/lib/prisma'
import type { PrismaLike } from '@/lib/session/recalculateAccumulators'
import { validateTextValueByCode } from '@/lib/validations/schemas'

type SkipLogic = {
  next_question?: string | null
  end_of_block?: boolean
  dynamic_next?: {
    based_on?: string
    mapping?: Record<string, string>
  }
}

type BuildAnswerFlowInput = {
  sessionId: string
  questionId: string
  optionIds?: string[]
  textValue?: string | null
  client?: PrismaLike
}

type SelectedOption = {
  id: string
  order: number
  price_impact: number
  time_impact: number
  complexity_impact: number
  next_question_id: string | null
}

export type AnswerFlowContext = {
  questionCode: string
  priceImpact: number
  timeImpact: number
  complexityImpact: number
  nextQuestionId: string | null
  sessionUpdateData: {
    project_type?: ProjectType
    project_types?: ProjectType[]
    pending_blocks?: string[]
    current_block?: string | null
  }
  persistedTextValue: string | null
}

// Valores canônicos para scoring e qualificação.
// Budget usa o valor de referência mais legível da faixa.
const NORMALIZED_BUDGET_BY_ORDER: Record<number, string> = {
  1: '3000',
  2: '8000',
  3: '20000',
  4: '20000',
}

// Deadline usa janelas representativas em dias para cada faixa.
const NORMALIZED_DEADLINE_BY_ORDER: Record<number, string> = {
  1: '20',
  2: '60',
  3: '120',
}

function parseSkipLogic(value: unknown): SkipLogic | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as SkipLogic
}

async function resolveQuestionRefToId(
  client: PrismaLike,
  questionRef: string | null | undefined
): Promise<string | null> {
  if (!questionRef) return null

  const nextQuestion = questionRef.startsWith('Q')
    ? await client.question.findFirst({
        where: { code: questionRef },
        select: { id: true },
      })
    : await client.question.findUnique({
        where: { id: questionRef },
        select: { id: true },
      })

  return nextQuestion?.id ?? null
}

async function resolveDynamicNextQuestionId(
  client: PrismaLike,
  sessionId: string,
  skipLogic: SkipLogic,
  override?: { currentBlock?: string | null; projectType?: string | null }
): Promise<string | null> {
  const mapping = skipLogic.dynamic_next?.mapping
  if (!mapping) return null

  const sessionFallback =
    override !== undefined
      ? null
      : await client.session.findUnique({
          where: { id: sessionId },
          select: { current_block: true, project_type: true },
        })

  const effectiveCurrentBlock =
    override?.currentBlock ?? sessionFallback?.current_block ?? null
  const effectiveProjectType =
    override?.projectType ?? sessionFallback?.project_type ?? null

  const directCurrentBlockTarget = effectiveCurrentBlock
    ? mapping[effectiveCurrentBlock]
    : undefined

  if (directCurrentBlockTarget) {
    return resolveQuestionRefToId(client, directCurrentBlockTarget)
  }

  const directProjectTypeTarget = effectiveProjectType
    ? mapping[effectiveProjectType]
    : undefined

  if (directProjectTypeTarget) {
    return resolveQuestionRefToId(client, directProjectTypeTarget)
  }

  const basedOnCode = skipLogic.dynamic_next?.based_on
  if (!basedOnCode) return null

  const basedOnAnswer = await client.answer.findFirst({
    where: {
      session_id: sessionId,
      question: { code: basedOnCode },
    },
    select: {
      option: { select: { order: true } },
    },
  })

  const basedOnOrder = basedOnAnswer?.option?.order
  if (!basedOnOrder) return null

  const mappedTarget = mapping[String(basedOnOrder)]
  return resolveQuestionRefToId(client, mappedTarget)
}

function normalizeTextValue(
  questionType: string,
  selectedOptions: SelectedOption[],
  rawTextValue: string | null | undefined
): string | null {
  if (rawTextValue != null) return rawTextValue

  if (selectedOptions.length > 1) {
    return JSON.stringify(selectedOptions.map((option) => option.id))
  }

  const singleOption = selectedOptions[0]
  if (!singleOption) return null

  if (questionType === QuestionType.BUDGET_SELECT) {
    return NORMALIZED_BUDGET_BY_ORDER[singleOption.order] ?? null
  }

  if (questionType === QuestionType.DEADLINE_SELECT) {
    return NORMALIZED_DEADLINE_BY_ORDER[singleOption.order] ?? null
  }

  return null
}

async function resolveQueuedNextQuestionId(
  client: PrismaLike,
  sessionId: string
): Promise<{
  nextQuestionId: string | null
  sessionUpdateData: AnswerFlowContext['sessionUpdateData']
} | null> {
  const session = await client.session.findUnique({
    where: { id: sessionId },
    select: {
      pending_blocks: true,
      current_block: true,
    },
  })

  const pendingBlocks = (session?.pending_blocks as string[] | null | undefined) ?? []
  const currentBlock = session?.current_block ?? null

  if (pendingBlocks.length === 0 || !currentBlock) {
    return null
  }

  if (pendingBlocks[0] !== currentBlock) {
    return null
  }

  const nextPendingBlocks = pendingBlocks.slice(1)
  const nextBlock = nextPendingBlocks[0] ?? null

  if (!nextBlock) {
    return {
      nextQuestionId: null,
      sessionUpdateData: {
        pending_blocks: [],
        current_block: null,
      },
    }
  }

  const nextQuestion = await client.question.findFirst({
    where: { block: nextBlock },
    select: { id: true },
    orderBy: { order: 'asc' },
  })

  return {
    nextQuestionId: nextQuestion?.id ?? null,
    sessionUpdateData: {
      pending_blocks: nextPendingBlocks,
      current_block: nextBlock,
    },
  }
}

/**
 * CL-279: fallback determinista para o Bloco 7 (Contexto).
 *
 * Quando nenhuma regra de next/dynamic/end-of-block resolve o próximo passo,
 * encaminha a sessão para a primeira Question do Bloco 7 que ainda não foi
 * respondida. Retorna null se não houver nada pendente (fim legítimo do fluxo).
 */
export async function resolveFallbackToBlock7(
  client: PrismaLike,
  sessionId: string
): Promise<string | null> {
  const answered = await client.answer.findMany({
    where: { session_id: sessionId },
    select: { question_id: true },
  })
  const answeredIds = new Set(answered.map((a) => a.question_id))

  const block7Questions = await client.question.findMany({
    where: { block: 'CONTEXT' },
    select: { id: true, order: true },
    orderBy: { order: 'asc' },
  })

  const next = block7Questions.find((q) => !answeredIds.has(q.id))
  return next?.id ?? null
}

export async function buildAnswerFlowContext(input: BuildAnswerFlowInput): Promise<AnswerFlowContext> {
  const { sessionId, questionId, optionIds, textValue, client = prisma } = input

  const question = await client.question.findUnique({
    where: { id: questionId },
    select: {
      code: true,
      type: true,
      skip_logic: true,
    },
  })

  if (!question) {
    throw new Error('QUESTION_NOT_FOUND')
  }

  // Validação por código apenas para TEXT_INPUT/NUMBER_INPUT — opções são
  // validadas via lookup de Option.id (INVALID_OPTIONS adiante).
  if (
    question.type === QuestionType.TEXT_INPUT ||
    question.type === QuestionType.NUMBER_INPUT
  ) {
    const validation = validateTextValueByCode(question.code, textValue)
    if (!validation.ok) {
      throw new Error(`INVALID_TEXT_VALUE:${validation.message}`)
    }
  }

  let selectedOptions: SelectedOption[] = []

  if (optionIds && optionIds.length > 0) {
    selectedOptions = await client.option.findMany({
      where: { id: { in: optionIds }, question_id: questionId },
      select: {
        id: true,
        order: true,
        price_impact: true,
        time_impact: true,
        complexity_impact: true,
        next_question_id: true,
      },
      orderBy: { order: 'asc' },
    })

    if (selectedOptions.length !== optionIds.length) {
      throw new Error('INVALID_OPTIONS')
    }
  }

  const priceImpact = selectedOptions.reduce((sum, option) => sum + option.price_impact, 0)
  const timeImpact = selectedOptions.reduce((sum, option) => sum + option.time_impact, 0)
  const complexityImpact = selectedOptions.reduce((sum, option) => sum + option.complexity_impact, 0)
  const skipLogic = parseSkipLogic(question.skip_logic)
  let sessionUpdateData: AnswerFlowContext['sessionUpdateData'] = {}

  let nextQuestionId = selectedOptions.length > 0
    ? selectedOptions[selectedOptions.length - 1]?.next_question_id ?? null
    : null

  if (
    selectedOptions.length === 0 &&
    (question.type === QuestionType.TEXT_INPUT || question.type === QuestionType.NUMBER_INPUT)
  ) {
    nextQuestionId = await resolveQuestionRefToId(client, skipLogic?.next_question ?? null)
  }

  // Q001: calcular pending_blocks ANTES do dynamic_next (que usa current_block).
  let overrideBlockForDynamicNext: string | null | undefined
  let overrideProjectTypeForDynamicNext: string | null | undefined

  if (question.code === 'Q001' && selectedOptions.length > 0) {
    const projectTypes = selectedOptions
      .map((option) => PROJECT_TYPE_BY_Q001_ORDER[option.order])
      .filter((projectType): projectType is ProjectType => Boolean(projectType))

    const uniqueProjectTypes = [...new Set(projectTypes)]
    const pendingBlocks = buildPendingBlocks(uniqueProjectTypes)

    sessionUpdateData = {
      project_type: uniqueProjectTypes[0],
      project_types: uniqueProjectTypes,
      pending_blocks: pendingBlocks,
      current_block: pendingBlocks[0] ?? null,
    }

    overrideBlockForDynamicNext = pendingBlocks[0] ?? null
    overrideProjectTypeForDynamicNext = uniqueProjectTypes[0] ?? null
  }

  if (skipLogic?.dynamic_next) {
    const override =
      overrideBlockForDynamicNext !== undefined || overrideProjectTypeForDynamicNext !== undefined
        ? {
            currentBlock: overrideBlockForDynamicNext ?? null,
            projectType: overrideProjectTypeForDynamicNext ?? null,
          }
        : undefined
    const dynamicNextQuestionId = await resolveDynamicNextQuestionId(client, sessionId, skipLogic, override)
    if (dynamicNextQuestionId) {
      nextQuestionId = dynamicNextQuestionId
    }
  }

  if (skipLogic?.end_of_block) {
    const queuedNext = await resolveQueuedNextQuestionId(client, sessionId)
    if (queuedNext) {
      nextQuestionId = queuedNext.nextQuestionId
      sessionUpdateData = {
        ...sessionUpdateData,
        ...queuedNext.sessionUpdateData,
      }
    }
  }

  // CL-279: fallback determinista — se chegamos aqui sem nextQuestionId e
  // sem pending_blocks, tentar primeira Question do Bloco 7 (Contexto) que a
  // sessão ainda não respondeu. Evita dead-end quando option não tem
  // next_question_id explícito e não há fallback em skip_logic.
  if (
    nextQuestionId === null &&
    !sessionUpdateData.pending_blocks &&
    !sessionUpdateData.current_block
  ) {
    nextQuestionId = await resolveFallbackToBlock7(client, sessionId)
  }

  const persistedTextValue = normalizeTextValue(question.type, selectedOptions, textValue)

  return {
    questionCode: question.code,
    priceImpact,
    timeImpact,
    complexityImpact,
    nextQuestionId,
    sessionUpdateData,
    persistedTextValue,
  }
}
