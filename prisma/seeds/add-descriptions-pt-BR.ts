import type { PrismaClient } from '@prisma/client'
import { createSeedPrismaClient } from './_createPrismaClient'

const DESCRIPTION_BY_CODE: Record<string, string> = {
  Q021: 'Defina como a loja vai vender: catálogo simples, checkout direto ou operação mais flexível.',
  Q022: 'Mostre se a loja precisa conversar com estoque, ERP ou outros sistemas internos.',
  Q030: 'Indique o nível de acesso e proteção que as pessoas precisarão dentro do sistema.',
  Q031: 'Ajuda a medir quanto o produto precisa transformar dados em visão de negócio.',
  Q032: 'Mostra quantas conexões externas o sistema precisará manter funcionando com segurança.',
  Q033: 'Define se o produto só recebe arquivos ou também precisa tratar e transformar esse material.',
  Q034: 'Mostra se o sistema precisa avisar usuários por email, push ou outros canais.',
  Q035: 'Ajuda a entender se haverá cobrança, faturamento ou regras financeiras no produto.',
  Q036: 'Indica se o sistema precisa continuar útil quando a conexão com internet falhar.',
  Q037: 'Define se a experiência exige atualização imediata entre pessoas, telas ou eventos.',
  Q038: 'Ajuda a medir a sofisticação necessária para encontrar informações dentro da plataforma.',
  Q039: 'Mostra se o produto atenderá uma operação única ou várias empresas no mesmo ambiente.',
  Q040: 'Define o nível de rastreabilidade necessário para ações, mudanças e conformidade.',
  Q041: 'Ajuda a entender como os usuários precisarão retirar e compartilhar dados do sistema.',
  Q046: 'Escolha entre lançar mais rápido em múltiplas plataformas ou buscar experiência mais refinada.',
  Q050: 'Identifica se o objetivo principal é automatizar tarefas, gerar conteúdo ou analisar dados.',
  Q051: 'Mostra de onde virão os dados que alimentam a automação ou a inteligência do projeto.',
  Q052: 'Define se a inteligência ficará separada, embutida no produto ou em um fluxo maior.',
  Q090: 'Use a faixa que melhor representa o investimento disponível hoje para o projeto.',
  Q091: 'Indique o prazo esperado para equilibrar velocidade, escopo e nível de acabamento.',
  Q092: 'Mostra se a parte visual já está pronta ou ainda precisará ser criada.',
  Q093: 'Ajuda a entender o nível de suporte esperado depois que o projeto entrar no ar.',
}

export async function addDescriptionsPtBr(prisma: PrismaClient) {
  let updatedCount = 0

  for (const [code, description] of Object.entries(DESCRIPTION_BY_CODE)) {
    const result = await prisma.questionTranslation.updateMany({
      where: {
        locale: 'pt-BR',
        question: { code },
        OR: [
          { description: null },
          { description: { not: description } },
        ],
      },
      data: { description },
    })

    updatedCount += result.count
  }

  console.log(`[seed:add-descriptions-pt-BR] descrições atualizadas=${updatedCount}`)
  return { updatedCount }
}

async function main() {
  const prisma = createSeedPrismaClient()

  try {
    await addDescriptionsPtBr(prisma)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('[seed:add-descriptions-pt-BR] erro', error)
    process.exit(1)
  })
}
