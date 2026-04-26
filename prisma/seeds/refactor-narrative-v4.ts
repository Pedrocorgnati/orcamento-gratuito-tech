import { PrismaClient, type Prisma } from '@prisma/client'
import { createSeedPrismaClient } from './_createPrismaClient'

// ─────────────────────────────────────────────────────────────────────────────
// refactor-narrative-v4
//
// Insere o bloco NARRATIVE (Q096–Q099) entre CONTEXT (Q090–Q095) e LEAD
// (Q100–Q104). Permite ao cliente descrever o software desejado em texto livre,
// alimentando lead.scope_story.userNarrative e o painel admin.
//
// Mudanças no grafo:
//   • Q095 mantém end_of_block:true. A transição CONTEXT → NARRATIVE acontece
//     via pending_blocks + CANONICAL_BLOCK_ORDER (já atualizado em
//     src/lib/project-config.ts). resolveQueuedNextQuestionId acha Q096 como
//     primeira pergunta do bloco NARRATIVE por ordem.
//   • Q096 → Q097 → Q098 → Q099 (next_question), Q099 end_of_block:true → LEAD.
//   • Q104 → null (era → Q105). Q105 deixa de ser alcançável.
//
// Q105 NÃO é deletada — leads/answers antigos preservados.
// ─────────────────────────────────────────────────────────────────────────────

type Locale = 'pt-BR' | 'en-US' | 'es-ES' | 'it-IT'
type QuestionCode = `Q${string}`

type NarrativeQuestion = {
  code: QuestionCode
  block: 'NARRATIVE'
  type: 'TEXT_INPUT'
  order: number
  required: boolean
  next_question: QuestionCode | null
  title: Record<Locale, string>
  description: Record<Locale, string>
  help_text_ptBR: string
}

const ALL_LOCALES: Locale[] = ['pt-BR', 'en-US', 'es-ES', 'it-IT']
const DEFAULT_LOCALE: Locale = 'pt-BR'

