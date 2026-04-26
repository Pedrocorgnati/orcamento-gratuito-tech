import type { PrismaClient } from '@prisma/client'
import { createSeedPrismaClient } from './_createPrismaClient'

const TARGET_CODES = [
  'Q030', 'Q031', 'Q032', 'Q033', 'Q034', 'Q035', 'Q036', 'Q037', 'Q038', 'Q039', 'Q040', 'Q041',
  'Q046', 'Q047', 'Q048', 'Q049', 'Q050', 'Q051', 'Q052',
  'Q092',
] as const

const LABELS = {
  'pt-BR': 'Não sei / preciso de orientação',
  'en-US': 'I am not sure / I need guidance',
  'es-ES': 'No lo sé / necesito orientación',
  'it-IT': 'Non lo so / ho bisogno di orientamento',
} as const

export async function addDontKnowOptions(prisma: PrismaClient) {
  let createdOptions = 0
  let createdTranslations = 0
  let skippedQuestions = 0

  await prisma.$transaction(async (tx) => {
    const questions = await tx.question.findMany({
      where: { code: { in: [...TARGET_CODES] } },
      include: {
        options: {
          orderBy: { order: 'asc' },
          include: {
            translations: {
              where: { locale: 'pt-BR' },
              select: { label: true },
            },
          },
        },
      },
      orderBy: { code: 'asc' },
    })

    for (const question of questions) {
      const existingOption = question.options.find(
        (option) => option.translations[0]?.label === LABELS['pt-BR']
      )

      if (existingOption) {
        skippedQuestions += 1
        continue
      }

      const firstOption = question.options[0]
      const nextOrder = Math.max(...question.options.map((option) => option.order)) + 1

      const createdOption = await tx.option.create({
        data: {
          question_id: question.id,
          order: nextOrder,
          price_impact: 0,
          time_impact: 0,
          complexity_impact: 0,
          weight: 1.0,
          next_question_id: firstOption?.next_question_id ?? null,
        },
      })
      createdOptions += 1

      const locales = Object.entries(LABELS).map(([locale, label]) => ({
        option_id: createdOption.id,
        locale,
        label,
      }))

      const result = await tx.optionTranslation.createMany({
        data: locales,
        skipDuplicates: true,
      })
      createdTranslations += result.count
    }
  })

  console.log(
    `[seed:add-dont-know-options] opções criadas=${createdOptions} traduções criadas=${createdTranslations} perguntas ignoradas=${skippedQuestions}`
  )

  return { createdOptions, createdTranslations, skippedQuestions }
}

async function main() {
  const prisma = createSeedPrismaClient()

  try {
    await addDontKnowOptions(prisma)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('[seed:add-dont-know-options] erro', error)
    process.exit(1)
  })
}
