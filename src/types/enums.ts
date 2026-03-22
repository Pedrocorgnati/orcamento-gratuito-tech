// Enums do Budget Free Engine — espelhados do Prisma schema
// Sincronizados com o openapi.yaml e LLD.md

export enum Locale {
  PT_BR = 'pt-BR',
  EN_US = 'en-US',
  ES_ES = 'es-ES',
  IT_IT = 'it-IT',
}

export enum Currency {
  BRL = 'BRL',
  USD = 'USD',
  EUR = 'EUR',
  USDC = 'USDC',
}

export const LOCALE_CURRENCY_MAP: Record<Locale, Currency> = {
  [Locale.PT_BR]: Currency.BRL,
  [Locale.EN_US]: Currency.USD,
  [Locale.ES_ES]: Currency.EUR,
  [Locale.IT_IT]: Currency.EUR,
}

export enum QuestionType {
  SINGLE_CHOICE = 'single_choice',
  MULTIPLE_CHOICE = 'multiple_choice',
  TEXT = 'text',
  NUMBER = 'number',
}

export enum QuestionBlock {
  TIPO_PROJETO = 'TIPO_PROJETO',
  FUNCIONALIDADES = 'FUNCIONALIDADES',
  INTEGRACOES = 'INTEGRAÇÕES',
  USUARIOS = 'USUARIOS',
  DESIGN = 'DESIGN',
  PRAZO = 'PRAZO',
  BUDGET = 'BUDGET',
  PERFIL = 'PERFIL',
}

export enum ProjectType {
  WEB_SYSTEM = 'web_system',
  LANDING_PAGE = 'landing_page',
  MOBILE_APP = 'mobile_app',
  SAAS_MVP = 'saas_mvp',
  E_COMMERCE = 'e_commerce',
  AUTOMATION = 'automation',
}

export enum SessionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
  EXPIRED = 'expired',
}

export enum ComplexityLevel {
  LOW = 'low',       // 0-30
  MEDIUM = 'medium', // 31-50
  HIGH = 'high',     // 51-70
  VERY_HIGH = 'very_high', // 71+
}

export enum LeadScore {
  A = 'A', // >= 70
  B = 'B', // >= 40
  C = 'C', // < 40
}

export enum EmailStatus {
  PENDING = 'pending',
  SENT = 'sent',
  RETRYING = 'retrying',
  FAILED = 'failed',
}
