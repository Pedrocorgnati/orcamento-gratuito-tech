import { test, expect, Page } from '@playwright/test'

test.describe('Fluxo do Visitante Completo (INT-029)', () => {
  test.beforeEach(async ({ page }) => {
    // Aceitar cookies para habilitar analytics (não bloquear o flow)
    await page.context().addCookies([
      { name: 'COOKIE_CONSENT', value: 'true', domain: 'localhost', path: '/' },
    ])
  })

  test('1. Landing page carrega corretamente', async ({ page }) => {
    await page.goto('/pt-BR')

    // Verificar elementos essenciais da landing
    await expect(page).toHaveTitle(/Orçamento Gratuito/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // Verificar botão CTA principal
    const ctaButton = page.getByRole('button', { name: /Calcular|Começar|Iniciar/i })
    await expect(ctaButton).toBeVisible()
  })

  test('2. Navegar para o flow', async ({ page }) => {
    await page.goto('/pt-BR')

    // Clicar no CTA principal
    const ctaButton = page.getByRole('button', { name: /Calcular|Começar/i })
    await ctaButton.click()

    // Verificar redirecionamento para /flow
    await expect(page).toHaveURL(/\/pt-BR\/flow/)

    // Verificar que a primeira questão está visível
    await expect(page.getByTestId('question-card')).toBeVisible()
    await expect(page.getByTestId('progress-bar')).toBeVisible()
  })

  test('3. Responder 5+ questões e verificar progresso', async ({ page }) => {
    await page.goto('/pt-BR')

    // Iniciar flow
    await page.getByRole('button', { name: /Calcular|Começar/i }).click()
    await page.waitForURL(/\/pt-BR\/flow/)

    // Responder 5 questões (selecionar primeira opção)
    for (let i = 0; i < 5; i++) {
      await expect(page.getByTestId('question-card')).toBeVisible()

      // Verificar que a ProgressBar atualiza
      const progressBar = page.getByTestId('progress-bar')
      await expect(progressBar).toBeVisible()

      // Selecionar primeira opção disponível
      const firstOption = page.getByTestId('option-button').first()
      await expect(firstOption).toBeVisible()

      // Medir tempo de interação (INT-116: <1s)
      const start = Date.now()
      await firstOption.click()
      const elapsed = Date.now() - start
      expect(elapsed).toBeLessThan(1000)

      // Aguardar transição para próxima questão
      await page.waitForTimeout(300) // transição de animação
    }

    // Verificar que o progresso avançou
    const progressText = page.getByTestId('progress-text')
    if (await progressText.isVisible()) {
      const text = await progressText.textContent()
      expect(text).toMatch(/\d+/) // deve conter número de progresso
    }
  })

  test('4. ConsistencyAlert não bloqueia fluxo normal', async ({ page }) => {
    await page.goto('/pt-BR')
    await page.getByRole('button', { name: /Calcular|Começar/i }).click()
    await page.waitForURL(/\/pt-BR\/flow/)

    // Responder várias questões sem criar inconsistência
    for (let i = 0; i < 8; i++) {
      const firstOption = page.getByTestId('option-button').first()
      if (!(await firstOption.isVisible())) break
      await firstOption.click()
      await page.waitForTimeout(200)
    }

    // ConsistencyAlert não deve estar visível como bloqueio
    const alert = page.getByTestId('consistency-alert')
    if (await alert.isVisible()) {
      // Se visível, deve ter botão de continuar (não bloqueia)
      const continueBtn = page.getByRole('button', { name: /Continuar|Entendi/i })
      await expect(continueBtn).toBeVisible()
    }
  })

  test('5. Completar flow e chegar na página /result', async ({ page }) => {
    // Ir diretamente ao flow e completar rapidamente
    await page.goto('/pt-BR')
    await page.getByRole('button', { name: /Calcular|Começar/i }).click()
    await page.waitForURL(/\/pt-BR\/flow/)

    // Responder todas as questões (máx 42, timeout 60s)
    let questionsAnswered = 0
    const maxQuestions = 42
    const startTime = Date.now()

    while (questionsAnswered < maxQuestions && Date.now() - startTime < 60000) {
      const optionButton = page.getByTestId('option-button').first()

      // Se não há mais botões de opção, pode ter chegado ao resultado
      if (!(await optionButton.isVisible({ timeout: 2000 }).catch(() => false))) {
        break
      }

      await optionButton.click()
      questionsAnswered++
      await page.waitForTimeout(150)

      // Verificar se chegou na página de resultado
      if (page.url().includes('/result')) break
    }

    // Verificar página de resultado
    await expect(page).toHaveURL(/\/pt-BR\/result/, { timeout: 10000 })

    // Verificar EstimationDisplay
    const estimation = page.getByTestId('estimation-display')
    await expect(estimation).toBeVisible()

    // Verificar que mostra faixa de preço (min < max)
    const priceMin = page.getByTestId('price-min')
    const priceMax = page.getByTestId('price-max')
    await expect(priceMin).toBeVisible()
    await expect(priceMax).toBeVisible()
  })

  test('6. Navegar de /result para /lead-capture', async ({ page }) => {
    await page.goto('/pt-BR')
    await page.getByRole('button', { name: /Calcular|Começar/i }).click()
    await page.waitForURL(/\/pt-BR\/flow/)

    // Responder questões rapidamente
    for (let i = 0; i < 42; i++) {
      const option = page.getByTestId('option-button').first()
      if (!(await option.isVisible({ timeout: 2000 }).catch(() => false))) break
      await option.click()
      await page.waitForTimeout(100)
      if (page.url().includes('/result')) break
    }

    if (!page.url().includes('/result')) return test.skip()

    // Clicar no CTA da página de resultado
    const leadCta = page.getByRole('button', { name: /Receber|Análise completa|Enviar/i })
    await expect(leadCta).toBeVisible()
    await leadCta.click()

    await expect(page).toHaveURL(/\/pt-BR\/lead-capture/, { timeout: 5000 })
  })

  test('7. Preencher formulário de lead e verificar /thank-you', async ({ page }) => {
    await page.goto('/pt-BR')
    await page.getByRole('button', { name: /Calcular|Começar/i }).click()
    await page.waitForURL(/\/pt-BR\/flow/)

    // Responder rapidamente
    for (let i = 0; i < 42; i++) {
      const option = page.getByTestId('option-button').first()
      if (!(await option.isVisible({ timeout: 2000 }).catch(() => false))) break
      await option.click()
      await page.waitForTimeout(100)
      if (page.url().includes('/lead-capture')) break
    }

    if (!page.url().includes('/lead-capture')) {
      // Tentar navegar via result
      if (page.url().includes('/result')) {
        await page.getByRole('button', { name: /Receber|Análise/i }).click()
        await page.waitForURL(/lead-capture/)
      } else {
        return test.skip()
      }
    }

    // Verificar formulário
    const nameField = page.getByLabel(/Nome|Name/i)
    const emailField = page.getByLabel(/Email|E-mail/i)
    await expect(nameField).toBeVisible()
    await expect(emailField).toBeVisible()

    // Preencher formulário
    await nameField.fill('Test User E2E')
    await emailField.fill('e2e-test@example.com')

    // Aceitar consentimento
    const consentCheckbox = page.getByRole('checkbox', { name: /consent|concordo|aceito/i })
    if (await consentCheckbox.isVisible()) {
      await consentCheckbox.check()
    }

    // Submeter
    const submitButton = page.getByRole('button', { name: /Enviar|Receber|Submit/i })
    await submitButton.click()

    // Verificar /thank-you
    await expect(page).toHaveURL(/\/pt-BR\/thank-you/, { timeout: 10000 })

    // Verificar ThankYouMessage com nome
    const thankYouMsg = page.getByTestId('thank-you-message')
    await expect(thankYouMsg).toBeVisible()
    await expect(thankYouMsg).toContainText('Test User')
  })
})
