/**
 * Helpers de banco de dados para testes de integracao.
 *
 * Factory functions — cada teste cria seus proprios dados via estas funcoes.
 * NUNCA depender de dados criados por outro teste ou arquivo.
 *
 * Dados de referencia (questions, options, pricing_configs, exchange_rates)
 * sao seedados via `bun run db:seed` e NAO sao criados aqui.
 */

import { prisma } from '@/lib/prisma'
import {
  SessionStatus,
  Locale,
  Currency,
  ProjectType,
} from '@/lib/enums'

// ─────────────────────────────────────────────────────────────────────────────
// Sessoes
// ─────────────────────────────────────────────────────────────────────────────

export async function createTestSession(
  overrides: Record<string, unknown> = {}
) {
  return prisma.session.create({
    data: {
      status: SessionStatus.IN_PROGRESS,
      locale: Locale.PT_BR,
      currency: Currency.BRL,
      accumulated_price: 0,
      accumulated_time: 0,
      accumulated_complexity: 0,
      questions_answered: 0,
      progress_percentage: 0,
      path_taken: [],
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ...overrides,
    },
  })
}

export async function createCompletedSession(
  overrides: Record<string, unknown> = {}
) {
  return createTestSession({
    status: SessionStatus.COMPLETED,
    project_type: ProjectType.WEB_APP,
    accumulated_price: 5000,
    accumulated_time: 20,
    accumulated_complexity: 35,
    questions_answered: 8,
    progress_percentage: 100,
    current_question_id: null,
    ...overrides,
  })
}

export async function createExpiredSession() {
  return createTestSession({
    status: SessionStatus.EXPIRED,
    expires_at: new Date(Date.now() - 1_000), // no passado
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Dados de referencia minimos (upsert — idempotente)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Garante que existe um PricingConfig para WEB_APP no banco de teste.
 * Usa upsert para ser idempotente — seguro chamar multiplas vezes.
 */
export async function ensurePricingConfig(
  projectType: string = ProjectType.WEB_APP
) {
  return prisma.pricingConfig.upsert({
    where: { project_type: projectType },
    create: {
      project_type: projectType,
      base_price: 10_000,
      base_days: 30,
      complexity_multiplier_low: 0.8,
      complexity_multiplier_medium: 1.0,
      complexity_multiplier_high: 1.3,
      complexity_multiplier_very_high: 1.6,
    },
    update: {},
  })
}

/**
 * Garante que existe ExchangeRate BRL→BRL no banco de teste.
 * Necessario para estimativas em BRL (taxa = 1.0).
 */
export async function ensureExchangeRate(
  fromCurrency: string = 'BRL',
  toCurrency: string = 'BRL',
  rate = 1.0
) {
  const existing = await prisma.exchangeRate.findFirst({
    where: { from_currency: fromCurrency, to_currency: toCurrency },
  })
  if (existing) return existing

  return prisma.exchangeRate.create({
    data: { from_currency: fromCurrency, to_currency: toCurrency, rate },
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Leads
// ─────────────────────────────────────────────────────────────────────────────

export function buildLeadPayload(
  sessionId: string,
  overrides: Record<string, unknown> = {}
) {
  return {
    sessionId,
    name: 'João Silva',
    email: `joao-${Date.now()}@example.com`,
    consentGiven: true,
    consentVersion: '1.0',
    ...overrides,
  }
}
