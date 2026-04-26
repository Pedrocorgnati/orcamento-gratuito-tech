import { PrismaClient, type Prisma } from '@prisma/client'
import { createSeedPrismaClient } from './_createPrismaClient'

type QuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'BUDGET_SELECT' | 'DEADLINE_SELECT' | 'TEXT_INPUT'
type Locale = 'pt-BR' | 'en-US' | 'es-ES' | 'it-IT'
type QuestionCode = `Q${string}`
type Decision = 'MANTER' | 'EDITAR' | 'REMOVER'

type OptionSeed = {
  order: number
  price_impact: number
  time_impact: number
  complexity_impact: number
  weight: number
  labels: Partial<Record<Locale, string>>
  description_ptBR?: string
}

type QuestionSeed = {
  code: QuestionCode
  block: string
  type: QuestionType
  order: number
  required: boolean
  title: Partial<Record<Locale, string>>
  description?: Partial<Record<Locale, string>>
  help_text_ptBR?: string
  options?: OptionSeed[]
}

type GraphChain = {
  codes: QuestionCode[]
  exitTo: QuestionCode | null
}

type Summary = {
  existingUpdated: number
  existingTranslationsUpdated: number
  existingOptionsUpdated: number
  zeroedLeadOptions: number
  removedQuestionsSoftDeleted: number
  removedQuestionsLoggedOnly: number
  reroutedSessions: number
  newQuestionsCreated: number
  newQuestionsUpdated: number
  newOptionsCreated: number
  newOptionsUpdated: number
  newTranslationsCreated: number
  newTranslationsUpdated: number
  dontKnowOptionsCreated: number
  graphLinksUpdated: number
}

const ALL_LOCALES: Locale[] = ['pt-BR', 'en-US', 'es-ES', 'it-IT']
const DEFAULT_LOCALE: Locale = 'pt-BR'

const LEAD_QUALIFIER_CODES: QuestionCode[] = ['Q005', 'Q090', 'Q091', 'Q104']
const REMOVED_QUESTION_CODES: QuestionCode[] = []

const DONT_KNOW_LABELS: Record<Locale, string> = {
  'pt-BR': 'Não sei / preciso de orientação',
  'en-US': 'I am not sure / I need guidance',
  'es-ES': 'No lo sé / necesito orientación',
  'it-IT': 'Non lo so / ho bisogno di orientamento',
}

const NEW_TECHNICAL_CODES_WITH_DONT_KNOW: QuestionCode[] = [
  'Q015', 'Q016', 'Q017',
  'Q025', 'Q026', 'Q027',
  'Q042', 'Q043', 'Q044',
  'Q053', 'Q054', 'Q055',
  'Q060', 'Q061', 'Q062', 'Q063',
  'Q094', 'Q095',
]

function withFallback(labels: Partial<Record<Locale, string>>): Record<Locale, string> {
  const ptBR = labels[DEFAULT_LOCALE]
  if (!ptBR) throw new Error('pt-BR é obrigatório para títulos e labels do refactor v2')

  return {
    'pt-BR': ptBR,
    'en-US': labels['en-US'] ?? ptBR,
    'es-ES': labels['es-ES'] ?? ptBR,
    'it-IT': labels['it-IT'] ?? ptBR,
  }
}

function jsonEquals(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b)
}

function buildOptionDescriptionPatch(questionCode: QuestionCode, options: OptionSeed[]) {
  return Object.fromEntries(
    options
      .filter((option) => option.description_ptBR)
      .map((option) => [`${questionCode}:${option.order}`, option.description_ptBR as string])
  ) as Record<string, string>
}

