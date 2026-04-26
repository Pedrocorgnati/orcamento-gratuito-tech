// src/lib/estimation/scope-story.ts
import 'server-only'
import { Locale, ProjectType } from '@/lib/enums'

// ─────────────────────────────────────────────────────────────────────────────
// Labels de tipo de projeto por locale (INT-056)
// ─────────────────────────────────────────────────────────────────────────────

const PROJECT_TYPE_LABELS: Record<ProjectType, Record<Locale, string>> = {
  [ProjectType.WEBSITE]: {
    [Locale.PT_BR]: 'Site Institucional',
    [Locale.EN_US]: 'Institutional Website',
    [Locale.ES_ES]: 'Sitio Institucional',
    [Locale.IT_IT]: 'Sito Istituzionale',
  },
  [ProjectType.ECOMMERCE]: {
    [Locale.PT_BR]: 'E-Commerce',
    [Locale.EN_US]: 'E-Commerce',
    [Locale.ES_ES]: 'Comercio Electrónico',
    [Locale.IT_IT]: 'E-Commerce',
  },
  [ProjectType.WEB_APP]: {
    [Locale.PT_BR]: 'Sistema Web',
    [Locale.EN_US]: 'Web Application',
    [Locale.ES_ES]: 'Aplicación Web',
    [Locale.IT_IT]: 'Applicazione Web',
  },
  [ProjectType.MOBILE_APP]: {
    [Locale.PT_BR]: 'Aplicativo Mobile',
    [Locale.EN_US]: 'Mobile Application',
    [Locale.ES_ES]: 'Aplicación Móvil',
    [Locale.IT_IT]: 'Applicazione Mobile',
  },
  [ProjectType.AUTOMATION_AI]: {
    [Locale.PT_BR]: 'Automação com IA',
    [Locale.EN_US]: 'AI Automation',
    [Locale.ES_ES]: 'Automatización con IA',
    [Locale.IT_IT]: 'Automazione con IA',
  },
  [ProjectType.MARKETPLACE]: {
    [Locale.PT_BR]: 'Marketplace',
    [Locale.EN_US]: 'Marketplace',
    [Locale.ES_ES]: 'Marketplace',
    [Locale.IT_IT]: 'Marketplace',
  },
  [ProjectType.CRYPTO]: {
    [Locale.PT_BR]: 'Plataforma Crypto / Web3',
    [Locale.EN_US]: 'Crypto / Web3 Platform',
    [Locale.ES_ES]: 'Plataforma Crypto / Web3',
    [Locale.IT_IT]: 'Piattaforma Crypto / Web3',
  },
  [ProjectType.BROWSER_EXT]: {
    [Locale.PT_BR]: 'Extensão de Browser',
    [Locale.EN_US]: 'Browser Extension',
    [Locale.ES_ES]: 'Extensión de Navegador',
    [Locale.IT_IT]: 'Estensione Browser',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Templates narrativos por locale (INT-057)
// ─────────────────────────────────────────────────────────────────────────────

const STORY_TEMPLATES: Record<Locale, (projectLabel: string, featureList: string) => string> = {
  [Locale.PT_BR]: (p, f) =>
    `Seu projeto é um ${p} com os seguintes módulos: ${f}. O escopo inclui todas as funcionalidades listadas acima, desenvolvidas com foco em qualidade, segurança e escalabilidade.`,
  [Locale.EN_US]: (p, f) =>
    `Your project is a ${p} with the following modules: ${f}. The scope includes all features listed above, built with focus on quality, security, and scalability.`,
  [Locale.ES_ES]: (p, f) =>
    `Tu proyecto es un ${p} con los siguientes módulos: ${f}. El alcance incluye todas las funcionalidades listadas, desarrolladas con foco en calidad, seguridad y escalabilidad.`,
  [Locale.IT_IT]: (p, f) =>
    `Il tuo progetto è un ${p} con i seguenti moduli: ${f}. Lo scope include tutte le funzionalità elencate, sviluppate con focus su qualità, sicurezza e scalabilità.`,
}

// ─────────────────────────────────────────────────────────────────────────────
// Narrativa do cliente (Q096–Q099 do bloco NARRATIVE)
// ─────────────────────────────────────────────────────────────────────────────

export type UserNarrative = {
  vision?: string | null      // Q096 — frase resumo (obrigatória)
  mustHaves?: string | null   // Q097 — features must-have (opcional)
  references?: string | null  // Q098 — produtos referência (opcional)
  openNotes?: string | null   // Q099 — observações livres (opcional)
}

const NARRATIVE_HEADINGS: Record<Locale, {
  section: string
  vision: string
  mustHaves: string
  references: string
  openNotes: string
}> = {
  [Locale.PT_BR]: {
    section: 'Como o cliente descreveu',
    vision: 'Em uma frase',
    mustHaves: 'Funcionalidades obrigatórias',
    references: 'Referências',
    openNotes: 'Notas adicionais',
  },
  [Locale.EN_US]: {
    section: 'In the customer’s words',
    vision: 'In one sentence',
    mustHaves: 'Must-have features',
    references: 'References',
    openNotes: 'Additional notes',
  },
  [Locale.ES_ES]: {
    section: 'En palabras del cliente',
    vision: 'En una frase',
    mustHaves: 'Funcionalidades obligatorias',
    references: 'Referencias',
    openNotes: 'Notas adicionales',
  },
  [Locale.IT_IT]: {
    section: 'Nelle parole del cliente',
    vision: 'In una frase',
    mustHaves: 'Funzionalità obbligatorie',
    references: 'Riferimenti',
    openNotes: 'Note aggiuntive',
  },
}

/**
 * Sanitiza valor textual antes de embutir no scope_story.
 * - Trim
 * - Colapsa whitespace
 * - Remove caracteres de controle (preserva quebras de linha)
 * - Trunca em maxLen para evitar inflar o template (defesa em profundidade —
 *   o limite real é validado no submit via TEXT_INPUT_LIMITS_BY_CODE)
 */
function sanitizeNarrativeField(value: string | null | undefined, maxLen: number): string {
  if (!value) return ''
  // eslint-disable-next-line no-control-regex
  const cleaned = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
  const trimmed = cleaned.trim()
  if (trimmed.length === 0) return ''
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed
}

function hasNarrativeContent(narrative: UserNarrative | null | undefined): boolean {
  if (!narrative) return false
  return Boolean(
    sanitizeNarrativeField(narrative.vision, 240) ||
    sanitizeNarrativeField(narrative.mustHaves, 800) ||
    sanitizeNarrativeField(narrative.references, 1500) ||
    sanitizeNarrativeField(narrative.openNotes, 1500)
  )
}

function appendNarrativeSection(story: string, narrative: UserNarrative, locale: Locale): string {
  const headings = NARRATIVE_HEADINGS[locale] ?? NARRATIVE_HEADINGS[Locale.PT_BR]
  const lines: string[] = []

  const vision = sanitizeNarrativeField(narrative.vision, 240)
  const mustHaves = sanitizeNarrativeField(narrative.mustHaves, 800)
  const references = sanitizeNarrativeField(narrative.references, 1500)
  const openNotes = sanitizeNarrativeField(narrative.openNotes, 1500)

  if (vision) lines.push(`${headings.vision}: ${vision}`)
  if (mustHaves) lines.push(`${headings.mustHaves}: ${mustHaves}`)
  if (references) lines.push(`${headings.references}: ${references}`)
  if (openNotes) lines.push(`${headings.openNotes}: ${openNotes}`)

  if (lines.length === 0) return story

  return `${story}\n\n${headings.section}\n${lines.join('\n')}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Função pública
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Gera narrativa localizada do escopo estimado.
 * Função pura — sem side effects.
 *
 * INT-056: narrativa visual do escopo
 * INT-057: lista de funcionalidades automática
 * NARRATIVE-v4: anexa Q096–Q099 (palavras do cliente) ao final, sanitizadas.
 */
export function generateScopeStory(
  features: string[],
  projectType: ProjectType | ProjectType[],
  locale: Locale,
  userNarrative?: UserNarrative | null
): string {
  const projectTypes = Array.isArray(projectType) ? projectType : [projectType]
  const projectLabel = projectTypes
    .map((type) =>
      PROJECT_TYPE_LABELS[type]?.[locale]
      ?? PROJECT_TYPE_LABELS[type]?.[Locale.PT_BR]
      ?? 'Projeto'
    )
    .join(' + ')

  const featureList = features.length > 0 ? features.join(', ') : '—'
  const template    = STORY_TEMPLATES[locale] ?? STORY_TEMPLATES[Locale.PT_BR]
  const baseStory   = template(projectLabel, featureList)

  if (!hasNarrativeContent(userNarrative)) return baseStory

  return appendNarrativeSection(baseStory, userNarrative as UserNarrative, locale)
}

/**
 * Extrai a narrativa do cliente a partir de respostas Q096–Q099 do banco.
 * Retorna null se nenhum dos campos tiver conteúdo.
 */
export function extractUserNarrativeFromAnswers(
  answers: Array<{ question: { code: string }; text_value: string | null }>
): UserNarrative | null {
  const byCode: Record<string, string | null> = {}
  for (const a of answers) {
    if (['Q096', 'Q097', 'Q098', 'Q099'].includes(a.question.code)) {
      byCode[a.question.code] = a.text_value
    }
  }

  const narrative: UserNarrative = {
    vision: byCode.Q096 ?? null,
    mustHaves: byCode.Q097 ?? null,
    references: byCode.Q098 ?? null,
    openNotes: byCode.Q099 ?? null,
  }

  return hasNarrativeContent(narrative) ? narrative : null
}
