'use client'

import type { UseFormRegister, FieldErrors } from 'react-hook-form'

interface ConsentCheckboxProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>
  errors?: FieldErrors
  locale: string
  privacyPolicyHref: string
}

const CONSENT_LABELS: Record<string, { main: string; marketing: string; privacy: string }> = {
  'pt-BR': {
    main: 'Li e concordo com a',
    marketing: 'Aceito receber comunicações sobre serviços relacionados',
    privacy: 'Política de Privacidade',
  },
  'en-US': {
    main: 'I have read and agree to the',
    marketing: 'I accept to receive communications about related services',
    privacy: 'Privacy Policy',
  },
  'es-ES': {
    main: 'He leído y acepto la',
    marketing: 'Acepto recibir comunicaciones sobre servicios relacionados',
    privacy: 'Política de Privacidad',
  },
  'it-IT': {
    main: 'Ho letto e accetto la',
    marketing: 'Accetto di ricevere comunicazioni su servizi correlati',
    privacy: 'Informativa sulla Privacy',
  },
}

const REQUIRED_ERROR: Record<string, string> = {
  'pt-BR': 'Você precisa aceitar os termos para continuar',
  'en-US': 'You must accept the terms to continue',
  'es-ES': 'Debes aceptar los términos para continuar',
  'it-IT': 'Devi accettare i termini per continuare',
}

const SR_HINT: Record<string, string> = {
  'pt-BR': 'Campo obrigatório para enviar o formulário',
  'en-US': 'Required field to submit the form',
  'es-ES': 'Campo obligatorio para enviar el formulario',
  'it-IT': 'Campo obbligatorio per inviare il modulo',
}

export function ConsentCheckbox({
  register,
  errors,
  locale,
  privacyPolicyHref,
}: ConsentCheckboxProps) {
  const labels = CONSENT_LABELS[locale] ?? CONSENT_LABELS['en-US']!
  const requiredError = REQUIRED_ERROR[locale] ?? REQUIRED_ERROR['en-US']!
  const srHint = SR_HINT[locale] ?? SR_HINT['en-US']!

  return (
    <div className="space-y-4">
      {/* Checkbox principal LGPD — INT-090: NÃO pré-marcado */}
      <div>
        <div className="flex items-start gap-3">
          <input
            id="consentGiven"
            type="checkbox"
            defaultChecked={false} // INT-090: explicitamente false
            className="mt-0.5 h-4 w-4 rounded border-(--color-border) text-(--color-primary) focus:ring-(--color-primary) cursor-pointer"
            aria-required="true"
            aria-invalid={!!errors?.consentGiven}
            aria-describedby={errors?.consentGiven ? 'consent-error' : 'consent-hint'}
            {...register('consentGiven', { required: true })}
          />
          <label htmlFor="consentGiven" className="text-sm text-(--color-text-secondary) cursor-pointer leading-relaxed">
            {labels.main}{' '}
            <a
              href={privacyPolicyHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-(--color-primary) hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-(--color-primary) rounded"
              onClick={(e) => e.stopPropagation()}
            >
              {labels.privacy}
            </a>
            {' '}<span aria-hidden="true" className="text-(--color-danger)">*</span>
          </label>
        </div>

        {!errors?.consentGiven && (
          <p id="consent-hint" className="sr-only">
            {srHint}
          </p>
        )}

        {errors?.consentGiven && (
          <p id="consent-error" className="mt-1 text-sm text-(--color-danger)" role="alert">
            {requiredError}
          </p>
        )}
      </div>

      {/* Checkbox marketing — INT-091: separado, NÃO pré-marcado */}
      <div className="flex items-start gap-3">
        <input
          id="marketing_consent"
          type="checkbox"
          defaultChecked={false} // INT-090/091: explicitamente false
          className="mt-0.5 h-4 w-4 rounded border-(--color-border) text-(--color-primary) focus:ring-(--color-primary) cursor-pointer"
          aria-required="false"
          {...register('marketing_consent')}
        />
        <label htmlFor="marketing_consent" className="text-sm text-(--color-text-secondary) cursor-pointer leading-relaxed">
          {labels.marketing}
        </label>
      </div>
    </div>
  )
}
