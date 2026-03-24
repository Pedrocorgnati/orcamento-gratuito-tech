'use client'

import { usePageView } from '@/hooks'
import { trackResultViewed } from '@/lib/analytics/events'

interface ResultViewTrackerProps {
  complexity: string
  priceRange: string
  currency: string
}

export function ResultViewTracker({ complexity, priceRange, currency }: ResultViewTrackerProps) {
  usePageView(() => trackResultViewed({ complexity, price_range: priceRange, currency }))
  return null
}
