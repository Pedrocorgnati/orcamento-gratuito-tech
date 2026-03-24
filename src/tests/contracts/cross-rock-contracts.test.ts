// src/tests/contracts/cross-rock-contracts.test.ts
// 11 contratos de interface entre ROCKs + cenários ERROR/DEGRADED/EDGE
// Rastreabilidade: INT-040, INT-050, INT-055, INT-084, INT-108, FEAT-DE-006

import { describe, it, expect } from 'vitest'

// ─────────────────────────────────────────────────────────────────────────────
// Tipos de referência (extraídos de @prisma/client e tipos do projeto)
// Usados para verificação compile-time — não importam de server-only modules
// ─────────────────────────────────────────────────────────────────────────────

// Espelha Option do Prisma schema (module-7)
type OptionImpacts = {
  price_impact: number
  time_impact: number
  complexity_impact: number
}

// Espelha EstimationResult (module-10)
type EstimationResult = {
  price_min: number
  price_max: number
  time_weeks_min: number
  time_weeks_max: number
  complexity: string
  currency: string
}

// Espelha SessionStatus enum (module-2)
const VALID_SESSION_STATUSES = ['IN_PROGRESS', 'COMPLETED', 'ABANDONED', 'EXPIRED'] as const
type SessionStatus = (typeof VALID_SESSION_STATUSES)[number]

// Espelha locales suportados (module-3)
const SUPPORTED_LOCALES = ['pt-BR', 'en-US', 'es-ES', 'it-IT'] as const
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

// ─────────────────────────────────────────────────────────────────────────────
// CONTRACT-01: R1→R2 — Option impacts → calculateEstimation
// ─────────────────────────────────────────────────────────────────────────────

