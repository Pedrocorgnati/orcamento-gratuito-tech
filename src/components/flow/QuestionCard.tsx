'use client'

import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Collapsible } from '@/components/ui/CollapsibleInfo'
import { cn } from '@/lib/utils'

type QuestionTranslation = {
  title: string
  description: string | null
  help_text?: string | null
  locale: string
}

type QuestionCardProps = {
  questionId: string
  translation: QuestionTranslation
  questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE'
  selectedIds?: string[]
  onContinue?: () => void
  children: React.ReactNode
  className?: string
  /** Layout das opções. 'list' empilha (default); 'grid' usa 3 colunas em desktop. */
  optionsLayout?: 'list' | 'grid'
}

export function QuestionCard({
  questionId,
  translation,
  questionType,
  selectedIds,
  onContinue,
  children,
  className,
  optionsLayout = 'list',
}: QuestionCardProps) {
  const t = useTranslations('flow')
  const hasNoOptions = !children

  return (
    <Card
      padding="none"
      data-testid="flow-question-card"
      aria-label={t('question_aria', { id: questionId })}
      className={cn(
        'w-full p-6 sm:p-8',
        'flex flex-col gap-6',
        'rounded-2xl',
        className
      )}
    >
      {/* Cabeçalho da pergunta */}
      <Collapsible content={translation.help_text} size="md">
        <div data-testid="flow-question-header" className="flex flex-col gap-2">
          <div className="flex items-start gap-3">
            <h1
              id={`question-title-${questionId}`}
              data-testid="flow-question-title"
              className="flex-1 text-xl font-semibold leading-tight text-(--color-text-primary) sm:text-2xl"
            >
              {translation.title}
            </h1>
            <Collapsible.Trigger className="mt-1" />
          </div>
          {translation.description && (
            <p data-testid="flow-question-description" className="text-sm text-(--color-text-muted) sm:text-base">
              {translation.description}
            </p>
          )}
          <Collapsible.Panel content={translation.help_text} />
        </div>
      </Collapsible>

      {/* Container das opções */}
      <div
        role="group"
        data-testid="flow-question-options"
        aria-labelledby={`question-title-${questionId}`}
        className={cn(
          'gap-3',
          optionsLayout === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2'
            : 'flex flex-col'
        )}
      >
        {hasNoOptions ? (
          <p data-testid="flow-question-empty" className="text-sm text-(--color-text-muted) text-center py-4">
            {t('no_options')}
          </p>
        ) : (
          children
        )}
      </div>

      {/* Botão Continuar — apenas para MULTIPLE_CHOICE */}
      {questionType === 'MULTIPLE_CHOICE' && (
        <Button
          type="button"
          variant="primary"
          data-testid="flow-question-continue-button"
          disabled={!selectedIds || selectedIds.length === 0}
          aria-disabled={!selectedIds || selectedIds.length === 0}
          onClick={onContinue}
          className="mt-2 w-full sm:w-auto sm:self-end"
        >
          {t('continue_button')}
          {selectedIds && selectedIds.length > 0 && (
            <span
              aria-label={t('options_selected', { count: selectedIds.length })}
              className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs"
            >
              {selectedIds.length}
            </span>
          )}
        </Button>
      )}
    </Card>
  )
}
