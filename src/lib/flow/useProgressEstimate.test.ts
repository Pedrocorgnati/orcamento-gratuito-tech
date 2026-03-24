import { renderHook } from '@testing-library/react'
import { useProgressEstimate } from './useProgressEstimate'

describe('useProgressEstimate', () => {
  it('WEBSITE → estimatedTotal = 12', () => {
    const { result } = renderHook(() =>
      useProgressEstimate({ projectType: 'WEBSITE', questionsAnswered: 6, sessionProgress: 0 })
    )
    expect(result.current.estimatedTotal).toBe(12)
  })

  it('MOBILE_APP → estimatedTotal = 18', () => {
    const { result } = renderHook(() =>
      useProgressEstimate({ projectType: 'MOBILE_APP', questionsAnswered: 9, sessionProgress: 0 })
    )
    expect(result.current.estimatedTotal).toBe(18)
  })

  it('ECOMMERCE → estimatedTotal = 16', () => {
    const { result } = renderHook(() =>
      useProgressEstimate({ projectType: 'ECOMMERCE', questionsAnswered: 8, sessionProgress: 0 })
    )
    expect(result.current.estimatedTotal).toBe(16)
  })

  it('tipo desconhecido → fallback = 15', () => {
    const { result } = renderHook(() =>
      useProgressEstimate({ projectType: 'UNKNOWN_TYPE', questionsAnswered: 5, sessionProgress: 0 })
    )
    expect(result.current.estimatedTotal).toBe(15)
  })

  it('sem tipo (null) → fallback = 15', () => {
    const { result } = renderHook(() =>
      useProgressEstimate({ projectType: null, questionsAnswered: 5, sessionProgress: 0 })
    )
    expect(result.current.estimatedTotal).toBe(15)
  })

  it('sessionProgress > 0 → usa sessionProgress', () => {
    const { result } = renderHook(() =>
      useProgressEstimate({ projectType: 'WEBSITE', questionsAnswered: 6, sessionProgress: 75 })
    )
    expect(result.current.progressPercent).toBe(75)
  })

  it('sessionProgress = 0 → calcula a partir de questionsAnswered', () => {
    const { result } = renderHook(() =>
      useProgressEstimate({ projectType: 'WEBSITE', questionsAnswered: 6, sessionProgress: 0 })
    )
    expect(result.current.progressPercent).toBe(50) // 6/12 * 100
  })

  it('progressPercent nunca excede 99 quando calculado', () => {
    const { result } = renderHook(() =>
      useProgressEstimate({ projectType: 'WEBSITE', questionsAnswered: 100, sessionProgress: 0 })
    )
    expect(result.current.progressPercent).toBe(99)
  })

  it('sessionProgress > 100 → clamped a 100', () => {
    const { result } = renderHook(() =>
      useProgressEstimate({ projectType: 'WEBSITE', questionsAnswered: 6, sessionProgress: 150 })
    )
    expect(result.current.progressPercent).toBe(100)
  })
})
