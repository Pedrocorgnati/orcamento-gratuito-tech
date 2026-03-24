import { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'

const BASE_URL = (() => {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? 'https://orcamentogratuito.tech'
  return url.replace(/\/$/, '')
})()

// Rotas públicas indexáveis (excluindo /admin, /result, /lead-capture, /api)
const PUBLIC_ROUTES = ['', '/privacy']
const FLOW_ROUTES = ['/flow']

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []

  for (const locale of routing.locales) {
    for (const route of [...PUBLIC_ROUTES, ...FLOW_ROUTES]) {
      entries.push({
        url: `${BASE_URL}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: route === '' ? 'weekly' : 'monthly',
        priority: route === '' ? 1.0 : 0.7,
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((l) => [l, `${BASE_URL}/${l}${route}`])
          ),
        },
      })
    }
  }

  return entries
}
