'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { leadSchema } from '@/lib/validations/schemas'
import { leadRateLimiter } from '@/lib/rate-limiter'

// Versão atual dos termos de consentimento (INT-095)
const CONSENT_VERSION = '1.0'

// Schema interno com campos extras para server action
const createLeadActionSchema = leadSchema.extend({
  marketing_consent: z.boolean().default(false), // INT-091
  locale: z.string().min(2).max(10),
})

// Mensagens de erro localizadas para server action
const SERVER_ERRORS: Record<string, { rateLimited: string; saveFailed: string; consentRequired: string }> = {
  'pt-BR': {
    rateLimited: 'Muitas tentativas. Aguarde e tente novamente.',
    saveFailed: 'Erro ao salvar. Tente novamente.',
    consentRequired: 'Consentimento é obrigatório',
  },
  'en-US': {
    rateLimited: 'Too many attempts. Please wait and try again.',
    saveFailed: 'Error saving. Please try again.',
    consentRequired: 'Consent is required',
  },
  'es-ES': {
    rateLimited: 'Demasiados intentos. Espera e inténtalo de nuevo.',
    saveFailed: 'Error al guardar. Inténtalo de nuevo.',
    consentRequired: 'El consentimiento es obligatorio',
  },
  'it-IT': {
    rateLimited: 'Troppi tentativi. Attendi e riprova.',
    saveFailed: 'Errore durante il salvataggio. Riprova.',
    consentRequired: 'Il consenso è obbligatorio',
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

  const { name, email, phone, company, sessionId, consentGiven, marketing_consent } = parsed.data

  // ─── LEAD_051: Consentimento obrigatório ──────────────────────────────────
  if (!consentGiven) {
    return {
      success: false,
      errors: { consentGiven: [msgs.consentRequired] },
    }
  }

  // ─── Persistir lead (INT-095) ─────────────────────────────────────────────
  let shouldRedirectToThankYou = false

  try {
    await prisma.lead.create({
      data: {
        session_id:         sessionId,
        name,
        email,
        phone:              phone ?? null,
        company:            company ?? null,
        score:              'PENDING',
        score_budget:       0,
        score_timeline:     0,
        score_profile:      0,
        score_total:        0,
        project_type:       'unknown',
        complexity:         'unknown',
        estimated_price_min: 0,
        estimated_price_max: 0,
        estimated_days_min:  0,
        estimated_days_max:  0,
        features:           [],
        scope_story:        '',
        locale,
        currency:           'BRL',
        consent_given:      consentGiven,
        consent_version:    CONSENT_VERSION,
        consent_at:         new Date(),
        marketing_consent:  marketing_consent ?? false,
        honeypot_triggered: false,
      },
    })
    shouldRedirectToThankYou = true
  } catch (err: unknown) {
    // LEAD_081: Lead duplicado (unique constraint session_id) → redirect silencioso
    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code: string }).code === 'P2002'
    ) {
      shouldRedirectToThankYou = true
    } else {
      console.error('[createLead] error:', err)
      return { success: false, errors: { _root: [msgs.saveFailed] } }
    }
  }

  // redirect() FORA do try/catch — lança exceção interna do Next.js
  if (shouldRedirectToThankYou) {
    redirect(`/${locale}/thank-you`)
  }

  return null
}
