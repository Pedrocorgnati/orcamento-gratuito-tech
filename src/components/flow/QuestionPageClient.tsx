'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { QuestionCard } from '@/components/flow/QuestionCard'
import { OptionButton } from '@/components/flow/OptionButton'
import { OptionCheckbox } from '@/components/flow/OptionCheckbox'
import { ConsistencyAlertsManager } from '@/components/flow/ConsistencyAlert'
import { InlineEmailCapture } from '@/components/flow/InlineEmailCapture'
import { QuestionTransition, setFlowNavDirection } from '@/components/flow/QuestionTransition'
import { submitAnswer } from '@/actions/answer'
import {
  trackFlowStarted,
  trackQuestionAnswered,
  trackFlowCompleted,
} from '@/lib/analytics/events'
import type { ConsistencyAlertType } from '@/lib/enums'
import { TEXT_INPUT_LIMITS_BY_CODE } from '@/lib/validations/schemas'

type QuestionOption = {
  id: string
  slug?: string
  order: number
  price_impact: number
  time_impact: number
  complexity_impact: number
  next_question_id: string | null
  translation: {
    label: string
    description: string | null
  }
}

type QuestionData = {
  id: string
  code?: string
  type: string
  block: string
  order: number
  translation: {
    locale: string
    title: string
    description: string | null
    help_text: string | null
  }
  options: QuestionOption[]
}

type QuestionPageClientProps = {
  question: QuestionData
  locale: string
  sessionId?: string
  preselectOrder?: number | null
}

