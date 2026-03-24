import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock @vercel/analytics antes de importar events
vi.mock('@vercel/analytics', () => ({
  track: vi.fn(),
}))

// Mock consent — controlar retorno por teste
vi.mock('@/lib/analytics/consent', () => ({
  hasAnalyticsConsent: vi.fn(),
}))

import { track } from '@vercel/analytics'
import { hasAnalyticsConsent } from '@/lib/analytics/consent'
import {
  trackFlowStarted,
  trackQuestionAnswered,
  trackFlowCompleted,
  trackResultViewed,
  trackLeadCaptureViewed,
  trackLeadSubmitted,
  trackLeadSkipped,
  trackLocaleChanged,
  trackErrorOccurred,
} from '@/lib/analytics/events'

const mockTrack = vi.mocked(track)
const mockConsent = vi.mocked(hasAnalyticsConsent)

describe('safeTrack guard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('NÃO dispara track() quando consent é false', () => {
    mockConsent.mockReturnValue(false)
    trackFlowStarted()
    expect(mockTrack).not.toHaveBeenCalled()
  })

  it('dispara track() quando consent é true', () => {
    mockConsent.mockReturnValue(true)
    trackFlowStarted()
    expect(mockTrack).toHaveBeenCalledTimes(1)
    expect(mockTrack).toHaveBeenCalledWith(
      'flow_started',
      expect.objectContaining({ environment: expect.any(String) })
    )
  })
})

describe('eventos do funnel do visitante', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConsent.mockReturnValue(true)
  })

  it('trackFlowStarted envia evento correto', () => {
    trackFlowStarted()
    expect(mockTrack).toHaveBeenCalledWith('flow_started', expect.any(Object))
  })

  it('trackQuestionAnswered envia props corretas', () => {
    trackQuestionAnswered({ question_id: 'q1', block: 'scope', type: 'SINGLE_CHOICE' })
    expect(mockTrack).toHaveBeenCalledWith(
      'question_answered',
      expect.objectContaining({
        question_id: 'q1',
        block: 'scope',
        type: 'SINGLE_CHOICE',
      })
    )
  })

  it('trackFlowCompleted envia props corretas', () => {
    trackFlowCompleted({ session_id: 's1', questions_answered: 42, project_type: 'web' })
    expect(mockTrack).toHaveBeenCalledWith(
      'flow_completed',
      expect.objectContaining({
        session_id: 's1',
        questions_answered: 42,
        project_type: 'web',
      })
    )
  })

  it('trackResultViewed envia props corretas', () => {
    trackResultViewed({ complexity: 'high', price_range: '10000-20000', currency: 'BRL' })
    expect(mockTrack).toHaveBeenCalledWith(
      'result_viewed',
      expect.objectContaining({
        complexity: 'high',
        price_range: '10000-20000',
        currency: 'BRL',
      })
    )
  })

  it('trackLeadCaptureViewed envia evento sem props customizadas', () => {
    trackLeadCaptureViewed()
    expect(mockTrack).toHaveBeenCalledWith('lead_capture_viewed', expect.any(Object))
  })

  it('trackLeadSubmitted envia score e project_type (sem PII)', () => {
    trackLeadSubmitted({ score: 'A', project_type: 'mobile' })
    expect(mockTrack).toHaveBeenCalledWith(
      'lead_submitted',
      expect.objectContaining({ score: 'A', project_type: 'mobile' })
    )
  })

  it('trackLeadSkipped envia evento correto', () => {
    trackLeadSkipped()
    expect(mockTrack).toHaveBeenCalledWith('lead_skipped', expect.any(Object))
  })
})

describe('eventos de UX', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConsent.mockReturnValue(true)
  })

  it('trackLocaleChanged envia from e to', () => {
    trackLocaleChanged({ from: 'pt-BR', to: 'en-US' })
    expect(mockTrack).toHaveBeenCalledWith(
      'locale_changed',
      expect.objectContaining({ from: 'pt-BR', to: 'en-US' })
    )
  })
})

describe('eventos de erro', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConsent.mockReturnValue(true)
  })

  it('trackErrorOccurred envia error_code e route sem PII', () => {
    trackErrorOccurred({ error_code: 'SESSION_080', route: '/pt-BR/flow' })
    expect(mockTrack).toHaveBeenCalledWith(
      'error_occurred',
      expect.objectContaining({ error_code: 'SESSION_080', route: '/pt-BR/flow' })
    )
  })
})

describe('super properties', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConsent.mockReturnValue(true)
  })

  it('todos os eventos incluem environment como super property', () => {
    trackFlowStarted()
    const [, props] = mockTrack.mock.calls[0]
    expect(props).toHaveProperty('environment')
    expect(['production', 'staging']).toContain((props as Record<string, unknown>).environment)
  })

  it('todos os eventos incluem locale como super property', () => {
    trackFlowStarted()
    const [, props] = mockTrack.mock.calls[0]
    expect(props).toHaveProperty('locale')
  })
})
