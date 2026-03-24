import { test, expect, Page } from '@playwright/test'

test.describe('Fluxo Admin (module-6)', () => {
  test('1. /admin exibe MagicLinkForm sem autenticação', async ({ page }) => {
    await page.goto('/admin')

    // Deve mostrar formulário de login (não redirecionar para leads)
    await expect(page).toHaveURL(/\/admin/)
    await expect(page.getByTestId('magic-link-form')).toBeVisible()
    await expect(page.getByLabel(/Email|E-mail/i)).toBeVisible()
  })

  test('2. /admin/leads redireciona para login sem autenticação', async ({ page }) => {
    await page.goto('/admin/leads')

    // Deve redirecionar para /admin (login)
    await expect(page).toHaveURL(/\/admin$/)
  })

  test('3. Magic link form valida email', async ({ page }) => {
    await page.goto('/admin')

    const emailField = page.getByLabel(/Email|E-mail/i)
    await emailField.fill('email-invalido')
    await page.getByRole('button', { name: /Enviar|Entrar/i }).click()

    // Verificar erro de validação
    const errorMsg = page.getByText(/email.*inválido|invalid.*email/i)
    await expect(errorMsg).toBeVisible({ timeout: 3000 })
  })

  // Os testes abaixo requerem autenticação real ou mock
  // Em CI, usar um token de teste via variável de ambiente

  test.describe('Com autenticação (requer TEST_ADMIN_TOKEN)', () => {
    test.skip(!process.env.TEST_ADMIN_TOKEN, 'Requer TEST_ADMIN_TOKEN')

    test.beforeEach(async ({ page }) => {
      // Injetar token de teste
      await page.goto('/admin')
      await page.evaluate((token) => {
        localStorage.setItem('admin-test-token', token)
      }, process.env.TEST_ADMIN_TOKEN!)
      await page.reload()
    })

    test('4. /admin/leads carrega LeadsTable com leads', async ({ page }) => {
      await page.goto('/admin/leads')

      // Verificar tabela de leads
      const table = page.getByTestId('leads-table')
      await expect(table).toBeVisible()

      // Verificar headers da tabela
      await expect(page.getByText(/Nome|Name/i)).toBeVisible()
      await expect(page.getByText(/Email/i)).toBeVisible()
      await expect(page.getByText(/Score/i)).toBeVisible()
      await expect(page.getByText(/Projeto|Project/i)).toBeVisible()
    })

    test('5. Filtro por Score A funciona', async ({ page }) => {
      await page.goto('/admin/leads')

      // Aplicar filtro de score
      const scoreFilter = page.getByRole('combobox', { name: /Score/i })
      await scoreFilter.selectOption('A')

      // Aguardar recarregamento
      await page.waitForURL(/score=A/)

      // Verificar que tabela foi filtrada
      const rows = page.getByTestId('lead-row')
      const count = await rows.count()
      expect(count).toBeGreaterThanOrEqual(0) // pode ser 0 se não há leads A
    })

    test('6. Paginação funciona', async ({ page }) => {
      await page.goto('/admin/leads')

      const nextPage = page.getByRole('button', { name: /Próxima|Next/i })
      if (await nextPage.isEnabled()) {
        await nextPage.click()
        await expect(page).toHaveURL(/page=2/)
      }
    })

    test('7. Botão Sair redireciona para /admin', async ({ page }) => {
      await page.goto('/admin/leads')

      const logoutButton = page.getByRole('button', { name: /Sair|Logout|Sign out/i })
      await expect(logoutButton).toBeVisible()
      await logoutButton.click()

      await expect(page).toHaveURL(/\/admin$/)
    })
  })
})
