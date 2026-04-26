import { test, expect } from '@playwright/test'

/**
 * TASK-6 ST002 — Abandon + resume E2E.
 * User answers some questions, closes context, reopens → ResumeOrRestartDialog appears.
 */

test.describe('critical · abandon and resume', () => {
  test('reopening flow shows resume dialog', async ({ page, context }) => {
    await page.goto('/pt-BR')
    const start = page.getByRole('link', { name: /começar|iniciar|calcular/i }).first()
    await start.waitFor({ state: 'visible', timeout: 10_000 })
    await start.click()

    for (let i = 0; i < 3; i++) {
      const option = page.locator('[data-testid^="option-"]').first()
      if (!(await option.isVisible().catch(() => false))) break
      await option.click()
    }

    const sessionCookie = (await context.cookies()).find(
      (c) => c.name === 'session_id' || c.name === 'SESSION_ID'
    )
    expect(sessionCookie).toBeTruthy()

    await page.goto('/pt-BR')
    const dialog = page.getByTestId('resume-or-restart-dialog')
    await expect(dialog).toBeVisible({ timeout: 5_000 })
  })
})
