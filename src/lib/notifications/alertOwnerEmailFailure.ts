import 'server-only'
import { resendClient } from '@/lib/resend/client'
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'
import { reportError } from '@/lib/errors'

interface AlertInput {
  leadId: string
  reason: string
}

/**
 * Dispara alerta proativo quando envio de email ao owner falha 3x (DEAD_LETTER).
 *
 * Canais (best-effort, falhas silenciosas — nunca propagam):
 *  1. Sentry (severity=error) via reportError
 *  2. Email backup (OWNER_BACKUP_EMAIL)
 *  3. Slack webhook (SLACK_WEBHOOK_URL)
 *
 * CL-290: pelo menos 1 canal alternativo deve estar configurado em producao.
 */
export async function alertOwnerEmailFailure({ leadId, reason }: AlertInput): Promise<void> {
  const { OWNER_BACKUP_EMAIL, SLACK_WEBHOOK_URL, RESEND_FROM_EMAIL } = env()

  // Canal 1: Sentry — sempre tentar
  reportError(new Error(`Email DEAD_LETTER for lead ${leadId}`), {
    leadId,
    reason,
    severity: 'error',
    kind: 'email_dead_letter',
  })

  // Canal 2: Email backup
  if (OWNER_BACKUP_EMAIL) {
    try {
      await resendClient.emails.send({
        from: RESEND_FROM_EMAIL,
        to: [OWNER_BACKUP_EMAIL],
        subject: '[ALERTA] Email de lead falhou 3x — acao manual',
        text: `Lead ${leadId} entrou em DEAD_LETTER.\n\nMotivo: ${reason}\n\nAcesse o painel admin e filtre por status=DEAD_LETTER para acao manual.`,
      })
    } catch (err) {
      logger.error('alert_backup_email_failed', { leadId, err: String(err) })
    }
  }

  // Canal 3: Slack webhook
  if (SLACK_WEBHOOK_URL) {
    try {
      await fetch(SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          text: `:rotating_light: Lead ${leadId} DEAD_LETTER — ${reason}`,
        }),
      })
    } catch (err) {
      logger.error('alert_slack_webhook_failed', { leadId, err: String(err) })
    }
  }

  logger.warn('lead_dead_letter_alerted', {
    leadId,
    hasBackupEmail: Boolean(OWNER_BACKUP_EMAIL),
    hasSlack: Boolean(SLACK_WEBHOOK_URL),
  })
}
