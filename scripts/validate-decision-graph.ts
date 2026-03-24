import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

// Handle --dry-run before PrismaClient instantiation (no DB needed)
if (process.argv.includes('--dry-run')) {
  console.log('ℹ️  Modo --dry-run: apenas verifica se o script compila, sem consultar o banco.')
  console.log('✅ Script válido (dry-run)')
  process.exit(0)
}

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

interface QuestionNode {
  id: string
  code: string
  block: string
  type: string
  required: boolean
  skip_logic: unknown
  options: Array<{
    id: string
    order: number
    next_question_id: string | null
  }>
}

async function loadGraph(prisma: PrismaClient): Promise<Map<string, QuestionNode>> {
  const questions = await prisma.question.findMany({
    include: {
      options: {
        select: { id: true, order: true, next_question_id: true },
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { order: 'asc' },
  })

  const graph = new Map<string, QuestionNode>()
  for (const q of questions) {
    graph.set(q.id, {
      id: q.id,
      code: q.code,
      block: q.block,
      type: q.type,
      required: q.required,
      skip_logic: q.skip_logic,
      options: q.options,
    })
  }
  return graph
}

interface DFSResult {
  visited: Set<string>
  cycles: string[][]
  paths_to_lead: number
  blocks_visited: Set<string>
}

function dfsValidate(graph: Map<string, QuestionNode>, startId: string): DFSResult {
  const visited = new Set<string>()
  const cycles: string[][] = []
  const blocks_visited = new Set<string>()
  let paths_to_lead = 0

  const stack: Array<{ id: string; path: string[] }> = [{ id: startId, path: [] }]

  while (stack.length > 0) {
    const { id, path } = stack.pop()!

    if (path.includes(id)) {
      const cycleStart = path.indexOf(id)
      cycles.push([...path.slice(cycleStart), id])
      continue
    }

    const node = graph.get(id)
    if (!node) continue

    visited.add(id)
    blocks_visited.add(node.block)
    const currentPath = [...path, id]

    // TEXT_INPUT do LEAD: verificar skip_logic.next_question
    if (node.block === 'LEAD') {
      const sl = node.skip_logic as Record<string, unknown> | null
      const skipNext = sl?.next_question
      if (typeof skipNext === 'string') {
        const nextNode = [...graph.values()].find(n => n.code === skipNext)
        if (nextNode) stack.push({ id: nextNode.id, path: currentPath })
      } else {
        // null → END
        paths_to_lead++
      }
    }

    // Processar opções com next_question_id
    for (const option of node.options) {
      if (option.next_question_id !== null) {
        stack.push({ id: option.next_question_id, path: currentPath })
      }
    }

    // TEXT_INPUT fora do LEAD: verificar skip_logic.next_question
    if (node.options.length === 0 && node.block !== 'LEAD' && node.skip_logic) {
      const sl = node.skip_logic as Record<string, unknown>
      if (typeof sl.next_question === 'string') {
        const nextNode = [...graph.values()].find(n => n.code === sl.next_question)
        if (nextNode) stack.push({ id: nextNode.id, path: currentPath })
      }
    }
  }

  return { visited, cycles, paths_to_lead, blocks_visited }
}

const EXPECTED_BLOCKS = [
  'PROJECT_TYPE', 'WEBSITES', 'ECOMMERCE', 'WEB_SYSTEM',
  'MOBILE_APP', 'AUTOMATION_AI', 'CONTEXT', 'LEAD',
] as const

const EXPECTED_QUESTION_COUNT = 42

// ─────────────────────────────────────────────────────────────────────────────
// Constantes para verificações de seed data (module-19, TASK-3)
// ─────────────────────────────────────────────────────────────────────────────

const EXPECTED_LOCALES = ['pt_BR', 'en_US', 'es_ES', 'it_IT'] // Locale enum values
const EXPECTED_TRANSLATIONS = EXPECTED_QUESTION_COUNT * EXPECTED_LOCALES.length // 168
const MIN_OPTION_TRANSLATIONS = 200 // estimativa conservadora
const EXPECTED_QUESTION_TYPES = [
  'SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TEXT_INPUT',
  'NUMBER_INPUT', 'RANGE_SELECT', 'BUDGET_SELECT', 'DEADLINE_SELECT',
] // 7 tipos (INT-050)
const EXPECTED_PROJECT_TYPES_COUNT = 5
const EXPECTED_CURRENCIES: Array<{ from: string; to: string }> = [
  { from: 'BRL', to: 'USD' },
  { from: 'BRL', to: 'EUR' },
]

interface ValidationResult {
  check: string
  expected: string | number
  actual: string | number
  passed: boolean
  error?: string
}

// Verificação S1: QuestionTranslations — 42 × 4 locales = 168
async function checkTranslationCount(): Promise<ValidationResult> {
  const count = await prisma.questionTranslation.count()
  return {
    check: 'QuestionTranslations (42 × 4 locales = 168)',
    expected: EXPECTED_TRANSLATIONS,
    actual: count,
    passed: count === EXPECTED_TRANSLATIONS,
  }
}

// Verificação S2: OptionTranslations — mínimo ~200
async function checkOptionTranslationCount(): Promise<ValidationResult> {
  const count = await prisma.optionTranslation.count()
  return {
    check: `OptionTranslations (mínimo ${MIN_OPTION_TRANSLATIONS})`,
    expected: `>= ${MIN_OPTION_TRANSLATIONS}`,
    actual: count,
    passed: count >= MIN_OPTION_TRANSLATIONS,
  }
}

// Verificação S3: 7 tipos de pergunta (INT-050)
async function checkQuestionTypes(): Promise<ValidationResult> {
  const types = await prisma.question.findMany({
    select: { type: true },
    distinct: ['type'],
  })
  const typeValues = types.map((t) => t.type)
  const missingTypes = EXPECTED_QUESTION_TYPES.filter((t) => !typeValues.includes(t))
  return {
    check: '7 tipos de pergunta (INT-050)',
    expected: EXPECTED_QUESTION_TYPES.join(', '),
    actual: typeValues.join(', '),
    passed: missingTypes.length === 0,
    error:
      missingTypes.length > 0
        ? `Tipos faltando: ${missingTypes.join(', ')}`
        : undefined,
  }
}

// Verificação S4: PricingConfig — 5 tipos de projeto
async function checkPricingConfig(): Promise<ValidationResult> {
  const count = await prisma.pricingConfig.count()
  return {
    check: `PricingConfig — ${EXPECTED_PROJECT_TYPES_COUNT} tipos de projeto`,
    expected: EXPECTED_PROJECT_TYPES_COUNT,
    actual: count,
    passed: count >= EXPECTED_PROJECT_TYPES_COUNT,
  }
}

// Verificação S5: ExchangeRates — BRL→USD e BRL→EUR
async function checkExchangeRates(): Promise<ValidationResult> {
  const checks = await Promise.all(
    EXPECTED_CURRENCIES.map(({ from, to }) =>
      prisma.exchangeRate.findFirst({ where: { from_currency: from, to_currency: to } })
    )
  )
  const missing = EXPECTED_CURRENCIES.filter((_, i) => !checks[i]).map(
    ({ from, to }) => `${from}→${to}`
  )
  const invalidRates = EXPECTED_CURRENCIES.filter(
    (_, i) => checks[i] && (checks[i]!.rate <= 0 || !Number.isFinite(checks[i]!.rate))
  ).map(({ from, to }) => `${from}→${to}`)

  const allIssues = [
    ...missing.map((m) => `faltando: ${m}`),
    ...invalidRates.map((r) => `rate inválido (<=0 ou NaN): ${r}`),
  ]

  return {
    check: 'ExchangeRates: BRL→USD e BRL→EUR (com rate > 0)',
    expected: 'ambas presentes com rate > 0',
    actual: allIssues.length === 0 ? 'ambas presentes' : allIssues.join('; '),
    passed: allIssues.length === 0,
    error: allIssues.length > 0 ? allIssues.join('; ') : undefined,
  }
}

// Verificação S6: Qualidade das traduções (1 por locale, sem vazio) — INT-108
async function checkTranslationQuality(): Promise<ValidationResult> {
  const questions = await prisma.question.findMany({
    include: { translations: true },
  })
  const issues: string[] = []

  for (const q of questions) {
    for (const locale of EXPECTED_LOCALES) {
      const trans = q.translations.filter((t) => t.locale === locale)
      if (trans.length === 0)
        issues.push(`q.${q.code}: sem tradução para ${locale}`)
      if (trans.length > 1)
        issues.push(`q.${q.code}: tradução duplicada para ${locale}`)
      if (trans[0] && !trans[0].title?.trim())
        issues.push(`q.${q.code}: title vazio para ${locale}`)
    }
  }

  return {
    check: 'Qualidade das traduções (1 por locale, sem title vazio)',
    expected: '0 issues',
    actual: issues.length === 0 ? '0 issues' : `${issues.length} issues`,
    passed: issues.length === 0,
    error:
      issues.length > 0
        ? issues.slice(0, 3).join('; ') + (issues.length > 3 ? '...' : '')
        : undefined,
  }
}

// Executar verificações de seed data e retornar resultados
async function runSeedValidations(): Promise<ValidationResult[]> {
  const seedChecks = [
    checkTranslationCount,
    checkOptionTranslationCount,
    checkQuestionTypes,
    checkPricingConfig,
    checkExchangeRates,
    checkTranslationQuality,
  ]

  const results: ValidationResult[] = []
  for (const check of seedChecks) {
    try {
      results.push(await check())
    } catch (error) {
      results.push({
        check: check.name,
        expected: 'sucesso',
        actual: 'ERRO',
        passed: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      })
    }
  }
  return results
}

async function main() {
  console.log('🔍 Iniciando validação do grafo de decisão...\n')

  const graph = await loadGraph(prisma)

  const rootNode = [...graph.values()].find(n => n.code === 'Q001')
  if (!rootNode) {
    console.error('❌ FATAL: Q001 não encontrada no banco!')
    process.exit(1)
  }

  const dfsResult = dfsValidate(graph, rootNode.id)

  // Verificação 1: Total de questões
  const totalQuestions = graph.size
  const check1 = totalQuestions === EXPECTED_QUESTION_COUNT
  console.log(`${check1 ? '✅' : '❌'} Total de questões: ${totalQuestions} (esperado: ${EXPECTED_QUESTION_COUNT})`)

  // Verificação 2: Zero ciclos
  const check2 = dfsResult.cycles.length === 0
  console.log(`${check2 ? '✅' : '❌'} Ciclos no grafo: ${dfsResult.cycles.length} (esperado: 0)`)
  if (!check2) {
    for (const cycle of dfsResult.cycles) {
      const codes = cycle.map(id => graph.get(id)?.code ?? id)
      console.log(`   Ciclo detectado: ${codes.join(' → ')}`)
    }
  }

  // Verificação 3: Zero orphans
  const allIds = new Set(graph.keys())
  const orphans = [...allIds].filter(id => !dfsResult.visited.has(id))
  const check3 = orphans.length === 0
  console.log(`${check3 ? '✅' : '❌'} Orphans (questões não atingíveis): ${orphans.length} (esperado: 0)`)
  if (!check3) {
    for (const id of orphans) {
      console.log(`   Orphan: ${graph.get(id)?.code ?? id}`)
    }
  }

  // Verificação 4: Caminhos terminam no Bloco LEAD
  const check4 = dfsResult.paths_to_lead > 0
  console.log(`${check4 ? '✅' : '❌'} Caminhos terminando em Bloco LEAD: ${dfsResult.paths_to_lead} (esperado: > 0)`)

  // Verificação 5: Cobertura dos 8 blocos
  const missingBlocks = EXPECTED_BLOCKS.filter(b => !dfsResult.blocks_visited.has(b))
  const check5 = missingBlocks.length === 0
  console.log(`${check5 ? '✅' : '❌'} Blocos cobertos: ${dfsResult.blocks_visited.size}/8`)
  if (!check5) {
    console.log(`   Blocos faltantes: ${missingBlocks.join(', ')}`)
  }

  // Verificação 6: next_question_id inválidos
  const allOptions = await prisma.option.findMany({
    where: { next_question_id: { not: null } },
    select: { id: true, next_question_id: true, question: { select: { code: true } } },
  })
  const invalidNextIds = allOptions.filter(o => !graph.has(o.next_question_id!))
  const check6 = invalidNextIds.length === 0
  console.log(`${check6 ? '✅' : '❌'} Opções com next_question_id inválido: ${invalidNextIds.length} (esperado: 0)`)
  if (!check6) {
    for (const inv of invalidNextIds) {
      console.log(`   Inválido em ${inv.question.code}: next_question_id=${inv.next_question_id}`)
    }
  }

  // Verificação 7: skip_logic com next_question referências válidas
  const questionsWithSkipLogic = [...graph.values()].filter(
    n => n.skip_logic && typeof (n.skip_logic as Record<string, unknown>).next_question === 'string'
  )
  const invalidSkipRefs = questionsWithSkipLogic.filter(n => {
    const next = (n.skip_logic as Record<string, unknown>).next_question as string
    return ![...graph.values()].find(q => q.code === next)
  })
  const check7 = invalidSkipRefs.length === 0
  console.log(`${check7 ? '✅' : '❌'} skip_logic com next_question inválido: ${invalidSkipRefs.length} (esperado: 0)`)
  if (!check7) {
    for (const inv of invalidSkipRefs) {
      console.log(`   Referência inválida em ${inv.code}`)
    }
  }

  // ── Verificações de seed data (module-19, TASK-3) ──────────────────────────
  console.log('\n🌱 Verificando seed data...\n')
  const seedResults = await runSeedValidations()
  for (const result of seedResults) {
    const icon = result.passed ? '✅' : '❌'
    console.log(`${icon} ${result.check}`)
    if (!result.passed) {
      console.log(`   Esperado: ${result.expected}`)
      console.log(`   Atual:    ${result.actual}`)
      if (result.error) console.log(`   Erro:     ${result.error}`)
    }
  }

  // Sumário
  console.log('\n─────────────────────────────────────────')
  const allChecks = [check1, check2, check3, check4, check5, check6, check7]
  const seedPassed = seedResults.filter((r) => r.passed).length
  const allSeedChecks = seedResults.map((r) => r.passed)
  const allPassedCombined = [...allChecks, ...allSeedChecks]
  const passed = allPassedCombined.filter(Boolean).length
  const total = allPassedCombined.length

  if (passed === total) {
    console.log(`✅ GRAFO + SEED VÁLIDOS — ${passed}/${total} verificações passaram`)
    console.log(`   Total questões: ${totalQuestions}`)
    console.log(`   Questões atingíveis: ${dfsResult.visited.size}`)
    console.log(`   Blocos cobertos: ${[...dfsResult.blocks_visited].join(', ')}`)
    console.log(`   Caminhos completos (até LEAD): ${dfsResult.paths_to_lead}`)
    console.log(`   Verificações de seed: ${seedPassed}/${seedResults.length} passaram`)
  } else {
    console.log(`❌ VALIDAÇÃO FALHOU — ${passed}/${total} verificações passaram`)
    console.log(`   Grafo: ${allChecks.filter(Boolean).length}/${allChecks.length}`)
    console.log(`   Seed:  ${seedPassed}/${seedResults.length}`)
    process.exit(1)
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
