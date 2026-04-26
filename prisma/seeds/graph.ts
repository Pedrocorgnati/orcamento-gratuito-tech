import type { PrismaClient, Prisma } from '@prisma/client'
import { adjustGraph } from './refactor-questions-v2'

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
  await setNextQuestion(prisma, 'Q001', 1, 'Q005')  // Site institucional → Q005
  await setNextQuestion(prisma, 'Q001', 2, 'Q005')  // Landing page / Página pessoal → Q005
  await setNextQuestion(prisma, 'Q001', 3, 'Q005')  // Loja virtual → Q005
  await setNextQuestion(prisma, 'Q001', 4, 'Q005')  // Sistema web / SaaS → Q005
  await setNextQuestion(prisma, 'Q001', 5, 'Q005')  // Aplicativo Android → Q005
  await setNextQuestion(prisma, 'Q001', 6, 'Q005')  // Automação → Q005
  await setNextQuestion(prisma, 'Q001', 7, 'Q005')  // Marketplace → Q005
  await setNextQuestion(prisma, 'Q001', 8, 'Q005')  // Sistemas de criptomoedas → Q005
  await setNextQuestion(prisma, 'Q001', 9, 'Q005')  // Extensão do Chrome → Q005
  await setNextQuestion(prisma, 'Q001', 10, 'Q005') // Aplicativo iOS → Q005
  await setNextQuestion(prisma, 'Q001', 11, 'Q005') // Inteligência Artificial → Q005

  // Q005: dynamic_next baseado no bloco atual da fila
  await setSkipLogic(prisma, 'Q005', {
    always_show: true,
    dynamic_next: {
      mapping: {
        WEBSITES: 'Q010',
        ECOMMERCE: 'Q020',
        MARKETPLACE: 'Q070',
        WEB_SYSTEM: 'Q030',
        CRYPTO: 'Q075',
        MOBILE_APP: 'Q045',
        AUTOMATION_AI: 'Q006',
        BROWSER_EXT: 'Q080',
        WEBSITE: 'Q010',
        WEB_APP: 'Q030',
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
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q014', opt, 'Q090') // fallback legado
  await setSkipLogic(prisma, 'Q014', { end_of_block: true })

  // ──────────────────────────────────────────────────────────────
  // BLOCO 3: ECOMMERCE — cadeia Q020→Q021→Q022→Q023→Q024→Q090
  // ──────────────────────────────────────────────────────────────
  console.log('    Configurando cadeia ECOMMERCE...')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q020', opt, 'Q021')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q021', opt, 'Q022')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q022', opt, 'Q023')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q023', opt, 'Q024')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q024', opt, 'Q090') // fallback legado
  await setSkipLogic(prisma, 'Q024', { end_of_block: true })

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
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q041', opt, 'Q090') // fallback legado
  await setSkipLogic(prisma, 'Q041', { end_of_block: true })

  // ──────────────────────────────────────────────────────────────
  // BLOCO 5: MOBILE_APP — cadeia Q045→Q046→Q047→Q048→Q049→Q090
  // ──────────────────────────────────────────────────────────────
  console.log('    Configurando cadeia MOBILE_APP...')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q045', opt, 'Q046')
  for (let opt = 1; opt <= 2; opt++) await setNextQuestion(prisma, 'Q046', opt, 'Q047') // Q046 tem 2 opções
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q047', opt, 'Q048')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q048', opt, 'Q049')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q049', opt, 'Q090') // fallback legado
  await setSkipLogic(prisma, 'Q049', { end_of_block: true })

  // ──────────────────────────────────────────────────────────────
  // BLOCO 6: AUTOMATION_AI — cadeia Q050→Q051→Q052→Q090
  // ──────────────────────────────────────────────────────────────
  console.log('    Configurando cadeia AUTOMATION_AI...')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q050', opt, 'Q051')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q051', opt, 'Q052')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q052', opt, 'Q090') // fallback legado
  await setSkipLogic(prisma, 'Q052', { end_of_block: true })

  // ──────────────────────────────────────────────────────────────
  // BLOCO 7: MARKETPLACE — cadeia Q070→Q071→Q072→Q073→Q074→Q090
  // ──────────────────────────────────────────────────────────────
  console.log('    Configurando cadeia MARKETPLACE...')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q070', opt, 'Q071')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q071', opt, 'Q072')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q072', opt, 'Q073')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q073', opt, 'Q074')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q074', opt, 'Q090')
  await setSkipLogic(prisma, 'Q074', { end_of_block: true })

  // ──────────────────────────────────────────────────────────────
  // BLOCO 8: CRYPTO — cadeia Q075→Q076→Q077→Q078→Q079→Q090
  // ──────────────────────────────────────────────────────────────
  console.log('    Configurando cadeia CRYPTO...')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q075', opt, 'Q076')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q076', opt, 'Q077')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q077', opt, 'Q078')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q078', opt, 'Q079')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q079', opt, 'Q090')
  await setSkipLogic(prisma, 'Q079', { end_of_block: true })

  // ──────────────────────────────────────────────────────────────
  // BLOCO 9: BROWSER_EXT — cadeia Q080→Q081→Q082→Q083→Q090
  // ──────────────────────────────────────────────────────────────
  console.log('    Configurando cadeia BROWSER_EXT...')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q080', opt, 'Q081')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q081', opt, 'Q082')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q082', opt, 'Q083')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q083', opt, 'Q090')
  await setSkipLogic(prisma, 'Q083', { end_of_block: true })

  // ──────────────────────────────────────────────────────────────
  // BLOCO 10: CONTEXT — cadeia Q090→Q091→Q092→Q093→Q100 (LEAD)
  // ──────────────────────────────────────────────────────────────
  console.log('    Configurando cadeia CONTEXT...')
  for (let opt = 1; opt <= 4; opt++) await setNextQuestion(prisma, 'Q090', opt, 'Q091') // Q090 tem 4 opções (budget)
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q091', opt, 'Q092')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q092', opt, 'Q093')
  for (let opt = 1; opt <= 3; opt++) await setNextQuestion(prisma, 'Q093', opt, 'Q100') // fallback legado
  await setSkipLogic(prisma, 'Q093', { end_of_block: true })

  // ──────────────────────────────────────────────────────────────
  // BLOCO 11: LEAD — sequência final
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
  await setSkipLogic(prisma, 'Q105', { next_question: null, end_of_block: true })

  // Q104 SINGLE_CHOICE: todas as opções → Q105
  for (let opt = 1; opt <= 5; opt++) await setNextQuestion(prisma, 'Q104', opt, 'Q105')

  await adjustGraph(prisma)

  console.log('    Grafo DAG configurado com sucesso!')
}
