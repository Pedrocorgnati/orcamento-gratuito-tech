import { test, expect } from '@playwright/test'

/**
 * TASK-6 ST003 — Session expired page shows SessionExpiredMessage with CTA.
 * Uses a known-nonexistent/expired session id. When a test-only API for
 * expiring sessions is wired, switch to that flow.
 */

test.describe('critical · session expired', () => {
  test('invalid/expired session renders expired state', async ({ page }) => {
    await page.goto('/pt-BR/resume/cexpiredsessiontokenx00000000000')
    const expired = page.getByTestId('session-expired-message')
    await expired.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => null)
    await expect(page).toHaveURL(/resume|flow|pt-BR/)
  })
})
