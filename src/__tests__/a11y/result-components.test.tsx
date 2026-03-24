/**
 * Testes de Acessibilidade — Componentes da Result Page (module-11)
 * Rastreabilidade: INT-077, FEAT-EE-008
 */

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { ComplexityBadge } from '@/components/result/ComplexityBadge'
import { ScopeStoryCard } from '@/components/result/ScopeStoryCard'
import { SocialProofSection } from '@/components/result/SocialProofSection'
import { ComplexityLevel, Currency, Locale, ProjectType, LeadScore } from '@/lib/enums'
import type { EstimationResult } from '@/lib/types'

expect.extend(toHaveNoViolations)

// ─────────────────────────────────────────────────────────────────────────────
// Mock de EstimationResult
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// ComplexityBadge
// ─────────────────────────────────────────────────────────────────────────────

describe('ComplexityBadge — Acessibilidade', () => {
  it('não deve ter violações axe-core para nível MEDIUM', async () => {
    const { container } = render(
      <ComplexityBadge complexity={ComplexityLevel.MEDIUM} locale="pt-BR" />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('tem role="status" e aria-label para todos os níveis', () => {
    for (const level of Object.values(ComplexityLevel)) {
      // Cada render usa container isolado para evitar acúmulo no document
      const { container } = render(
        <ComplexityBadge complexity={level} locale="pt-BR" />
      )
      const badge = container.querySelector('[role="status"]')
      expect(badge).toBeDefined()
      expect(badge?.getAttribute('aria-label')).toBeTruthy()
    }
  })

  it('exibe label correto para pt-BR: MEDIUM = "Média"', () => {
    const { getByRole } = render(
      <ComplexityBadge complexity={ComplexityLevel.MEDIUM} locale="pt-BR" />
    )
    expect(getByRole('status').textContent).toBe('Média')
  })

  it('exibe label correto para en-US: HIGH = "High"', () => {
    const { getByRole } = render(
      <ComplexityBadge complexity={ComplexityLevel.HIGH} locale="en-US" />
    )
    expect(getByRole('status').textContent).toBe('High')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ScopeStoryCard
// ─────────────────────────────────────────────────────────────────────────────

describe('ScopeStoryCard — Acessibilidade', () => {
  it('não deve ter violações axe-core', async () => {
    const { container } = render(
      <ScopeStoryCard
        scopeStory={mockEstimation.scopeStory}
        features={mockEstimation.features}
        locale="pt-BR"
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('tem h2 com texto localizado (pt-BR)', () => {
    const { getByRole } = render(
      <ScopeStoryCard
        scopeStory="narrativa"
        features={['autenticação']}
        locale="pt-BR"
      />
    )
    const heading = getByRole('heading', { level: 2 })
    expect(heading.textContent).toBe('Sobre o seu projeto')
  })

  it('tem h2 com texto localizado (en-US)', () => {
    const { getByRole } = render(
      <ScopeStoryCard
        scopeStory="narrative"
        features={['authentication']}
        locale="en-US"
      />
    )
    expect(getByRole('heading', { level: 2 }).textContent).toBe('About your project')
  })

  it('FeatureList está acessível dentro do ScopeStoryCard', () => {
    const { getByRole } = render(
      <ScopeStoryCard
        scopeStory="narrativa"
        features={['auth', 'admin']}
        locale="pt-BR"
      />
    )
    const list = getByRole('list')
    expect(list.getAttribute('aria-label')).toBeTruthy()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SocialProofSection
// ─────────────────────────────────────────────────────────────────────────────

describe('SocialProofSection — Acessibilidade', () => {
  it('não deve ter violações axe-core', async () => {
    const { container } = render(
      <SocialProofSection completedCount={1247} locale="pt-BR" />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('<section> tem aria-label="Prova social"', () => {
    const { getByRole } = render(
      <SocialProofSection completedCount={500} locale="pt-BR" />
    )
    const section = getByRole('region', { name: /prova social/i })
    expect(section).toBeDefined()
  })

  it('exibe "Mais de 1.200 orçamentos gerados" para count=1247, pt-BR', () => {
    const { getByText } = render(
      <SocialProofSection completedCount={1247} locale="pt-BR" />
    )
    expect(getByText(/mais de 1\.200 orçamentos gerados/i)).toBeDefined()
  })

  it('exibe "More than 1,200 estimates generated" para count=1247, en-US', () => {
    const { getByText } = render(
      <SocialProofSection completedCount={1247} locale="en-US" />
    )
    expect(getByText(/more than 1,200 estimates generated/i)).toBeDefined()
  })

  it('não oculta seção quando count=0', () => {
    const { getByRole } = render(
      <SocialProofSection completedCount={0} locale="pt-BR" />
    )
    expect(getByRole('region')).toBeDefined()
  })
})
