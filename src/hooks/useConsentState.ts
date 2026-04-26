'use client'
import { useEffect, useState } from 'react'
import {
  ConsentPreferences,
  getConsentState,
  setConsentState,
} from '@/lib/cookies/consentState'

export type UseConsentStateResult = {
  state: ConsentPreferences | null
  hydrated: boolean
  accept: (prefs: { analytics: boolean; marketing: boolean }) => void
}

export function useConsentState(): UseConsentStateResult {
  const [state, setState] = useState<ConsentPreferences | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setState(getConsentState())
    setHydrated(true)
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<ConsentPreferences>).detail
      if (detail) setState(detail)
    }
    window.addEventListener('consent-state-changed', onChange)
    return () => window.removeEventListener('consent-state-changed', onChange)
  }, [])

  function accept(prefs: { analytics: boolean; marketing: boolean }) {
    setConsentState(prefs)
    setState({
      essential: true,
      analytics: prefs.analytics,
      marketing: prefs.marketing,
      policyVersion: '',
    })
  }

  return { state, hydrated, accept }
}
