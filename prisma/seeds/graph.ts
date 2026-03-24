import type { PrismaClient, Prisma } from '@prisma/client'

/**
 * Configura next_question_id em uma opção específica.
 * questionCode: código da pergunta dona da opção (ex: "Q001")
 * optionOrder: posição da opção (1-based)
 * nextCode: código da próxima pergunta (ex: "Q010"), ou null para END
 */
async function setNextQuestion(
  prisma: PrismaClient,
  questionCode: string,
  optionOrder: number,
  nextCode: string | null
) {
  const question = await prisma.question.findUnique({ where: { code: questionCode } })
  if (!question) throw new Error(`Questão ${questionCode} não encontrada`)

  const option = await prisma.option.findFirst({
    where: { question_id: question.id, order: optionOrder },
  })
  if (!option) throw new Error(`Opção ${questionCode}[order=${optionOrder}] não encontrada`)

  let nextQuestionId: string | null = null
  if (nextCode) {
    const nextQ = await prisma.question.findUnique({ where: { code: nextCode } })
    if (!nextQ) throw new Error(`Próxima questão ${nextCode} não encontrada`)
    nextQuestionId = nextQ.id
  }

  await prisma.option.update({
    where: { id: option.id },
    data: { next_question_id: nextQuestionId },
  })
}

/**
 * Configura skip_logic em uma questão.
 */
async function setSkipLogic(
  prisma: PrismaClient,
  questionCode: string,
  skipLogic: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput
) {
  await prisma.question.update({
    where: { code: questionCode },
    data: { skip_logic: skipLogic },
  })
}

