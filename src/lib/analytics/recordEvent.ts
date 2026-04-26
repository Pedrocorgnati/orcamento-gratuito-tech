import 'server-only'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export type FlowEventType =
  | 'session_started'
  | 'session_resumed'
  | 'session_abandoned'
  | 'question_answered'
  | 'question_skipped'
  | 'lead_submitted'
  | 'consistency_alert'

/** PII allowlist — somente estes campos podem entrar em meta. */
const ALLOWED_META_KEYS = new Set([
  'project_type',
  'question_code',
  'duration_ms',
  'option_order',
  'alert_type',
  'recurrence_count',
])

function sanitizeMeta(raw: Record<string, unknown> | undefined): Record<string, unknown> | null {
  if (!raw) return null
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(raw)) {
    if (ALLOWED_META_KEYS.has(k)) out[k] = v
  }
  return Object.keys(out).length > 0 ? out : null
}

export interface RecordEventInput {
  sessionId: string
  type: FlowEventType
  block?: string | null
  questionId?: string | null
  meta?: Record<string, unknown>
}

export async function recordEvent(input: RecordEventInput): Promise<void> {
  try {
    await prisma.flowEvent.create({
      data: {
        session_id: input.sessionId,
        event_type: input.type,
        block: input.block ?? null,
        question_id: input.questionId ?? null,
        meta: sanitizeMeta(input.meta) ?? undefined,
      },
    })
  } catch (err) {
    logger.error('record_event_failed', {
      type: input.type,
      error: (err as Error).message,
    })
  }
}

export async function recordConsistencyAlert(
  sessionId: string,
  alertType: string,
  context?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.consistencyAlertLog.create({
      data: {
        session_id: sessionId,
        alert_type: alertType,
        context: sanitizeMeta(context) ?? undefined,
      },
    })
  } catch (err) {
    logger.error('record_consistency_alert_failed', {
      alert_type: alertType,
      error: (err as Error).message,
    })
  }
}
