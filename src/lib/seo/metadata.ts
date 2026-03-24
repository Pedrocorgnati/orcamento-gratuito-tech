import type { Metadata } from 'next'
import { routing } from '@/i18n/routing'

const BASE_URL = (() => {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? 'https://orcamentogratuito.tech'
  // Garantir que não termine com barra
  return url.replace(/\/$/, '')
})()

type Locale = (typeof routing.locales)[number]

interface PageSEOProps {
  locale: Locale | string
  pagePath: string // ex: '/flow', '/privacy'
  title: string
  description: string
  noIndex?: boolean // true para /admin, /result, /lead-capture
  ogImageUrl?: string // URL customizada de OG image (ex: /api/og/result?...)
}

/**
 * Gera metadata completa para páginas Next.js:
 * - hreflang alternates para todos os locales
 * - OG image (estática ou dinâmica via next/og)
 * - Twitter card
 * - noIndex opcional
 *
 * Integração: importar em generateMetadata() das pages.
 * Compatível com src/lib/metadata.ts existente (geração de hreflang).
 */
export function buildMetadata({
  locale,
  pagePath,
  title,
  description,
  noIndex = false,
  ogImageUrl,
}: PageSEOProps): Metadata {
  const canonicalUrl = `${BASE_URL}/${locale}${pagePath === '/' ? '' : pagePath}`

  // hreflang alternates para SEO multilíngue
  const languages: Record<string, string> = {}
  for (const loc of routing.locales) {
    languages[loc] = `${BASE_URL}/${loc}${pagePath === '/' ? '' : pagePath}`
  }
  languages['x-default'] = `${BASE_URL}/${routing.defaultLocale}${pagePath === '/' ? '' : pagePath}`

  const ogImage = ogImageUrl ?? `${BASE_URL}/images/og-image.jpg`

  return {
    title,
    description,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: canonicalUrl,
      languages,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Orçamento Gratuito Tech',
      locale: (locale as string).replace('-', '_'),
      alternateLocale: routing.locales
        .filter((l) => l !== locale)
        .map((l) => l.replace('-', '_')),
      type: 'website',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  }
}