export async function seedGraph(prisma: PrismaClient) {
  // ──────────────────────────────────────────────────────────────
  // Q001 → Q005 (tipo de empresa) para todos os caminhos
  // Q005 usa dynamic_next para branching baseado em Q001
  // ──────────────────────────────────────────────────────────────
  console.log('    Configurando branching do Bloco 1...')
  await setNextQuestion(prisma, 'Q001', 1, 'Q005')  // Website Institucional → Q005
  await setNextQuestion(prisma, 'Q001', 2, 'Q005')  // Landing Page → Q005
  await setNextQuestion(prisma, 'Q001', 3, 'Q005')  // E-commerce → Q005
  await setNextQuestion(prisma, 'Q001', 4, 'Q005')  // Sistema Web → Q005
  await setNextQuestion(prisma, 'Q001', 5, 'Q005')  // App Mobile → Q005
  await setNextQuestion(prisma, 'Q001', 6, 'Q005')  // Automação e IA → Q005

  // Q005: dynamic_next baseado na resposta de Q001
  await setSkipLogic(prisma, 'Q005', {
    always_show: true,
    dynamic_next: {
      based_on: 'Q001',
      mapping: {
        '1': 'Q010', // Website → WEBSITES
        '2': 'Q010', // Landing Page → WEBSITES
        '3': 'Q020', // E-commerce → ECOMMERCE
        '4': 'Q030', // Sistema Web → WEB_SYSTEM
        '5': 'Q045', // App Mobile → MOBILE_APP
        '6': 'Q050', // Automação/IA → AUTOMATION_AI
      },
    },
  })
  // Fallback de next_question_id para opções de Q005 (engine usa dynamic_next se presente)
  await setNextQuestion(prisma, 'Q005', 1, 'Q010')
  await setNextQuestion(prisma, 'Q005', 2, 'Q010')
  await setNextQuestion(prisma, 'Q005', 3, 'Q010')
  await setNextQuestion(prisma, 'Q005', 4, 'Q010')

  // ──────────────────────────────────────────────────────────────
  // BLOCO 2: WEBSITES — cadeia Q010→Q011→Q012→Q013→Q014→Q090
  // ──────────────────────────────────────────────────────────────
  console.log('    Configurando cadeia WEBSITES...')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q010', opt, 'Q011')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q011', opt, 'Q012')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q012', opt, 'Q013')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q013', opt, 'Q014')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q014', opt, 'Q090') // → CONTEXT

  // ──────────────────────────────────────────────────────────────
  // BLOCO 3: ECOMMERCE — cadeia Q020→Q021→Q022→Q023→Q024→Q090
  // ──────────────────────────────────────────────────────────────
  console.log('    Configurando cadeia ECOMMERCE...')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q020', opt, 'Q021')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q021', opt, 'Q022')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q022', opt, 'Q023')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q023', opt, 'Q024')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q024', opt, 'Q090') // → CONTEXT

  // ──────────────────────────────────────────────────────────────
  // BLOCO 4: WEB_SYSTEM — cadeia Q030→Q031→...→Q041→Q090
  // ──────────────────────────────────────────────────────────────
  console.log('    Configurando cadeia WEB_SYSTEM...')
  const webChain = ['Q030', 'Q031', 'Q032', 'Q033', 'Q034', 'Q035', 'Q036', 'Q037', 'Q038', 'Q039', 'Q040', 'Q041']
  for (let i = 0; i < webChain.length - 1; i++) {
    for (let opt = 1; opt <= 3; opt++) {
      await setNextQuestion(prisma, webChain[i], opt, webChain[i + 1])
    }
  }
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q041', opt, 'Q090') // → CONTEXT

  // ──────────────────────────────────────────────────────────────
  // BLOCO 5: MOBILE_APP — cadeia Q045→Q046→Q047→Q048→Q049→Q090
  // ──────────────────────────────────────────────────────────────
  console.log('    Configurando cadeia MOBILE_APP...')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q045', opt, 'Q046')
  for (let opt = 1; opt <= 2; opt++) await setNextQuestion(prisma, 'Q046', opt, 'Q047') // Q046 tem 2 opções
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q047', opt, 'Q048')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q048', opt, 'Q049')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q049', opt, 'Q090') // → CONTEXT

  // ──────────────────────────────────────────────────────────────
  // BLOCO 6: AUTOMATION_AI — cadeia Q050→Q051→Q052→Q090
  // ──────────────────────────────────────────────────────────────
  console.log('    Configurando cadeia AUTOMATION_AI...')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q050', opt, 'Q051')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q051', opt, 'Q052')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q052', opt, 'Q090') // → CONTEXT

  // ──────────────────────────────────────────────────────────────
  // BLOCO 7: CONTEXT — cadeia Q090→Q091→Q092→Q093→Q100 (LEAD)
  // ──────────────────────────────────────────────────────────────
  console.log('    Configurando cadeia CONTEXT...')
  for (let opt = 1; opt <= 4; opt++) await setNextQuestion(prisma, 'Q090', opt, 'Q091') // Q090 tem 4 opções (budget)
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q091', opt, 'Q092')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q092', opt, 'Q093')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q093', opt, 'Q100') // → LEAD

  // ──────────────────────────────────────────────────────────────
  // BLOCO 8: LEAD — sequência final
  // TEXT_INPUT questions (Q100-Q103, Q105) usam skip_logic.next_question
  // Q104 é SINGLE_CHOICE → usa next_question_id nas opções
  // ──────────────────────────────────────────────────────────────
  console.log('    Configurando cadeia LEAD...')

  // TEXT_INPUT: próxima definida via skip_logic.next_question
  const leadChain = [
    { code: 'Q100', next: 'Q101' },
    { code: 'Q101', next: 'Q102' },
    { code: 'Q102', next: 'Q103' },
    { code: 'Q103', next: 'Q104' },
    { code: 'Q105', next: null },  // END
  ]
  for (const { code, next } of leadChain) {
    await setSkipLogic(prisma, code, { next_question: next })
  }

  // Q104 SINGLE_CHOICE: todas as opções → Q105
  for (let opt = 1; opt <= 5; opt++) await setNextQuestion(prisma, 'Q104', opt, 'Q105')

  console.log('    Grafo DAG configurado com sucesso!')
}
