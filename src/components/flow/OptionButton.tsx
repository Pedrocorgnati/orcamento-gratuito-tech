'use client'

import { cn } from '@/lib/utils'

type OptionButtonProps = {
  optionId: string
  label: string
  description?: string | null
  isSelected: boolean
  isDisabled?: boolean
  onClick: (optionId: string) => void
}

export function OptionButton({
  optionId,
  label,
  description,
  isSelected,
  isDisabled = false,
  onClick,
}: OptionButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      aria-disabled={isDisabled}
      disabled={isDisabled}
      onClick={() => !isDisabled && onClick(optionId)}
      className={cn(
        // Touch target mínimo obrigatório — INT-070
        'min-h-[56px] w-full',
        // Layout interno
        'flex items-center gap-3 px-4 py-3 text-left',
        // Base visual + micro-interação scale (hover: 1.02, active: 0.98)
        'option-btn-interactive rounded-xl border-2 transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary) focus-visible:ring-offset-2',
        // Estado não selecionado
        !isSelected &&
          'border-(--color-border) bg-(--color-background) hover:border-(--color-primary) hover:bg-(--color-accent)',
        // Estado selecionado
        isSelected &&
          'border-(--color-primary) bg-(--color-accent) ring-2 ring-(--color-primary) ring-offset-0',
        // Estado desabilitado
        isDisabled && 'cursor-not-allowed opacity-50'
      )}
    >
      {/* Indicador visual de seleção */}
      <span
        aria-hidden="true"
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          isSelected
            ? 'border-(--color-primary) bg-(--color-primary) text-(--color-on-primary)'
            : 'border-(--color-text-muted) bg-(--color-background)'
        )}
      >
        {isSelected && (
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="currentColor"
            aria-hidden="true"
          >
            <circle cx="5" cy="5" r="3" />
          </svg>
        )}
      </span>

      {/* Texto da opção */}
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium leading-tight text-(--color-text-primary) sm:text-base">
          {label}
        </span>
        {description && (
          <span className="text-xs text-(--color-text-secondary) sm:text-sm">
            {description}
          </span>
        )}
      </span>
    </button>
  )
}
