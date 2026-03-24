import 'server-only'
import { sendLeadNotification } from '@/lib/notifications/sendLeadNotification'
import type { Lead } from '@prisma/client'

/**
 * NotificationService — delega para sendLeadNotification.
 * INVARIANTE: Lead já deve estar persistido no banco antes de chamar sendLeadEmails.
 * Fire-and-forget: falha de email não propaga para o caller.
 */
export class NotificationService {
  async sendLeadEmails(lead: Lead): Promise<void> {
    await sendLeadNotification(lead)
  }
}

export const notificationService = new NotificationService()
