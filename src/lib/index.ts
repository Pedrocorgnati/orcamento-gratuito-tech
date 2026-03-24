// Barrel export — src/lib
// ⚠️  Importar diretamente de @/lib/{módulo} para code splitting adequado.
// Este barrel contém apenas exports seguros para uso em qualquer contexto.
// Para módulos server-only, importar diretamente:
//   - Validações:  import { sessionSchema } from '@/lib/validations'
//   - Rate limit:  import { rateLimit }      from '@/lib/rate-limit'
//   - Segurança:   import { sanitize }       from '@/lib/security'

export * from './enums'    // enums puros — safe
export * from './types'    // interfaces/types — safe
export * from './utils'    // cn(), formatters — safe
export * from './errors'   // error classes — safe
export { serverFetch } from './server-fetch'  // helper RSC — server-only
