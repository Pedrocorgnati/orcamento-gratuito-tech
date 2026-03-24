import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock next-intl — must be before component import
const mockT = vi.fn((key: string, params?: Record<string, unknown>) => {
  if (key === 'progress_label' && params) {
    return `Pergunta ${params.answered} de ~${params.total}`
  }
  return key
})

vi.mock('next-intl', () => ({
  useTranslations: () => mockT,
}))

import { ProgressBar } from './ProgressBar'

describe('ProgressBar', () => {
  it('renderiza com role=progressbar', () => {
    render(<ProgressBar progress={50} questionsAnswered={7} estimatedTotal={14} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toBeInTheDocument()
  })

  it('define aria-valuenow corretamente', () => {
    render(<ProgressBar progress={75} questionsAnswered={10} estimatedTotal={14} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '75')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
  })

  it('clamp: progress > 100 vira 100', () => {
    render(<ProgressBar progress={150} questionsAnswered={20} estimatedTotal={14} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '100')
  })

  it('clamp: progress < 0 vira 0', () => {
    render(<ProgressBar progress={-10} questionsAnswered={0} estimatedTotal={14} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '0')
  })

  it('clamp: progress NaN vira 0', () => {
    render(<ProgressBar progress={NaN} questionsAnswered={0} estimatedTotal={14} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '0')
  })

  it('chama useTranslations("flow") com params corretos', () => {
    mockT.mockClear()
    render(<ProgressBar progress={50} questionsAnswered={7} estimatedTotal={14} />)
    expect(mockT).toHaveBeenCalledWith('progress_label', { answered: 7, total: 14 })
  })

  it('exibe label traduzido na tela', () => {
    render(<ProgressBar progress={50} questionsAnswered={7} estimatedTotal={14} />)
    expect(screen.getByText(/Pergunta 7 de ~14/)).toBeInTheDocument()
  })
})
