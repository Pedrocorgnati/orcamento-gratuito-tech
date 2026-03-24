'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from '@/providers/ToastProvider'

const emailFormSchema = z.object({
  email: z.string().email(),
})

type EmailFormData = z.infer<typeof emailFormSchema>

type InlineEmailCaptureProps = {
  sessionId: string
  locale: string
  onComplete: (email?: string) => void
}

const STRINGS: Record<string, { title: string; cta: string; skip: string; placeholder: string; saving: string; label: string; successMessage: string; errorMessage: string }> = {
  'pt-BR': {
    title: 'Quer receber o resultado por e-mail?',
    cta: 'Enviar',
    skip: 'Pular esta etapa',
    placeholder: 'seu@email.com',
    saving: 'Salvando...',
    label: 'E-mail',
    successMessage: 'E-mail salvo com sucesso!',
    errorMessage: 'Não foi possível salvar o e-mail. Tente novamente.',
  },
  'en-US': {
    title: 'Want to receive the result by email?',
    cta: 'Send',
    skip: 'Skip this step',
    placeholder: 'your@email.com',
    saving: 'Saving...',
    label: 'Email',
    successMessage: 'Email saved successfully!',
    errorMessage: 'Could not save email. Please try again.',
  },
  'es-ES': {
    title: 'Quieres recibir el resultado por correo?',
    cta: 'Enviar',
    skip: 'Saltar este paso',
    placeholder: 'tu@email.com',
    saving: 'Guardando...',
    label: 'Correo electrónico',
    successMessage: '¡Correo guardado con éxito!',
    errorMessage: 'No se pudo guardar el correo. Inténtalo de nuevo.',
  },
  'it-IT': {
    title: 'Vuoi ricevere il risultato via email?',
    cta: 'Invia',
    skip: 'Salta questo passaggio',
    placeholder: 'tua@email.com',
    saving: 'Salvataggio...',
    label: 'Email',
    successMessage: 'Email salvata con successo!',
    errorMessage: 'Impossibile salvare l\'email. Riprova.',
  },
}

export function InlineEmailCapture({ sessionId, locale, onComplete }: InlineEmailCaptureProps) {
  const t = STRINGS[locale] ?? STRINGS['pt-BR']

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
  })

  async function onSubmit(data: EmailFormData) {
    try {
      const res = await fetch(`/api/v1/sessions/${sessionId}/email`, {
        method: 'PATCH',
        signal: AbortSignal.timeout(8_000),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      })

      if (!res.ok) {
        toast.error(t.errorMessage)
        onComplete(undefined)
        return
      }

      toast.success(t.successMessage)
      onComplete(data.email)
    } catch {
      toast.error(t.errorMessage)
      onComplete(undefined)
    }
  }

  function handleSkip() {
    onComplete(undefined)
  }

  const errorId = errors.email ? 'email-error' : undefined

  return (
    <div
      role="complementary"
      aria-label={t.title}
      className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
    >
      <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
        {t.title}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
        <div>
          <label htmlFor="inline-email" className="sr-only">
            {t.label}
          </label>
          <input
            id="inline-email"
            type="email"
            autoComplete="email"
            placeholder={t.placeholder}
            aria-describedby={errorId}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            {...register('email')}
          />
          {errors.email && (
            <p id="email-error" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? t.saving : t.cta}
          </button>

          <button
            type="button"
            onClick={handleSkip}
            disabled={isSubmitting}
            className="rounded-md px-4 py-2 text-sm text-gray-500 transition-colors hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {t.skip}
          </button>
        </div>
      </form>
    </div>
  )
}
