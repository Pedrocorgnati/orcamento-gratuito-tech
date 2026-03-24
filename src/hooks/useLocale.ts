'use client'

import { useLocale as useNextIntlLocale } from 'next-intl'
import {
  Locale,
  Currency,
  LOCALE_CURRENCY_MAP,
  LOCALE_BCP47_MAP,
  LOCALE_DEFAULT,
} from '@/lib/enums'

export interface UseLocaleReturn {
  /** Locale enum do sistema */
  locale: Locale
  /** Moeda padrao para o locale atual */
  currency: Currency
  /** Verifica se um valor e um Locale valido */
  isLocale: (value: string) => value is Locale
  /** Tag BCP-47 do locale atual (ex: "pt-BR") */
  bcp47: string
}

/**
 * Wrapper sobre next-intl useLocale com mapeamento para enums do dominio.
 * Faz fallback para LOCALE_DEFAULT se o locale do next-intl nao for reconhecido.
 */
export function useLocale(): UseLocaleReturn {
  const rawLocale = useNextIntlLocale()

  // Tenta mapear o locale do next-intl para o enum
  const localeValues = Object.values(Locale) as string[]
  const bcp47Values = Object.values(LOCALE_BCP47_MAP) as string[]

  let locale: Locale = LOCALE_DEFAULT

  // Tenta match direto com enum value (ex: "pt_BR")
  if (localeValues.includes(rawLocale)) {
    locale = rawLocale as Locale
  } else {
    // Tenta match com BCP-47 (ex: "pt-BR")
    const entry = Object.entries(LOCALE_BCP47_MAP).find(
      ([, bcp47]) => bcp47 === rawLocale
    )
    if (entry) {
      locale = entry[0] as Locale
    }
  }

  const currency = LOCALE_CURRENCY_MAP[locale]
  const bcp47 = LOCALE_BCP47_MAP[locale]

  function isLocale(value: string): value is Locale {
    return localeValues.includes(value) || bcp47Values.includes(value)
  }

  return { locale, currency, isLocale, bcp47 }
}
