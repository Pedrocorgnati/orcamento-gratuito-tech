import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { AppLocale } from '@/i18n/routing'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type FlowEntryPageProps = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ preselect?: string }>
}

function sanitizePreselect(raw: string | undefined): string | null {
  if (!raw) return null
  const n = Number.parseInt(raw, 10)
  if (!Number.isInteger(n) || n < 1 || n > 11) return null
  return String(n)
}

export default async function FlowEntryPage({
  params,
  searchParams,
}: FlowEntryPageProps) {
  const { locale } = await params
  const { preselect } = await searchParams
  const safeLocale = locale as AppLocale
  await cookies()
  const safePreselect = sanitizePreselect(preselect)
  const qs = new URLSearchParams({ locale: safeLocale })
  if (safePreselect) qs.set('preselect', safePreselect)
  redirect(`/api/v1/flow/bootstrap?${qs.toString()}`)
}
