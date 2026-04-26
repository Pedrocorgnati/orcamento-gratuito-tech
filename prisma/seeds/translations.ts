import type { PrismaClient } from '@prisma/client'
import { applyCopywritingReviewV1 } from './copywriting-review-v1'
import { syncRefactorTranslations } from './refactor-questions-v2'

type LocaleKey = 'pt_BR' | 'en_US' | 'es_ES' | 'it_IT'

interface QuestionTranslationData {
  title: Record<LocaleKey, string>
  description?: Record<LocaleKey, string>
}

interface OptionTranslationData {
  label: Record<LocaleKey, string>
}

const LOCALES: LocaleKey[] = ['pt_BR', 'en_US', 'es_ES', 'it_IT']

async function upsertQuestionTranslation(
  prisma: PrismaClient,
  questionCode: string,
  data: QuestionTranslationData
) {
  const question = await prisma.question.findUnique({ where: { code: questionCode } })
  if (!question) throw new Error(`Questão ${questionCode} não encontrada`)

  for (const locale of LOCALES) {
    await prisma.questionTranslation.upsert({
      where: { question_id_locale: { question_id: question.id, locale } },
      update: {
        title: data.title[locale],
        description: data.description?.[locale] ?? null,
      },
      create: {
        question_id: question.id,
        locale,
        title: data.title[locale],
        description: data.description?.[locale] ?? null,
      },
    })
  }
}

async function upsertOptionTranslation(
  prisma: PrismaClient,
  questionCode: string,
  optionOrder: number,
  data: OptionTranslationData
) {
  const question = await prisma.question.findUnique({ where: { code: questionCode } })
  if (!question) throw new Error(`Questão ${questionCode} não encontrada`)

  const option = await prisma.option.findFirst({
    where: { question_id: question.id, order: optionOrder },
  })
  if (!option) throw new Error(`Opção ${questionCode}[${optionOrder}] não encontrada`)

  for (const locale of LOCALES) {
    await prisma.optionTranslation.upsert({
      where: { option_id_locale: { option_id: option.id, locale } },
      update: { label: data.label[locale] },
      create: { option_id: option.id, locale, label: data.label[locale] },
    })
  }
}

