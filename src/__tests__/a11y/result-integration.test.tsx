/**
 * Testes de Integração — ResultCard completo (axe-core)
 * Rastreabilidade: TASK-3 ST004, GAP-04
 *
 * Verifica 0 violações axe no ResultCard com todos os subcomponentes
 * integrados (EstimationDisplay, ScopeStoryCard, SocialProofSection).
 */

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { ResultCard } from '@/components/result/ResultCard'
import { ComplexityLevel, Currency, Locale, ProjectType, LeadScore } from '@/lib/enums'
import type { EstimationResult, ExchangeRateItem } from '@/lib/types'

expect.extend(toHaveNoViolations)

const mockEstimation: EstimationResult = {
  projectType:       ProjectType.WEB_APP,
  complexity:        ComplexityLevel.MEDIUM,
  priceMin:          15000,
  priceMax:          21000,
  daysMin:           45,
  daysMax:           63,
  currency:          Currency.BRL,
  locale:            Locale.PT_BR,
  features:          ['autenticação', 'painel administrativo', 'integração de pagamentos'],
  scopeStory:        'Seu projeto é um Sistema Web com módulo de autenticação, painel administrativo e integração de pagamentos.',
  consistencyAlerts: [],
  score:             LeadScore.A,
  scoreBudget:       80,
  scoreTimeline:     75,
  scoreProfile:      90,
  scoreTotal:        85,
}

const mockExchangeRates: ExchangeRateItem[] = [
  { from_currency: 'BRL', to_currency: 'USD', rate: 0.2 },
  { from_currency: 'BRL', to_currency: 'EUR', rate: 0.18 },
]

describe('ResultCard (integração) — Acessibilidade axe-core', () => {
  it('não deve ter violações axe-core com todos subcomponentes', async () => {
    const { container } = render(
      <ResultCard
        estimation={mockEstimation}
        exchangeRates={mockExchangeRates}
        locale="pt-BR"
        leadCaptureHref="/pt-BR/lead-capture"
        completedCount={1247}
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('heading h1 presente com texto localizado (pt-BR)', () => {
    const { getByRole } = render(
      <ResultCard
        estimation={mockEstimation}
        exchangeRates={[]}
        locale="pt-BR"
        leadCaptureHref="/pt-BR/lead-capture"
        completedCount={0}
      />
    )
    const heading = getByRole('heading', { level: 1 })
    expect(heading.textContent).toBe('Seu Orçamento Estimado')
  })

  it('heading h1 em inglês quando locale=en-US', () => {
    const { getByRole } = render(
      <ResultCard
        estimation={mockEstimation}
        exchangeRates={[]}
        locale="en-US"
        leadCaptureHref="/en-US/lead-capture"
        completedCount={0}
      />
    )
    const heading = getByRole('heading', { level: 1 })
    expect(heading.textContent).toBe('Your Estimated Budget')
  })

  it('ComplexityBadge tem role="status" e aria-label', () => {
    const { getByRole } = render(
      <ResultCard
        estimation={mockEstimation}
        exchangeRates={[]}
        locale="pt-BR"
        leadCaptureHref="/pt-BR/lead-capture"
        completedCount={0}
      />
    )
    const badge = getByRole('status')
    expect(badge).toBeDefined()
    expect(badge.getAttribute('aria-label')).toContain('Complexidade')
  })

  it('CTA link tem texto descritivo e href correto', () => {
    const { getByRole } = render(
      <ResultCard
        estimation={mockEstimation}
        exchangeRates={[]}
        locale="pt-BR"
        leadCaptureHref="/pt-BR/lead-capture"
        completedCount={0}
      />
    )
    const link = getByRole('link', { name: /receber análise/i })
    expect(link).toBeDefined()
    expect(link.getAttribute('href')).toBe('/pt-BR/lead-capture')
  })
})
