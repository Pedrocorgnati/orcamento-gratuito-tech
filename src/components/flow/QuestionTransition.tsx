'use client'

import { useEffect, useRef } from 'react'
import { SESSION_STORAGE_KEYS } from '@/lib/constants'

interface QuestionTransitionProps {
  children: React.ReactNode
  /** Direção de navegação — lida de sessionStorage se não fornecida */
  direction?: 'forward' | 'backward'
}

/**
 * Wrapper que aplica animação CSS de slide direction-aware ao montar.
 * Adaptado para arquitetura page-per-question do Next.js:
 * - Anima no MOUNT (cada página é um mount novo)
 * - Lê direction de sessionStorage (default: 'forward')
 * - Usa transform (não left/right) → CLS = 0
 * - prefers-reduced-motion coberto em globals.css + animations.css
 * - Cleanup via clearTimeout (double-click safe)
 */
export function QuestionTransition({
  children,
  direction: directionProp,
}: QuestionTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // Ler direction: prop > sessionStorage > 'forward'
    const dir =
      directionProp ??
      (sessionStorage.getItem(SESSION_STORAGE_KEYS.FLOW_NAV_DIRECTION) as 'forward' | 'backward' | null) ??
      'forward'

    const cls =
      dir === 'backward'
        ? 'animate-slide-in-left'
        : 'animate-slide-in-right'

    // GPU hint durante a animação
    el.style.willChange = 'transform, opacity'
    el.classList.add(cls)

    // Remover classe após animação para permitir re-trigger
    const timer = setTimeout(() => {
      el.classList.remove(cls)
      el.style.willChange = 'auto'
    }, 200)

    return () => {
      clearTimeout(timer)
      el.classList.remove(cls)
      el.style.willChange = 'auto'
    }
  }, [directionProp])

  return (
    <div ref={containerRef}>
      {children}
    </div>
  )
}

/** Helper para armazenar direction antes de navegar */
export function setFlowNavDirection(dir: 'forward' | 'backward') {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(SESSION_STORAGE_KEYS.FLOW_NAV_DIRECTION, dir)
  }
}
