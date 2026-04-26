'use client'

import { Collapsible } from '@/components/ui/CollapsibleInfo'
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
  function handleCardClick(event: React.MouseEvent<HTMLDivElement>) {
    if (isDisabled) return
    // Ignora cliques que partiram do chevron/panel (stopPropagation no Trigger já filtra a maioria).
    if ((event.target as HTMLElement).closest('[data-collapsible-part]')) return
    onClick(optionId)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (isDisabled) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick(optionId)
    }
  }

  return (
    <Collapsible
      content={description}
      size="sm"
      ariaLabelOpen={`Ver explicação sobre ${label}`}
      ariaLabelClose={`Ocultar explicação sobre ${label}`}
    >
      <div
        data-testid={`flow-option-button-${optionId}`}
        role="radio"
        aria-checked={isSelected}
        aria-disabled={isDisabled}
        tabIndex={isDisabled ? -1 : 0}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        className={cn(
          'min-h-[56px] w-full',
          'flex flex-col gap-2 px-4 py-3 text-left',
          'option-btn-interactive rounded-xl border-2 transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary) focus-visible:ring-offset-2',
          !isSelected &&
            'border-(--color-border) bg-(--color-background) hover:border-(--color-primary) hover:bg-(--color-accent)',
          isSelected &&
            'border-(--color-primary) bg-(--color-accent) ring-2 ring-(--color-primary) ring-offset-0',
          isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
        )}
      >
        <div className="flex w-full items-center gap-3">
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
          <span className="flex-1 text-sm font-medium leading-tight text-(--color-text-primary) sm:text-base">
            {label}
          </span>

          <span data-collapsible-part="trigger">
            <Collapsible.Trigger />
          </span>
        </div>

        <div data-collapsible-part="panel">
          <Collapsible.Panel content={description} className="pl-8" />
        </div>
      </div>
    </Collapsible>
  )
}