const EXISTING_QUESTION_EDITS: QuestionSeed[] = [
  {
    code: 'Q001',
    block: 'PROJECT_TYPE',
    type: 'MULTIPLE_CHOICE',
    order: 1,
    required: true,
    title: {
      'pt-BR': 'Que tipo de projeto você quer criar?',
      'en-US': 'What type of project do you want to build?',
      'es-ES': '¿Qué tipo de proyecto quieres crear?',
      'it-IT': 'Che tipo di progetto vuoi creare?',
    },
    description: {
      'pt-BR': 'Selecione a categoria que melhor descreve o seu projeto. Você pode escolher mais de uma se o projeto combinar frentes.',
      'en-US': 'Pick the category that best describes your project. You may select more than one if it combines fronts.',
      'es-ES': 'Selecciona la categoría que mejor describa tu proyecto. Puedes elegir más de una si combina frentes.',
      'it-IT': 'Scegli la categoria che meglio descrive il tuo progetto. Puoi selezionarne più di una se combina fronti.',
    },
    help_text_ptBR:
      'Cada tipo abre uma trilha diferente de perguntas técnicas. Escolha o que mais se aproxima do escopo principal.',
    options: [
      {
        order: 1,
        price_impact: 1500,
        time_impact: 21,
        complexity_impact: 15,
        weight: 1.0,
        labels: {
          'pt-BR': 'Site institucional',
          'en-US': 'Company website',
          'es-ES': 'Sitio institucional',
          'it-IT': 'Sito istituzionale',
        },
        description_ptBR: 'Site com várias páginas para apresentar empresa, serviços e contato. Bom para presença online e conversão inicial.',
      },
      {
        order: 2,
        price_impact: 800,
        time_impact: 10,
        complexity_impact: 10,
        weight: 1.0,
        labels: {
          'pt-BR': 'Landing page / Página pessoal',
          'en-US': 'Landing page / Personal page',
          'es-ES': 'Landing page / Página personal',
          'it-IT': 'Landing page / Pagina personale',
        },
        description_ptBR: 'Uma página focada em conversão ou apresentação pessoal. Ideal para campanhas, portfólio ou captura de leads.',
      },
      {
        order: 3,
        price_impact: 5000,
        time_impact: 45,
        complexity_impact: 50,
        weight: 1.2,
        labels: {
          'pt-BR': 'Loja virtual (e-commerce)',
          'en-US': 'Online store (e-commerce)',
          'es-ES': 'Tienda virtual (e-commerce)',
          'it-IT': 'Negozio online (e-commerce)',
        },
        description_ptBR: 'Venda direta online com carrinho, pagamento e gestão de pedidos. Envolve catálogo, estoque e logística.',
      },
      {
        order: 4,
        price_impact: 8000,
        time_impact: 60,
        complexity_impact: 65,
        weight: 1.3,
        labels: {
          'pt-BR': 'Sistema web / SaaS',
          'en-US': 'Web system / SaaS',
          'es-ES': 'Sistema web / SaaS',
          'it-IT': 'Sistema web / SaaS',
        },
        description_ptBR: 'Aplicação com login, regras de negócio e dados persistidos. Inclui SaaS, ERPs internos e painéis operacionais.',
      },
      {
        order: 5,
        price_impact: 12000,
        time_impact: 90,
        complexity_impact: 70,
        weight: 1.4,
        labels: {
          'pt-BR': 'Aplicativo Android',
          'en-US': 'Android app',
          'es-ES': 'Aplicación Android',
          'it-IT': 'App Android',
        },
        description_ptBR: 'App nativo ou cross-platform publicado na Play Store. Foco na experiência mobile do usuário Android.',
      },
      {
        order: 6,
        price_impact: 8000,
        time_impact: 45,
        complexity_impact: 50,
        weight: 1.3,
        labels: {
          'pt-BR': 'Automação',
          'en-US': 'Automation',
          'es-ES': 'Automatización',
          'it-IT': 'Automazione',
        },
        description_ptBR: 'Automação de tarefas, integrações entre sistemas ou fluxos operacionais. Reduz trabalho manual repetitivo.',
      },
      {
        order: 7,
        price_impact: 10000,
        time_impact: 65,
        complexity_impact: 60,
        weight: 1.35,
        labels: {
          'pt-BR': 'Marketplace',
          'en-US': 'Marketplace',
          'es-ES': 'Marketplace',
          'it-IT': 'Marketplace',
        },
        description_ptBR: 'Plataforma multi-vendedor com catálogo, pagamentos e split. Mais complexo que um e-commerce comum.',
      },
      {
        order: 8,
        price_impact: 14000,
        time_impact: 70,
        complexity_impact: 75,
        weight: 1.45,
        labels: {
          'pt-BR': 'Sistemas de criptomoedas',
          'en-US': 'Cryptocurrency systems',
          'es-ES': 'Sistemas de criptomonedas',
          'it-IT': 'Sistemi di criptovalute',
        },
        description_ptBR: 'Projetos com carteira, token, smart contract ou integração com blockchain. Exige rigor técnico e de segurança.',
      },
      {
        order: 9,
        price_impact: 3000,
        time_impact: 21,
        complexity_impact: 25,
        weight: 1.1,
        labels: {
          'pt-BR': 'Extensão do Chrome',
          'en-US': 'Chrome extension',
          'es-ES': 'Extensión de Chrome',
          'it-IT': 'Estensione Chrome',
        },
        description_ptBR: 'Extensão para navegador Chrome (ou baseados em Chromium). Integra com páginas existentes e cria ferramentas de produtividade.',
      },
      {
        order: 10,
        price_impact: 12000,
        time_impact: 90,
        complexity_impact: 70,
        weight: 1.4,
        labels: {
          'pt-BR': 'Aplicativo iOS',
          'en-US': 'iOS app',
          'es-ES': 'Aplicación iOS',
          'it-IT': 'App iOS',
        },
        description_ptBR: 'App nativo ou cross-platform publicado na App Store. Envolve revisão da Apple e guidelines próprias.',
      },
      {
        order: 11,
        price_impact: 15000,
        time_impact: 75,
        complexity_impact: 80,
        weight: 1.5,
        labels: {
          'pt-BR': 'Inteligência Artificial',
          'en-US': 'Artificial Intelligence',
          'es-ES': 'Inteligencia Artificial',
          'it-IT': 'Intelligenza Artificiale',
        },
        description_ptBR: 'Produtos com LLMs, assistentes, análise de dados ou visão computacional. Exige modelagem, custo de inferência e avaliação de qualidade.',
      },
    ],
  },
  {
    code: 'Q005',
    block: 'PROJECT_TYPE',
    type: 'SINGLE_CHOICE',
    order: 2,
    required: false,
    title: {
      'pt-BR': 'Qual é o porte e momento do contratante?',
      'en-US': 'What is the company profile and stage?',
      'es-ES': '¿Cuál es el perfil y momento de la empresa?',
      'it-IT': "Qual è il profilo e la fase dell'azienda?",
    },
    description: {
      'pt-BR': 'Pergunta de qualificação comercial. Não altera escopo técnico da estimativa.',
      'en-US': 'Commercial qualification only. It does not change the technical scope.',
      'es-ES': 'Solo para calificación comercial. No cambia el alcance técnico.',
      'it-IT': 'Solo qualificazione commerciale. Non cambia lo scopo tecnico.',
    },
    help_text_ptBR:
      'Essa resposta ajuda no roteamento comercial e no score do lead. Ela não deve aumentar nem reduzir esforço técnico do build.',
    options: [
      {
        order: 1,
        price_impact: 0,
        time_impact: 0,
        complexity_impact: 0,
        weight: 1.0,
        labels: {
          'pt-BR': 'PME ou empresa já operando',
          'en-US': 'SME or operating company',
          'es-ES': 'PyME o empresa ya operando',
          'it-IT': 'PMI o azienda già operativa',
        },
        description_ptBR: 'Perfil comercial mais comum, com operação já existente e compra mais estruturada.',
      },
      {
        order: 2,
        price_impact: 0,
        time_impact: 0,
        complexity_impact: 0,
        weight: 1.0,
        labels: {
          'pt-BR': 'Startup ou operação em validação',
          'en-US': 'Startup or validation-stage business',
          'es-ES': 'Startup u operación en validación',
          'it-IT': 'Startup o business in validazione',
        },
        description_ptBR: 'Ajuda a entender momento de compra, urgência e sensibilidade comercial.',
      },
      {
        order: 3,
        price_impact: 0,
        time_impact: 0,
        complexity_impact: 0,
        weight: 1.0,
        labels: {
          'pt-BR': 'Profissional autônomo ou pessoa física',
          'en-US': 'Freelancer or individual buyer',
          'es-ES': 'Profesional independiente o persona física',
          'it-IT': 'Freelance o persona fisica',
        },
        description_ptBR: 'Sinaliza processo comercial mais direto e normalmente com menos stakeholders.',
      },
      {
        order: 4,
        price_impact: 0,
        time_impact: 0,
        complexity_impact: 0,
        weight: 1.0,
        labels: {
          'pt-BR': 'Enterprise ou grupo com múltiplos stakeholders',
          'en-US': 'Enterprise or multi-stakeholder organization',
          'es-ES': 'Enterprise u organización con múltiples stakeholders',
          'it-IT': 'Enterprise o organizzazione con più stakeholder',
        },
        description_ptBR: 'Indica negociação mais formal, validações internas e ciclo comercial mais longo.',
      },
    ],
  },
  {
    code: 'Q011',
    block: 'WEBSITES',
    type: 'SINGLE_CHOICE',
    order: 11,
    required: true,
    title: {
      'pt-BR': 'Como o conteúdo do site será gerenciado?',
      'en-US': 'How will website content be managed?',
      'es-ES': '¿Cómo se gestionará el contenido del sitio?',
      'it-IT': 'Come verranno gestiti i contenuti del sito?',
    },
    help_text_ptBR:
      'CMS muda modelagem, painel administrativo, fluxo editorial e hospedagem. Escolha pelo modo real de operação do conteúdo.',
    options: [
      {
        order: 1,
        price_impact: 0,
        time_impact: 0,
        complexity_impact: 0,
        weight: 1.0,
        labels: {
          'pt-BR': 'Sem CMS, conteúdo mais estático',
          'en-US': 'No CMS, mostly static content',
          'es-ES': 'Sin CMS, contenido más estático',
          'it-IT': 'Senza CMS, contenuto più statico',
        },
        description_ptBR: 'Boa escolha quando o site muda pouco e a equipe não precisa de operação editorial frequente.',
      },
      {
        order: 2,
        price_impact: 1000,
        time_impact: 7,
        complexity_impact: 12,
        weight: 1.1,
        labels: {
          'pt-BR': 'CMS acoplado para páginas e blog',
          'en-US': 'Coupled CMS for pages and blog',
          'es-ES': 'CMS acoplado para páginas y blog',
          'it-IT': 'CMS accoppiato per pagine e blog',
        },
        description_ptBR: 'Inclui painel editorial mais simples dentro do próprio projeto.',
      },
      {
        order: 3,
        price_impact: 2200,
        time_impact: 14,
        complexity_impact: 24,
        weight: 1.2,
        labels: {
          'pt-BR': 'Headless CMS ou WordPress com fluxo editorial mais robusto',
          'en-US': 'Headless CMS or WordPress with richer editorial flow',
          'es-ES': 'Headless CMS o WordPress con flujo editorial más robusto',
          'it-IT': 'Headless CMS o WordPress con workflow editoriale più robusto',
        },
        description_ptBR: 'Faz sentido quando conteúdo, governança editorial e integração com front-end precisam de mais flexibilidade.',
      },
    ],
  },
  {
    code: 'Q021',
    block: 'ECOMMERCE',
    type: 'SINGLE_CHOICE',
    order: 21,
    required: true,
    title: {
      'pt-BR': 'Quais meios de pagamento a loja precisa aceitar?',
      'en-US': 'Which payment methods must the store accept?',
      'es-ES': '¿Qué medios de pago debe aceptar la tienda?',
      'it-IT': 'Quali metodi di pagamento deve accettare lo store?',
    },
    help_text_ptBR:
      'O mix de pagamento muda checkout, conciliação, antifraude, split de regras e esforço de homologação.',
    options: [
      {
        order: 1,
        price_impact: 0,
        time_impact: 0,
        complexity_impact: 0,
        weight: 1.0,
        labels: {
          'pt-BR': 'Catálogo ou venda assistida, sem checkout online',
          'en-US': 'Catalog or assisted sale, no online checkout',
          'es-ES': 'Catálogo o venta asistida, sin checkout online',
          'it-IT': 'Catalogo o vendita assistita, senza checkout online',
        },
        description_ptBR: 'Útil para operações que validam interesse antes de automatizar pagamento.',
      },
      {
        order: 2,
        price_impact: 1500,
        time_impact: 10,
        complexity_impact: 18,
        weight: 1.15,
        labels: {
          'pt-BR': 'PIX + cartão com um gateway principal',
          'en-US': 'PIX + cards through one main gateway',
          'es-ES': 'PIX + tarjeta con un gateway principal',
          'it-IT': 'PIX + carte tramite un gateway principale',
        },
        description_ptBR: 'Cobertura comum no Brasil com integração mais previsível.',
      },
      {
        order: 3,
        price_impact: 3500,
        time_impact: 21,
        complexity_impact: 36,
        weight: 1.3,
        labels: {
          'pt-BR': 'Múltiplos meios: PIX, boleto, cartão internacional ou regras avançadas',
          'en-US': 'Multiple methods: PIX, boleto, international cards or advanced rules',
          'es-ES': 'Múltiples medios: PIX, boleto, tarjeta internacional o reglas avanzadas',
          'it-IT': 'Più metodi: PIX, boleto, carte internazionali o regole avanzate',
        },
        description_ptBR: 'Aumenta fluxo de checkout, conciliação e cenários de teste.',
      },
    ],
  },
  {
    code: 'Q039',
    block: 'WEB_SYSTEM',
    type: 'SINGLE_CHOICE',
    order: 39,
    required: true,
    title: {
      'pt-BR': 'O sistema será single-client, multi-cliente ou white-label?',
      'en-US': 'Will the system be single-client, multi-client, or white-label?',
      'es-ES': '¿El sistema será single-client, multi-cliente o white-label?',
      'it-IT': 'Il sistema sarà single-client, multi-cliente o white-label?',
    },
    help_text_ptBR:
      'White-label e multi-cliente afetam isolamento de dados, branding, permissões, billing e arquitetura desde o começo.',
    options: [
      {
        order: 1,
        price_impact: 0,
        time_impact: 0,
        complexity_impact: 0,
        weight: 1.0,
        labels: {
          'pt-BR': 'Single-client, uma operação única',
          'en-US': 'Single-client, one operation',
          'es-ES': 'Single-client, una operación única',
          'it-IT': 'Single-client, una sola operazione',
        },
        description_ptBR: 'Modelo mais simples, com uma única estrutura de dados e branding.',
      },
      {
        order: 2,
        price_impact: 4000,
        time_impact: 30,
        complexity_impact: 50,
        weight: 1.4,
        labels: {
          'pt-BR': 'Multi-cliente com separação por tenant',
          'en-US': 'Multi-client with tenant separation',
          'es-ES': 'Multi-cliente con separación por tenant',
          'it-IT': 'Multi-cliente con separazione per tenant',
        },
        description_ptBR: 'Exige isolamento lógico de dados e regras por cliente.',
      },
      {
        order: 3,
        price_impact: 9000,
        time_impact: 60,
        complexity_impact: 70,
        weight: 1.5,
        labels: {
          'pt-BR': 'White-label com branding, domínios ou módulos por cliente',
          'en-US': 'White-label with branding, domains, or modules per client',
          'es-ES': 'White-label con branding, dominios o módulos por cliente',
          'it-IT': 'White-label con branding, domini o moduli per cliente',
        },
        description_ptBR: 'Sobe bastante o escopo por exigir customização por conta e governança de assets.',
      },
    ],
  },
  {
    code: 'Q046',
    block: 'MOBILE_APP',
    type: 'SINGLE_CHOICE',
    order: 46,
    required: true,
    title: {
      'pt-BR': 'Qual abordagem técnica faz mais sentido para o app?',
      'en-US': 'Which technical approach makes more sense for the app?',
      'es-ES': '¿Qué enfoque técnico tiene más sentido para la app?',
      'it-IT': "Quale approccio tecnico ha più senso per l'app?",
    },
    help_text_ptBR:
      'Essa decisão impacta esforço, time-to-market, acesso a APIs nativas e manutenção futura. Escolha conforme a exigência real do produto.',
    options: [
      {
        order: 1,
        price_impact: 0,
        time_impact: 0,
        complexity_impact: 0,
        weight: 1.0,
        labels: {
          'pt-BR': 'Cross-platform para acelerar entrega inicial',
          'en-US': 'Cross-platform to speed up the initial release',
          'es-ES': 'Cross-platform para acelerar la entrega inicial',
          'it-IT': 'Cross-platform per accelerare il rilascio iniziale',
        },
        description_ptBR: 'Uma base tende a reduzir custo inicial e acelerar MVP.',
      },
      {
        order: 2,
        price_impact: 4000,
        time_impact: 30,
        complexity_impact: 30,
        weight: 1.2,
        labels: {
          'pt-BR': 'Nativo por plataforma para máximo controle',
          'en-US': 'Native per platform for maximum control',
          'es-ES': 'Nativo por plataforma para máximo control',
          'it-IT': 'Nativo per piattaforma per massimo controllo',
        },
        description_ptBR: 'Indicado quando performance, UX específica ou APIs nativas são mais críticas.',
      },
    ],
  },
  {
    code: 'Q090',
    block: 'CONTEXT',
    type: 'BUDGET_SELECT',
    order: 90,
    required: true,
    title: {
      'pt-BR': 'Qual faixa de investimento faz sentido para este projeto?',
      'en-US': 'Which investment range makes sense for this project?',
      'es-ES': '¿Qué rango de inversión hace sentido para este proyecto?',
      'it-IT': 'Quale fascia di investimento ha senso per questo progetto?',
    },
    description: {
      'pt-BR': 'Pergunta de qualificação comercial. Não altera os multiplicadores técnicos.',
      'en-US': 'Commercial qualification only. It does not change technical multipliers.',
      'es-ES': 'Solo para calificación comercial. No cambia los multiplicadores técnicos.',
      'it-IT': 'Solo per qualificazione commerciale. Non cambia i moltiplicatori tecnici.',
    },
    help_text_ptBR:
      'Use a faixa para calibrar aderência comercial e score de oportunidade. O orçamento não deve distorcer a estimativa técnica.',
    options: [
      {
        order: 1,
        price_impact: 0,
        time_impact: 0,
        complexity_impact: 0,
        weight: 1.0,
        labels: { 'pt-BR': 'Abaixo de R$ 10 mil', 'en-US': 'Below US$ 10k', 'es-ES': 'Menos de US$ 10 mil', 'it-IT': 'Meno di US$ 10 mila' },
        description_ptBR: 'Faixa enxuta, útil para qualificar aderência a MVP e priorização.',
      },
      {
        order: 2,
        price_impact: 0,
        time_impact: 0,
        complexity_impact: 0,
        weight: 1.0,
        labels: { 'pt-BR': 'R$ 10 mil a R$ 25 mil', 'en-US': 'US$ 10k to US$ 25k', 'es-ES': 'US$ 10 mil a US$ 25 mil', 'it-IT': 'Da US$ 10 mila a US$ 25 mila' },
        description_ptBR: 'Faixa comum para projetos iniciais com escopo bem delimitado.',
      },
      {
        order: 3,
        price_impact: 0,
        time_impact: 0,
        complexity_impact: 0,
        weight: 1.0,
        labels: { 'pt-BR': 'R$ 25 mil a R$ 60 mil', 'en-US': 'US$ 25k to US$ 60k', 'es-ES': 'US$ 25 mil a US$ 60 mil', 'it-IT': 'Da US$ 25 mila a US$ 60 mila' },
        description_ptBR: 'Faixa que costuma comportar soluções com integrações e acabamento mais robusto.',
      },
      {
        order: 4,
        price_impact: 0,
        time_impact: 0,
        complexity_impact: 0,
        weight: 1.0,
        labels: { 'pt-BR': 'Acima de R$ 60 mil', 'en-US': 'Above US$ 60k', 'es-ES': 'Más de US$ 60 mil', 'it-IT': 'Oltre US$ 60 mila' },
        description_ptBR: 'Sinaliza apetite para builds mais completos ou roadmap mais ambicioso.',
      },
    ],
  },
  {
    code: 'Q091',
    block: 'CONTEXT',
    type: 'DEADLINE_SELECT',
    order: 91,
    required: true,
    title: {
      'pt-BR': 'Qual é a janela desejada para entrar em produção?',
      'en-US': 'What is the desired production timeline?',
      'es-ES': '¿Cuál es la ventana deseada para entrar en producción?',
      'it-IT': 'Qual è la finestra desiderata per andare in produzione?',
    },
    help_text_ptBR:
      'Prazo serve para priorização comercial e avaliação de aderência. Não deve inflar nem reduzir o esforço técnico-base.',
    options: [
      {
        order: 1,
        price_impact: 0,
        time_impact: 0,
        complexity_impact: 0,
        weight: 1.0,
        labels: {
          'pt-BR': 'Urgente, idealmente em até 30 dias',
          'en-US': 'Urgent, ideally within 30 days',
          'es-ES': 'Urgente, idealmente en hasta 30 días',
          'it-IT': 'Urgente, idealmente entro 30 giorni',
        },
        description_ptBR: 'Ajuda a identificar urgência comercial e necessidade de escopo mais enxuto.',
      },
      {
        order: 2,
        price_impact: 0,
        time_impact: 0,
        complexity_impact: 0,
        weight: 1.0,
        labels: {
          'pt-BR': 'Janela normal de 1 a 3 meses',
          'en-US': 'Normal timeline of 1 to 3 months',
          'es-ES': 'Ventana normal de 1 a 3 meses',
          'it-IT': 'Finestra normale da 1 a 3 mesi',
        },
        description_ptBR: 'Prazo típico para descoberta, implementação e ajustes.',
      },
      {
        order: 3,
        price_impact: 0,
        time_impact: 0,
        complexity_impact: 0,
        weight: 1.0,
        labels: {
          'pt-BR': 'Flexível, acima de 3 meses',
          'en-US': 'Flexible, more than 3 months',
          'es-ES': 'Flexible, más de 3 meses',
          'it-IT': 'Flessibile, oltre 3 mesi',
        },
        description_ptBR: 'Sinaliza espaço para sequenciar melhor fases e decisões.',
      },
    ],
  },
  {
    code: 'Q093',
    block: 'CONTEXT',
    type: 'SINGLE_CHOICE',
    order: 93,
    required: true,
    title: {
      'pt-BR': 'Qual nível de documentação, handoff e treinamento é esperado?',
      'en-US': 'What level of documentation, handoff, and training is expected?',
      'es-ES': '¿Qué nivel de documentación, handoff y entrenamiento se espera?',
      'it-IT': 'Quale livello di documentazione, handoff e training è previsto?',
    },
    help_text_ptBR:
      'Esse pacote muda o esforço final de entrega, porque inclui documentação técnica, runbooks e transferência de conhecimento.',
    options: [
      {
        order: 1,
        price_impact: 0,
        time_impact: 0,
        complexity_impact: 0,
        weight: 1.0,
        labels: {
          'pt-BR': 'Handoff informal, sem pacote documental estruturado',
          'en-US': 'Informal handoff, no structured documentation package',
          'es-ES': 'Handoff informal, sin paquete documental estructurado',
          'it-IT': 'Handoff informale, senza pacchetto documentale strutturato',
        },
        description_ptBR: 'Entrega mais enxuta, com menor esforço de formalização.',
      },
      {
        order: 2,
        price_impact: 1000,
        time_impact: 5,
        complexity_impact: 5,
        weight: 1.05,
        labels: {
          'pt-BR': 'Documentação técnica básica e sessão de handoff',
          'en-US': 'Basic technical documentation and one handoff session',
          'es-ES': 'Documentación técnica básica y una sesión de handoff',
          'it-IT': 'Documentazione tecnica base e una sessione di handoff',
        },
        description_ptBR: 'Inclui documentação operacional básica e transferência inicial para o time.',
      },
      {
        order: 3,
        price_impact: 2500,
        time_impact: 10,
        complexity_impact: 12,
        weight: 1.12,
        labels: {
          'pt-BR': 'Documentação completa, runbooks e treinamento formal',
          'en-US': 'Full documentation, runbooks, and formal training',
          'es-ES': 'Documentación completa, runbooks y entrenamiento formal',
          'it-IT': 'Documentazione completa, runbook e training formale',
        },
        description_ptBR: 'Mais esforço de empacotamento, operação assistida e enablement do time do cliente.',
      },
    ],
  },
]

