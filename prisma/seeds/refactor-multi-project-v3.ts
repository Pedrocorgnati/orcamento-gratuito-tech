import fs from 'node:fs/promises'
import path from 'node:path'
import { createSeedPrismaClient } from './_createPrismaClient'
import { seedQuestions } from './questions'
import { seedTranslations } from './translations'
import { seedGraph } from './graph'
import { addDescriptionsPtBr } from './add-descriptions-pt-BR'
import { applyQuestionsRefactorV2 } from './refactor-questions-v2'

const prisma = createSeedPrismaClient()

const MIGRATION_FILE = path.join(
  process.cwd(),
  'prisma/migrations/20260418000000_multi_project_types/migration.sql'
)

const PRICING_CONFIGS = [
  {
    project_type: 'MARKETPLACE',
    base_price: 22000,
    base_days: 70,
    complexity_multiplier_low: 0.8,
    complexity_multiplier_medium: 1.0,
    complexity_multiplier_high: 1.5,
    complexity_multiplier_very_high: 2.1,
  },
  {
    project_type: 'CRYPTO',
    base_price: 28000,
    base_days: 75,
    complexity_multiplier_low: 0.85,
    complexity_multiplier_medium: 1.0,
    complexity_multiplier_high: 1.6,
    complexity_multiplier_very_high: 2.3,
  },
  {
    project_type: 'BROWSER_EXT',
    base_price: 6000,
    base_days: 21,
    complexity_multiplier_low: 0.75,
    complexity_multiplier_medium: 1.0,
    complexity_multiplier_high: 1.4,
    complexity_multiplier_very_high: 1.9,
  },
] as const

async function applyMigration() {
  const sql = await fs.readFile(MIGRATION_FILE, 'utf8')
  await prisma.$executeRawUnsafe(sql)
}

async function upsertPricingConfigs() {
  let updated = 0

  for (const config of PRICING_CONFIGS) {
    await prisma.pricingConfig.upsert({
      where: { project_type: config.project_type },
      update: { ...config },
      create: { ...config },
    })
    updated += 1
  }

  return updated
}

async function summarizeQ001() {
  const q001 = await prisma.question.findUnique({
    where: { code: 'Q001' },
    include: { options: { orderBy: { order: 'asc' } } },
  })

  return {
    tipo: q001?.type ?? 'desconhecido',
    total_opcoes: q001?.options.length ?? 0,
  }
}

async function summarizeNewBlocks() {
  const blocks = await prisma.question.groupBy({
    by: ['block'],
    where: { block: { in: ['MARKETPLACE', 'CRYPTO', 'BROWSER_EXT'] } },
    _count: { _all: true },
  })

  return Object.fromEntries(blocks.map((item) => [item.block, item._count._all]))
}

async function main() {
  console.log('[refactor-multi-project-v3] início')

  await applyMigration()
  console.log('[refactor-multi-project-v3] migration_aplicada', JSON.stringify({
    arquivo: 'prisma/migrations/20260418000000_multi_project_types/migration.sql',
  }))

  await seedQuestions(prisma)
  await seedTranslations(prisma)
  await seedGraph(prisma)
  await addDescriptionsPtBr(prisma)
  await applyQuestionsRefactorV2(prisma)

  const pricingConfigsAtualizadas = await upsertPricingConfigs()
  const q001 = await summarizeQ001()
  const blocks = await summarizeNewBlocks()

  console.log('[refactor-multi-project-v3] resumo', JSON.stringify({
    q001,
    blocos_novos: blocks,
    pricing_configs_atualizadas: pricingConfigsAtualizadas,
  }))
}

main()
  .catch((error) => {
    console.error('[refactor-multi-project-v3] erro', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