const NARRATIVE_QUESTIONS: NarrativeQuestion[] = [
  {
    code: 'Q096',
    block: 'NARRATIVE',
    type: 'TEXT_INPUT',
    order: 96,
    required: true,
    next_question: 'Q097',
    title: {
      'pt-BR': 'Em uma frase, qual é o software que você quer construir?',
      'en-US': 'In one sentence, what software do you want to build?',
      'es-ES': 'En una frase, ¿qué software quieres construir?',
      'it-IT': 'In una frase, quale software vuoi costruire?',
    },
    description: {
      'pt-BR': 'Resuma o produto como você o explicaria a um amigo. Foque no que ele faz e para quem.',
      'en-US': 'Summarize the product as you would explain it to a friend. Focus on what it does and who it serves.',
      'es-ES': 'Resume el producto como se lo explicarías a un amigo. Enfócate en qué hace y para quién.',
      'it-IT': "Riassumi il prodotto come lo spiegheresti a un amico. Concentrati su cosa fa e per chi.",
    },
    help_text_ptBR:
      'Entre 10 e 240 caracteres. Exemplo: "Plataforma para fotógrafos venderem ensaios direto pro cliente, com galeria privada e checkout em uma tela."',
  },
  {
    code: 'Q097',
    block: 'NARRATIVE',
    type: 'TEXT_INPUT',
    order: 97,
    required: false,
    next_question: 'Q098',
    title: {
      'pt-BR': 'Quais são as 3 a 5 funcionalidades obrigatórias na primeira versão?',
      'en-US': 'What are the 3 to 5 must-have features in the first version?',
      'es-ES': '¿Cuáles son las 3 a 5 funcionalidades obligatorias en la primera versión?',
      'it-IT': 'Quali sono le 3-5 funzionalità obbligatorie nella prima versione?',
    },
    description: {
      'pt-BR': 'Liste as features que, se faltarem, o produto não vai pro ar. Pode ser bullet list ou frases.',
      'en-US': 'List the features that, if missing, the product cannot launch. Bullet list or sentences are fine.',
      'es-ES': 'Lista las funciones sin las que el producto no puede lanzarse. Puede ser lista o frases.',
      'it-IT': 'Elenca le funzionalità senza cui il prodotto non può andare in produzione. Lista o frasi.',
    },
    help_text_ptBR:
      'Opcional, até 800 caracteres. Sugestão de formato: uma feature por linha, começando com verbo. Ex.: "Cadastrar evento e fotos", "Aprovar fotos com 1 clique".',
  },
  {
    code: 'Q098',
    block: 'NARRATIVE',
    type: 'TEXT_INPUT',
    order: 98,
    required: false,
    next_question: 'Q099',
    title: {
      'pt-BR': 'Existe algum produto, app ou site que você usa de referência? Por quê?',
      'en-US': 'Is there a product, app or site you use as reference? Why?',
      'es-ES': '¿Hay un producto, app o sitio que uses como referencia? ¿Por qué?',
      'it-IT': "C'è un prodotto, un'app o un sito che usi come riferimento? Perché?",
    },
    description: {
      'pt-BR': 'Cite nomes (ex.: Notion, Hotmart, Mercado Livre) e o que você gosta neles. Vale também o que NÃO gosta.',
      'en-US': 'Name products (e.g., Notion, Stripe, Shopify) and what you like about them. What you dislike also helps.',
      'es-ES': 'Nombra productos (ej.: Notion, Mercado Libre) y qué te gusta. Lo que no te gusta también ayuda.',
      'it-IT': 'Nomina prodotti (es.: Notion, Subito, Satispay) e cosa ti piace. Anche cosa non ti piace aiuta.',
    },
    help_text_ptBR:
      'Opcional, até 1500 caracteres. Referências aceleram alinhamento visual e funcional. Pode listar 1 ou várias.',
  },
  {
    code: 'Q099',
    block: 'NARRATIVE',
    type: 'TEXT_INPUT',
    order: 99,
    required: false,
    // null → end_of_block:true. A transição NARRATIVE → LEAD ocorre via
    // pending_blocks; resolveQueuedNextQuestionId acha Q100 (1º de LEAD).
    next_question: null,
    title: {
      'pt-BR': 'Algo que você quer deixar registrado e ainda não cabia nas perguntas anteriores?',
      'en-US': 'Anything you want on record that did not fit the previous questions?',
      'es-ES': '¿Algo que quieras dejar registrado y aún no cabía en las preguntas anteriores?',
      'it-IT': 'Qualcosa che vuoi mettere agli atti e non rientrava nelle domande precedenti?',
    },
    description: {
      'pt-BR': 'Restrições, prazos rígidos, integrações específicas, contexto de negócio, expectativas — qualquer coisa relevante.',
      'en-US': 'Constraints, hard deadlines, specific integrations, business context, expectations — anything relevant.',
      'es-ES': 'Restricciones, plazos firmes, integraciones específicas, contexto de negocio, expectativas — lo que sea.',
      'it-IT': 'Vincoli, scadenze rigide, integrazioni specifiche, contesto di business, aspettative — qualunque cosa rilevante.',
    },
    help_text_ptBR:
      'Opcional, até 1500 caracteres. Use este campo para o que ficou de fora. A equipe lê tudo antes do primeiro contato.',
  },
]

