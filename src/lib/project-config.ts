import { QuestionBlock, ProjectType } from '@/lib/enums'

export const PROJECT_TYPE_BY_Q001_ORDER: Record<number, ProjectType> = {
  1: ProjectType.WEBSITE,
  2: ProjectType.WEBSITE,
  3: ProjectType.ECOMMERCE,
  4: ProjectType.WEB_APP,
  5: ProjectType.MOBILE_APP,
  6: ProjectType.AUTOMATION_AI,
  7: ProjectType.MARKETPLACE,
  8: ProjectType.CRYPTO,
  9: ProjectType.BROWSER_EXT,
  10: ProjectType.MOBILE_APP,
  11: ProjectType.AUTOMATION_AI,
}

export const PROJECT_TYPE_TO_BLOCK: Record<ProjectType, QuestionBlock> = {
  [ProjectType.WEBSITE]: QuestionBlock.WEBSITES,
  [ProjectType.ECOMMERCE]: QuestionBlock.ECOMMERCE,
  [ProjectType.WEB_APP]: QuestionBlock.WEB_SYSTEM,
  [ProjectType.MOBILE_APP]: QuestionBlock.MOBILE_APP,
  [ProjectType.AUTOMATION_AI]: QuestionBlock.AUTOMATION_AI,
  [ProjectType.MARKETPLACE]: QuestionBlock.MARKETPLACE,
  [ProjectType.CRYPTO]: QuestionBlock.CRYPTO,
  [ProjectType.BROWSER_EXT]: QuestionBlock.BROWSER_EXT,
}

export const BLOCK_TO_PROJECT_TYPE: Partial<Record<QuestionBlock, ProjectType>> = {
  [QuestionBlock.WEBSITES]: ProjectType.WEBSITE,
  [QuestionBlock.ECOMMERCE]: ProjectType.ECOMMERCE,
  [QuestionBlock.WEB_SYSTEM]: ProjectType.WEB_APP,
  [QuestionBlock.MOBILE_APP]: ProjectType.MOBILE_APP,
  [QuestionBlock.AUTOMATION_AI]: ProjectType.AUTOMATION_AI,
  [QuestionBlock.MARKETPLACE]: ProjectType.MARKETPLACE,
  [QuestionBlock.CRYPTO]: ProjectType.CRYPTO,
  [QuestionBlock.BROWSER_EXT]: ProjectType.BROWSER_EXT,
}

export const CANONICAL_BLOCK_ORDER: QuestionBlock[] = [
  QuestionBlock.WEBSITES,
  QuestionBlock.ECOMMERCE,
  QuestionBlock.MARKETPLACE,
  QuestionBlock.WEB_SYSTEM,
  QuestionBlock.CRYPTO,
  QuestionBlock.MOBILE_APP,
  QuestionBlock.AUTOMATION_AI,
  QuestionBlock.BROWSER_EXT,
  QuestionBlock.CONTEXT,
  QuestionBlock.NARRATIVE,
  QuestionBlock.LEAD,
]

export const BLOCK_QUESTION_COUNT: Partial<Record<QuestionBlock, number>> = {
  [QuestionBlock.WEBSITES]: 5,
  [QuestionBlock.ECOMMERCE]: 5,
  [QuestionBlock.MARKETPLACE]: 5,
  [QuestionBlock.WEB_SYSTEM]: 12,
  [QuestionBlock.CRYPTO]: 5,
  [QuestionBlock.MOBILE_APP]: 8,
  [QuestionBlock.AUTOMATION_AI]: 8,
  [QuestionBlock.BROWSER_EXT]: 4,
  [QuestionBlock.CONTEXT]: 6,
  [QuestionBlock.NARRATIVE]: 4,
  // LEAD agora tem 5 (Q100-Q104) — Q105 removido em refactor-narrative-v4
  [QuestionBlock.LEAD]: 5,
}

export function normalizeProjectTypes(
  projectTypes: string[] | null | undefined,
  fallbackProjectType?: string | null
): ProjectType[] {
  if (projectTypes && projectTypes.length > 0) {
    return projectTypes as ProjectType[]
  }

  return fallbackProjectType ? [fallbackProjectType as ProjectType] : []
}

export function buildPendingBlocks(projectTypes: ProjectType[]): QuestionBlock[] {
  const selectedBlocks = new Set(
    projectTypes
      .map((projectType) => PROJECT_TYPE_TO_BLOCK[projectType])
      .filter(Boolean)
  )

  return CANONICAL_BLOCK_ORDER.filter((block) => {
    if (
      block === QuestionBlock.CONTEXT ||
      block === QuestionBlock.NARRATIVE ||
      block === QuestionBlock.LEAD
    ) {
      return true
    }

    return selectedBlocks.has(block)
  })
}

export function estimateQuestionCountForProjectTypes(projectTypes: ProjectType[]): number {
  const normalized = normalizeProjectTypes(projectTypes, null)
  if (normalized.length === 0) return 15

  const pendingBlocks = buildPendingBlocks(normalized)
  const blockQuestions = pendingBlocks.reduce(
    (sum, block) => sum + (BLOCK_QUESTION_COUNT[block] ?? 0),
    0
  )

  return 2 + blockQuestions
}
