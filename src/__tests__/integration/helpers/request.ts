/**
 * Helpers para construir NextRequest em testes de integracao.
 *
 * Abstrai a criacao de requests com cookies, headers e body
 * para os testes de route handlers do Next.js App Router.
 */

import { NextRequest } from 'next/server'

interface RequestOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
  /** Simula o cookie session_id (IDOR guard) */
  sessionCookie?: string
  /** Simula Authorization: Bearer <token> (admin routes) */
  bearerToken?: string
}

export function buildRequest(url: string, options: RequestOptions = {}): NextRequest {
  const {
    method = 'GET',
    body,
    headers = {},
    sessionCookie,
    bearerToken,
  } = options

  const allHeaders: Record<string, string> = { ...headers }

  if (sessionCookie) {
    allHeaders['cookie'] = `session_id=${sessionCookie}`
  }
  if (bearerToken) {
    allHeaders['authorization'] = `Bearer ${bearerToken}`
  }
  if (body) {
    allHeaders['content-type'] = 'application/json'
  }

  return new NextRequest(`http://localhost:3000${url}`, {
    method,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    headers: allHeaders,
  })
}

export function postRequest(url: string, body: unknown, sessionCookie?: string) {
  return buildRequest(url, { method: 'POST', body, sessionCookie })
}

export function getRequest(url: string, sessionCookie?: string, bearerToken?: string) {
  return buildRequest(url, { method: 'GET', sessionCookie, bearerToken })
}
