/**
 * CL-245 — Centralized Privacy Policy version.
 *
 * Semver rules:
 *  - MAJOR: breaking changes that require explicit reconsent from all users
 *  - MINOR: material changes that affect current users' rights (soft re-prompt)
 *  - PATCH: clarifications / typos (no re-prompt required)
 *
 * Bumping PRIVACY_POLICY_VERSION invalidates stored consent (see consentState.ts).
 */

export const PRIVACY_POLICY_VERSION = '1.0.0'
export const PRIVACY_POLICY_EFFECTIVE_DATE = '2026-04-23'

export type PolicyChangelogEntry = {
  version: string
  date: string
  summary: string
}

export const PRIVACY_POLICY_CHANGELOG: PolicyChangelogEntry[] = [
  {
    version: '1.0.0',
    date: '2026-04-23',
    summary: 'Versão inicial V1 — LGPD/GDPR compliance para captura de leads e analytics.',
  },
]
