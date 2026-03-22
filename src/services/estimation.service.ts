import { ComplexityLevel, ProjectType } from '@/types/enums'

export type EstimationResult = {
  price_min: number
  price_max: number
  price_min_formatted: string
  price_max_formatted: string
  currency: string
  time_days_min: number
  time_days_max: number
  complexity: ComplexityLevel
  complexity_score: number
  features: string[]
  project_type: string
  scope_story: string
}

export class EstimationService {
  async calculate(sessionId: string): Promise<EstimationResult> {
    // TODO: Implementar via /auto-flow execute
    // Algoritmo:
    // 1. Buscar session + answers + options via Prisma (include option)
    // 2. Determinar project_type da sessão
    // 3. Buscar PricingConfig para project_type
    // 4. Somar accumulated_price e accumulated_complexity da sessão
    // 5. Determinar ComplexityLevel baseado em accumulated_complexity:
    //    low: 0-30, medium: 31-50, high: 51-70, very_high: 71+
    // 6. Aplicar multiplier: base_price * complexity_multiplier_{level}
    // 7. Calcular faixa ±15%: price_min = total * 0.85, price_max = total * 1.15
    // 8. Converter para currency da sessão via ExchangeRate
    // 9. Formatar preços com Intl.NumberFormat
    // 10. Gerar lista de features a partir das opções respondidas
    // 11. Gerar scope_story narrativo
    throw new Error('Not implemented - run /auto-flow execute')
  }

  inferComplexityLevel(score: number): ComplexityLevel {
    if (score <= 30) return ComplexityLevel.LOW
    if (score <= 50) return ComplexityLevel.MEDIUM
    if (score <= 70) return ComplexityLevel.HIGH
    return ComplexityLevel.VERY_HIGH
  }

  async convertCurrency(
    amountBrl: number,
    targetCurrency: string
  ): Promise<number> {
    // TODO: Implementar via /auto-flow execute
    // 1. Se targetCurrency === 'BRL', retornar amountBrl
    // 2. Buscar ExchangeRate { from_currency: 'BRL', to_currency: targetCurrency }
    // 3. Retornar amountBrl * rate
    if (targetCurrency === 'BRL') return amountBrl
    throw new Error('Not implemented - run /auto-flow execute')
  }
}

export const estimationService = new EstimationService()
