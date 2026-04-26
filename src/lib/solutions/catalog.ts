import { ProjectType } from '@/lib/enums'

export type SolutionSlug =
  | 'site-institucional'
  | 'landing-page'
  | 'ecommerce'
  | 'saas'
  | 'aplicativo-android'
  | 'aplicativo-ios'
  | 'marketplace'
  | 'automacao'
  | 'inteligencia-artificial'
  | 'cripto'
  | 'extensao-chrome'

export type SolutionEntry = {
  slug: SolutionSlug
  projectType: ProjectType
  preselectFlowOption: number
  iconKey: string
  order: number
}

export const SOLUTIONS: Record<SolutionSlug, SolutionEntry> = {
  'site-institucional': {
    slug: 'site-institucional',
    projectType: ProjectType.WEBSITE,
    preselectFlowOption: 1,
    iconKey: 'Building2',
    order: 1,
  },
  'landing-page': {
    slug: 'landing-page',
    projectType: ProjectType.WEBSITE,
    preselectFlowOption: 2,
    iconKey: 'Rocket',
    order: 2,
  },
  ecommerce: {
    slug: 'ecommerce',
    projectType: ProjectType.ECOMMERCE,
    preselectFlowOption: 3,
    iconKey: 'ShoppingBag',
    order: 3,
  },
  saas: {
    slug: 'saas',
    projectType: ProjectType.WEB_APP,
    preselectFlowOption: 4,
    iconKey: 'LayoutGrid',
    order: 4,
  },
  'aplicativo-android': {
    slug: 'aplicativo-android',
    projectType: ProjectType.MOBILE_APP,
    preselectFlowOption: 5,
    iconKey: 'Smartphone',
    order: 5,
  },
  automacao: {
    slug: 'automacao',
    projectType: ProjectType.AUTOMATION_AI,
    preselectFlowOption: 6,
    iconKey: 'Workflow',
    order: 6,
  },
  marketplace: {
    slug: 'marketplace',
    projectType: ProjectType.MARKETPLACE,
    preselectFlowOption: 7,
    iconKey: 'Store',
    order: 7,
  },
  cripto: {
    slug: 'cripto',
    projectType: ProjectType.CRYPTO,
    preselectFlowOption: 8,
    iconKey: 'Bitcoin',
    order: 8,
  },
  'extensao-chrome': {
    slug: 'extensao-chrome',
    projectType: ProjectType.BROWSER_EXT,
    preselectFlowOption: 9,
    iconKey: 'Chrome',
    order: 9,
  },
  'aplicativo-ios': {
    slug: 'aplicativo-ios',
    projectType: ProjectType.MOBILE_APP,
    preselectFlowOption: 10,
    iconKey: 'Apple',
    order: 10,
  },
  'inteligencia-artificial': {
    slug: 'inteligencia-artificial',
    projectType: ProjectType.AUTOMATION_AI,
    preselectFlowOption: 11,
    iconKey: 'Sparkles',
    order: 11,
  },
}

export const SOLUTION_SLUGS = Object.keys(SOLUTIONS) as SolutionSlug[]

export const SOLUTIONS_BY_ORDER: readonly SolutionEntry[] = Object.values(SOLUTIONS)
  .slice()
  .sort((a, b) => a.order - b.order)

export function isSolutionSlug(value: string): value is SolutionSlug {
  return value in SOLUTIONS
}

/**
 * Retorna o caminho interno (sem locale prefix) para uma solução.
 * O path base (/solucoes) é traduzido via next-intl pathnames.
 */
export function solutionInternalPath(slug: SolutionSlug): `/solucoes/${string}` {
  return `/solucoes/${slug}`
}

export const SOLUTIONS_HUB_INTERNAL_PATH = '/solucoes' as const
