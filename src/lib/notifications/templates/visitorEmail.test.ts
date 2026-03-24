import { describe, it, expect } from 'vitest'
import { render } from '@react-email/components'
import { renderVisitorEmail } from './visitorEmail'
import { LeadScore, ComplexityLevel, Locale, Currency } from '@/lib/enums'
import type { Lead } from '@prisma/client'
import type { EstimationResult } from '@/lib/types'

const baseLead: Lead = {
  id: 'cuid2',
  session_id: 'session-2',
  name: 'Ana Souza',
  email: 'ana@teste.com',
  phone: null,
  company: null,
  score: LeadScore.B,
  score_budget: 20,
  score_timeline: 20,
  score_profile: 15,
  score_total: 55,
  project_type: 'WEB_APP',
  complexity: ComplexityLevel.MEDIUM,
  estimated_price_min: 8000,
  estimated_price_max: 12000,
  estimated_days_min: 30,
  estimated_days_max: 40,
  features: ['Autenticação', 'Dashboard'],
  scope_story: 'Sistema de gestão com dashboard e autenticação segura.',
  locale: Locale.PT_BR,
  currency: Currency.BRL,
  consent_given: true,
  consent_version: '1.0',
  consent_at: new Date(),
  marketing_consent: false,
  honeypot_triggered: false,
  email_status: 'PENDING',
  email_retry_count: 0,
  email_sent_at: null,
  anonymized_at: null,
  is_suspicious: false,
  suspicious_pattern: null,
  accuracy_feedback: null,
  created_at: new Date(),
  updated_at: new Date(),
}

const mockEstimation: EstimationResult = {
  projectType: 'WEB_APP' as any,
  complexity: ComplexityLevel.MEDIUM,
  priceMin: 8000,
  priceMax: 12000,
  daysMin: 30,
  daysMax: 40,
  currency: Currency.BRL,
  locale: Locale.PT_BR,
  features: ['Autenticação', 'Dashboard'],
  scopeStory: 'Sistema de gestão com dashboard e autenticação segura.',
  consistencyAlerts: [],
  score: LeadScore.B,
  scoreBudget: 20,
  scoreTimeline: 20,
  scoreProfile: 15,
  scoreTotal: 55,
}

describe('visitorEmail template (NOTIF-003)', () => {
  it('renderiza em pt_BR sem erros', async () => {
    const html = await render(
      renderVisitorEmail({
        lead: { ...baseLead, locale: Locale.PT_BR },
        estimation: mockEstimation,
      })
    )
    expect(html).toContain('Ana')
    expect(html).toContain('Próximos Passos')
    expect(html).not.toContain('Q&A')
  })

  it('renderiza em en_US com textos em inglês', async () => {
    const html = await render(
      renderVisitorEmail({
        lead: { ...baseLead, locale: Locale.EN_US },
        estimation: { ...mockEstimation, locale: Locale.EN_US },
      })
    )
    expect(html).toContain('Next Steps')
    expect(html).toContain('Estimated investment')
  })

  it('renderiza em es_ES com textos em espanhol', async () => {
    const html = await render(
      renderVisitorEmail({
        lead: { ...baseLead, locale: Locale.ES_ES },
        estimation: { ...mockEstimation, locale: Locale.ES_ES },
      })
    )
    expect(html).toContain('Próximos Pasos')
  })

  it('renderiza em it_IT com textos em italiano', async () => {
    const html = await render(
      renderVisitorEmail({
        lead: { ...baseLead, locale: Locale.IT_IT },
        estimation: { ...mockEstimation, locale: Locale.IT_IT },
      })
    )
    expect(html).toContain('Prossimi Passi')
  })

  it('usa pt_BR como fallback para locale desconhecido', async () => {
    const html = await render(
      renderVisitorEmail({
        lead: { ...baseLead, locale: 'ja_JP' },
        estimation: mockEstimation,
      })
    )
    expect(html).toContain('Próximos Passos')
  })

  it('não inclui respostas Q&A detalhadas (GDPR minimization)', async () => {
    const html = await render(
      renderVisitorEmail({ lead: baseLead, estimation: mockEstimation })
    )
    expect(html).not.toMatch(/Pergunta \d+/)
    expect(html).not.toMatch(/Resposta:/)
    expect(html).not.toMatch(/answers/)
  })

  it('usa apenas o primeiro nome na saudação', async () => {
    const html = await render(
      renderVisitorEmail({ lead: baseLead, estimation: mockEstimation })
    )
    expect(html).toContain('Ana')
    expect(html).not.toContain('Ana Souza')
  })

  it('localiza unidade de dias — "business days" para en_US', async () => {
    const html = await render(
      renderVisitorEmail({
        lead: { ...baseLead, locale: Locale.EN_US },
        estimation: { ...mockEstimation, locale: Locale.EN_US },
      })
    )
    expect(html).toContain('business days')
    expect(html).not.toContain('dias')
  })

  it('contém CTA button localizado', async () => {
    const html = await render(
      renderVisitorEmail({ lead: baseLead, estimation: mockEstimation })
    )
    expect(html).toContain('Ver meu orçamento')
    expect(html).toContain('/thank-you')
  })

  it('contém footer de privacidade LGPD/GDPR', async () => {
    const html = await render(
      renderVisitorEmail({ lead: baseLead, estimation: mockEstimation })
    )
    expect(html).toContain('preencheu o formulário')
    expect(html).toContain('LGPD')
  })

  it('footer de privacidade em inglês para en_US', async () => {
    const html = await render(
      renderVisitorEmail({
        lead: { ...baseLead, locale: Locale.EN_US },
        estimation: { ...mockEstimation, locale: Locale.EN_US },
      })
    )
    expect(html).toContain('submitted an estimate form')
    expect(html).toContain('GDPR')
  })
})
