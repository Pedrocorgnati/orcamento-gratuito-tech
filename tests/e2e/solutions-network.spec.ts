import { test, expect } from '@playwright/test'
import { SOLUTION_SLUGS } from '@/lib/solutions/catalog'

const LOCALES = ['pt-BR', 'en-US', 'es-ES', 'it-IT'] as const
type AppLocale = (typeof LOCALES)[number]

const HUB_SEGMENT: Record<AppLocale, string> = {
  'pt-BR': 'solucoes',
  'en-US': 'solutions',
  'es-ES': 'soluciones',
  'it-IT': 'soluzioni',
}

test.describe('Solutions network — hub', () => {
  for (const locale of LOCALES) {
    test(`hub ${locale} responds 200 with h1`, async ({ page }) => {
      const res = await page.goto(`/${locale}/${HUB_SEGMENT[locale]}`)
      expect(res?.status()).toBe(200)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.getByTestId('page-solutions-hub')).toBeVisible()
    })
  }
})

test.describe('Solutions network — landing pages', () => {
  for (const locale of LOCALES) {
    for (const slug of SOLUTION_SLUGS) {
      test(`${locale}/${slug} renders h1 + CTA + breadcrumb`, async ({ page }) => {
        const res = await page.goto(`/${locale}/${HUB_SEGMENT[locale]}/${slug}`)
        expect(res?.status()).toBe(200)
        await expect(page.getByTestId('solution-hero-h1')).toBeVisible()
        await expect(page.getByTestId('solution-cta-primary')).toBeVisible()
        await expect(page.getByTestId('breadcrumb-nav')).toBeVisible()
      })
    }
  }
})

test.describe('Solutions network — deep-link preselect', () => {
  test('CTA from aplicativo-android forwards preselect=5 to flow', async ({ page }) => {
    await page.goto('/pt-BR/solucoes/aplicativo-android')
    const cta = page.getByTestId('solution-cta-primary')
    await expect(cta).toBeVisible()
    const href = await cta.getAttribute('href')
    expect(href).toContain('preselect=5')
  })
})

test.describe('Solutions network — JSON-LD', () => {
  test('slug page emits Service + Breadcrumb + FAQ schemas', async ({ page }) => {
    await page.goto('/pt-BR/solucoes/saas')
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents()
    const types = scripts.map((s) => {
      try {
        return JSON.parse(s)['@type']
      } catch {
        return null
      }
    })
    expect(types).toContain('Service')
    expect(types).toContain('BreadcrumbList')
    expect(types).toContain('FAQPage')
  })
})