const NEW_QUESTIONS: QuestionSeed[] = [
  {
    code: 'Q006',
    block: 'AUTOMATION_AI',
    type: 'SINGLE_CHOICE',
    order: 6,
    required: true,
    title: {
      'pt-BR': 'Qual tipo de automação faz mais sentido para o projeto?',
      'en-US': 'Which type of automation best fits the project?',
      'es-ES': '¿Qué tipo de automatización tiene más sentido para el proyecto?',
      'it-IT': 'Quale tipo di automazione ha più senso per il progetto?',
    },
    help_text_ptBR:
      'Cada tipo de automação muda integrações, complexidade de regras e ferramentas envolvidas. Escolha o contexto mais próximo da operação real.',
    options: [
      {
        order: 1,
        price_impact: 0,
        time_impact: 0,
        complexity_impact: 0,
        weight: 1.0,
        labels: {
          'pt-BR': 'Automação comercial (vendas, CRM, atendimento)',
          'en-US': 'Commercial automation (sales, CRM, support)',
          'es-ES': 'Automatización comercial (ventas, CRM, atención)',
          'it-IT': 'Automazione commerciale (vendite, CRM, supporto)',
        },
        description_ptBR: 'Integrações entre CRM, e-mail, WhatsApp, chat ou ferramentas de vendas. Foco em funil comercial e follow-up.',
      },
      {
        order: 2,
        price_impact: 3000,
        time_impact: 21,
        complexity_impact: 30,
        weight: 1.2,
        labels: {
          'pt-BR': 'Automação industrial ou de dispositivos',
          'en-US': 'Industrial or device automation',
          'es-ES': 'Automatización industrial o de dispositivos',
          'it-IT': 'Automazione industriale o di dispositivi',
        },
        description_ptBR: 'Integra sensores, PLCs, máquinas ou dispositivos IoT. Exige protocolos específicos e tolerância a falhas.',
      },
      {
        order: 3,
        price_impact: 2000,
        time_impact: 14,
        complexity_impact: 25,
        weight: 1.15,
        labels: {
          'pt-BR': 'Automação de processos internos (BPM / RPA)',
          'en-US': 'Internal process automation (BPM / RPA)',
          'es-ES': 'Automatización de procesos internos (BPM / RPA)',
          'it-IT': 'Automazione di processi interni (BPM / RPA)',
        },
        description_ptBR: 'Automatiza fluxos operacionais, aprovações, planilhas e back-office. Reduz trabalho manual e erros humanos.',
      },
      {
        order: 4,
        price_impact: 2500,
        time_impact: 14,
        complexity_impact: 28,
        weight: 1.2,
        labels: {
          'pt-BR': 'Workflow com múltiplas integrações e APIs',
          'en-US': 'Workflow with multiple integrations and APIs',
          'es-ES': 'Workflow con múltiples integraciones y APIs',
          'it-IT': 'Workflow con più integrazioni e API',
        },
        description_ptBR: 'Orquestração entre várias ferramentas SaaS, APIs externas e webhooks. Exige resiliência e tratamento de falha.',
      },
    ],
  },
  {
    code: 'Q015',
    block: 'WEBSITES',
    type: 'SINGLE_CHOICE',
    order: 15,
    required: true,
    title: {
      'pt-BR': 'Qual profundidade de SEO técnico o site precisa ter?',
      'en-US': 'How deep should the technical SEO work be?',
      'es-ES': '¿Qué profundidad de SEO técnico necesita el sitio?',
      'it-IT': 'Quanto deve essere profondo il lavoro di SEO tecnico?',
    },
    help_text_ptBR:
      'SEO técnico adiciona sitemap, metadata, schema, redirecionamentos, performance e validações de indexação.',
    options: [
      { order: 1, price_impact: 0, time_impact: 0, complexity_impact: 0, weight: 1.0, labels: { 'pt-BR': 'SEO básico, só estrutura mínima' }, description_ptBR: 'Cobertura mínima para publicar com boas práticas essenciais.' },
      { order: 2, price_impact: 800, time_impact: 7, complexity_impact: 10, weight: 1.1, labels: { 'pt-BR': 'SEO on-page com metadata e sitemap' }, description_ptBR: 'Inclui estruturação on-page e recursos mais comuns de indexação.' },
      { order: 3, price_impact: 1800, time_impact: 14, complexity_impact: 22, weight: 1.2, labels: { 'pt-BR': 'SEO técnico completo com schema, redirects e governança' }, description_ptBR: 'Mais indicado quando tráfego orgânico é relevante desde o lançamento.' },
    ],
  },
  {
    code: 'Q016',
    block: 'WEBSITES',
    type: 'SINGLE_CHOICE',
    order: 16,
    required: true,
    title: {
      'pt-BR': 'Quais analytics, pixels ou tags o site precisa ter?',
      'en-US': 'Which analytics, pixels, or tags should the site include?',
      'es-ES': '¿Qué analytics, píxeles o tags debe incluir el sitio?',
      'it-IT': 'Quali analytics, pixel o tag deve includere il sito?',
    },
    help_text_ptBR:
      'Instrumentação adiciona scripts, data layer, eventos, consentimento e validação de conversões.',
    options: [
      { order: 1, price_impact: 0, time_impact: 0, complexity_impact: 0, weight: 1.0, labels: { 'pt-BR': 'Sem instrumentação além do essencial' }, description_ptBR: 'Sem eventos avançados ou pixels adicionais.' },
      { order: 2, price_impact: 500, time_impact: 3, complexity_impact: 5, weight: 1.05, labels: { 'pt-BR': 'GA4 ou analytics básico' }, description_ptBR: 'Cobertura de medição mais comum para entender tráfego e conversões principais.' },
      { order: 3, price_impact: 1200, time_impact: 7, complexity_impact: 12, weight: 1.12, labels: { 'pt-BR': 'GA4 + GTM + pixels de mídia + eventos de conversão' }, description_ptBR: 'Exige mapeamento mais rigoroso de eventos e consentimento.' },
    ],
  },
  {
    code: 'Q017',
    block: 'WEBSITES',
    type: 'SINGLE_CHOICE',
    order: 17,
    required: true,
    title: {
      'pt-BR': 'Qual meta de performance o site precisa atingir?',
      'en-US': 'What performance target should the site hit?',
      'es-ES': '¿Qué meta de performance debe alcanzar el sitio?',
      'it-IT': 'Quale target di performance deve raggiungere il sito?',
    },
    help_text_ptBR:
      'Metas agressivas de Core Web Vitals e PageSpeed alteram arquitetura, mídia, caching e estratégia de front-end.',
    options: [
      { order: 1, price_impact: 0, time_impact: 0, complexity_impact: 0, weight: 1.0, labels: { 'pt-BR': 'Sem meta específica além de boa usabilidade' }, description_ptBR: 'Escopo padrão, sem otimizações agressivas de benchmark.' },
      { order: 2, price_impact: 1200, time_impact: 7, complexity_impact: 10, weight: 1.1, labels: { 'pt-BR': 'Boa performance em mobile e desktop' }, description_ptBR: 'Inclui otimizações consistentes de assets, imagens e renderização.' },
      { order: 3, price_impact: 2500, time_impact: 14, complexity_impact: 22, weight: 1.2, labels: { 'pt-BR': 'Meta alta de Core Web Vitals / PageSpeed 90+' }, description_ptBR: 'Pressiona mais a arquitetura e o controle fino de recursos carregados.' },
    ],
  },
  {
    code: 'Q025',
    block: 'ECOMMERCE',
    type: 'SINGLE_CHOICE',
    order: 25,
    required: true,
    title: {
      'pt-BR': 'Como o cálculo de frete deve funcionar?',
      'en-US': 'How should shipping calculation work?',
      'es-ES': '¿Cómo debe funcionar el cálculo de envío?',
      'it-IT': 'Come deve funzionare il calcolo della spedizione?',
    },
    help_text_ptBR:
      'Frete impacta checkout, integração com transportadoras, regras por região e experiência de compra.',
    options: [
      { order: 1, price_impact: 0, time_impact: 0, complexity_impact: 0, weight: 1.0, labels: { 'pt-BR': 'Regra fixa ou retirada sem cálculo automático' }, description_ptBR: 'Melhor para operação simples ou MVP operacional.' },
      { order: 2, price_impact: 1200, time_impact: 7, complexity_impact: 15, weight: 1.1, labels: { 'pt-BR': 'Correios ou uma transportadora principal' }, description_ptBR: 'Integração padrão com cálculo automático de frete.' },
      { order: 3, price_impact: 2500, time_impact: 14, complexity_impact: 30, weight: 1.2, labels: { 'pt-BR': 'Múltiplas transportadoras e regras avançadas' }, description_ptBR: 'Inclui cenários com tabela, split, CEP, SLA e fallback logístico.' },
    ],
  },
  {
    code: 'Q026',
    block: 'ECOMMERCE',
    type: 'SINGLE_CHOICE',
    order: 26,
    required: true,
    title: {
      'pt-BR': 'Qual nível de fiscal e tributação a loja precisa suportar?',
      'en-US': 'What fiscal and tax complexity must the store support?',
      'es-ES': '¿Qué nivel fiscal y tributario debe soportar la tienda?',
      'it-IT': 'Quale livello fiscale e tributario deve supportare lo store?',
    },
    help_text_ptBR:
      'Fiscal muda integração com NF-e, cálculo de imposto, conciliação e validações operacionais.',
    options: [
      { order: 1, price_impact: 0, time_impact: 0, complexity_impact: 0, weight: 1.0, labels: { 'pt-BR': 'Sem emissão fiscal integrada nesta fase' }, description_ptBR: 'Viável quando operação fiscal ainda roda fora da plataforma.' },
      { order: 2, price_impact: 3000, time_impact: 21, complexity_impact: 35, weight: 1.25, labels: { 'pt-BR': 'NF-e ou regras fiscais básicas' }, description_ptBR: 'Cobertura intermediária para emissão e tributação mais previsível.' },
      { order: 3, price_impact: 7000, time_impact: 45, complexity_impact: 60, weight: 1.45, labels: { 'pt-BR': 'Fiscal robusto com NF-e, SPED ou regras complexas por operação' }, description_ptBR: 'Cenário com maior risco e esforço de homologação.' },
    ],
  },
  {
    code: 'Q027',
    block: 'ECOMMERCE',
    type: 'SINGLE_CHOICE',
    order: 27,
    required: true,
    title: {
      'pt-BR': 'A loja precisa integrar com marketplaces?',
      'en-US': 'Does the store need marketplace integrations?',
      'es-ES': '¿La tienda necesita integrarse con marketplaces?',
      'it-IT': 'Lo store deve integrarsi con marketplace?',
    },
    help_text_ptBR:
      'Marketplace adiciona sync de catálogo, estoque, pedidos, preços e tratamento de erros externos.',
    options: [
      { order: 1, price_impact: 0, time_impact: 0, complexity_impact: 0, weight: 1.0, labels: { 'pt-BR': 'Não, vender apenas na loja própria' }, description_ptBR: 'Canal único com menor acoplamento operacional.' },
      { order: 2, price_impact: 2000, time_impact: 14, complexity_impact: 25, weight: 1.15, labels: { 'pt-BR': 'Sim, um marketplace principal' }, description_ptBR: 'Integração típica para ampliar canal sem grande explosão de regras.' },
      { order: 3, price_impact: 4500, time_impact: 30, complexity_impact: 45, weight: 1.3, labels: { 'pt-BR': 'Sim, múltiplos marketplaces com sync contínuo' }, description_ptBR: 'Escopo mais alto por conta de sincronismo, fila e reconciliação.' },
    ],
  },
  {
    code: 'Q042',
    block: 'WEB_SYSTEM',
    type: 'SINGLE_CHOICE',
    order: 42,
    required: true,
    title: {
      'pt-BR': 'Qual volume de usuários simultâneos o sistema deve suportar?',
      'en-US': 'How many concurrent users should the system support?',
      'es-ES': '¿Cuántos usuarios simultáneos debe soportar el sistema?',
      'it-IT': 'Quanti utenti simultanei deve supportare il sistema?',
    },
    help_text_ptBR:
      'Concorrência muda arquitetura, cache, filas, observabilidade e margens de infraestrutura.',
    options: [
      { order: 1, price_impact: 0, time_impact: 0, complexity_impact: 0, weight: 1.0, labels: { 'pt-BR': 'Baixo volume, até 50 simultâneos' }, description_ptBR: 'Carga pequena com arquitetura mais direta.' },
      { order: 2, price_impact: 1500, time_impact: 10, complexity_impact: 15, weight: 1.1, labels: { 'pt-BR': 'Médio volume, entre 50 e 500 simultâneos' }, description_ptBR: 'Já pede atenção maior a queries, cache e escalabilidade.' },
      { order: 3, price_impact: 4000, time_impact: 21, complexity_impact: 35, weight: 1.25, labels: { 'pt-BR': 'Alto volume ou picos críticos acima disso' }, description_ptBR: 'Cenário que exige decisões mais robustas desde o início.' },
    ],
  },
  {
    code: 'Q043',
    block: 'WEB_SYSTEM',
    type: 'SINGLE_CHOICE',
    order: 43,
    required: true,
    title: {
      'pt-BR': 'Há exigências de compliance, privacidade ou segurança formal?',
      'en-US': 'Are there formal compliance, privacy, or security requirements?',
      'es-ES': '¿Hay requisitos formales de compliance, privacidad o seguridad?',
      'it-IT': 'Ci sono requisiti formali di compliance, privacy o sicurezza?',
    },
    help_text_ptBR:
      'LGPD, trilhas de acesso, políticas de retenção e hardening aumentam esforço de arquitetura, processos e evidências.',
    options: [
      { order: 1, price_impact: 0, time_impact: 0, complexity_impact: 0, weight: 1.0, labels: { 'pt-BR': 'Sem requisito formal além do básico' }, description_ptBR: 'Boas práticas padrão, sem pacote de compliance dedicado.' },
      { order: 2, price_impact: 2500, time_impact: 14, complexity_impact: 25, weight: 1.15, labels: { 'pt-BR': 'LGPD e controles básicos de segurança' }, description_ptBR: 'Inclui consentimento, trilhas mínimas e requisitos de proteção de dados.' },
      { order: 3, price_impact: 6000, time_impact: 30, complexity_impact: 50, weight: 1.35, labels: { 'pt-BR': 'Compliance mais rigoroso, como SOC2 ou exigências equivalentes' }, description_ptBR: 'Demanda desenho e documentação mais formais.' },
    ],
  },
  {
    code: 'Q044',
    block: 'WEB_SYSTEM',
    type: 'SINGLE_CHOICE',
    order: 44,
    required: true,
    title: {
      'pt-BR': 'Qual nível de backup e disaster recovery é esperado?',
      'en-US': 'What level of backup and disaster recovery is expected?',
      'es-ES': '¿Qué nivel de backup y disaster recovery se espera?',
      'it-IT': 'Quale livello di backup e disaster recovery è previsto?',
    },
    help_text_ptBR:
      'Rotina de backup, restauração testada e metas de RPO/RTO adicionam infraestrutura e operação.',
    options: [
      { order: 1, price_impact: 0, time_impact: 0, complexity_impact: 0, weight: 1.0, labels: { 'pt-BR': 'Backup padrão da infra, sem DR formal' }, description_ptBR: 'Cobertura básica, suficiente para produtos menos críticos.' },
      { order: 2, price_impact: 1200, time_impact: 7, complexity_impact: 12, weight: 1.08, labels: { 'pt-BR': 'Backups automatizados com teste de restore' }, description_ptBR: 'Já adiciona processo operacional mais confiável.' },
      { order: 3, price_impact: 3500, time_impact: 21, complexity_impact: 35, weight: 1.2, labels: { 'pt-BR': 'Plano de DR com RPO/RTO e redundância' }, description_ptBR: 'Escopo de resiliência mais robusto, típico de sistemas críticos.' },
    ],
  },
  {
    code: 'Q053',
    block: 'MOBILE_APP',
    type: 'SINGLE_CHOICE',
    order: 53,
    required: true,
    title: {
      'pt-BR': 'Vocês precisam de apoio para publicação nas lojas?',
      'en-US': 'Do you need help publishing to the app stores?',
      'es-ES': '¿Necesitan apoyo para publicar en las tiendas?',
      'it-IT': 'Avete bisogno di supporto per la pubblicazione sugli store?',
    },
    help_text_ptBR:
      'Publicação mexe com contas Apple/Google, políticas, assets, checklist e coordenação de release.',
    options: [
      { order: 1, price_impact: 0, time_impact: 0, complexity_impact: 0, weight: 1.0, labels: { 'pt-BR': 'Não, o time cliente publica' }, description_ptBR: 'Quando a operação de release já está madura do lado do cliente.' },
      { order: 2, price_impact: 800, time_impact: 5, complexity_impact: 8, weight: 1.05, labels: { 'pt-BR': 'Sim, apoio para uma loja principal' }, description_ptBR: 'Inclui acompanhamento e checklist para um ecossistema.' },
      { order: 3, price_impact: 1800, time_impact: 10, complexity_impact: 15, weight: 1.1, labels: { 'pt-BR': 'Sim, publicação completa em Apple e Google' }, description_ptBR: 'Mais esforço de conformidade, assets e troubleshooting de release.' },
    ],
  },
  {
    code: 'Q054',
    block: 'MOBILE_APP',
    type: 'SINGLE_CHOICE',
    order: 54,
    required: true,
    title: {
      'pt-BR': 'O app precisa de deep linking ou universal links?',
      'en-US': 'Does the app need deep linking or universal links?',
      'es-ES': '¿La app necesita deep linking o universal links?',
      'it-IT': "L'app ha bisogno di deep linking o universal links?",
    },
    help_text_ptBR:
      'Deep linking altera roteamento, campanhas, autenticação e integração entre app, web e mídia.',
    options: [
      { order: 1, price_impact: 0, time_impact: 0, complexity_impact: 0, weight: 1.0, labels: { 'pt-BR': 'Não precisa' }, description_ptBR: 'Fluxo isolado dentro do app, sem dependência de links externos inteligentes.' },
      { order: 2, price_impact: 1000, time_impact: 7, complexity_impact: 12, weight: 1.1, labels: { 'pt-BR': 'Sim, links simples para abrir telas específicas' }, description_ptBR: 'Cobre cenários de campanha e compartilhamento mais básicos.' },
      { order: 3, price_impact: 2200, time_impact: 14, complexity_impact: 25, weight: 1.2, labels: { 'pt-BR': 'Sim, com rotas autenticadas, referral ou integração web-app' }, description_ptBR: 'Cenário mais sensível, com mais validações de estado e roteamento.' },
    ],
  },
  {
    code: 'Q055',
    block: 'MOBILE_APP',
    type: 'SINGLE_CHOICE',
    order: 55,
    required: true,
    title: {
      'pt-BR': 'Qual nível de analytics e crash reporting o app precisa?',
      'en-US': 'What level of mobile analytics and crash reporting is needed?',
      'es-ES': '¿Qué nivel de analytics y crash reporting necesita la app?',
      'it-IT': "Quale livello di analytics e crash reporting serve all'app?",
    },
    help_text_ptBR:
      'Instrumentação mobile adiciona eventos, funis, observabilidade e governança de release.',
    options: [
      { order: 1, price_impact: 0, time_impact: 0, complexity_impact: 0, weight: 1.0, labels: { 'pt-BR': 'Sem analytics dedicado nesta fase' }, description_ptBR: 'Escopo mais enxuto para lançamento inicial.' },
      { order: 2, price_impact: 800, time_impact: 5, complexity_impact: 10, weight: 1.08, labels: { 'pt-BR': 'Firebase básico com eventos principais' }, description_ptBR: 'Cobertura suficiente para medir uso e identificar falhas centrais.' },
      { order: 3, price_impact: 1800, time_impact: 10, complexity_impact: 18, weight: 1.15, labels: { 'pt-BR': 'Analytics completo + crash reporting + funis/coortes' }, description_ptBR: 'Mais esforço de modelagem de eventos, dashboards e governança de release.' },
    ],
  },
  {
    code: 'Q060',
    block: 'AUTOMATION_AI',
    type: 'SINGLE_CHOICE',
    order: 60,
    required: true,
    title: {
      'pt-BR': 'Qual volume de dados a solução precisa processar?',
      'en-US': 'How much data will the solution need to process?',
      'es-ES': '¿Qué volumen de datos deberá procesar la solución?',
      'it-IT': 'Quanto volume di dati dovrà processare la soluzione?',
    },
    help_text_ptBR:
      'Volume de dados impacta ingestão, indexação, custo de processamento, filas e observabilidade.',
    options: [
      { order: 1, price_impact: 0, time_impact: 0, complexity_impact: 0, weight: 1.0, labels: { 'pt-BR': 'Baixo volume, processamento pontual' }, description_ptBR: 'Bom para MVPs ou automações com dataset pequeno.' },
      { order: 2, price_impact: 2000, time_impact: 10, complexity_impact: 18, weight: 1.12, labels: { 'pt-BR': 'Volume médio e recorrente' }, description_ptBR: 'Já exige mais estrutura de jobs, storage e observação de custo.' },
      { order: 3, price_impact: 5000, time_impact: 21, complexity_impact: 40, weight: 1.3, labels: { 'pt-BR': 'Alto volume ou documentos grandes em escala' }, description_ptBR: 'Cenário com maior pressão de arquitetura e governança.' },
    ],
  },
  {
    code: 'Q061',
    block: 'AUTOMATION_AI',
    type: 'SINGLE_CHOICE',
    order: 61,
    required: true,
    title: {
      'pt-BR': 'Com que frequência o processamento deve acontecer?',
      'en-US': 'How often should processing happen?',
      'es-ES': '¿Con qué frecuencia debe ocurrir el procesamiento?',
      'it-IT': 'Con quale frequenza deve avvenire il processamento?',
    },
    help_text_ptBR:
      'Batch, agendamento ou tempo real mudam filas, UX, SLA e custo de operação.',
    options: [
      { order: 1, price_impact: 0, time_impact: 0, complexity_impact: 0, weight: 1.0, labels: { 'pt-BR': 'Pontual ou batch eventual' }, description_ptBR: 'Melhor para rotinas que não dependem de resposta imediata.' },
      { order: 2, price_impact: 1500, time_impact: 7, complexity_impact: 15, weight: 1.1, labels: { 'pt-BR': 'Batch recorrente ou diário' }, description_ptBR: 'Pede orquestração mais estável e monitoramento de execução.' },
      { order: 3, price_impact: 3500, time_impact: 14, complexity_impact: 30, weight: 1.2, labels: { 'pt-BR': 'Near real-time ou tempo real' }, description_ptBR: 'Aumenta bastante exigência de arquitetura e observabilidade.' },
    ],
  },
  {
    code: 'Q062',
    block: 'AUTOMATION_AI',
    type: 'SINGLE_CHOICE',
    order: 62,
    required: true,
    title: {
      'pt-BR': 'Qual estratégia de modelo ou provedor de IA é esperada?',
      'en-US': 'What model or provider strategy is expected?',
      'es-ES': '¿Qué estrategia de modelo o proveedor de IA se espera?',
      'it-IT': 'Quale strategia di modello o provider IA è prevista?',
    },
    help_text_ptBR:
      'Escolha de provedor muda latency, custo, fallback, observabilidade e requisitos de infra.',
    options: [
      { order: 1, price_impact: 0, time_impact: 0, complexity_impact: 0, weight: 1.0, labels: { 'pt-BR': 'Sem LLM ou com automação determinística' }, description_ptBR: 'Foco maior em regras ou modelos não generativos.' },
      { order: 2, price_impact: 2000, time_impact: 7, complexity_impact: 20, weight: 1.15, labels: { 'pt-BR': 'LLM hospedado via API (OpenAI, Anthropic, etc.)' }, description_ptBR: 'Cobertura mais comum para IA generativa em produção inicial.' },
      { order: 3, price_impact: 5000, time_impact: 21, complexity_impact: 45, weight: 1.3, labels: { 'pt-BR': 'Multi-provider, fallback ou modelo self-hosted' }, description_ptBR: 'Eleva muito a complexidade de operação e infraestrutura.' },
    ],
  },
  {
    code: 'Q063',
    block: 'AUTOMATION_AI',
    type: 'SINGLE_CHOICE',
    order: 63,
    required: true,
    title: {
      'pt-BR': 'Qual governança de custo e volume de chamadas de IA vocês esperam?',
      'en-US': 'What AI call volume and cost governance do you expect?',
      'es-ES': '¿Qué gobernanza de costo y volumen de llamadas de IA esperan?',
      'it-IT': 'Quale governance di costo e volume di chiamate IA vi aspettate?',
    },
    help_text_ptBR:
      'Uso intensivo exige quota, tracing, cache, rate limiting e observabilidade financeira.',
    options: [
      { order: 1, price_impact: 0, time_impact: 0, complexity_impact: 0, weight: 1.0, labels: { 'pt-BR': 'Uso baixo e controlado manualmente' }, description_ptBR: 'Menor esforço de governança de custo.' },
      { order: 2, price_impact: 1000, time_impact: 5, complexity_impact: 10, weight: 1.08, labels: { 'pt-BR': 'Uso moderado com limites e alertas básicos' }, description_ptBR: 'Precisa de métricas e controles iniciais.' },
      { order: 3, price_impact: 2500, time_impact: 10, complexity_impact: 25, weight: 1.18, labels: { 'pt-BR': 'Uso alto com observabilidade e otimização contínua' }, description_ptBR: 'Adiciona engenharia operacional para custo e throughput.' },
    ],
  },
  {
    code: 'Q094',
    block: 'CONTEXT',
    type: 'SINGLE_CHOICE',
    order: 94,
    required: true,
    title: {
      'pt-BR': 'Qual nível de testes automatizados é esperado?',
      'en-US': 'What level of automated testing is expected?',
      'es-ES': '¿Qué nivel de pruebas automatizadas se espera?',
      'it-IT': 'Quale livello di test automatizzati è previsto?',
    },
    help_text_ptBR:
      'Testes aumentam qualidade do build, mas também adicionam tempo de engenharia e manutenção de suíte.',
    options: [
      { order: 1, price_impact: 0, time_impact: 0, complexity_impact: 0, weight: 1.0, labels: { 'pt-BR': 'Sem suíte automatizada além de validação manual' }, description_ptBR: 'Escopo mais rápido, com menor cobertura de regressão.' },
      { order: 2, price_impact: 2500, time_impact: 10, complexity_impact: 18, weight: 1.12, labels: { 'pt-BR': 'Testes para fluxos críticos e regras principais' }, description_ptBR: 'Equilíbrio comum entre segurança e custo de implementação.' },
      { order: 3, price_impact: 6000, time_impact: 30, complexity_impact: 45, weight: 1.3, labels: { 'pt-BR': 'Cobertura ampla com unit, integration e E2E' }, description_ptBR: 'Aumenta bastante o esforço, mas melhora maturidade e confiança do build.' },
    ],
  },
  {
    code: 'Q095',
    block: 'CONTEXT',
    type: 'SINGLE_CHOICE',
    order: 95,
    required: true,
    title: {
      'pt-BR': 'Qual nível de code review e CI/CD deve fazer parte da entrega?',
      'en-US': 'What level of code review and CI/CD should be included?',
      'es-ES': '¿Qué nivel de code review y CI/CD debe incluirse?',
      'it-IT': 'Quale livello di code review e CI/CD deve essere incluso?',
    },
    help_text_ptBR:
      'Pipeline, gates e revisão formal aumentam setup inicial, mas reduzem risco operacional do projeto.',
    options: [
      { order: 1, price_impact: 0, time_impact: 0, complexity_impact: 0, weight: 1.0, labels: { 'pt-BR': 'Deploy manual e revisão informal' }, description_ptBR: 'Adequado para MVPs internos ou cenários muito simples.' },
      { order: 2, price_impact: 1200, time_impact: 7, complexity_impact: 10, weight: 1.08, labels: { 'pt-BR': 'Code review e CI básico' }, description_ptBR: 'Inclui qualidade mínima de pipeline e revisão antes de merge.' },
      { order: 3, price_impact: 3000, time_impact: 14, complexity_impact: 25, weight: 1.18, labels: { 'pt-BR': 'Pipeline completo com gates, ambientes e automação de deploy' }, description_ptBR: 'Faz sentido quando há exigência maior de confiabilidade e repetibilidade.' },
    ],
  },
]

