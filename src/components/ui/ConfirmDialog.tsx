'use client'

import { useEffect, useRef } from 'react'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  variant?: 'danger' | 'default'
  pending?: boolean
  dataTestId?: string
}

/**
 * CL-237 — Reusable accessible confirmation dialog.
 * - Focus trap via initial focus on confirm button
 * - ESC closes (calls onCancel)
 * - Click backdrop closes
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  variant = 'default',
  pending = false,
  dataTestId = 'confirm-dialog',
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    confirmRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  const confirmClass =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : 'bg-blue-600 hover:bg-blue-700 text-white'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${dataTestId}-title`}
      aria-describedby={description ? `${dataTestId}-desc` : undefined}
      data-testid={dataTestId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <h2 id={`${dataTestId}-title`} className="text-lg font-semibold text-slate-900">
          {title}
        </h2>
        {description && (
          <p id={`${dataTestId}-desc`} className="mt-2 text-sm text-slate-600">
            {description}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
            data-testid={`${dataTestId}-cancel`}
            disabled={pending}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={`rounded px-3 py-1.5 text-sm disabled:opacity-50 ${confirmClass}`}
            data-testid={`${dataTestId}-confirm`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
