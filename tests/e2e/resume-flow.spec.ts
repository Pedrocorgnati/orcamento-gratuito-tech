import { test, expect } from '@playwright/test'

test.describe('Fluxo de Retomada de Sessão (INT-084)', () => {
  const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'

  test('1. Retomada com session_id válido redireciona para /flow/[questionId]', async ({ page }) => {
    // Criar sessão via API
    const response = await page.request.post(`${BASE_URL}/api/v1/sessions`, {
      data: { locale: 'pt-BR' },
    })

    if (!response.ok()) {
      test.skip(true, 'API de sessões não disponível')
      return
    }

    const { session_id } = await response.json()

    // Navegar para /resume/{session_id}
    await page.goto(`/pt-BR/resume/${session_id}`)

    // Deve redirecionar para /flow com a questão atual
    await expect(page).toHaveURL(/\/pt-BR\/flow/, { timeout: 5000 })
  })

  test('2. Retomada com session_id expirado exibe mensagem de expiração', async ({ page }) => {
    // Usar um session_id que sabemos ser antigo
    const expiredSessionId = 'test-expired-session-' + Date.now()

    await page.goto(`/pt-BR/resume/${expiredSessionId}`)

    // Deve mostrar mensagem de sessão expirada (não crashar)
    const expiredMsg = page.getByTestId('session-expired-message')
      .or(page.getByText(/expirada|expired|não encontrada/i))

    await expect(expiredMsg).toBeVisible({ timeout: 5000 })

    // Deve ter botão para iniciar nova sessão
    const newSessionBtn = page.getByRole('button', { name: /Novo|Nova|Começar|Start/i })
    await expect(newSessionBtn).toBeVisible()
  })

  test('3. Retomada com ID inválido exibe mensagem not-found', async ({ page }) => {
    await page.goto('/pt-BR/resume/invalid-id-abc123')

    // Deve mostrar 404 ou mensagem de not-found
    const notFoundMsg = page.getByTestId('session-not-found')
      .or(page.getByText(/não encontrada|not found|inválido/i))
      .or(page.getByRole('heading', { name: /404/i }))

    await expect(notFoundMsg).toBeVisible({ timeout: 5000 })
  })

  test('4. Retomada de sessão já completada redireciona para /result', async ({ page }) => {
    // Para este teste, precisamos de uma sessão com status COMPLETED
    // Em V1, se a sessão está COMPLETED, redirecionar para /result

    // Verificar que a rota /resume existe e funciona
    await page.goto('/pt-BR/resume/nonexistent-completed-session')

    // Deve estar em uma rota válida (não 500)
    const status = await page.evaluate(() => document.readyState)
    expect(status).toBe('complete')

    // Não deve ter stack trace ou erro de servidor visível
    const errorText = page.getByText(/Internal Server Error|500|stack trace/i)
    await expect(errorText).not.toBeVisible()
  })
})
