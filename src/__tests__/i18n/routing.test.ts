import { describe, it, expect } from 'vitest'
import {
  routing,
  LOCALE_URL_TO_ENUM,
  LOCALE_ENUM_TO_URL,
  type AppLocale,
} from '@/i18n/routing'

describe('routing config', () => {
  it('routing.locales contem exatamente 4 locales', () => {
    expect(routing.locales).toEqual(['pt-BR', 'en-US', 'es-ES', 'it-IT'])
  })

  it('routing.defaultLocale e pt-BR', () => {
    expect(routing.defaultLocale).toBe('pt-BR')
  })

  it('routing.localePrefix e always', () => {
    expect(routing.localePrefix).toBe('always')
  })

  it('AppLocale type aceita locales validos', () => {
    // Type-level check: se compila, o tipo esta correto
    const validLocales: AppLocale[] = ['pt-BR', 'en-US', 'es-ES', 'it-IT']
    expect(validLocales).toHaveLength(4)
  })
})

describe('LOCALE_URL_TO_ENUM', () => {
  it('mapeia pt-BR para pt_BR', () => {
    expect(LOCALE_URL_TO_ENUM['pt-BR']).toBe('pt_BR')
  })

  it('mapeia en-US para en_US', () => {
    expect(LOCALE_URL_TO_ENUM['en-US']).toBe('en_US')
  })

  it('mapeia es-ES para es_ES', () => {
    expect(LOCALE_URL_TO_ENUM['es-ES']).toBe('es_ES')
  })

  it('mapeia it-IT para it_IT', () => {
    expect(LOCALE_URL_TO_ENUM['it-IT']).toBe('it_IT')
  })

  it('contem exatamente 4 entradas', () => {
    expect(Object.keys(LOCALE_URL_TO_ENUM)).toHaveLength(4)
  })
})

describe('LOCALE_ENUM_TO_URL', () => {
  it('e o inverso correto de LOCALE_URL_TO_ENUM', () => {
    for (const [urlFormat, enumFormat] of Object.entries(LOCALE_URL_TO_ENUM)) {
      expect(LOCALE_ENUM_TO_URL[enumFormat]).toBe(urlFormat)
    }
  })

  it('contem exatamente 4 entradas', () => {
    expect(Object.keys(LOCALE_ENUM_TO_URL)).toHaveLength(4)
  })
})