const CHAIN_WEBSITES: GraphChain = {
  codes: ['Q010', 'Q011', 'Q012', 'Q013', 'Q014', 'Q015', 'Q016', 'Q017'],
  exitTo: 'Q090',
}

const CHAIN_ECOMMERCE: GraphChain = {
  codes: ['Q020', 'Q021', 'Q022', 'Q023', 'Q024', 'Q025', 'Q026', 'Q027'],
  exitTo: 'Q090',
}

const CHAIN_WEB_SYSTEM: GraphChain = {
  codes: ['Q030', 'Q031', 'Q032', 'Q033', 'Q034', 'Q035', 'Q036', 'Q037', 'Q038', 'Q039', 'Q040', 'Q041', 'Q042', 'Q043', 'Q044'],
  exitTo: 'Q090',
}

const CHAIN_MOBILE: GraphChain = {
  codes: ['Q045', 'Q046', 'Q047', 'Q048', 'Q049', 'Q053', 'Q054', 'Q055'],
  exitTo: 'Q090',
}

const CHAIN_AI: GraphChain = {
  codes: ['Q006', 'Q050', 'Q051', 'Q052', 'Q060', 'Q061', 'Q062', 'Q063'],
  exitTo: 'Q090',
}

const CHAIN_MARKETPLACE: GraphChain = {
  codes: ['Q070', 'Q071', 'Q072', 'Q073', 'Q074'],
  exitTo: 'Q090',
}

