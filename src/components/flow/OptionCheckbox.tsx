'use client'

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

type OptionCheckboxProps = {
  optionId: string
  label: string
  description?: string | null
  isChecked: boolean
  isDisabled?: boolean
  onChange: (optionId: string, checked: boolean) => void
}

export function OptionCheckbox({
  optionId,
  label,
  description,
  isChecked,
  isDisabled = false,
  onChange,
}: OptionCheckboxProps) {
  const checkboxId = `option-checkbox-${optionId}`

  return (
    <label
      htmlFor={checkboxId}
      className={cn(
        // Touch target mínimo — INT-070
        'min-h-[44px] w-full',
        // Layout
        'flex cursor-pointer items-center gap-3 px-4 py-3',
        // Base visual
        'rounded-xl border-2 transition-all duration-150',
        // Estado não selecionado
        !isChecked &&
          'border-(--color-border) bg-(--color-background) hover:border-(--color-primary) hover:bg-(--color-accent)',
        // Estado selecionado
        isChecked &&
          'border-(--color-primary) bg-(--color-accent)',
        // Desabilitado
        isDisabled && 'cursor-not-allowed opacity-50'
      )}
    >
      {/* Input oculto mas acessível */}
      <input
        id={checkboxId}
        type="checkbox"
        aria-checked={isChecked}
        checked={isChecked}
        disabled={isDisabled}
        onChange={(e) => !isDisabled && onChange(optionId, e.target.checked)}
        className="sr-only"
      />

      {/* Checkbox visual personalizado */}
      <span
        aria-hidden="true"
        className={cn(
          // Animação suave de check/uncheck + scale ao marcar
          'checkbox-visual-animated',
          isChecked && 'checked',
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
          isChecked
            ? 'border-(--color-primary) bg-(--color-primary) text-(--color-on-primary)'
            : 'border-(--color-text-muted) bg-(--color-background)'
        )}
      >
        {isChecked && <Check className="h-3 w-3" strokeWidth={3} />}
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
    </label>
  )
}
