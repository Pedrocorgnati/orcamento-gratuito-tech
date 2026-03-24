/**
 * JSON-LD schemas para SEO estruturado.
 * Uso: <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
 */

const BASE_URL = (() => {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? 'https://orcamentogratuito.tech'
  return url.replace(/\/$/, '')
})()

/**
 * WebApplication schema para a landing page (/).
 * INT-105: SEO otimizado nos 4 idiomas.
 */
export function getWebApplicationSchema(locale: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Budget Free Engine — Orçamento Gratuito Tech',
    url: `${BASE_URL}/${locale}`,
    description:
      'Ferramenta gratuita para calcular orçamento de projetos de software. 42 perguntas, estimativa em BRL/USD/EUR.',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BRL',
    },
    inLanguage: locale,
  }
}

/**
 * SoftwareApplication schema — para uso em páginas de destaque do produto.
 */
export function getSoftwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Budget Free Engine',
    operatingSystem: 'Web',
    applicationCategory: 'BusinessApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BRL',
    },
  }
}

/**
 * FAQPage schema para a página do flow (/).
 * Perguntas frequentes traduzidas para os 4 locales.
 * Fallback para pt-BR se locale não reconhecido.
 */
export function getFAQSchema(locale: string) {
  const faqs: Record<string, Array<{ q: string; a: string }>> = {
    'pt-BR': [
      { q: 'O orçamento é realmente gratuito?', a: 'Sim, 100% gratuito, sem cadastro obrigatório.' },
      { q: 'Quantas perguntas são feitas?', a: 'São 42 perguntas adaptativas em 8 blocos temáticos.' },
      { q: 'Quais moedas são suportadas?', a: 'BRL, USD e EUR com conversão automática.' },
    ],
    'en-US': [
      { q: 'Is the estimate really free?', a: 'Yes, 100% free, no mandatory registration.' },
      { q: 'How many questions are asked?', a: '42 adaptive questions in 8 thematic blocks.' },
      { q: 'Which currencies are supported?', a: 'BRL, USD and EUR with automatic conversion.' },
    ],
    'es-ES': [
      { q: '¿El presupuesto es realmente gratuito?', a: 'Sí, 100% gratuito, sin registro obligatorio.' },
      { q: '¿Cuántas preguntas se hacen?', a: '42 preguntas adaptativas en 8 bloques temáticos.' },
      { q: '¿Qué monedas están soportadas?', a: 'BRL, USD y EUR con conversión automática.' },
    ],
    'it-IT': [
      { q: 'Il preventivo è davvero gratuito?', a: 'Sì, 100% gratuito, senza registrazione obbligatoria.' },
      { q: 'Quante domande vengono poste?', a: '42 domande adattive in 8 blocchi tematici.' },
      { q: 'Quali valute sono supportate?', a: 'BRL, USD ed EUR con conversione automatica.' },
    ],
  }

  const items = faqs[locale] ?? faqs['pt-BR']
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }
}
