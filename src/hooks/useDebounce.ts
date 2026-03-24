'use client'

import { useState, useEffect } from 'react'

/**
 * Debounce de valor generico.
 * Retorna o valor atualizado somente apos `delay` ms sem mudancas.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

/**
 * Debounce com indicador de status pendente.
 * Util para mostrar loading enquanto o usuario ainda esta digitando.
 * isPending e derivado da comparacao entre valor atual e debouncado.
 */
export function useDebounceWithStatus<T>(
  value: T,
  delay = 300
): { value: T; isPending: boolean } {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return { value: debouncedValue, isPending: value !== debouncedValue }
}