export function QuestionPageClient({
  question,
  locale,
  sessionId,
  preselectOrder,
}: QuestionPageClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [textValue, setTextValue] = useState('')
  const [activeAlerts, setActiveAlerts] = useState<ConsistencyAlertType[]>([])
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [emailCaptured, setEmailCaptured] = useState(false)

  const isSingleChoice = question.type === 'SINGLE_CHOICE'
  const isTextInput =
    question.type === 'TEXT_INPUT' || question.type === 'NUMBER_INPUT'
  const isEmailField = question.code === 'Q101'
  const isPhoneField = question.code === 'Q102'
  const codeLimits = question.code ? TEXT_INPUT_LIMITS_BY_CODE[question.code] : undefined
  const isOptional = codeLimits
    ? !codeLimits.required
    : question.code === 'Q102' || question.code === 'Q103' || question.code === 'Q105'
  const isNarrative = question.block === 'NARRATIVE'
  const useTextarea =
    isTextInput && (isNarrative || (codeLimits ? codeLimits.max > 240 : false))
  const maxLength = codeLimits?.max
  const minLength = codeLimits?.min ?? 0
  const trimmedTextValue = textValue.trim()
  const charCount = trimmedTextValue.length
  const hasTrackedStart = useRef(false)

  // Dispara flow_started na primeira pergunta (order === 1)
  useEffect(() => {
    if (question.order === 1 && !hasTrackedStart.current) {
      hasTrackedStart.current = true
      trackFlowStarted()
    }
  }, [question.order])

  // Preselect via deep-link (?preselect=N) vindo de landing de solução.
  // Aplica apenas em Q001 SINGLE_CHOICE, quando ainda não há seleção.
  const hasAppliedPreselect = useRef(false)
  useEffect(() => {
    if (hasAppliedPreselect.current) return
    if (!preselectOrder) return
    if (question.code !== 'Q001' || question.type !== 'SINGLE_CHOICE') return
    const match = question.options.find((o) => o.order === preselectOrder)
    if (!match) return
    hasAppliedPreselect.current = true
    setSelectedIds([match.id])
  }, [preselectOrder, question.code, question.type, question.options])

  function handleDismissAlert(type: ConsistencyAlertType) {
    setActiveAlerts((prev) => prev.filter((a) => a !== type))
  }

  function navigateAfterSubmit(nextQuestionId: string | null, isComplete: boolean) {
    if (isComplete || !nextQuestionId) {
      if (isComplete && sessionId) {
        trackFlowCompleted({
          session_id: sessionId,
          questions_answered: question.order,
          project_type: question.block,
        })
      }
      router.push(`/${locale}/result`)
    } else {
      router.push(`/${locale}/flow/${nextQuestionId}`)
    }
  }

  // RESOLVED: extraído bloco startTransition duplicado entre handleSingleChoice e handleContinue (G019)
  function _submitAndNavigate(payload: { optionIds?: string[]; textValue?: string }) {
    setFlowNavDirection('forward')
    startTransition(async () => {
      const result = await submitAnswer({
        sessionId: sessionId!,
        questionId: question.id,
        optionIds: payload.optionIds,
        textValue: payload.textValue,
      })

      if (result.success) {
        trackQuestionAnswered({
          question_id: question.id,
          block: question.block,
          type: question.type,
        })
        navigateAfterSubmit(result.data.nextQuestionId, result.data.isComplete)
      } else {
        setSubmitError(result.error.message)
      }
    })
  }

  async function handleSingleChoice(optionId: string) {
    if (isPending) return
    setSelectedIds([optionId])
    setSubmitError(null)

    if (!sessionId) {
      // Sem sessão: navegar pelo next_question_id local (modo demo)
      const option = question.options.find((o) => o.id === optionId)
      if (option?.next_question_id) {
        setFlowNavDirection('forward')
        startTransition(() => {
          router.push(`/${locale}/flow/${option.next_question_id}`)
        })
      }
      return
    }

    _submitAndNavigate({ optionIds: [optionId] })
  }

  function handleCheckboxToggle(optionId: string, checked: boolean) {
    setSelectedIds((prev) =>
      checked ? [...prev, optionId] : prev.filter((id) => id !== optionId)
    )
  }

  async function handleContinue() {
    if (isPending) return
    setSubmitError(null)

    if (!sessionId) return

    if (isTextInput) {
      const trimmed = textValue.trim()
      if (!trimmed && !isOptional) {
        setSubmitError('Preencha este campo para continuar.')
        return
      }
      if (trimmed && minLength > 0 && trimmed.length < minLength) {
        setSubmitError(`Mínimo ${minLength} caracteres.`)
        return
      }
      if (isEmailField && trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        setSubmitError('Informe um email válido.')
        return
      }
      if (isPhoneField && trimmed && !/^[+\d\s()\-]{8,20}$/.test(trimmed)) {
        setSubmitError('Informe um telefone válido.')
        return
      }
      _submitAndNavigate({ textValue: trimmed })
      return
    }

    if (selectedIds.length === 0) return
    _submitAndNavigate({ optionIds: selectedIds })
  }

  return (
    <QuestionTransition>
      <div data-testid="flow-question-wrapper" className="flex flex-col gap-4">
        {/* Alertas de consistência — não bloqueantes */}
        <ConsistencyAlertsManager
          activeAlerts={activeAlerts}
          onDismiss={handleDismissAlert}
        />

        {/* Erro de submissão */}
        {submitError && (
          <div
            data-testid="flow-submit-error"
            role="alert"
            aria-live="polite"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
          >
            {submitError}
          </div>
        )}

        {/* QuestionCard com opções OU input de texto */}
        <QuestionCard
          questionId={question.id}
          translation={question.translation}
          questionType={isSingleChoice ? 'SINGLE_CHOICE' : 'MULTIPLE_CHOICE'}
          selectedIds={
            isTextInput
              ? useTextarea && isOptional
                ? textValue.trim().length > 0
                  ? ['_text']
                  : []
                : isOptional || textValue.trim().length > 0
                  ? ['_text']
                  : []
              : selectedIds
          }
          onContinue={isSingleChoice ? undefined : handleContinue}
          optionsLayout={question.code === 'Q001' ? 'grid' : 'list'}
        >
          {isTextInput ? (
            <div className="flex flex-col gap-2">
              {useTextarea ? (
                <textarea
                  data-testid={`flow-text-input-${question.id}`}
                  rows={isNarrative && (codeLimits?.max ?? 0) > 800 ? 8 : 6}
                  maxLength={maxLength}
                  value={textValue}
                  onChange={(e) => setTextValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault()
                      handleContinue()
                    }
                  }}
                  disabled={isPending}
                  placeholder="Escreva com suas palavras. Sem formato obrigatório."
                  aria-label={question.translation.title}
                  className="w-full resize-y rounded-xl border-2 border-(--color-border) bg-(--color-background) px-4 py-3 text-base text-(--color-text-primary) placeholder:text-(--color-text-muted) focus:border-(--color-primary) focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                />
              ) : (
                <input
                  data-testid={`flow-text-input-${question.id}`}
                  type={isEmailField ? 'email' : isPhoneField ? 'tel' : 'text'}
                  inputMode={
                    question.type === 'NUMBER_INPUT'
                      ? 'numeric'
                      : isEmailField
                        ? 'email'
                        : isPhoneField
                          ? 'tel'
                          : 'text'
                  }
                  autoComplete={
                    isEmailField
                      ? 'email'
                      : isPhoneField
                        ? 'tel'
                        : question.code === 'Q100'
                          ? 'name'
                          : question.code === 'Q103'
                            ? 'organization'
                            : 'off'
                  }
                  maxLength={maxLength}
                  value={textValue}
                  onChange={(e) => setTextValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleContinue()
                    }
                  }}
                  disabled={isPending}
                  placeholder={
                    isEmailField
                      ? 'seu@email.com'
                      : isPhoneField
                        ? '(11) 99999-9999'
                        : 'Digite sua resposta'
                  }
                  aria-label={question.translation.title}
                  className="w-full rounded-xl border-2 border-(--color-border) bg-(--color-background) px-4 py-3 text-base text-(--color-text-primary) placeholder:text-(--color-text-muted) focus:border-(--color-primary) focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                />
              )}
              {(useTextarea || maxLength) && (
                <div
                  data-testid={`flow-text-counter-${question.id}`}
                  className="flex items-center justify-between text-xs text-(--color-text-muted)"
                >
                  <span>
                    {minLength > 0 && charCount < minLength
                      ? `Mínimo ${minLength} caracteres.`
                      : isOptional
                        ? 'Opcional'
                        : 'Obrigatório'}
                  </span>
                  {maxLength && (
                    <span aria-live="polite">
                      {charCount}/{maxLength}
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            question.options.map((option) =>
              isSingleChoice ? (
                <OptionButton
                  key={option.id}
                  optionId={option.id}
                  label={option.translation.label}
                  description={option.translation.description}
                  isSelected={selectedIds.includes(option.id)}
                  isDisabled={isPending}
                  onClick={handleSingleChoice}
                />
              ) : (
                <OptionCheckbox
                  key={option.id}
                  optionId={option.id}
                  label={option.translation.label}
                  description={option.translation.description}
                  isChecked={selectedIds.includes(option.id)}
                  isDisabled={isPending}
                  onChange={handleCheckboxToggle}
                />
              )
            )
          )}
        </QuestionCard>

        {isTextInput && useTextarea && isOptional && sessionId && (
          <div className="flex justify-end">
            <button
              type="button"
              data-testid={`flow-text-skip-${question.id}`}
              disabled={isPending}
              onClick={() => {
                setSubmitError(null)
                setFlowNavDirection('forward')
                startTransition(async () => {
                  const result = await submitAnswer({
                    sessionId,
                    questionId: question.id,
                    textValue: '',
                  })
                  if (result.success) {
                    trackQuestionAnswered({
                      question_id: question.id,
                      block: question.block,
                      type: question.type,
                    })
                    navigateAfterSubmit(result.data.nextQuestionId, result.data.isComplete)
                  } else {
                    setSubmitError(result.error.message)
                  }
                })
              }}
              className="text-sm text-(--color-text-muted) underline-offset-4 hover:text-(--color-text-primary) hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              Pular esta pergunta
            </button>
          </div>
        )}

        {question.code === 'Q093' && !emailCaptured && sessionId && (
          <InlineEmailCapture
            sessionId={sessionId}
            locale={locale}
            onComplete={(email) => {
              if (email) setEmailCaptured(true)
            }}
          />
        )}
      </div>
    </QuestionTransition>
  )
}
