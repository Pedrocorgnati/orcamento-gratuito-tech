import { defineConfig } from 'vitest/config'
import path from 'path'

/**
 * Configuracao Vitest para testes de integracao.
 *
 * Diferencas em relacao ao vitest.config.ts:
 * - environment: 'node' (sem jsdom — API Routes nao precisam de DOM)
 * - include: apenas arquivos *.integration.test.ts
 * - fileParallelism: false — testes de integracao compartilham banco e devem rodar em sequencia
 * - testTimeout: 30s — queries de banco podem ser lentas em CI
 *
 * Requer banco de dados apontado por DATABASE_URL (ou DATABASE_TEST_URL).
 * Ver .env.docker para configuracao local via docker compose.
 */
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.integration.test.ts'],
    setupFiles: ['./src/__tests__/integration/setup.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // Sequencial — testes compartilham DB; paralelismo causaria race conditions
    fileParallelism: false,
    pool: 'forks',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // server-only nao existe fora do Next.js runtime
      'server-only': path.resolve(__dirname, './src/__tests__/__mocks__/server-only.ts'),
    },
  },
})
