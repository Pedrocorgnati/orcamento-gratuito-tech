'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { leadSchema } from '@/lib/validations/schemas'
import { leadRateLimiter } from '@/lib/rate-limiter'
import { leadService } from '@/services/lead.service'
import { COOKIE_NAMES } from '@/lib/constants'
import { logger } from '@/lib/logger'

// Versão atual dos termos de consentimento (INT-095)
const CONSENT_VERSION = '1.0'

// Schema interno com campos extras para server action
const createLeadActionSchema = leadSchema.extend({
  marketing_consent: z.boolean().default(false), // INT-091
  locale: z.string().min(2).max(10),
})

// Mensagens de erro localizadas para server action
const SERVER_ERRORS: Record<
  string,
  {
    rateLimited: string
    saveFailed: string
    consentRequired: string
    sessionMismatch: string
    sessionNotReady: string
  }
> = {
  'pt-BR': {
    rateLimited: 'Muitas tentativas. Aguarde e tente novamente.',
    saveFailed: 'Erro ao salvar. Tente novamente.',
    consentRequired: 'Consentimento é obrigatório',
    sessionMismatch: 'Sessão inválida. Reinicie o orçamento.',
    sessionNotReady: 'Finalize todas as perguntas antes de enviar.',
  },
  'en-US': {
    rateLimited: 'Too many attempts. Please wait and try again.',
    saveFailed: 'Error saving. Please try again.',
    consentRequired: 'Consent is required',
    sessionMismatch: 'Invalid session. Please restart the quote.',
    sessionNotReady: 'Complete all questions before submitting.',
  },
  'es-ES': {
    rateLimited: 'Demasiados intentos. Espera e inténtalo de nuevo.',
    saveFailed: 'Error al guardar. Inténtalo de nuevo.',
    consentRequired: 'El consentimiento es obligatorio',
    sessionMismatch: 'Sesión no válida. Reinicia el presupuesto.',
    sessionNotReady: 'Completa todas las preguntas antes de enviar.',
  },
  'it-IT': {
    rateLimited: 'Troppi tentativi. Attendi e riprova.',
    saveFailed: 'Errore durante il salvataggio. Riprova.',
    consentRequired: 'Il consenso è obbligatorio',
    sessionMismatch: 'Sessione non valida. Ricomincia il preventivo.',
    sessionNotReady: 'Completa tutte le domande prima di inviare.',
  },
}

type ActionResult =
  | { success: false; errors: Record<string, string[]> }
  | null

// NOTE: redirect() lança exceção interna do Next.js.
// NUNCA envolvê-lo em try/catch — chamar FORA de qualquer bloco try.
export async function createLead(formData: FormData): Promise<ActionResult> {
  // Extrair locale antes de qualquer verificação para usar nos redirects
  const locale = (formData.get('locale') as string) || 'pt-BR'
  const msgs = SERVER_ERRORS[locale] ?? SERVER_ERRORS['en-US']!

  // ─── SEC-010: Honeypot — verificado PRIMEIRO, antes de qualquer operação ──
  const honeypot = (formData.get('_hp') as string) || ''
  if (honeypot !== '') {
    console.warn(JSON.stringify({
      event: 'honeypot_triggered',
      timestamp: new Date().toISOString(),
      // NÃO logar IP ou conteúdo por privacidade
    }))
    redirect(`/${locale}/thank-you`)
  }

  // ─── Rate limit (INT-096) ─────────────────────────────────────────────────
  const headersList = await headers()
  const forwarded = headersList.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0]!.trim() : 'unknown'
  const allowed = leadRateLimiter.check(`lead:${ip}`)

  if (!allowed) {
    return {
      success: false,
      errors: { _root: [msgs.rateLimited] },
    }
  }

  // ─── Validação Zod server-side (VAL_001) ─────────────────────────────────
  const rawData = {
    sessionId:         formData.get('sessionId'),
    name:              formData.get('name'),
    email:             formData.get('email'),
    phone:             formData.get('phone') || undefined,
    whatsapp:          formData.get('whatsapp') || undefined,
    company:           formData.get('company') || undefined,
    consentGiven:      formData.get('consentGiven') === 'true',
    consentVersion:    CONSENT_VERSION,
    _hp:               '',  // já verificado acima
    marketing_consent: formData.get('marketing_consent') === 'true',
    locale,
  }

  const parsed = createLeadActionSchema.safeParse(rawData)
  if (!parsed.success) {
    console.warn('[createLead] validation failed:', {
      errors: parsed.error.flatten().fieldErrors,
    })
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }

  const { name, email, phone, company, sessionId, consentGiven, consentVersion, marketing_consent } =
    parsed.data

  // ─── LEAD_051: Consentimento obrigatório ──────────────────────────────────
  if (!consentGiven) {
    return {
      success: false,
      errors: { consentGiven: [msgs.consentRequired] },
    }
  }

  // ─── Guard IDOR: sessionId do form deve bater com cookie httpOnly ─────────
  const cookieStore = await cookies()
  const cookieSessionId = cookieStore.get(COOKIE_NAMES.SESSION_ID)?.value
  if (!cookieSessionId || cookieSessionId !== sessionId) {
    logger.warn('create_lead_session_mismatch', {
      cookiePresent: !!cookieSessionId,
    })
    return { success: false, errors: { _root: [msgs.sessionMismatch] } }
  }

  // ─── Persistir lead via service (score, estimate e Resend) ───────────────
  let shouldRedirectToThankYou = false

  try {
    await leadService.create({
      sessionId,
      name,
      email,
      phone,
      company,
      consentGiven,
      consentVersion,
      _hp: '',
    })
    shouldRedirectToThankYou = true
  } catch (err: unknown) {
    const code =
      err instanceof Error
        ? err.message
        : typeof err === 'object' && err && 'code' in err
          ? (err as { code: string }).code
          : ''

    if (code === 'LEAD_ALREADY_EXISTS' || code === 'P2002') {
      // Idempotente — lead já foi enviado
      shouldRedirectToThankYou = true
    } else if (code === 'SESSION_NOT_FOUND' || code === 'SESSION_NOT_COMPLETE') {
      return { success: false, errors: { _root: [msgs.sessionNotReady] } }
    } else {
      logger.error('create_lead_error', { error: code || 'unknown' })
      return { success: false, errors: { _root: [msgs.saveFailed] } }
    }
  }

  // redirect() FORA do try/catch — lança exceção interna do Next.js
  if (shouldRedirectToThankYou) {
    redirect(`/${locale}/thank-you`)
  }

  return null
}
