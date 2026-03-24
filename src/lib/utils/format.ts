import { Currency, Locale, LOCALE_BCP47_MAP } from '@/lib/enums'

/**
 * Formata valor monetario usando Intl.NumberFormat.
 * Fallback para string simples se o locale/currency nao for suportado.
 */
export function formatCurrency(
  amount: number,
  currency: Currency,
  locale: Locale
): string {
  try {
    return new Intl.NumberFormat(LOCALE_BCP47_MAP[locale], {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toLocaleString()}`
  }
}

/**
 * Formata faixa de preco (ex: "R$ 5.000 – R$ 10.000").
 */
export function formatCurrencyRange(
  min: number,
  max: number,
  currency: Currency,
  locale: Locale
): string {
  return `${formatCurrency(min, currency, locale)} – ${formatCurrency(max, currency, locale)}`
}

/**
 * Formata uma data usando Intl.DateTimeFormat.
 * Fallback para ISO string se o locale nao for suportado.
 */
export function formatDate(
  date: Date | string,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat(LOCALE_BCP47_MAP[locale], {
      dateStyle: 'medium',
      ...options,
    }).format(d)
  } catch {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toISOString().split('T')[0]
  }
}

const DAYS_LABEL: Record<Locale, { singular: string; plural: string }> = {
  [Locale.PT_BR]: { singular: 'dia', plural: 'dias' },
  [Locale.EN_US]: { singular: 'day', plural: 'days' },
  [Locale.ES_ES]: { singular: 'día', plural: 'días' },
  [Locale.IT_IT]: { singular: 'giorno', plural: 'giorni' },
}

/**
 * Formata quantidade de dias (ex: "30 dias", "30 days").
 */
export function formatDays(days: number, locale: Locale): string {
  const labels = DAYS_LABEL[locale] ?? DAYS_LABEL[Locale.PT_BR]
  const unit = days === 1 ? labels.singular : labels.plural
  return `${days} ${unit}`
}

/**
 * Formata faixa de dias (ex: "15 – 30 dias").
 */
export function formatDaysRange(
  min: number,
  max: number,
  locale: Locale
): string {
  // Extrai a unidade de "dias" a partir do formatDays do max
  const maxFormatted = formatDays(max, locale)
  const unit = maxFormatted.replace(String(max), '').trim()
  return `${min} – ${max} ${unit}`
}
