import { createBrowserClient } from '@supabase/ssr'

// Singleton para evitar multiplas instancias do cliente
let client: ReturnType<typeof createBrowserClient> | undefined

/**
 * Retorna o cliente Supabase para uso em Client Components.
 * Mantem uma unica instancia (singleton) por sessao de navegador.
 * NUNCA usar em Server Components, Route Handlers ou Server Actions.
 * Para esses contextos, usar createSupabaseServerClient() de server.ts.
 */
export function createSupabaseBrowserClient() {
  if (client) return client

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return client
}

/**
 * Alias para conveniencia em componentes
 */
export const getSupabaseClient = createSupabaseBrowserClient
