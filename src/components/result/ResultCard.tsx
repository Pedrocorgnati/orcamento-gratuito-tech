import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { buttonVariants } from '@/components/ui/Button'
import { EstimationDisplay } from './EstimationDisplay'
import { ScopeStoryCard } from './ScopeStoryCard'
import { SocialProofSection } from './SocialProofSection'
import type { EstimationResult, ExchangeRateItem } from '@/lib/types'

interface ResultCardProps {
  estimation: EstimationResult
  exchangeRates: ExchangeRateItem[]
  /** URL locale (BCP-47), ex: 'pt-BR' */
  locale: string
  leadCaptureHref: string
  completedCount: number
}

const PROJECT_TYPE_LABELS: Record<string, Record<string, string>> = {
  WEBSITE:       { 'pt-BR': 'Site Institucional', 'en-US': 'Institutional Website', 'es-ES': 'Sitio Institucional', 'it-IT': 'Sito Istituzionale' },
  ECOMMERCE:     { 'pt-BR': 'E-Commerce',          'en-US': 'E-Commerce',             'es-ES': 'Comercio Electrónico', 'it-IT': 'E-Commerce' },
  WEB_APP:       { 'pt-BR': 'Sistema Web',          'en-US': 'Web Application',        'es-ES': 'Aplicación Web',      'it-IT': 'Applicazione Web' },
  MOBILE_APP:    { 'pt-BR': 'Aplicativo Mobile',    'en-US': 'Mobile Application',     'es-ES': 'Aplicación Móvil',    'it-IT': 'Applicazione Mobile' },
  AUTOMATION_AI: { 'pt-BR': 'Automação com IA',     'en-US': 'AI Automation',          'es-ES': 'Automatización con IA','it-IT': 'Automazione con IA' },
  MARKETPLACE:   { 'pt-BR': 'Marketplace',          'en-US': 'Marketplace',            'es-ES': 'Marketplace',         'it-IT': 'Marketplace' },
  CRYPTO:        { 'pt-BR': 'Plataforma Crypto / Web3', 'en-US': 'Crypto / Web3 Platform', 'es-ES': 'Plataforma Crypto / Web3', 'it-IT': 'Piattaforma Crypto / Web3' },
  BROWSER_EXT:   { 'pt-BR': 'Extensão de Browser',  'en-US': 'Browser Extension',      'es-ES': 'Extensión de Navegador', 'it-IT': 'Estensione Browser' },
}

const CARD_TITLE: Record<string, string> = {
  'pt-BR': 'Seu Orçamento Estimado',
  'en-US': 'Your Estimated Budget',
  'es-ES': 'Tu Presupuesto Estimado',
  'it-IT': 'Il Tuo Preventivo Stimato',
}

const CTA_LABEL: Record<string, string> = {
  'pt-BR': 'Receber análise completa',
  'en-US': 'Receive full analysis',
  'es-ES': 'Recibir análisis completo',
  'it-IT': 'Ricevi analisi completa',
}

const BREAKDOWN_TITLE: Record<string, string> = {
  'pt-BR': 'Seu orçamento inclui',
  'en-US': 'Your estimate includes',
  'es-ES': 'Tu presupuesto incluye',
  'it-IT': 'Il preventivo include',
}

export function ResultCard({
  estimation,
  exchangeRates,
  locale,
  leadCaptureHref,
  completedCount,
}: ResultCardProps) {
  const projectLabels = PROJECT_TYPE_LABELS[estimation.projectType]
  const projectLabel  = projectLabels?.[locale] ?? projectLabels?.['en-US'] ?? estimation.projectType
  const projectTypes = estimation.projectTypes ?? [estimation.projectType]
  const multiProjectLabel = projectTypes
    .map((projectType) => {
      const labels = PROJECT_TYPE_LABELS[projectType]
      return labels?.[locale] ?? labels?.['en-US'] ?? projectType
    })
    .join(' + ')
  const cardTitle     = CARD_TITLE[locale]   ?? CARD_TITLE['en-US']
  const ctaLabel      = CTA_LABEL[locale]    ?? CTA_LABEL['en-US']
  const breakdownTitle = BREAKDOWN_TITLE[locale] ?? BREAKDOWN_TITLE['en-US']
  const hasBreakdown = projectTypes.length > 1 && (estimation.breakdown?.length ?? 0) > 0
  const breakdownCurrencyFormatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: estimation.currency,
    maximumFractionDigits: 0,
  })

  return (
    <Card variant="elevated" padding="none" data-testid="result-card" className="overflow-hidden">
      <div className="p-6 md:p-8">
        {/* Header */}
        <div data-testid="result-header" className="mb-6">
          <h1 data-testid="result-title" className="text-2xl md:text-3xl font-bold text-(--color-text-primary) leading-tight">
            {cardTitle}
          </h1>
          <p data-testid="result-project-label" className="text-(--color-text-secondary) mt-1 text-sm">{projectLabel}</p>
        </div>

        {hasBreakdown && (
          <div data-testid="result-multi-breakdown" className="mb-6 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-(--color-text-secondary)">
              {breakdownTitle}
            </p>
            <p className="mt-1 text-sm font-medium text-(--color-text-primary)">
              {multiProjectLabel}
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {estimation.breakdown?.map((item) => {
                const labels = PROJECT_TYPE_LABELS[item.projectType]
                const label = labels?.[locale] ?? labels?.['en-US'] ?? item.projectType
                return (
                    <div key={item.projectType} className="rounded-xl border border-(--color-border) bg-(--color-background) p-3">
                      <p className="text-sm font-semibold text-(--color-text-primary)">{label}</p>
                      <p className="mt-1 text-sm text-(--color-text-secondary)">
                        {breakdownCurrencyFormatter.format(item.priceMin)} - {breakdownCurrencyFormatter.format(item.priceMax)}
                      </p>
                      <p className="text-xs text-(--color-text-muted)">
                        {item.daysMin} - {item.daysMax} dias
                      </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Faixa, prazo, complexidade, disclaimer */}
        <EstimationDisplay
          estimation={estimation}
          exchangeRates={exchangeRates}
          locale={locale}
        />

        {/* Narrativa do escopo + lista de funcionalidades (INT-056, INT-057) */}
        <ScopeStoryCard
          scopeStory={estimation.scopeStory}
          features={estimation.features}
          locale={locale}
          complexity={estimation.complexity}
        />

        {/* Social proof: contador real + depoimentos (INT-077, FEAT-EE-008) */}
        <SocialProofSection completedCount={completedCount} locale={locale} />

        {/* CTA */}
        <div data-testid="result-cta-wrapper" className="mt-8">
          <Link
            href={leadCaptureHref}
            data-testid="result-lead-capture-cta"
            className={`${buttonVariants({ variant: 'primary', size: 'lg' })} w-full md:w-auto`}
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </Card>
  )
}
