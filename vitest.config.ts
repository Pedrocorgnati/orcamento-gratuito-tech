import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/*.integration.test.ts', // integration tests requerem banco — usar test:integration
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary'], // RESOLVED: json-summary gera coverage-summary.json para CI/tools
      exclude: ['node_modules/', 'src/__tests__/', 'src/tests/', '*.config.ts', 'prisma/'],
      thresholds: { lines: 70, functions: 70, branches: 60 },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // server-only é um módulo exclusivo do Next.js — noop em testes
      'server-only': path.resolve(__dirname, './src/__tests__/__mocks__/server-only.ts'),
    },
  },
})
