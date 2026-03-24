'use client'

import { useCallback, useSyncExternalStore } from 'react'

/**
 * Hook SSR-safe para media queries.
 * Usa useSyncExternalStore para evitar hydration mismatch.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', callback)
      return () => mql.removeEventListener('change', callback)
    },
    [query]
  )

  const getSnapshot = useCallback(() => {
    return window.matchMedia(query).matches
  }, [query])

  const getServerSnapshot = useCallback(() => false, [])

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/** Dispositivo mobile: max-width 767px */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)')
}

/** Dispositivo tablet: 768px – 1023px */
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
}

/** Desktop: min-width 1024px */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)')
}

/** Preferencia dark mode do SO */
export function usePrefersDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)')
}

/** Preferencia de movimento reduzido */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
