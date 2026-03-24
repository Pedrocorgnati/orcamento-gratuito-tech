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

export function ResultCard({
  estimation,
  exchangeRates,
  locale,
  leadCaptureHref,
  completedCount,
}: ResultCardProps) {
  const projectLabels = PROJECT_TYPE_LABELS[estimation.projectType]
  const projectLabel  = projectLabels?.[locale] ?? projectLabels?.['en-US'] ?? estimation.projectType
  const cardTitle     = CARD_TITLE[locale]   ?? CARD_TITLE['en-US']
  const ctaLabel      = CTA_LABEL[locale]    ?? CTA_LABEL['en-US']

  return (
    <Card variant="elevated" padding="none" className="overflow-hidden">
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-(--color-text-primary) leading-tight">
            {cardTitle}
          </h1>
          <p className="text-(--color-text-secondary) mt-1 text-sm">{projectLabel}</p>
        </div>

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
        <div className="mt-8">
          <Link
            href={leadCaptureHref}
            className={`${buttonVariants({ variant: 'primary', size: 'lg' })} w-full md:w-auto`}
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </Card>
  )
}