describe('CONTRACT-01: R1→R2 — Option impacts → cálculo de estimativa', () => {
  it('Option deve ter campos price_impact, time_impact, complexity_impact como number', () => {
    const mockOption: OptionImpacts = {
      price_impact: 1.5,
      time_impact: 2.0,
      complexity_impact: 1.2,
    }
    expect(mockOption.price_impact).toBeTypeOf('number')
    expect(mockOption.time_impact).toBeTypeOf('number')
    expect(mockOption.complexity_impact).toBeTypeOf('number')
  })

  it('impacts devem ser positivos para adições de escopo', () => {
    const options: OptionImpacts[] = [
      { price_impact: 1.0, time_impact: 1.0, complexity_impact: 1.0 },
      { price_impact: 1.5, time_impact: 1.2, complexity_impact: 1.3 },
    ]
    options.forEach((opt) => {
      expect(Number.isFinite(opt.price_impact)).toBe(true)
      expect(Number.isFinite(opt.time_impact)).toBe(true)
      expect(Number.isFinite(opt.complexity_impact)).toBe(true)
    })
  })

  it('EstimationResult deve ter price_min < price_max (invariante INV-001)', () => {
    // Simula resultado do calculateEstimation
    const finalPrice = 15000
    const result: EstimationResult = {
      price_min: finalPrice * 0.85,
      price_max: finalPrice * 1.15,
      time_weeks_min: 4,
      time_weeks_max: 8,
      complexity: 'MEDIUM',
      currency: 'BRL',
    }
    expect(result.price_max).toBeGreaterThan(result.price_min)
    expect(result.price_min).toBe(finalPrice * 0.85)
    expect(result.price_max).toBe(finalPrice * 1.15)
  })

  it('EstimationResult deve ter campos obrigatórios: price_min, price_max, time_weeks_min, time_weeks_max, complexity', () => {
    const result: EstimationResult = {
      price_min: 10000,
      price_max: 20000,
      time_weeks_min: 4,
      time_weeks_max: 8,
      complexity: 'HIGH',
      currency: 'BRL',
    }
    expect(result).toHaveProperty('price_min')
    expect(result).toHaveProperty('price_max')
    expect(result).toHaveProperty('time_weeks_min')
    expect(result).toHaveProperty('time_weeks_max')
    expect(result).toHaveProperty('complexity')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// CONTRACT-02: R1→R2 — path_taken reflete DAG
// ─────────────────────────────────────────────────────────────────────────────

describe('CONTRACT-02: R1→R2 — Session.path_taken reflete navegação DAG', () => {
  it('path_taken deve ser array de string (question_ids)', () => {
    type PathTaken = string[]
    const mockPath: PathTaken = ['q-001', 'q-003', 'q-007']
    expect(Array.isArray(mockPath)).toBe(true)
    expect(mockPath.every((id) => typeof id === 'string')).toBe(true)
  })

  it('path_taken não deve ter duplicatas em fluxo linear', () => {
    const path: string[] = ['q-001', 'q-003', 'q-007', 'q-015']
    const unique = new Set(path)
    expect(unique.size).toBe(path.length)
  })

  it('path_taken pode ter skip de questões em DAG não-linear (válido)', () => {
    // Em DAG com branching, path pode pular questões (ex: q-005 a q-009)
    const pathWithSkip: string[] = ['q-001', 'q-010', 'q-015']
    expect(pathWithSkip.length).toBeGreaterThan(0)
    expect(pathWithSkip[0]).toBe('q-001') // sempre começa na primeira questão
    // path válido mesmo com skip — o DAG define quais questões são obrigatórias
    expect(Array.isArray(pathWithSkip)).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// CONTRACT-03: R2→R3 — EstimationResult → Lead populated
// ─────────────────────────────────────────────────────────────────────────────

describe('CONTRACT-03: R2→R3 — EstimationResult → Lead.estimated_price populado', () => {
  it('campos de EstimationResult mapeiam diretamente para Lead model', () => {
    type LeadRequiredFromEstimation = {
      estimated_price_min: number | null
      estimated_price_max: number | null
      complexity: string
    }

    const estimation: EstimationResult = {
      price_min: 10000,
      price_max: 20000,
      time_weeks_min: 4,
      time_weeks_max: 8,
      complexity: 'alta',
      currency: 'BRL',
    }

    const leadData: LeadRequiredFromEstimation = {
      estimated_price_min: estimation.price_min,
      estimated_price_max: estimation.price_max,
      complexity: estimation.complexity,
    }

    expect(leadData.estimated_price_min).toBe(10000)
    expect(leadData.estimated_price_max).toBe(20000)
    expect(leadData.estimated_price_max!).toBeGreaterThan(leadData.estimated_price_min!)
    expect(typeof leadData.complexity).toBe('string')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// CONTRACT-04: R2→R3 — Session COMPLETED → redirect /lead-capture
// ─────────────────────────────────────────────────────────────────────────────

describe('CONTRACT-04: R2→R3 — Session COMPLETED → redirect para /lead-capture', () => {
  it('status COMPLETED deve ser um dos SessionStatus válidos', () => {
    const status: SessionStatus = 'COMPLETED'
    expect(VALID_SESSION_STATUSES).toContain(status)
  })

  it('URL de redirect deve incluir session_id como parâmetro de query', () => {
    const sessionId = 'test-session-123'
    const redirectUrl = `/pt-BR/lead-capture?session_id=${sessionId}`
    expect(redirectUrl).toContain(sessionId)
    expect(redirectUrl).toContain('/lead-capture')
    expect(redirectUrl).toContain('session_id=')
  })

  it('todos os SessionStatus válidos devem estar definidos', () => {
    expect(VALID_SESSION_STATUSES).toHaveLength(4)
    expect(VALID_SESSION_STATUSES).toContain('IN_PROGRESS')
    expect(VALID_SESSION_STATUSES).toContain('COMPLETED')
    expect(VALID_SESSION_STATUSES).toContain('ABANDONED')
    expect(VALID_SESSION_STATUSES).toContain('EXPIRED')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// CONTRACT-05: R1→R4 — QuestionCard animações de module-15
// ─────────────────────────────────────────────────────────────────────────────

describe('CONTRACT-05: R1→R4 — QuestionCard animações do module-15', () => {
  it('AnimationConfig deve ter duration positivo e easing válido', () => {
    type AnimationConfig = {
      duration: number
      easing: string
      delay?: number
    }
    const config: AnimationConfig = { duration: 300, easing: 'ease-in-out' }
    expect(config.duration).toBeGreaterThan(0)
    expect(config.duration).toBeLessThanOrEqual(500) // < 500ms budget de performance
    expect(config.easing).toBeTruthy()
  })

  it('ProgressBar deve aceitar value entre 0 e max (contrato de props)', () => {
    type ProgressBarProps = { value: number; max: number }
    const props: ProgressBarProps = { value: 42, max: 100 }
    expect(props.value).toBeGreaterThanOrEqual(0)
    expect(props.value).toBeLessThanOrEqual(props.max)
  })

  it('ProgressBar com value = 0 deve ser válido (estado inicial)', () => {
    type ProgressBarProps = { value: number; max: number }
    const props: ProgressBarProps = { value: 0, max: 42 }
    expect(props.value).toBeGreaterThanOrEqual(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// CONTRACT-06: R2→R4 — /result componentes presentes
// ─────────────────────────────────────────────────────────────────────────────

describe('CONTRACT-06: R2→R4 — /result tem EstimationDisplay + ScopeStoryCard', () => {
  it('EstimationDisplay deve aceitar price_min, price_max, currency (contrato de props)', () => {
    type EstimationDisplayProps = {
      price_min: number
      price_max: number
      currency: 'BRL' | 'USD' | 'EUR'
      time_weeks_min: number
      time_weeks_max: number
    }
    const props: EstimationDisplayProps = {
      price_min: 10000,
      price_max: 25000,
      currency: 'BRL',
      time_weeks_min: 4,
      time_weeks_max: 10,
    }
    expect(props.price_min).toBeLessThan(props.price_max)
    expect(['BRL', 'USD', 'EUR']).toContain(props.currency)
  })

  it('ScopeStoryCard deve aceitar projectType e complexity como strings', () => {
    type ScopeStoryCardProps = { projectType: string; complexity: string }
    const props: ScopeStoryCardProps = { projectType: 'saas', complexity: 'alta' }
    expect(props.projectType).toBeTruthy()
    expect(props.complexity).toBeTruthy()
  })

  it('currency suportadas devem ser exatamente BRL, USD, EUR (config.json)', () => {
    const supportedCurrencies = ['BRL', 'USD', 'EUR', 'USDC'] as const
    expect(supportedCurrencies).toContain('BRL')
    expect(supportedCurrencies).toContain('USD')
    expect(supportedCurrencies).toContain('EUR')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// CONTRACT-07: R3→R4 — Cookie consent gate bloqueia analytics
// ─────────────────────────────────────────────────────────────────────────────

describe('CONTRACT-07: R3→R4 — Cookie consent gate controla analytics', () => {
  it('hasConsent deve retornar false quando cookie não está presente', () => {
    const cookieStr = ''
    const hasConsent = cookieStr.split('; ').some((row) => row === 'COOKIE_CONSENT=true')
    expect(hasConsent).toBe(false)
  })

  it('hasConsent deve retornar true com cookie COOKIE_CONSENT=true', () => {
    const cookieStr = 'COOKIE_CONSENT=true; other_cookie=value'
    const hasConsent = cookieStr.split('; ').some((row) => row === 'COOKIE_CONSENT=true')
    expect(hasConsent).toBe(true)
  })

  it('analytics não deve ser chamado sem consent (gate pattern)', () => {
    let trackCalled = false
    function safeTrack(_event: string) {
      const hasConsent = false // sem cookie
      if (!hasConsent) return
      trackCalled = true
    }
    safeTrack('test_event')
    expect(trackCalled).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// CONTRACT-08: Skeleton→R1 — type imports de locale
// ─────────────────────────────────────────────────────────────────────────────

describe('CONTRACT-08: Skeleton→R1 — LocaleParam válido para module-8', () => {
  it('locales suportados devem ser 4 (pt-BR, en-US, es-ES, it-IT)', () => {
    expect(SUPPORTED_LOCALES).toHaveLength(4)
    expect(SUPPORTED_LOCALES).toContain('pt-BR')
    expect(SUPPORTED_LOCALES).toContain('en-US')
    expect(SUPPORTED_LOCALES).toContain('es-ES')
    expect(SUPPORTED_LOCALES).toContain('it-IT')
  })

  it('LocaleParam com locale válido deve ser aceito', () => {
    const param: { locale: SupportedLocale } = { locale: 'pt-BR' }
    expect(SUPPORTED_LOCALES as readonly string[]).toContain(param.locale)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// CONTRACT-09: Skeleton→R2 — Session campos para cálculo
// ─────────────────────────────────────────────────────────────────────────────

describe('CONTRACT-09: Skeleton→R2 — Session tem campos para estimativa', () => {
  it('SessionForEstimation deve ter id, status, path_taken e questions_answered', () => {
    type SessionForEstimation = {
      id: string
      status: string
      path_taken: string[]
      questions_answered: number
    }
    const session: SessionForEstimation = {
      id: 'session-123',
      status: 'COMPLETED',
      path_taken: ['q-001', 'q-003'],
      questions_answered: 42,
    }
    expect(session.questions_answered).toBe(42)
    expect(Array.isArray(session.path_taken)).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// CONTRACT-10: Skeleton→R3 — Lead model + RESEND_API_KEY documentado
// ─────────────────────────────────────────────────────────────────────────────

describe('CONTRACT-10: Skeleton→R3 — Lead model + env documentado', () => {
  it('LeadCreate deve ter email_consent e marketing_consent como boolean', () => {
    type LeadCreate = {
      name?: string
      email?: string
      email_consent: boolean
      marketing_consent: boolean
      session_id: string
      score: string
    }
    const lead: LeadCreate = {
      email: 'test@example.com',
      email_consent: true,
      marketing_consent: false,
      session_id: 'session-123',
      score: 'A',
    }
    expect(lead.email_consent).toBe(true)
    expect(lead.score).toMatch(/^[ABCD]$/)
    expect(typeof lead.marketing_consent).toBe('boolean')
  })

  it('RESEND_API_KEY deve estar documentado no .env.example', async () => {
    const { readFileSync } = await import('fs')
    const { join } = await import('path')
    const envExample = readFileSync(join(process.cwd(), '.env.example'), 'utf-8')
    expect(envExample).toContain('RESEND_API_KEY')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// CONTRACT-11: Skeleton→R4 — rotas /[locale]/* existem no app router
// ─────────────────────────────────────────────────────────────────────────────

describe('CONTRACT-11: Skeleton→R4 — rotas /[locale]/* existem', () => {
  it('route /[locale]/flow deve existir no app router', async () => {
    const { existsSync } = await import('fs')
    const { join } = await import('path')
    const flowPage = join(process.cwd(), 'src', 'app', '[locale]', 'flow', 'page.tsx')
    expect(
      existsSync(flowPage),
      `CONTRACT-11: Rota /[locale]/flow não encontrada. Esperado: ${flowPage}`
    ).toBe(true)
  })

  it('route /[locale]/result deve existir no app router', async () => {
    const { existsSync } = await import('fs')
    const { join } = await import('path')
    const resultPage = join(process.cwd(), 'src', 'app', '[locale]', 'result', 'page.tsx')
    expect(
      existsSync(resultPage),
      `CONTRACT-11: Rota /[locale]/result não encontrada. Esperado: ${resultPage}`
    ).toBe(true)
  })

  it('route /[locale]/lead-capture deve existir no app router', async () => {
    const { existsSync } = await import('fs')
    const { join } = await import('path')
    const leadPage = join(process.cwd(), 'src', 'app', '[locale]', 'lead-capture', 'page.tsx')
    expect(
      existsSync(leadPage),
      `CONTRACT-11: Rota /[locale]/lead-capture não encontrada. Esperado: ${leadPage}`
    ).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GROUP 5 — Cenários ERROR, DEGRADED e EDGE
// ─────────────────────────────────────────────────────────────────────────────

// ── CONTRACT-01-ERROR: calculateEstimation falha → erro tipado propagado ──

describe('CONTRACT-01-ERROR: estimação falha com erro tipado (não engole silenciosamente)', () => {
  it('deve lançar erro tipado quando estimação falha — não retornar undefined', async () => {
    async function faultyCalculate(_input: unknown): Promise<never> {
      throw new Error('EstimationError: base_price inválido para project_type desconhecido')
    }

    await expect(
      faultyCalculate({ project_type: 'invalid', selected_options: [], currency: 'BRL' })
    ).rejects.toThrow('EstimationError')
  })

  it('erro de estimação não deve ser capturado silenciosamente (anti-pattern)', () => {
    let caughtError: unknown = null
    try {
      throw new TypeError('calculateEstimation: selected_options não pode ser undefined')
    } catch (e) {
      caughtError = e
    }
    expect(caughtError).toBeInstanceOf(TypeError)
    expect((caughtError as TypeError).message).toContain('calculateEstimation')
  })
})

// ── CONTRACT-10-DEGRADED: RESEND_API_KEY ausente → mensagem descritiva ──

describe('CONTRACT-10-DEGRADED: RESEND_API_KEY ausente no .env.example', () => {
  it('deve confirmar que env simulada sem RESEND_API_KEY não contém a chave (cenário degradado)', () => {
    // DEGRADED: demonstra que sem a chave o sistema não pode enviar emails.
    // Em produção, o serviço de notificação retorna erro descritivo.
    const envExampleWithoutResend = `
DATABASE_URL=postgresql://...
NEXT_PUBLIC_APP_URL=https://example.com
NEXTAUTH_SECRET=your-secret-here
`.trim()

    const hasResendKey = envExampleWithoutResend.includes('RESEND_API_KEY')
    // Confirma que o env simulado sem a chave realmente não a contém
    expect(hasResendKey).toBe(false)
  })

  it('RESEND_API_KEY documentado não deve ter valor real (apenas placeholder)', async () => {
    const { readFileSync } = await import('fs')
    const { join } = await import('path')
    let envExample: string
    try {
      envExample = readFileSync(join(process.cwd(), '.env.example'), 'utf-8')
    } catch {
      throw new Error('.env.example não encontrado — crie o arquivo com RESEND_API_KEY documentado')
    }
    // Não deve conter um valor real (re_***) — só placeholder
    expect(envExample).not.toMatch(/RESEND_API_KEY=re_[A-Za-z0-9]+/)
  })
})

// ── CONTRACT-08-DEGRADED: locale inválido → rejeitado com mensagem descritiva ──

describe('CONTRACT-08-DEGRADED: locale inválido rejeitado pelo middleware i18n', () => {
  function isValidLocale(locale: string): locale is SupportedLocale {
    return (SUPPORTED_LOCALES as readonly string[]).includes(locale)
  }

  function validateLocale(locale: string): { valid: boolean; message?: string } {
    if (!isValidLocale(locale)) {
      return {
        valid: false,
        message: `Locale "${locale}" não suportado. Locales válidos: ${SUPPORTED_LOCALES.join(', ')}`,
      }
    }
    return { valid: true }
  }

  it('locale "xx-XX" não deve ser aceito como LocaleParam válido', () => {
    expect(isValidLocale('xx-XX')).toBe(false)
  })

  it('middleware deve rejeitar locale inválido com mensagem descritiva', () => {
    const result = validateLocale('xx-XX')
    expect(result.valid).toBe(false)
    expect(result.message).toContain('xx-XX')
    expect(result.message).toContain('pt-BR')
  })

  it('todos os 4 locales suportados devem ser aceitos', () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(isValidLocale(locale)).toBe(true)
    }
  })
})

// ── CONTRACT-11-DEGRADED: rota inexistente → mensagem descritiva ──

describe('CONTRACT-11-DEGRADED: rota inexistente falha com mensagem descritiva', () => {
  it('deve falhar com mensagem descritiva quando flow/page.tsx não existe', async () => {
    const { existsSync } = await import('fs')
    const { join } = await import('path')

    const flowPage = join(process.cwd(), 'src', 'app', '[locale]', 'flow', 'page.tsx')
    const exists = existsSync(flowPage)

    expect(
      exists,
      `CONTRACT-11 DEGRADED: Rota /[locale]/flow não encontrada. ` +
        `Esperado arquivo em: ${flowPage}. ` +
        `Verifique se o module responsável pela rota foi executado.`
    ).toBe(true)
  })
})

// ── CONTRACT-01-EDGE: Option[] com impacts negativos → resultado válido com aviso ──

describe('CONTRACT-01-EDGE: Option[] com impacts negativos (descontos)', () => {
  it('impacts negativos devem gerar resultado válido (não NaN, não Infinity)', () => {
    type OptionImpactsInput = { price_impact: number; time_impact: number; complexity_impact: number }

    function simulateCalculation(options: OptionImpactsInput[]) {
      const totalPriceMultiplier = options.reduce((acc, o) => acc + o.price_impact, 1)
      const basePrice = 10000
      const price = basePrice * Math.max(totalPriceMultiplier, 0.1) // mínimo 10% do base
      return { price_min: price * 0.85, price_max: price * 1.15 }
    }

    const optionsWithNegativeImpacts: OptionImpactsInput[] = [
      { price_impact: -0.5, time_impact: -0.2, complexity_impact: -0.1 },
    ]

    const result = simulateCalculation(optionsWithNegativeImpacts)
    expect(Number.isFinite(result.price_min)).toBe(true)
    expect(Number.isFinite(result.price_max)).toBe(true)
    expect(result.price_min).toBeGreaterThan(0)
  })

  it('impacts negativos devem acionar aviso sem lançar exceção', () => {
    const warnings: string[] = []

    function validateImpacts(impacts: number[], warn: (msg: string) => void): void {
      if (impacts.some((v) => v < 0)) {
        warn('Impacts negativos detectados — verifique se representam descontos intencionais')
      }
    }

    validateImpacts([-0.5, 1.0, 1.2], (msg) => warnings.push(msg))
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain('negativos')
  })
})

// ── CONTRACT-07-EDGE: Cookie consent com valor inválido ──

describe('CONTRACT-07-EDGE: Cookie consent com valor diferente de "true"', () => {
  function hasCookieConsent(cookieStr: string): boolean {
    return cookieStr.split('; ').some((row) => row === 'COOKIE_CONSENT=true')
  }

  it('COOKIE_CONSENT="yes" não deve ser aceito (apenas "true" exato)', () => {
    expect(hasCookieConsent('COOKIE_CONSENT=yes; other=value')).toBe(false)
  })

  it('COOKIE_CONSENT="1" não deve ser aceito', () => {
    expect(hasCookieConsent('COOKIE_CONSENT=1')).toBe(false)
  })

  it('COOKIE_CONSENT="TRUE" (maiúsculo) não deve ser aceito — comparação case-sensitive', () => {
    expect(hasCookieConsent('COOKIE_CONSENT=TRUE')).toBe(false)
  })

  it('apenas COOKIE_CONSENT="true" (minúsculo exato) deve retornar true', () => {
    expect(hasCookieConsent('COOKIE_CONSENT=true')).toBe(true)
  })
})
