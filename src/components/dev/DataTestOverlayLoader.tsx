'use client'

import dynamic from 'next/dynamic'

// dynamic() com ssr: false só pode ser chamado em Client Components
const DevDataTestOverlay = dynamic(
  () =>
    import('./DataTestOverlay').then((mod) => mod.DevDataTestOverlay),
  { ssr: false }
)

export function DataTestOverlayLoader() {
  return <DevDataTestOverlay />
}
