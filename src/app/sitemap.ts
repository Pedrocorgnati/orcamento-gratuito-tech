import { MetadataRoute } from 'next'
import { routing, getLocalizedSolutionPath } from '@/i18n/routing'
import { SOLUTION_SLUGS } from '@/lib/solutions/catalog'

const BASE_URL = (() => {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? 'https://orcamentogratuito.tech'
  return url.replace(/\/$/, '')
})()

// Build-time stamp — avoids crawl-budget churn from per-request `new Date()`.
const LAST_MODIFIED = new Date(
  process.env.VERCEL_GIT_COMMIT_SHA
    ? Number(process.env.VERCEL_GIT_COMMIT_AUTHOR_DATE ?? Date.now())
    : Date.now(),
)

// Rotas públicas indexáveis — /flow é noindex (redirect → API bootstrap), fora do sitemap.
const PUBLIC_ROUTES = ['', '/privacy']

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []

  for (const locale of routing.locales) {
    for (const route of PUBLIC_ROUTES) {
      entries.push({
        url: `${BASE_URL}/${locale}${route}`,
        lastModified: LAST_MODIFIED,
        changeFrequency: route === '' ? 'weekly' : 'monthly',
        priority: route === '' ? 1.0 : 0.5,
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((l) => [l, `${BASE_URL}/${l}${route}`])
          ),
        },
      })
    }
  }

  // Hub /solucoes (+ locale variants)
  for (const locale of routing.locales) {
    const hubPath = getLocalizedSolutionPath('__hub__', locale)
    entries.push({
      url: `${BASE_URL}/${locale}${hubPath}`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.9,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [
            l,
            `${BASE_URL}/${l}${getLocalizedSolutionPath('__hub__', l)}`,
          ])
        ),
      },
    })
  }

  // Solution landing pages (11 slugs × 4 locales = 44)
  for (const locale of routing.locales) {
    for (const slug of SOLUTION_SLUGS) {
      const slugPath = getLocalizedSolutionPath(slug, locale)
      entries.push({
        url: `${BASE_URL}/${locale}${slugPath}`,
        lastModified: LAST_MODIFIED,
        changeFrequency: 'weekly',
        priority: 0.8,
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((l) => [
              l,
              `${BASE_URL}/${l}${getLocalizedSolutionPath(slug, l)}`,
            ])
          ),
        },
      })
    }
  }

  return entries
}
