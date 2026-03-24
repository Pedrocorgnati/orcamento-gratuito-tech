'use client'

import { usePageView } from '@/hooks'
import { trackLeadCaptureViewed } from '@/lib/analytics/events'

export function LeadCaptureViewTracker() {
  usePageView(trackLeadCaptureViewed)
  return null
}
