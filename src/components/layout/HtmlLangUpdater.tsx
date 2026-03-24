'use client'

import { useEffect } from 'react'

/**
 * Atualiza o atributo `lang` do elemento <html> para o locale atual.
 *
 * Necessário porque o RootLayout define lang="pt-BR" estático, mas o
 * LocaleLayout serve pt-BR, en-US, es-ES e it-IT dinamicamente.
 * Screen readers anunciam o idioma correto somente quando <html lang>
 * corresponde ao conteúdo — WCAG 3.1.1 (Language of Page).
 *
 * Mapeamento BCP-47 → código HTML lang (ambos são BCP-47, passados direto).
 */
export function HtmlLangUpdater({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return null
}