const CHAIN_CRYPTO: GraphChain = {
  codes: ['Q075', 'Q076', 'Q077', 'Q078', 'Q079'],
  exitTo: 'Q090',
}

const CHAIN_BROWSER_EXT: GraphChain = {
  codes: ['Q080', 'Q081', 'Q082', 'Q083'],
  exitTo: 'Q090',
}

const CHAIN_CONTEXT: GraphChain = {
  codes: ['Q090', 'Q091', 'Q092', 'Q093', 'Q094', 'Q095'],
  exitTo: 'Q100',
}

export const QUESTION_HELP_TEXT_V2_PATCH = Object.fromEntries(
  [...EXISTING_QUESTION_EDITS, ...NEW_QUESTIONS]
    .filter((question) => question.help_text_ptBR)
    .map((question) => [question.code, question.help_text_ptBR as string])
) as Record<string, string>

export const OPTION_DESCRIPTIONS_V2_PATCH = Object.assign(
  {},
  ...[...EXISTING_QUESTION_EDITS, ...NEW_QUESTIONS].map((question) =>
    buildOptionDescriptionPatch(question.code, question.options ?? [])
  )
) as Record<string, string>

async function findQuestion(prisma: PrismaClient, code: QuestionCode) {
  return prisma.question.findUnique({
    where: { code },
    include: {
      options: { orderBy: { order: 'asc' } },
      translations: true,
    },
  })
}

