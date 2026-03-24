'use client'

import { useCallback, useState } from 'react'

interface UseDisclosureReturn {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

/**
 * Gerencia estado booleano de abertura/fechamento (modais, dropdowns, drawers).
 *
 * @param initialState - Estado inicial (padrão: false)
 *
 * @example
 * const { isOpen, open, close, toggle } = useDisclosure()
 * return <Modal isOpen={isOpen} onClose={close} />
 */
export function useDisclosure(initialState = false): UseDisclosureReturn {
  const [isOpen, setIsOpen] = useState(initialState)

  const open   = useCallback(() => setIsOpen(true), [])
  const close  = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen(prev => !prev), [])

  return { isOpen, open, close, toggle }
}
