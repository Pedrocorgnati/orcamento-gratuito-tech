'use client'

import { track } from '@vercel/analytics'
import { hasAnalyticsConsent } from './consent'

// Super properties adicionadas a todos os eventos
function getSuperProps() {
  return {
    locale: typeof navigator !== 'undefined' ? navigator.language : 'unknown',
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'staging',
  }
}

// Guard: só trackeia se houver consentimento (FEAT-UX-005 / LGPD)
function safeTrack(event: string, props?: Record<string, string | number | boolean>) {
  if (!hasAnalyticsConsent()) return
  track(event, { ...getSuperProps(), ...props })
}

// ============================================================
// GRUPO 1: Funnel do Visitante
// ============================================================

/** 1. Disparado quando uma nova sessão é criada (início do flow) */
export function trackFlowStarted() {
  safeTrack('flow_started')
}

/** 2. Disparado ao responder cada pergunta */
export function trackQuestionAnswered(props: {
  question_id: string
  block: string
  type: string
}) {
  safeTrack('question_answered', props)
}

/** 3. Disparado ao clicar "Voltar" em uma pergunta */
export function trackQuestionBack(props: { question_id: string }) {
  safeTrack('question_back', props)
}

/** 4. Disparado ao completar todas as perguntas do flow */
export function trackFlowCompleted(props: {
  session_id: string
  questions_answered: number
  project_type: string
}) {
  safeTrack('flow_completed', props)
}

/** 5. Disparado quando a página /result é visualizada */
export function trackResultViewed(props: {
  complexity: string
  price_range: string // ex: "10000-20000"
  currency: string
}) {
  safeTrack('result_viewed', props)
}

/** 6. Disparado quando /lead-capture é visualizado */
export function trackLeadCaptureViewed() {
  safeTrack('lead_capture_viewed')
}

/** 7. Disparado ao submeter o formulário de lead */
export function trackLeadSubmitted(props: {
  score: string // A, B, C, D — sem nome/email
  project_type: string
}) {
  safeTrack('lead_submitted', props)
}

/** 8. Disparado ao pular o formulário de lead */
export function trackLeadSkipped() {
  safeTrack('lead_skipped')
}

// ============================================================
// GRUPO 2: UX / Interações
// ============================================================

/** 9. Disparado ao trocar o idioma */
export function trackLocaleChanged(props: { from: string; to: string }) {
  safeTrack('locale_changed', props)
}

/** 10. Disparado ao trocar a moeda */
export function trackCurrencyChanged(props: { currency: string }) {
  safeTrack('currency_changed', props)
}

/** 11. Disparado quando o social proof (nº de orçamentos gerados) é visualizado */
export function trackSocialProofViewed() {
  safeTrack('social_proof_viewed')
}

// ============================================================
// GRUPO 3: Admin
// ============================================================

/** 12. Disparado ao solicitar magic link de login no admin */
export function trackAdminLoginRequested() {
  safeTrack('admin_login_requested')
}

/** 13. Disparado ao visualizar a lista de leads no admin */
export function trackAdminLeadsViewed() {
  safeTrack('admin_leads_viewed')
}

// ============================================================
// GRUPO 4: Sessão
// ============================================================

/** 14. Disparado ao retomar uma sessão existente */
export function trackSessionResumed(props: { session_id: string }) {
  safeTrack('session_resumed', props)
}

/** 15. Disparado quando uma sessão expirada é acessada */
export function trackSessionExpired() {
  safeTrack('session_expired')
}

// ============================================================
// GRUPO 5: Consentimento
// ============================================================

/** 16. Disparado ao aceitar todos os cookies */
export function trackEmailConsentGiven() {
  safeTrack('email_consent_given')
}

/** 17. Disparado ao aceitar marketing no formulário de lead */
export function trackMarketingConsentGiven() {
  safeTrack('marketing_consent_given')
}

/** 18. Disparado ao aceitar o banner de cookies */
export function trackConsentBannerAccepted() {
  safeTrack('consent_banner_accepted')
}

// ============================================================
// GRUPO 6: Erros
// ============================================================

/** 19. Disparado quando ocorre um erro — sem PII */
export function trackErrorOccurred(props: {
  error_code: string
  route: string
}) {
  safeTrack('error_occurred', props)
}

// ============================================================
// RESUMO: 19 eventos — NENHUM contém email, nome, telefone ou IP
// ============================================================
// 1. flow_started
// 2. question_answered     (question_id, block, type)
// 3. question_back         (question_id)
// 4. flow_completed        (session_id, questions_answered, project_type)
// 5. result_viewed         (complexity, price_range, currency)
// 6. lead_capture_viewed
// 7. lead_submitted        (score, project_type)
// 8. lead_skipped
// 9. locale_changed        (from, to)
// 10. currency_changed     (currency)
// 11. social_proof_viewed
// 12. admin_login_requested
// 13. admin_leads_viewed
// 14. session_resumed      (session_id)
// 15. session_expired
// 16. email_consent_given
// 17. marketing_consent_given
// 18. consent_banner_accepted
// 19. error_occurred       (error_code, route)
// ============================================================
