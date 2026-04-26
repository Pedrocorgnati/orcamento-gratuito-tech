import type { PrismaClient } from '@prisma/client'
import { syncRefactorQuestionDefinitions } from './refactor-questions-v2'

interface OptionSeedData {
  question_id: string
  order: number
  price_impact: number
  time_impact: number
  complexity_impact: number
  weight: number
}

async function upsertOptions(prisma: PrismaClient, options: OptionSeedData[]) {
  for (const opt of options) {
    const existing = await prisma.option.findFirst({
      where: { question_id: opt.question_id, order: opt.order },
    })
    if (existing) {
      await prisma.option.update({
        where: { id: existing.id },
        data: {
          price_impact: opt.price_impact,
          time_impact: opt.time_impact,
          complexity_impact: opt.complexity_impact,
          weight: opt.weight,
        },
      })
    } else {
      await prisma.option.create({
        data: {
          question_id: opt.question_id,
          price_impact: opt.price_impact,
          time_impact: opt.time_impact,
          complexity_impact: opt.complexity_impact,
          weight: opt.weight,
          order: opt.order,
        },
      })
    }
  }
}

export async function seedQuestions(prisma: PrismaClient) {
  // ──────────────────────────────────────────────────────────────
  // BLOCO 1: PROJECT_TYPE (Q001, Q005)
  // ──────────────────────────────────────────────────────────────

  const q001 = await prisma.question.upsert({
    where: { code: 'Q001' },
    update: { type: 'MULTIPLE_CHOICE', block: 'PROJECT_TYPE', order: 1, required: true },
    create: {
      code: 'Q001',
      block: 'PROJECT_TYPE',
      type: 'MULTIPLE_CHOICE',
      order: 1,
      required: true,
    },
  })

  await upsertOptions(prisma, [
    { question_id: q001.id, order: 1, price_impact: 1500, time_impact: 21, complexity_impact: 15, weight: 1.0 },  // Site institucional
    { question_id: q001.id, order: 2, price_impact: 800, time_impact: 10, complexity_impact: 10, weight: 1.0 },   // Landing page / Página pessoal
    { question_id: q001.id, order: 3, price_impact: 5000, time_impact: 45, complexity_impact: 50, weight: 1.2 },  // Loja virtual (e-commerce)
    { question_id: q001.id, order: 4, price_impact: 8000, time_impact: 60, complexity_impact: 65, weight: 1.3 },  // Sistema web / SaaS
    { question_id: q001.id, order: 5, price_impact: 12000, time_impact: 90, complexity_impact: 70, weight: 1.4 }, // Aplicativo Android
    { question_id: q001.id, order: 6, price_impact: 8000, time_impact: 45, complexity_impact: 50, weight: 1.3 },  // Automação
    { question_id: q001.id, order: 7, price_impact: 10000, time_impact: 65, complexity_impact: 60, weight: 1.35 }, // Marketplace
    { question_id: q001.id, order: 8, price_impact: 14000, time_impact: 70, complexity_impact: 75, weight: 1.45 }, // Sistemas de criptomoedas
    { question_id: q001.id, order: 9, price_impact: 3000, time_impact: 21, complexity_impact: 25, weight: 1.1 },  // Extensão do Chrome
    { question_id: q001.id, order: 10, price_impact: 12000, time_impact: 90, complexity_impact: 70, weight: 1.4 }, // Aplicativo iOS
    { question_id: q001.id, order: 11, price_impact: 15000, time_impact: 75, complexity_impact: 80, weight: 1.5 }, // Inteligência Artificial
  ])

  const q005 = await prisma.question.upsert({
    where: { code: 'Q005' },
    update: {},
    create: {
      code: 'Q005',
      block: 'PROJECT_TYPE',
      type: 'SINGLE_CHOICE',
      order: 2,
      required: false,
      skip_logic: { condition: 'always_show' },
    },
  })

  await upsertOptions(prisma, [
    { question_id: q005.id, order: 1, price_impact: 0, time_impact: 0, complexity_impact: 0, weight: 1.0 },       // Empresa estabelecida
    { question_id: q005.id, order: 2, price_impact: -500, time_impact: -5, complexity_impact: -5, weight: 0.9 },  // Startup
    { question_id: q005.id, order: 3, price_impact: 0, time_impact: 0, complexity_impact: 0, weight: 1.0 },       // Freelancer/PF
    { question_id: q005.id, order: 4, price_impact: 2000, time_impact: 10, complexity_impact: 10, weight: 1.1 },  // Grande empresa/Enterprise
  ])

  // ──────────────────────────────────────────────────────────────
  // BLOCO 2: WEBSITES (Q010-Q014)
  // ──────────────────────────────────────────────────────────────

  const q010 = await prisma.question.upsert({
    where: { code: 'Q010' },
    update: {},
    create: { code: 'Q010', block: 'WEBSITES', type: 'SINGLE_CHOICE', order: 10, required: true },
  })
  await upsertOptions(prisma, [
    { question_id: q010.id, order: 1, price_impact: 0, time_impact: 0, complexity_impact: 0, weight: 1.0 },
    { question_id: q010.id, order: 2, price_impact: 500, time_impact: 5, complexity_impact: 5, weight: 1.1 },
    { question_id: q010.id, order: 3, price_impact: 1500, time_impact: 14, complexity_impact: 15, weight: 1.2 },
  ])

  const q011 = await prisma.question.upsert({
    where: { code: 'Q011' },
    update: {},
    create: { code: 'Q011', block: 'WEBSITES', type: 'SINGLE_CHOICE', order: 11, required: true },
  })
  await upsertOptions(prisma, [
    { question_id: q011.id, order: 1, price_impact: 0, time_impact: 0, complexity_impact: 0, weight: 1.0 },
    { question_id: q011.id, order: 2, price_impact: 800, time_impact: 7, complexity_impact: 10, weight: 1.1 },
    { question_id: q011.id, order: 3, price_impact: 1500, time_impact: 14, complexity_impact: 20, weight: 1.2 },
  ])

  const q012 = await prisma.question.upsert({
    where: { code: 'Q012' },
    update: {},
    create: { code: 'Q012', block: 'WEBSITES', type: 'SINGLE_CHOICE', order: 12, required: true },
  })
  await upsertOptions(prisma, [
    { question_id: q012.id, order: 1, price_impact: 0, time_impact: 0, complexity_impact: 0, weight: 1.0 },
    { question_id: q012.id, order: 2, price_impact: 300, time_impact: 3, complexity_impact: 5, weight: 1.0 },
    { question_id: q012.id, order: 3, price_impact: 800, time_impact: 7, complexity_impact: 15, weight: 1.1 },
  ])

  const q013 = await prisma.question.upsert({
    where: { code: 'Q013' },
    update: {},
    create: { code: 'Q013', block: 'WEBSITES', type: 'SINGLE_CHOICE', order: 13, required: true },
  })
  await upsertOptions(prisma, [
    { question_id: q013.id, order: 1, price_impact: 0, time_impact: 0, complexity_impact: 0, weight: 1.0 },
    { question_id: q013.id, order: 2, price_impact: 1200, time_impact: 10, complexity_impact: 20, weight: 1.2 },
    { question_id: q013.id, order: 3, price_impact: 2500, time_impact: 18, complexity_impact: 30, weight: 1.3 },
  ])

  const q014 = await prisma.question.upsert({
    where: { code: 'Q014' },
    update: {},
    create: { code: 'Q014', block: 'WEBSITES', type: 'SINGLE_CHOICE', order: 14, required: true },
  })
  await upsertOptions(prisma, [
    { question_id: q014.id, order: 1, price_impact: 0, time_impact: 0, complexity_impact: 0, weight: 1.0 },
    { question_id: q014.id, order: 2, price_impact: 600, time_impact: 5, complexity_impact: 10, weight: 1.1 },
    { question_id: q014.id, order: 3, price_impact: 2000, time_impact: 14, complexity_impact: 25, weight: 1.2 },
  ])

  // ──────────────────────────────────────────────────────────────
  // BLOCO 3: ECOMMERCE (Q020-Q024)
  // ──────────────────────────────────────────────────────────────

  const q020 = await prisma.question.upsert({
    where: { code: 'Q020' },
    update: {},
    create: { code: 'Q020', block: 'ECOMMERCE', type: 'SINGLE_CHOICE', order: 20, required: true },
  })
  await upsertOptions(prisma, [
    { question_id: q020.id, order: 1, price_impact: 0, time_impact: 0, complexity_impact: 0, weight: 1.0 },
    { question_id: q020.id, order: 2, price_impact: 1000, time_impact: 7, complexity_impact: 10, weight: 1.1 },
    { question_id: q020.id, order: 3, price_impact: 3000, time_impact: 21, complexity_impact: 25, weight: 1.3 },
  ])

  const q021 = await prisma.question.upsert({
    where: { code: 'Q021' },
    update: {},
    create: { code: 'Q021', block: 'ECOMMERCE', type: 'SINGLE_CHOICE', order: 21, required: true },
  })
  await upsertOptions(prisma, [
    { question_id: q021.id, order: 1, price_impact: 0, time_impact: 0, complexity_impact: 0, weight: 1.0 },
    { question_id: q021.id, order: 2, price_impact: 1500, time_impact: 10, complexity_impact: 20, weight: 1.2 },
    { question_id: q021.id, order: 3, price_impact: 3000, time_impact: 21, complexity_impact: 35, weight: 1.3 },
  ])

  const q022 = await prisma.question.upsert({
    where: { code: 'Q022' },
    update: {},
    create: { code: 'Q022', block: 'ECOMMERCE', type: 'SINGLE_CHOICE', order: 22, required: true },
  })
  await upsertOptions(prisma, [
    { question_id: q022.id, order: 1, price_impact: 0, time_impact: 0, complexity_impact: 0, weight: 1.0 },
    { question_id: q022.id, order: 2, price_impact: 2000, time_impact: 14, complexity_impact: 30, weight: 1.2 },
    { question_id: q022.id, order: 3, price_impact: 5000, time_impact: 30, complexity_impact: 50, weight: 1.4 },
  ])

  const q023 = await prisma.question.upsert({
    where: { code: 'Q023' },
    update: {},
    create: { code: 'Q023', block: 'ECOMMERCE', type: 'SINGLE_CHOICE', order: 23, required: true },
  })
  await upsertOptions(prisma, [
    { question_id: q023.id, order: 1, price_impact: 0, time_impact: 0, complexity_impact: 0, weight: 1.0 },
    { question_id: q023.id, order: 2, price_impact: 1200, time_impact: 10, complexity_impact: 20, weight: 1.1 },
    { question_id: q023.id, order: 3, price_impact: 2500, time_impact: 21, complexity_impact: 35, weight: 1.2 },
  ])

  const q024 = await prisma.question.upsert({
    where: { code: 'Q024' },
    update: {},
    create: { code: 'Q024', block: 'ECOMMERCE', type: 'SINGLE_CHOICE', order: 24, required: true },
  })
  await upsertOptions(prisma, [
    { question_id: q024.id, order: 1, price_impact: 0, time_impact: 0, complexity_impact: 0, weight: 1.0 },
    { question_id: q024.id, order: 2, price_impact: 800, time_impact: 7, complexity_impact: 15, weight: 1.1 },
    { question_id: q024.id, order: 3, price_impact: 2000, time_impact: 14, complexity_impact: 30, weight: 1.2 },
  ])

  // ──────────────────────────────────────────────────────────────
  // BLOCO 4: WEB_SYSTEM (Q030-Q041) — 12 perguntas
  // ──────────────────────────────────────────────────────────────

  const webSystemQuestions = [
    { code: 'Q030', order: 30, impacts: [
      { price: 0, time: 0, complexity: 0, w: 1.0 },
      { price: 1500, time: 10, complexity: 20, w: 1.1 },
      { price: 3000, time: 21, complexity: 35, w: 1.2 },
    ]},
    { code: 'Q031', order: 31, impacts: [
      { price: 0, time: 0, complexity: 0, w: 1.0 },
      { price: 2000, time: 14, complexity: 25, w: 1.2 },
      { price: 5000, time: 30, complexity: 50, w: 1.4 },
    ]},
    { code: 'Q032', order: 32, impacts: [
      { price: 0, time: 0, complexity: 0, w: 1.0 },
      { price: 1500, time: 10, complexity: 20, w: 1.1 },
      { price: 4000, time: 21, complexity: 40, w: 1.3 },
    ]},
    { code: 'Q033', order: 33, impacts: [
      { price: 0, time: 0, complexity: 0, w: 1.0 },
      { price: 1000, time: 7, complexity: 15, w: 1.1 },
      { price: 3000, time: 21, complexity: 35, w: 1.3 },
    ]},
    { code: 'Q034', order: 34, impacts: [
      { price: 0, time: 0, complexity: 0, w: 1.0 },
      { price: 800, time: 5, complexity: 10, w: 1.1 },
      { price: 2000, time: 14, complexity: 25, w: 1.2 },
    ]},
    { code: 'Q035', order: 35, impacts: [
      { price: 0, time: 0, complexity: 0, w: 1.0 },
      { price: 3000, time: 21, complexity: 40, w: 1.3 },
      { price: 8000, time: 45, complexity: 65, w: 1.5 },
    ]},
    { code: 'Q036', order: 36, impacts: [
      { price: 0, time: 0, complexity: 0, w: 1.0 },
      { price: 2000, time: 14, complexity: 30, w: 1.2 },
      { price: 4000, time: 21, complexity: 45, w: 1.3 },
    ]},
    { code: 'Q037', order: 37, impacts: [
      { price: 0, time: 0, complexity: 0, w: 1.0 },
      { price: 3000, time: 21, complexity: 40, w: 1.3 },
      { price: 7000, time: 45, complexity: 60, w: 1.4 },
    ]},
    { code: 'Q038', order: 38, impacts: [
      { price: 0, time: 0, complexity: 0, w: 1.0 },
      { price: 1500, time: 10, complexity: 20, w: 1.1 },
      { price: 4000, time: 21, complexity: 35, w: 1.3 },
    ]},
    { code: 'Q039', order: 39, impacts: [
      { price: 0, time: 0, complexity: 0, w: 1.0 },
      { price: 4000, time: 30, complexity: 50, w: 1.4 },
      { price: 9000, time: 60, complexity: 70, w: 1.5 },
    ]},
    { code: 'Q040', order: 40, impacts: [
      { price: 0, time: 0, complexity: 0, w: 1.0 },
      { price: 1000, time: 7, complexity: 15, w: 1.1 },
      { price: 2500, time: 14, complexity: 25, w: 1.2 },
    ]},
    { code: 'Q041', order: 41, impacts: [
      { price: 0, time: 0, complexity: 0, w: 1.0 },
      { price: 800, time: 5, complexity: 10, w: 1.1 },
      { price: 2000, time: 14, complexity: 20, w: 1.2 },
    ]},
  ]

  for (const qDef of webSystemQuestions) {
    const q = await prisma.question.upsert({
      where: { code: qDef.code },
      update: {},
      create: { code: qDef.code, block: 'WEB_SYSTEM', type: 'SINGLE_CHOICE', order: qDef.order, required: true },
    })
    await upsertOptions(prisma, qDef.impacts.map((imp, i) => ({
      question_id: q.id,
      order: i + 1,
      price_impact: imp.price,
      time_impact: imp.time,
      complexity_impact: imp.complexity,
      weight: imp.w,
    })))
  }

  // ──────────────────────────────────────────────────────────────
  // BLOCO 5: MOBILE_APP (Q045-Q049)
  // ──────────────────────────────────────────────────────────────

  const mobileQuestions = [
    { code: 'Q045', order: 45, impacts: [
      { price: 0, time: 0, complexity: 0, w: 1.0 },
      { price: 0, time: 0, complexity: 0, w: 1.0 },
      { price: 5000, time: 30, complexity: 25, w: 1.3 },
    ]},
    { code: 'Q046', order: 46, impacts: [
      { price: 0, time: 0, complexity: 0, w: 1.0 },
      { price: 4000, time: 30, complexity: 30, w: 1.2 },
    ]},
    { code: 'Q047', order: 47, impacts: [
      { price: 0, time: 0, complexity: 0, w: 1.0 },
      { price: 1000, time: 7, complexity: 15, w: 1.1 },
      { price: 2500, time: 14, complexity: 25, w: 1.2 },
    ]},
    { code: 'Q048', order: 48, impacts: [
      { price: 0, time: 0, complexity: 0, w: 1.0 },
      { price: 3000, time: 21, complexity: 35, w: 1.3 },
      { price: 6000, time: 45, complexity: 55, w: 1.4 },
    ]},
    { code: 'Q049', order: 49, impacts: [
      { price: 0, time: 0, complexity: 0, w: 1.0 },
      { price: 2000, time: 14, complexity: 20, w: 1.2 },
      { price: 4000, time: 21, complexity: 35, w: 1.3 },
    ]},
  ]

  for (const qDef of mobileQuestions) {
    const q = await prisma.question.upsert({
      where: { code: qDef.code },
      update: {},
      create: { code: qDef.code, block: 'MOBILE_APP', type: 'SINGLE_CHOICE', order: qDef.order, required: true },
    })
    await upsertOptions(prisma, qDef.impacts.map((imp, i) => ({
      question_id: q.id,
      order: i + 1,
      price_impact: imp.price,
      time_impact: imp.time,
      complexity_impact: imp.complexity,
      weight: imp.w,
    })))
  }

  // ──────────────────────────────────────────────────────────────
  // BLOCO 6: AUTOMATION_AI (Q050-Q052)
  // ──────────────────────────────────────────────────────────────

  const aiQuestions = [
    { code: 'Q050', order: 50, impacts: [
      { price: 2000, time: 14, complexity: 20, w: 1.1 },
      { price: 8000, time: 45, complexity: 55, w: 1.4 },
      { price: 5000, time: 30, complexity: 40, w: 1.3 },
    ]},
    { code: 'Q051', order: 51, impacts: [
      { price: 0, time: 0, complexity: 0, w: 1.0 },
      { price: 3000, time: 21, complexity: 30, w: 1.2 },
      { price: 6000, time: 30, complexity: 45, w: 1.4 },
    ]},
    { code: 'Q052', order: 52, impacts: [
      { price: 0, time: 0, complexity: 0, w: 1.0 },
      { price: 2000, time: 14, complexity: 20, w: 1.2 },
      { price: 5000, time: 30, complexity: 40, w: 1.3 },
    ]},
  ]

  for (const qDef of aiQuestions) {
    const q = await prisma.question.upsert({
      where: { code: qDef.code },
      update: {},
      create: { code: qDef.code, block: 'AUTOMATION_AI', type: 'SINGLE_CHOICE', order: qDef.order, required: true },
    })
    await upsertOptions(prisma, qDef.impacts.map((imp, i) => ({
      question_id: q.id,
      order: i + 1,
      price_impact: imp.price,
      time_impact: imp.time,
      complexity_impact: imp.complexity,
      weight: imp.w,
    })))
  }

  // ──────────────────────────────────────────────────────────────
  // BLOCO 7: MARKETPLACE (Q070-Q074)
  // ──────────────────────────────────────────────────────────────

  const marketplaceQuestions = [
    { code: 'Q070', order: 70, impacts: [
      { price: 0, time: 0, complexity: 0, w: 1.0 },
      { price: 2500, time: 14, complexity: 18, w: 1.15 },
      { price: 6000, time: 30, complexity: 40, w: 1.35 },
    ]},
    { code: 'Q071', order: 71, impacts: [
      { price: 0, time: 0, complexity: 0, w: 1.0 },
      { price: 1200, time: 7, complexity: 12, w: 1.1 },
      { price: 2800, time: 14, complexity: 24, w: 1.2 },
    ]},
    { code: 'Q072', order: 72, impacts: [
      { price: 0, time: 0, complexity: 0, w: 1.0 },
      { price: 1800, time: 10, complexity: 16, w: 1.1 },
      { price: 4500, time: 21, complexity: 32, w: 1.3 },
    ]},
    { code: 'Q073', order: 73, impacts: [
      { price: 0, time: 0, complexity: 0, w: 1.0 },
      { price: 2200, time: 10, complexity: 20, w: 1.15 },
      { price: 5000, time: 21, complexity: 35, w: 1.3 },
    ]},
    { code: 'Q074', order: 74, impacts: [
      { price: 0, time: 0, complexity: 0, w: 1.0 },
      { price: 1500, time: 7, complexity: 15, w: 1.1 },
      { price: 3500, time: 14, complexity: 28, w: 1.25 },
    ]},
  ]

  for (const qDef of marketplaceQuestions) {
    const q = await prisma.question.upsert({
      where: { code: qDef.code },
      update: {},
      create: { code: qDef.code, block: 'MARKETPLACE', type: 'SINGLE_CHOICE', order: qDef.order, required: true },
    })
    await upsertOptions(prisma, qDef.impacts.map((imp, i) => ({
      question_id: q.id,
      order: i + 1,
      price_impact: imp.price,
      time_impact: imp.time,
      complexity_impact: imp.complexity,
      weight: imp.w,
    })))
  }

  // ──────────────────────────────────────────────────────────────
  // BLOCO 8: CRYPTO (Q075-Q079)
  // ──────────────────────────────────────────────────────────────

  const cryptoQuestions = [
    { code: 'Q075', order: 75, impacts: [
      { price: 0, time: 0, complexity: 0, w: 1.0 },
      { price: 4000, time: 21, complexity: 30, w: 1.2 },
      { price: 7000, time: 30, complexity: 50, w: 1.35 },
    ]},
    { code: 'Q076', order: 76, impacts: [
      { price: 0, time: 0, complexity: 0, w: 1.0 },
      { price: 2000, time: 10, complexity: 18, w: 1.1 },
      { price: 4500, time: 21, complexity: 34, w: 1.25 },
    ]},
    { code: 'Q077', order: 77, impacts: [
      { price: 0, time: 0, complexity: 0, w: 1.0 },
      { price: 2500, time: 14, complexity: 22, w: 1.15 },
      { price: 5500, time: 30, complexity: 42, w: 1.3 },
    ]},
    { code: 'Q078', order: 78, impacts: [
      { price: 0, time: 0, complexity: 0, w: 1.0 },
      { price: 1800, time: 10, complexity: 16, w: 1.1 },
      { price: 4200, time: 21, complexity: 30, w: 1.25 },
    ]},
    { code: 'Q079', order: 79, impacts: [
      { price: 0, time: 0, complexity: 0, w: 1.0 },
      { price: 2000, time: 14, complexity: 18, w: 1.1 },
      { price: 5000, time: 30, complexity: 36, w: 1.3 },
    ]},
  ]

  for (const qDef of cryptoQuestions) {
    const q = await prisma.question.upsert({
      where: { code: qDef.code },
      update: {},
      create: { code: qDef.code, block: 'CRYPTO', type: 'SINGLE_CHOICE', order: qDef.order, required: true },
    })
    await upsertOptions(prisma, qDef.impacts.map((imp, i) => ({
      question_id: q.id,
      order: i + 1,
      price_impact: imp.price,
      time_impact: imp.time,
      complexity_impact: imp.complexity,
      weight: imp.w,
    })))
  }

  // ──────────────────────────────────────────────────────────────
  // BLOCO 9: BROWSER_EXT (Q080-Q083)
  // ──────────────────────────────────────────────────────────────

  const browserExtQuestions = [
    { code: 'Q080', order: 80, impacts: [
      { price: 0, time: 0, complexity: 0, w: 1.0 },
      { price: 1200, time: 7, complexity: 10, w: 1.1 },
      { price: 2800, time: 14, complexity: 22, w: 1.25 },
    ]},
    { code: 'Q081', order: 81, impacts: [
      { price: 0, time: 0, complexity: 0, w: 1.0 },
      { price: 1800, time: 10, complexity: 16, w: 1.1 },
      { price: 3500, time: 21, complexity: 28, w: 1.25 },
    ]},
    { code: 'Q082', order: 82, impacts: [
      { price: 0, time: 0, complexity: 0, w: 1.0 },
      { price: 1200, time: 7, complexity: 10, w: 1.1 },
      { price: 2600, time: 14, complexity: 20, w: 1.2 },
    ]},
    { code: 'Q083', order: 83, impacts: [
      { price: 0, time: 0, complexity: 0, w: 1.0 },
      { price: 1500, time: 7, complexity: 12, w: 1.1 },
      { price: 3200, time: 14, complexity: 24, w: 1.2 },
    ]},
  ]

  for (const qDef of browserExtQuestions) {
    const q = await prisma.question.upsert({
      where: { code: qDef.code },
      update: {},
      create: { code: qDef.code, block: 'BROWSER_EXT', type: 'SINGLE_CHOICE', order: qDef.order, required: true },
    })
    await upsertOptions(prisma, qDef.impacts.map((imp, i) => ({
      question_id: q.id,
      order: i + 1,
      price_impact: imp.price,
      time_impact: imp.time,
      complexity_impact: imp.complexity,
      weight: imp.w,
    })))
  }

  // ──────────────────────────────────────────────────────────────
  // BLOCO 10: CONTEXT — universal (Q090-Q093)
  // ──────────────────────────────────────────────────────────────

  const contextQuestions = [
    { code: 'Q090', order: 90, type: 'BUDGET_SELECT', impacts: [
      { price: -2000, time: -10, complexity: -10, w: 0.8 },
      { price: 0, time: 0, complexity: 0, w: 1.0 },
      { price: 3000, time: 10, complexity: 10, w: 1.2 },
      { price: 8000, time: 21, complexity: 20, w: 1.4 },
    ]},
    { code: 'Q091', order: 91, type: 'DEADLINE_SELECT', impacts: [
      { price: 2000, time: -15, complexity: 5, w: 1.3 },
      { price: 0, time: 0, complexity: 0, w: 1.0 },
      { price: -500, time: 30, complexity: 0, w: 0.95 },
    ]},
    { code: 'Q092', order: 92, type: 'SINGLE_CHOICE', impacts: [
      { price: 0, time: 0, complexity: 0, w: 1.0 },
      { price: 1500, time: 14, complexity: 10, w: 1.1 },
      { price: 3000, time: 21, complexity: 15, w: 1.2 },
    ]},
    { code: 'Q093', order: 93, type: 'SINGLE_CHOICE', impacts: [
      { price: 0, time: 0, complexity: 0, w: 1.0 },
      { price: 300, time: 0, complexity: 0, w: 1.0 },
      { price: 800, time: 0, complexity: 0, w: 1.0 },
    ]},
  ]

  for (const qDef of contextQuestions) {
    const q = await prisma.question.upsert({
      where: { code: qDef.code },
      update: {},
      create: { code: qDef.code, block: 'CONTEXT', type: qDef.type, order: qDef.order, required: true },
    })
    await upsertOptions(prisma, qDef.impacts.map((imp, i) => ({
      question_id: q.id,
      order: i + 1,
      price_impact: imp.price,
      time_impact: imp.time,
      complexity_impact: imp.complexity,
      weight: imp.w,
    })))
  }

  // ──────────────────────────────────────────────────────────────
  // BLOCO 11: LEAD — coleta de dados do cliente (Q100-Q105)
  // ──────────────────────────────────────────────────────────────

  const leadQuestions = [
    { code: 'Q100', order: 100, type: 'TEXT_INPUT' },   // Nome
    { code: 'Q101', order: 101, type: 'TEXT_INPUT' },   // Email
    { code: 'Q102', order: 102, type: 'TEXT_INPUT' },   // Telefone (opcional)
    { code: 'Q103', order: 103, type: 'TEXT_INPUT' },   // Empresa (opcional)
    { code: 'Q104', order: 104, type: 'SINGLE_CHOICE' }, // Como nos conheceu?
    { code: 'Q105', order: 105, type: 'TEXT_INPUT' },   // Observações adicionais
  ]

  for (const qDef of leadQuestions) {
    await prisma.question.upsert({
      where: { code: qDef.code },
      update: {},
      create: {
        code: qDef.code,
        block: 'LEAD',
        type: qDef.type,
        order: qDef.order,
        required: ['Q100', 'Q101'].includes(qDef.code),
      },
    })
  }

  // Q104 tem opções (SINGLE_CHOICE — as TEXT_INPUT não têm opções)
  const q104 = await prisma.question.findUnique({ where: { code: 'Q104' } })
  if (q104) {
    await upsertOptions(prisma, [
      { question_id: q104.id, order: 1, price_impact: 0, time_impact: 0, complexity_impact: 0, weight: 1.0 }, // Google
      { question_id: q104.id, order: 2, price_impact: 0, time_impact: 0, complexity_impact: 0, weight: 1.0 }, // LinkedIn
      { question_id: q104.id, order: 3, price_impact: 0, time_impact: 0, complexity_impact: 0, weight: 1.0 }, // Indicação
      { question_id: q104.id, order: 4, price_impact: 0, time_impact: 0, complexity_impact: 0, weight: 1.0 }, // Redes sociais
      { question_id: q104.id, order: 5, price_impact: 0, time_impact: 0, complexity_impact: 0, weight: 1.0 }, // Outro
    ])
  }

  await syncRefactorQuestionDefinitions(prisma)
}
