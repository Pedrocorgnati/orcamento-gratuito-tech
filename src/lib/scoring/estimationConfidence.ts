/**
 * CL-124 — Score de confiança das estimativas (0-100%)
 *
 * Agrega qualidade do preenchimento (complexity_score), detecção de
 * padrões suspeitos (filler) e alertas de consistência.
 *
 * Heurística V1 (simples, determinística):
 *   start: 100
 *   - 25 se isSuspicious
 *   - 10 por alerta de consistência (cap em 30)
 *   - 15 se complexityScore < 10 (respostas muito rasas)
 *   - 5 se features.length === 0
 */

export interface EstimationConfidenceInput {
  isSuspicious: boolean
  consistencyAlertsCount: number
  complexityScore: number
  featuresCount: number
}

export interface EstimationConfidenceResult {
  /** 0..1 */
  score: number
  /** 0..100 arredondado */
  percent: number
  /** verde | amarelo | vermelho */
  band: 'high' | 'medium' | 'low'
}

export function computeEstimationConfidence(
  input: EstimationConfidenceInput
): EstimationConfidenceResult {
  let penalty = 0
  if (input.isSuspicious) penalty += 25
  penalty += Math.min(30, input.consistencyAlertsCount * 10)
  if (input.complexityScore < 10) penalty += 15
  if (input.featuresCount === 0) penalty += 5

  const percent = Math.max(0, Math.min(100, 100 - penalty))
  const score = percent / 100

  let band: EstimationConfidenceResult['band']
  if (percent >= 80) band = 'high'
  else if (percent >= 60) band = 'medium'
  else band = 'low'

  return { score, percent, band }
}
