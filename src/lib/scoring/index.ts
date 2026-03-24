// src/lib/scoring/index.ts
// Re-exports do módulo de scoring (module-14)

export { calculateLeadScore } from './calculateLeadScore'
export type { ScoringInput, LeadScoreResult, EstimationForScoring } from './calculateLeadScore'

export { detectFillerResponses } from './detectFillerResponses'
export type {
  FillerDetectionInput,
  FillerDetectionResult,
  SuspiciousPattern,
} from './detectFillerResponses'