async function ensureQuestionSeed(
  prisma: PrismaClient,
  summary: Summary,
  question: QuestionSeed
) {
  const existing = await prisma.question.findUnique({ where: { code: question.code } })
  const data = {
    block: question.block,
    type: question.type,
    order: question.order,
    required: question.required,
  }

  let questionId: string
  if (!existing) {
    const created = await prisma.question.create({
      data: {
        code: question.code,
        ...data,
      },
    })
    summary.newQuestionsCreated += 1
    questionId = created.id
  } else {
    questionId = existing.id
    if (
      existing.block !== data.block ||
      existing.type !== data.type ||
      existing.order !== data.order ||
      existing.required !== data.required
    ) {
      await prisma.question.update({
        where: { id: existing.id },
        data,
      })
      if (NEW_QUESTIONS.some((item) => item.code === question.code)) {
        summary.newQuestionsUpdated += 1
      } else {
        summary.existingUpdated += 1
      }
    }
  }

  return questionId
}

async function ensureQuestionTranslations(
  prisma: PrismaClient,
  summary: Summary,
  questionId: string,
  question: QuestionSeed
) {
  const titleByLocale = withFallback(question.title)
  const descriptionByLocale = question.description
    ? withFallback(question.description)
    : null

  for (const locale of ALL_LOCALES) {
    const existing = await prisma.questionTranslation.findUnique({
      where: { question_id_locale: { question_id: questionId, locale } },
    })

    const data = {
      title: titleByLocale[locale],
      description: descriptionByLocale?.[locale] ?? null,
      help_text: locale === DEFAULT_LOCALE ? question.help_text_ptBR ?? null : existing?.help_text ?? null,
    }

    if (!existing) {
      await prisma.questionTranslation.create({
        data: {
          question_id: questionId,
          locale,
          ...data,
        },
      })
      summary.newTranslationsCreated += 1
      continue
    }

    if (
      existing.title !== data.title ||
      existing.description !== data.description ||
      (locale === DEFAULT_LOCALE && existing.help_text !== data.help_text)
    ) {
      await prisma.questionTranslation.update({
        where: { id: existing.id },
        data,
      })
      if (NEW_QUESTIONS.some((item) => item.code === question.code)) {
        summary.newTranslationsUpdated += 1
      } else {
        summary.existingTranslationsUpdated += 1
      }
    }
  }
}

