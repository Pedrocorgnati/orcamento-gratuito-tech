'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { setFlowNavDirection } from '@/components/flow/QuestionTransition'

type BackButtonProps = {
  isFirstQuestion: boolean
  onGoBack?: () => Promise<void> | void
  className?: string
}

export function BackButton({
  isFirstQuestion,
  onGoBack,
  className,
}: BackButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState(false)
  const isDisabled = isFirstQuestion || isPending

  return (
    <div data-testid="flow-back-button-wrapper" className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        data-testid="flow-back-button"
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-label={
          isFirstQuestion
            ? 'Voltar (desabilitado na primeira pergunta)'
            : 'Voltar para a pergunta anterior'
        }
        onClick={() => {
          if (!isDisabled) {
            setError(false)
            setFlowNavDirection('backward')
            startTransition(async () => {
              try {
                await onGoBack?.()
              } catch {
                setError(true)
              }
            })
          }
        }}
        className={cn(
          'flex items-center gap-2 text-(--color-text-secondary) hover:text-(--color-text-primary)',
          isDisabled && 'cursor-not-allowed opacity-40',
          className
        )}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        )}
        <span>Voltar</span>
      </Button>
      {error && (
        <p
          data-testid="flow-back-button-error"
          role="alert"
          aria-live="assertive"
          className="text-xs text-(--color-danger)"
        >
          Erro ao voltar. Tente novamente.
        </p>
      )}
    </div>
  )
}
