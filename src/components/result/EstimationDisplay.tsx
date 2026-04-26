'use client'

import { useState } from 'react'
import { ComplexityBadge } from './ComplexityBadge'
import { CurrencySelector } from './CurrencySelector'
import { DisclaimerBanner } from './DisclaimerBanner'
import { formatCurrency, formatDaysRange } from '@/lib/utils/format'
import type { EstimationResult, ExchangeRateItem } from '@/lib/types'
import type { Currency } from '@/lib/enums'

interface EstimationDisplayProps {
  estimation: EstimationResult
  exchangeRates: ExchangeRateItem[]
  /** URL locale (BCP-47) para labels de UI, ex: 'pt-BR' */
  locale: string
}

const INVESTMENT_LABEL: Record<string, string> = {
  'pt-BR': 'Faixa de investimento',
  'en-US': 'Investment range',
  'es-ES': 'Rango de inversión',
  'it-IT': 'Fascia di investimento',
}

const TIMELINE_LABEL: Record<string, string> = {
  'pt-BR': 'Prazo estimado',
  'en-US': 'Estimated timeline',
  'es-ES': 'Plazo estimado',
  'it-IT': 'Tempistica stimata',
}

const COMPLEXITY_SECTION_LABEL: Record<string, string> = {
  'pt-BR': 'Complexidade',
  'en-US': 'Complexity',
  'es-ES': 'Complejidad',
  'it-IT': 'Complessità',
}

export function EstimationDisplay({ estimation, exchangeRates, locale }: EstimationDisplayProps) {
  const [displayPriceMin, setDisplayPriceMin] = useState(estimation.priceMin)
  const [displayPriceMax, setDisplayPriceMax] = useState(estimation.priceMax)
  const [displayCurrency, setDisplayCurrency] = useState<Currency>(estimation.currency)

  function handleCurrencyChange(currency: Currency, min: number, max: number) {
    setDisplayCurrency(currency)
    setDisplayPriceMin(min)
    setDisplayPriceMax(max)
  }

  // formatCurrency usa estimation.locale (enum interno)
  const formattedMin = formatCurrency(displayPriceMin, displayCurrency, estimation.locale)
  const formattedMax = formatCurrency(displayPriceMax, displayCurrency, estimation.locale)
  const formattedDays = formatDaysRange(estimation.daysMin, estimation.daysMax, estimation.locale)

  const investmentLabel   = INVESTMENT_LABEL[locale]   ?? INVESTMENT_LABEL['en-US']
  const timelineLabel     = TIMELINE_LABEL[locale]     ?? TIMELINE_LABEL['en-US']
  const complexityLabel   = COMPLEXITY_SECTION_LABEL[locale] ?? COMPLEXITY_SECTION_LABEL['en-US']

  return (
    <div data-testid="result-estimation" className="space-y-5">
      {/* Seletor de moeda */}
      <div data-testid="result-currency-selector-wrapper" className="flex justify-end">
        <CurrencySelector
          defaultCurrency={estimation.currency}
          priceMinBrl={estimation.priceMin}
          priceMaxBrl={estimation.priceMax}
          exchangeRates={exchangeRates}
          locale={locale}
          onCurrencyChange={handleCurrencyChange}
        />
      </div>

      {/* Faixa de investimento */}
      <div data-testid="result-investment-range">
        <p className="text-xs font-semibold text-(--color-text-secondary) uppercase tracking-wider mb-1">
          {investmentLabel}
        </p>
        <p data-testid="result-investment-range-value" className="text-3xl md:text-4xl font-bold text-(--color-text-primary) leading-tight">
          {formattedMin}{' '}
          <span className="text-(--color-text-muted) font-normal">–</span>{' '}
          {formattedMax}
        </p>
      </div>

      {/* Prazo estimado */}
      <div data-testid="result-timeline">
        <p className="text-xs font-semibold text-(--color-text-secondary) uppercase tracking-wider mb-1">
          {timelineLabel}
        </p>
        <p data-testid="result-timeline-value" className="text-2xl font-semibold text-(--color-text-secondary)">
          {formattedDays}
        </p>
      </div>

      {/* Complexidade */}
      <div data-testid="result-complexity" className="flex flex-col md:flex-row md:items-center gap-2">
        <p className="text-xs font-semibold text-(--color-text-secondary) uppercase tracking-wider">
          {complexityLabel}
        </p>
        <ComplexityBadge complexity={estimation.complexity} locale={locale} />
      </div>

      {/* Disclaimer INT-102 — obrigatório (CMP-026) */}
      <DisclaimerBanner locale={locale} />
    </div>
  )
}
