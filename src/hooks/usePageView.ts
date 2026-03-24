'use client'

import { useEffect, useRef } from 'react'

/**
 * Dispara uma função de tracking exatamente uma vez após a montagem do componente.
 * Previne re-disparos em re-renders (Strict Mode, HMR).
 *
 * @param trackFn - Função de analytics a ser chamada uma única vez
 *
 * @example
 * usePageView(() => trackResultViewed({ complexity, priceRange }))
 */
export function usePageView(trackFn: () => void): void {
  const hasTracked = useRef(false)

  useEffect(() => {
    if (!hasTracked.current) {
      hasTracked.current = true
      trackFn()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
