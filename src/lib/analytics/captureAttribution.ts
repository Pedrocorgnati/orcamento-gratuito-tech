/**
 * CL-250 — Capture UTM parameters + referrer for channel attribution.
 *
 * Pure function: parses a URL and an optional Referer header,
 * returns a sanitized attribution payload ready for DB persistence.
 *
 * Sanitization rules (prevent injection + storage bloat):
 *  - trim to 128 chars
 *  - strip non-printable ASCII
 *  - null if absent
 */

export type Attribution = {
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
  utmTerm?: string | null
  utmContent?: string | null
  referrer?: string | null
}

const MAX_LEN = 128

function sanitize(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const cleaned = trimmed.replace(/[^\x20-\x7E]/g, '').slice(0, MAX_LEN)
  return cleaned || null
}

export function captureAttribution(
  url: URL,
  referer?: string | null
): Attribution {
  const sp = url.searchParams
  return {
    utmSource: sanitize(sp.get('utm_source')),
    utmMedium: sanitize(sp.get('utm_medium')),
    utmCampaign: sanitize(sp.get('utm_campaign')),
    utmTerm: sanitize(sp.get('utm_term')),
    utmContent: sanitize(sp.get('utm_content')),
    referrer: sanitize(referer ?? null),
  }
}

export function hasAttribution(a: Attribution): boolean {
  return Boolean(
    a.utmSource || a.utmMedium || a.utmCampaign || a.utmTerm || a.utmContent || a.referrer
  )
}
