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
  bottomAction,
  className,
}: FlowLayoutProps) {
  const { estimatedTotal, progressPercent } = useProgressEstimate({
    projectType,
    questionsAnswered: questionsAnswered ?? 0,
    sessionProgress: progressPercentage ?? 0,
  })

  const showProgress = progressPercentage !== undefined || questionsAnswered !== undefined

  return (
    <div
      className={cn(
        'min-h-screen bg-(--color-background)',
        'flex flex-col',
        className
      )}
    >
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-(--color-border) bg-(--color-background)/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link
            href={`/${locale}`}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary) focus-visible:ring-offset-2 rounded-sm"
            aria-label="Budget Free Engine — Voltar ao início"
          >
            <Image
              src="/images/logo.svg"
              alt="Budget Free Engine"
              width={140}
              height={32}
              priority
            />
          </Link>

          {/* Locale indicator */}
          <nav aria-label="Seleção de idioma">
            <span className="text-xs uppercase tracking-wide text-(--color-text-muted)">
              {locale}
            </span>
          </nav>
        </div>
      </header>

      {/* ProgressBar inteligente — abaixo do Header */}
      {showProgress && (
        <ProgressBar
          progress={progressPercent}
          questionsAnswered={questionsAnswered ?? 0}
          estimatedTotal={estimatedTotal}
        />
      )}

      {/* Área principal */}
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>

      {/* Ação inferior (BackButton) — desktop: inline, mobile: StickyActionBar */}
      {bottomAction && (
        <>
          <div className="hidden md:block mx-auto w-full max-w-2xl px-4 pb-8 sm:px-6">
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
