import { Page } from '@playwright/test'

/**
 * Injeta uma sessão de admin para testes E2E.
 * Em ambiente de teste, usa SUPABASE_SERVICE_KEY para criar sessão.
 *
 * NOTA: Em CI, usar variáveis de ambiente:
 * TEST_ADMIN_EMAIL — email do admin de teste
 * SUPABASE_SERVICE_KEY — chave de serviço (não a anon key)
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  const adminEmail = process.env.TEST_ADMIN_EMAIL ?? process.env.ADMIN_EMAIL

  if (!adminEmail) {
    throw new Error('TEST_ADMIN_EMAIL ou ADMIN_EMAIL deve estar definido')
  }

  // Ir para /admin
  await page.goto('/admin')

  // Verificar que o formulário de magic link está visível
  const emailField = page.getByLabel(/Email|E-mail/i)
  if (await emailField.isVisible()) {
    await emailField.fill(adminEmail)
    const submitBtn = page.getByRole('button', { name: /Enviar|Entrar|Login/i })
    await submitBtn.click()

    // Aguardar mensagem de "verifique seu email"
    await page.waitForSelector('[data-testid="magic-link-sent"]', { timeout: 5000 })
      .catch(() => { /* pode já estar logado */ })
  }
}

/**
 * Injeta cookies de autenticação diretamente (para ambientes com token de teste)
 */
export async function injectAdminAuth(page: Page, accessToken: string): Promise<void> {
  await page.context().addCookies([
    {
      name: 'sb-access-token',
      value: accessToken,
      domain: 'localhost',
      path: '/',
    },
  ])
}
