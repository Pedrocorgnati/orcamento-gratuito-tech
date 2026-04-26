'use client'

import { useState } from 'react'
import Link from 'next/link'
import { discardSession } from '@/actions/session'

const LABELS: Record<string, { title: string; body: string; resume: string; restart: string }> = {
  'pt-BR': {
    title: 'Você tem um orçamento em andamento',
    body: 'Deseja retomar de onde parou ou começar de novo?',
    resume: 'Retomar',
    restart: 'Começar de novo',
  },
  'en-US': {
    title: 'You have an estimate in progress',
    body: 'Would you like to resume where you left off or start over?',
    resume: 'Resume',
    restart: 'Start over',
  },
  'es-ES': {
    title: 'Tienes un presupuesto en curso',
    body: '¿Quieres retomar donde lo dejaste o empezar de nuevo?',
    resume: 'Retomar',
    restart: 'Empezar de nuevo',
  },
  'it-IT': {
    title: 'Hai un preventivo in corso',
    body: 'Vuoi riprendere da dove avevi lasciato o ricominciare?',
    resume: 'Riprendi',
    restart: 'Ricomincia',
  },
}

export function ResumeOrRestartDialog({
  sessionId,
  locale,
  resumeHref,
}: {
  sessionId: string
  locale: string
  resumeHref: string
}) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null
  const labels = LABELS[locale] ?? LABELS['en-US']!

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="resume-title"
      data-testid="resume-or-restart-dialog"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-white p-4 shadow-lg md:inset-auto md:right-8 md:bottom-8 md:max-w-sm md:rounded-lg md:border"
    >
      <h2 id="resume-title" className="text-lg font-semibold">
        {labels.title}
      </h2>
      <p className="mt-1 text-sm text-gray-600">{labels.body}</p>
      <div className="mt-3 flex gap-2">
        <Link
          href={resumeHref}
          data-testid="resume-dialog-resume"
          className="rounded bg-blue-600 px-3 py-1 text-sm text-white"
        >
          {labels.resume}
        </Link>
        <button
          type="button"
          data-testid="resume-dialog-restart"
          onClick={async () => {
            setDismissed(true)
            await discardSession(sessionId, locale)
          }}
          className="rounded border px-3 py-1 text-sm"
        >
          {labels.restart}
        </button>
      </div>
    </div>
  )
}
