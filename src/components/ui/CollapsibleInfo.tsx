'use client'

import { createContext, useContext, useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type CollapsibleContext = {
  isOpen: boolean
  toggle: () => void
  contentId: string
  size: 'sm' | 'md'
  hasContent: boolean
  ariaLabelOpen: string
  ariaLabelClose: string
}

const Ctx = createContext<CollapsibleContext | null>(null)

function useCollapsibleCtx() {
  const ctx = useContext(Ctx)
  if (!ctx) {
    throw new Error('Collapsible subcomponents must be used inside <Collapsible>')
  }
  return ctx
}

export type CollapsibleProps = {
  content: string | null | undefined
  size?: 'sm' | 'md'
  ariaLabelOpen?: string
  ariaLabelClose?: string
  children?: React.ReactNode
}

export function Collapsible({
  content,
  size = 'md',
  ariaLabelOpen = 'Ver explicação',
  ariaLabelClose = 'Ocultar explicação',
  children,
}: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(false)
  const contentId = useId()
  const hasContent = Boolean(content?.trim())

  const value: CollapsibleContext = {
    isOpen,
    toggle: () => setIsOpen((v) => !v),
    contentId,
    size,
    hasContent,
    ariaLabelOpen,
    ariaLabelClose,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export type CollapsibleTriggerProps = {
  className?: string
}

function CollapsibleTrigger({ className }: CollapsibleTriggerProps) {
  const { isOpen, toggle, contentId, size, hasContent, ariaLabelOpen, ariaLabelClose } =
    useCollapsibleCtx()

  if (!hasContent) return null

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
    toggle()
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    event.stopPropagation()
  }

  return (
    <button
      type="button"
      aria-expanded={isOpen}
      aria-controls={contentId}
      aria-label={isOpen ? ariaLabelClose : ariaLabelOpen}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border border-(--color-border) bg-(--color-background) text-(--color-text-secondary) transition-[color,background-color,border-color,transform] duration-200',
        'hover:border-(--color-primary) hover:text-(--color-primary)',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary) focus-visible:ring-offset-2',
        size === 'sm' ? 'h-7 w-7' : 'h-9 w-9',
        className
      )}
    >
      <ChevronDown
        aria-hidden="true"
        className={cn(
          'transition-transform duration-200',
          size === 'sm' ? 'h-4 w-4' : 'h-5 w-5',
          isOpen && 'rotate-180'
        )}
      />
    </button>
  )
}

export type CollapsiblePanelProps = {
  content: string | null | undefined
  className?: string
}

function CollapsiblePanel({ content, className }: CollapsiblePanelProps) {
  const { isOpen, contentId, size, hasContent, ariaLabelOpen, ariaLabelClose } =
    useCollapsibleCtx()

  if (!hasContent) return null

  return (
    <div
      id={contentId}
      role="region"
      aria-label={isOpen ? ariaLabelClose : ariaLabelOpen}
      className={cn(
        'grid w-full overflow-hidden transition-[grid-template-rows,opacity] duration-200 ease-out',
        isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        className
      )}
    >
      <div className="overflow-hidden">
        <p
          className={cn(
            'rounded-xl border border-(--color-border) bg-(--color-surface)/70 px-3 py-2 text-(--color-text-secondary)',
            size === 'sm' ? 'text-xs leading-5 sm:text-sm' : 'text-sm leading-6'
          )}
        >
          {content}
        </p>
      </div>
    </div>
  )
}

Collapsible.Trigger = CollapsibleTrigger
Collapsible.Panel = CollapsiblePanel

/**
 * Wrapper simples: trigger + panel em coluna.
 * Para layout inline (trigger ao lado de texto, panel em nova linha),
 * use `<Collapsible>` + `<Collapsible.Trigger />` + `<Collapsible.Panel />` manualmente.
 */
export type CollapsibleInfoProps = {
  content: string | null | undefined
  ariaLabelOpen?: string
  ariaLabelClose?: string
  className?: string
  size?: 'sm' | 'md'
}

export function CollapsibleInfo({
  content,
  ariaLabelOpen,
  ariaLabelClose,
  className,
  size = 'md',
}: CollapsibleInfoProps) {
  const normalized = content?.trim()
  if (!normalized) return null

  return (
    <Collapsible
      content={normalized}
      size={size}
      ariaLabelOpen={ariaLabelOpen}
      ariaLabelClose={ariaLabelClose}
    >
      <div className={cn('flex flex-col items-start gap-2', className)}>
        <Collapsible.Trigger />
        <Collapsible.Panel content={normalized} />
      </div>
    </Collapsible>
  )
}