function jsonEquals(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

async function findQuestionByCode(prisma: PrismaClient, code: QuestionCode) {
  return prisma.question.findUnique({ where: { code } })
}

async function upsertQuestion(prisma: PrismaClient, question: NarrativeQuestion) {
  const existing = await findQuestionByCode(prisma, question.code)
  const data = {
    block: question.block,
    type: question.type,
    order: question.order,
    required: question.required,
  }

  if (!existing) {
    const created = await prisma.question.create({
      data: { code: question.code, ...data },
    })
    return { id: created.id, created: true }
  }

  if (
    existing.block !== data.block ||
    existing.type !== data.type ||
    existing.order !== data.order ||
    existing.required !== data.required
  ) {
    await prisma.question.update({ where: { id: existing.id }, data })
  }
  return { id: existing.id, created: false }
}

async function upsertTranslations(
  prisma: PrismaClient,
  questionId: string,
  question: NarrativeQuestion
) {
  for (const locale of ALL_LOCALES) {
    const existing = await prisma.questionTranslation.findUnique({
      where: { question_id_locale: { question_id: questionId, locale } },
    })

    const data = {
      title: question.title[locale],
      description: question.description[locale],
      help_text:
        locale === DEFAULT_LOCALE
          ? question.help_text_ptBR
          : existing?.help_text ?? null,
    }

    if (!existing) {
      await prisma.questionTranslation.create({
        data: { question_id: questionId, locale, ...data },
      })
      continue
    }

    if (
      existing.title !== data.title ||
      existing.description !== data.description ||
      (locale === DEFAULT_LOCALE && existing.help_text !== data.help_text)
    ) {
      await prisma.questionTranslation.update({ where: { id: existing.id }, data })
    }
  }
}

async function setSkipLogic(
  prisma: PrismaClient,
  code: QuestionCode,
  skipLogic: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput
) {
  const question = await findQuestionByCode(prisma, code)
  if (!question) throw new Error(`Pergunta ${code} não encontrada para ajustar skip_logic`)
  if (jsonEquals(question.skip_logic, skipLogic)) return false
  await prisma.question.update({ where: { id: question.id }, data: { skip_logic: skipLogic } })
  return true
}

async function setAllOptionsNextQuestion(
  prisma: PrismaClient,
  code: QuestionCode,
  nextCode: QuestionCode | null
) {
  const question = await prisma.question.findUnique({
    where: { code },
    include: { options: true },
  })
  if (!question) throw new Error(`Pergunta ${code} não encontrada para ajustar next_question_id`)

  let nextQuestionId: string | null = null
  if (nextCode) {
    const next = await findQuestionByCode(prisma, nextCode)
    if (!next) throw new Error(`Pergunta destino ${nextCode} não encontrada`)
    nextQuestionId = next.id
  }

  let updated = 0
  for (const option of question.options) {
    if (option.next_question_id !== nextQuestionId) {
      await prisma.option.update({
        where: { id: option.id },
        data: { next_question_id: nextQuestionId },
      })
      updated += 1
    }
  }
  return updated
}

export async function applyNarrativeRefactorV4(prisma: PrismaClient) {
  const summary = {
    questionsCreated: 0,
    questionsUpdated: 0,
    chainLinksUpdated: 0,
    q105RemovedFromChain: false,
    contextChainRedirected: false,
  }

  await prisma.$transaction(async (tx) => {
    const txClient = tx as PrismaClient

    for (const question of NARRATIVE_QUESTIONS) {
      const { id, created } = await upsertQuestion(txClient, question)
      if (created) summary.questionsCreated += 1
      else summary.questionsUpdated += 1

      await upsertTranslations(txClient, id, question)
      await setSkipLogic(
        txClient,
        question.code,
        question.next_question
          ? { next_question: question.next_question }
          : { end_of_block: true }
      )
    }

    // Garante Q095 com end_of_block (já é o estado pós v2). Mantemos a chamada
    // como guarda idempotente — se v2 mudar no futuro, esta linha protege.
    summary.contextChainRedirected = await setSkipLogic(txClient, 'Q095', {
      end_of_block: true,
    })

    const q104Updates = await setAllOptionsNextQuestion(txClient, 'Q104', null)
    summary.chainLinksUpdated += q104Updates
    if (q104Updates > 0) summary.q105RemovedFromChain = true
  })

  return summary
}

async function main() {
  const prisma = createSeedPrismaClient()
  console.log('[refactor-narrative-v4] início')
  try {
    const summary = await applyNarrativeRefactorV4(prisma)
    console.log('[refactor-narrative-v4] resumo', JSON.stringify(summary, null, 2))
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('[refactor-narrative-v4] erro', error)
    process.exit(1)
  })
}
