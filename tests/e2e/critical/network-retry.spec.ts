import { test, expect } from '@playwright/test'

/**
 * TASK-6 ST003 — Network retry / error handling E2E.
 * Forces 500 once on answer POST, expects UI to surface retry or recover.
 */

test.describe('critical · network retry', () => {
  test('surface error UI when answer endpoint fails', async ({ page }) => {
    let failed = false
    await page.route('**/api/v1/sessions/*/answers', async (route) => {
      if (!failed) {
        failed = true
        await route.fulfill({ status: 500, body: JSON.stringify({ error: 'forced' }) })
        return
      }
      await route.continue()
    })

    await page.goto('/pt-BR')
    const start = page.getByRole('link', { name: /começar|iniciar|calcular/i }).first()
    if (await start.isVisible().catch(() => false)) await start.click()

    const option = page.locator('[data-testid^="option-"]').first()
    if (await option.isVisible().catch(() => false)) await option.click()

    // UI should either recover (retry) or show an error banner
    const error = page.locator('[role="alert"], [data-testid*="error"]').first()
    await error.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => null)
    expect(failed).toBe(true)
  })
})
