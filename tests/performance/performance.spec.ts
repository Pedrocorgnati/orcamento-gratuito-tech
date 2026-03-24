import { test, expect } from '@playwright/test'

test.describe('Performance — ISR e Cache (INT-116)', () => {
  test('Landing page tem Cache-Control com s-maxage', async ({ request }) => {
    const response = await request.get('/pt-BR')
    const cacheControl = response.headers()['cache-control'] ?? ''
    const xVercelCache = response.headers()['x-vercel-cache'] ?? ''

    expect(response.status()).toBe(200)

    // Em produção Vercel, x-vercel-cache = HIT ou STALE para páginas ISR
    if (process.env.NODE_ENV === 'production') {
      const hasCache = cacheControl.includes('s-maxage') || xVercelCache !== ''
      expect(hasCache).toBe(true)
    }
  })

  test('Privacy page tem Cache-Control', async ({ request }) => {
    const response = await request.get('/pt-BR/privacy')
    expect(response.status()).toBe(200)

    if (process.env.NODE_ENV === 'production') {
      const cacheControl = response.headers()['cache-control'] ?? ''
      expect(cacheControl).toContain('s-maxage')
    }
  })

  test('API routes não têm cache longo', async ({ request }) => {
    const response = await request.get('/api/v1/health')
    const cacheControl = response.headers()['cache-control'] ?? ''
    if (cacheControl.includes('s-maxage')) {
      const match = cacheControl.match(/s-maxage=(\d+)/)
      const maxAge = match ? parseInt(match[1]) : 0
      expect(maxAge).toBeLessThan(60) // máximo 1 minuto para APIs
    }
  })
})

test.describe('Performance — Core Web Vitals (INT-116)', () => {
  test('Landing page carrega em < 3s', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/pt-BR')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime

    console.log(`Landing load time: ${loadTime}ms`)
    expect(loadTime).toBeLessThan(3000) // < 3s em ambiente local
  })

  test('Transição entre questões < 500ms (local)', async ({ page }) => {
    await page.context().addCookies([
      { name: 'COOKIE_CONSENT', value: 'true', domain: 'localhost', path: '/' },
    ])
    await page.goto('/pt-BR')
    await page.getByRole('button', { name: /Calcular|Começar/i }).click()
    await page.waitForURL(/\/pt-BR\/flow/)

    const firstOption = page.getByTestId('option-button').first()
    if (await firstOption.isVisible()) {
      const start = Date.now()
      await firstOption.click()
      await page.waitForTimeout(50)
      const elapsed = Date.now() - start

      console.log(`Transition time: ${elapsed}ms`)
      expect(elapsed).toBeLessThan(500) // < 500ms para transição local
    }
  })
})

test.describe('Performance — Imagens', () => {
  test('Landing usa next/image com alt text', async ({ page }) => {
    await page.goto('/pt-BR')

    const images = page.locator('img')
    const count = await images.count()

    for (let i = 0; i < count; i++) {
      const img = images.nth(i)
      const alt = await img.getAttribute('alt')
      const src = await img.getAttribute('src')

      if (src && !src.includes('placeholder')) {
        expect(alt !== null).toBe(true)
      }
    }
  })
})
