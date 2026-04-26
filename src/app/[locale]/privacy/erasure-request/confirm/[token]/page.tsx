import type { Metadata } from 'next'
import { confirmErasure } from '@/actions/confirmErasure'

export const metadata: Metadata = {
  title: 'Confirmar exclusão de dados',
  robots: { index: false, follow: false },
}

type ErasureMsg = {
  ok: string
  not_found: string
  expired: string
  already_processed: string
  internal: string
}

const MSG: Record<string, ErasureMsg> = {
  'pt-BR': {
    ok: 'Dados anonimizados com sucesso. Registros: ',
    not_found: 'Solicitação inválida.',
    expired: 'Link expirado. Envie uma nova solicitação.',
    already_processed: 'Esta solicitação já foi processada.',
    internal: 'Erro interno. Tente novamente mais tarde.',
  },
  'en-US': {
    ok: 'Data successfully anonymized. Records: ',
    not_found: 'Invalid request.',
    expired: 'Link expired. Please submit a new request.',
    already_processed: 'This request has already been processed.',
    internal: 'Internal error. Please try again later.',
  },
  'es-ES': {
    ok: 'Datos anonimizados con éxito. Registros: ',
    not_found: 'Solicitud inválida.',
    expired: 'Enlace expirado. Envía una nueva solicitud.',
    already_processed: 'Esta solicitud ya fue procesada.',
    internal: 'Error interno. Intenta nuevamente más tarde.',
  },
  'it-IT': {
    ok: 'Dati anonimizzati con successo. Record: ',
    not_found: 'Richiesta non valida.',
    expired: 'Link scaduto. Invia una nuova richiesta.',
    already_processed: 'Questa richiesta è già stata elaborata.',
    internal: 'Errore interno. Riprova più tardi.',
  },
}

export default async function ConfirmPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>
}) {
  const { locale, token } = await params
  const labels = MSG[locale] ?? MSG['en-US']!
  const result = await confirmErasure(token)

  let message: string
  if (result.success) {
    message = labels.ok + (result.anonymizedCount ?? 0)
  } else {
    message = labels[result.error ?? 'internal']
  }

  return (
    <main data-testid="erasure-confirm-page" className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-semibold">
        {result.success ? '✅' : '⚠️'} {labels.ok.split('.')[0]}
      </h1>
      <p className="mt-4 text-sm">{message}</p>
    </main>
  )
}
