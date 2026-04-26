'use client'

import { Check } from 'lucide-react'
import { Collapsible } from '@/components/ui/CollapsibleInfo'
import { cn } from '@/lib/utils'

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
    <Collapsible
      content={description}
      size="sm"
      ariaLabelOpen={`Ver explicação sobre ${label}`}
      ariaLabelClose={`Ocultar explicação sobre ${label}`}
    >
      <label
        htmlFor={checkboxId}
        data-testid={`flow-option-checkbox-${optionId}`}
        className={cn(
          'min-h-[44px] w-full',
          'flex flex-col justify-center gap-2 px-4 py-3',
          'rounded-xl border-2 transition-all duration-150',
          'focus-within:ring-2 focus-within:ring-(--color-primary) focus-within:ring-offset-2',
          !isChecked &&
            'border-(--color-border) bg-(--color-background) hover:border-(--color-primary) hover:bg-(--color-accent)',
          isChecked && 'border-(--color-primary) bg-(--color-accent)',
          isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
        )}
      >
        <input
          id={checkboxId}
          type="checkbox"
          data-testid={`flow-option-checkbox-${optionId}-input`}
          aria-checked={isChecked}
          checked={isChecked}
          disabled={isDisabled}
          onChange={(e) => !isDisabled && onChange(optionId, e.target.checked)}
          className="sr-only"
        />

        <div className="flex w-full items-center gap-3">
          {/* Checkbox visual personalizado */}
          <span
            aria-hidden="true"
            className={cn(
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
          <span className="flex-1 text-sm font-medium leading-tight text-(--color-text-primary) sm:text-base">
            {label}
          </span>

          <Collapsible.Trigger />
        </div>

        <Collapsible.Panel content={description} className="pl-8" />
      </label>
    </Collapsible>
  )
}
