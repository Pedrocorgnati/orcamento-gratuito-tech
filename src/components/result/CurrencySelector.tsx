'use client'

import { useState } from 'react'
import { Currency } from '@/lib/enums'
import type { ExchangeRateItem } from '@/lib/types'
import { trackCurrencyChanged } from '@/lib/analytics/events'

interface CurrencySelectorProps {
  defaultCurrency: Currency
  /** Preço mínimo na moeda base (BRL) */
  priceMinBrl: number
  /** Preço máximo na moeda base (BRL) */
  priceMaxBrl: number
  exchangeRates: ExchangeRateItem[]
  /** URL locale (BCP-47), ex: 'pt-BR' */
  locale: string
  onCurrencyChange?: (currency: Currency, priceMin: number, priceMax: number) => void
}

const CURRENCY_LABELS: Record<Currency, Record<string, string>> = {
  [Currency.BRL]: { 'pt-BR': 'BRL — Real Brasileiro', 'en-US': 'BRL — Brazilian Real',    'es-ES': 'BRL — Real Brasileño',   'it-IT': 'BRL — Real Brasiliano' },
  [Currency.USD]: { 'pt-BR': 'USD — Dólar Americano', 'en-US': 'USD — US Dollar',          'es-ES': 'USD — Dólar Estadounidense', 'it-IT': 'USD — Dollaro Americano' },
  [Currency.EUR]: { 'pt-BR': 'EUR — Euro',             'en-US': 'EUR — Euro',               'es-ES': 'EUR — Euro',              'it-IT': 'EUR — Euro' },
}

const DISPLAY_LABEL: Record<string, string> = {
  'pt-BR': 'Exibir em:',
  'en-US': 'Display in:',
  'es-ES': 'Mostrar en:',
  'it-IT': 'Mostra in:',
}

const ARIA_LABEL: Record<string, string> = {
  'pt-BR': 'Selecionar moeda',
  'en-US': 'Select currency',
  'es-ES': 'Seleccionar moneda',
  'it-IT': 'Seleziona valuta',
}

export function CurrencySelector({
  defaultCurrency,
  priceMinBrl,
  priceMaxBrl,
  exchangeRates,
  locale,
  onCurrencyChange,
}: CurrencySelectorProps) {
  const [selected, setSelected] = useState<Currency>(defaultCurrency)

  const displayLabel = DISPLAY_LABEL[locale] ?? DISPLAY_LABEL['en-US']
  const ariaLabel    = ARIA_LABEL[locale]    ?? ARIA_LABEL['en-US']

  function handleChange(currency: Currency) {
    setSelected(currency)
    trackCurrencyChanged({ currency })

    let min = priceMinBrl
    let max = priceMaxBrl

    if (currency !== Currency.BRL) {
      const rate = exchangeRates.find(
        (r) => r.from_currency === 'BRL' && r.to_currency === currency
      )
      if (rate) {
        min = Math.round(priceMinBrl * rate.rate)
        max = Math.round(priceMaxBrl * rate.rate)
      }
      // Sem taxa: fallback silencioso — mantém BRL
    }

    onCurrencyChange?.(currency, min, max)
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="currency-select" className="text-sm text-(--color-text-secondary) whitespace-nowrap">
        {displayLabel}
      </label>
      <select
        id="currency-select"
        value={selected}
        onChange={(e) => handleChange(e.target.value as Currency)}
        className="text-sm border border-(--color-border) rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-(--color-primary) bg-(--color-background)"
        aria-label={ariaLabel}
      >
        {Object.values(Currency).map((currency) => (
          <option key={currency} value={currency}>
            {CURRENCY_LABELS[currency]?.[locale] ?? CURRENCY_LABELS[currency]['en-US']}
          </option>
        ))}
      </select>
    </div>
  )
}
