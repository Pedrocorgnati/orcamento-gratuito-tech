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
// Função pública
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Gera narrativa localizada do escopo estimado.
 * Função pura — sem side effects.
 *
 * INT-056: narrativa visual do escopo
 * INT-057: lista de funcionalidades automática
 */
export function generateScopeStory(
  features: string[],
  projectType: ProjectType,
  locale: Locale
): string {
  const projectLabel = PROJECT_TYPE_LABELS[projectType]?.[locale]
    ?? PROJECT_TYPE_LABELS[projectType]?.[Locale.PT_BR]
    ?? 'Projeto'

  const featureList = features.length > 0 ? features.join(', ') : '—'
  const template    = STORY_TEMPLATES[locale] ?? STORY_TEMPLATES[Locale.PT_BR]

  return template(projectLabel, featureList)
}
