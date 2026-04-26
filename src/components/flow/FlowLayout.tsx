'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import { ProgressBar } from '@/components/flow/ProgressBar'
import { StickyActionBar } from '@/components/mobile/StickyActionBar'
import { useProgressEstimate } from '@/lib/flow/useProgressEstimate'

type FlowLayoutProps = {
  children: React.ReactNode
  locale: string
  /** Progresso em % vindo do banco — undefined se ainda não carregado */
  progressPercentage?: number
  /** Quantidade de perguntas já respondidas (questions_answered) */
  questionsAnswered?: number
  /** Tipo do projeto determinado pelo motor de decisão */
  projectType?: string | null
  projectTypes?: string[]
  /** Ação abaixo do conteúdo principal (ex: BackButton) */
  bottomAction?: React.ReactNode
  className?: string
}

export function FlowLayout({
  children,
  locale,
  progressPercentage,
  questionsAnswered,
  projectType,
  projectTypes,
  bottomAction,
  className,
}: FlowLayoutProps) {
  const { estimatedTotal, progressPercent } = useProgressEstimate({
    projectType,
    projectTypes,
    questionsAnswered: questionsAnswered ?? 0,
    sessionProgress: progressPercentage ?? 0,
  })

  const showProgress = progressPercentage !== undefined || questionsAnswered !== undefined

  return (
    <div
      data-testid="page-flow-question"
      className={cn(
        'min-h-screen bg-(--color-background)',
        'flex flex-col',
        className
      )}
    >
      {/* Header + ProgressBar agrupados em um sticky único para evitar layout shift */}
      <div
        data-testid="flow-header-wrapper"
        className="sticky top-0 z-10 border-b border-(--color-border) bg-(--color-background)/95 backdrop-blur"
      >
        <header data-testid="flow-header">
          <div className="flex h-14 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Logo */}
            <Link
              href={`/${locale}`}
              data-testid="flow-header-home-link"
              className="flex shrink-0 items-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary) focus-visible:ring-offset-2"
              aria-label="Budget Free Engine — Voltar ao início"
            >
              <Image
                src="/images/logo.svg"
                alt="Budget Free Engine"
                width={140}
                height={32}
                priority
                style={{ height: 32, width: 'auto' }}
              />
            </Link>

            {/* Locale indicator */}
            <nav aria-label="Seleção de idioma" className="shrink-0">
              <span
                data-testid="flow-header-locale"
                className="text-xs uppercase tracking-wide text-(--color-text-muted)"
              >
                {locale}
              </span>
            </nav>
          </div>
        </header>

        {/* ProgressBar — renderizada dentro do mesmo wrapper sticky */}
        {showProgress && (
          <ProgressBar
            progress={progressPercent}
            questionsAnswered={questionsAnswered ?? 0}
            estimatedTotal={estimatedTotal}
          />
        )}
      </div>

      {/* Área principal */}
      <main data-testid="flow-main" className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>

      {/* Ação inferior (BackButton) — desktop: inline, mobile: StickyActionBar */}
      {bottomAction && (
        <>
          <div data-testid="flow-bottom-action" className="hidden md:block mx-auto w-full max-w-4xl px-4 pb-8 sm:px-6">
            {bottomAction}
          </div>
          <StickyActionBar>
            {bottomAction}
          </StickyActionBar>
        </>
      )}
    </div>
  )
}
