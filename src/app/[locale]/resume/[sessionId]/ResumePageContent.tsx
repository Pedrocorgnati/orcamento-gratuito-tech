'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, Clock, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Button, buttonVariants } from '@/components/ui/Button'

// ─────────────────────────────────────────────────────────────────────────────
// Types & Constants
// ─────────────────────────────────────────────────────────────────────────────

export type ResumeState =
  | 'NO_COOKIE'
  | 'COOKIE_MISMATCH'
  | 'NOT_FOUND'
  | 'EXPIRED'
  | 'ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN'

type StateMessage = {
  title: string
  description: string
  showNewBudgetCTA: boolean
  showRetryCTA: boolean
  ctaNewBudget: string
  ctaRetry: string
  ctaBackHome: string
}

const RESUME_MESSAGES: Record<string, Record<ResumeState, StateMessage>> = {
  'pt-BR': {
    NO_COOKIE: {
      title: 'Sessão não encontrada',
      description:
        'Este link de retomada não pertence a este dispositivo. Inicie um novo orçamento para começar.',
      showNewBudgetCTA: true,
      showRetryCTA: false,
      ctaNewBudget: 'Iniciar novo orçamento',
      ctaRetry: 'Tentar novamente',
      ctaBackHome: 'Voltar ao início',
    },
    COOKIE_MISMATCH: {
      title: 'Sessão de outro dispositivo',
      description:
        'Este orçamento foi iniciado em outro dispositivo e não pode ser acessado aqui. Inicie um novo orçamento.',
      showNewBudgetCTA: true,
      showRetryCTA: false,
      ctaNewBudget: 'Iniciar novo orçamento',
      ctaRetry: 'Tentar novamente',
      ctaBackHome: 'Voltar ao início',
    },
    NOT_FOUND: {
      title: 'Sessão não encontrada',
      description:
        'O orçamento que você tentou retomar não existe ou foi removido. Inicie um novo orçamento.',
      showNewBudgetCTA: true,
      showRetryCTA: false,
      ctaNewBudget: 'Iniciar novo orçamento',
      ctaRetry: 'Tentar novamente',
      ctaBackHome: 'Voltar ao início',
    },
    EXPIRED: {
      title: 'Sessão expirada',
      description:
        'Seu orçamento em andamento expirou após 7 dias de inatividade. Inicie um novo orçamento — leva apenas alguns minutos.',
      showNewBudgetCTA: true,
      showRetryCTA: false,
      ctaNewBudget: 'Iniciar novo orçamento',
      ctaRetry: 'Tentar novamente',
      ctaBackHome: 'Voltar ao início',
    },
    ERROR: {
      title: 'Erro ao carregar sessão',
      description:
        'Ocorreu um erro ao tentar retomar seu orçamento. Tente novamente ou inicie um novo.',
      showNewBudgetCTA: true,
      showRetryCTA: false,
      ctaNewBudget: 'Iniciar novo orçamento',
      ctaRetry: 'Tentar novamente',
      ctaBackHome: 'Voltar ao início',
    },
    NETWORK_ERROR: {
      title: 'Erro de conexão',
      description:
        'Não foi possível verificar seu orçamento. Verifique sua conexão com a internet e tente novamente.',
      showNewBudgetCTA: false,
      showRetryCTA: true,
      ctaNewBudget: 'Iniciar novo orçamento',
      ctaRetry: 'Tentar novamente',
      ctaBackHome: 'Voltar ao início',
    },
    UNKNOWN: {
      title: 'Estado inválido',
      description: 'Não foi possível determinar o estado do orçamento. Tente novamente.',
      showNewBudgetCTA: true,
      showRetryCTA: false,
      ctaNewBudget: 'Iniciar novo orçamento',
      ctaRetry: 'Tentar novamente',
      ctaBackHome: 'Voltar ao início',
    },
  },
  'en-US': {
    NO_COOKIE: {
      title: 'Session not found',
      description:
        'This resume link does not belong to this device. Start a new estimate to begin.',
      showNewBudgetCTA: true,
      showRetryCTA: false,
      ctaNewBudget: 'Start new estimate',
      ctaRetry: 'Try again',
      ctaBackHome: 'Back to home',
    },
    COOKIE_MISMATCH: {
      title: 'Session from another device',
      description:
        'This estimate was started on another device and cannot be accessed here. Start a new estimate.',
      showNewBudgetCTA: true,
      showRetryCTA: false,
      ctaNewBudget: 'Start new estimate',
      ctaRetry: 'Try again',
      ctaBackHome: 'Back to home',
    },
    NOT_FOUND: {
      title: 'Session not found',
      description:
        'The estimate you tried to resume does not exist or has been removed. Start a new estimate.',
      showNewBudgetCTA: true,
      showRetryCTA: false,
      ctaNewBudget: 'Start new estimate',
      ctaRetry: 'Try again',
      ctaBackHome: 'Back to home',
    },
    EXPIRED: {
      title: 'Session expired',
      description:
        'Your estimate in progress expired after 7 days of inactivity. Start a new estimate — it only takes a few minutes.',
      showNewBudgetCTA: true,
      showRetryCTA: false,
      ctaNewBudget: 'Start new estimate',
      ctaRetry: 'Try again',
      ctaBackHome: 'Back to home',
    },
    ERROR: {
      title: 'Error loading session',
      description:
        'An error occurred while trying to resume your estimate. Try again or start a new one.',
      showNewBudgetCTA: true,
      showRetryCTA: false,
      ctaNewBudget: 'Start new estimate',
      ctaRetry: 'Try again',
      ctaBackHome: 'Back to home',
    },
    NETWORK_ERROR: {
      title: 'Connection error',
      description:
        'Could not verify your estimate. Check your internet connection and try again.',
      showNewBudgetCTA: false,
      showRetryCTA: true,
      ctaNewBudget: 'Start new estimate',
      ctaRetry: 'Try again',
      ctaBackHome: 'Back to home',
    },
    UNKNOWN: {
      title: 'Invalid state',
      description: 'Could not determine the state of the estimate. Try again.',
      showNewBudgetCTA: true,
      showRetryCTA: false,
      ctaNewBudget: 'Start new estimate',
      ctaRetry: 'Try again',
      ctaBackHome: 'Back to home',
    },
  },
  'es-ES': {
    NO_COOKIE: {
      title: 'Sesión no encontrada',
      description:
        'Este enlace de reanudación no pertenece a este dispositivo. Inicia un nuevo presupuesto para comenzar.',
      showNewBudgetCTA: true,
      showRetryCTA: false,
      ctaNewBudget: 'Iniciar nuevo presupuesto',
      ctaRetry: 'Intentar de nuevo',
      ctaBackHome: 'Volver al inicio',
    },
    COOKIE_MISMATCH: {
      title: 'Sesión de otro dispositivo',
      description:
        'Este presupuesto fue iniciado en otro dispositivo y no se puede acceder aquí. Inicia un nuevo presupuesto.',
      showNewBudgetCTA: true,
      showRetryCTA: false,
      ctaNewBudget: 'Iniciar nuevo presupuesto',
      ctaRetry: 'Intentar de nuevo',
      ctaBackHome: 'Volver al inicio',
    },
    NOT_FOUND: {
      title: 'Sesión no encontrada',
      description:
        'El presupuesto que intentaste reanudar no existe o fue eliminado. Inicia un nuevo presupuesto.',
      showNewBudgetCTA: true,
      showRetryCTA: false,
      ctaNewBudget: 'Iniciar nuevo presupuesto',
      ctaRetry: 'Intentar de nuevo',
      ctaBackHome: 'Volver al inicio',
    },
    EXPIRED: {
      title: 'Sesión expirada',
      description:
        'Tu presupuesto en progreso expiró después de 7 días de inactividad. Inicia un nuevo presupuesto — solo toma unos minutos.',
      showNewBudgetCTA: true,
      showRetryCTA: false,
      ctaNewBudget: 'Iniciar nuevo presupuesto',
      ctaRetry: 'Intentar de nuevo',
      ctaBackHome: 'Volver al inicio',
    },
    ERROR: {
      title: 'Error al cargar la sesión',
      description:
        'Ocurrió un error al intentar reanudar tu presupuesto. Intenta de nuevo o inicia uno nuevo.',
      showNewBudgetCTA: true,
      showRetryCTA: false,
      ctaNewBudget: 'Iniciar nuevo presupuesto',
      ctaRetry: 'Intentar de nuevo',
      ctaBackHome: 'Volver al inicio',
    },
    NETWORK_ERROR: {
      title: 'Error de conexión',
      description:
        'No se pudo verificar tu presupuesto. Comprueba tu conexión a internet e intenta de nuevo.',
      showNewBudgetCTA: false,
      showRetryCTA: true,
      ctaNewBudget: 'Iniciar nuevo presupuesto',
      ctaRetry: 'Intentar de nuevo',
      ctaBackHome: 'Volver al inicio',
    },
    UNKNOWN: {
      title: 'Estado inválido',
      description: 'No se pudo determinar el estado del presupuesto. Intenta de nuevo.',
      showNewBudgetCTA: true,
      showRetryCTA: false,
      ctaNewBudget: 'Iniciar nuevo presupuesto',
      ctaRetry: 'Intentar de nuevo',
      ctaBackHome: 'Volver al inicio',
    },
  },
  'it-IT': {
    NO_COOKIE: {
      title: 'Sessione non trovata',
      description:
        'Questo link di ripresa non appartiene a questo dispositivo. Inizia un nuovo preventivo per cominciare.',
      showNewBudgetCTA: true,
      showRetryCTA: false,
      ctaNewBudget: 'Inizia un nuovo preventivo',
      ctaRetry: 'Riprova',
      ctaBackHome: 'Torna alla home',
    },
    COOKIE_MISMATCH: {
      title: 'Sessione da un altro dispositivo',
      description:
        'Questo preventivo è stato avviato su un altro dispositivo e non è accessibile qui. Inizia un nuovo preventivo.',
      showNewBudgetCTA: true,
      showRetryCTA: false,
      ctaNewBudget: 'Inizia un nuovo preventivo',
      ctaRetry: 'Riprova',
      ctaBackHome: 'Torna alla home',
    },
    NOT_FOUND: {
      title: 'Sessione non trovata',
      description:
        'Il preventivo che hai tentato di riprendere non esiste o è stato rimosso. Inizia un nuovo preventivo.',
      showNewBudgetCTA: true,
      showRetryCTA: false,
      ctaNewBudget: 'Inizia un nuovo preventivo',
      ctaRetry: 'Riprova',
      ctaBackHome: 'Torna alla home',
    },
    EXPIRED: {
      title: 'Sessione scaduta',
      description:
        'Il tuo preventivo in corso è scaduto dopo 7 giorni di inattività. Inizia un nuovo preventivo — richiede solo pochi minuti.',
      showNewBudgetCTA: true,
      showRetryCTA: false,
      ctaNewBudget: 'Inizia un nuovo preventivo',
      ctaRetry: 'Riprova',
      ctaBackHome: 'Torna alla home',
    },
    ERROR: {
      title: 'Errore nel caricamento della sessione',
      description:
        'Si è verificato un errore nel tentativo di riprendere il tuo preventivo. Riprova o iniziane uno nuovo.',
      showNewBudgetCTA: true,
      showRetryCTA: false,
      ctaNewBudget: 'Inizia un nuovo preventivo',
      ctaRetry: 'Riprova',
      ctaBackHome: 'Torna alla home',
    },
    NETWORK_ERROR: {
      title: 'Errore di connessione',
      description:
        'Impossibile verificare il tuo preventivo. Controlla la connessione internet e riprova.',
      showNewBudgetCTA: false,
      showRetryCTA: true,
      ctaNewBudget: 'Inizia un nuovo preventivo',
      ctaRetry: 'Riprova',
      ctaBackHome: 'Torna alla home',
    },
    UNKNOWN: {
      title: 'Stato non valido',
      description: 'Impossibile determinare lo stato del preventivo. Riprova.',
      showNewBudgetCTA: true,
      showRetryCTA: false,
      ctaNewBudget: 'Inizia un nuovo preventivo',
      ctaRetry: 'Riprova',
      ctaBackHome: 'Torna alla home',
    },
  },
}

