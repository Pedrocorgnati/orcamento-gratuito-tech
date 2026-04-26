'use client'

import { useState } from 'react'
import { discardSession } from '@/actions/session'

const LABELS: Record<string, { cta: string; title: string; body: string; confirm: string; cancel: string }> = {
  'pt-BR': {
    cta: 'Recomeçar',
    title: 'Recomeçar o fluxo?',
    body: 'Todas as respostas serão descartadas. Esta ação não pode ser desfeita.',
    confirm: 'Sim, recomeçar',
    cancel: 'Cancelar',
  },
  'en-US': {
    cta: 'Restart',
    title: 'Restart the flow?',
    body: 'All answers will be discarded. This action cannot be undone.',
    confirm: 'Yes, restart',
    cancel: 'Cancel',
  },
  'es-ES': {
    cta: 'Reiniciar',
    title: '¿Reiniciar el flujo?',
    body: 'Se descartarán todas las respuestas. Esta acción no se puede deshacer.',
    confirm: 'Sí, reiniciar',
    cancel: 'Cancelar',
  },
  'it-IT': {
    cta: 'Ricomincia',
    title: 'Ricominciare il flusso?',
    body: 'Tutte le risposte saranno eliminate. Questa azione è irreversibile.',
    confirm: 'Sì, ricomincia',
    cancel: 'Annulla',
  },
}

export function RestartFlowButton({ sessionId, locale }: { sessionId: string; locale: string }) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const labels = LABELS[locale] ?? LABELS['en-US']!

  async function handleConfirm() {
    setPending(true)
    await discardSession(sessionId, locale)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-gray-600 underline"
        data-testid="flow-restart-button"
      >
        {labels.cta}
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="restart-title"
          data-testid="flow-restart-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h2 id="restart-title" className="text-lg font-semibold">
              {labels.title}
            </h2>
            <p className="mt-2 text-sm text-gray-600">{labels.body}</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded border px-3 py-1 text-sm"
                data-testid="flow-restart-cancel"
              >
                {labels.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={pending}
                className="rounded bg-red-600 px-3 py-1 text-sm text-white disabled:opacity-50"
                data-testid="flow-restart-confirm"
              >
                {labels.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
