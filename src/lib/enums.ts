// ─────────────────────────────────────────────────────────────────────────────
// Enums TypeScript — fonte canonica de dominio
// Os defaults do Prisma schema serao alinhados via migration em module-7.
// ─────────────────────────────────────────────────────────────────────────────

// --- Domain Enums ---

export enum Locale {
  PT_BR = 'pt_BR',
  EN_US = 'en_US',
  ES_ES = 'es_ES',
  IT_IT = 'it_IT',
}

export enum Currency {
  BRL = 'BRL',
  USD = 'USD',
  EUR = 'EUR',
}

export enum ProjectType {
  WEBSITE = 'WEBSITE',
  ECOMMERCE = 'ECOMMERCE',
  WEB_APP = 'WEB_APP',
  MOBILE_APP = 'MOBILE_APP',
  AUTOMATION_AI = 'AUTOMATION_AI',
}

export enum QuestionType {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TEXT_INPUT = 'TEXT_INPUT',
  NUMBER_INPUT = 'NUMBER_INPUT',
  RANGE_SELECT = 'RANGE_SELECT',
  BUDGET_SELECT = 'BUDGET_SELECT',
  DEADLINE_SELECT = 'DEADLINE_SELECT',
}

export enum QuestionBlock {
  PROJECT_TYPE = 'PROJECT_TYPE',
  WEBSITES = 'WEBSITES',
  ECOMMERCE = 'ECOMMERCE',
  WEB_SYSTEM = 'WEB_SYSTEM',
  MOBILE_APP = 'MOBILE_APP',
  AUTOMATION_AI = 'AUTOMATION_AI',
  CONTEXT = 'CONTEXT',
  LEAD = 'LEAD',
}

export enum SessionStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
  EXPIRED = 'EXPIRED',
}

export enum ComplexityLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH',
}

export enum LeadScore {
  A = 'A',
  B = 'B',
  C = 'C',
}

export enum EmailStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export enum ConsistencyAlertType {
  BUDGET_MISMATCH = 'BUDGET_MISMATCH',
  TIMELINE_CONFLICT = 'TIMELINE_CONFLICT',
  SCOPE_OVERLAP = 'SCOPE_OVERLAP',
  COMPLEXITY_JUMP = 'COMPLEXITY_JUMP',
  SUSPICIOUS_PATTERN = 'SUSPICIOUS_PATTERN',
}

// ─────────────────────────────────────────────────────────────────────────────
// Mapping Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Moeda padrao por locale */
export const LOCALE_CURRENCY_MAP: Record<Locale, Currency> = {
  [Locale.PT_BR]: Currency.BRL,
  [Locale.EN_US]: Currency.USD,
  [Locale.ES_ES]: Currency.EUR,
  [Locale.IT_IT]: Currency.EUR,
}

/** Locale padrao do sistema */
export const LOCALE_DEFAULT = Locale.PT_BR

/** Moeda padrao do sistema */
export const CURRENCY_DEFAULT = Currency.BRL

/** Mapeamento enum -> tag BCP-47 (usado em headers Accept-Language e next-intl) */
export const LOCALE_BCP47_MAP: Record<Locale, string> = {
  [Locale.PT_BR]: 'pt-BR',
  [Locale.EN_US]: 'en-US',
  [Locale.ES_ES]: 'es-ES',
  [Locale.IT_IT]: 'it-IT',
}

/** Simbolo de moeda por Currency */
export const CURRENCY_SYMBOL_MAP: Record<Currency, string> = {
  [Currency.BRL]: 'R$',
  [Currency.USD]: 'US$',
  [Currency.EUR]: '\u20AC',
}

/** Chaves i18n por nivel de complexidade (usadas em traducoes) */
export const COMPLEXITY_I18N_KEYS: Record<ComplexityLevel, string> = {
  [ComplexityLevel.LOW]: 'complexity.low',
  [ComplexityLevel.MEDIUM]: 'complexity.medium',
  [ComplexityLevel.HIGH]: 'complexity.high',
  [ComplexityLevel.VERY_HIGH]: 'complexity.very_high',
}

// ─────────────────────────────────────────────────────────────────────────────
// Config Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Itens por pagina padrao (admin) */
export const PAGE_SIZE = 20

/** Maximo de itens por pagina */
export const MAX_PAGE_SIZE = 100

/** Maximo de retentativas para envio de email */
export const MAX_RETRIES = 3

/** Delays de retentativa em ms (backoff exponencial) */
export const RETRY_DELAYS = [1_000, 4_000, 16_000] as const

/** Tempo de vida da sessao em horas (7 dias) */
export const SESSION_TTL_HOURS = 168

/** Progresso minimo (%) para exibir captura de lead */
export const MIN_PROGRESS_FOR_LEAD = 70

// ─────────────────────────────────────────────────────────────────────────────
// Route Constants
// ─────────────────────────────────────────────────────────────────────────────

export const FLOW_ROUTE = '/flow'
export const RESULT_ROUTE = '/result'
export const LEAD_CAPTURE_ROUTE = '/flow/lead'
export const ADMIN_ROUTE = '/admin'
export const ADMIN_LOGIN_ROUTE = '/admin/login'
export const API_BASE = '/api'

// ─────────────────────────────────────────────────────────────────────────────
// Rate Limit Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Maximo de sessoes por IP por hora */
export const RATE_LIMIT_SESSIONS_PER_IP = 10

/** Maximo de leads por IP por hora */
export const RATE_LIMIT_LEADS_PER_IP = 3

/** Maximo de tentativas de login por IP por hora */
export const RATE_LIMIT_AUTH_PER_IP = 10

// ─────────────────────────────────────────────────────────────────────────────
// Validation Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Comprimento minimo de texto livre */
export const MIN_TEXT_LENGTH = 3

/** Comprimento maximo de texto livre */
export const MAX_TEXT_LENGTH = 500

/** Numero estimado de perguntas no fluxo (usado para calcular progresso) */
export const ESTIMATED_TOTAL_QUESTIONS = 15
