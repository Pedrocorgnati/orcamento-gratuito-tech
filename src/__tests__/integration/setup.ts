/**
 * Setup global de testes de integracao.
 *
 * Executa antes/apos cada arquivo de teste (via setupFiles no vitest.integration.config.ts).
 * Nao executa antes de cada `it()` — ver helpers/db.ts para cleanup por teste.
 *
 * NOTA: Este arquivo usa o prisma singleton global.
 * O DATABASE_URL deve apontar para um banco de TESTE separado.
 * Nunca apontar para producao.
 */

import { afterAll, afterEach, beforeAll } from 'vitest'
import { prisma } from '@/lib/prisma'

beforeAll(async () => {
  // Valida conexao antes de comecar — falha rapido se DATABASE_URL errado
  await prisma.$queryRaw`SELECT 1`
})

afterAll(async () => {
  await prisma.$disconnect()
})

/**
 * Limpa tabelas mutaveis apos cada arquivo de teste.
 * Preserva dados de referencia (questions, options, pricing_configs, exchange_rates).
 * Ordem: dependentes de FK primeiro.
 */
afterEach(async () => {
  await prisma.lead.deleteMany()
  await prisma.answer.deleteMany()
  await prisma.session.deleteMany()
})
