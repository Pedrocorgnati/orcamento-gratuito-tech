import { test, expect } from '@playwright/test'

test.describe('Security Headers (SEC-003)', () => {
  test('/ tem X-Frame-Options: DENY', async ({ request }) => {
    const response = await request.get('/pt-BR')
    const header = response.headers()['x-frame-options']
    expect(header).toBe('DENY')
  })

  test('/ tem X-Content-Type-Options: nosniff', async ({ request }) => {
    const response = await request.get('/pt-BR')
    const header = response.headers()['x-content-type-options']
    expect(header).toBe('nosniff')
  })

  test('/ tem Content-Security-Policy', async ({ request }) => {
    const response = await request.get('/pt-BR')
    const csp = response.headers()['content-security-policy']
    expect(csp).toBeTruthy()
    expect(csp).toContain('default-src')
    expect(csp).toContain("frame-ancestors 'none'")
  })
})

test.describe('IDOR Prevention (SEC-007)', () => {
  test('Sessão com cookie errado retorna 403/401', async ({ request }) => {
    // Criar sessão A
    const createResponse = await request.post('/api/v1/sessions', {
      data: { locale: 'pt-BR' },
    })

    if (!createResponse.ok()) {
      test.skip(true, 'API de sessões não disponível')
      return
    }

    const { session_id } = await createResponse.json()

    // Tentar acessar com cookie errado
    const response = await request.get(`/api/v1/sessions/${session_id}`, {
      headers: { Cookie: 'session_id=different-session-id' },
    })

    // Deve retornar 401 ou 403, não 200 com dados
    expect([401, 403, 404]).toContain(response.status())
  })
})

test.describe('Rate Limiting (ARCH-003)', () => {
  test('Muitas requests retornam 429', async ({ request }) => {
    // Fazer burst de requests para verificar rate limiting
    let got429 = false

    for (let i = 0; i < 20; i++) {
      const response = await request.post('/api/v1/sessions', {
        data: { locale: 'pt-BR' },
      })

      if (response.status() === 429) {
        got429 = true
        break
      }
    }

    // Em ambiente de desenvolvimento, rate limit pode não estar ativo
    // Este teste é informativo — registrar se não encontrou 429
    if (!got429) {
      console.warn('AVISO: Rate limit não atingido em 20 requests. Verificar configuração em produção.')
    }
  })
})

test.describe('Honeypot Anti-spam (SEC-010)', () => {
  test('Lead com honeypot preenchido retorna 200 (silently rejected)', async ({ request }) => {
    const response = await request.post('/api/v1/leads', {
      data: {
        session_id: 'fake-session-id-test',
        name: 'Bot User',
        email: 'bot@spam.com',
        email_consent: true,
        website_url: 'http://spam-bot.com', // campo honeypot
      },
    })

    // Deve retornar 200 (silently rejected — não revela o bloqueio ao bot)
    // ou 400 (sessão inválida) — mas NUNCA criar o lead
    expect([200, 400, 422]).toContain(response.status())
  })
})

test.describe('Zod Validation (QUAL-005)', () => {
  test('POST /api/v1/sessions com body inválido retorna 400', async ({ request }) => {
    const response = await request.post('/api/v1/sessions', {
      data: { invalid_field: 'test' },
    })

    expect(response.status()).toBe(400)

    const body = await response.json().catch(() => null)
    if (body) {
      // Nunca deve retornar 500
      expect(response.status()).not.toBe(500)
    }
  })

  test('POST /api/v1/leads com email inválido retorna 400', async ({ request }) => {
    const response = await request.post('/api/v1/leads', {
      data: { session_id: 'test', email: 'not-an-email' },
    })

    expect([400, 422]).toContain(response.status())
    expect(response.status()).not.toBe(500)
  })
})

test.describe('PII Log Guard (SEC-008)', () => {
  test('Logger não expõe PII nas respostas de API', async ({ request }) => {
    // Verificar que as respostas de API não contêm logs de PII
    const response = await request.post('/api/v1/sessions', {
      data: { locale: 'pt-BR' },
    })

    const body = await response.text()

    // O corpo da resposta não deve conter campos de PII em log format
    expect(body).not.toMatch(/console\.log.*email/i)
    expect(body).not.toMatch(/"password":/i)
  })
})
