'use client'

import { ConsistencyAlertType } from '@/lib/enums'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { useState } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Config dos 5 tipos de alerta — textos e cores
// ─────────────────────────────────────────────────────────────────────────────

const ALERT_CONFIG: Record<
  ConsistencyAlertType,
  { title: string; message: string; icon: string; colorClass: string }
> = {
  [ConsistencyAlertType.BUDGET_MISMATCH]: {
    title: 'Atenção ao orçamento',
    message:
      'Seu orçamento pode ser incompatível com as funcionalidades selecionadas. Considere aumentar o budget ou reduzir o escopo.',
    icon: '💰',
    // warning token handles dark mode; no yellow token in design system — keeping Tailwind amber
    colorClass:
      'border-yellow-300 bg-yellow-50 text-yellow-900 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-100',
  },
  [ConsistencyAlertType.TIMELINE_CONFLICT]: {
    title: 'Prazo desafiador',
    message:
      'O prazo selecionado pode ser desafiador para o escopo atual. Projetos similares costumam levar mais tempo.',
    icon: '⏱️',
    // no orange token in design system — keeping Tailwind orange
    colorClass:
      'border-orange-300 bg-orange-50 text-orange-900 dark:border-orange-700 dark:bg-orange-950 dark:text-orange-100',
  },
  [ConsistencyAlertType.SCOPE_OVERLAP]: {
    title: 'Funcionalidades sobrepostas',
    message:
      'Algumas funcionalidades selecionadas podem se sobrepor. Isso pode resultar em retrabalho e custo extra.',
    icon: '🔄',
    // info context → --color-info token; accent used for background
    colorClass:
      'border-(--color-info) bg-(--color-accent) text-(--color-on-accent)',
  },
  [ConsistencyAlertType.COMPLEXITY_JUMP]: {
    title: 'Salto de complexidade',
    message:
      'Detectamos um salto significativo de complexidade nas suas escolhas. Isso pode impactar o prazo e custo.',
    icon: '📈',
    // no purple token in design system — keeping Tailwind purple
    colorClass:
      'border-purple-300 bg-purple-50 text-purple-900 dark:border-purple-700 dark:bg-purple-950 dark:text-purple-100',
  },
  [ConsistencyAlertType.SUSPICIOUS_PATTERN]: {
    title: 'Respostas muito rápidas',
    message:
      'Suas respostas foram muito rápidas — isso pode afetar a precisão do orçamento. Revise as opções com calma.',
    icon: '⚡',
    // danger token handles dark mode
    colorClass:
      'border-(--color-danger) bg-red-50 text-(--color-danger) dark:bg-red-950',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// ConsistencyAlert — Alerta informativo NÃO bloqueante.
//
// REGRAS:
// - Não usa position:fixed — não bloqueia o scroll
// - O usuário PODE responder enquanto o alerta está visível
// - Dismiss opcional — não precisa ser fechado para continuar
// - role="alert" + aria-live="polite" — leitores de tela anunciam sem interromper
// ─────────────────────────────────────────────────────────────────────────────

type ConsistencyAlertProps = {
  type: ConsistencyAlertType
  onDismiss: (type: ConsistencyAlertType) => void
  className?: string
}

export function ConsistencyAlert({
  type,
  onDismiss,
  className,
}: ConsistencyAlertProps) {
  const [isVisible, setIsVisible] = useState(true)
  const config = ALERT_CONFIG[type]

  if (!isVisible) return null

  function handleDismiss() {
    setIsVisible(false)
    onDismiss(type)
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        'w-full rounded-xl border px-4 py-3',
        'animate-in fade-in slide-in-from-top-2 duration-300',
        config.colorClass,
        className
      )}
    >
      <div className="flex items-start gap-3">
        {/* Ícone */}
        <span
          role="img"
          aria-label={config.title}
          className="mt-0.5 shrink-0 text-lg leading-none"
        >
          {config.icon}
        </span>

        {/* Conteúdo */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight">{config.title}</p>
          <p className="mt-0.5 text-sm leading-snug opacity-90">
            {config.message}
          </p>
        </div>

        {/* Botão dismiss */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label={`Fechar alerta: ${config.title}`}
          className={cn(
            'shrink-0 rounded p-0.5',
            'hover:bg-black/10 dark:hover:bg-white/10',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current',
            'transition-colors'
          )}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ConsistencyAlertsManager — gerenciador de múltiplos alertas empilhados
// ─────────────────────────────────────────────────────────────────────────────

type ConsistencyAlertsManagerProps = {
  activeAlerts: ConsistencyAlertType[]
  onDismiss: (type: ConsistencyAlertType) => void
}

export function ConsistencyAlertsManager({
  activeAlerts,
  onDismiss,
}: ConsistencyAlertsManagerProps) {
  if (activeAlerts.length === 0) return null

  return (
    <div
      aria-label="Alertas de consistência"
      className="flex flex-col gap-2"
    >
      {activeAlerts.map((alertType) => (
        <ConsistencyAlert key={alertType} type={alertType} onDismiss={onDismiss} />
      ))}
    </div>
  )
}