async function ensureOptionSeed(
  prisma: PrismaClient,
  summary: Summary,
  questionId: string,
  questionCode: QuestionCode,
  option: OptionSeed
) {
  const existing = await prisma.option.findFirst({
    where: { question_id: questionId, order: option.order },
  })

  const data = {
    price_impact: option.price_impact,
    time_impact: option.time_impact,
    complexity_impact: option.complexity_impact,
    weight: option.weight,
  }

  let optionId: string
  if (!existing) {
    const created = await prisma.option.create({
      data: {
        question_id: questionId,
        order: option.order,
        ...data,
      },
    })
    summary.newOptionsCreated += 1
    optionId = created.id
  } else {
    optionId = existing.id
    if (
      existing.price_impact !== data.price_impact ||
      existing.time_impact !== data.time_impact ||
      existing.complexity_impact !== data.complexity_impact ||
      existing.weight !== data.weight
    ) {
      await prisma.option.update({
        where: { id: existing.id },
        data,
      })
      if (NEW_QUESTIONS.some((item) => item.code === questionCode)) {
        summary.newOptionsUpdated += 1
      } else {
        summary.existingOptionsUpdated += 1
      }
    }
  }

  return optionId
}

async function ensureOptionTranslations(
  prisma: PrismaClient,
  summary: Summary,
  questionCode: QuestionCode,
  optionId: string,
  option: OptionSeed
) {
  const labels = withFallback(option.labels)

  for (const locale of ALL_LOCALES) {
    const existing = await prisma.optionTranslation.findUnique({
      where: { option_id_locale: { option_id: optionId, locale } },
    })

    const data = {
      label: labels[locale],
      description: locale === DEFAULT_LOCALE ? option.description_ptBR ?? null : existing?.description ?? null,
    }

    if (!existing) {
      await prisma.optionTranslation.create({
        data: {
          option_id: optionId,
          locale,
          ...data,
        },
      })
      summary.newTranslationsCreated += 1
      continue
    }

    if (
      existing.label !== data.label ||
      (locale === DEFAULT_LOCALE && existing.description !== data.description)
    ) {
      await prisma.optionTranslation.update({
        where: { id: existing.id },
        data,
      })
      if (NEW_QUESTIONS.some((item) => item.code === questionCode)) {
        summary.newTranslationsUpdated += 1
      } else {
        summary.existingTranslationsUpdated += 1
      }
    }
  }
}

async function upsertQuestionPack(
  prisma: PrismaClient,
  summary: Summary,
  question: QuestionSeed
) {
  const questionId = await ensureQuestionSeed(prisma, summary, question)
  await ensureQuestionTranslations(prisma, summary, questionId, question)

  for (const option of question.options ?? []) {
    const optionId = await ensureOptionSeed(prisma, summary, questionId, question.code, option)
    await ensureOptionTranslations(prisma, summary, question.code, optionId, option)
  }
}

export async function syncRefactorQuestionDefinitions(prisma: PrismaClient, summary?: Summary) {
  const localSummary = summary ?? createEmptySummary()
  for (const question of EXISTING_QUESTION_EDITS) {
    await upsertQuestionPack(prisma, localSummary, question)
  }
  for (const question of NEW_QUESTIONS) {
    await upsertQuestionPack(prisma, localSummary, question)
  }
  return localSummary
}

export async function syncRefactorTranslations(prisma: PrismaClient, summary?: Summary) {
  return syncRefactorQuestionDefinitions(prisma, summary)
}

async function setQuestionSkipLogic(
  prisma: PrismaClient,
  code: QuestionCode,
  skipLogic: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput,
  summary: Summary
) {
  const question = await prisma.question.findUnique({ where: { code } })
  if (!question) throw new Error(`Pergunta ${code} não encontrada para ajustar skip_logic`)

  if (!jsonEquals(question.skip_logic, skipLogic)) {
    await prisma.question.update({
      where: { id: question.id },
      data: { skip_logic: skipLogic },
    })
  }
}

