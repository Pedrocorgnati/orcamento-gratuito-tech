import type { Metadata } from 'next'
import { requestErasure } from '@/actions/requestErasure'

export const metadata: Metadata = {
  title: 'Solicitar exclusão de dados',
  robots: { index: false, follow: false },
}

const LABELS: Record<string, { title: string; body: string; emailLabel: string; submit: string; sent: string }> = {
  'pt-BR': {
    title: 'Solicitar exclusão de dados',
    body: 'Informe o email usado no orçamento. Enviaremos um link de confirmação válido por 24 horas. Ao confirmar, todos os registros associados ao email serão anonimizados imediatamente.',
    emailLabel: 'Email',
    submit: 'Enviar link de confirmação',
    sent: 'Se o email existir em nossa base, você receberá um link em instantes. Confira sua caixa de entrada e spam.',
  },
  'en-US': {
    title: 'Request data erasure',
    body: 'Enter the email used in your estimate. We will send a confirmation link valid for 24 hours. Upon confirming, all records tied to that email will be anonymized immediately.',
    emailLabel: 'Email',
    submit: 'Send confirmation link',
    sent: 'If the email exists in our database, a confirmation link will arrive shortly. Check your inbox and spam.',
  },
  'es-ES': {
    title: 'Solicitar eliminación de datos',
    body: 'Introduce el correo usado en tu presupuesto. Enviaremos un enlace de confirmación válido por 24 horas. Al confirmar, todos los registros vinculados serán anonimizados de inmediato.',
    emailLabel: 'Correo',
    submit: 'Enviar enlace de confirmación',
    sent: 'Si el correo existe en nuestra base, recibirás un enlace en breve. Revisa tu bandeja y spam.',
  },
  'it-IT': {
    title: 'Richiedi cancellazione dati',
    body: "Inserisci l'email usata nel preventivo. Invieremo un link di conferma valido per 24 ore. Alla conferma, tutti i dati collegati verranno anonimizzati immediatamente.",
    emailLabel: 'Email',
    submit: 'Invia link di conferma',
    sent: 'Se l\'email esiste nel nostro database, riceverai un link a breve. Controlla la casella e lo spam.',
  },
}

export default async function ErasureRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ sent?: string }>
}) {
  const { locale } = await params
  const { sent } = await searchParams
  const labels = LABELS[locale] ?? LABELS['en-US']!

  async function submit(formData: FormData) {
    'use server'
    formData.set('locale', locale)
    await requestErasure(formData)
    // redirect handled by form target or client; pragmatic: rely on page reload with ?sent=1
  }

  return (
    <main data-testid="erasure-request-page" className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-semibold">{labels.title}</h1>
      <p className="mt-4 text-sm text-gray-600">{labels.body}</p>

      {sent ? (
        <p data-testid="erasure-sent-msg" className="mt-6 rounded-lg bg-green-50 p-4 text-sm text-green-800">
          {labels.sent}
        </p>
      ) : (
        <form action={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium">
            {labels.emailLabel}
            <input
              type="email"
              name="email"
              required
              className="mt-1 w-full rounded border px-3 py-2"
              data-testid="erasure-email-input"
            />
          </label>
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-white"
            data-testid="erasure-submit-button"
          >
            {labels.submit}
          </button>
        </form>
      )}
    </main>
  )
}
