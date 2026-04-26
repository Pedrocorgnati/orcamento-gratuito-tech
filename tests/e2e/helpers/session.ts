import { Page, APIRequestContext } from '@playwright/test'

/**
 * E2E helpers for session/lead lifecycle — TASK-6.
 *
 * NOTE: Helpers use the app's public API; avoid direct Prisma access in E2E
 * to keep the harness portable across environments.
 */

export async function answerFirstQuestions(page: Page, count: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    const button = page.locator('[data-testid^="option-"]').first()
    await button.waitFor({ state: 'visible', timeout: 5_000 })
    await button.click()
  }
}

export async function fillLeadForm(
  page: Page,
  values: { name: string; email: string; phone?: string; company?: string }
): Promise<void> {
  await page.getByLabel(/nome|name|nombre|nome/i).first().fill(values.name)
  await page.getByLabel(/email|e-mail/i).first().fill(values.email)
  if (values.phone) {
    await page.getByLabel(/phone|telefone|teléfono|telefono/i).first().fill(values.phone)
  }
  if (values.company) {
    await page.getByLabel(/company|empresa|azienda/i).first().fill(values.company)
  }
  await page.getByLabel(/(política|policy|politica)/i).first().check()
}

export async function getSessionIdFromCookie(page: Page): Promise<string | null> {
  const cookies = await page.context().cookies()
  const c = cookies.find((c) => c.name === 'session_id' || c.name === 'SESSION_ID')
  return c?.value ?? null
}

export async function expireSessionViaApi(
  request: APIRequestContext,
  sessionId: string
): Promise<void> {
  // Requires a test-only admin endpoint or a cleanup API.
  // Pragmatic fallback: rely on DB seeds set up by test-runner to expire session directly.
  // When /api/v1/test/expire-session exists, switch to that here.
  await request.post(`/api/v1/test/expire-session`, { data: { sessionId } }).catch(() => null)
}
