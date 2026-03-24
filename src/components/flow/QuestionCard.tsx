'use client'

import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

type QuestionTranslation = {
  title: string
  description: string | null
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
}

export function QuestionCard({
  questionId,
  translation,
  questionType,
  selectedIds,
  onContinue,
  children,
  className,
}: QuestionCardProps) {
  const t = useTranslations('flow')
  const hasNoOptions = !children

  return (
    <Card
      padding="none"
      aria-label={t('question_aria', { id: questionId })}
      className={cn(
        'w-full p-6 sm:p-8',
        'flex flex-col gap-6',
        'rounded-2xl',
        className
      )}
    >
      {/* Cabeçalho da pergunta */}
      <div className="flex flex-col gap-2">
        <h1
          id={`question-title-${questionId}`}
          className="text-xl font-semibold leading-tight text-(--color-text-primary) sm:text-2xl"
        >
          {translation.title}
        </h1>
        {translation.description && (
          <p className="text-sm text-(--color-text-muted) sm:text-base">
            {translation.description}
          </p>
        )}
      </div>

      {/* Container das opções */}
      <div
        role="group"
        aria-labelledby={`question-title-${questionId}`}
        className="flex flex-col gap-3"
      >
        {hasNoOptions ? (
          <p className="text-sm text-(--color-text-muted) text-center py-4">
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
