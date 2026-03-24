// src/lib/estimation/index.ts
// Barrel — re-exports do módulo de estimativa
export { calculateEstimation, PRICE_RANGE_FACTOR, DAYS_RANGE_FACTOR } from './calculate'
export type { CalculationInput, EstimationCalculated, PricingConfigData } from './calculate'
export { generateScopeStory } from './scope-story'
export {
  fetchExchangeRates,
  getEstimationCurrency,
  convertEstimationPrices,
  formatEstimationRange,
  formatDaysRange,
} from './currency'