async function setAllOptionsNextQuestion(
  prisma: PrismaClient,
  code: QuestionCode,
  nextCode: QuestionCode | null,
  summary: Summary
) {
  const question = await prisma.question.findUnique({
    where: { code },
    include: { options: true },
  })
  if (!question) throw new Error(`Pergunta ${code} não encontrada para ajustar next_question_id`)

  let nextQuestionId: string | null = null
  if (nextCode) {
    const nextQuestion = await prisma.question.findUnique({ where: { code: nextCode } })
    if (!nextQuestion) throw new Error(`Pergunta destino ${nextCode} não encontrada`)
    nextQuestionId = nextQuestion.id
  }

  for (const option of question.options) {
    if (option.next_question_id !== nextQuestionId) {
      await prisma.option.update({
        where: { id: option.id },
        data: { next_question_id: nextQuestionId },
      })
      summary.graphLinksUpdated += 1
    }
  }
}

async function applyChain(prisma: PrismaClient, chain: GraphChain, summary: Summary) {
  for (let index = 0; index < chain.codes.length; index += 1) {
    const current = chain.codes[index]
    const next = chain.codes[index + 1] ?? chain.exitTo
    await setAllOptionsNextQuestion(prisma, current, next, summary)
  }
}

async function ensureDontKnowOption(
  prisma: PrismaClient,
  code: QuestionCode,
  summary: Summary
) {
  const question = await prisma.question.findUnique({
    where: { code },
    include: {
      options: {
        orderBy: { order: 'asc' },
        include: {
          translations: true,
        },
      },
    },
  })
  if (!question || question.type === 'TEXT_INPUT') return

  const existing = question.options.find((option) =>
    option.translations.some(
      (translation) =>
        translation.locale === DEFAULT_LOCALE &&
        translation.label === DONT_KNOW_LABELS[DEFAULT_LOCALE]
    )
  )

  if (existing) return

  const nextOrder = Math.max(...question.options.map((option) => option.order), 0) + 1
  const created = await prisma.option.create({
    data: {
      question_id: question.id,
      order: nextOrder,
      price_impact: 0,
      time_impact: 0,
      complexity_impact: 0,
      weight: 1.0,
    },
  })

  await prisma.optionTranslation.createMany({
    data: ALL_LOCALES.map((locale) => ({
      option_id: created.id,
      locale,
      label: DONT_KNOW_LABELS[locale],
      description: null,
    })),
    skipDuplicates: true,
  })

  summary.dontKnowOptionsCreated += 1
}

export async function zeroImpactForLeadQualifiers(prisma: PrismaClient, summary?: Summary) {
  const localSummary = summary ?? createEmptySummary()
  for (const code of LEAD_QUALIFIER_CODES) {
    const question = await prisma.question.findUnique({ where: { code }, include: { options: true } })
    if (!question) continue

    for (const option of question.options) {
      if (
        option.price_impact !== 0 ||
        option.time_impact !== 0 ||
        option.complexity_impact !== 0
      ) {
        await prisma.option.update({
          where: { id: option.id },
          data: {
            price_impact: 0,
            time_impact: 0,
            complexity_impact: 0,
          },
        })
        localSummary.zeroedLeadOptions += 1
      }
    }
  }

  return localSummary
}

async function hasDeletedAtColumn(prisma: PrismaClient) {
  const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'questions'
        AND column_name = 'deleted_at'
    ) AS "exists"
  `

  return Boolean(result[0]?.exists)
}

export async function removeQuestions(prisma: PrismaClient, summary?: Summary) {
  const localSummary = summary ?? createEmptySummary()

  if (REMOVED_QUESTION_CODES.length === 0) {
    console.log('[refactor-v2][remoções] nenhuma pergunta marcada para remoção')
    return localSummary
  }

  const deletedAtAvailable = await hasDeletedAtColumn(prisma)
  const nextFallback = 'Q100'

  for (const code of REMOVED_QUESTION_CODES) {
    const question = await prisma.question.findUnique({ where: { code } })
    if (!question) continue

    if (deletedAtAvailable) {
      await prisma.$executeRawUnsafe(
        `UPDATE questions SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`,
        question.id
      )
      localSummary.removedQuestionsSoftDeleted += 1
    } else {
      console.log(`[refactor-v2][remoções] schema sem deleted_at; mantendo ${code} e apenas desconectando do grafo`)
      localSummary.removedQuestionsLoggedOnly += 1
    }

    const rerouteTarget = await prisma.question.findUnique({ where: { code: nextFallback } })
    if (rerouteTarget) {
      const result = await prisma.session.updateMany({
        where: { current_question_id: question.id },
        data: { current_question_id: rerouteTarget.id },
      })
      localSummary.reroutedSessions += result.count
    }
  }

  return localSummary
}

export async function addNewQuestions(prisma: PrismaClient, summary?: Summary) {
  const localSummary = summary ?? createEmptySummary()

  for (const question of NEW_QUESTIONS) {
    await upsertQuestionPack(prisma, localSummary, question)
    await ensureDontKnowOption(prisma, question.code, localSummary)
  }

  return localSummary
}

export async function updateExistingQuestions(prisma: PrismaClient, summary?: Summary) {
  const localSummary = summary ?? createEmptySummary()

  for (const question of EXISTING_QUESTION_EDITS) {
    await upsertQuestionPack(prisma, localSummary, question)
  }

  return localSummary
}

export async function adjustGraph(prisma: PrismaClient, summary?: Summary) {
  const localSummary = summary ?? createEmptySummary()

  await setAllOptionsNextQuestion(prisma, 'Q001', 'Q005', localSummary)
  await setQuestionSkipLogic(
    prisma,
    'Q005',
    {
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
    },
    localSummary
  )

  await applyChain(prisma, CHAIN_WEBSITES, localSummary)
  await applyChain(prisma, CHAIN_ECOMMERCE, localSummary)
  await applyChain(prisma, CHAIN_WEB_SYSTEM, localSummary)
  await applyChain(prisma, CHAIN_MOBILE, localSummary)
  await applyChain(prisma, CHAIN_AI, localSummary)
  await applyChain(prisma, CHAIN_MARKETPLACE, localSummary)
  await applyChain(prisma, CHAIN_CRYPTO, localSummary)
  await applyChain(prisma, CHAIN_BROWSER_EXT, localSummary)
  await applyChain(prisma, CHAIN_CONTEXT, localSummary)

  for (const code of ['Q017', 'Q027', 'Q044', 'Q055', 'Q063', 'Q074', 'Q079', 'Q083', 'Q095'] as const) {
    await setQuestionSkipLogic(prisma, code, { end_of_block: true }, localSummary)
  }

  await setQuestionSkipLogic(prisma, 'Q100', { next_question: 'Q101' }, localSummary)
  await setQuestionSkipLogic(prisma, 'Q101', { next_question: 'Q102' }, localSummary)
  await setQuestionSkipLogic(prisma, 'Q102', { next_question: 'Q103' }, localSummary)
  await setQuestionSkipLogic(prisma, 'Q103', { next_question: 'Q104' }, localSummary)
  await setAllOptionsNextQuestion(prisma, 'Q104', 'Q105', localSummary)
  await setQuestionSkipLogic(prisma, 'Q105', { next_question: null }, localSummary)

  for (const code of NEW_TECHNICAL_CODES_WITH_DONT_KNOW) {
    await ensureDontKnowOption(prisma, code, localSummary)
  }

  return localSummary
}

export async function applyQuestionsRefactorV2(prisma: PrismaClient) {
  const summary = createEmptySummary()

  console.log('[refactor-v2][início] aplicando refactor do catálogo de perguntas')

  await prisma.$transaction(async (tx) => {
    console.log('[refactor-v2][fase] updateExistingQuestions')
    await updateExistingQuestions(tx as PrismaClient, summary)

    console.log('[refactor-v2][fase] zeroImpactForLeadQualifiers')
    await zeroImpactForLeadQualifiers(tx as PrismaClient, summary)

    console.log('[refactor-v2][fase] removeQuestions')
    await removeQuestions(tx as PrismaClient, summary)

    console.log('[refactor-v2][fase] addNewQuestions')
    await addNewQuestions(tx as PrismaClient, summary)

    console.log('[refactor-v2][fase] adjustGraph')
    await adjustGraph(tx as PrismaClient, summary)
  })

  console.log('[refactor-v2][fim] resumo')
  console.log(JSON.stringify(summary, null, 2))

  return summary
}

function createEmptySummary(): Summary {
  return {
    existingUpdated: 0,
    existingTranslationsUpdated: 0,
    existingOptionsUpdated: 0,
    zeroedLeadOptions: 0,
    removedQuestionsSoftDeleted: 0,
    removedQuestionsLoggedOnly: 0,
    reroutedSessions: 0,
    newQuestionsCreated: 0,
    newQuestionsUpdated: 0,
    newOptionsCreated: 0,
    newOptionsUpdated: 0,
    newTranslationsCreated: 0,
    newTranslationsUpdated: 0,
    dontKnowOptionsCreated: 0,
    graphLinksUpdated: 0,
  }
}

async function main() {
  const prisma = createSeedPrismaClient()

  try {
    await applyQuestionsRefactorV2(prisma)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('[refactor-v2][erro]', error)
    process.exit(1)
  })
}
