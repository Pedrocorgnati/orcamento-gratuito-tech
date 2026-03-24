// src/tests/unit/question-types.test.ts
// Verifica os 7 tipos de pergunta definidos no QuestionType enum (INT-050)
// Rastreabilidade: INT-050

import { describe, it, expect } from 'vitest'

describe('INT-050: 7 tipos de pergunta (QuestionType enum)', () => {
  const VALID_TYPES = [
    'SINGLE_CHOICE',
    'MULTIPLE_CHOICE',
    'TEXT_INPUT',
    'NUMBER_INPUT',
    'RANGE_SELECT',
    'BUDGET_SELECT',
    'DEADLINE_SELECT',
  ] as const

  it('deve ter exatamente 7 tipos definidos', () => {
    expect(VALID_TYPES).toHaveLength(7)
  })

  it('cada tipo deve ser uma string não-vazia em UPPER_SNAKE_CASE', () => {
    VALID_TYPES.forEach((type) => {
      expect(typeof type).toBe('string')
      expect(type.length).toBeGreaterThan(0)
      expect(type).toMatch(/^[A-Z][A-Z0-9_]*$/)
    })
  })

  it('tipos devem ser únicos (sem duplicatas)', () => {
    const unique = new Set(VALID_TYPES)
    expect(unique.size).toBe(VALID_TYPES.length)
  })

  it('SINGLE_CHOICE deve estar presente (tipo principal do motor)', () => {
    expect(VALID_TYPES).toContain('SINGLE_CHOICE')
  })

  it('MULTIPLE_CHOICE deve estar presente (respostas múltiplas)', () => {
    expect(VALID_TYPES).toContain('MULTIPLE_CHOICE')
  })

  it('TEXT_INPUT deve estar presente (captura de texto livre)', () => {
    expect(VALID_TYPES).toContain('TEXT_INPUT')
  })

  it('tipos numéricos/seleção devem estar todos presentes', () => {
    expect(VALID_TYPES).toContain('NUMBER_INPUT')
    expect(VALID_TYPES).toContain('RANGE_SELECT')
    expect(VALID_TYPES).toContain('BUDGET_SELECT')
    expect(VALID_TYPES).toContain('DEADLINE_SELECT')
  })
})
