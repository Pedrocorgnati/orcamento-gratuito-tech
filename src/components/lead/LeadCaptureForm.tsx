'use client'

import { useState } from 'react'
import { trackLeadSubmitted } from '@/lib/analytics/events'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import { createLead } from '@/actions/createLead'
import { leadSchema } from '@/lib/validations/schemas'
import { ConsentCheckbox } from './ConsentCheckbox'
import { HoneypotField } from './HoneypotField'

// Schema client-side com campos extras
const clientLeadSchema = leadSchema.extend({
  marketing_consent: z.boolean().default(false),
})
// z.input para manter compatibilidade com react-hook-form (trata optional fields corretamente)
type LeadFormValues = z.input<typeof clientLeadSchema>

interface LeadCaptureFormProps {
  sessionId: string
  locale: string
}

type FormState = 'idle' | 'submitting' | 'error'

const FORM_LABELS: Record<string, {
  name: string
  email: string
  phone: string
  company: string
  optional: string
  submitting: string
  submit: string
  fallbackError: string
  ariaLabel: string
  phonePlaceholder: string
}> = {
  'pt-BR': {
    name: 'Nome',
    email: 'Email',
    phone: 'Telefone',
    company: 'Empresa',
    optional: '(opcional)',
    submitting: 'Enviando...',
    submit: 'Receber análise completa',
    fallbackError: 'Ocorreu um erro. Por favor, tente novamente.',
    ariaLabel: 'Formulário de captura de lead',
    phonePlaceholder: '+55 (11) 99999-9999',
  },
  'en-US': {
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    company: 'Company',
    optional: '(optional)',
    submitting: 'Submitting...',
    submit: 'Get full analysis',
    fallbackError: 'An error occurred. Please try again.',
    ariaLabel: 'Lead capture form',
    phonePlaceholder: '+1 (555) 123-4567',
  },
  'es-ES': {
    name: 'Nombre',
    email: 'Email',
    phone: 'Teléfono',
    company: 'Empresa',
    optional: '(opcional)',
    submitting: 'Enviando...',
    submit: 'Recibir análisis completo',
    fallbackError: 'Ocurrió un error. Por favor, inténtalo de nuevo.',
    ariaLabel: 'Formulario de captura de lead',
    phonePlaceholder: '+34 612 345 678',
  },
  'it-IT': {
    name: 'Nome',
    email: 'Email',
    phone: 'Telefono',
    company: 'Azienda',
    optional: '(opzionale)',
    submitting: 'Invio in corso...',
    submit: 'Ricevi analisi completa',
    fallbackError: 'Si è verificato un errore. Riprova.',
    ariaLabel: 'Modulo di acquisizione lead',
    phonePlaceholder: '+39 333 123 4567',
  },
}

export function LeadCaptureForm({ sessionId, locale }: LeadCaptureFormProps) {
  'use no memo' // react-hook-form não é compatível com React Compiler

  const labels = FORM_LABELS[locale] ?? FORM_LABELS['en-US']!
  const [formState, setFormState] = useState<FormState>('idle')
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(clientLeadSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      consentGiven:      false,
      marketing_consent: false,
      consentVersion:    '1.0',
      sessionId,
      _hp:               '',
    },
  })

  // eslint-disable-next-line react-hooks/incompatible-library
  const consentGiven = watch('consentGiven')

  async function onSubmit(data: LeadFormValues) {
    setFormState('submitting')
    setServerError(null)

    const formData = new FormData()
    formData.append('name',              data.name)
    formData.append('email',             data.email)
    if (data.phone)   formData.append('phone',   data.phone ?? '')
    if (data.company) formData.append('company', data.company ?? '')
    formData.append('sessionId',         data.sessionId)
    formData.append('consentGiven',      String(data.consentGiven))
    formData.append('consentVersion',    data.consentVersion)
    formData.append('marketing_consent', String(data.marketing_consent))
    formData.append('locale',            locale)
    formData.append('_hp',               data._hp ?? '')

    try {
      const result = await createLead(formData)
      if (result && !result.success) {
        setFormState('error')
        const rootError = result.errors?._root?.[0] ?? labels.fallbackError
        setServerError(rootError)
      } else {
        // Track lead submission sem PII (score vem da sessão, não do form)
        trackLeadSubmitted({ score: 'unknown', project_type: 'unknown' })
      }
      // redirect acontece na server action em caso de sucesso
    } catch {
      setFormState('error')
      setServerError(labels.fallbackError)
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="bg-(--color-background) rounded-2xl shadow-(--shadow-md) p-6 md:p-8 space-y-5"
      aria-label={labels.ariaLabel}
    >
      {/* Campo: Nome (obrigatório) */}
      <div>
        <Label htmlFor="name">
          {labels.name} <span aria-hidden="true" className="text-(--color-danger)">*</span>
        </Label>
        <Input
          id="name"
          type="text"
          autoComplete="name"
          aria-required="true"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
          {...register('name')}
          className="mt-1"
        />
        {errors.name && (
          <p id="name-error" className="mt-1 text-sm text-(--color-danger)" role="alert">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Campo: Email (obrigatório) */}
      <div>
        <Label htmlFor="email">
          {labels.email} <span aria-hidden="true" className="text-(--color-danger)">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-required="true"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
          {...register('email')}
          className="mt-1"
        />
        {errors.email && (
          <p id="email-error" className="mt-1 text-sm text-(--color-danger)" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Campo: Telefone (opcional) */}
      <div>
        <Label htmlFor="phone">
          {labels.phone} <span className="text-(--color-text-muted) text-sm font-normal">{labels.optional}</span>
        </Label>
        <Input
          id="phone"
          type="tel"
          autoComplete="tel"
          aria-required="false"
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? 'phone-error' : undefined}
          {...register('phone')}
          className="mt-1"
          placeholder={labels.phonePlaceholder}
        />
        {errors.phone && (
          <p id="phone-error" className="mt-1 text-sm text-(--color-danger)" role="alert">
            {errors.phone.message}
          </p>
        )}
      </div>

      {/* Campo: Empresa (opcional) */}
      <div>
        <Label htmlFor="company">
          {labels.company} <span className="text-(--color-text-muted) text-sm font-normal">{labels.optional}</span>
        </Label>
        <Input
          id="company"
          type="text"
          autoComplete="organization"
          aria-required="false"
          {...register('company')}
          className="mt-1"
        />
      </div>

      {/* HoneypotField anti-spam (SEC-010) — invisível para usuários */}
      <HoneypotField register={register} />

      {/* ConsentCheckbox LGPD (INT-090, INT-091) */}
      <ConsentCheckbox
        register={register}
        errors={errors}
        locale={locale}
        privacyPolicyHref={`/${locale}/privacy`}
      />

      {/* Erro de servidor */}
      {serverError && (
        <p className="text-sm text-(--color-danger) bg-red-50 rounded-lg p-3" role="alert">
          {serverError}
        </p>
      )}

      {/* Botão submit — disabled até consent_given=true (INT-090) */}
      <Button
        type="submit"
        disabled={!consentGiven || formState === 'submitting'}
        aria-busy={formState === 'submitting'}
        className="w-full"
      >
        {formState === 'submitting' ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {labels.submitting}
          </span>
        ) : labels.submit}
      </Button>

      {/* Campos hidden */}
      <input type="hidden" {...register('sessionId')} />
      <input type="hidden" {...register('consentVersion')} />
    </form>
  )
}
