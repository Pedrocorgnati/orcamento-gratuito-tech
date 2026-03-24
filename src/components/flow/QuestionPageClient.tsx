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
  }
  options: QuestionOption[]
}

type QuestionPageClientProps = {
  question: QuestionData
  locale: string
  sessionId?: string
}

export function QuestionPageClient({
  question,
  locale,
  sessionId,
}: QuestionPageClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [activeAlerts, setActiveAlerts] = useState<ConsistencyAlertType[]>([])
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [emailCaptured, setEmailCaptured] = useState(false)

  const isSingleChoice = question.type === 'SINGLE_CHOICE'
  const hasTrackedStart = useRef(false)

  // Dispara flow_started na primeira pergunta (order === 1)
  useEffect(() => {
    if (question.order === 1 && !hasTrackedStart.current) {
      hasTrackedStart.current = true
      trackFlowStarted()
    }
  }, [question.order])

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
  function _submitAndNavigate(optionIds: string[]) {
    setFlowNavDirection('forward')
    startTransition(async () => {
      const result = await submitAnswer({
        sessionId: sessionId!,
        questionId: question.id,
        optionIds,
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

    _submitAndNavigate([optionId])
  }

  function handleCheckboxToggle(optionId: string, checked: boolean) {
    setSelectedIds((prev) =>
      checked ? [...prev, optionId] : prev.filter((id) => id !== optionId)
    )
  }

  async function handleContinue() {
    if (selectedIds.length === 0 || isPending) return
    setSubmitError(null)

    if (!sessionId) return

    _submitAndNavigate(selectedIds)
  }

  return (
    <QuestionTransition>
      <div className="flex flex-col gap-4">
        {/* Alertas de consistência — não bloqueantes */}
        <ConsistencyAlertsManager
          activeAlerts={activeAlerts}
          onDismiss={handleDismissAlert}
        />

        {/* Erro de submissão */}
        {submitError && (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
          >
            {submitError}
          </div>
        )}

        {/* QuestionCard com opções */}
        <QuestionCard
          questionId={question.id}
          translation={question.translation}
          questionType={isSingleChoice ? 'SINGLE_CHOICE' : 'MULTIPLE_CHOICE'}
          selectedIds={selectedIds}
          onContinue={isSingleChoice ? undefined : handleContinue}
        >
          {question.options.map((option) =>
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
          )}
        </QuestionCard>

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
