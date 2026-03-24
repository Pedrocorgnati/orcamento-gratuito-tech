'use client'

import { Card } from '@/components/ui/Card'
import { ComplexityLevel } from '@/lib/enums'
import { getFeatureIcon } from '@/lib/result/featureIconMap'
import { COMPLEXITY_LABELS, COMPLEXITY_BORDER_COLORS } from '@/lib/constants/complexity-labels'
import { useTranslations } from 'next-intl'

interface ScopeStoryCardProps {
  scopeStory: string
  features: string[]
  /** URL locale (BCP-47), ex: 'pt-BR' */
  locale: string
  /** Nível de complexidade — quando fornecido, exibe badge e borda colorida */
  complexity?: ComplexityLevel | string
  /** Tipo de projeto — quando fornecido, exibe disclaimer de overfitting e features complementares */
  projectType?: string
}

const COMPLEMENTARY_FEATURES = {
  saas: ['features_saas_billing', 'features_saas_multitenancy', 'features_saas_analytics'],
  ecommerce: ['features_ecommerce_search', 'features_ecommerce_reviews', 'features_ecommerce_loyalty'],
  marketplace: ['features_marketplace_escrow', 'features_marketplace_rating', 'features_marketplace_kyc'],
  landing: ['features_landing_ab_test', 'features_landing_heatmap', 'features_landing_chat'],
  internal_tool: ['features_internal_sso', 'features_internal_audit', 'features_internal_export'],
} as const

type ComplementaryFeatureKey = (typeof COMPLEMENTARY_FEATURES)[keyof typeof COMPLEMENTARY_FEATURES][number]

const SCOPE_STORY_TITLE: Record<string, string> = {
  'pt-BR': 'Sobre o seu projeto',
  'en-US': 'About your project',
  'es-ES': 'Sobre tu proyecto',
  'it-IT': 'Sul tuo progetto',
}

const FEATURE_LIST_TITLE: Record<string, string> = {
  'pt-BR': 'Funcionalidades incluídas',
  'en-US': 'Included features',
  'es-ES': 'Funcionalidades incluidas',
  'it-IT': 'Funzionalità incluse',
}

const DISCLAIMER_TEXT: Record<string, string> = {
  'pt-BR': 'Esta é uma estimativa inicial. O valor final pode variar conforme detalhamento do escopo.',
  'en-US': 'This is an initial estimate. The final value may vary based on scope details.',
  'es-ES': 'Esta es una estimación inicial. El valor final puede variar según los detalles del alcance.',
  'it-IT': 'Questa è una stima iniziale. Il valore finale può variare in base ai dettagli dello scope.',
}

// COMPLEXITY_LABELS e COMPLEXITY_BORDER_COLORS importados de @/lib/constants/complexity-labels

export function ScopeStoryCard({ scopeStory, features, locale, complexity, projectType }: ScopeStoryCardProps) {
  const tExtra     = useTranslations('result_extra')
  const title      = SCOPE_STORY_TITLE[locale]   ?? SCOPE_STORY_TITLE['en-US']
  const featTitle  = FEATURE_LIST_TITLE[locale]  ?? FEATURE_LIST_TITLE['en-US']
  const disclaimer = DISCLAIMER_TEXT[locale]     ?? DISCLAIMER_TEXT['en-US']

  const complementaryFeatures: readonly ComplementaryFeatureKey[] = projectType
    ? ((COMPLEMENTARY_FEATURES as Record<string, readonly ComplementaryFeatureKey[]>)[projectType] ?? [])
    : []

  const complexityKey = complexity as string | undefined
  const borderColor = complexityKey ? (COMPLEXITY_BORDER_COLORS[complexityKey] ?? undefined) : undefined
  const complexityLabel = complexityKey
    ? (COMPLEXITY_LABELS[complexityKey]?.[locale] ?? COMPLEXITY_LABELS[complexityKey]?.['en-US'] ?? complexityKey)
    : undefined

  return (
    <Card
      className="p-5 md:p-6 bg-(--color-accent) border border-(--color-border) rounded-xl mt-6 overflow-hidden"
      style={borderColor ? { borderLeft: `4px solid ${borderColor}` } : undefined}
    >
      {/* Badge de complexidade — quando fornecida */}
      {complexityLabel && borderColor && (
        <div className="mb-3">
          <span
            className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
            style={{ backgroundColor: borderColor }}
            aria-label={`Complexidade ${complexityLabel}`}
          >
            {complexityLabel}
          </span>
        </div>
      )}

      {/* Título da seção (h2 — hierarquia abaixo do h1 do ResultCard) */}
      <h2 className="text-base font-semibold text-(--color-text-primary) mb-3">
        {title}
      </h2>

      {/* Narrativa do escopo gerada por generateScopeStory() (FEAT-EE-006) */}
      {scopeStory && (
        <p className="text-(--color-text-secondary) leading-relaxed text-sm md:text-base mb-4">
          {scopeStory}
        </p>
      )}

      {/* Lista de funcionalidades com ícones e stagger (INT-057, FEAT-UX-003) */}
      {features.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xs font-semibold text-(--color-text-secondary) uppercase tracking-wider mb-3">
            {featTitle}
          </h3>
          <ul
            className="space-y-2"
            role="list"
            aria-label={featTitle}
          >
            {features.map((feature, index) => {
              const { icon: FeatureIcon, color } = getFeatureIcon(feature)
              return (
                <li
                  key={`${feature}-${index}`}
                  className="feature-item-stagger flex items-center gap-2 text-sm text-(--color-text-secondary)"
                >
                  <FeatureIcon
                    size={16}
                    color={color}
                    aria-hidden="true"
                    className="shrink-0"
                  />
                  <span className="capitalize">{feature}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Overfitting disclaimer — features complementares por projectType */}
      {projectType && complementaryFeatures.length > 0 && (
        <div className="mt-6 rounded-lg bg-amber-50 border border-amber-200 p-4">
          <p className="text-sm text-amber-800">
            <strong>{tExtra('overfitting_disclaimer_title')}</strong>{' '}
            {tExtra('overfitting_disclaimer_body')}
          </p>
          <div className="mt-3">
            <p className="text-xs font-medium text-amber-700 uppercase tracking-wide">
              {tExtra('complementary_features_title')}
            </p>
            <ul className="mt-2 space-y-1">
              {complementaryFeatures.map((featureKey) => (
                <li key={featureKey} className="flex items-center gap-2 text-sm text-amber-800">
                  <span className="text-amber-500" aria-hidden="true">→</span>
                  {tExtra(featureKey)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Disclaimer INT-102 — reforço após a narrativa de escopo */}
      <p className="text-xs text-(--color-text-muted) mt-4 pt-3 border-t border-(--color-border) italic">
        {disclaimer}
      </p>
    </Card>
  )
}
