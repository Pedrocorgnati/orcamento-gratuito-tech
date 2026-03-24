'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  /** Percentual de progresso (0-100) */
  progress: number
  /** Quantidade de perguntas já respondidas */
  questionsAnswered: number
  /** Estimativa dinâmica do total de perguntas no path atual */
  estimatedTotal: number
  className?: string
}

export function ProgressBar({
  progress,
  questionsAnswered,
  estimatedTotal,
  className,
}: ProgressBarProps) {
  const t = useTranslations('flow')

  // Normalizar progress para 0-100; NaN/undefined → 0
  const clampedProgress = Number.isFinite(progress)
    ? Math.min(100, Math.max(0, progress))
    : 0

  const label = t('progress_label', { answered: questionsAnswered, total: estimatedTotal })

  return (
    <div className={cn('w-full', className)}>
      {/* Texto de progresso */}
      <div className="flex items-center justify-between px-4 pb-1 pt-1.5 sm:px-6">
        <span
          className="text-xs text-(--color-text-muted)"
          aria-hidden="true"
        >
          {label}
        </span>
        <span
          className="text-xs font-medium text-(--color-text-primary)"
          aria-hidden="true"
        >
          {clampedProgress}%
        </span>
      </div>

      {/* Barra de progresso — 8px height, mobile-first */}
      <div
        className="h-2 w-full overflow-hidden bg-(--color-muted)"
        role="progressbar"
        aria-valuenow={clampedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="progress-bar-fill h-full"
          style={{
            width: `${clampedProgress}%`,
            background: 'linear-gradient(to right, color-mix(in srgb, var(--color-primary) 70%, transparent), var(--color-primary))',
          }}
        />
      </div>
    </div>
  )
}