export async function seedTranslations(prisma: PrismaClient) {
  // ──────────────────────────────────────────────────────────────
  // BLOCO 1: PROJECT_TYPE (Q001, Q005)
  // ──────────────────────────────────────────────────────────────

  await upsertQuestionTranslation(prisma, 'Q001', {
    title: {
      pt_BR: 'Qual o tipo do projeto?',
      en_US: 'What type of project is this?',
      es_ES: '¿Cuál es el tipo de proyecto?',
      it_IT: 'Qual è il tipo di progetto?',
    },
    description: {
      pt_BR: 'Selecione um ou mais tipos de projeto. Vamos combinar os blocos de escopo e somar a estimativa final.',
      en_US: 'Select one or more project types. We will combine the scope blocks and sum the final estimate.',
      es_ES: 'Selecciona uno o más tipos de proyecto. Combinaremos los bloques de alcance y sumaremos la estimación final.',
      it_IT: 'Seleziona uno o più tipi di progetto. Combineremo i blocchi di scope e sommeremo la stima finale.',
    },
  })

  await upsertOptionTranslation(prisma, 'Q001', 1, { label: { pt_BR: 'Website Institucional', en_US: 'Institutional Website', es_ES: 'Sitio Web Institucional', it_IT: 'Sito Web Istituzionale' } })
  await upsertOptionTranslation(prisma, 'Q001', 2, { label: { pt_BR: 'Landing Page', en_US: 'Landing Page', es_ES: 'Página de Aterrizaje', it_IT: 'Landing Page' } })
  await upsertOptionTranslation(prisma, 'Q001', 3, { label: { pt_BR: 'E-commerce / Loja Virtual', en_US: 'E-commerce / Online Store', es_ES: 'Tienda en Línea', it_IT: 'E-commerce / Negozio Online' } })
  await upsertOptionTranslation(prisma, 'Q001', 4, { label: { pt_BR: 'Sistema Web / Aplicação Web', en_US: 'Web System / Web Application', es_ES: 'Sistema Web / Aplicación Web', it_IT: 'Sistema Web / Applicazione Web' } })
  await upsertOptionTranslation(prisma, 'Q001', 5, { label: { pt_BR: 'App Mobile', en_US: 'Mobile App', es_ES: 'Aplicación Móvil', it_IT: 'App Mobile' } })
  await upsertOptionTranslation(prisma, 'Q001', 6, { label: { pt_BR: 'Automação e IA', en_US: 'Automation and AI', es_ES: 'Automatización e IA', it_IT: 'Automazione e IA' } })
  await upsertOptionTranslation(prisma, 'Q001', 7, { label: { pt_BR: 'Marketplace', en_US: 'Marketplace', es_ES: 'Marketplace', it_IT: 'Marketplace' } })
  await upsertOptionTranslation(prisma, 'Q001', 8, { label: { pt_BR: 'Plataforma Crypto / Web3', en_US: 'Crypto / Web3 Platform', es_ES: 'Plataforma Crypto / Web3', it_IT: 'Piattaforma Crypto / Web3' } })
  await upsertOptionTranslation(prisma, 'Q001', 9, { label: { pt_BR: 'Extensão de Browser', en_US: 'Browser Extension', es_ES: 'Extensión de Navegador', it_IT: 'Estensione Browser' } })

  await upsertQuestionTranslation(prisma, 'Q005', {
    title: {
      pt_BR: 'Qual é o perfil do cliente ou contratante?',
      en_US: 'How would you describe your company size?',
      es_ES: '¿Cómo describirías el tamaño de tu empresa?',
      it_IT: 'Come descriveresti le dimensioni della tua azienda?',
    },
  })
  await upsertOptionTranslation(prisma, 'Q005', 1, { label: { pt_BR: 'Empresa consolidada (média/grande)', en_US: 'Established company (mid/large)', es_ES: 'Empresa consolidada (mediana/grande)', it_IT: 'Azienda consolidata (media/grande)' } })
  await upsertOptionTranslation(prisma, 'Q005', 2, { label: { pt_BR: 'Startup em fase inicial', en_US: 'Startup / early stage', es_ES: 'Startup en fase inicial', it_IT: 'Startup in fase iniziale' } })
  await upsertOptionTranslation(prisma, 'Q005', 3, { label: { pt_BR: 'Freelancer / Pessoa física', en_US: 'Freelancer / Individual', es_ES: 'Freelancer / Persona física', it_IT: 'Freelancer / Persona fisica' } })
  await upsertOptionTranslation(prisma, 'Q005', 4, { label: { pt_BR: 'Corporação / Enterprise', en_US: 'Large enterprise', es_ES: 'Corporación / Enterprise', it_IT: 'Corporazione / Enterprise' } })

  // ──────────────────────────────────────────────────────────────
  // BLOCO 2: WEBSITES (Q010-Q014)
  // ──────────────────────────────────────────────────────────────

  await upsertQuestionTranslation(prisma, 'Q010', {
    title: { pt_BR: 'Quantas páginas o site precisará ter?', en_US: 'How many pages will the website need?', es_ES: '¿Cuántas páginas necesitará el sitio web?', it_IT: 'Di quante pagine avrà bisogno il sito web?' },
  })
  await upsertOptionTranslation(prisma, 'Q010', 1, { label: { pt_BR: '1 a 5 páginas', en_US: '1 to 5 pages', es_ES: '1 a 5 páginas', it_IT: '1 a 5 pagine' } })
  await upsertOptionTranslation(prisma, 'Q010', 2, { label: { pt_BR: '6 a 15 páginas', en_US: '6 to 15 pages', es_ES: '6 a 15 páginas', it_IT: '6 a 15 pagine' } })
  await upsertOptionTranslation(prisma, 'Q010', 3, { label: { pt_BR: 'Mais de 15 páginas', en_US: 'More than 15 pages', es_ES: 'Más de 15 páginas', it_IT: 'Più di 15 pagine' } })

  await upsertQuestionTranslation(prisma, 'Q011', {
    title: { pt_BR: 'O site precisa de blog ou área de conteúdo?', en_US: 'Does the website need a blog or content area?', es_ES: '¿El sitio necesita un blog o área de contenido?', it_IT: 'Il sito ha bisogno di un blog o area contenuti?' },
  })
  await upsertOptionTranslation(prisma, 'Q011', 1, { label: { pt_BR: 'Não', en_US: 'No', es_ES: 'No', it_IT: 'No' } })
  await upsertOptionTranslation(prisma, 'Q011', 2, { label: { pt_BR: 'Sim, blog simples', en_US: 'Yes, simple blog', es_ES: 'Sí, blog simple', it_IT: 'Sì, blog semplice' } })
  await upsertOptionTranslation(prisma, 'Q011', 3, { label: { pt_BR: 'Sim, com CMS completo', en_US: 'Yes, with full CMS', es_ES: 'Sí, con CMS completo', it_IT: 'Sì, con CMS completo' } })

  await upsertQuestionTranslation(prisma, 'Q012', {
    title: { pt_BR: 'Precisa de formulários de contato ou captura de leads?', en_US: 'Do you need contact forms or lead capture?', es_ES: '¿Necesitas formularios de contacto o captura de leads?', it_IT: 'Hai bisogno di moduli di contatto o acquisizione lead?' },
  })
  await upsertOptionTranslation(prisma, 'Q012', 1, { label: { pt_BR: 'Não', en_US: 'No', es_ES: 'No', it_IT: 'No' } })
  await upsertOptionTranslation(prisma, 'Q012', 2, { label: { pt_BR: 'Formulário simples', en_US: 'Simple form', es_ES: 'Formulario simple', it_IT: 'Modulo semplice' } })
  await upsertOptionTranslation(prisma, 'Q012', 3, { label: { pt_BR: 'Múltiplos forms + integração CRM', en_US: 'Multiple forms + CRM integration', es_ES: 'Múltiples formularios + integración CRM', it_IT: 'Moduli multipli + integrazione CRM' } })

  await upsertQuestionTranslation(prisma, 'Q013', {
    title: { pt_BR: 'O site precisa ser multilíngue?', en_US: 'Does the website need to be multilingual?', es_ES: '¿El sitio necesita ser multilingüe?', it_IT: 'Il sito deve essere multilingue?' },
  })
  await upsertOptionTranslation(prisma, 'Q013', 1, { label: { pt_BR: 'Não', en_US: 'No', es_ES: 'No', it_IT: 'No' } })
  await upsertOptionTranslation(prisma, 'Q013', 2, { label: { pt_BR: '2 idiomas', en_US: '2 languages', es_ES: '2 idiomas', it_IT: '2 lingue' } })
  await upsertOptionTranslation(prisma, 'Q013', 3, { label: { pt_BR: '3 ou mais idiomas', en_US: '3 or more languages', es_ES: '3 o más idiomas', it_IT: '3 o più lingue' } })

  await upsertQuestionTranslation(prisma, 'Q014', {
    title: { pt_BR: 'Precisa de animações ou efeitos visuais especiais?', en_US: 'Do you need animations or special visual effects?', es_ES: '¿Necesitas animaciones o efectos visuales especiales?', it_IT: 'Hai bisogno di animazioni o effetti visivi speciali?' },
  })
  await upsertOptionTranslation(prisma, 'Q014', 1, { label: { pt_BR: 'Design estático', en_US: 'Static design', es_ES: 'Diseño estático', it_IT: 'Design statico' } })
  await upsertOptionTranslation(prisma, 'Q014', 2, { label: { pt_BR: 'Animações CSS básicas', en_US: 'Basic CSS animations', es_ES: 'Animaciones CSS básicas', it_IT: 'Animazioni CSS di base' } })
  await upsertOptionTranslation(prisma, 'Q014', 3, { label: { pt_BR: 'Interações visuais avançadas / 3D', en_US: 'Complex animations / WebGL', es_ES: 'Animaciones complejas / WebGL', it_IT: 'Animazioni complesse / WebGL' } })

  // ──────────────────────────────────────────────────────────────
  // BLOCO 3: ECOMMERCE (Q020-Q024)
  // ──────────────────────────────────────────────────────────────

  const ecommerceTitles: Record<string, Record<LocaleKey, string>> = {
    Q020: { pt_BR: 'Quantos produtos aproximadamente?', en_US: 'Approximately how many products?', es_ES: '¿Cuántos productos aproximadamente?', it_IT: 'Quanti prodotti circa?' },
    Q021: { pt_BR: 'Qual integração de pagamento é necessária?', en_US: 'What payment integration is needed?', es_ES: '¿Qué integración de pago se necesita?', it_IT: 'Quale integrazione di pagamento è necessaria?' },
    Q022: { pt_BR: 'Precisa de integração com ERP ou gestão de estoque?', en_US: 'Do you need ERP or inventory management integration?', es_ES: '¿Necesitas integración con ERP o gestión de inventario?', it_IT: 'Hai bisogno di integrazione con ERP o gestione magazzino?' },
    Q023: { pt_BR: 'Precisa de área do cliente com histórico de pedidos?', en_US: 'Do you need a customer area with order history?', es_ES: '¿Necesitas área de cliente con historial de pedidos?', it_IT: 'Hai bisogno di area cliente con storico ordini?' },
    Q024: { pt_BR: 'Precisa de cupons de desconto ou programa de fidelidade?', en_US: 'Do you need discount coupons or a loyalty program?', es_ES: '¿Necesitas cupones de descuento o programa de fidelización?', it_IT: 'Hai bisogno di coupon sconto o programma fedeltà?' },
  }
  for (const [code, title] of Object.entries(ecommerceTitles)) {
    await upsertQuestionTranslation(prisma, code, { title })
  }

  // Q020: Quantos produtos?
  await upsertOptionTranslation(prisma, 'Q020', 1, { label: { pt_BR: 'Até 50 produtos', en_US: 'Up to 50 products', es_ES: 'Hasta 50 productos', it_IT: 'Fino a 50 prodotti' } })
  await upsertOptionTranslation(prisma, 'Q020', 2, { label: { pt_BR: '50 a 500 produtos', en_US: '50 to 500 products', es_ES: '50 a 500 productos', it_IT: 'Da 50 a 500 prodotti' } })
  await upsertOptionTranslation(prisma, 'Q020', 3, { label: { pt_BR: 'Mais de 500 produtos', en_US: 'More than 500 products', es_ES: 'Más de 500 productos', it_IT: 'Più di 500 prodotti' } })

  // Q021: Integração de pagamento?
  await upsertOptionTranslation(prisma, 'Q021', 1, { label: { pt_BR: 'Apenas catálogo (sem venda online)', en_US: 'No payment integration', es_ES: 'Sin integración de pago', it_IT: 'Nessuna integrazione di pagamento' } })
  await upsertOptionTranslation(prisma, 'Q021', 2, { label: { pt_BR: 'Gateway único (Stripe, PagSeguro)', en_US: 'Single gateway (Stripe, PayPal)', es_ES: 'Gateway único (Stripe, MercadoPago)', it_IT: 'Gateway singolo (Stripe, PayPal)' } })
  await upsertOptionTranslation(prisma, 'Q021', 3, { label: { pt_BR: 'Múltiplos gateways + parcelamento', en_US: 'Multiple gateways + installments', es_ES: 'Múltiples gateways + cuotas', it_IT: 'Gateway multipli + rate' } })

  // Q022: ERP / gestão de estoque?
  await upsertOptionTranslation(prisma, 'Q022', 1, { label: { pt_BR: 'Sem integração', en_US: 'No integration', es_ES: 'Sin integración', it_IT: 'Nessuna integrazione' } })
  await upsertOptionTranslation(prisma, 'Q022', 2, { label: { pt_BR: 'Integração básica (planilha / ERP simples)', en_US: 'Basic integration (spreadsheet / simple ERP)', es_ES: 'Integración básica (hoja de cálculo / ERP simple)', it_IT: 'Integrazione base (foglio di calcolo / ERP semplice)' } })
  await upsertOptionTranslation(prisma, 'Q022', 3, { label: { pt_BR: 'Integração completa (SAP, Oracle, etc.)', en_US: 'Full integration (SAP, Oracle, etc.)', es_ES: 'Integración completa (SAP, Oracle, etc.)', it_IT: 'Integrazione completa (SAP, Oracle, ecc.)' } })

  // Q023: Área do cliente?
  await upsertOptionTranslation(prisma, 'Q023', 1, { label: { pt_BR: 'Não', en_US: 'No', es_ES: 'No', it_IT: 'No' } })
  await upsertOptionTranslation(prisma, 'Q023', 2, { label: { pt_BR: 'Área básica (login + histórico)', en_US: 'Basic area (login + history)', es_ES: 'Área básica (login + historial)', it_IT: 'Area base (login + storico)' } })
  await upsertOptionTranslation(prisma, 'Q023', 3, { label: { pt_BR: 'Completa (wishlist, avaliações, fidelidade)', en_US: 'Full (wishlist, reviews, loyalty)', es_ES: 'Completa (wishlist, reseñas, fidelización)', it_IT: 'Completa (wishlist, recensioni, fedeltà)' } })

  // Q024: Cupons / fidelidade?
  await upsertOptionTranslation(prisma, 'Q024', 1, { label: { pt_BR: 'Não', en_US: 'No', es_ES: 'No', it_IT: 'No' } })
  await upsertOptionTranslation(prisma, 'Q024', 2, { label: { pt_BR: 'Cupons de desconto', en_US: 'Discount coupons', es_ES: 'Cupones de descuento', it_IT: 'Coupon sconto' } })
  await upsertOptionTranslation(prisma, 'Q024', 3, { label: { pt_BR: 'Cupons + programa de fidelidade', en_US: 'Coupons + loyalty program', es_ES: 'Cupones + programa de fidelización', it_IT: 'Coupon + programma fedeltà' } })

  // ──────────────────────────────────────────────────────────────
  // BLOCO 4: WEB_SYSTEM (Q030-Q041)
  // ──────────────────────────────────────────────────────────────

  const webSystemTitles: Record<string, Record<LocaleKey, string>> = {
    Q030: { pt_BR: 'Qual nível de autenticação e controle de acesso?', en_US: 'What level of authentication and access control?', es_ES: '¿Qué nivel de autenticación y control de acceso?', it_IT: 'Che livello di autenticazione e controllo accessi?' },
    Q031: { pt_BR: 'Precisa de dashboards e relatórios?', en_US: 'Do you need dashboards and reports?', es_ES: '¿Necesitas dashboards e informes?', it_IT: 'Hai bisogno di dashboard e report?' },
    Q032: { pt_BR: 'Quantas integrações com APIs externas?', en_US: 'How many external API integrations?', es_ES: '¿Cuántas integraciones con APIs externas?', it_IT: 'Quante integrazioni con API esterne?' },
    Q033: { pt_BR: 'Precisa de upload e processamento de arquivos?', en_US: 'Do you need file upload and processing?', es_ES: '¿Necesitas subida y procesamiento de archivos?', it_IT: 'Hai bisogno di caricamento ed elaborazione file?' },
    Q034: { pt_BR: 'Precisa de notificações (email, push, SMS)?', en_US: 'Do you need notifications (email, push, SMS)?', es_ES: '¿Necesitas notificaciones (email, push, SMS)?', it_IT: 'Hai bisogno di notifiche (email, push, SMS)?' },
    Q035: { pt_BR: 'Precisa de módulo financeiro ou faturamento?', en_US: 'Do you need a financial or billing module?', es_ES: '¿Necesitas módulo financiero o facturación?', it_IT: 'Hai bisogno di modulo finanziario o fatturazione?' },
    Q036: { pt_BR: 'Precisa de funcionalidade offline ou PWA?', en_US: 'Do you need offline functionality or PWA?', es_ES: '¿Necesitas funcionalidad offline o PWA?', it_IT: 'Hai bisogno di funzionalità offline o PWA?' },
    Q037: { pt_BR: 'Precisa de funcionalidades em tempo real (chat, colaboração)?', en_US: 'Do you need real-time features (chat, collaboration)?', es_ES: '¿Necesitas funcionalidades en tiempo real (chat, colaboración)?', it_IT: 'Hai bisogno di funzionalità in tempo reale (chat, collaborazione)?' },
    Q038: { pt_BR: 'Precisa de busca avançada?', en_US: 'Do you need advanced search?', es_ES: '¿Necesitas búsqueda avanzada?', it_IT: 'Hai bisogno di ricerca avanzata?' },
    Q039: { pt_BR: 'O sistema precisa suportar múltiplas organizações (multi-tenant)?', en_US: 'Does the system need to support multiple organizations (multi-tenant)?', es_ES: '¿El sistema necesita soportar múltiples organizaciones (multi-tenant)?', it_IT: 'Il sistema deve supportare più organizzazioni (multi-tenant)?' },
    Q040: { pt_BR: 'Precisa de auditoria e logs de atividade?', en_US: 'Do you need audit trails and activity logs?', es_ES: '¿Necesitas auditoría y registros de actividad?', it_IT: 'Hai bisogno di audit trail e log di attività?' },
    Q041: { pt_BR: 'Precisa de exportação de dados (CSV, PDF, Excel)?', en_US: 'Do you need data export (CSV, PDF, Excel)?', es_ES: '¿Necesitas exportación de datos (CSV, PDF, Excel)?', it_IT: 'Hai bisogno di esportazione dati (CSV, PDF, Excel)?' },
  }
  for (const [code, title] of Object.entries(webSystemTitles)) {
    await upsertQuestionTranslation(prisma, code, { title })
  }

  // Q030: Autenticação e controle de acesso
  await upsertOptionTranslation(prisma, 'Q030', 1, { label: { pt_BR: 'Sem autenticação', en_US: 'No authentication', es_ES: 'Sin autenticación', it_IT: 'Nessuna autenticazione' } })
  await upsertOptionTranslation(prisma, 'Q030', 2, { label: { pt_BR: 'Login + senha básico', en_US: 'Basic login + password', es_ES: 'Login + contraseña básico', it_IT: 'Login + password base' } })
  await upsertOptionTranslation(prisma, 'Q030', 3, { label: { pt_BR: 'Multi-role + SSO / OAuth', en_US: 'Multi-role + SSO / OAuth', es_ES: 'Multi-role + SSO / OAuth', it_IT: 'Multi-ruolo + SSO / OAuth' } })

  // Q031: Dashboards e relatórios
  await upsertOptionTranslation(prisma, 'Q031', 1, { label: { pt_BR: 'Sem dashboards', en_US: 'No dashboards', es_ES: 'Sin dashboards', it_IT: 'Nessun dashboard' } })
  await upsertOptionTranslation(prisma, 'Q031', 2, { label: { pt_BR: 'Dashboards com gráficos básicos', en_US: 'Dashboards with basic charts', es_ES: 'Dashboards con gráficos básicos', it_IT: 'Dashboard con grafici base' } })
  await upsertOptionTranslation(prisma, 'Q031', 3, { label: { pt_BR: 'Dashboards avançados + relatórios PDF', en_US: 'Advanced dashboards + PDF reports', es_ES: 'Dashboards avanzados + informes PDF', it_IT: 'Dashboard avanzati + report PDF' } })

  // Q032: Integrações com APIs externas
  await upsertOptionTranslation(prisma, 'Q032', 1, { label: { pt_BR: 'Nenhuma integração', en_US: 'No integrations', es_ES: 'Ninguna integración', it_IT: 'Nessuna integrazione' } })
  await upsertOptionTranslation(prisma, 'Q032', 2, { label: { pt_BR: '1 a 3 APIs', en_US: '1 to 3 APIs', es_ES: '1 a 3 APIs', it_IT: 'Da 1 a 3 API' } })
  await upsertOptionTranslation(prisma, 'Q032', 3, { label: { pt_BR: '4 ou mais APIs', en_US: '4 or more APIs', es_ES: '4 o más APIs', it_IT: '4 o più API' } })

  // Q033: Upload e processamento de arquivos
  await upsertOptionTranslation(prisma, 'Q033', 1, { label: { pt_BR: 'Sem upload', en_US: 'No file upload', es_ES: 'Sin subida de archivos', it_IT: 'Nessun caricamento file' } })
  await upsertOptionTranslation(prisma, 'Q033', 2, { label: { pt_BR: 'Upload simples (imagens, docs)', en_US: 'Simple upload (images, docs)', es_ES: 'Subida simple (imágenes, docs)', it_IT: 'Upload semplice (immagini, doc)' } })
  await upsertOptionTranslation(prisma, 'Q033', 3, { label: { pt_BR: 'Upload + processamento (resize, OCR)', en_US: 'Upload + processing (resize, OCR)', es_ES: 'Subida + procesamiento (resize, OCR)', it_IT: 'Upload + elaborazione (resize, OCR)' } })

  // Q034: Notificações
  await upsertOptionTranslation(prisma, 'Q034', 1, { label: { pt_BR: 'Sem notificações', en_US: 'No notifications', es_ES: 'Sin notificaciones', it_IT: 'Nessuna notifica' } })
  await upsertOptionTranslation(prisma, 'Q034', 2, { label: { pt_BR: 'Email apenas', en_US: 'Email only', es_ES: 'Solo email', it_IT: 'Solo email' } })
  await upsertOptionTranslation(prisma, 'Q034', 3, { label: { pt_BR: 'Email + push + SMS', en_US: 'Email + push + SMS', es_ES: 'Email + push + SMS', it_IT: 'Email + push + SMS' } })

  // Q035: Módulo financeiro
  await upsertOptionTranslation(prisma, 'Q035', 1, { label: { pt_BR: 'Sem módulo financeiro', en_US: 'No financial module', es_ES: 'Sin módulo financiero', it_IT: 'Nessun modulo finanziario' } })
  await upsertOptionTranslation(prisma, 'Q035', 2, { label: { pt_BR: 'Faturamento básico', en_US: 'Basic billing', es_ES: 'Facturación básica', it_IT: 'Fatturazione base' } })
  await upsertOptionTranslation(prisma, 'Q035', 3, { label: { pt_BR: 'Módulo financeiro completo (NF-e, cobranças)', en_US: 'Full financial module (invoicing, billing)', es_ES: 'Módulo financiero completo (facturación, cobros)', it_IT: 'Modulo finanziario completo (fatturazione, incassi)' } })

  // Q036: Offline / PWA
  await upsertOptionTranslation(prisma, 'Q036', 1, { label: { pt_BR: 'Sem funcionalidade offline', en_US: 'No offline functionality', es_ES: 'Sin funcionalidad offline', it_IT: 'Nessuna funzionalità offline' } })
  await upsertOptionTranslation(prisma, 'Q036', 2, { label: { pt_BR: 'PWA básico (cache)', en_US: 'Basic PWA (cache)', es_ES: 'PWA básico (caché)', it_IT: 'PWA base (cache)' } })
  await upsertOptionTranslation(prisma, 'Q036', 3, { label: { pt_BR: 'Offline completo com sincronização', en_US: 'Full offline with sync', es_ES: 'Offline completo con sincronización', it_IT: 'Offline completo con sincronizzazione' } })

  // Q037: Tempo real
  await upsertOptionTranslation(prisma, 'Q037', 1, { label: { pt_BR: 'Sem tempo real', en_US: 'No real-time features', es_ES: 'Sin tiempo real', it_IT: 'Nessuna funzionalità in tempo reale' } })
  await upsertOptionTranslation(prisma, 'Q037', 2, { label: { pt_BR: 'Chat ou notificações live', en_US: 'Chat or live notifications', es_ES: 'Chat o notificaciones en vivo', it_IT: 'Chat o notifiche live' } })
  await upsertOptionTranslation(prisma, 'Q037', 3, { label: { pt_BR: 'Colaboração em tempo real', en_US: 'Real-time collaboration', es_ES: 'Colaboración en tiempo real', it_IT: 'Collaborazione in tempo reale' } })

  // Q038: Busca avançada
  await upsertOptionTranslation(prisma, 'Q038', 1, { label: { pt_BR: 'Busca simples', en_US: 'Simple search', es_ES: 'Búsqueda simple', it_IT: 'Ricerca semplice' } })
  await upsertOptionTranslation(prisma, 'Q038', 2, { label: { pt_BR: 'Busca com filtros e facetas', en_US: 'Search with filters and facets', es_ES: 'Búsqueda con filtros y facetas', it_IT: 'Ricerca con filtri e facet' } })
  await upsertOptionTranslation(prisma, 'Q038', 3, { label: { pt_BR: 'Full-text search (Elasticsearch, Algolia)', en_US: 'Full-text search (Elasticsearch, Algolia)', es_ES: 'Búsqueda full-text (Elasticsearch, Algolia)', it_IT: 'Ricerca full-text (Elasticsearch, Algolia)' } })

  // Q039: Multi-tenant
  await upsertOptionTranslation(prisma, 'Q039', 1, { label: { pt_BR: 'Não', en_US: 'No', es_ES: 'No', it_IT: 'No' } })
  await upsertOptionTranslation(prisma, 'Q039', 2, { label: { pt_BR: 'Multi-tenant básico (subdomínios)', en_US: 'Basic multi-tenant (subdomains)', es_ES: 'Multi-tenant básico (subdominios)', it_IT: 'Multi-tenant base (sottodomini)' } })
  await upsertOptionTranslation(prisma, 'Q039', 3, { label: { pt_BR: 'Multi-tenant completo (isolamento de dados)', en_US: 'Full multi-tenant (data isolation)', es_ES: 'Multi-tenant completo (aislamiento de datos)', it_IT: 'Multi-tenant completo (isolamento dati)' } })

  // Q040: Auditoria e logs
  await upsertOptionTranslation(prisma, 'Q040', 1, { label: { pt_BR: 'Sem auditoria', en_US: 'No audit trails', es_ES: 'Sin auditoría', it_IT: 'Nessun audit trail' } })
  await upsertOptionTranslation(prisma, 'Q040', 2, { label: { pt_BR: 'Logs básicos de atividade', en_US: 'Basic activity logs', es_ES: 'Registros básicos de actividad', it_IT: 'Log di attività base' } })
  await upsertOptionTranslation(prisma, 'Q040', 3, { label: { pt_BR: 'Auditoria completa com trail de alterações', en_US: 'Full audit with change trail', es_ES: 'Auditoría completa con registro de cambios', it_IT: 'Audit completo con tracciamento modifiche' } })

  // Q041: Exportação de dados
  await upsertOptionTranslation(prisma, 'Q041', 1, { label: { pt_BR: 'Sem exportação', en_US: 'No data export', es_ES: 'Sin exportación', it_IT: 'Nessuna esportazione' } })
  await upsertOptionTranslation(prisma, 'Q041', 2, { label: { pt_BR: 'CSV apenas', en_US: 'CSV only', es_ES: 'Solo CSV', it_IT: 'Solo CSV' } })
  await upsertOptionTranslation(prisma, 'Q041', 3, { label: { pt_BR: 'CSV + PDF + Excel', en_US: 'CSV + PDF + Excel', es_ES: 'CSV + PDF + Excel', it_IT: 'CSV + PDF + Excel' } })

  // ──────────────────────────────────────────────────────────────
  // BLOCO 5: MOBILE_APP (Q045-Q049)
  // ──────────────────────────────────────────────────────────────

  const mobileTitles: Record<string, Record<LocaleKey, string>> = {
    Q045: { pt_BR: 'Para qual plataforma o app será desenvolvido?', en_US: 'Which platform will the app be developed for?', es_ES: '¿Para qué plataforma se desarrollará la app?', it_IT: "Per quale piattaforma verrà sviluppata l'app?" },
    Q046: { pt_BR: 'Qual experiência você espera no app?', en_US: 'Which development approach do you prefer?', es_ES: '¿Qué enfoque de desarrollo prefieres?', it_IT: 'Quale approccio di sviluppo preferisci?' },
    Q047: { pt_BR: 'O app precisa de notificações push?', en_US: 'Does the app need push notifications?', es_ES: '¿La app necesita notificaciones push?', it_IT: "L'app ha bisogno di notifiche push?" },
    Q048: { pt_BR: 'O app precisa funcionar offline?', en_US: 'Does the app need to work offline?', es_ES: '¿La app necesita funcionar sin conexión?', it_IT: "L'app deve funzionare offline?" },
    Q049: { pt_BR: 'O app precisa acessar hardware do dispositivo?', en_US: 'Does the app need to access device hardware?', es_ES: '¿La app necesita acceder al hardware del dispositivo?', it_IT: "L'app deve accedere all'hardware del dispositivo?" },
  }
  for (const [code, title] of Object.entries(mobileTitles)) {
    await upsertQuestionTranslation(prisma, code, { title })
  }

  await upsertOptionTranslation(prisma, 'Q045', 1, { label: { pt_BR: 'Apenas iOS', en_US: 'iOS only', es_ES: 'Solo iOS', it_IT: 'Solo iOS' } })
  await upsertOptionTranslation(prisma, 'Q045', 2, { label: { pt_BR: 'Apenas Android', en_US: 'Android only', es_ES: 'Solo Android', it_IT: 'Solo Android' } })
  await upsertOptionTranslation(prisma, 'Q045', 3, { label: { pt_BR: 'iOS e Android', en_US: 'iOS and Android', es_ES: 'iOS y Android', it_IT: 'iOS e Android' } })

  await upsertOptionTranslation(prisma, 'Q046', 1, { label: { pt_BR: 'Uma única base para lançar mais rápido nas duas plataformas', en_US: 'React Native / Flutter (cross-platform)', es_ES: 'React Native / Flutter (multiplataforma)', it_IT: 'React Native / Flutter (cross-platform)' } })
  await upsertOptionTranslation(prisma, 'Q046', 2, { label: { pt_BR: 'Experiência mais refinada e performance máxima em cada plataforma', en_US: 'Native per platform (Swift + Kotlin)', es_ES: 'Nativo por plataforma (Swift + Kotlin)', it_IT: 'Nativo per piattaforma (Swift + Kotlin)' } })

  await upsertOptionTranslation(prisma, 'Q047', 1, { label: { pt_BR: 'Sem push', en_US: 'No push notifications', es_ES: 'Sin notificaciones push', it_IT: 'Nessuna notifica push' } })
  await upsertOptionTranslation(prisma, 'Q047', 2, { label: { pt_BR: 'Push básico (FCM)', en_US: 'Basic push (FCM)', es_ES: 'Push básico (FCM)', it_IT: 'Push base (FCM)' } })
  await upsertOptionTranslation(prisma, 'Q047', 3, { label: { pt_BR: 'Push segmentado', en_US: 'Segmented push', es_ES: 'Push segmentado', it_IT: 'Push segmentato' } })

  await upsertOptionTranslation(prisma, 'Q048', 1, { label: { pt_BR: 'Sem funcionalidade offline', en_US: 'No offline functionality', es_ES: 'Sin funcionalidad offline', it_IT: 'Nessuna funzionalità offline' } })
  await upsertOptionTranslation(prisma, 'Q048', 2, { label: { pt_BR: 'Offline parcial (cache)', en_US: 'Partial offline (cache)', es_ES: 'Offline parcial (caché)', it_IT: 'Offline parziale (cache)' } })
  await upsertOptionTranslation(prisma, 'Q048', 3, { label: { pt_BR: 'Offline completo com sincronização', en_US: 'Full offline with sync', es_ES: 'Offline completo con sincronización', it_IT: 'Offline completo con sincronizzazione' } })

  await upsertOptionTranslation(prisma, 'Q049', 1, { label: { pt_BR: 'Sem hardware especial', en_US: 'No special hardware', es_ES: 'Sin hardware especial', it_IT: 'Nessun hardware speciale' } })
  await upsertOptionTranslation(prisma, 'Q049', 2, { label: { pt_BR: 'Câmera / GPS / localização', en_US: 'Camera / GPS / location', es_ES: 'Cámara / GPS / ubicación', it_IT: 'Fotocamera / GPS / posizione' } })
  await upsertOptionTranslation(prisma, 'Q049', 3, { label: { pt_BR: 'Bluetooth / NFC / biometria', en_US: 'Bluetooth / NFC / biometrics', es_ES: 'Bluetooth / NFC / biometría', it_IT: 'Bluetooth / NFC / biometria' } })

  // ──────────────────────────────────────────────────────────────
  // BLOCO 6: AUTOMATION_AI (Q050-Q052)
  // ──────────────────────────────────────────────────────────────

  const aiTitles: Record<string, Record<LocaleKey, string>> = {
    Q050: { pt_BR: 'Qual tipo de automação ou IA você precisa?', en_US: 'What type of automation or AI do you need?', es_ES: '¿Qué tipo de automatización o IA necesitas?', it_IT: "Che tipo di automazione o IA ti serve?" },
    Q051: { pt_BR: 'Como será a fonte de dados para a IA?', en_US: 'What will be the data source for the AI?', es_ES: '¿Cuál será la fuente de datos para la IA?', it_IT: "Qual sarà la fonte di dati per l'IA?" },
    Q052: { pt_BR: 'Como a IA será integrada ao sistema?', en_US: 'How will AI be integrated into the system?', es_ES: '¿Cómo se integrará la IA al sistema?', it_IT: "Come verrà integrata l'IA nel sistema?" },
  }
  for (const [code, title] of Object.entries(aiTitles)) {
    await upsertQuestionTranslation(prisma, code, { title })
  }

  // Q050: Tipo de automação / IA
  await upsertOptionTranslation(prisma, 'Q050', 1, { label: { pt_BR: 'Automação de tarefas e processos', en_US: 'Process automation (RPA)', es_ES: 'Automatización de procesos (RPA)', it_IT: 'Automazione dei processi (RPA)' } })
  await upsertOptionTranslation(prisma, 'Q050', 2, { label: { pt_BR: 'Inteligência artificial para conversar, resumir ou gerar conteúdo', en_US: 'Generative AI (ChatGPT, LLM)', es_ES: 'IA Generativa (ChatGPT, LLM)', it_IT: 'IA Generativa (ChatGPT, LLM)' } })
  await upsertOptionTranslation(prisma, 'Q050', 3, { label: { pt_BR: 'Machine Learning / Análise de dados', en_US: 'Machine Learning / Data analysis', es_ES: 'Machine Learning / Análisis de datos', it_IT: 'Machine Learning / Analisi dati' } })

  // Q051: Fonte de dados para IA
  await upsertOptionTranslation(prisma, 'Q051', 1, { label: { pt_BR: 'Dados internos do sistema', en_US: 'Internal system data', es_ES: 'Datos internos del sistema', it_IT: 'Dati interni del sistema' } })
  await upsertOptionTranslation(prisma, 'Q051', 2, { label: { pt_BR: 'Dados vindos de outros sistemas e ferramentas', en_US: 'External APIs and sources', es_ES: 'APIs y fuentes externas', it_IT: 'API e fonti esterne' } })
  await upsertOptionTranslation(prisma, 'Q051', 3, { label: { pt_BR: 'Várias fontes com tratamento e atualização contínua dos dados', en_US: 'Multiple sources + data pipeline', es_ES: 'Múltiples fuentes + data pipeline', it_IT: 'Fonti multiple + data pipeline' } })

  // Q052: Integração da IA ao sistema
  await upsertOptionTranslation(prisma, 'Q052', 1, { label: { pt_BR: 'Como um serviço separado, conectado quando necessário', en_US: 'Standalone API', es_ES: 'API independiente', it_IT: 'API standalone' } })
  await upsertOptionTranslation(prisma, 'Q052', 2, { label: { pt_BR: 'Integrada na aplicação', en_US: 'Embedded in the application', es_ES: 'Integrada en la aplicación', it_IT: "Integrata nell'applicazione" } })
  await upsertOptionTranslation(prisma, 'Q052', 3, { label: { pt_BR: 'Como parte de um fluxo completo para processar dados e entregar resultados', en_US: 'Full pipeline (ingestion + processing + output)', es_ES: 'Pipeline completo (ingesta + procesamiento + salida)', it_IT: 'Pipeline completo (ingestione + elaborazione + output)' } })

  // ──────────────────────────────────────────────────────────────
  // BLOCO 7: MARKETPLACE (Q070-Q074)
  // ──────────────────────────────────────────────────────────────

  const marketplaceTitles: Record<string, Record<LocaleKey, string>> = {
    Q070: { pt_BR: 'Como o marketplace monetiza?', en_US: 'How does the marketplace monetize?', es_ES: '¿Cómo monetiza el marketplace?', it_IT: 'Come monetizza il marketplace?' },
    Q071: { pt_BR: 'Qual nível de avaliações e reputação é necessário?', en_US: 'What level of reviews and reputation is needed?', es_ES: '¿Qué nivel de reseñas y reputación se necesita?', it_IT: 'Che livello di recensioni e reputazione è necessario?' },
    Q072: { pt_BR: 'Precisa de chat entre usuários?', en_US: 'Do you need chat between users?', es_ES: '¿Necesitas chat entre usuarios?', it_IT: 'Serve una chat tra utenti?' },
    Q073: { pt_BR: 'Haverá moeda virtual ou créditos internos?', en_US: 'Will there be virtual currency or internal credits?', es_ES: '¿Habrá moneda virtual o créditos internos?', it_IT: 'Ci saranno valuta virtuale o crediti interni?' },
    Q074: { pt_BR: 'Precisa de assinatura premium?', en_US: 'Do you need a premium subscription?', es_ES: '¿Necesitas suscripción premium?', it_IT: 'Serve un abbonamento premium?' },
  }
  for (const [code, title] of Object.entries(marketplaceTitles)) {
    await upsertQuestionTranslation(prisma, code, { title })
  }
  await upsertOptionTranslation(prisma, 'Q070', 1, { label: { pt_BR: 'Não sei / preciso de orientação', en_US: 'I am not sure / I need guidance', es_ES: 'No lo sé / necesito orientación', it_IT: 'Non lo so / ho bisogno di orientamento' } })
  await upsertOptionTranslation(prisma, 'Q070', 2, { label: { pt_BR: 'Comissão simples por transação', en_US: 'Simple commission per transaction', es_ES: 'Comisión simple por transacción', it_IT: 'Commissione semplice per transazione' } })
  await upsertOptionTranslation(prisma, 'Q070', 3, { label: { pt_BR: 'Comissão + split + regras avançadas', en_US: 'Commission + split + advanced rules', es_ES: 'Comisión + split + reglas avanzadas', it_IT: 'Commissione + split + regole avanzate' } })
  await upsertOptionTranslation(prisma, 'Q071', 1, { label: { pt_BR: 'Não sei / preciso de orientação', en_US: 'I am not sure / I need guidance', es_ES: 'No lo sé / necesito orientación', it_IT: 'Non lo so / ho bisogno di orientamento' } })
  await upsertOptionTranslation(prisma, 'Q071', 2, { label: { pt_BR: 'Avaliação básica por estrelas', en_US: 'Basic star rating', es_ES: 'Calificación básica por estrellas', it_IT: 'Valutazione base a stelle' } })
  await upsertOptionTranslation(prisma, 'Q071', 3, { label: { pt_BR: 'Reputação completa com moderação', en_US: 'Full reputation system with moderation', es_ES: 'Reputación completa con moderación', it_IT: 'Sistema reputazionale completo con moderazione' } })
  await upsertOptionTranslation(prisma, 'Q072', 1, { label: { pt_BR: 'Não sei / preciso de orientação', en_US: 'I am not sure / I need guidance', es_ES: 'No lo sé / necesito orientación', it_IT: 'Non lo so / ho bisogno di orientamento' } })
  await upsertOptionTranslation(prisma, 'Q072', 2, { label: { pt_BR: 'Chat simples após match/pedido', en_US: 'Simple chat after match/order', es_ES: 'Chat simple tras match/pedido', it_IT: 'Chat semplice dopo match/ordine' } })
  await upsertOptionTranslation(prisma, 'Q072', 3, { label: { pt_BR: 'Chat em tempo real com anexos', en_US: 'Real-time chat with attachments', es_ES: 'Chat en tiempo real con adjuntos', it_IT: 'Chat in tempo reale con allegati' } })
  await upsertOptionTranslation(prisma, 'Q073', 1, { label: { pt_BR: 'Não sei / preciso de orientação', en_US: 'I am not sure / I need guidance', es_ES: 'No lo sé / necesito orientación', it_IT: 'Non lo so / ho bisogno di orientamento' } })
  await upsertOptionTranslation(prisma, 'Q073', 2, { label: { pt_BR: 'Créditos simples para compras internas', en_US: 'Simple credits for internal purchases', es_ES: 'Créditos simples para compras internas', it_IT: 'Crediti semplici per acquisti interni' } })
  await upsertOptionTranslation(prisma, 'Q073', 3, { label: { pt_BR: 'Wallet interna com regras de saldo', en_US: 'Internal wallet with balance rules', es_ES: 'Wallet interna con reglas de saldo', it_IT: 'Wallet interna con regole di saldo' } })
  await upsertOptionTranslation(prisma, 'Q074', 1, { label: { pt_BR: 'Não sei / preciso de orientação', en_US: 'I am not sure / I need guidance', es_ES: 'No lo sé / necesito orientación', it_IT: 'Non lo so / ho bisogno di orientamento' } })
  await upsertOptionTranslation(prisma, 'Q074', 2, { label: { pt_BR: 'Plano premium simples', en_US: 'Simple premium plan', es_ES: 'Plan premium simple', it_IT: 'Piano premium semplice' } })
  await upsertOptionTranslation(prisma, 'Q074', 3, { label: { pt_BR: 'Planos com níveis e benefícios dinâmicos', en_US: 'Tiered plans with dynamic benefits', es_ES: 'Planes con niveles y beneficios dinámicos', it_IT: 'Piani a livelli con benefici dinamici' } })

  // ──────────────────────────────────────────────────────────────
  // BLOCO 8: CRYPTO (Q075-Q079)
  // ──────────────────────────────────────────────────────────────

  const cryptoTitles: Record<string, Record<LocaleKey, string>> = {
    Q075: { pt_BR: 'Qual tipo de ativo/token está no escopo?', en_US: 'What type of asset/token is in scope?', es_ES: '¿Qué tipo de activo/token está en el alcance?', it_IT: 'Quale tipo di asset/token è nello scope?' },
    Q076: { pt_BR: 'Qual rede blockchain pretende usar?', en_US: 'Which blockchain network do you plan to use?', es_ES: '¿Qué red blockchain planeas usar?', it_IT: 'Quale rete blockchain vuoi usare?' },
    Q077: { pt_BR: 'Precisa de staking ou rewards?', en_US: 'Do you need staking or rewards?', es_ES: '¿Necesitas staking o rewards?', it_IT: 'Servono staking o rewards?' },
    Q078: { pt_BR: 'Quais carteiras precisam ser integradas?', en_US: 'Which wallets need to be integrated?', es_ES: '¿Qué wallets deben integrarse?', it_IT: 'Quali wallet devono essere integrati?' },
    Q079: { pt_BR: 'Qual nível de compliance/KYC é necessário?', en_US: 'What level of compliance/KYC is required?', es_ES: '¿Qué nivel de compliance/KYC se requiere?', it_IT: 'Quale livello di compliance/KYC è richiesto?' },
  }
  for (const [code, title] of Object.entries(cryptoTitles)) {
    await upsertQuestionTranslation(prisma, code, { title })
  }
  await upsertOptionTranslation(prisma, 'Q075', 1, { label: { pt_BR: 'Não sei / preciso de orientação', en_US: 'I am not sure / I need guidance', es_ES: 'No lo sé / necesito orientación', it_IT: 'Non lo so / ho bisogno di orientamento' } })
  await upsertOptionTranslation(prisma, 'Q075', 2, { label: { pt_BR: 'Utility token ou NFT simples', en_US: 'Utility token or simple NFT', es_ES: 'Utility token o NFT simple', it_IT: 'Utility token o NFT semplice' } })
  await upsertOptionTranslation(prisma, 'Q075', 3, { label: { pt_BR: 'Token com regras avançadas / múltiplos ativos', en_US: 'Token with advanced rules / multiple assets', es_ES: 'Token con reglas avanzadas / múltiples activos', it_IT: 'Token con regole avanzate / asset multipli' } })
  await upsertOptionTranslation(prisma, 'Q076', 1, { label: { pt_BR: 'Não sei / preciso de orientação', en_US: 'I am not sure / I need guidance', es_ES: 'No lo sé / necesito orientación', it_IT: 'Non lo so / ho bisogno di orientamento' } })
  await upsertOptionTranslation(prisma, 'Q076', 2, { label: { pt_BR: 'Rede popular única (Ethereum, Polygon, Base)', en_US: 'Single popular network (Ethereum, Polygon, Base)', es_ES: 'Red popular única (Ethereum, Polygon, Base)', it_IT: 'Rete popolare singola (Ethereum, Polygon, Base)' } })
  await upsertOptionTranslation(prisma, 'Q076', 3, { label: { pt_BR: 'Multi-chain ou rede especializada', en_US: 'Multi-chain or specialized network', es_ES: 'Multi-chain o red especializada', it_IT: 'Multi-chain o rete specializzata' } })
  await upsertOptionTranslation(prisma, 'Q077', 1, { label: { pt_BR: 'Não sei / preciso de orientação', en_US: 'I am not sure / I need guidance', es_ES: 'No lo sé / necesito orientación', it_IT: 'Non lo so / ho bisogno di orientamento' } })
  await upsertOptionTranslation(prisma, 'Q077', 2, { label: { pt_BR: 'Rewards simples / campanhas', en_US: 'Simple rewards / campaigns', es_ES: 'Rewards simples / campañas', it_IT: 'Rewards semplici / campagne' } })
  await upsertOptionTranslation(prisma, 'Q077', 3, { label: { pt_BR: 'Staking completo com regras on-chain', en_US: 'Full staking with on-chain rules', es_ES: 'Staking completo con reglas on-chain', it_IT: 'Staking completo con regole on-chain' } })
  await upsertOptionTranslation(prisma, 'Q078', 1, { label: { pt_BR: 'Não sei / preciso de orientação', en_US: 'I am not sure / I need guidance', es_ES: 'No lo sé / necesito orientación', it_IT: 'Non lo so / ho bisogno di orientamento' } })
  await upsertOptionTranslation(prisma, 'Q078', 2, { label: { pt_BR: 'Uma wallet principal', en_US: 'One main wallet', es_ES: 'Una wallet principal', it_IT: 'Una wallet principale' } })
  await upsertOptionTranslation(prisma, 'Q078', 3, { label: { pt_BR: 'Múltiplas wallets e conectores', en_US: 'Multiple wallets and connectors', es_ES: 'Múltiples wallets y conectores', it_IT: 'Wallet multiple e connettori' } })
  await upsertOptionTranslation(prisma, 'Q079', 1, { label: { pt_BR: 'Não sei / preciso de orientação', en_US: 'I am not sure / I need guidance', es_ES: 'No lo sé / necesito orientación', it_IT: 'Non lo so / ho bisogno di orientamento' } })
  await upsertOptionTranslation(prisma, 'Q079', 2, { label: { pt_BR: 'Compliance básico / termos e alertas', en_US: 'Basic compliance / terms and alerts', es_ES: 'Compliance básico / términos y alertas', it_IT: 'Compliance base / termini e avvisi' } })
  await upsertOptionTranslation(prisma, 'Q079', 3, { label: { pt_BR: 'KYC/AML com validação de identidade', en_US: 'KYC/AML with identity verification', es_ES: 'KYC/AML con verificación de identidad', it_IT: 'KYC/AML con verifica identità' } })

  // ──────────────────────────────────────────────────────────────
  // BLOCO 9: BROWSER_EXT (Q080-Q083)
  // ──────────────────────────────────────────────────────────────

  const browserTitles: Record<string, Record<LocaleKey, string>> = {
    Q080: { pt_BR: 'Quais navegadores a extensão deve atender?', en_US: 'Which browsers should the extension support?', es_ES: '¿Qué navegadores debe soportar la extensión?', it_IT: 'Quali browser deve supportare l’estensione?' },
    Q081: { pt_BR: 'Qual nível de integração com páginas/APIs é necessário?', en_US: 'What level of integration with pages/APIs is needed?', es_ES: '¿Qué nivel de integración con páginas/APIs se necesita?', it_IT: 'Quale livello di integrazione con pagine/API è necessario?' },
    Q082: { pt_BR: 'Precisa publicar nas stores oficiais?', en_US: 'Do you need publishing to official stores?', es_ES: '¿Necesitas publicar en las stores oficiales?', it_IT: 'Serve la pubblicazione negli store ufficiali?' },
    Q083: { pt_BR: 'Precisa sincronizar com conta do usuário?', en_US: 'Do you need sync with a user account?', es_ES: '¿Necesitas sincronizar con la cuenta del usuario?', it_IT: 'Serve sincronizzare con l’account utente?' },
  }
  for (const [code, title] of Object.entries(browserTitles)) {
    await upsertQuestionTranslation(prisma, code, { title })
  }
  await upsertOptionTranslation(prisma, 'Q080', 1, { label: { pt_BR: 'Não sei / preciso de orientação', en_US: 'I am not sure / I need guidance', es_ES: 'No lo sé / necesito orientación', it_IT: 'Non lo so / ho bisogno di orientamento' } })
  await upsertOptionTranslation(prisma, 'Q080', 2, { label: { pt_BR: 'Chrome apenas', en_US: 'Chrome only', es_ES: 'Solo Chrome', it_IT: 'Solo Chrome' } })
  await upsertOptionTranslation(prisma, 'Q080', 3, { label: { pt_BR: 'Chrome + Firefox/Edge/Safari', en_US: 'Chrome + Firefox/Edge/Safari', es_ES: 'Chrome + Firefox/Edge/Safari', it_IT: 'Chrome + Firefox/Edge/Safari' } })
  await upsertOptionTranslation(prisma, 'Q081', 1, { label: { pt_BR: 'Não sei / preciso de orientação', en_US: 'I am not sure / I need guidance', es_ES: 'No lo sé / necesito orientación', it_IT: 'Non lo so / ho bisogno di orientamento' } })
  await upsertOptionTranslation(prisma, 'Q081', 2, { label: { pt_BR: 'Integração simples com uma página ou API', en_US: 'Simple integration with one page or API', es_ES: 'Integración simple con una página o API', it_IT: 'Integrazione semplice con una pagina o API' } })
  await upsertOptionTranslation(prisma, 'Q081', 3, { label: { pt_BR: 'Injeção avançada + múltiplas integrações', en_US: 'Advanced injection + multiple integrations', es_ES: 'Inyección avanzada + múltiples integraciones', it_IT: 'Iniezione avanzata + integrazioni multiple' } })
  await upsertOptionTranslation(prisma, 'Q082', 1, { label: { pt_BR: 'Não sei / preciso de orientação', en_US: 'I am not sure / I need guidance', es_ES: 'No lo sé / necesito orientación', it_IT: 'Non lo so / ho bisogno di orientamento' } })
  await upsertOptionTranslation(prisma, 'Q082', 2, { label: { pt_BR: 'Publicação inicial em uma store', en_US: 'Initial publishing to one store', es_ES: 'Publicación inicial en una store', it_IT: 'Pubblicazione iniziale su uno store' } })
  await upsertOptionTranslation(prisma, 'Q082', 3, { label: { pt_BR: 'Publicação e manutenção em múltiplas stores', en_US: 'Publishing and maintenance in multiple stores', es_ES: 'Publicación y mantenimiento en múltiples stores', it_IT: 'Pubblicazione e manutenzione su store multipli' } })
  await upsertOptionTranslation(prisma, 'Q083', 1, { label: { pt_BR: 'Não sei / preciso de orientação', en_US: 'I am not sure / I need guidance', es_ES: 'No lo sé / necesito orientación', it_IT: 'Non lo so / ho bisogno di orientamento' } })
  await upsertOptionTranslation(prisma, 'Q083', 2, { label: { pt_BR: 'Sync básico de preferências', en_US: 'Basic preferences sync', es_ES: 'Sync básico de preferencias', it_IT: 'Sync base delle preferenze' } })
  await upsertOptionTranslation(prisma, 'Q083', 3, { label: { pt_BR: 'Conta completa com dados e histórico', en_US: 'Full account with data and history', es_ES: 'Cuenta completa con datos e historial', it_IT: 'Account completo con dati e storico' } })

  // ──────────────────────────────────────────────────────────────
  // BLOCO 10: CONTEXT (Q090-Q093)
  // ──────────────────────────────────────────────────────────────

  await upsertQuestionTranslation(prisma, 'Q090', {
    title: { pt_BR: 'Qual é o orçamento disponível para o projeto?', en_US: 'What is the available budget for the project?', es_ES: '¿Cuál es el presupuesto disponible para el proyecto?', it_IT: 'Qual è il budget disponibile per il progetto?' },
    description: { pt_BR: 'Isso nos ajuda a sugerir a solução mais adequada ao seu investimento.', en_US: 'This helps us suggest the most suitable solution for your investment.', es_ES: 'Esto nos ayuda a sugerir la solución más adecuada a tu inversión.', it_IT: 'Questo ci aiuta a suggerire la soluzione più adatta al tuo investimento.' },
  })
  await upsertOptionTranslation(prisma, 'Q090', 1, { label: { pt_BR: 'Abaixo de R$ 3.000', en_US: 'Below US$ 3,000', es_ES: 'Menos de € 3.000', it_IT: 'Meno di € 3.000' } })
  await upsertOptionTranslation(prisma, 'Q090', 2, { label: { pt_BR: 'R$ 3.000 a R$ 8.000', en_US: 'US$ 3,000 to US$ 8,000', es_ES: '€ 3.000 a € 8.000', it_IT: '€ 3.000 a € 8.000' } })
  await upsertOptionTranslation(prisma, 'Q090', 3, { label: { pt_BR: 'R$ 8.000 a R$ 20.000', en_US: 'US$ 8,000 to US$ 20,000', es_ES: '€ 8.000 a € 20.000', it_IT: '€ 8.000 a € 20.000' } })
  await upsertOptionTranslation(prisma, 'Q090', 4, { label: { pt_BR: 'Acima de R$ 20.000', en_US: 'Above US$ 20,000', es_ES: 'Más de € 20.000', it_IT: 'Oltre € 20.000' } })

  await upsertQuestionTranslation(prisma, 'Q091', {
    title: { pt_BR: 'Qual é o prazo esperado para entrega?', en_US: 'What is the expected delivery timeline?', es_ES: '¿Cuál es el plazo de entrega esperado?', it_IT: 'Qual è il termine di consegna previsto?' },
  })
  await upsertOptionTranslation(prisma, 'Q091', 1, { label: { pt_BR: 'Urgente (menos de 30 dias)', en_US: 'Urgent (less than 30 days)', es_ES: 'Urgente (menos de 30 días)', it_IT: 'Urgente (meno di 30 giorni)' } })
  await upsertOptionTranslation(prisma, 'Q091', 2, { label: { pt_BR: 'Normal (1 a 3 meses)', en_US: 'Normal (1 to 3 months)', es_ES: 'Normal (1 a 3 meses)', it_IT: 'Normale (da 1 a 3 mesi)' } })
  await upsertOptionTranslation(prisma, 'Q091', 3, { label: { pt_BR: 'Flexível (mais de 3 meses)', en_US: 'Flexible (more than 3 months)', es_ES: 'Flexible (más de 3 meses)', it_IT: 'Flessibile (più di 3 mesi)' } })

  await upsertQuestionTranslation(prisma, 'Q092', {
    title: { pt_BR: 'Como está o design do projeto?', en_US: 'What is the status of the project design?', es_ES: '¿Cuál es el estado del diseño del proyecto?', it_IT: 'Qual è lo stato del design del progetto?' },
  })
  await upsertOptionTranslation(prisma, 'Q092', 1, { label: { pt_BR: 'Já tenho design pronto', en_US: 'I already have a ready design', es_ES: 'Ya tengo el diseño listo', it_IT: 'Ho già un design pronto' } })
  await upsertOptionTranslation(prisma, 'Q092', 2, { label: { pt_BR: 'Preciso de design básico', en_US: 'I need basic design', es_ES: 'Necesito diseño básico', it_IT: 'Ho bisogno di un design di base' } })
  await upsertOptionTranslation(prisma, 'Q092', 3, { label: { pt_BR: 'Preciso de design + branding completo', en_US: 'I need design + full branding', es_ES: 'Necesito diseño + branding completo', it_IT: 'Ho bisogno di design + branding completo' } })

  await upsertQuestionTranslation(prisma, 'Q093', {
    title: { pt_BR: 'Precisa de manutenção ou suporte após a entrega?', en_US: 'Do you need maintenance or support after delivery?', es_ES: '¿Necesitas mantenimiento o soporte después de la entrega?', it_IT: 'Hai bisogno di manutenzione o supporto dopo la consegna?' },
  })
  await upsertOptionTranslation(prisma, 'Q093', 1, { label: { pt_BR: 'Nenhuma manutenção', en_US: 'No maintenance', es_ES: 'Sin mantenimiento', it_IT: 'Nessuna manutenzione' } })
  await upsertOptionTranslation(prisma, 'Q093', 2, { label: { pt_BR: 'Suporte básico mensal', en_US: 'Basic monthly support', es_ES: 'Soporte básico mensual', it_IT: 'Supporto base mensile' } })
  await upsertOptionTranslation(prisma, 'Q093', 3, { label: { pt_BR: 'Suporte dedicado', en_US: 'Dedicated support', es_ES: 'Soporte dedicado', it_IT: 'Supporto dedicato' } })

  // ──────────────────────────────────────────────────────────────
  // BLOCO 8: LEAD (Q100-Q105)
  // ──────────────────────────────────────────────────────────────

  const leadTitles: Record<string, Record<LocaleKey, string>> = {
    Q100: { pt_BR: 'Como podemos te chamar?', en_US: 'What is your full name?', es_ES: '¿Cuál es tu nombre completo?', it_IT: 'Qual è il tuo nome completo?' },
    Q101: { pt_BR: 'Qual é o seu email?', en_US: 'What is your email address?', es_ES: '¿Cuál es tu dirección de correo electrónico?', it_IT: 'Qual è il tuo indirizzo email?' },
    Q102: { pt_BR: 'Qual é o seu telefone? (opcional)', en_US: 'What is your phone number? (optional)', es_ES: '¿Cuál es tu número de teléfono? (opcional)', it_IT: 'Qual è il tuo numero di telefono? (opzionale)' },
    Q103: { pt_BR: 'Qual é o nome da sua empresa? (opcional)', en_US: 'What is your company name? (optional)', es_ES: '¿Cuál es el nombre de tu empresa? (opcional)', it_IT: 'Qual è il nome della tua azienda? (opzionale)' },
    Q104: { pt_BR: 'Como você nos conheceu?', en_US: 'How did you find us?', es_ES: '¿Cómo nos conociste?', it_IT: 'Come ci hai trovato?' },
    Q105: { pt_BR: 'Alguma observação ou informação adicional?', en_US: 'Any additional notes or information?', es_ES: '¿Alguna observación o información adicional?', it_IT: 'Alcune note o informazioni aggiuntive?' },
  }
  for (const [code, title] of Object.entries(leadTitles)) {
    await upsertQuestionTranslation(prisma, code, { title })
  }

  await upsertOptionTranslation(prisma, 'Q104', 1, { label: { pt_BR: 'Google / Busca orgânica', en_US: 'Google / Organic search', es_ES: 'Google / Búsqueda orgánica', it_IT: 'Google / Ricerca organica' } })
  await upsertOptionTranslation(prisma, 'Q104', 2, { label: { pt_BR: 'LinkedIn', en_US: 'LinkedIn', es_ES: 'LinkedIn', it_IT: 'LinkedIn' } })
  await upsertOptionTranslation(prisma, 'Q104', 3, { label: { pt_BR: 'Indicação de um amigo ou colega', en_US: 'Friend or colleague referral', es_ES: 'Recomendación de un amigo', it_IT: 'Raccomandazione di un amico' } })
  await upsertOptionTranslation(prisma, 'Q104', 4, { label: { pt_BR: 'Redes sociais (Instagram, Facebook, etc.)', en_US: 'Social media (Instagram, Facebook, etc.)', es_ES: 'Redes sociales (Instagram, Facebook, etc.)', it_IT: 'Social media (Instagram, Facebook, ecc.)' } })
  await upsertOptionTranslation(prisma, 'Q104', 5, { label: { pt_BR: 'Outro', en_US: 'Other', es_ES: 'Otro', it_IT: 'Altro' } })

  await syncRefactorTranslations(prisma)
  await applyCopywritingReviewV1(prisma)
}
