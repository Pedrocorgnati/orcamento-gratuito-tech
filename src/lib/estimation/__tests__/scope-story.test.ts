// src/lib/estimation/__tests__/scope-story.test.ts
import { describe, it, expect, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { generateScopeStory } from '../scope-story'
import { Locale, ProjectType } from '@/lib/enums'

// ─────────────────────────────────────────────────────────────────────────────
// Testes
// ─────────────────────────────────────────────────────────────────────────────

describe('generateScopeStory()', () => {
  // ── Locale pt_BR ──────────────────────────────────────────────────────────
  it('pt_BR + features=[autenticação] → contém "Sistema Web" e "autenticação"', () => {
    const result = generateScopeStory(['autenticação'], ProjectType.WEB_APP, Locale.PT_BR)
    expect(result).toContain('Sistema Web')
    expect(result).toContain('autenticação')
  })

  // ── Locale en_US ──────────────────────────────────────────────────────────
  it('en_US → contém "Web Application"', () => {
    const result = generateScopeStory(['auth'], ProjectType.WEB_APP, Locale.EN_US)
    expect(result).toContain('Web Application')
  })

  // ── Locale es_ES ──────────────────────────────────────────────────────────
  it('es_ES → contém "Aplicación Web"', () => {
    const result = generateScopeStory(['auth'], ProjectType.WEB_APP, Locale.ES_ES)
    expect(result).toContain('Aplicación Web')
  })

  // ── Locale it_IT ──────────────────────────────────────────────────────────
  it('it_IT → contém "Applicazione Web"', () => {
    const result = generateScopeStory(['auth'], ProjectType.WEB_APP, Locale.IT_IT)
    expect(result).toContain('Applicazione Web')
  })

  // ── Features vazio ────────────────────────────────────────────────────────
  it('features vazio → contém "—"', () => {
    const result = generateScopeStory([], ProjectType.WEB_APP, Locale.PT_BR)
    expect(result).toContain('—')
  })

  // ── Todos os 5 ProjectType em pt_BR ───────────────────────────────────────
  it('WEBSITE em pt_BR → contém "Site Institucional"', () => {
    const result = generateScopeStory(['página'], ProjectType.WEBSITE, Locale.PT_BR)
    expect(result).toContain('Site Institucional')
  })

  it('ECOMMERCE em pt_BR → contém "E-Commerce"', () => {
    const result = generateScopeStory(['catálogo'], ProjectType.ECOMMERCE, Locale.PT_BR)
    expect(result).toContain('E-Commerce')
  })

  it('WEB_APP em pt_BR → contém "Sistema Web"', () => {
    const result = generateScopeStory(['dashboard'], ProjectType.WEB_APP, Locale.PT_BR)
    expect(result).toContain('Sistema Web')
  })

  it('MOBILE_APP em pt_BR → contém "Aplicativo Mobile"', () => {
    const result = generateScopeStory(['push'], ProjectType.MOBILE_APP, Locale.PT_BR)
    expect(result).toContain('Aplicativo Mobile')
  })

  it('AUTOMATION_AI em pt_BR → contém "Automação com IA"', () => {
    const result = generateScopeStory(['chatbot'], ProjectType.AUTOMATION_AI, Locale.PT_BR)
    expect(result).toContain('Automação com IA')
  })
})
