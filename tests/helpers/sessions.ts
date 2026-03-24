import { request } from '@playwright/test'

interface CreateSessionResult {
  session_id: string
  status: string
}

export async function createTestSession(
  baseURL: string,
  locale = 'pt-BR'
): Promise<CreateSessionResult> {
  const ctx = await request.newContext({ baseURL })
  const response = await ctx.post('/api/v1/sessions', {
    data: { locale },
  })

  if (!response.ok()) {
    throw new Error(`Falha ao criar sessão: ${response.status()}`)
  }

  return await response.json()
}

export async function createExpiredSession(baseURL: string): Promise<string> {
  // Cria sessão e a marca como expirada via API de teste
  // NOTA: Requer endpoint /api/v1/test/sessions (apenas em NODE_ENV=test)
  const ctx = await request.newContext({ baseURL })
  const response = await ctx.post('/api/v1/test/sessions', {
    data: { status: 'EXPIRED', expires_at: new Date(Date.now() - 86400000).toISOString() },
  })

  if (!response.ok()) {
    throw new Error('Endpoint de teste não disponível')
  }

  const data = await response.json()
  return data.session_id
}

export async function createCompletedSession(baseURL: string): Promise<string> {
  const ctx = await request.newContext({ baseURL })
  const response = await ctx.post('/api/v1/test/sessions', {
    data: { status: 'COMPLETED' },
  })

  if (!response.ok()) {
    throw new Error('Endpoint de teste não disponível')
  }

  const data = await response.json()
  return data.session_id
}
