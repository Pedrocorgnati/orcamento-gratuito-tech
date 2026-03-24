import type React from 'react'

import type {
  Locale,
  Currency,
  ProjectType,
  QuestionType,
  QuestionBlock,
  SessionStatus,
  ComplexityLevel,
  ConsistencyAlertType,
  LeadScore,
} from './enums'

// ─────────────────────────────────────────────────────────────────────────────
// Utility Types
// ─────────────────────────────────────────────────────────────────────────────

/** Torna T aceitando null */
export type Nullable<T> = T | null

/** Torna T aceitando undefined */
export type Optional<T> = T | undefined

/** Adiciona timestamps padrao do Prisma */
export type WithTimestamps<T> = T & {
  created_at: Date
  updated_at: Date
}

/** Remove timestamps padrao */
export type WithoutTimestamps<T> = Omit<T, 'created_at' | 'updated_at'>

/** Deep partial recursivo */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/** Extrai tipo de elemento de um array */
export type ArrayElement<T extends readonly unknown[]> =
  T extends readonly (infer U)[] ? U : never

// ─────────────────────────────────────────────────────────────────────────────
// Domain Types
// ─────────────────────────────────────────────────────────────────────────────

/** Item de taxa de câmbio (shape flat para serialização client-side) */
export interface ExchangeRateItem {
  from_currency: string
  to_currency: string
  rate: number
}

/** Resultado da estimativa gerada pelo motor de pricing */
export interface EstimationResult {
  projectType: ProjectType
  complexity: ComplexityLevel
  priceMin: number
  priceMax: number
  daysMin: number
  daysMax: number
  currency: Currency
  locale: Locale
  features: string[]
  scopeStory: string
  consistencyAlerts: ConsistencyAlert[]
  score: LeadScore
  scoreBudget: number
  scoreTimeline: number
  scoreProfile: number
  scoreTotal: number
}

/** Alerta de consistencia detectado pelo motor */
export interface ConsistencyAlert {
  type: ConsistencyAlertType
  message: string
  severity: 'low' | 'medium' | 'high'
}

/** Input para criacao de sessao */
export interface SessionInput {
  locale: Locale
  currency: Currency
  visitorIp?: string | null
  userAgent?: string | null
}

/** Input para registro de resposta */
export interface AnswerInput {
  sessionId: string
  questionId: string
  optionId?: string | null
  textValue?: string | null
}

/** Input para captura de lead */
export interface LeadInput {
  sessionId: string
  name: string
  email: string
  phone?: string | null
  company?: string | null
  consentGiven: boolean
  consentVersion: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Translation Types
// ─────────────────────────────────────────────────────────────────────────────

/** Dados de traducao de uma pergunta */
export interface QuestionTranslationData {
  locale: Locale
  title: string
  description?: string | null
  helpText?: string | null
}

/** Dados de traducao de uma opcao */
export interface OptionTranslationData {
  locale: Locale
  label: string
  description?: string | null
}

/** Opcao com suas traducoes carregadas */
export interface OptionWithTranslations {
  id: string
  questionId: string
  nextQuestionId: string | null
  priceImpact: number
  timeImpact: number
  complexityImpact: number
  weight: number
  order: number
  translations: OptionTranslationData[]
}

/** Pergunta com traducoes e opcoes carregadas */
export interface QuestionWithTranslations {
  id: string
  block: QuestionBlock
  type: QuestionType
  order: number
  required: boolean
  skipLogic: Record<string, unknown> | null
  translations: QuestionTranslationData[]
  options: OptionWithTranslations[]
}

/** Pergunta resolvida para um locale especifico */
export interface ResolvedQuestion {
  id: string
  block: QuestionBlock
  type: QuestionType
  order: number
  required: boolean
  skipLogic: Record<string, unknown> | null
  title: string
  description: string | null
  helpText: string | null
  options: ResolvedOption[]
}

/** Opcao resolvida para um locale especifico */
export interface ResolvedOption {
  id: string
  label: string
  description: string | null
  nextQuestionId: string | null
  priceImpact: number
  timeImpact: number
  complexityImpact: number
  weight: number
  order: number
}

// ─────────────────────────────────────────────────────────────────────────────
// API Types
// ─────────────────────────────────────────────────────────────────────────────

/** Resposta padrao de sucesso da API */
export interface ApiResponse<T> {
  data: T
  requestId: string
  timestamp: string
  meta?: Record<string, unknown>
}

/** Resposta padrao de erro da API */
export interface ApiErrorResponse {
  error: {
    code: string
    message: string
    details?: string | null
  }
}

/** Resposta paginada */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// View / State Types
// ─────────────────────────────────────────────────────────────────────────────

/** Estado da sessao no client-side */
export interface SessionState {
  sessionId: string
  status: SessionStatus
  locale: Locale
  currency: Currency
  projectType: ProjectType | null
  currentQuestionId: string | null
  questionsAnswered: number
  progressPercentage: number
  accumulatedPrice: number
  accumulatedTime: number
  accumulatedComplexity: number
}

/** Taxas de cambio carregadas */
export interface ExchangeRates {
  baseCurrency: Currency
  rates: Record<Currency, number>
  updatedAt: Date
}

// ─────────────────────────────────────────────────────────────────────────────
// UI Component Types
// ─────────────────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export type CardVariant = 'default' | 'outlined' | 'elevated'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export interface EmptyStateProps {
  icon?: React.ReactNode
  message: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export type SkeletonType = 'text' | 'card' | 'button' | 'avatar' | 'question-card'

export interface SkeletonLoaderProps {
  type?: SkeletonType
  lines?: number
  className?: string
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}
