import 'server-only'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

interface ServerFetchOptions {
  /** Cookie de sessão para autenticação server-side */
  sessionId?: string
  cache?: RequestCache
}

/**
 * Helper tipado para fetch em Server Components (RSC).
 * Centraliza o padrão de cookie forwarding e tratamento de erro.
 *
 * @param path - Path relativo da API (ex: `/api/v1/sessions/${id}/estimate`)
 * @param options - Opções: sessionId para cookie forwarding, cache strategy
 * @returns Dados tipados ou null em caso de erro/404
 *
 * @example
 * const data = await serverFetch<EstimationResult>(
 *   `/api/v1/sessions/${sessionId}/estimate`,
 *   { sessionId }
 * )
 */
export async function serverFetch<T>(
  path: string,
  options: ServerFetchOptions & {
    /** Status HTTP que devem devolver o payload mesmo com !res.ok (ex.: 503 fallback). */
    acceptStatus?: number[]
  } = {}
): Promise<T | null> {
  const { sessionId, cache = 'no-store', acceptStatus = [] } = options

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      cache,
      signal: AbortSignal.timeout(5_000),
      headers: sessionId
        ? { Cookie: `session_id=${sessionId}` }
        : undefined,
    })

    if (!res.ok && !acceptStatus.includes(res.status)) return null

    return (await res.json()) as T
  } catch {
    return null
  }
}
