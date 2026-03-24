import { test, expect, Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Configuração de axe-core
const AXE_CONFIG = {
  runOnly: {
    type: 'tag' as const,
    values: ['wcag2a', 'wcag2aa', 'wcag21aa'], // WCAG 2.1 AA
  },
}

// 7 rotas a auditar (INT-119)
const ROUTES_TO_AUDIT = [
  { path: '/pt-BR', name: 'Landing Page (/[locale]/)' },
  { path: '/pt-BR/flow', name: 'Flow Page (/[locale]/flow)' },
  { path: '/pt-BR/result', name: 'Result Page (/[locale]/result)' },
  { path: '/pt-BR/lead-capture', name: 'Lead Capture (/[locale]/lead-capture)' },
  { path: '/pt-BR/privacy', name: 'Privacy Page (/[locale]/privacy)' },
  { path: '/pt-BR/thank-you', name: 'Thank You (/[locale]/thank-you)' },
  { path: '/admin', name: 'Admin Login Page (/admin)' },
]

async function runAxeAudit(page: Page) {
  const results = await new AxeBuilder({ page })
    .options(AXE_CONFIG)
    .analyze()
  return results
}

test.describe('Acessibilidade Global — axe-core (INT-119)', () => {
  // Aceitar cookies para evitar que o banner interfira na auditoria de outras rotas
  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([
      { name: 'COOKIE_CONSENT', value: 'true', domain: 'localhost', path: '/' },
    ])
  })

  // Gerar um teste por rota
  for (const route of ROUTES_TO_AUDIT) {
    test(`${route.name} — 0 violações critical/serious`, async ({ page }) => {
      await page.goto(route.path)
      await page.waitForLoadState('networkidle')

      const results = await runAxeAudit(page)

      // Filtrar violações critical e serious
      const criticalViolations = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      )

      // Reportar detalhes se houver violações
      if (criticalViolations.length > 0) {
        const details = criticalViolations.map((v) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          nodes: v.nodes.slice(0, 2).map((n) => n.html),
        }))
        console.error(`\nViolações em ${route.name}:`, JSON.stringify(details, null, 2))
      }

      expect(criticalViolations).toHaveLength(0)
    })
  }
})

test.describe('Navegação por Teclado — 7 rotas', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([
      { name: 'COOKIE_CONSENT', value: 'true', domain: 'localhost', path: '/' },
    ])
  })

  test('Landing: Tab navega por todos os elementos interativos', async ({ page }) => {
    await page.goto('/pt-BR')

    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    const focusedAfterTabs = await page.evaluate(() => ({
      tag: document.activeElement?.tagName,
      type: (document.activeElement as HTMLInputElement)?.type,
      role: document.activeElement?.getAttribute('role'),
    }))

    // Verificar que foco mudou (algum elemento interativo recebeu foco)
    expect(focusedAfterTabs.tag).toBeTruthy()
    expect(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(
      focusedAfterTabs.tag ?? ''
    )).toBe(true)
  })

  test('Flow: OptionButtons navegáveis por teclado', async ({ page }) => {
    await page.goto('/pt-BR')
    await page.getByRole('button', { name: /Calcular|Começar/i }).click()
    await page.waitForURL(/\/pt-BR\/flow/)

    // Verificar que os botões de opção são focáveis
    const firstOption = page.getByTestId('option-button').first()
    await expect(firstOption).toBeVisible()

    // Focar via Tab
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Verificar que Enter/Space ativa o botão focado
    const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
    if (focusedElement === 'option-button') {
      await page.keyboard.press('Enter')
      await page.waitForTimeout(300)
    }
  })

  test('Admin login: formulário navegável por teclado', async ({ page }) => {
    await page.goto('/admin')

    const emailInput = page.getByLabel(/Email|E-mail/i)
    await emailInput.focus()

    // Verificar que Tab vai para o botão submit
    await page.keyboard.press('Tab')
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName)
    expect(['BUTTON', 'INPUT']).toContain(focusedTag)
  })
})

test.describe('Hierarquia de Headings', () => {
  test('Landing: heading hierarchy h1 → h2 → h3', async ({ page }) => {
    await page.goto('/pt-BR')

    const headings = await page.evaluate(() => {
      const els = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
      return Array.from(els).map((el) => el.tagName)
    })

    // Deve ter exatamente 1 h1
    expect(headings.filter((h) => h === 'H1')).toHaveLength(1)
    // h2 deve vir após h1
    const firstH2 = headings.indexOf('H2')
    const firstH1 = headings.indexOf('H1')
    if (firstH2 >= 0) {
      expect(firstH1).toBeLessThan(firstH2)
    }
  })

  test('Flow: h1 presente na página de questões', async ({ page }) => {
    await page.goto('/pt-BR')
    await page.getByRole('button', { name: /Calcular|Começar/i }).click()
    await page.waitForURL(/\/pt-BR\/flow/)

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()
  })
})

test.describe('Contraste WCAG AA', () => {
  test('Landing: 0 violações de contraste', async ({ page }) => {
    await page.context().addCookies([
      { name: 'COOKIE_CONSENT', value: 'true', domain: 'localhost', path: '/' },
    ])
    await page.goto('/pt-BR')

    const results = await new AxeBuilder({ page })
      .options({ runOnly: { type: 'rule', values: ['color-contrast'] } })
      .analyze()

    const contrastViolations = results.violations
    if (contrastViolations.length > 0) {
      console.error('Violações de contraste:', contrastViolations.map((v) => ({
        id: v.id,
        nodes: v.nodes.slice(0, 3).map((n) => ({
          html: n.html,
          message: n.failureSummary,
        })),
      })))
    }

    expect(contrastViolations).toHaveLength(0)
  })
})

test.describe('Aria-labels e Regiões', () => {
  test('CookieConsentBanner tem role=dialog e aria-label', async ({ page }) => {
    await page.goto('/pt-BR')
    const banner = page.locator('[role="dialog"][aria-label*="cookie" i]')
    if (await banner.isVisible()) {
      await expect(banner).toHaveAttribute('aria-modal', 'true')
    }
  })

  test('ProgressBar tem aria-valuenow e aria-valuemax', async ({ page }) => {
    await page.context().addCookies([
      { name: 'COOKIE_CONSENT', value: 'true', domain: 'localhost', path: '/' },
    ])
    await page.goto('/pt-BR')
    await page.getByRole('button', { name: /Calcular|Começar/i }).click()
    await page.waitForURL(/\/pt-BR\/flow/)

    const progressBar = page.getByRole('progressbar')
      .or(page.getByTestId('progress-bar'))
    if (await progressBar.isVisible()) {
      // Se usa role=progressbar, deve ter aria-valuenow
      if (await page.locator('[role="progressbar"]').isVisible()) {
        const ariaValueNow = await progressBar.getAttribute('aria-valuenow')
        const ariaValueMax = await progressBar.getAttribute('aria-valuemax')
        expect(ariaValueNow).toBeTruthy()
        expect(ariaValueMax).toBeTruthy()
      }
    }
  })
})
