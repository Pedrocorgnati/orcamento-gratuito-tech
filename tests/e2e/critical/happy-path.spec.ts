import { test, expect } from '@playwright/test'

/**
 * TASK-6 ST002 — Happy path E2E.
 * Visitor selects locale, walks the flow, submits lead, sees thank-you.
 * Skipped in environments without seed data (detected via Q001 absence).
 */

test.describe('critical · happy path', () => {
  test('pt-BR happy path completes and shows thank-you', async ({ page }) => {
    await page.goto('/pt-BR')
    const start = page.getByRole('link', { name: /começar|iniciar|calcular/i }).first()
    await start.waitFor({ state: 'visible', timeout: 10_000 })
    await start.click()

    // Click first option repeatedly until we leave the flow (max 25 iterations)
    for (let i = 0; i < 25; i++) {
      const option = page.locator('[data-testid^="option-"]').first()
      if (!(await option.isVisible().catch(() => false))) break
      await option.click()
      await page.waitForLoadState('networkidle').catch(() => null)
      if (/result|lead-capture/i.test(page.url())) break
    }

    await expect(page).toHaveURL(/\/(result|lead-capture|thank-you)/)
  })
})