const STATE_ICONS: Record<
  ResumeState,
  React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
> = {
  NO_COOKIE: AlertCircle,
  COOKIE_MISMATCH: AlertCircle,
  NOT_FOUND: AlertCircle,
  EXPIRED: Clock,
  ERROR: AlertCircle,
  NETWORK_ERROR: WifiOff,
  UNKNOWN: AlertCircle,
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

type ResumePageContentProps = {
  locale: string
  sessionId: string
  state: ResumeState
}

export function ResumePageContent({ locale, state }: ResumePageContentProps) {
  const router = useRouter()

  const localeMessages = RESUME_MESSAGES[locale] ?? RESUME_MESSAGES['pt-BR']
  const message = localeMessages[state]
  const Icon = STATE_ICONS[state]

  const iconColorClass = cn(
    'h-8 w-8',
    state === 'EXPIRED' && 'text-yellow-500',
    state === 'NETWORK_ERROR' && 'text-blue-500',
    !['EXPIRED', 'NETWORK_ERROR'].includes(state) && 'text-destructive'
  )

  return (
    <div className="flex min-h-screen items-center justify-center bg-(--color-background) px-4 py-8">
      <Card variant="elevated" padding="lg" className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-900">
          <Icon className={iconColorClass} aria-hidden={true} />
        </div>

        {/* Title */}
        <h1 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
          {message.title}
        </h1>

        {/* Description */}
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          {message.description}
        </p>

        {/* CTAs */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          {message.showNewBudgetCTA && (
            <Button
              variant="primary"
              size="md"
              className="w-full sm:w-auto"
              onClick={() => router.push(`/${locale}/flow`)}
            >
              {message.ctaNewBudget}
            </Button>
          )}

          {message.showRetryCTA && (
            <Button
              variant="outline"
              size="md"
              className="w-full sm:w-auto"
              onClick={() => window.location.reload()}
            >
              {message.ctaRetry}
            </Button>
          )}

          <Link
            href={`/${locale}`}
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'md' }),
              'w-full sm:w-auto'
            )}
          >
            {message.ctaBackHome}
          </Link>
        </div>
      </Card>
    </div>
  )
}
